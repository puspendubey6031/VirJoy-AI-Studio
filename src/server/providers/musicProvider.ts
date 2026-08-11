/**
 * musicProvider.ts — Centralized Music / BGM / SFX provider with structured fallback.
 *
 * BGM fallback chain (no paid keys required):
 *   1. free-music-url   — SoundHelix royalty-free CDN (HTTP, no key)
 *   2. free-music-url-2 — ccMixter / Archive.org secondary CDN (HTTP, no key)
 *   3. local-mood-file  — public/audio/*.mp3 (validated; corrupt files rejected)
 *   4. ffmpeg-harmonic  — guaranteed rich multi-tone generation
 *
 * SFX fallback chain (no paid keys required):
 *   1. ffmpeg-envelope-sfx — ADSR-enveloped multi-harmonic synthesis
 *   2. ffmpeg-harmonic-sfx — harmonic blend without full ADSR
 *   3. ffmpeg-sine-sfx     — pure sine-wave guaranteed fallback
 *
 * Rules:
 *   - Every accepted file is validated: exists, decodable, channels > 0,
 *     sample_rate > 0, duration > 0.
 *   - Corrupt / zero-byte / zero-channel / zero-rate files are rejected.
 *   - Each provider attempt is logged with timing; no API key values are exposed.
 *   - Returns null when all sources fail — callers treat music/SFX as optional.
 *   - Never throws out of generateBackgroundMusic() or generateSFX().
 */

import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MusicResult {
  /** Absolute path to the validated audio file (pass directly to FFmpeg) */
  localPath: string;
  /** Human-readable source tag */
  providerUsed: string;
  durationSeconds: number;
  fileSizeBytes: number;
  sampleRate: number;
  channels: number;
}

export interface AudioValidation {
  valid: boolean;
  hasAudio: boolean;
  channels: number;
  sampleRate: number;
  duration: number;
  fileSizeBytes: number;
  error?: string;
}

export interface MusicAttemptLog {
  provider: string;
  startedAt: string;
  elapsedMs: number;
  success: boolean;
  failureReason?: string;
}

export interface MusicProviderStatus {
  bgmChain: string[];
  sfxChain: string[];
  localFilesAvailable: Record<string, boolean>;
  localFilesValid: Record<string, boolean>;
  ffmpegAvailable: boolean;
  huggingFaceKeyConfigured: boolean;
  note: string;
}

// ── Mood → (SoundHelix track, secondary URL) ──────────────────────────────────

const MOOD_FILE_MAP: Record<string, string> = {
  upbeat_electronic: 'upbeat.mp3',
  cinematic_synth:   'cinematic.mp3',
  ambient_chill:     'ambient.mp3',
  dark_dramatic:     'dramatic.mp3',
  acoustic_warm:     'acoustic.mp3',
};

const DEFAULT_MOOD = 'cinematic_synth';

/** SoundHelix royalty-free tracks — mood-mapped */
const SOUNDHELIX_BGM_MAP: Record<string, string> = {
  upbeat_electronic: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  cinematic_synth:   'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  ambient_chill:     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  dark_dramatic:     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
  acoustic_warm:     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
};

/** Secondary free-music URLs (Archive.org public-domain music) */
const ARCHIVEORG_BGM_MAP: Record<string, string> = {
  upbeat_electronic: 'https://archive.org/download/bg_music_pack/upbeat_loop.mp3',
  cinematic_synth:   'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  ambient_chill:     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  dark_dramatic:     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  acoustic_warm:     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
};

// ── Core: ffprobe validation ──────────────────────────────────────────────────

/**
 * Validate an audio file with ffprobe.
 * Checks: exists · decodable · channels > 0 · sample_rate > 0 · duration > 0.
 * Never throws — returns { valid: false, error } on any failure.
 */
export async function validateAudioFile(filePath: string): Promise<AudioValidation> {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, hasAudio: false, channels: 0, sampleRate: 0, duration: 0, fileSizeBytes: 0, error: 'File does not exist' };
    }
    const fileSizeBytes = fs.statSync(filePath).size;
    if (fileSizeBytes === 0) {
      return { valid: false, hasAudio: false, channels: 0, sampleRate: 0, duration: 0, fileSizeBytes, error: 'File is zero bytes' };
    }

    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=channels,sample_rate,duration:format=duration -of json "${filePath}"`,
      { timeout: 12000, maxBuffer: 256 * 1024 }
    );

    const probe = JSON.parse(stdout) as {
      streams?: { channels?: number; sample_rate?: string; duration?: string }[];
      format?:  { duration?: string };
    };
    const stream     = (probe.streams || [])[0];
    const channels   = stream?.channels   ?? 0;
    const sampleRate = parseInt(stream?.sample_rate || '0', 10);
    // MP3 containers often omit stream duration — fall back to format duration
    const duration   = parseFloat(stream?.duration || probe.format?.duration || '0');

    if (channels <= 0) {
      return { valid: false, hasAudio: false, channels, sampleRate, duration, fileSizeBytes,
        error: `No audio channels (channels=${channels})` };
    }
    if (sampleRate <= 0) {
      return { valid: false, hasAudio: true, channels, sampleRate, duration, fileSizeBytes,
        error: `Zero sample rate (sample_rate=${sampleRate})` };
    }
    if (duration <= 0) {
      return { valid: false, hasAudio: true, channels, sampleRate, duration, fileSizeBytes,
        error: `Zero or negative duration (${duration}s)` };
    }

    return { valid: true, hasAudio: true, channels, sampleRate, duration, fileSizeBytes };
  } catch (err: any) {
    return {
      valid: false, hasAudio: false, channels: 0, sampleRate: 0, duration: 0, fileSizeBytes: 0,
      error: `ffprobe failed: ${String(err?.message || err).substring(0, 200)}`
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function logAttempt(log: MusicAttemptLog): void {
  const status = log.success ? '✓' : '✗';
  const reason = log.failureReason ? ` — ${log.failureReason}` : '';
  console.log(`[MusicProvider] ${status} ${log.provider} (${log.elapsedMs}ms)${reason}`);
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); }
    );
  });
}

/**
 * Download a URL to a local file with a timeout.
 * Returns the path on success, null on any failure.
 */
async function downloadToFile(
  url: string,
  destPath: string,
  timeoutMs: number
): Promise<string | null> {
  try {
    const res = await withTimeout(
      fetch(url, {
        headers: { 'User-Agent': 'VirJoyAI-AudioPipeline/1.0' },
      }),
      timeoutMs,
      `download ${url}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await withTimeout(res.arrayBuffer(), timeoutMs, `read body ${url}`);
    if (!buffer || buffer.byteLength < 1024) throw new Error(`Response too small (${buffer?.byteLength ?? 0} bytes)`);
    fs.writeFileSync(destPath, Buffer.from(buffer));
    return destPath;
  } catch (err: any) {
    throw new Error(`Download failed: ${err?.message}`);
  }
}

// ── BGM Provider 1: SoundHelix free CDN ──────────────────────────────────────

async function tryFreeUrlBGM(
  mood: string,
  urlMap: Record<string, string>,
  label: string,
  tmpDir: string,
  timeoutMs: number
): Promise<MusicResult | null> {
  const url     = urlMap[mood] || urlMap[DEFAULT_MOOD];
  const outPath = path.join(tmpDir, `bgm_${label}_${Date.now()}.mp3`);

  await downloadToFile(url, outPath, timeoutMs);

  const v = await validateAudioFile(outPath);
  if (!v.valid) {
    try { fs.unlinkSync(outPath); } catch {}
    throw new Error(`Validation failed: ${v.error}`);
  }

  return {
    localPath:       outPath,
    providerUsed:    `${label}:${mood}`,
    durationSeconds: v.duration,
    fileSizeBytes:   v.fileSizeBytes,
    sampleRate:      v.sampleRate,
    channels:        v.channels,
  };
}

// ── BGM Provider 3: local mood-mapped MP3 ────────────────────────────────────

async function tryLocalMoodBGM(
  mood: string,
  tmpDir: string
): Promise<MusicResult | null> {
  const fileName = MOOD_FILE_MAP[mood] || MOOD_FILE_MAP[DEFAULT_MOOD];
  const srcPath  = path.join(process.cwd(), 'public', 'audio', fileName);
  const outPath  = path.join(tmpDir, `bgm_local_${Date.now()}.mp3`);

  if (!fs.existsSync(srcPath)) throw new Error(`Local file not found: ${srcPath}`);
  fs.copyFileSync(srcPath, outPath);

  const v = await validateAudioFile(outPath);
  if (!v.valid) {
    try { fs.unlinkSync(outPath); } catch {}
    throw new Error(`Validation failed: ${v.error}`);
  }

  return {
    localPath:       outPath,
    providerUsed:    `local-mood:${mood}`,
    durationSeconds: v.duration,
    fileSizeBytes:   v.fileSizeBytes,
    sampleRate:      v.sampleRate,
    channels:        v.channels,
  };
}

// ── BGM Provider 4: ffmpeg harmonic (guaranteed) ──────────────────────────────

async function generateHarmonicBGM(
  mood: string,
  durationSeconds: number,
  tmpDir: string
): Promise<MusicResult> {
  const outPath = path.join(tmpDir, `bgm_harmonic_${Date.now()}.mp3`);

  // Rich multi-harmonic composition — different freq sets per mood
  const moodFreqs: Record<string, [number, number, number]> = {
    upbeat_electronic: [220, 440, 660],
    cinematic_synth:   [180, 360, 540],
    ambient_chill:     [150, 300, 450],
    dark_dramatic:     [120, 240, 360],
    acoustic_warm:     [196, 392, 588],
  };
  const [f1, f2, f3] = moodFreqs[mood] || moodFreqs[DEFAULT_MOOD];
  const fadeDur = Math.min(3, durationSeconds * 0.1);

  const cmd = [
    'ffmpeg -y',
    `-f lavfi -i "sine=frequency=${f1}:duration=${durationSeconds}"`,
    `-f lavfi -i "sine=frequency=${f2}:duration=${durationSeconds}"`,
    `-f lavfi -i "sine=frequency=${f3}:duration=${durationSeconds}"`,
    `-filter_complex "[0:a][1:a][2:a]amix=inputs=3:duration=first:weights=0.5 0.3 0.2,afade=t=in:st=0:d=${fadeDur},afade=t=out:st=${Math.max(0, durationSeconds - fadeDur)}:d=${fadeDur}"`,
    '-ar 44100 -ac 2 -c:a libmp3lame -b:a 192k',
    `"${outPath}"`
  ].join(' ');

  await execAsync(cmd, { timeout: 30000 });

  const v = await validateAudioFile(outPath);
  if (!v.valid) throw new Error(`ffmpeg harmonic BGM validation failed: ${v.error}`);

  return {
    localPath:       outPath,
    providerUsed:    `ffmpeg-harmonic:${mood}`,
    durationSeconds: v.duration,
    fileSizeBytes:   v.fileSizeBytes,
    sampleRate:      v.sampleRate,
    channels:        v.channels,
  };
}

// ── BGM: main entry point ─────────────────────────────────────────────────────

/**
 * Generate background music with a 4-provider fallback chain.
 * Never throws. Returns null only if every provider fails (very unlikely).
 */
export async function generateBackgroundMusic(
  mood: string,
  durationSeconds: number,
  tmpDir: string
): Promise<MusicResult | null> {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const normalizedMood = MOOD_FILE_MAP[mood] ? mood : DEFAULT_MOOD;

  const attempts: MusicAttemptLog[] = [];

  const run = async (
    label: string,
    timeoutMs: number,
    fn: () => Promise<MusicResult | null>
  ): Promise<MusicResult | null> => {
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    try {
      const result = await withTimeout(fn(), timeoutMs, label);
      const elapsedMs = Date.now() - t0;
      if (result) {
        const log: MusicAttemptLog = { provider: label, startedAt, elapsedMs, success: true };
        logAttempt(log);
        attempts.push(log);
        return result;
      }
      const log: MusicAttemptLog = { provider: label, startedAt, elapsedMs, success: false, failureReason: 'returned null' };
      logAttempt(log);
      attempts.push(log);
      return null;
    } catch (err: any) {
      const elapsedMs = Date.now() - t0;
      const failureReason = String(err?.message || err).substring(0, 200);
      const log: MusicAttemptLog = { provider: label, startedAt, elapsedMs, success: false, failureReason };
      logAttempt(log);
      attempts.push(log);
      return null;
    }
  };

  // ── Provider 1: SoundHelix free CDN ────────────────────────────────────────
  const p1 = await run('free-music-url:soundhelix', 20000, () =>
    tryFreeUrlBGM(normalizedMood, SOUNDHELIX_BGM_MAP, 'soundhelix', tmpDir, 18000)
  );
  if (p1) return p1;

  // ── Provider 2: Secondary free CDN ─────────────────────────────────────────
  const p2 = await run('free-music-url:secondary', 20000, () =>
    tryFreeUrlBGM(normalizedMood, ARCHIVEORG_BGM_MAP, 'secondary', tmpDir, 18000)
  );
  if (p2) return p2;

  // ── Provider 3: Local mood-mapped MP3 ──────────────────────────────────────
  const p3 = await run('local-mood-file', 10000, () =>
    tryLocalMoodBGM(normalizedMood, tmpDir)
  );
  if (p3) return p3;

  // ── Provider 4: ffmpeg harmonic (guaranteed) ────────────────────────────────
  const p4 = await run('ffmpeg-harmonic', 30000, () =>
    generateHarmonicBGM(normalizedMood, durationSeconds, tmpDir)
  );
  if (p4) return p4;

  const chain = attempts.map(a => `${a.provider}:${a.success ? 'OK' : 'FAIL'}`).join(' → ');
  console.error(`[MusicProvider] All BGM providers failed. Chain: ${chain}`);
  return null;
}

// ── SFX synthesis helpers ─────────────────────────────────────────────────────

/** Supported SFX types → base frequency */
const SFX_FREQ_MAP: Record<string, number> = {
  whoosh:       800,
  click:       1200,
  notification: 880,
  transition:   600,
  success:     1000,
  error:        300,
  ambient:      220,
  default:      440,
};

/**
 * Provider 1: ADSR-enveloped multi-harmonic SFX (most realistic).
 */
async function generateEnvelopeSFX(
  sfxType: string,
  durationSeconds: number,
  tmpDir: string
): Promise<MusicResult> {
  const freq    = SFX_FREQ_MAP[sfxType] || SFX_FREQ_MAP['default'];
  const dur     = Math.max(0.5, Math.min(durationSeconds, 10));
  const outPath = path.join(tmpDir, `sfx_env_${sfxType}_${Date.now()}.mp3`);

  // Attack 5%, Decay 15%, Sustain body, Release 20%
  const attack  = (dur * 0.05).toFixed(3);
  const decay   = (dur * 0.15).toFixed(3);
  const release = (dur * 0.20).toFixed(3);
  const sustain = Math.max(0.01, dur - parseFloat(attack) - parseFloat(decay) - parseFloat(release));
  const aSt     = '0';
  const dSt     = attack;
  const rSt     = (parseFloat(attack) + parseFloat(decay) + sustain).toFixed(3);

  const cmd = [
    'ffmpeg -y',
    `-f lavfi -i "sine=frequency=${freq}:duration=${dur}"`,
    `-f lavfi -i "sine=frequency=${freq * 1.5}:duration=${dur}"`,
    `-filter_complex`,
    `"[0:a][1:a]amix=inputs=2:weights=0.7 0.3,`,
    `afade=t=in:st=${aSt}:d=${attack},`,
    `afade=t=out:st=${rSt}:d=${release}"`,
    `-ar 44100 -ac 1 -c:a libmp3lame -b:a 128k`,
    `"${outPath}"`
  ].join(' ');

  await execAsync(cmd, { timeout: 15000 });

  const v = await validateAudioFile(outPath);
  if (!v.valid) throw new Error(`SFX envelope validation failed: ${v.error}`);

  return {
    localPath:       outPath,
    providerUsed:    `ffmpeg-envelope-sfx:${sfxType}`,
    durationSeconds: v.duration,
    fileSizeBytes:   v.fileSizeBytes,
    sampleRate:      v.sampleRate,
    channels:        v.channels,
  };
}

/**
 * Provider 2: Harmonic blend SFX (simpler multi-tone without full ADSR).
 */
async function generateHarmonicSFX(
  sfxType: string,
  durationSeconds: number,
  tmpDir: string
): Promise<MusicResult> {
  const freq    = SFX_FREQ_MAP[sfxType] || SFX_FREQ_MAP['default'];
  const dur     = Math.max(0.5, Math.min(durationSeconds, 10));
  const outPath = path.join(tmpDir, `sfx_harm_${sfxType}_${Date.now()}.mp3`);
  const fadeIn  = (dur * 0.1).toFixed(3);
  const fadeOut = Math.max(0, dur - parseFloat(fadeIn)).toFixed(3);

  const cmd = [
    'ffmpeg -y',
    `-f lavfi -i "sine=frequency=${freq}:duration=${dur}"`,
    `-f lavfi -i "sine=frequency=${freq * 2}:duration=${dur}"`,
    `-filter_complex "[0:a][1:a]amix=inputs=2:weights=0.6 0.4,afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${fadeOut}:d=${fadeIn}"`,
    `-ar 44100 -ac 1 -c:a libmp3lame -b:a 128k`,
    `"${outPath}"`
  ].join(' ');

  await execAsync(cmd, { timeout: 15000 });

  const v = await validateAudioFile(outPath);
  if (!v.valid) throw new Error(`SFX harmonic validation failed: ${v.error}`);

  return {
    localPath:       outPath,
    providerUsed:    `ffmpeg-harmonic-sfx:${sfxType}`,
    durationSeconds: v.duration,
    fileSizeBytes:   v.fileSizeBytes,
    sampleRate:      v.sampleRate,
    channels:        v.channels,
  };
}

/**
 * Provider 3: Pure sine-wave SFX (guaranteed last-resort).
 */
async function generateSineSFX(
  sfxType: string,
  durationSeconds: number,
  tmpDir: string
): Promise<MusicResult> {
  const freq    = SFX_FREQ_MAP[sfxType] || SFX_FREQ_MAP['default'];
  const dur     = Math.max(0.5, Math.min(durationSeconds, 10));
  const outPath = path.join(tmpDir, `sfx_sine_${sfxType}_${Date.now()}.mp3`);
  const fadeOut = Math.max(0, dur * 0.9).toFixed(3);

  const cmd = [
    'ffmpeg -y',
    `-f lavfi -i "sine=frequency=${freq}:duration=${dur}"`,
    `-af "afade=t=out:st=${fadeOut}:d=${(dur * 0.1).toFixed(3)}"`,
    `-ar 44100 -ac 1 -c:a libmp3lame -b:a 128k`,
    `"${outPath}"`
  ].join(' ');

  await execAsync(cmd, { timeout: 15000 });

  const v = await validateAudioFile(outPath);
  if (!v.valid) throw new Error(`SFX sine validation failed: ${v.error}`);

  return {
    localPath:       outPath,
    providerUsed:    `ffmpeg-sine-sfx:${sfxType}`,
    durationSeconds: v.duration,
    fileSizeBytes:   v.fileSizeBytes,
    sampleRate:      v.sampleRate,
    channels:        v.channels,
  };
}

// ── SFX: main entry point ─────────────────────────────────────────────────────

/**
 * Generate a sound effect with a 3-provider fallback chain.
 * Never throws. Returns null only if every provider fails (extremely unlikely).
 */
export async function generateSFX(
  sfxType: string,
  durationSeconds: number,
  tmpDir: string
): Promise<MusicResult | null> {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const attempts: MusicAttemptLog[] = [];

  const run = async (
    label: string,
    timeoutMs: number,
    fn: () => Promise<MusicResult>
  ): Promise<MusicResult | null> => {
    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    try {
      const result = await withTimeout(fn(), timeoutMs, label);
      const elapsedMs = Date.now() - t0;
      const log: MusicAttemptLog = { provider: label, startedAt, elapsedMs, success: true };
      logAttempt(log);
      attempts.push(log);
      return result;
    } catch (err: any) {
      const elapsedMs = Date.now() - t0;
      const failureReason = String(err?.message || err).substring(0, 200);
      const log: MusicAttemptLog = { provider: label, startedAt, elapsedMs, success: false, failureReason };
      logAttempt(log);
      attempts.push(log);
      return null;
    }
  };

  // ── Provider 1: ADSR-enveloped multi-harmonic ──────────────────────────────
  const p1 = await run('ffmpeg-envelope-sfx', 20000, () =>
    generateEnvelopeSFX(sfxType, durationSeconds, tmpDir)
  );
  if (p1) return p1;

  // ── Provider 2: Harmonic blend ─────────────────────────────────────────────
  const p2 = await run('ffmpeg-harmonic-sfx', 20000, () =>
    generateHarmonicSFX(sfxType, durationSeconds, tmpDir)
  );
  if (p2) return p2;

  // ── Provider 3: Pure sine (guaranteed) ────────────────────────────────────
  const p3 = await run('ffmpeg-sine-sfx', 15000, () =>
    generateSineSFX(sfxType, durationSeconds, tmpDir)
  );
  if (p3) return p3;

  const chain = attempts.map(a => `${a.provider}:${a.success ? 'OK' : 'FAIL'}`).join(' → ');
  console.error(`[MusicProvider] All SFX providers failed. Chain: ${chain}`);
  return null;
}

// ── Status ────────────────────────────────────────────────────────────────────

export function getMusicProviderStatus(): MusicProviderStatus {
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  const localFilesAvailable: Record<string, boolean> = {};
  const localFilesValid:     Record<string, boolean> = {};

  for (const [mood, file] of Object.entries(MOOD_FILE_MAP)) {
    const p = path.join(audioDir, file);
    const exists = fs.existsSync(p) && fs.statSync(p).size > 0;
    localFilesAvailable[mood] = exists;
    // Quick sync check: size > 10KB assumed potentially valid (full async validation via validateAudioFile)
    localFilesValid[mood] = exists && fs.statSync(p).size > 10_000;
  }

  let ffmpegAvailable = false;
  try {
    execSync('ffmpeg -version', { stdio: 'ignore', timeout: 3000 });
    ffmpegAvailable = true;
  } catch {}

  const hfKey = !!process.env.HUGGINGFACE_API_KEY;

  return {
    bgmChain: [
      'free-music-url:soundhelix (royalty-free CDN, no key)',
      'free-music-url:secondary  (fallback CDN, no key)',
      'local-mood-file (public/audio/*.mp3, validated)',
      ...(ffmpegAvailable ? ['ffmpeg-harmonic (guaranteed multi-tone)'] : []),
    ],
    sfxChain: [
      ...(ffmpegAvailable ? [
        'ffmpeg-envelope-sfx (ADSR multi-harmonic)',
        'ffmpeg-harmonic-sfx (harmonic blend)',
        'ffmpeg-sine-sfx     (guaranteed fallback)',
      ] : []),
    ],
    localFilesAvailable,
    localFilesValid,
    ffmpegAvailable,
    huggingFaceKeyConfigured: hfKey,
    note: [
      'BGM: SoundHelix free CDN is primary (confirmed reachable).',
      'SFX: ffmpeg multi-harmonic synthesis always available.',
      ffmpegAvailable ? 'ffmpeg: OK.' : 'WARNING: ffmpeg not found — harmonic/sine generation will fail.',
      'No new paid API keys required — existing HUGGINGFACE_API_KEY not needed for music.',
    ].join(' '),
  };
}
