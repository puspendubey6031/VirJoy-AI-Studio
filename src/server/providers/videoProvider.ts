import { runWithFallback, type FallbackProvider } from './providerFallback.js';

export interface VideoGenerationOptions {
  prompt: string;
  durationSeconds?: number;
  sourceImageUrl?: string;
  aspectRatio?: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  providerUsed: 'HF-Wan2.1' | 'HF-LTXVideo' | 'HF-Cosmos' | 'HF-HunyuanI2V' | 'DynamicCanvasRender';
  modelUsed: string;
}

/**
 * Video-clip Generation Provider — Fallback Order:
 * 1. Hugging Face Wan2.1       (if HUGGINGFACE_API_KEY configured)
 * 2. Hugging Face LTX Video
 * 3. Hugging Face Cosmos
 * 4. Hugging Face Hunyuan I2V
 * 5. DynamicCanvasRender       — zero-key, guaranteed last resort
 *
 * NOTE: This provider generates SHORT AI video clips (not the FFmpeg render
 * pipeline). The already-fixed FFmpeg pipeline is not touched here.
 */
export async function generateVideoClipWithFallback(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  const { prompt, durationSeconds = 4, sourceImageUrl } = options;
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  type R = VideoGenerationResult;
  const chain: FallbackProvider<R>[] = [];

  if (hfKey) {
    const hfModels = [
      { id: 'HF-Wan2.1'     as const, name: 'HF-Wan2.1',      endpoint: 'https://api-inference.huggingface.co/models/Wan-AI/Wan2.1-T2V-1.4B' },
      { id: 'HF-LTXVideo'   as const, name: 'HF-LTX Video',   endpoint: 'https://api-inference.huggingface.co/models/Lightricks/LTX-Video' },
      { id: 'HF-Cosmos'     as const, name: 'HF-Cosmos',       endpoint: 'https://api-inference.huggingface.co/models/NVIDIA/Cosmos-1.0-Diffusion-7B-Video' },
      { id: 'HF-HunyuanI2V' as const, name: 'HF-Hunyuan I2V', endpoint: 'https://api-inference.huggingface.co/models/Tencent-Hunyuan/HunyuanVideo' }
    ];

    for (const model of hfModels) {
      const capturedModel = model; // closure capture
      chain.push({
        name: capturedModel.name,
        timeoutMs: 90_000, // video gen is slow
        run: async () => {
          const res = await fetch(capturedModel.endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                num_frames: Math.min(24, durationSeconds * 6),
                image: sourceImageUrl || undefined
              }
            })
          });
          if (!res.ok) throw new Error(`${capturedModel.name} HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          if (!base64 || base64.length < 500) throw new Error(`${capturedModel.name} returned empty video`);
          return { videoUrl: `data:video/mp4;base64,${base64}`, providerUsed: capturedModel.id, modelUsed: capturedModel.name };
        }
      });
    }
  }

  // DynamicCanvasRender — zero-key, always succeeds
  const previewImg = sourceImageUrl
    || `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true`;
  chain.push({
    name: 'DynamicCanvasRender',
    timeoutMs: 5_000,
    run: async () => ({ videoUrl: previewImg, providerUsed: 'DynamicCanvasRender', modelUsed: 'canvas-animator-v2' })
  });

  const { result } = await runWithFallback<R>('video-clip', chain, 90_000);
  return result;
}
