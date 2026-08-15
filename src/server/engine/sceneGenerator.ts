import { GoogleGenAI, Type } from '@google/genai';
import type { GranularSceneSpec, PromptIntelligenceResult } from './types.js';

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

  const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Break down the supplied narrative into chronological cinematic scenes.

The original user story is:
"${prompt}"

The generated script is:
"${scriptText}"

Visual Style: ${intelligence.visualStyle}
Tone: ${intelligence.tone}
Language: ${intelligence.detectedLanguage}

For EVERY scene:
- Identify the exact subject.
- Identify the exact location/environment.
- Identify the exact action occurring at that moment.
- Describe the visible state of the environment.
- Describe motion/action explicitly.
- Preserve character/object identity and visual continuity from previous scenes.
- Do NOT summarize multiple actions into one generic image.
- Do NOT output generic subject-only prompts.

Examples:
If the story says:
"A bird sits beside a pond."

visualPrompt MUST describe:
"A small bird sitting beside a clearly visible pond..."

If the story says:
"Heavy rain starts falling."

visualPrompt MUST describe:
"The SAME small bird beside the SAME pond while heavy rain is visibly falling, many visible raindrops, wet surroundings, rain ripples on the pond..."

If the story says:
"The bird spreads its wings and flies away."

visualPrompt MUST describe:
"The SAME bird spreading its wings and flying away from the pond, wings visibly extended, bird airborne, rain still falling..."

The visualPrompt must describe what must actually be visible in the generated image.

Never return:
"bird"
"bird near water"
"nature"
"cinematic landscape"
"beautiful scenery"

when the scene requires a specific action.

Return valid JSON only.`,
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
            visualPrompt: s.visualPrompt || `${prompt}. Show the exact subject, location, environment, and action described in this scene.`,
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
      visualPrompt: `${textSnippet}. Show the exact subject, location, environment, and ACTION described in this scene. If the text describes rain, visibly show falling raindrops and wet surfaces. If it describes flying, visibly show the subject airborne with wings/body in the correct flying position. If it describes running, visibly show the subject running. Preserve the same main subject and environment across scenes. Cinematic realistic composition, clear action, detailed environment.`,
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
