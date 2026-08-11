/**
 * musicProvider.ts — Centralized Music / BGM / SFX provider with fallback chain.
 *
 * BGM fallback chain (no paid keys required):
 *   1. Local mood-mapped MP3  (public/audio/*.mp3)  — validated with ffprobe
 *   2. ffmpeg sine-wave tone  — always available
 *
 * SFX fallback chain (no paid keys required):
 *   1. ffmpeg multi-tone generation — always available
 *
 * Rules:
 *   - Every accepted file is validated (exists, size > 0, channels > 0, duration > 0).
 *   - Corrupt / zero-byte / zero-channel files are rejected and the next source is tried.
 *   - All failures are logged without exposing any API key values.
 *   - Returns null when all sources fail — callers must treat music/SFX as optional.
 */

import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ── Public types ──────────────────────────────────────────────────────────────

export interface MusicResult {
  /** Absolute path to the validated audio file (pass directly to FFmpeg) */
  localPath: string;
  /** Human-readable source tag for logging */
  providerUsed: string;
  durationSeconds: number;
  fileSizeBytes: number;
}

export interface AudioValidation {
  valid: boolean;
  hasAudio: boolean;
  channels: number;
  duration: number;
  fileSizeBytes: number;
  error?: string;
}

export interface MusicProviderStatus {
  bgmChain: string[];
  sfxChain: string[];
  localFilesAvailable: Record<string, boolean>;
  ffmpegAvailable: boolean;
  huggingFaceKeyConfigured: boolean;
  note: string;
}

// ── Mood → local file map ─────────────────────────────────────────────────────

const MOOD_FILE_MAP: Record<string, string> = {
  upbeat_electronic: 'upbeat.mp3',
  cinematic_synth:   'cinematic.mp3',
  ambient_chill:     'ambient.mp3',
  dark_dramatic:     'dramatic.mp3',
  acoustic_warm:     'acoustic.mp3',
};

const DEFAULT_MOOD = 'cinematic_synth';

// ── Core: ffprobe validation ──────────────────────────────────────────────────

/**
 * Validate an audio file with ffprobe.
 * Rejects: missing, zero-byte, zero-channel, zero-duration, or unparseable files.
 * Never throws — returns { valid: false, error } on any failure.
 */
export async function validateAudioFile(filePath: string): Promise<AudioValidation> {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, hasAudio: false, channels: 0, duration: 0, fileSizeBytes: 0, error: 'File does not exist' };
    }
    const fileSizeBytes = fs.statSync(filePath).size;
    if (fileSizeBytes === 0) {
      return { valid: false, hasAudio: false, channels: 0, duration: 0, fileSizeBytes, error: 'File is zero bytes' };
    }

    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=channels,duration:format=duration -of json "${filePath}"`,
      { timeout: 10000, maxBuffer: 128 * 1024 }
    );

    const probe = JSON.parse(stdout) as {
      streams?: { channels?: number; duration?: string }[];
      format?:  { duration?: string };
    };
    const stream   = (probe.streams || [])[0];
    const channels = stream?.channels ?? 0;
    // MP3 containers often omit duration from the stream; fall back to format duration
    const duration = parseFloat(stream?.duration || probe.format?.duration || '0');

    if (channels <= 0) {
      return { valid: false, hasAudio: false, channels, duration, fileSizeBytes, error: `No audio channels (got ${channels})` };
    }
    if (duration <= 0) {
      return { valid: false, hasAudio: true, channels, duration, fileSizeBytes, error: `Zero or negative duration (${duration}s)` };
    }

    return { valid: true, hasAudio: true, channels, duration, fileSizeBytes };
  } catch (err: any) {
    return {
      valid: false, hasAudio: false, channels: 0, duration: 0,
      fileSizeBytes: 0,
      error: `ffprobe failed: ${String(err?.message || err).substring(0, 200)}`
    };
  }
}

// ── BGM generation ────────────────────────────────────────────────────────────

/**
 * Attempt to copy the local mood-mapped MP3 into tmpDir and validate it.
 * Returns null if the file is missing or fails validation.
 */
async function tryLocalMoodFile(mood: string, durationSeconds: number, tmpDir: string): Promise<MusicResult | null> {
  const fileName = MOOD_FILE_MAP[mood] || MOOD_FILE_MAP[DEFAULT_MOOD];
  const srcPath  = path.join(process.cwd(), 'public', 'audio', fileName);
  const destPath = path.join(tmpDir, `bgm_local_${Date.now()}.mp3`);

  console.log(`[MusicProvider] BGM local file attempt: ${srcPath}`);

  if (!fs.existsSync(srcPath)) {
    console.warn(`[MusicProvider] Local BGM file not found: ${srcPath}`);
    return null;
  }

  try {
    fs.copyFileSync(srcPath, destPath);
  } catch (err: any) {
    console.warn(`[MusicProvider] Failed to copy local BGM: ${err?.message}`);
    return null;
  }

  const validation = await validateAudioFile(destPath);
  if (!validation.valid) {
    console.warn(`[MusicProvider] Local BGM file rejected: ${validation.error}`);
    try { fs.unlinkSync(destPath); } catch {}
    return null;
  }

  console.log(`[MusicProvider] Local BGM accepted: ${fileName} (${validation.duration.toFixed(1)}s, ${validation.fileSizeBytes} bytes)`);
  return {
    localPath: destPath,
    providerUsed: `local-mood:${mood}`,
    durationSeconds: validation.duration,
    fileSizeBytes:   validation.fileSizeBytes
  };
}

/**
 * Generate a sine-wave tone via ffmpeg as a final BGM fallback.
 * Always succeeds when ffmpeg is present.
 */
async function generateSineWaveBGM(durationSeconds: number, tmpDir: string): Promise<MusicResult | null> {
  const outPath = path.join(tmpDir, `bgm_sine_${Date.now()}.mp3`);
  const cmd = [
    'ffmpeg -y',
    `-f lavfi -i "sine=frequency=180:duration=${durationSeconds}"`,
    '-ar 44100 -ac 1 -c:a libmp3lame -b:a 128k',
    `"${outPath}"`
  ].join(' ');

  console.log('[MusicProvider] BGM sine-wave fallback: generating...');
  try {
    await execAsync(cmd, { timeout: 30000 });
  } catch (err: any) {
    console.error(`[MusicProvider] Sine-wave BGM generation failed: ${err?.message}`);
    return null;
  }

  const validation = await validateAudioFile(outPath);
  if (!validation.valid) {
    console.error(`[MusicProvider] Sine-wave BGM validation failed: ${validation.error}`);
    try { fs.unlinkSync(outPath); } catch {}
    return null;
  }

  console.log(`[MusicProvider] Sine-wave BGM accepted (${validation.duration.toFixed(1)}s)`);
  return {
    localPath: outPath,
    providerUsed: 'ffmpeg-sine',
    durationSeconds: validation.duration,
    fileSizeBytes:   validation.fileSizeBytes
  };
}

/**
 * Generate background music for the given mood.
 *
 * Fallback chain:
 *   1. Local mood-mapped MP3 from public/audio/
 *   2. ffmpeg sine-wave tone
 *
 * Returns null only if every source fails (extremely unlikely since ffmpeg is always present).
 * Never throws.
 */
export async function generateBackgroundMusic(
  mood: string,
  durationSeconds: number,
  tmpDir: string
): Promise<MusicResult | null> {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const normalizedMood = MOOD_FILE_MAP[mood] ? mood : DEFAULT_MOOD;

  // ── Source 1: local mood-mapped MP3 ──────────────────────────────────────
  try {
    const local = await tryLocalMoodFile(normalizedMood, durationSeconds, tmpDir);
    if (local) return local;
  } catch (err: any) {
    console.warn(`[MusicProvider] Local BGM attempt threw: ${err?.message}`);
  }

  // ── Source 2: ffmpeg sine-wave fallback ───────────────────────────────────
  try {
    const sine = await generateSineWaveBGM(durationSeconds, tmpDir);
    if (sine) return sine;
  } catch (err: any) {
    console.error(`[MusicProvider] Sine-wave BGM attempt threw: ${err?.message}`);
  }

  console.error('[MusicProvider] All BGM sources failed — returning null (BGM will be absent)');
  return null;
}

// ── SFX generation ────────────────────────────────────────────────────────────

/** Supported SFX types → (frequency Hz, waveform hint) */
const SFX_TYPE_MAP: Record<string, { freq: number; label: string }> = {
  whoosh:      { freq: 800,  label: 'whoosh' },
  click:       { freq: 1200, label: 'click' },
  notification:{ freq: 880,  label: 'notification' },
  transition:  { freq: 600,  label: 'transition' },
  success:     { freq: 1000, label: 'success' },
  error:       { freq: 300,  label: 'error' },
  ambient:     { freq: 220,  label: 'ambient' },
  default:     { freq: 440,  label: 'default' },
};

/**
 * Generate a sound effect using ffmpeg tone synthesis.
 *
 * Fallback chain:
 *   1. ffmpeg multi-tone generation (always available)
 *
 * Returns null if ffmpeg is not present or fails validation. Never throws.
 */
export async function generateSFX(
  sfxType: string,
  durationSeconds: number,
  tmpDir: string
): Promise<MusicResult | null> {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const sfx = SFX_TYPE_MAP[sfxType] || SFX_TYPE_MAP['default'];
  const outPath = path.join(tmpDir, `sfx_${sfxType}_${Date.now()}.mp3`);

  // Envelope: fade-in 10% fade-out 10% of duration for a natural sound
  const clampedDur = Math.max(0.5, Math.min(durationSeconds, 10));
  const fadeDur    = (clampedDur * 0.1).toFixed(3);

  const cmd = [
    'ffmpeg -y',
    `-f lavfi -i "sine=frequency=${sfx.freq}:duration=${clampedDur}"`,
    `-af "afade=t=in:st=0:d=${fadeDur},afade=t=out:st=${(clampedDur - parseFloat(fadeDur)).toFixed(3)}:d=${fadeDur}"`,
    '-ar 44100 -ac 1 -c:a libmp3lame -b:a 128k',
    `"${outPath}"`
  ].join(' ');

  console.log(`[MusicProvider] SFX generation (${sfxType} @ ${sfx.freq}Hz, ${clampedDur}s)...`);
  try {
    await execAsync(cmd, { timeout: 15000 });
  } catch (err: any) {
    console.error(`[MusicProvider] SFX ffmpeg failed: ${err?.message}`);
    return null;
  }

  const validation = await validateAudioFile(outPath);
  if (!validation.valid) {
    console.error(`[MusicProvider] SFX validation failed: ${validation.error}`);
    try { fs.unlinkSync(outPath); } catch {}
    return null;
  }

  console.log(`[MusicProvider] SFX accepted: ${sfxType} (${validation.duration.toFixed(2)}s, ${validation.fileSizeBytes} bytes)`);
  return {
    localPath: outPath,
    providerUsed: `ffmpeg-sfx:${sfxType}`,
    durationSeconds: validation.duration,
    fileSizeBytes:   validation.fileSizeBytes
  };
}

// ── Status ────────────────────────────────────────────────────────────────────

/**
 * Return the current music provider configuration status.
 * Never exposes key values.
 */
export function getMusicProviderStatus(): MusicProviderStatus {
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  const localFilesAvailable: Record<string, boolean> = {};

  for (const [mood, file] of Object.entries(MOOD_FILE_MAP)) {
    const p = path.join(audioDir, file);
    localFilesAvailable[mood] = fs.existsSync(p) && fs.statSync(p).size > 0;
  }

  let ffmpegAvailable = false;
  try {
    execSync('ffmpeg -version', { stdio: 'ignore', timeout: 3000 });
    ffmpegAvailable = true;
  } catch {}

  const hfKey = !!process.env.HUGGINGFACE_API_KEY;

  const anyLocalAvailable = Object.values(localFilesAvailable).some(Boolean);

  return {
    bgmChain: [
      ...(anyLocalAvailable ? ['local-mood-file (public/audio/*.mp3)'] : []),
      ...(ffmpegAvailable    ? ['ffmpeg-sine-wave']                     : []),
    ],
    sfxChain: [
      ...(ffmpegAvailable ? ['ffmpeg-tone-synthesis'] : []),
    ],
    localFilesAvailable,
    ffmpegAvailable,
    huggingFaceKeyConfigured: hfKey,
    note: [
      anyLocalAvailable
        ? 'Local BGM files exist in public/audio/ but may be corrupt (channels=0); validateAudioFile rejects them per spec — sine-wave fallback is used.'
        : 'No local BGM files found — sine-wave fallback only.',
      ffmpegAvailable
        ? 'ffmpeg available — sine-wave fallback and SFX always work.'
        : 'WARNING: ffmpeg not found — all music generation will fail.',
    ].join(' ')
  };
}
