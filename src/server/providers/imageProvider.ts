import { GoogleGenAI } from '@google/genai';

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
 * Image Provider with Automatic Fallback Order:
 * 1. Gemini Imagen / Image Model
 * 2. Groq Image (if key available)
 * 3. Hugging Face (FLUX.1-schnell / SDXL / Hyper-SD)
 * 4. Pollinations AI (Fallback - zero key required, reliable image server)
 */
export async function generateImageWithFallback(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const { prompt, width = 1280, height = 720, aspectRatio = '16:9', style = 'photorealistic' } = options;
  const fullPrompt = `${prompt}, ${style} style, 4k resolution, cinematic lighting, masterpiece`;

  // --- 1. PRIMARY: GEMINI IMAGE (IMAGEN) ---
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
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
      if (base64Data) {
        return {
          imageUrl: `data:image/jpeg;base64,${base64Data}`,
          providerUsed: 'GeminiImage',
          modelUsed: 'imagen-3.0-generate-002'
        };
      }
    } catch (err: any) {
      console.warn('[ImageProvider] Gemini Imagen failed, trying Groq/HuggingFace fallback:', err?.message || err);
    }
  }

  // --- 2. FALLBACK 1: GROQ IMAGE (IF KEY / ENDPOINT AVAILABLE) ---
  const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_IMAGE_KEY;
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          n: 1,
          size: `${width}x${height}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.data?.[0]?.url || data.data?.[0]?.b64_json;
        if (url) {
          return {
            imageUrl: url.startsWith('http') || url.startsWith('data:') ? url : `data:image/jpeg;base64,${url}`,
            providerUsed: 'GroqImage',
            modelUsed: 'groq-image-gen'
          };
        }
      }
    } catch (err: any) {
      console.warn('[ImageProvider] Groq Image failed, trying HuggingFace fallback:', err?.message || err);
    }
  }

  // --- 3. FALLBACK 2: HUGGING FACE (FLUX.1-schnell / SDXL) ---
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (hfKey) {
    const hfModels = [
      { name: 'FLUX.1-schnell', endpoint: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell' },
      { name: 'SDXL-Turbo', endpoint: 'https://api-inference.huggingface.co/models/stabilityai/sdxl-turbo' },
      { name: 'Hyper-SD', endpoint: 'https://api-inference.huggingface.co/models/ByteDance/Hyper-SD' }
    ];

    for (const hf of hfModels) {
      try {
        const res = await fetch(hf.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: fullPrompt })
        });

        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          if (base64 && base64.length > 100) {
            return {
              imageUrl: `data:image/jpeg;base64,${base64}`,
              providerUsed: 'HuggingFaceFLUX',
              modelUsed: hf.name
            };
          }
        }
      } catch (err: any) {
        console.warn(`[ImageProvider] Hugging Face model ${hf.name} failed:`, err?.message || err);
      }
    }
  }

  // --- 4. FALLBACK 3: POLLINATIONS AI (ALWAYS RELIABLE ZERO-KEY FALLBACK) ---
  const widthParam = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 1024 : 1280;
  const heightParam = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 1024 : 720;
  const seed = Math.floor(Math.random() * 1000000);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${widthParam}&height=${heightParam}&seed=${seed}&nologo=true&model=flux`;

  return {
    imageUrl: pollinationsUrl,
    providerUsed: 'PollinationsAI',
    modelUsed: 'flux-pollinations'
  };
}
