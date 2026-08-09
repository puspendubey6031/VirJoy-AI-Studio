import { GoogleGenAI } from '@google/genai';
import { runWithFallback, type FallbackProvider } from './providerFallback.js';

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  style?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  providerUsed: 'GeminiImage' | 'GroqImage' | 'HuggingFaceFLUX' | 'HuggingFaceSDXL' | 'PollinationsAI';
  modelUsed: string;
}

/**
 * Image Provider — Fallback Order:
 * 1. Gemini Imagen          (if GEMINI_API_KEY configured)
 * 2. Groq Image             (if GROQ_API_KEY configured)
 * 3. Hugging Face FLUX.1    (if HUGGINGFACE_API_KEY configured)
 * 4. Hugging Face SDXL-Turbo
 * 5. Hugging Face Hyper-SD
 * 6. Pollinations AI        (zero-key, always available — guaranteed last resort)
 *
 * Logo/thumbnail generation routes through this same chain.
 */
export async function generateImageWithFallback(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const { prompt, width = 1280, height = 720, aspectRatio = '16:9', style = 'photorealistic' } = options;
  const fullPrompt = `${prompt}, ${style} style, 4k resolution, cinematic lighting, masterpiece`;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY || process.env.GROQ_IMAGE_KEY;
  const hfKey     = process.env.HUGGINGFACE_API_KEY;

  type R = ImageGenerationResult;
  const chain: FallbackProvider<R>[] = [];

  // 1. Gemini Imagen
  if (geminiKey) {
    chain.push({
      name: 'GeminiImage',
      timeoutMs: 30_000,
      run: async () => {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: fullPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio === '9:16' ? '9:16' : aspectRatio === '1:1' ? '1:1' : '16:9'
          }
        });
        const base64Data = response.generatedImages?.[0]?.image?.imageBytes;
        if (!base64Data) throw new Error('Gemini Imagen returned no image bytes');
        return { imageUrl: `data:image/jpeg;base64,${base64Data}`, providerUsed: 'GeminiImage', modelUsed: 'imagen-3.0-generate-002' };
      }
    });
  }

  // 2. Groq Image
  if (groqKey) {
    chain.push({
      name: 'GroqImage',
      timeoutMs: 20_000,
      run: async () => {
        const res = await fetch('https://api.groq.com/openai/v1/images/generations', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt, n: 1, size: `${width}x${height}` })
        });
        if (!res.ok) throw new Error(`Groq Image HTTP ${res.status}`);
        const data = await res.json();
        const url: string = data.data?.[0]?.url || data.data?.[0]?.b64_json || '';
        if (!url) throw new Error('Groq Image returned no URL');
        return {
          imageUrl: url.startsWith('http') || url.startsWith('data:') ? url : `data:image/jpeg;base64,${url}`,
          providerUsed: 'GroqImage',
          modelUsed: 'groq-image-gen'
        };
      }
    });
  }

  // 3-5. Hugging Face models (tried in order; each has short timeout for fast fallthrough)
  if (hfKey) {
    const hfModels = [
      { providerUsed: 'HuggingFaceFLUX' as const, name: 'HF-FLUX.1-schnell', model: 'FLUX.1-schnell', endpoint: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell' },
      { providerUsed: 'HuggingFaceSDXL' as const, name: 'HF-SDXL-Turbo',    model: 'SDXL-Turbo',    endpoint: 'https://api-inference.huggingface.co/models/stabilityai/sdxl-turbo' },
      { providerUsed: 'HuggingFaceFLUX' as const, name: 'HF-Hyper-SD',       model: 'Hyper-SD',       endpoint: 'https://api-inference.huggingface.co/models/ByteDance/Hyper-SD' }
    ];

    for (const hf of hfModels) {
      chain.push({
        name: hf.name,
        timeoutMs: 15_000,
        run: async () => {
          const res = await fetch(hf.endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: fullPrompt }),
            signal: AbortSignal.timeout(12_000)
          });
          if (!res.ok) throw new Error(`${hf.name} HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          if (!base64 || base64.length < 100) throw new Error(`${hf.name} returned empty image`);
          return { imageUrl: `data:image/jpeg;base64,${base64}`, providerUsed: hf.providerUsed, modelUsed: hf.model };
        }
      });
    }
  }

  // 6. Pollinations AI — zero-key, always succeeds (guaranteed last resort)
  const widthParam  = aspectRatio === '9:16' ? 720  : aspectRatio === '1:1' ? 1024 : 1280;
  const heightParam = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 1024 : 720;
  const seed = Math.floor(Math.random() * 1_000_000);
  const cleanPrompt = prompt.substring(0, 120).replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${widthParam}&height=${heightParam}&seed=${seed}&nologo=true&model=flux`;

  chain.push({
    name: 'PollinationsAI',
    timeoutMs: 5_000, // URL construction — no network call needed
    run: async () => ({ imageUrl: pollinationsUrl, providerUsed: 'PollinationsAI', modelUsed: 'flux-pollinations' })
  });

  const { result } = await runWithFallback<R>('image', chain, 30_000);
  return result;
}
