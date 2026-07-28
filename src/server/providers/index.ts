import { generateScriptWithFallback } from './scriptProvider';
import { generateImageWithFallback } from './imageProvider';
import { generateSpeechWithFallback } from './voiceProvider';
import { searchStockMediaWithFallback } from './stockMediaProvider';
import { generateVideoClipWithFallback } from './videoProvider';
import { processVideoFFmpeg, processImageSharp, lipSyncWav2Lip, animateSadTalker, animateLivePortrait } from './processingProvider';
import { createRazorpayOrder, verifyRazorpayPaymentSignature } from './paymentProvider';

export * from './scriptProvider';
export * from './imageProvider';
export * from './voiceProvider';
export * from './stockMediaProvider';
export * from './videoProvider';
export * from './processingProvider';
export * from './paymentProvider';

export interface ProviderStatusReport {
  script: {
    primary: string;
    fallbacks: string[];
    activeKeyConfigured: boolean;
  };
  image: {
    primary: string;
    fallbacks: string[];
    activeKeyConfigured: boolean;
  };
  voice: {
    primary: string;
    fallbacks: string[];
    activeKeyConfigured: boolean;
  };
  stockMedia: {
    providers: string[];
    activeKeysConfigured: boolean;
  };
  video: {
    models: string[];
    activeKeyConfigured: boolean;
  };
  processing: {
    processors: string[];
    status: string;
  };
  payment: {
    gateway: string;
    keyConfigured: boolean;
  };
}

export function getProviderStatusReport(): ProviderStatusReport {
  return {
    script: {
      primary: 'Gemini (gemini-2.5-flash)',
      fallbacks: ['Groq (llama-3.3-70b-versatile)', 'Cohere (command-r-plus)', 'BuiltInRuleEngine'],
      activeKeyConfigured: !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.COHERE_API_KEY)
    },
    image: {
      primary: 'Gemini Image (imagen-3.0-generate-002)',
      fallbacks: ['Groq Image', 'Hugging Face (FLUX.1-schnell, SDXL, Hyper-SD)', 'Pollinations AI'],
      activeKeyConfigured: !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.HUGGINGFACE_API_KEY)
    },
    voice: {
      primary: 'Edge-TTS (en-IN-AnanyaNeural / en-US-AriaNeural)',
      fallbacks: ['gTTS (Google TTS)', 'Bark (Hugging Face)', 'LongCat AudioDiT'],
      activeKeyConfigured: true
    },
    stockMedia: {
      providers: ['Pexels', 'Pixabay', 'Unsplash', 'CuratedCatalog'],
      activeKeysConfigured: !!(process.env.PEXELS_API_KEY || process.env.PIXABAY_API_KEY || process.env.UNSPLASH_API_KEY)
    },
    video: {
      models: ['Hugging Face Wan2.1', 'Hugging Face LTX Video', 'Hugging Face Cosmos', 'Hugging Face Hunyuan I2V', 'DynamicCanvasRender'],
      activeKeyConfigured: !!process.env.HUGGINGFACE_API_KEY
    },
    processing: {
      processors: ['FFmpeg', 'Sharp', 'Wav2Lip', 'SadTalker', 'LivePortrait'],
      status: 'Ready'
    },
    payment: {
      gateway: 'Razorpay',
      keyConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    }
  };
}
