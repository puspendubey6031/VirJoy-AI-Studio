---
name: Talking-character pipeline
description: How the lip-sync/talking-avatar pipeline is wired into VirJoy — provider chain, workflow hook, FFmpeg integration, env vars.
---

## Provider chain (src/server/providers/talkingCharacterProvider.ts)
SyncLabs → D-ID → Replicate-Wav2Lip → HF-LatentSync (always last; public Gradio space, no key required)

No fake last-resort: throws AllProvidersFailedError if all fail.

Every result validated with ffprobe: file exists, size > 0, video stream, audio stream, duration > 0.

## Required env vars
- SYNCLABS_API_KEY — SyncLabs commercial lip-sync
- DID_API_KEY — D-ID commercial talking avatar
- REPLICATE_API_TOKEN — Replicate cog-wav2lip (version pinned in talkingCharacterProvider.ts)
- HUGGINGFACE_API_KEY — optional; reduces HF-LatentSync queue time

## Workflow hook (src/server/engine/workflowEngine.ts)
New stage `talking_character` inserted between `voice_generation` and `subtitle_generation`.
Activated only when `characterImageUrl` is passed in `ExecutePipelineOptions`.
If activated and all providers fail → pipeline fails (no silent fallback to plain video).

## Timeline wiring (src/server/engine/types.ts)
TimelinePackage gains: talkingCharacterLocalPath?, talkingCharacterClipUrl?
EngineCheckpoint gains: talkingCharacterLocalPath?, talkingCharacterClipUrl?

## FFmpeg integration (src/server/engine/videoComposer.ts)
If timeline.talkingCharacterLocalPath is set → talking-character mode:
  - Clip has audio: mix clip audio + music (amix weights 1.0 / 0.25)
  - Clip has no audio: mix voice track + music, use clip's video
  Existing static-image slideshow path is untouched.

**Why:** keeps the existing working FFmpeg pipeline intact; talking-character just switches the video source.

## Status endpoints (server.ts)
GET /api/dev/talking-character-status — provider config, which keys missing, blockers
GET /api/dev/talking-character-test — 5 safe tests (no external calls): chain config, validation, missing-key guard, AllProvidersFailedError, env-var report format
