import { ScriptGenerationOptions, ScriptGenerationResult, generateScriptWithFallback } from '../server/providers/scriptProvider';
import { ImageGenerationOptions, ImageGenerationResult, generateImageWithFallback } from '../server/providers/imageProvider';
import { VoiceGenerationOptions, VoiceGenerationResult, generateSpeechWithFallback } from '../server/providers/voiceProvider';
import { VideoGenerationOptions, VideoGenerationResult, generateVideoClipWithFallback } from '../server/providers/videoProvider';
import { StockMediaItem, searchStockMediaWithFallback } from '../server/providers/stockMediaProvider';

export interface AIProviderConfig {
  primaryScriptProvider: 'Gemini';
  scriptFallbackOrder: ('Gemini' | 'Groq' | 'Cohere' | 'BuiltInRuleEngine')[];
  primaryImageProvider: 'GeminiImage';
  imageFallbackOrder: ('GeminiImage' | 'GroqImage' | 'HuggingFaceFLUX' | 'PollinationsAI')[];
}

/**
 * Unified AI Provider Configuration
 * Configures Gemini (using GEMINI_API_KEY) as the primary provider
 * and prioritizes it over Groq, Cohere, Hugging Face, etc.
 */
export const unifiedAIConfig: AIProviderConfig = {
  primaryScriptProvider: 'Gemini',
  scriptFallbackOrder: ['Gemini', 'Groq', 'Cohere', 'BuiltInRuleEngine'],
  primaryImageProvider: 'GeminiImage',
  imageFallbackOrder: ['GeminiImage', 'GroqImage', 'HuggingFaceFLUX', 'PollinationsAI']
};

/**
 * Unified AI Interface Class
 * Handles client-side API proxy routing as well as direct server-side execution.
 */
export class UnifiedAIProvider {
  private config: AIProviderConfig;

  constructor(customConfig?: Partial<AIProviderConfig>) {
    this.config = {
      ...unifiedAIConfig,
      ...customConfig
    };
  }

  public getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Server-side execution: Generate Script with Gemini primary priority
   */
  public async generateScriptServer(options: ScriptGenerationOptions): Promise<ScriptGenerationResult> {
    return generateScriptWithFallback(options);
  }

  /**
   * Server-side execution: Generate Image with Gemini primary priority
   */
  public async generateImageServer(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    return generateImageWithFallback(options);
  }

  /**
   * Server-side execution: Generate Speech/Voice
   */
  public async generateVoiceServer(options: VoiceGenerationOptions): Promise<VoiceGenerationResult> {
    return generateSpeechWithFallback(options);
  }

  /**
   * Server-side execution: Generate Video Clip
   */
  public async generateVideoServer(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    return generateVideoClipWithFallback(options);
  }

  /**
   * Server-side execution: Search Stock Media
   */
  public async searchStockMediaServer(query: string, type: 'video' | 'photo' = 'video'): Promise<StockMediaItem[]> {
    return searchStockMediaWithFallback(query, type);
  }

  /**
   * Client-side call: Proxy Script generation to server API
   */
  public async generateScriptClient(options: ScriptGenerationOptions): Promise<ScriptGenerationResult> {
    const res = await fetch('/api/video/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate script');
    }
    const data = await res.json();
    return {
      scenes: data.scenes || [],
      providerUsed: data.providerUsed || 'Gemini',
      modelUsed: data.modelUsed || 'gemini-2.5-flash'
    };
  }

  /**
   * Client-side call: Proxy Image generation to server API
   */
  public async generateImageClient(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const res = await fetch('/api/providers/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate image');
    }
    return res.json();
  }

  /**
   * Client-side call: Proxy Voice generation to server API
   */
  public async generateVoiceClient(options: VoiceGenerationOptions): Promise<VoiceGenerationResult> {
    const res = await fetch('/api/providers/generate-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate voice');
    }
    return res.json();
  }
}

// Single instance export for app-wide use
export const aiProvider = new UnifiedAIProvider();
