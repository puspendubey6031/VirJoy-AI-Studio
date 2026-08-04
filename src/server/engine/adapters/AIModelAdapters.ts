import { VideoModelAdapter } from '../types';

export abstract class BaseVideoModelAdapter implements VideoModelAdapter {
  abstract providerName: string;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  abstract generateVideoClip(
    prompt: string,
    durationSec: number,
    aspectRatio: string
  ): Promise<{
    clipUrl: string;
    costUSD: number;
    providerJobId: string;
  }>;
}

// 1. Runway Gen-2 / Gen-3 Adapter
export class RunwayAdapter extends BaseVideoModelAdapter {
  providerName = 'Runway API (Gen-3 Alpha)';

  async generateVideoClip(prompt: string, durationSec: number, aspectRatio: string) {
    return {
      clipUrl: 'https://assets.virjoy.ai/clips/runway_gen3_output.mp4',
      costUSD: durationSec * 0.05,
      providerJobId: `runway_job_${Date.now()}`
    };
  }
}

// 2. Pika Labs Adapter
export class PikaAdapter extends BaseVideoModelAdapter {
  providerName = 'Pika API (Pika 1.5)';

  async generateVideoClip(prompt: string, durationSec: number, aspectRatio: string) {
    return {
      clipUrl: 'https://assets.virjoy.ai/clips/pika_15_output.mp4',
      costUSD: durationSec * 0.04,
      providerJobId: `pika_job_${Date.now()}`
    };
  }
}

// 3. Luma Dream Machine Adapter
export class LumaAdapter extends BaseVideoModelAdapter {
  providerName = 'Luma Dream Machine API';

  async generateVideoClip(prompt: string, durationSec: number, aspectRatio: string) {
    return {
      clipUrl: 'https://assets.virjoy.ai/clips/luma_dream_output.mp4',
      costUSD: durationSec * 0.045,
      providerJobId: `luma_job_${Date.now()}`
    };
  }
}

// 4. Stable Video Diffusion (SVD) Adapter
export class StableVideoDiffusionAdapter extends BaseVideoModelAdapter {
  providerName = 'Stable Video Diffusion (SVD-XT)';

  async generateVideoClip(prompt: string, durationSec: number, aspectRatio: string) {
    return {
      clipUrl: 'https://assets.virjoy.ai/clips/svd_xt_output.mp4',
      costUSD: durationSec * 0.02,
      providerJobId: `svd_job_${Date.now()}`
    };
  }
}

// 5. Kling AI Adapter
export class KlingAIAdapter extends BaseVideoModelAdapter {
  providerName = 'Kling AI (Kling 1.5)';

  async generateVideoClip(prompt: string, durationSec: number, aspectRatio: string) {
    return {
      clipUrl: 'https://assets.virjoy.ai/clips/kling_15_output.mp4',
      costUSD: durationSec * 0.035,
      providerJobId: `kling_job_${Date.now()}`
    };
  }
}

// 6. Google Veo Adapter
export class GoogleVeoAdapter extends BaseVideoModelAdapter {
  providerName = 'Google Veo Video Engine';

  async generateVideoClip(prompt: string, durationSec: number, aspectRatio: string) {
    return {
      clipUrl: 'https://assets.virjoy.ai/clips/google_veo_output.mp4',
      costUSD: durationSec * 0.06,
      providerJobId: `veo_job_${Date.now()}`
    };
  }
}

// Adapter Registry System for Zero-Code Expansion
export class VideoAdapterRegistry {
  private adapters: Map<string, VideoModelAdapter> = new Map();

  constructor() {
    this.registerAdapter('runway', new RunwayAdapter());
    this.registerAdapter('pika', new PikaAdapter());
    this.registerAdapter('luma', new LumaAdapter());
    this.registerAdapter('svd', new StableVideoDiffusionAdapter());
    this.registerAdapter('kling', new KlingAIAdapter());
    this.registerAdapter('google_veo', new GoogleVeoAdapter());
  }

  public registerAdapter(id: string, adapter: VideoModelAdapter) {
    this.adapters.set(id, adapter);
  }

  public getAdapter(id: string): VideoModelAdapter | undefined {
    return this.adapters.get(id);
  }

  public listAdapters(): { id: string; providerName: string }[] {
    return Array.from(this.adapters.entries()).map(([id, adapter]) => ({
      id,
      providerName: adapter.providerName
    }));
  }
}

export const videoAdapterRegistry = new VideoAdapterRegistry();
