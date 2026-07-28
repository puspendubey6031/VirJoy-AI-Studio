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
  providerUsed: 'Gemini' | 'Groq' | 'Cohere' | 'BuiltInRuleEngine';
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

  const systemInstruction = `You are VirJoy AI Script Engine. Return strictly valid JSON array of ${numScenes} scene objects.
Each scene object MUST have:
- "sceneNumber": integer 1..N
- "duration": integer seconds (average ${avgSceneDuration}s, total must equal ~${targetDurationSeconds}s)
- "visualDescription": string detailed cinematic camera angle and lighting
- "voiceoverText": string engaging spoken narrative (${inputs.language || 'en-US'} ${inputs.voiceTone || 'Energetic'})
- "textOverlay": string short punchy text banner (max 5 words)
- "imagePrompt": string vivid AI image generation prompt in 16:9 or 9:16 aspect ratio
- "stockSearchTerm": string 2-3 word stock photo/video search query
- "transition": string e.g. "fade", "zoom-in", "slide"`;

  const userPrompt = `Generate a ${targetDurationSeconds}-second high-converting AI promotional video script for prompt: "${prompt}".
Product / Inputs: ${JSON.stringify(inputs)}
Aspect Ratio: ${aspectRatio}`;

  // --- 1. PRIMARY PROVIDER: GEMINI ---
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
          modelUsed: 'gemini-2.5-flash'
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
      console.warn('[ScriptProvider] Cohere fallback failed, falling back to BuiltInRuleEngine:', err?.message || err);
    }
  }

  // --- 4. FALLBACK 3: BUILT-IN RULE ENGINE ---
  const defaultScenes: ScriptScene[] = [
    {
      sceneNumber: 1,
      duration: Math.max(3, Math.floor(targetDurationSeconds / numScenes)),
      visualDescription: `Dramatic opening hook featuring product concept: "${prompt}". High contrast 4k studio lighting.`,
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
      transition: 'zoom-in'
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
  ];

  return {
    scenes: defaultScenes,
    providerUsed: 'BuiltInRuleEngine',
    modelUsed: 'rule-based-v2'
  };
}
