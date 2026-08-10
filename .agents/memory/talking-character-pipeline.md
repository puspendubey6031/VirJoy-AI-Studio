---
name: Talking-character pipeline
description: How the lip-sync/talking-avatar pipeline is wired into VirJoy — provider chain, workflow hook, FFmpeg integration, env vars, tests.
---

## HF credential
Existing project var: `HUGGINGFACE_API_KEY` — used for Bark voice, image generation, video clips, AND now the primary talking-character providers.
Do NOT add a duplicate HF variable.

## Provider chain (src/server/providers/talkingCharacterProvider.ts)

### When HUGGINGFACE_API_KEY is set (HF-FIRST):
HF-LatentSync → HF-SadTalker → SyncLabs → D-ID → Replicate-Wav2Lip

### When HUGGINGFACE_API_KEY is NOT set:
SyncLabs → D-ID → Replicate-Wav2Lip → HF-LatentSync (public queue — slow)

No fake last-resort: throws AllProvidersFailedError if all fail.

## Input validation
`validateTalkingCharacterInputs()` runs before any external provider call:
- characterImageUrl not empty, valid scheme
- audioUrl not empty, valid scheme
- local audio files: ffprobe check (channels > 0)
- local image files: existence check

## Output validation
`validateTalkingCharacterVideo()` — ffprobe: file exists, size > 0, video stream, audio stream (when expected), duration > 0.

## Required env vars
- HUGGINGFACE_API_KEY — primary HF provider (existing project credential, no new key needed)
- SYNCLABS_API_KEY — optional commercial fallback
- DID_API_KEY — optional commercial fallback
- REPLICATE_API_TOKEN — optional commercial fallback (Replicate cog-wav2lip; version pinned in provider file)

## HF Gradio API approach (callGradioSpaceQueue)
1. Try /upload endpoint for each file → get server-side paths (Gradio 4 style)
2. Fall back to base64 data URIs if upload fails (Gradio 3 style)
3. POST /queue/join with data + fn_index + session_hash
4. Read SSE from /queue/data — parse process_completed event → output.data array
5. saveGradioVideoOutput() handles: URL string, Gradio 4 {path/url}, Gradio 3 {data/name}

## Workflow hook (src/server/engine/workflowEngine.ts)
Stage `talking_character` between voice_generation and subtitle_generation.
Activated only when characterImageUrl passed in ExecutePipelineOptions.
If activated and all providers fail → pipeline fails (no silent fallback).

## Timeline wiring (src/server/engine/types.ts)
TimelinePackage: talkingCharacterLocalPath?, talkingCharacterClipUrl?
EngineCheckpoint: same fields

## FFmpeg integration (src/server/engine/videoComposer.ts)
If timeline.talkingCharacterLocalPath is set:
  - Probes clip for audio stream
  - With audio: mix clip audio + music (amix 1.0/0.25)
  - Without audio: mix voice track + music, use clip's video
Existing static-image slideshow path: untouched when localPath absent.

## Binary availability
checkBinaryAvailability() → { ffmpeg, ffprobe } — ffmpeg 6.1.2, ffprobe 6.1.2 confirmed present.

## Status endpoints (server.ts)
GET /api/dev/talking-character-status — HF credential configured, binary check, provider order, blockers
GET /api/dev/talking-character-test — tests A–I + binary prereq (all safe, no external calls)

## Tests A–I (all PASS)
A: HF key set → HF-first order; key absent → HF last
B: HF provider fails → commercial fallback continues
C: Provider timeout → fallback continues (TIMEOUT category)
D: Invalid/corrupt artifact → validation rejects it
E: Missing characterImageUrl → structured validation error
F: Missing audioUrl → structured validation error
G: All providers fail → AllProvidersFailedError with attempt chain
H: Valid real MP4 (created by ffmpeg) → passes ffprobe validation; executeFFmpegRender accessible
I: TimelinePackage without talkingCharacterLocalPath → static-image path remains active

**Why HF-first:** HUGGINGFACE_API_KEY is the existing project credential; no new keys needed for the pipeline to work. Commercial providers are optional fallbacks.
