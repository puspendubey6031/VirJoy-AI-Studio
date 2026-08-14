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

  const userPrompt = `Generate a ${targetDurationSeconds}-second high-converting AI promotional video script for prompt: "${prompt}".
Product / Inputs: ${JSON.stringify(inputs)}
Aspect Ratio: ${aspectRatio}`;

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
            visualDescription: s.visualDescription || `Cinematic shot for ${prompt}`,
            voiceoverText: s.voiceoverText || `Discover ${prompt}`,
            textOverlay: s.textOverlay || prompt.substring(0, 20),
            imagePrompt: s.imagePrompt || `4k studio lighting photo of ${prompt}`,
            stockSearchTerm: s.stockSearchTerm || prompt.split(' ')[0] || 'product',
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
              visualDescription: s.visualDescription || `Scene ${idx + 1} for ${prompt}`,
              voiceoverText: s.voiceoverText || prompt,
              textOverlay: s.textOverlay || 'VirJoy AI',
              imagePrompt: s.imagePrompt || `High resolution scene for ${prompt}`,
              stockSearchTerm: s.stockSearchTerm || 'commercial',
              transition: 'fade'
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
              visualDescription: s.visualDescription || `Scene ${idx + 1}`,
              voiceoverText: s.voiceoverText || prompt,
              textOverlay: s.textOverlay || 'VirJoy AI',
              imagePrompt: s.imagePrompt || `Professional visual for ${prompt}`,
              stockSearchTerm: s.stockSearchTerm || 'video',
              transition: 'fade'
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
              visualDescription: s.visualDescription || `Scene ${idx + 1} for ${prompt}`,
              voiceoverText: s.voiceoverText || prompt,
              textOverlay: s.textOverlay || 'VirJoy AI',
              imagePrompt: s.imagePrompt || `High resolution scene for ${prompt}`,
              stockSearchTerm: s.stockSearchTerm || 'commercial',
              transition: 'fade'
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
        visualDescription: `Dramatic opening hook featuring: "${prompt}". High contrast 4k studio lighting.`,
        voiceoverText: `Are you ready for the ultimate experience? Introducing ${prompt.substring(0, 30)}!`,
        textOverlay: `REVOLUTIONARY`,
        imagePrompt: `High resolution 4k studio commercial banner for ${prompt}`,
        stockSearchTerm: `technology product`,
        transition: 'fade'
      },
      {
        sceneNumber: 2,
        duration: Math.max(3, Math.ceil(targetDurationSeconds / numScenes)),
        visualDescription: `Close-up view demonstrating key benefits and features of ${prompt}. Modern dynamic motion.`,
        voiceoverText: `Engineered with precision and premium quality to elevate your daily workflow seamlessly.`,
        textOverlay: `PREMIUM QUALITY`,
        imagePrompt: `Sleek minimalist product showcase of ${prompt}`,
        stockSearchTerm: `lifestyle professional`,
        transition: 'zoom_in'
      },
      {
        sceneNumber: 3,
        duration: Math.max(3, Math.floor(targetDurationSeconds / numScenes)),
        visualDescription: `Call to action scene with vibrant background particles, company branding, and special discount badge.`,
        voiceoverText: `Don't wait! Get yours today with exclusive limited-time launch offers available now.`,
        textOverlay: `SPECIAL OFFER - BUY NOW`,
        imagePrompt: `Modern promotional banner with call to action for ${prompt}`,
        stockSearchTerm: `celebration offer`,
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
