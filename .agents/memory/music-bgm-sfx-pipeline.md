---
name: Music / BGM / SFX pipeline
description: How music, background music, and sound effects are generated and wired into the VirJoy video pipeline.
---

## Files

| File | Role |
|---|---|
| `src/server/providers/musicProvider.ts` | Central BGM/SFX provider — validation, generation, status |
| `src/server/engine/types.ts` | `music_generation` WorkflowStage; `bgmLocalPath`/`sfxLocalPath` on TimelinePackage + EngineCheckpoint |
| `src/server/engine/workflowEngine.ts` | `music_generation` stage (between voice and talking_character) |
| `src/server/engine/videoComposer.ts` | Fast-path: uses `timeline.bgmLocalPath` directly when present |
| `src/server/providers/index.ts` | Re-exports musicProvider; adds `music: MusicProviderStatus` to ProviderStatusReport |

## BGM chain (4 providers)
1. **free-music-url:soundhelix** — SoundHelix royalty-free CDN (HTTP 200 confirmed, ~8.9MB/2.5s)
2. **free-music-url:secondary**  — Fallback CDN (SoundHelix alternate tracks / Archive.org)
3. **local-mood-file**           — `public/audio/*.mp3` — validated with ffprobe; currently CORRUPT (channels=0), correctly rejected
4. **ffmpeg-harmonic**           — Multi-harmonic multi-tone synthesis; guaranteed always works

**Important:** The 5 local MP3 files in `public/audio/` have `channels=0` ("Header missing" from ffprobe) — corrupt. They are correctly rejected. Replace them with valid MP3s to enable provider 3.

## SFX chain (3 providers)
1. **ffmpeg-envelope-sfx** — ADSR-enveloped multi-harmonic (most realistic)
2. **ffmpeg-harmonic-sfx** — harmonic blend without full ADSR
3. **ffmpeg-sine-sfx**     — pure sine guaranteed fallback

Supported types: whoosh, click, notification, transition, success, error, ambient, default

## validateAudioFile behavior (enhanced)
- Checks: exists · size > 0 · channels > 0 · **sampleRate > 0** · duration > 0
- MP3 files: query both stream.duration AND format.duration: `-show_entries stream=channels,sample_rate,duration:format=duration`
- Never throws — returns { valid: false, error } on failure
- MusicResult now carries: localPath, providerUsed, durationSeconds, fileSizeBytes, **sampleRate**, **channels**

## WorkflowEngine stage
- Stage: `music_generation` (between voice_generation and talking_character)
- BGM failure → warning log → pipeline continues (sine-wave used by videoComposer)
- SFX failure → warning log → pipeline continues (SFX absent, which is fine)
- Stores: `checkpoint.bgmLocalPath`, `checkpoint.sfxLocalPath`

## videoComposer integration
- Checks `timeline.bgmLocalPath` first (fast path — pre-validated, no HTTP download)
- Falls back to URL download → local `/` path → ffmpeg sine-wave (existing logic unchanged)

## No new API keys required
All BGM and SFX sources work with zero external credentials.

**Why sine-wave not local files:** The local MP3s have corrupt audio frames. A future task should replace them with valid royalty-free MP3s; until then, sine-wave is the reliable fallback.
