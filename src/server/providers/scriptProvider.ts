import { GoogleGenAI } from '@google/genai';
import { runWithFallback, type FallbackProvider } from './providerFallback.js';
import { generateTextWithOpenRouter, isOpenRouterConfigured } from './openRouterProvider.js';

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
  providerUsed: 'Gemini' | 'Groq' | 'Cohere' | 'Mistral' | 'OpenRouter' | 'BuiltInRuleEngine';
  modelUsed: string;
}

// ── Scene normaliser (shared by all providers) ────────────────────────────────
function normaliseScenes(
  raw: any[],
  avgSceneDuration: number,
  prompt: string
): ScriptScene[] {
  return raw.map((s: any, idx: number) => ({
    sceneNumber: s.sceneNumber || idx + 1,
    duration: s.duration || avgSceneDuration,
    visualDescription: s.visualDescription || `Cinematic shot for ${prompt}`,
    voiceoverText: s.voiceoverText || `Discover ${prompt}`,
    textOverlay: s.textOverlay || prompt.substring(0, 20),
    imagePrompt: s.imagePrompt || `4k studio lighting photo of ${prompt}`,
    stockSearchTerm: s.stockSearchTerm || prompt.split(' ')[0] || 'product',
    transition: s.transition || 'fade'
  }));
}

function parseSceneArray(text: string): any[] | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    // Some models wrap in an object
    const inner = parsed?.scenes || parsed?.script || [];
    if (Array.isArray(inner) && inner.length > 0) return inner;
    return null;
  } catch {
    return null;
  }
}

/**
 * Script Provider — Fallback Order:
 * 1. Gemini (primary, if GEMINI_API_KEY configured)
 * 2. Groq   (if GROQ_API_KEY configured)
 * 3. Cohere (if COHERE_API_KEY configured)
 * 4. Mistral (if MISTRAL_API_KEY configured)
 * 5. OpenRouter (if OPENROUTER_API_KEY configured)
 * 6. BuiltInRuleEngine (always present — guaranteed last resort)
 */
export async function generateScriptWithFallback(
  options: ScriptGenerationOptions
): Promise<ScriptGenerationResult> {
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
- "textOverlay": string subtitle caption in Subtitle Language (${subLang})
- "imagePrompt": string vivid AI image generation prompt in 16:9 or 9:16 aspect ratio
- "stockSearchTerm": string 2-3 word stock photo/video search query
- "transition": string e.g. "fade", "zoom-in", "slide"`;

  const userPrompt = `Generate a ${targetDurationSeconds}-second high-converting AI promotional video script for: "${prompt}".
Product / Inputs: ${JSON.stringify(inputs)}
Aspect Ratio: ${aspectRatio}
Return JSON ONLY without markdown backticks.`;

  // ── Build provider chain dynamically ────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;
  const cohereKey = process.env.COHERE_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  type R = ScriptGenerationResult;
  const chain: FallbackProvider<R>[] = [];

  // 1. Gemini
  if (geminiKey) {
    chain.push({
      name: 'Gemini',
      timeoutMs: 30_000,
      run: async () => {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemInstruction}\n\n${userPrompt}`
        });
        const scenes = parseSceneArray(response.text || '');
        if (!scenes) throw new Error('Gemini returned no valid scene array');
        return { scenes: normaliseScenes(scenes, avgSceneDuration, prompt), providerUsed: 'Gemini', modelUsed: 'gemini-2.5-flash' };
      }
    });
  }

  // 2. Groq
  if (groqKey) {
    chain.push({
      name: 'Groq',
      timeoutMs: 25_000,
      run: async () => {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
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
        if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
        const data = await res.json();
        const scenes = parseSceneArray(data.choices?.[0]?.message?.content || '');
        if (!scenes) throw new Error('Groq returned no valid scene array');
        return { scenes: normaliseScenes(scenes, avgSceneDuration, prompt), providerUsed: 'Groq', modelUsed: 'llama-3.3-70b-versatile' };
      }
    });
  }

  // 3. Cohere
  if (cohereKey) {
    chain.push({
      name: 'Cohere',
      timeoutMs: 25_000,
      run: async () => {
        const res = await fetch('https://api.cohere.com/v2/chat', {
          method: 'POST',
          headers: { Authorization: `Bearer ${cohereKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'command-r-plus',
            messages: [
              { role: 'system', content: `${systemInstruction} Output valid JSON array only.` },
              { role: 'user', content: userPrompt }
            ]
          })
        });
        if (!res.ok) throw new Error(`Cohere HTTP ${res.status}`);
        const data = await res.json();
        const scenes = parseSceneArray(data.message?.content?.[0]?.text || '');
        if (!scenes) throw new Error('Cohere returned no valid scene array');
        return { scenes: normaliseScenes(scenes, avgSceneDuration, prompt), providerUsed: 'Cohere', modelUsed: 'command-r-plus' };
      }
    });
  }

  // 4. Mistral
  if (mistralKey) {
    chain.push({
      name: 'Mistral',
      timeoutMs: 25_000,
      run: async () => {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${mistralKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [
              { role: 'system', content: `${systemInstruction} Return JSON array only.` },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
          })
        });
        if (!res.ok) throw new Error(`Mistral HTTP ${res.status}`);
        const data = await res.json();
        const scenes = parseSceneArray(data.choices?.[0]?.message?.content || '');
        if (!scenes) throw new Error('Mistral returned no valid scene array');
        return { scenes: normaliseScenes(scenes, avgSceneDuration, prompt), providerUsed: 'Mistral', modelUsed: 'mistral-small-latest' };
      }
    });
  }

  // 5. OpenRouter (text operations only)
  if (isOpenRouterConfigured()) {
    chain.push({
      name: 'OpenRouter',
      timeoutMs: 30_000,
      run: async () => {
        const { content } = await generateTextWithOpenRouter({
          systemPrompt: `${systemInstruction} Return JSON array only, no markdown.`,
          userPrompt,
          timeoutMs: 28_000
        });
        const scenes = parseSceneArray(content);
        if (!scenes) throw new Error('OpenRouter returned no valid scene array');
        return { scenes: normaliseScenes(scenes, avgSceneDuration, prompt), providerUsed: 'OpenRouter' as const, modelUsed: 'meta-llama/llama-3.1-8b-instruct:free' };
      }
    });
  }

  // 6. BuiltInRuleEngine — guaranteed last resort (no timeout risk, pure local)
  chain.push({
    name: 'BuiltInRuleEngine',
    timeoutMs: 5_000,
    run: async () => ({
      scenes: [
        {
          sceneNumber: 1,
          duration: Math.max(3, Math.floor(targetDurationSeconds / numScenes)),
          visualDescription: `Dramatic opening hook: "${prompt}". High contrast 4k studio lighting.`,
          voiceoverText: `Are you ready for the ultimate experience? Introducing ${prompt.substring(0, 30)}!`,
          textOverlay: 'REVOLUTIONARY',
          imagePrompt: `High resolution 4k studio commercial banner for ${prompt}`,
          stockSearchTerm: 'technology product',
          transition: 'fade'
        },
        {
          sceneNumber: 2,
          duration: Math.max(3, Math.ceil(targetDurationSeconds / numScenes)),
          visualDescription: `Close-up demonstrating key benefits of ${prompt}. Modern dynamic motion.`,
          voiceoverText: 'Engineered with precision and premium quality to elevate your daily workflow.',
          textOverlay: 'PREMIUM QUALITY',
          imagePrompt: `Sleek minimalist product showcase of ${prompt}`,
          stockSearchTerm: 'lifestyle professional',
          transition: 'zoom-in'
        },
        {
          sceneNumber: 3,
          duration: Math.max(3, Math.floor(targetDurationSeconds / numScenes)),
          visualDescription: 'Call-to-action scene with vibrant background particles and branding.',
          voiceoverText: "Don't wait! Get yours today with exclusive limited-time launch offers.",
          textOverlay: 'SPECIAL OFFER - BUY NOW',
          imagePrompt: `Modern promotional banner with call to action for ${prompt}`,
          stockSearchTerm: 'celebration offer',
          transition: 'slide'
        }
      ],
      providerUsed: 'BuiltInRuleEngine' as const,
      modelUsed: 'rule-based-v2'
    })
  });

  const { result } = await runWithFallback<R>('script', chain, 30_000);
  return result;
}
