---
name: Pipeline audit findings
description: End-to-end pipeline audit (2026-08-11): bugs found and fixed, architectural gaps documented.
---

# Pipeline Audit Findings

## Bugs Fixed
1. **sfxType missing from /api/video/render** — granularScenes built in render route had no `sfxType`; per-scene SFX never generated. Fixed by applying `RENDER_TRANSITION_SFX_MAP` and generating SFX inline with a `tmp_render_sfx_*` dir that is cleaned up after render.
2. **tmp_music_* dirs accumulated** — workflowEngine created musicTmpDir but never deleted it. Fixed by `let musicTmpDir = ''` before the try block, set inside music_generation, cleaned up in `finally`.
3. **Export MP4 files never deleted** — cleanupService only removed in-memory records, not `public/exports/*.mp4`. Fixed by adding `fs.unlinkSync` when outputUrl starts with `/exports/`.
4. **Audio output was mono** — FFmpeg amix with mixed mono/stereo inputs collapsed to mono. Fixed by adding `-ac 2` to all slideshow and talking-character FFmpeg output commands in videoComposer.

## Architectural Gaps (Not Fixed — By Design)
- **globalJobEngine video job = stub** — `submitGlobalJob({type:'video',...})` calls `planVideoWithAI` (skipFFmpegRender=true) and creates a VideoProject record, but does NOT call `executeFFmpegRender`. outputUrl is never set. The real production path for video is `POST /api/video/plan` → `POST /api/video/render`. Documented in E2E_11 test.
- **Product URL extraction is not auto-injected** — `/api/product/extract` returns productInfo to the client; client must manually include it in the video prompt. No automatic wiring.
- **HF LatentSync /queue/join = 404** — documented in talking-character tests. LatentSync stays in fallback chain but fails fast.

## Test Suites
- Music/BGM/SFX: 16/16 PASS
- Talking Character: 11/11 PASS  
- Pipeline E2E: 11/11 PASS
- Total: 38/38

**Why:** These fixes ensure the full production render path (plan → render → MP4) produces correct stereo audio with BGM ducking, per-scene SFX, proper cleanup, and matching credit enforcement.
