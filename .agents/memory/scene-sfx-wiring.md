---
name: Scene SFX wiring
description: How transitionEffect maps to SFX types and how per-scene SFX is placed at transition timestamps in the video render.
---

# Scene SFX wiring

## Rule
Each GranularSceneSpec now carries `sfxType?` derived from `transitionEffect`. The SFX is generated in the `music_generation` stage and placed at the exact transition timestamp in the final FFmpeg render.

## Transition → SFX map (TRANSITION_SFX_MAP in sceneGenerator.ts)
| transitionEffect | sfxType |
|---|---|
| fast_wipe | whoosh |
| glitch_slide | impact |
| zoom_burst | pop |
| cross_dissolve | transition |
| fade_to_black | none |
| none | none |

## How to apply
- `sceneGenerator.ts`: sets `sfxType` on every scene using TRANSITION_SFX_MAP at creation time.
- `workflowEngine.ts` music_generation stage: loops scenes (excluding last), generates SFX for each non-'none' sfxType, stores in `checkpoint.sceneSfxMap` (Record<sceneIndex, localPath>).
- `videoComposer.ts` buildSlideshowAudioFilter(): reads `timeline.sceneSfxMap`, computes cumulative delay for each SFX (cumulativeMs - 150ms), adds `adelay` filter per clip, mixes into final [aout] with weight 0.30.
- Last scene is always skipped — it has no outgoing transition.

## BGM ducking
Uses `sidechaincompress` with voice as sidechain trigger:
- `[voiceIdx:a]asplit=2[voice_out][voice_sc]`
- `[bgmIdx:a][voice_sc]sidechaincompress=threshold=0.01:ratio=8:attack=100:release=600:level_in=0.4[bgm_ducked]`
- Final amix: `weights=1.0 1.0 0.30 0.30...`

**Why:** Keeps voice intelligible by automatically reducing BGM when voice is loud. SFX at 0.30 weight — punchy without drowning voice.
