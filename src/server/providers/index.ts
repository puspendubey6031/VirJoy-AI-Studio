import { generateScriptWithFallback } from './scriptProvider.js';
import { generateImageWithFallback } from './imageProvider.js';
import { generateSpeechWithFallback } from './voiceProvider.js';
import { searchStockMediaWithFallback } from './stockMediaProvider.js';
import { generateVideoClipWithFallback } from './videoProvider.js';
import { processVideoFFmpeg, processImageSharp, lipSyncWav2Lip, animateSadTalker, animateLivePortrait } from './processingProvider.js';
import { createRazorpayOrder, verifyRazorpayPaymentSignature } from './paymentProvider.js';
import { isOpenRouterConfigured } from './openRouterProvider.js';
import { getRecentAttempts } from './providerFallback.js';

export * from './scriptProvider.js';
export * from './imageProvider.js';
export * from './voiceProvider.js';
export * from './stockMediaProvider.js';
export * from './videoProvider.js';
export * from './processingProvider.js';
export * from './paymentProvider.js';
export * from './openRouterProvider.js';
export * from './providerFallback.js';

export interface ProviderStatusReport {
  script: {
    fallbackOrder: string[];
    configuredProviders: string[];
    guaranteedFallback: string;
  };
  image: {
    fallbackOrder: string[];
    configuredProviders: string[];
    guaranteedFallback: string;
  };
  voice: {
    fallbackOrder: string[];
    configuredProviders: string[];
    guaranteedFallback: string;
  };
  videoClip: {
    fallbackOrder: string[];
    configuredProviders: string[];
    guaranteedFallback: string;
  };
  stockMedia: {
    providers: string[];
    activeKeysConfigured: boolean;
  };
  processing: {
    processors: string[];
    status: string;
  };
  payment: {
    gateway: string;
    keyConfigured: boolean;
  };
  recentAttempts: ReturnType<typeof getRecentAttempts>;
}

export function getProviderStatusReport(): ProviderStatusReport {
  const geminiConfigured = !!(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
  const groqConfigured   = !!(process.env.GROQ_API_KEY || process.env.GROQ_IMAGE_KEY);
  const cohereConfigured = !!process.env.COHERE_API_KEY;
  const mistralConfigured = !!process.env.MISTRAL_API_KEY;
  const hfConfigured     = !!process.env.HUGGINGFACE_API_KEY;
  const openRouterConfigured = isOpenRouterConfigured();

  // Script: which text providers are live
  const scriptConfigured: string[] = [];
  if (geminiConfigured)     scriptConfigured.push('Gemini');
  if (groqConfigured)       scriptConfigured.push('Groq');
  if (cohereConfigured)     scriptConfigured.push('Cohere');
  if (mistralConfigured)    scriptConfigured.push('Mistral');
  if (openRouterConfigured) scriptConfigured.push('OpenRouter');

  // Image: which image providers are live
  const imageConfigured: string[] = [];
  if (geminiConfigured) imageConfigured.push('GeminiImage');
  if (groqConfigured)   imageConfigured.push('GroqImage');
  if (hfConfigured)     imageConfigured.push('HuggingFace (FLUX, SDXL, Hyper-SD)');

  // Video-clip providers
  const videoConfigured: string[] = [];
  if (hfConfigured) videoConfigured.push('HF-Wan2.1', 'HF-LTXVideo', 'HF-Cosmos', 'HF-HunyuanI2V');

  return {
    script: {
      fallbackOrder: ['Gemini', 'Groq', 'Cohere', 'Mistral', 'OpenRouter', 'BuiltInRuleEngine'],
      configuredProviders: scriptConfigured,
      guaranteedFallback: 'BuiltInRuleEngine'
    },
    image: {
      fallbackOrder: ['GeminiImage', 'GroqImage', 'HuggingFace (FLUX/SDXL/Hyper-SD)', 'PollinationsAI'],
      configuredProviders: imageConfigured,
      guaranteedFallback: 'PollinationsAI'
    },
    voice: {
      fallbackOrder: ['gTTS', 'Bark (HuggingFace)', 'LongCatAudioDiT'],
      configuredProviders: hfConfigured ? ['gTTS', 'Bark'] : ['gTTS'],
      guaranteedFallback: 'LongCatAudioDiT'
    },
    videoClip: {
      fallbackOrder: ['HF-Wan2.1', 'HF-LTXVideo', 'HF-Cosmos', 'HF-HunyuanI2V', 'DynamicCanvasRender'],
      configuredProviders: videoConfigured,
      guaranteedFallback: 'DynamicCanvasRender'
    },
    stockMedia: {
      providers: ['Pexels', 'Pixabay', 'Unsplash', 'CuratedCatalog'],
      activeKeysConfigured: !!(
        process.env.PEXELS_API_KEY ||
        process.env.PIXABAY_API_KEY ||
        process.env.UNSPLASH_API_KEY
      )
    },
    processing: {
      processors: ['FFmpeg', 'Sharp', 'Wav2Lip', 'SadTalker', 'LivePortrait'],
      status: 'Ready'
    },
    payment: {
      gateway: 'Razorpay',
      keyConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    },
    recentAttempts: getRecentAttempts(20)
  };
}
