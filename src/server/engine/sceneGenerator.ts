import { GoogleGenAI, Type } from '@google/genai';
import { GranularSceneSpec, PromptIntelligenceResult } from './types';

const CAMERA_MOTIONS: GranularSceneSpec['cameraMotion'][] = [
  'zoom_in',
  'pan_right',
  'drone_flyby',
  'static_cinematic',
  'pan_left',
  'zoom_out',
  'handheld_tilt'
];

const TRANSITIONS: GranularSceneSpec['transitionEffect'][] = [
  'fast_wipe',
  'cross_dissolve',
  'glitch_slide',
  'zoom_burst',
  'fade_to_black'
];

const EFFECTS: GranularSceneSpec['visualEffect'][] = [
  'cinematic_color_grade',
  'neon_glow',
  'particle_dust',
  'lens_flare',
  'vignette'
];

export async function generateGranularScenes(
  prompt: string,
  scriptText: string,
  intelligence: PromptIntelligenceResult,
  apiKey?: string
): Promise<GranularSceneSpec[]> {
  const sceneCount = intelligence.recommendedSceneCount;
  const totalDuration = intelligence.recommendedDurationSeconds;
  const perSceneDuration = Math.max(2, Math.round((totalDuration / sceneCount) * 10) / 10);

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Break down this script into ${sceneCount} high-impact video scenes for VirJoy AI.
Script: "${scriptText}"
Visual Style: ${intelligence.visualStyle}
Tone: ${intelligence.tone}
Language: ${intelligence.detectedLanguage}

Generate JSON array of scenes:
Each scene object:
1. sceneNumber (1 to ${sceneCount})
2. durationSeconds (number)
3. narrationText
4. visualPrompt (detailed image/video generation prompt)
5. cameraMotion ("zoom_in", "pan_right", "drone_flyby", "static_cinematic", "pan_left", "zoom_out", "handheld_tilt")
6. transitionEffect ("fast_wipe", "cross_dissolve", "glitch_slide", "zoom_burst", "fade_to_black")
7. visualEffect ("cinematic_color_grade", "neon_glow", "particle_dust", "lens_flare", "vignette")`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.NUMBER },
                durationSeconds: { type: Type.NUMBER },
                narrationText: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
                cameraMotion: { type: Type.STRING },
                transitionEffect: { type: Type.STRING },
                visualEffect: { type: Type.STRING }
              },
              required: [
                'sceneNumber',
                'durationSeconds',
                'narrationText',
                'visualPrompt',
                'cameraMotion',
                'transitionEffect',
                'visualEffect'
              ]
            }
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        let currentTimeCursor = 0;

        return parsed.map((s: any, idx: number) => {
          const dur = s.durationSeconds || perSceneDuration;
          const startTime = currentTimeCursor;
          const endTime = currentTimeCursor + dur;
          currentTimeCursor = endTime;

          return {
            sceneId: `scene_${idx + 1}_${Date.now()}`,
            sceneNumber: idx + 1,
            durationSeconds: dur,
            narrationText: s.narrationText || prompt,
            visualPrompt: s.visualPrompt || `Cinematic shot for ${prompt}`,
            cameraMotion: validateList(s.cameraMotion, CAMERA_MOTIONS, CAMERA_MOTIONS[idx % CAMERA_MOTIONS.length]),
            transitionEffect: validateList(s.transitionEffect, TRANSITIONS, TRANSITIONS[idx % TRANSITIONS.length]),
            visualEffect: validateList(s.visualEffect, EFFECTS, EFFECTS[idx % EFFECTS.length]),
            subtitleStartTime: startTime,
            subtitleEndTime: endTime,
            musicMood: intelligence.suggestedMusicMood
          };
        });
      }
    } catch (err) {
      console.warn('Scene Breakdown AI failed, using modular scene builder:', err);
    }
  }

  // Fallback Modular Scene Builder
  const sentences = scriptText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  const finalScenes: GranularSceneSpec[] = [];
  let currentTimeCursor = 0;

  for (let idx = 0; idx < sceneCount; idx++) {
    const textSnippet = sentences[idx % sentences.length] || `Scene ${idx + 1}: ${prompt}`;
    const dur = perSceneDuration;
    const startTime = currentTimeCursor;
    const endTime = currentTimeCursor + dur;
    currentTimeCursor = endTime;

    finalScenes.push({
      sceneId: `scene_${idx + 1}_${Date.now()}`,
      sceneNumber: idx + 1,
      durationSeconds: dur,
      narrationText: textSnippet,
      visualPrompt: `${intelligence.visualStyle} shot representing "${textSnippet}". High definition 8k cinematic lighting.`,
      cameraMotion: CAMERA_MOTIONS[idx % CAMERA_MOTIONS.length],
      transitionEffect: TRANSITIONS[idx % TRANSITIONS.length],
      visualEffect: EFFECTS[idx % EFFECTS.length],
      subtitleStartTime: startTime,
      subtitleEndTime: endTime,
      musicMood: intelligence.suggestedMusicMood
    });
  }

  return finalScenes;
}

function validateList<T>(val: any, validList: T[], fallback: T): T {
  if (validList.includes(val as T)) return val as T;
  return fallback;
}
