/**
 * Talking Character / Lip-Sync Provider (v2 — Hardened)
 *
 * Hardened implementation with:
 *  - Input validation before any external call
 *  - HF-FIRST provider ordering when HUGGINGFACE_API_KEY is configured
 *  - Gradio async queue (SSE) — reliable even for slow/sleeping spaces
 *  - ffprobe validation of every output before acceptance
 *  - Structured TALKING_CHARACTER_GENERATION_FAILED error
 *  - No fake success; never returns an image as a video
 *
 * Provider chain (when HUGGINGFACE_API_KEY set):
 *   HF-LatentSync → HF-SadTalker → SyncLabs → D-ID → Replicate-Wav2Lip
 *
 * Provider chain (without HF key):
 *   SyncLabs → D-ID → Replicate-Wav2Lip → HF-LatentSync (public queue — slow)
 *
 * Required env var (existing): HUGGINGFACE_API_KEY
 * Optional extras:             SYNCLABS_API_KEY | DID_API_KEY | REPLICATE_API_TOKEN
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import {
  runWithFallback,
  type FallbackProvider,
  AllProvidersFailedError,
  type ProviderAttemptLog
} from './providerFallback.js';

export { AllProvidersFailedError };

const execAsync = promisify(exec);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TalkingCharacterOptions {
  /** URL or local path of the character portrait image */
  characterImageUrl: string;
  /** URL, data URI, or local path of the synthesized voice audio */
  audioUrl: string;
  /** Approximate expected duration in seconds (hint for providers) */
  durationSeconds?: number;
}

export interface TalkingCharacterResult {
  /** Public or file:// URL of the generated talking-character video */
  videoUrl: string;
  /** Absolute local file path — always populated; pass directly to FFmpeg */
  localPath: string;
  providerUsed: string;
  durationSeconds: number;
  fileSizeBytes: number;
}

export interface TalkingCharacterValidation {
  valid: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  duration: number;
  fileSizeBytes: number;
  error?: string;
}

export interface TalkingCharacterInputValidation {
  valid: boolean;
  errors: string[];
}

/** Structured failure — thrown when the caller wraps AllProvidersFailedError */
export interface TalkingCharacterFailure {
  code: 'TALKING_CHARACTER_GENERATION_FAILED';
  message: string;
  providerAttempts: ProviderAttemptLog[];
  blockers: string[];
}

// ── Input validation ──────────────────────────────────────────────────────────

/**
 * Validate talking-character inputs before calling any external provider.
 * Returns { valid, errors } — never throws.
 */
export async function validateTalkingCharacterInputs(
  options: TalkingCharacterOptions
): Promise<TalkingCharacterInputValidation> {
  const errors: string[] = [];

  // Image URL checks
  if (!options.characterImageUrl || options.characterImageUrl.trim() === '') {
    errors.push('characterImageUrl is empty or missing');
  } else if (
    !options.characterImageUrl.startsWith('http://') &&
    !options.characterImageUrl.startsWith('https://') &&
    !options.characterImageUrl.startsWith('data:') &&
    !options.characterImageUrl.startsWith('/') &&
    !options.characterImageUrl.startsWith('file://')
  ) {
    errors.push(`characterImageUrl has unsupported scheme: ${options.characterImageUrl.substring(0, 60)}`);
  } else if (
    options.characterImageUrl.startsWith('/') ||
    options.characterImageUrl.startsWith('file://')
  ) {
    const imgPath = options.characterImageUrl.startsWith('file://')
      ? options.characterImageUrl.slice(7)
      : options.characterImageUrl;
    if (!fs.existsSync(imgPath)) {
      errors.push(`characterImageUrl local file does not exist: ${imgPath}`);
    }
  }

  // Audio URL checks
  if (!options.audioUrl || options.audioUrl.trim() === '') {
    errors.push('audioUrl is empty or missing');
  } else if (
    options.audioUrl.startsWith('/') ||
    options.audioUrl.startsWith('file://')
  ) {
    const audPath = options.audioUrl.startsWith('file://')
      ? options.audioUrl.slice(7)
      : options.audioUrl;
    if (!fs.existsSync(audPath)) {
      errors.push(`audioUrl local file does not exist: ${audPath}`);
    } else {
      // Validate audio stream using ffprobe
      try {
        const { stdout } = await execAsync(
          `ffprobe -v error -select_streams a:0 -show_entries stream=channels -of csv=p=0 "${audPath}"`,
          { timeout: 8000, maxBuffer: 64 * 1024 }
        );
        const channels = parseInt(stdout.trim() || '0', 10);
        if (channels <= 0) {
          errors.push(`audioUrl local file has no valid audio stream (channels=${channels}): ${audPath}`);
        }
      } catch (e: any) {
        errors.push(`audioUrl local file failed ffprobe check: ${e?.message || String(e)}`);
      }
    }
  } else if (options.audioUrl.startsWith('data:')) {
    const commaIdx = options.audioUrl.indexOf(',');
    if (commaIdx < 0 || options.audioUrl.length - commaIdx < 10) {
      errors.push('audioUrl is a data URI but payload appears empty');
    }
  } else if (
    !options.audioUrl.startsWith('http://') &&
    !options.audioUrl.startsWith('https://')
  ) {
    errors.push(`audioUrl has unsupported scheme: ${options.audioUrl.substring(0, 60)}`);
  }

  return { valid: errors.length === 0, errors };
}

// ── Output validation ─────────────────────────────────────────────────────────

/**
 * Validate a talking-character video with ffprobe.
 * Returns { valid, hasVideo, hasAudio, duration, fileSizeBytes, error? }.
 * Never throws.
 */
export async function validateTalkingCharacterVideo(
  filePath: string
): Promise<TalkingCharacterValidation> {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, hasVideo: false, hasAudio: false, duration: 0, fileSizeBytes: 0, error: 'File does not exist' };
    }
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return { valid: false, hasVideo: false, hasAudio: false, duration: 0, fileSizeBytes: 0, error: 'File is empty (0 bytes)' };
    }
    if (stats.size < 1024) {
      return { valid: false, hasVideo: false, hasAudio: false, duration: 0, fileSizeBytes: stats.size, error: `File too small (${stats.size} bytes) — likely corrupt` };
    }
    const { stdout } = await execAsync(
      `ffprobe -v error -show_streams -of json "${filePath}"`,
      { timeout: 15000, maxBuffer: 2 * 1024 * 1024 }
    );
    const probe = JSON.parse(stdout) as { streams?: { codec_type: string; duration?: string }[] };
    const streams = probe.streams || [];
    const hasVideo = streams.some(s => s.codec_type === 'video');
    const hasAudio = streams.some(s => s.codec_type === 'audio');
    const duration = parseFloat(streams.find(s => s.codec_type === 'video')?.duration || '0');
    if (!hasVideo) {
      return { valid: false, hasVideo, hasAudio, duration, fileSizeBytes: stats.size, error: 'No video stream found' };
    }
    if (duration <= 0) {
      return { valid: false, hasVideo, hasAudio, duration, fileSizeBytes: stats.size, error: `Invalid video duration: ${duration}s` };
    }
    return { valid: true, hasVideo, hasAudio, duration, fileSizeBytes: stats.size };
  } catch (err: any) {
    return {
      valid: false, hasVideo: false, hasAudio: false, duration: 0, fileSizeBytes: 0,
      error: `ffprobe failed: ${err?.message || String(err)}`
    };
  }
}

// ── File helpers ──────────────────────────────────────────────────────────────

/** Download a URL, data URI, or local path to a local file */
async function downloadToFile(url: string, destPath: string, timeoutMs = 60000): Promise<void> {
  if (url.startsWith('data:')) {
    const commaIdx = url.indexOf(',');
    if (commaIdx < 0) throw new Error('Invalid data URI — no comma separator');
    const buf = Buffer.from(url.substring(commaIdx + 1), 'base64');
    if (buf.length === 0) throw new Error('data URI payload is empty');
    fs.writeFileSync(destPath, buf);
    return;
  }
  if (url.startsWith('/') || url.startsWith('file://')) {
    const srcPath = url.startsWith('file://') ? url.slice(7) : url;
    fs.copyFileSync(srcPath, destPath);
    return;
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 VirJoy/2.0' },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) throw new Error(`Download HTTP ${res.status} from ${url.substring(0, 80)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error(`Empty response body from ${url.substring(0, 80)}`);
  fs.writeFileSync(destPath, buf);
}

/** Poll a GET endpoint until completion or timeout */
async function pollUntil<T>(
  getUrl: string,
  headers: Record<string, string>,
  isComplete: (body: T) => boolean,
  extractResult: (body: T) => string,
  pollIntervalMs: number,
  maxWaitMs: number
): Promise<string> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const res = await fetch(getUrl, { headers, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`Poll HTTP ${res.status} from ${getUrl.substring(0, 80)}`);
    const body = (await res.json()) as T;
    if (isComplete(body)) return extractResult(body);
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise(r => setTimeout(r, Math.min(pollIntervalMs, remaining)));
  }
  throw new Error(`Polling timed out after ${maxWaitMs}ms`);
}

// ── Gradio helpers ────────────────────────────────────────────────────────────

/**
 * Upload a file to a Gradio space's /upload endpoint.
 * Returns the server-side file path that can be referenced in queue/join data.
 * Falls back gracefully if the endpoint is not supported.
 */
async function uploadFileToGradio(
  spaceBaseUrl: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  hfKey: string | undefined
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {};
    if (hfKey) headers['Authorization'] = `Bearer ${hfKey}`;

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('files', blob, fileName);

    const res = await fetch(`${spaceBaseUrl}/upload`, {
      method: 'POST',
      headers,
      body: formData,
      signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) return null;  // Upload not supported — fall back to base64
    const result = (await res.json()) as string[];
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  } catch {
    return null;  // Network failure — fall back to base64
  }
}

/**
 * Read SSE events from a Gradio /queue/data endpoint until process_completed.
 * Returns the output data array.
 */
async function readGradioSSE(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`Gradio SSE timed out after ${timeoutMs}ms`)),
    timeoutMs
  );
  try {
    const res = await fetch(url, { headers: { ...headers, 'Accept': 'text/event-stream' }, signal: controller.signal });
    if (!res.ok) throw new Error(`Gradio queue/data HTTP ${res.status}`);
    if (!res.body) throw new Error('Gradio SSE: no response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          let event: { msg?: string; output?: { data?: any[] }; error?: string };
          try { event = JSON.parse(jsonStr); } catch { continue; }

          if (event.msg === 'process_completed') {
            if (event.error) throw new Error(`Gradio error: ${event.error}`);
            const outData = event.output?.data;
            if (!outData || !Array.isArray(outData)) throw new Error('Gradio: completed but output.data is missing');
            return outData;
          }
          if (event.msg === 'queue_full') throw new Error('Gradio: queue is full — retry later');
          // process_starts, estimation, send_hash — continue reading
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }
    throw new Error('Gradio SSE stream ended without process_completed event');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call a Gradio space via the async queue (SSE).
 * Strategy:
 *   1. Try to upload files with /upload (Gradio 4) and reference by path
 *   2. Fall back to base64 data URIs (Gradio 3) if upload fails
 *   3. Join the queue, then read SSE events
 */
async function callGradioSpaceQueue(
  spaceBaseUrl: string,
  fnIndex: number,
  localFiles: Array<{ path: string; name: string; mimeType: string }>,
  extraParams: any[],
  hfKey: string | undefined,
  timeoutMs: number
): Promise<any[]> {
  const sessionHash = Math.random().toString(36).slice(2, 12);
  const queueHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (hfKey) queueHeaders['Authorization'] = `Bearer ${hfKey}`;

  // Try to upload files to get server-side paths (Gradio 4 style)
  const uploadedPaths: Array<string | null> = await Promise.all(
    localFiles.map(f => {
      const buf = fs.readFileSync(f.path);
      return uploadFileToGradio(spaceBaseUrl, buf, f.name, f.mimeType, hfKey);
    })
  );

  // Build input data: use uploaded paths when available, base64 otherwise
  const inputData: any[] = localFiles.map((f, i) => {
    if (uploadedPaths[i]) {
      // Gradio 4: reference by server path
      return { path: uploadedPaths[i], orig_name: f.name };
    }
    // Gradio 3: base64 data URI
    const buf = fs.readFileSync(f.path);
    const ext = path.extname(f.name).slice(1) || 'bin';
    const mime = f.mimeType;
    return { data: `data:${mime};base64,${buf.toString('base64')}`, name: f.name, orig_name: f.name, is_file: false };
  });
  inputData.push(...extraParams);

  // Join the queue
  const joinRes = await fetch(`${spaceBaseUrl}/queue/join`, {
    method: 'POST',
    headers: queueHeaders,
    body: JSON.stringify({ data: inputData, fn_index: fnIndex, session_hash: sessionHash, trigger_id: 0 }),
    signal: AbortSignal.timeout(30000)
  });
  if (!joinRes.ok) {
    const errText = await joinRes.text().catch(() => '');
    throw new Error(`Gradio queue/join HTTP ${joinRes.status}: ${errText.substring(0, 200)}`);
  }

  // Read SSE events
  const sseHeaders: Record<string, string> = {};
  if (hfKey) sseHeaders['Authorization'] = `Bearer ${hfKey}`;
  return readGradioSSE(
    `${spaceBaseUrl}/queue/data?session_hash=${sessionHash}`,
    sseHeaders,
    timeoutMs
  );
}

/**
 * Extract and save the video output from Gradio's output data array.
 * Handles: base64 data URI, space-hosted file path, or direct URL.
 */
async function saveGradioVideoOutput(
  outputData: any[],
  spaceBaseUrl: string,
  destPath: string,
  hfKey: string | undefined
): Promise<void> {
  const outputItem = outputData[0];
  if (!outputItem) throw new Error('Gradio: output array is empty');

  if (typeof outputItem === 'string') {
    // Could be a URL or base64 string
    if (outputItem.startsWith('http://') || outputItem.startsWith('https://')) {
      await downloadToFile(outputItem, destPath, 90000);
    } else if (outputItem.startsWith('data:')) {
      await downloadToFile(outputItem, destPath);
    } else {
      throw new Error(`Gradio: unexpected string output: ${outputItem.substring(0, 80)}`);
    }
    return;
  }

  if (typeof outputItem === 'object' && outputItem !== null) {
    const item = outputItem as { data?: string; name?: string; path?: string; url?: string };

    // Gradio 4 file reference — path is a server-side temp path
    if (item.url) {
      await downloadToFile(item.url, destPath, 90000);
      return;
    }
    if (item.path) {
      const fileUrl = `${spaceBaseUrl}/file=${item.path}`;
      const dlHeaders: Record<string, string> = {};
      if (hfKey) dlHeaders['Authorization'] = `Bearer ${hfKey}`;
      const dlRes = await fetch(fileUrl, { headers: dlHeaders, signal: AbortSignal.timeout(90000) });
      if (!dlRes.ok) throw new Error(`Gradio file download HTTP ${dlRes.status} for ${item.path}`);
      fs.writeFileSync(destPath, Buffer.from(await dlRes.arrayBuffer()));
      return;
    }

    // Gradio 3 style — base64 data
    if (item.data) {
      if (item.data.startsWith('data:')) {
        await downloadToFile(item.data, destPath);
        return;
      }
      // Raw base64 without MIME prefix
      const buf = Buffer.from(item.data, 'base64');
      if (buf.length === 0) throw new Error('Gradio: base64 payload is empty');
      fs.writeFileSync(destPath, buf);
      return;
    }

    // Gradio 3 style — file name hosted on space
    if (item.name) {
      const fileUrl = `${spaceBaseUrl}/file=${item.name}`;
      const dlHeaders: Record<string, string> = {};
      if (hfKey) dlHeaders['Authorization'] = `Bearer ${hfKey}`;
      const dlRes = await fetch(fileUrl, { headers: dlHeaders, signal: AbortSignal.timeout(90000) });
      if (!dlRes.ok) throw new Error(`Gradio file download HTTP ${dlRes.status} for ${item.name}`);
      fs.writeFileSync(destPath, Buffer.from(await dlRes.arrayBuffer()));
      return;
    }
  }

  throw new Error(`Gradio: unrecognized output format — type=${typeof outputItem}`);
}

// ── HF providers (primary chain when HUGGINGFACE_API_KEY is set) ──────────────

/**
 * HF-LatentSync — fffiloni/LatentSync Gradio space
 * Inputs: portrait image, audio, inference_steps (int)
 */
async function runHFLatentSync(
  options: TalkingCharacterOptions,
  workDir: string
): Promise<TalkingCharacterResult> {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const SPACE_URL = 'https://fffiloni-latentsync.hf.space';

  console.info('[TalkingChar] HF-LatentSync: preparing inputs...');
  const imageLocalPath = path.join(workDir, `ls_img_${Date.now()}.jpg`);
  const audioLocalPath = path.join(workDir, `ls_audio_${Date.now()}.wav`);
  await downloadToFile(options.characterImageUrl, imageLocalPath, 30000);
  await downloadToFile(options.audioUrl, audioLocalPath, 30000);

  const localVideoPath = path.join(workDir, `hf_latentsync_${Date.now()}.mp4`);

  console.info('[TalkingChar] HF-LatentSync: joining queue...');
  const outputData = await callGradioSpaceQueue(
    SPACE_URL,
    0,  // fn_index: primary inference function
    [
      { path: imageLocalPath, name: 'portrait.jpg', mimeType: 'image/jpeg' },
      { path: audioLocalPath, name: 'speech.wav',   mimeType: 'audio/wav'  }
    ],
    [25],  // inference_steps
    hfKey,
    240_000  // 4 minutes — LatentSync is heavy
  );

  console.info('[TalkingChar] HF-LatentSync: saving output video...');
  await saveGradioVideoOutput(outputData, SPACE_URL, localVideoPath, hfKey);

  console.info('[TalkingChar] HF-LatentSync: validating output...');
  const validation = await validateTalkingCharacterVideo(localVideoPath);
  if (!validation.valid) throw new Error(`HF-LatentSync output failed validation: ${validation.error}`);

  return {
    videoUrl: `file://${localVideoPath}`,
    localPath: localVideoPath,
    providerUsed: 'HF-LatentSync',
    durationSeconds: validation.duration,
    fileSizeBytes: validation.fileSizeBytes
  };
}

/**
 * HF-SadTalker — vinthony/SadTalker Gradio space
 * Inputs: portrait image, driven audio, preprocess, still_mode, use_enhancer
 */
async function runHFSadTalker(
  options: TalkingCharacterOptions,
  workDir: string
): Promise<TalkingCharacterResult> {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const SPACE_URL = 'https://vinthony-sadtalker.hf.space';

  console.info('[TalkingChar] HF-SadTalker: preparing inputs...');
  const imageLocalPath = path.join(workDir, `st_img_${Date.now()}.jpg`);
  const audioLocalPath = path.join(workDir, `st_audio_${Date.now()}.wav`);
  await downloadToFile(options.characterImageUrl, imageLocalPath, 30000);
  await downloadToFile(options.audioUrl, audioLocalPath, 30000);

  const localVideoPath = path.join(workDir, `hf_sadtalker_${Date.now()}.mp4`);

  console.info('[TalkingChar] HF-SadTalker: joining queue...');
  const outputData = await callGradioSpaceQueue(
    SPACE_URL,
    0,  // fn_index: primary inference function
    [
      { path: imageLocalPath, name: 'portrait.jpg', mimeType: 'image/jpeg' },
      { path: audioLocalPath, name: 'speech.wav',   mimeType: 'audio/wav'  }
    ],
    ['crop', false, false],  // preprocess, still_mode, use_enhancer
    hfKey,
    240_000
  );

  console.info('[TalkingChar] HF-SadTalker: saving output video...');
  await saveGradioVideoOutput(outputData, SPACE_URL, localVideoPath, hfKey);

  console.info('[TalkingChar] HF-SadTalker: validating output...');
  const validation = await validateTalkingCharacterVideo(localVideoPath);
  if (!validation.valid) throw new Error(`HF-SadTalker output failed validation: ${validation.error}`);

  return {
    videoUrl: `file://${localVideoPath}`,
    localPath: localVideoPath,
    providerUsed: 'HF-SadTalker',
    durationSeconds: validation.duration,
    fileSizeBytes: validation.fileSizeBytes
  };
}

// ── Commercial providers (fallback when HF providers fail) ─────────────────────

/** SyncLabs — https://api.sync.so/v2/generate */
async function runSyncLabs(
  options: TalkingCharacterOptions,
  workDir: string
): Promise<TalkingCharacterResult> {
  const apiKey = process.env.SYNCLABS_API_KEY;
  if (!apiKey) throw new Error('SYNCLABS_API_KEY not configured');

  const createRes = await fetch('https://api.sync.so/v2/generate', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sync-1.6.0',
      input: [
        { type: 'video', url: options.characterImageUrl },
        { type: 'audio', url: options.audioUrl }
      ],
      options: { output_format: 'mp4' }
    }),
    signal: AbortSignal.timeout(30000)
  });
  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`SyncLabs create HTTP ${createRes.status}: ${errText.substring(0, 200)}`);
  }
  const created = (await createRes.json()) as { id?: string };
  if (!created.id) throw new Error('SyncLabs: no job ID in response');

  interface SyncStatus { status: string; outputUrl?: string; error?: string }
  const outputUrl = await pollUntil<SyncStatus>(
    `https://api.sync.so/v2/generate/${created.id}`,
    { 'x-api-key': apiKey },
    b => b.status === 'completed' || b.status === 'failed',
    b => {
      if (b.status === 'failed') throw new Error(`SyncLabs job failed: ${b.error || 'unknown'}`);
      if (!b.outputUrl) throw new Error('SyncLabs: completed but outputUrl missing');
      return b.outputUrl;
    },
    3000, 120000
  );

  const localPath = path.join(workDir, `synclabs_${Date.now()}.mp4`);
  await downloadToFile(outputUrl, localPath, 60000);
  const validation = await validateTalkingCharacterVideo(localPath);
  if (!validation.valid) throw new Error(`SyncLabs output invalid: ${validation.error}`);

  return { videoUrl: outputUrl, localPath, providerUsed: 'SyncLabs', durationSeconds: validation.duration, fileSizeBytes: validation.fileSizeBytes };
}

/** D-ID — https://api.d-id.com/talks */
async function runDID(
  options: TalkingCharacterOptions,
  workDir: string
): Promise<TalkingCharacterResult> {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) throw new Error('DID_API_KEY not configured');

  const basicAuth = Buffer.from(`${apiKey}:`).toString('base64');
  const authHeader = `Basic ${basicAuth}`;

  const createRes = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ source_url: options.characterImageUrl, script: { type: 'audio', audio_url: options.audioUrl } }),
    signal: AbortSignal.timeout(30000)
  });
  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`D-ID create HTTP ${createRes.status}: ${errText.substring(0, 200)}`);
  }
  const created = (await createRes.json()) as { id?: string };
  if (!created.id) throw new Error('D-ID: no job ID in response');

  interface DIDStatus { status: string; result_url?: string; error?: { description?: string } }
  const resultUrl = await pollUntil<DIDStatus>(
    `https://api.d-id.com/talks/${created.id}`,
    { 'Authorization': authHeader, 'Accept': 'application/json' },
    b => b.status === 'done' || b.status === 'error',
    b => {
      if (b.status === 'error') throw new Error(`D-ID job failed: ${b.error?.description || 'unknown'}`);
      if (!b.result_url) throw new Error('D-ID: done but result_url missing');
      return b.result_url;
    },
    4000, 120000
  );

  const localPath = path.join(workDir, `did_${Date.now()}.mp4`);
  await downloadToFile(resultUrl, localPath, 60000);
  const validation = await validateTalkingCharacterVideo(localPath);
  if (!validation.valid) throw new Error(`D-ID output invalid: ${validation.error}`);

  return { videoUrl: resultUrl, localPath, providerUsed: 'D-ID', durationSeconds: validation.duration, fileSizeBytes: validation.fileSizeBytes };
}

/** Replicate — cog-wav2lip */
async function runReplicate(
  options: TalkingCharacterOptions,
  workDir: string
): Promise<TalkingCharacterResult> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) throw new Error('REPLICATE_API_TOKEN not configured');

  const MODEL_VERSION = '8d65e3f4f4298520e079198b493c25adfc43c058839803659f0e8947474dc04f';

  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { 'Authorization': `Token ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: MODEL_VERSION, input: { face: options.characterImageUrl, audio: options.audioUrl } }),
    signal: AbortSignal.timeout(30000)
  });
  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`Replicate create HTTP ${createRes.status}: ${errText.substring(0, 200)}`);
  }
  const created = (await createRes.json()) as { id?: string; urls?: { get?: string } };
  if (!created.id) throw new Error('Replicate: no prediction ID in response');

  const pollUrl = created.urls?.get || `https://api.replicate.com/v1/predictions/${created.id}`;

  interface ReplicateStatus { status: string; output?: string | string[] | null; error?: string | null }
  const outputUrl = await pollUntil<ReplicateStatus>(
    pollUrl,
    { 'Authorization': `Token ${apiToken}` },
    b => b.status === 'succeeded' || b.status === 'failed' || b.status === 'canceled',
    b => {
      if (b.status !== 'succeeded') throw new Error(`Replicate ${b.status}: ${b.error || 'no detail'}`);
      const out = b.output;
      if (!out) throw new Error('Replicate: succeeded but output is null');
      return Array.isArray(out) ? out[0] : String(out);
    },
    5000, 180000
  );

  const localPath = path.join(workDir, `replicate_${Date.now()}.mp4`);
  await downloadToFile(outputUrl, localPath, 60000);
  const validation = await validateTalkingCharacterVideo(localPath);
  if (!validation.valid) throw new Error(`Replicate output invalid: ${validation.error}`);

  return { videoUrl: outputUrl, localPath, providerUsed: 'Replicate-Wav2Lip', durationSeconds: validation.duration, fileSizeBytes: validation.fileSizeBytes };
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Generate a talking-character video with automatic provider fallback.
 *
 * Chain order when HUGGINGFACE_API_KEY is set:
 *   HF-LatentSync → HF-SadTalker → SyncLabs → D-ID → Replicate-Wav2Lip
 *
 * Chain order when HUGGINGFACE_API_KEY is NOT set:
 *   SyncLabs → D-ID → Replicate-Wav2Lip → HF-LatentSync (public queue)
 *
 * @throws AllProvidersFailedError if every provider fails
 * @throws Error if input validation fails (before any external call)
 */
export async function generateTalkingCharacterWithFallback(
  options: TalkingCharacterOptions,
  tmpDir?: string
): Promise<TalkingCharacterResult> {
  // Step 1: validate inputs before touching any external service
  const inputValidation = await validateTalkingCharacterInputs(options);
  if (!inputValidation.valid) {
    throw new Error(
      `[TalkingChar] Input validation failed — ${inputValidation.errors.join('; ')}`
    );
  }

  const ownDir = !tmpDir;
  const workDir = tmpDir || path.join(
    process.cwd(),
    `tmp_tc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  );
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  const hfKey = process.env.HUGGINGFACE_API_KEY;

  type R = TalkingCharacterResult;
  const chain: FallbackProvider<R>[] = [];

  if (hfKey) {
    // HF-FIRST: both HF providers go before any commercial provider
    chain.push({ name: 'HF-LatentSync', timeoutMs: 260_000, run: () => runHFLatentSync(options, workDir) });
    chain.push({ name: 'HF-SadTalker',  timeoutMs: 260_000, run: () => runHFSadTalker(options, workDir) });
  }

  // Commercial providers — only added when their API key is configured
  if (process.env.SYNCLABS_API_KEY)    chain.push({ name: 'SyncLabs',         timeoutMs: 150_000, run: () => runSyncLabs(options, workDir) });
  if (process.env.DID_API_KEY)         chain.push({ name: 'D-ID',             timeoutMs: 150_000, run: () => runDID(options, workDir) });
  if (process.env.REPLICATE_API_TOKEN) chain.push({ name: 'Replicate-Wav2Lip', timeoutMs: 210_000, run: () => runReplicate(options, workDir) });

  // If HF key absent, HF-LatentSync goes last (public queue — slow but always present)
  if (!hfKey) {
    chain.push({ name: 'HF-LatentSync', timeoutMs: 260_000, run: () => runHFLatentSync(options, workDir) });
  }

  try {
    const { result } = await runWithFallback<R>('talking-character', chain, 150_000);
    return result;
  } catch (err) {
    if (ownDir) {
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
    }
    throw err;
  }
}

// ── Status & diagnostics ──────────────────────────────────────────────────────

export interface TalkingCharacterProviderStatus {
  fallbackOrder: string[];
  configuredProviders: string[];
  unconfiguredProviders: string[];
  guaranteedFallback: string;
  requiredEnvVars: Record<string, boolean>;
  hfFirst: boolean;
  note: string;
}

export function getTalkingCharacterProviderStatus(): TalkingCharacterProviderStatus {
  const hfKeyOk      = !!process.env.HUGGINGFACE_API_KEY;
  const syncLabsOk   = !!process.env.SYNCLABS_API_KEY;
  const didOk        = !!process.env.DID_API_KEY;
  const replicateOk  = !!process.env.REPLICATE_API_TOKEN;

  // Build actual chain order (mirrors generateTalkingCharacterWithFallback logic)
  const order: string[] = [];
  if (hfKeyOk) { order.push('HF-LatentSync', 'HF-SadTalker'); }
  if (syncLabsOk)   order.push('SyncLabs');
  if (didOk)        order.push('D-ID');
  if (replicateOk)  order.push('Replicate-Wav2Lip');
  if (!hfKeyOk)     order.push('HF-LatentSync');

  const configured: string[] = [];
  const unconfigured: string[] = [];

  if (hfKeyOk) { configured.push('HF-LatentSync', 'HF-SadTalker'); }
  else unconfigured.push('HF-LatentSync', 'HF-SadTalker');
  if (syncLabsOk)  configured.push('SyncLabs');   else unconfigured.push('SyncLabs');
  if (didOk)       configured.push('D-ID');         else unconfigured.push('D-ID');
  if (replicateOk) configured.push('Replicate-Wav2Lip'); else unconfigured.push('Replicate-Wav2Lip');

  const note = hfKeyOk
    ? 'HF credential configured — HF-LatentSync and HF-SadTalker are the primary providers.'
    : 'HUGGINGFACE_API_KEY not set — HF-LatentSync falls back to the public Gradio queue (slow). Configure this key for best results.';

  return {
    fallbackOrder: order,
    configuredProviders: configured,
    unconfiguredProviders: unconfigured,
    guaranteedFallback: 'HF-LatentSync',
    requiredEnvVars: {
      HUGGINGFACE_API_KEY:  hfKeyOk,
      SYNCLABS_API_KEY:     syncLabsOk,
      DID_API_KEY:          didOk,
      REPLICATE_API_TOKEN:  replicateOk
    },
    hfFirst: hfKeyOk,
    note
  };
}

/** Check whether required local binaries are available */
export async function checkBinaryAvailability(): Promise<{ ffmpeg: boolean; ffprobe: boolean }> {
  const check = async (cmd: string): Promise<boolean> => {
    try { await execAsync(`${cmd} -version`, { timeout: 5000 }); return true; }
    catch { return false; }
  };
  const [ffmpeg, ffprobe] = await Promise.all([check('ffmpeg'), check('ffprobe')]);
  return { ffmpeg, ffprobe };
}
