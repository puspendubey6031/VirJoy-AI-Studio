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

## BGM chain
1. Local mood-mapped MP3 (`public/audio/*.mp3`) — validated with ffprobe before use
2. ffmpeg sine-wave fallback — always available

**Important:** The 5 local MP3 files in `public/audio/` are currently corrupt (ffprobe: `channels=0`, "Header missing"). They are correctly rejected by `validateAudioFile`. Sine-wave is the effective primary BGM source until the local files are replaced with valid ones.

## SFX chain
1. ffmpeg tone synthesis (always available, no external calls)
   - Supported types: whoosh, click, notification, transition, success, error, ambient, default
   - Uses frequency + fade-in/out envelope

## validateAudioFile behavior
- Rejects: missing, zero-byte, zero-channel, zero-duration, or parse-fail files
- MP3 files: must query both stream.duration AND format.duration (use `-show_entries stream=channels,duration:format=duration`)
- Never throws — returns { valid: false, error } on failure

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
