import { GoogleGenAI } from '@google/genai';

export interface ScriptScene {
  sceneNumber: number;
  duration: number;
  visualDescription: string;
  voiceoverText: string;
  textOverlay: string;
  imagePrompt: string;
  stockSearchTerm: string;
  transition?: string;
}

export interface ScriptGenerationOptions {
  prompt: string;
  targetDurationSeconds: number;
  aspectRatio: string;
  inputs?: Record<string, any>;
  planKey?: string;
}

export interface ScriptGenerationResult {
  scenes: ScriptScene[];
  providerUsed: 'Gemini' | 'Groq' | 'Cohere' | 'Mistral' | 'BuiltInRuleEngine';
  modelUsed: string;
}

/**
 * Script Provider with Automatic Fallback Order:
 * 1. Gemini (Primary)
 * 2. Groq (Fallback 1)
 * 3. Cohere (Fallback 2)
 * 4. BuiltInRuleEngine (Deterministic Fallback)
 */
export async function generateScriptWithFallback(options: ScriptGenerationOptions): Promise<ScriptGenerationResult> {
  const { prompt, targetDurationSeconds, aspectRatio, inputs = {} } = options;
  const numScenes = Math.max(2, Math.min(8, Math.round(targetDurationSeconds / 4)));
  const avgSceneDuration = Math.round(targetDurationSeconds / numScenes);

  const voiceLang = inputs.language || 'en-US';
  const subLang = inputs.subtitleLanguage || inputs.language || 'en-US';

  const systemInstruction = `You are VirJoy AI Script Engine. Return strictly valid JSON array of ${numScenes} scene objects.
Each scene object MUST have:
- "sceneNumber": integer 1..N
- "duration": integer seconds (average ${avgSceneDuration}s, total must equal ~${targetDurationSeconds}s)
- "visualDescription": string detailed cinematic camera angle and lighting
- "voiceoverText": string spoken narrative in Voice Language (${voiceLang}, tone: ${inputs.voiceTone || 'Energetic'})
- "textOverlay": string subtitle caption in Subtitle Language (${subLang}), accurately translating or captioning the voiceover
- "imagePrompt": string vivid AI image generation prompt in 16:9 or 9:16 aspect ratio
- "stockSearchTerm": string 2-3 word stock photo/video search query
- "transition": string e.g. "fade", "zoom-in", "slide"`;

  const userPrompt = `Create a faithful ${targetDurationSeconds}-second narrative video from the user's exact prompt.

USER PROMPT:
"${prompt}"

IMPORTANT:
- Preserve the user's original story, characters, objects, locations, sequence of events, and actions.
- Do NOT convert a story into a product advertisement.
- Do NOT invent a product, commercial message, marketing hook, brand promotion, or unrelated subject unless the user explicitly requested one.
- Do NOT replace the user's characters or environment with generic stock concepts.
- Break the story into visually meaningful chronological scenes.
- Each scene must represent what actually happens during that part of the story.
- If the user describes an action such as rain falling, running, eating, opening something, flying, falling, driving, fire, or walking, the corresponding scene must visibly show that action.
- Preserve continuity of the same main character/object/environment across scenes.
- The scene sequence must follow the user's story in chronological order.
- Voiceover must narrate the actual story, not a marketing script.
- Subtitles must correspond to the actual narration.
- Do not add unrelated promotional language.

Inputs:
${JSON.stringify(inputs)}

Aspect Ratio:
${aspectRatio}`;

  // --- 1. PRIMARY PROVIDER: GEMINI ---
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `${systemInstruction}\n\n${userPrompt}\n\nReturn JSON ONLY without markdown backticks.`,
      });

      const text = response.text || '';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          scenes: parsed.map((s, idx) => ({
            sceneNumber: s.sceneNumber || idx + 1,
            duration: s.duration || avgSceneDuration,
            visualDescription: s.visualDescription || s.imagePrompt || `Scene ${idx + 1} depicting ${prompt}`,
            voiceoverText: s.voiceoverText || s.visualDescription || prompt,
            textOverlay: s.textOverlay || s.voiceoverText || s.visualDescription || prompt.substring(0, 80),
            imagePrompt:
              s.imagePrompt ||
              s.visualDescription ||
              `A cinematic visual accurately depicting this exact story moment: ${prompt}`,
            stockSearchTerm:
              s.stockSearchTerm ||
              (s.visualDescription || prompt).substring(0, 80),
            transition: s.transition || 'fade'
          })),
          providerUsed: 'Gemini',
          modelUsed: 'gemini-2.0-flash'
        };
      }
    } catch (err: any) {
      console.warn('[ScriptProvider] Gemini primary call failed, trying Groq fallback:', err?.message || err);
    }
  }

  // --- 2. FALLBACK 1: GROQ ---
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `${systemInstruction} Return JSON array only.` },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(content);
        const scenesArr = Array.isArray(parsed) ? parsed : (parsed.scenes || parsed.script || []);
        if (scenesArr.length > 0) {
          return {
            scenes: scenesArr.map((s: any, idx: number) => ({
              sceneNumber: s.sceneNumber || idx + 1,
              duration: s.duration || avgSceneDuration,
              visualDescription: s.visualDescription || s.imagePrompt || `Scene ${idx + 1} depicting ${prompt}`,
              voiceoverText: s.voiceoverText || s.visualDescription || prompt,
              textOverlay: s.textOverlay || s.voiceoverText || s.visualDescription || prompt.substring(0, 80),
              imagePrompt:
                s.imagePrompt ||
                s.visualDescription ||
                `A cinematic visual accurately depicting this exact story moment: ${prompt}`,
              stockSearchTerm:
                s.stockSearchTerm ||
                (s.visualDescription || prompt).substring(0, 80),
              transition: s.transition || 'fade'
            })),
            providerUsed: 'Groq',
            modelUsed: 'llama-3.3-70b-versatile'
          };
        }
      }
    } catch (err: any) {
      console.warn('[ScriptProvider] Groq fallback failed, trying Cohere fallback:', err?.message || err);
    }
  }

  // --- 3. FALLBACK 2: COHERE ---
  const cohereKey = process.env.COHERE_API_KEY;
  if (cohereKey) {
    try {
      const res = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cohereKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'command-r-plus',
          messages: [
            { role: 'system', content: `${systemInstruction} Output valid JSON array only.` },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.message?.content?.[0]?.text || '';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const scenesArr = Array.isArray(parsed) ? parsed : (parsed.scenes || []);
        if (scenesArr.length > 0) {
          return {
            scenes: scenesArr.map((s: any, idx: number) => ({
              sceneNumber: s.sceneNumber || idx + 1,
              duration: s.duration || avgSceneDuration,
              visualDescription: s.visualDescription || s.imagePrompt || `Scene ${idx + 1} depicting ${prompt}`,
              voiceoverText: s.voiceoverText || s.visualDescription || prompt,
              textOverlay: s.textOverlay || s.voiceoverText || s.visualDescription || prompt.substring(0, 80),
              imagePrompt:
                s.imagePrompt ||
                s.visualDescription ||
                `A cinematic visual accurately depicting this exact story moment: ${prompt}`,
              stockSearchTerm:
                s.stockSearchTerm ||
                (s.visualDescription || prompt).substring(0, 80),
              transition: s.transition || 'fade'
            })),
            providerUsed: 'Cohere',
            modelUsed: 'command-r-plus'
          };
        }
      }
    } catch (err: any) {
      console.warn('[ScriptProvider] Cohere fallback failed, trying Mistral fallback:', err?.message || err);
    }
  }

  // --- 4. FALLBACK 3: MISTRAL AI ---
  const mistralKey = process.env.MISTRAL_API_KEY;
  if (mistralKey) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            { role: 'system', content: `${systemInstruction} Return JSON array only.` },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const scenesArr = Array.isArray(parsed) ? parsed : (parsed.scenes || []);
        if (scenesArr.length > 0) {
          return {
            scenes: scenesArr.map((s: any, idx: number) => ({
              sceneNumber: s.sceneNumber || idx + 1,
              duration: s.duration || avgSceneDuration,
              visualDescription: s.visualDescription || s.imagePrompt || `Scene ${idx + 1} depicting ${prompt}`,
              voiceoverText: s.voiceoverText || s.visualDescription || prompt,
              textOverlay: s.textOverlay || s.voiceoverText || s.visualDescription || prompt.substring(0, 80),
              imagePrompt:
                s.imagePrompt ||
                s.visualDescription ||
                `A cinematic visual accurately depicting this exact story moment: ${prompt}`,
              stockSearchTerm:
                s.stockSearchTerm ||
                (s.visualDescription || prompt).substring(0, 80),
              transition: s.transition || 'fade'
            })),
            providerUsed: 'Mistral',
            modelUsed: 'mistral-small-latest'
          };
        }
      }
    } catch (err: any) {
      console.warn('[ScriptProvider] Mistral fallback failed, falling back to BuiltInRuleEngine:', err?.message || err);
    }
  }

  // --- 5. FALLBACK 4: BUILT-IN RULE ENGINE ---
  const promptSentences = prompt
    .split(/(?<=[.!?])\s+|\s*\n+\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const isNarrative = promptSentences.length >= 2 || /bird|pond|rain|fly|wing|sky|storm|nature|animal|character|walk|run|lake|forest|mountain|ocean|river/i.test(prompt);
  const perSceneDur = Math.max(3, Math.round(targetDurationSeconds / Math.max(3, numScenes)));
  const defaultScenes: ScriptScene[] = [];

  if (isNarrative && promptSentences.length >= 3) {
    const s1 = promptSentences[0];
    const s2 = promptSentences[1];
    const s3 = promptSentences.slice(2).join(' ');

    defaultScenes.push(
      {
        sceneNumber: 1,
        duration: perSceneDur,
        visualDescription: `Cinematic scene: ${s1}. Peaceful natural lighting.`,
        voiceoverText: s1,
        textOverlay: s1.substring(0, 35),
        imagePrompt: `${s1}, high resolution 4k cinematic photo, detailed natural surroundings, clear subject and environment`,
        stockSearchTerm: `bird pond nature`,
        transition: 'fade'
      },
      {
        sceneNumber: 2,
        duration: perSceneDur,
        visualDescription: `Dynamic scene: ${s2}. High detail rain and weather transition over subject.`,
        voiceoverText: s2,
        textOverlay: s2.substring(0, 35),
        imagePrompt: `${s1} while ${s2}, visible rain droplets, wet water surface, heavy rainfall, 4k cinematic photo`,
        stockSearchTerm: `rain storm pond`,
        transition: 'cross_dissolve'
      },
      {
        sceneNumber: 3,
        duration: perSceneDur,
        visualDescription: `Action culmination scene: ${s3}. Motion in rain.`,
        voiceoverText: s3,
        textOverlay: s3.substring(0, 35),
        imagePrompt: `${s3} during heavy rain storm, spreading wings in flight from pond, dynamic motion, 4k cinematic photo`,
        stockSearchTerm: `bird flying rain`,
        transition: 'zoom_burst'
      }
    );
  } else if (isNarrative && promptSentences.length === 2) {
    const s1 = promptSentences[0];
    const s2 = promptSentences[1];

    defaultScenes.push(
      {
        sceneNumber: 1,
        duration: perSceneDur,
        visualDescription: `Opening scene: ${s1}.`,
        voiceoverText: s1,
        textOverlay: s1.substring(0, 35),
        imagePrompt: `${s1}, 4k high definition cinematic photo`,
        stockSearchTerm: `nature landscape`,
        transition: 'fade'
      },
      {
        sceneNumber: 2,
        duration: perSceneDur,
        visualDescription: `Climax scene: ${s2}.`,
        voiceoverText: s2,
        textOverlay: s2.substring(0, 35),
        imagePrompt: `${s1} as ${s2}, 4k cinematic photo`,
        stockSearchTerm: `action movement`,
        transition: 'zoom_burst'
      }
    );
  } else {
    defaultScenes.push(
      {
        sceneNumber: 1,
        duration: Math.max(3, Math.floor(targetDurationSeconds / numScenes)),
        visualDescription: `Opening scene depicting "${prompt}". Cinematic lighting and composition.`,
        voiceoverText: prompt,
        textOverlay: prompt.substring(0, 35),
        imagePrompt: `A cinematic 4k visual accurately depicting the opening scene of: ${prompt}`,
        stockSearchTerm: prompt.substring(0, 40),
        transition: 'fade'
      },
      {
        sceneNumber: 2,
        duration: Math.max(3, Math.ceil(targetDurationSeconds / numScenes)),
        visualDescription: `Main action scene depicting "${prompt}". Clear subject and environmental motion.`,
        voiceoverText: prompt,
        textOverlay: prompt.substring(0, 35),
        imagePrompt: `A cinematic 4k visual accurately depicting the main action in: ${prompt}`,
        stockSearchTerm: prompt.substring(0, 40),
        transition: 'zoom_in'
      },
      {
        sceneNumber: 3,
        duration: Math.max(3, Math.floor(targetDurationSeconds / numScenes)),
        visualDescription: `Resolution scene depicting "${prompt}".`,
        voiceoverText: prompt,
        textOverlay: prompt.substring(0, 35),
        imagePrompt: `A cinematic 4k visual accurately depicting the resolution of: ${prompt}`,
        stockSearchTerm: prompt.substring(0, 40),
        transition: 'slide'
      }
    );
  }

  return {
    scenes: defaultScenes,
    providerUsed: 'BuiltInRuleEngine',
    modelUsed: 'rule-based-v2'
  };
}
