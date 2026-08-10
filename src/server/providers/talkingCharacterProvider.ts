/**
 * Talking Character / Lip-Sync Provider
 *
 * Generates real facial/mouth animation synchronized with voice audio.
 * Accepts a character image + audio URL; returns a validated MP4 video.
 *
 * Provider fallback chain:
 *   SyncLabs  (SYNCLABS_API_KEY)
 *   → D-ID    (DID_API_KEY)
 *   → Replicate wav2lip  (REPLICATE_API_TOKEN)
 *   → HF LatentSync Gradio space (HUGGINGFACE_API_KEY — optional, speeds up queue)
 *
 * No fake last-resort: if all providers fail, AllProvidersFailedError is thrown.
 *
 * IMPORTANT: Never returns the original character image as a video.
 *            Every result is validated with ffprobe before being returned.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import {
  runWithFallback,
  type FallbackProvider,
  AllProvidersFailedError
} from './providerFallback.js';

export { AllProvidersFailedError };

const execAsync = promisify(exec);

// ── Public types ──────────────────────────────────────────────────────────────

export interface TalkingCharacterOptions {
  /** URL of the character portrait image (HTTPS, JPEG/PNG) */
  characterImageUrl: string;
  /** URL of the synthesized voice audio (HTTPS or data URI) */
  audioUrl: string;
  /** Approximate expected duration in seconds (informational hint for providers) */
  durationSeconds?: number;
}

export interface TalkingCharacterResult {
  /** Public or file:// URL of the generated talking-character video */
  videoUrl: string;
  /** Absolute local file path — always populated; use for FFmpeg composition */
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

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate a talking-character video with ffprobe.
 * Checks: file exists, size > 0, MP4 readable, video stream, audio stream, duration > 0.
 * Never throws; returns valid:false on any probe failure.
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
      return { valid: false, hasVideo: false, hasAudio: false, duration: 0, fileSizeBytes: stats.size, error: 'File is empty (0 bytes)' };
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
    return { valid: false, hasVideo: false, hasAudio: false, duration: 0, fileSizeBytes: 0, error: `ffprobe failed: ${err?.message || String(err)}` };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Download a URL or data URI to a local file */
async function downloadToFile(url: string, destPath: string, timeoutMs = 60000): Promise<void> {
  if (url.startsWith('data:')) {
    const commaIdx = url.indexOf(',');
    if (commaIdx < 0) throw new Error('Invalid data URI — no comma separator');
    const base64 = url.substring(commaIdx + 1);
    const buf = Buffer.from(base64, 'base64');
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
    headers: { 'User-Agent': 'Mozilla/5.0 VirJoy/1.0' },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) throw new Error(`Download HTTP ${res.status} from ${url.substring(0, 80)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error(`Empty response body from ${url.substring(0, 80)}`);
  fs.writeFileSync(destPath, buf);
}

/** Poll a GET endpoint until a completion condition is met or timeout */
async function pollUntil<T>(
  getUrl: string,
  headers: Record<string, string>,
  isComplete: (body: T) => boolean,
  extractResult: (body: T) => string,   // should throw on job failure
  pollIntervalMs: number,
  maxWaitMs: number
): Promise<string> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const res = await fetch(getUrl, {
      headers,
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error(`Poll HTTP ${res.status} from ${getUrl.substring(0, 80)}`);
    const body = (await res.json()) as T;
    if (isComplete(body)) {
      return extractResult(body);  // extractResult may throw — error propagates naturally
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise(r => setTimeout(r, Math.min(pollIntervalMs, remaining)));
  }
  throw new Error(`Polling timed out after ${maxWaitMs}ms waiting for ${getUrl.substring(0, 80)}`);
}

// ── Provider implementations ──────────────────────────────────────────────────

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
      if (b.status === 'failed') throw new Error(`SyncLabs job failed: ${b.error || 'unknown error'}`);
      if (!b.outputUrl) throw new Error('SyncLabs: completed but outputUrl is missing');
      return b.outputUrl;
    },
    3000,
    120000
  );

  const localPath = path.join(workDir, `synclabs_${Date.now()}.mp4`);
  await downloadToFile(outputUrl, localPath, 60000);

  const validation = await validateTalkingCharacterVideo(localPath);
  if (!validation.valid) throw new Error(`SyncLabs output invalid: ${validation.error}`);

  return {
    videoUrl: outputUrl,
    localPath,
    providerUsed: 'SyncLabs',
    durationSeconds: validation.duration,
    fileSizeBytes: validation.fileSizeBytes
  };
}

/** D-ID — https://api.d-id.com/talks */
async function runDID(
  options: TalkingCharacterOptions,
  workDir: string
): Promise<TalkingCharacterResult> {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) throw new Error('DID_API_KEY not configured');

  // D-ID uses HTTP Basic auth: base64("key:")
  const basicAuth = Buffer.from(`${apiKey}:`).toString('base64');
  const authHeader = `Basic ${basicAuth}`;

  const createRes = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      source_url: options.characterImageUrl,
      script: { type: 'audio', audio_url: options.audioUrl }
    }),
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
      if (b.status === 'error') throw new Error(`D-ID job failed: ${b.error?.description || 'unknown error'}`);
      if (!b.result_url) throw new Error('D-ID: done status but result_url is missing');
      return b.result_url;
    },
    4000,
    120000
  );

  const localPath = path.join(workDir, `did_${Date.now()}.mp4`);
  await downloadToFile(resultUrl, localPath, 60000);

  const validation = await validateTalkingCharacterVideo(localPath);
  if (!validation.valid) throw new Error(`D-ID output invalid: ${validation.error}`);

  return {
    videoUrl: resultUrl,
    localPath,
    providerUsed: 'D-ID',
    durationSeconds: validation.duration,
    fileSizeBytes: validation.fileSizeBytes
  };
}

/**
 * Replicate — cog-wav2lip
 * Model: devxpy/cog-wav2lip
 * Input: face (image/video URL), audio (audio URL)
 * Output: lip-synced video URL
 */
async function runReplicate(
  options: TalkingCharacterOptions,
  workDir: string
): Promise<TalkingCharacterResult> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) throw new Error('REPLICATE_API_TOKEN not configured');

  // cog-wav2lip — a widely-used Wav2Lip Replicate model
  // Version pinned; update to latest if this version is retired
  const MODEL_VERSION = '8d65e3f4f4298520e079198b493c25adfc43c058839803659f0e8947474dc04f';

  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: {
        face: options.characterImageUrl,
        audio: options.audioUrl
      }
    }),
    signal: AbortSignal.timeout(30000)
  });
  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`Replicate create HTTP ${createRes.status}: ${errText.substring(0, 200)}`);
  }
  const created = (await createRes.json()) as { id?: string; urls?: { get?: string } };
  if (!created.id) throw new Error('Replicate: no prediction ID in response');

  const pollUrl = created.urls?.get || `https://api.replicate.com/v1/predictions/${created.id}`;

  interface ReplicateStatus {
    status: string;
    output?: string | string[] | null;
    error?: string | null;
  }
  const outputUrl = await pollUntil<ReplicateStatus>(
    pollUrl,
    { 'Authorization': `Token ${apiToken}` },
    b => b.status === 'succeeded' || b.status === 'failed' || b.status === 'canceled',
    b => {
      if (b.status !== 'succeeded') {
        throw new Error(`Replicate prediction ${b.status}: ${b.error || 'no error detail'}`);
      }
      const out = b.output;
      if (!out) throw new Error('Replicate: succeeded but output is null');
      // Output may be a string URL or an array of URLs
      return Array.isArray(out) ? out[0] : String(out);
    },
    5000,
    180000
  );

  const localPath = path.join(workDir, `replicate_${Date.now()}.mp4`);
  await downloadToFile(outputUrl, localPath, 60000);

  const validation = await validateTalkingCharacterVideo(localPath);
  if (!validation.valid) throw new Error(`Replicate output invalid: ${validation.error}`);

  return {
    videoUrl: outputUrl,
    localPath,
    providerUsed: 'Replicate-Wav2Lip',
    durationSeconds: validation.duration,
    fileSizeBytes: validation.fileSizeBytes
  };
}

/**
 * HuggingFace LatentSync — fffiloni/LatentSync Gradio space
 * Uses the Gradio /api/predict endpoint (synchronous; long timeout).
 * HUGGINGFACE_API_KEY is optional but reduces queue time on private spaces.
 */
async function runHFLatentSync(
  options: TalkingCharacterOptions,
  workDir: string
): Promise<TalkingCharacterResult> {
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  // Download the image and audio locally so they can be sent as base64
  const imageLocalPath = path.join(workDir, `hf_img_${Date.now()}.jpg`);
  const audioLocalPath = path.join(workDir, `hf_audio_${Date.now()}.wav`);

  await downloadToFile(options.characterImageUrl, imageLocalPath, 30000);
  await downloadToFile(options.audioUrl, audioLocalPath, 30000);

  const imageBytes = fs.readFileSync(imageLocalPath);
  const audioBytes = fs.readFileSync(audioLocalPath);

  const imageExt = imageLocalPath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
  const imageDataUri = `data:image/${imageExt};base64,${imageBytes.toString('base64')}`;
  const audioDataUri = `data:audio/wav;base64,${audioBytes.toString('base64')}`;

  const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (hfKey) reqHeaders['Authorization'] = `Bearer ${hfKey}`;

  // Gradio /api/predict: fn_index=0 is the primary inference function
  const predictRes = await fetch('https://fffiloni-latentsync.hf.space/api/predict', {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify({
      fn_index: 0,
      data: [
        { data: imageDataUri, name: 'image.jpg', orig_name: 'image.jpg', is_file: false },
        { data: audioDataUri, name: 'audio.wav', orig_name: 'audio.wav', is_file: false },
        25  // inference steps — default for LatentSync
      ]
    }),
    signal: AbortSignal.timeout(240000)  // 4 minutes — Gradio spaces can be slow
  });

  if (!predictRes.ok) {
    const errText = await predictRes.text().catch(() => '');
    throw new Error(`HF LatentSync HTTP ${predictRes.status}: ${errText.substring(0, 200)}`);
  }

  const predResult = (await predictRes.json()) as {
    data?: Array<{ data?: string; name?: string } | string> | null;
    error?: string;
  };

  if (predResult.error) throw new Error(`HF LatentSync returned error: ${predResult.error}`);
  if (!predResult.data || predResult.data.length === 0) {
    throw new Error('HF LatentSync: empty data array in response');
  }

  const outputItem = predResult.data[0];
  const localPath = path.join(workDir, `hf_latentsync_${Date.now()}.mp4`);

  if (typeof outputItem === 'string') {
    // Raw URL string
    await downloadToFile(outputItem, localPath, 60000);
  } else if (outputItem && typeof outputItem === 'object') {
    const item = outputItem as { data?: string; name?: string };
    if (item.data && item.data.startsWith('data:')) {
      // Base64 embedded video
      const commaIdx = item.data.indexOf(',');
      const base64 = commaIdx >= 0 ? item.data.substring(commaIdx + 1) : item.data;
      const buf = Buffer.from(base64, 'base64');
      if (buf.length === 0) throw new Error('HF LatentSync: data URI payload is empty');
      fs.writeFileSync(localPath, buf);
    } else if (item.name) {
      // File hosted on the space
      const fileUrl = `https://fffiloni-latentsync.hf.space/file=${item.name}`;
      const dlHeaders: Record<string, string> = {};
      if (hfKey) dlHeaders['Authorization'] = `Bearer ${hfKey}`;
      const dlRes = await fetch(fileUrl, {
        headers: dlHeaders,
        signal: AbortSignal.timeout(60000)
      });
      if (!dlRes.ok) throw new Error(`HF LatentSync file download HTTP ${dlRes.status}`);
      fs.writeFileSync(localPath, Buffer.from(await dlRes.arrayBuffer()));
    } else {
      throw new Error('HF LatentSync: output item has neither data nor name field');
    }
  } else {
    throw new Error(`HF LatentSync: unexpected output type: ${typeof outputItem}`);
  }

  const validation = await validateTalkingCharacterVideo(localPath);
  if (!validation.valid) throw new Error(`HF LatentSync output invalid: ${validation.error}`);

  return {
    videoUrl: `file://${localPath}`,
    localPath,
    providerUsed: 'HF-LatentSync',
    durationSeconds: validation.duration,
    fileSizeBytes: validation.fileSizeBytes
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Generate a talking-character video with automatic provider fallback.
 *
 * Throws AllProvidersFailedError if every provider in the chain fails.
 * Never returns a fake success or an image in place of a video.
 *
 * @param options  Character image URL + voice audio URL
 * @param tmpDir   Optional tmp directory; caller is responsible for cleanup.
 *                 If omitted, a directory is created and cleaned up automatically.
 */
export async function generateTalkingCharacterWithFallback(
  options: TalkingCharacterOptions,
  tmpDir?: string
): Promise<TalkingCharacterResult> {
  const ownDir = !tmpDir;
  const workDir = tmpDir || path.join(process.cwd(), `tmp_tc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  type R = TalkingCharacterResult;
  const chain: FallbackProvider<R>[] = [];

  // 1. SyncLabs — fastest commercial option
  if (process.env.SYNCLABS_API_KEY) {
    chain.push({
      name: 'SyncLabs',
      timeoutMs: 150_000,
      run: () => runSyncLabs(options, workDir)
    });
  }

  // 2. D-ID — commercial talking avatar
  if (process.env.DID_API_KEY) {
    chain.push({
      name: 'D-ID',
      timeoutMs: 150_000,
      run: () => runDID(options, workDir)
    });
  }

  // 3. Replicate wav2lip
  if (process.env.REPLICATE_API_TOKEN) {
    chain.push({
      name: 'Replicate-Wav2Lip',
      timeoutMs: 210_000,
      run: () => runReplicate(options, workDir)
    });
  }

  // 4. HF LatentSync Gradio space — no key required, but HF key reduces queue time
  chain.push({
    name: 'HF-LatentSync',
    timeoutMs: 260_000,
    run: () => runHFLatentSync(options, workDir)
  });

  try {
    const { result } = await runWithFallback<R>('talking-character', chain, 150_000);
    return result;
  } catch (err) {
    // Clean up our own tmp dir on total failure
    if (ownDir) {
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
    }
    throw err;
  }
}

// ── Status reporting ──────────────────────────────────────────────────────────

export interface TalkingCharacterProviderStatus {
  fallbackOrder: string[];
  configuredProviders: string[];
  unconfiguredProviders: string[];
  guaranteedFallback: string;
  requiredEnvVars: Record<string, boolean>;
  note: string;
}

export function getTalkingCharacterProviderStatus(): TalkingCharacterProviderStatus {
  const syncLabsOk   = !!process.env.SYNCLABS_API_KEY;
  const didOk        = !!process.env.DID_API_KEY;
  const replicateOk  = !!process.env.REPLICATE_API_TOKEN;
  const hfKeyOk      = !!process.env.HUGGINGFACE_API_KEY;

  const configured: string[]   = [];
  const unconfigured: string[] = [];

  if (syncLabsOk)  configured.push('SyncLabs');   else unconfigured.push('SyncLabs');
  if (didOk)       configured.push('D-ID');         else unconfigured.push('D-ID');
  if (replicateOk) configured.push('Replicate-Wav2Lip'); else unconfigured.push('Replicate-Wav2Lip');
  // HF-LatentSync is always in the chain (public space); HF key is optional
  configured.push(`HF-LatentSync${hfKeyOk ? ' (with HF key)' : ' (no key — may be slow)'}`);

  return {
    fallbackOrder: ['SyncLabs', 'D-ID', 'Replicate-Wav2Lip', 'HF-LatentSync'],
    configuredProviders: configured,
    unconfiguredProviders: unconfigured,
    guaranteedFallback: 'HF-LatentSync',
    requiredEnvVars: {
      SYNCLABS_API_KEY:   syncLabsOk,
      DID_API_KEY:        didOk,
      REPLICATE_API_TOKEN: replicateOk,
      HUGGINGFACE_API_KEY: hfKeyOk   // optional — improves HF queue time
    },
    note: configured.length === 1
      ? 'No commercial lip-sync API keys configured. HF-LatentSync will be used (public Gradio space — may be slow or queued).'
      : `${configured.length - 1} commercial provider(s) configured.`
  };
}
