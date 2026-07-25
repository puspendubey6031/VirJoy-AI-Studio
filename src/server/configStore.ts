import { AppConfig, PlanKey, UserStats, VideoProject } from '../types';

export const defaultConfig: AppConfig = {
  plans: {
    Free: {
      id: 'Free',
      name: 'Free Plan',
      priceINR: 0,
      monthlyCredits: 30, // 30 credits / month
      maxSingleVideoCredits: 30, // Max 30 credits per single video
      maxMonthlyDurationSeconds: 30, // 30s limit
      maxVideoDurationSeconds: 30,
      exportQuality: '720p',
      hasWatermark: true,
      hasIdeaToVideoWorkflow: false,
      hasProductUrlExtraction: true,
      hasPriorityRendering: false,
      showAds: true,
      features: [
        '30 Monthly AI Credits Included',
        'Max 30s single video generation',
        'Prompt-to-video studio access',
        'Product & URL video creator',
        'Standard 720p video exports',
        'Includes VirJoy watermark'
      ]
    },
    '₹199': {
      id: '₹199',
      name: 'Starter Plan',
      priceINR: 199,
      monthlyCredits: 300, // 300 credits / month
      maxSingleVideoCredits: 60, // Max 60 credits (1 min) per video
      maxMonthlyDurationSeconds: 300,
      maxVideoDurationSeconds: 60,
      exportQuality: '720p',
      hasWatermark: false,
      hasIdeaToVideoWorkflow: false,
      hasProductUrlExtraction: true,
      hasPriorityRendering: false,
      showAds: false,
      features: [
        '300 Monthly AI Credits Included',
        'Max 1 minute (60s) single video length',
        'Standard SD/HD video exports',
        'No watermark on generated videos',
        'Prompt-driven video creation',
        'Ad-free experience'
      ]
    },
    '₹399': {
      id: '₹399',
      name: 'Pro Creator',
      priceINR: 399,
      monthlyCredits: 1200, // 1,200 credits / month
      maxSingleVideoCredits: 180, // Max 180 credits (3 mins) per video
      maxMonthlyDurationSeconds: 1200,
      maxVideoDurationSeconds: 180,
      exportQuality: '1080p',
      hasWatermark: false,
      hasIdeaToVideoWorkflow: false,
      hasProductUrlExtraction: true,
      hasPriorityRendering: true,
      showAds: false,
      features: [
        '1,200 Monthly AI Credits Included',
        'Max 3 minutes (180s) single video length',
        'Full 1080p HD export quality',
        'Full multimodal: Text, Image, Clip & Screenshot uploads',
        'Product & external URL workflow',
        'Voice & tone style configuration',
        'Supported multi-language audio & subtitles',
        'Commercial usage rights'
      ]
    },
    '₹799': {
      id: '₹799',
      name: 'Ultra AI Suite',
      priceINR: 799,
      monthlyCredits: 3600, // 3,600 credits / month
      maxSingleVideoCredits: 300, // Max 300 credits (5 mins) per video
      maxMonthlyDurationSeconds: 3600,
      maxVideoDurationSeconds: 300,
      exportQuality: '4K',
      hasWatermark: false,
      hasIdeaToVideoWorkflow: true,
      hasProductUrlExtraction: true,
      hasPriorityRendering: true,
      showAds: false,
      features: [
        '3,600 Monthly AI Credits Included',
        'Everything in ₹399 Plan included',
        'Max 5 minutes (300s) single video length',
        'Exclusive AI Idea-to-Video Assistant workflow',
        'Ultra 4K export quality',
        'Highest priority render queue',
        'Premium voice personas & custom brand styles'
      ]
    }
  },
  aiProvider: {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    systemPrompt: 'You are VirJoy AI, a world-class prompt-driven video producer creating high-converting short-form videos with engaging scenes, voiceover narration, visual cues, and auto-subtitles.',
    fallbackEnabled: true
  },
  voiceConfig: {
    activeVoiceProvider: 'VirJoy Native Synthesizer Engine',
    supportedLanguages: [
      { id: 'en-US', name: 'English (US / Global)', nativeName: 'English', code: 'en-US', flag: '🇺🇸' },
      { id: 'hi-IN', name: 'Hindi (India)', nativeName: 'हिन्दी', code: 'hi-IN', flag: '🇮🇳' },
      { id: 'bn-IN', name: 'Bengali (India / Bangladesh)', nativeName: 'বাংলা', code: 'bn-IN', flag: '🇮🇳' },
      { id: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN', flag: '🇮🇳' },
      { id: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN', flag: '🇮🇳' },
      { id: 'es-ES', name: 'Spanish', nativeName: 'Español', code: 'es-ES', flag: '🇪🇸' },
      { id: 'fr-FR', name: 'French', nativeName: 'Français', code: 'fr-FR', flag: '🇫🇷' }
    ],
    supportedVoices: [
      { id: 'female-ananya', name: 'Ananya', gender: 'female', provider: 'VirJoy Neural Synth', sampleDescription: 'Warm, clear, and engaging female voice', minPlan: 'Free' },
      { id: 'male-aarav', name: 'Aarav', gender: 'male', provider: 'VirJoy Neural Synth', sampleDescription: 'Deep, resonant male voice for promos', minPlan: 'Free' },
      { id: 'female-priya-energetic', name: 'Priya (High Energy)', gender: 'female', provider: 'VirJoy Neural Pro', sampleDescription: 'Upbeat, high-conversion ad voice', minPlan: '₹199' },
      { id: 'male-rohan-narrator', name: 'Rohan (Storyteller)', gender: 'male', provider: 'VirJoy Neural Pro', sampleDescription: 'Documentary & storytelling tone', minPlan: '₹199' },
      { id: 'neutral-alex-cinema', name: 'Alex (Neutral Studio)', gender: 'neutral', provider: 'VirJoy Ultra Neural', sampleDescription: 'Polished studio-grade narrator', minPlan: '₹399' }
    ],
    supportedTones: [
      'Natural',
      'Professional',
      'Energetic',
      'Calm',
      'Friendly',
      'Serious',
      'Dramatic',
      'Cinematic',
      'Storytelling',
      'News style'
    ],
    durationOptions: [
      { seconds: 10, label: '10 seconds', minPlan: 'Free' },
      { seconds: 15, label: '15 seconds', minPlan: 'Free' },
      { seconds: 30, label: '30 seconds', minPlan: 'Free' },
      { seconds: 60, label: '60 seconds (1 min)', minPlan: '₹199' },
      { seconds: 90, label: '90 seconds (1.5 mins)', minPlan: '₹399' },
      { seconds: 120, label: '2 minutes', minPlan: '₹399' },
      { seconds: 180, label: '3 minutes', minPlan: '₹799' }
    ]
  },
  retention: {
    retentionHours: 24, // Configurable cleanup mechanism (24h default)
    autoCleanupIntervalMinutes: 15
  },
  monetization: {
    adSenseEnabled: true,
    pubId: 'ca-pub-virjoy-ai-demo-2026',
    placements: {
      headerBanner: true,
      sidebarRect: true,
      queueOverlay: true,
      exportBanner: true
    },
    mobileAdMobConfig: {
      enabled: false,
      appId: 'ca-app-pub-3940256099942544~3347511713',
      bannerUnitId: 'ca-app-pub-3940256099942544/6300978111',
      interstitialUnitId: 'ca-app-pub-3940256099942544/1033173712'
    }
  }
};

// In-memory runtime state for demo (can be persisted or reset via Admin)
let currentConfig: AppConfig = JSON.parse(JSON.stringify(defaultConfig));

export const videoProjectsStore = new Map<string, VideoProject>();

export const userStatsStore: UserStats = {
  userId: 'demo-user-1',
  currentPlan: 'Free',
  usedCredits: 0,
  monthlyCredits: 30,
  remainingCredits: 30,
  usedMonthlyDurationSeconds: 0,
  history: []
};

export const configStore = {
  get: (): AppConfig => currentConfig,
  update: (newConfig: Partial<AppConfig>): AppConfig => {
    currentConfig = {
      ...currentConfig,
      ...newConfig,
      plans: newConfig.plans ? { ...currentConfig.plans, ...newConfig.plans } : currentConfig.plans,
      aiProvider: newConfig.aiProvider ? { ...currentConfig.aiProvider, ...newConfig.aiProvider } : currentConfig.aiProvider,
      voiceConfig: newConfig.voiceConfig ? { ...currentConfig.voiceConfig, ...newConfig.voiceConfig } : currentConfig.voiceConfig,
      retention: newConfig.retention ? { ...currentConfig.retention, ...newConfig.retention } : currentConfig.retention,
      monetization: newConfig.monetization ? { ...currentConfig.monetization, ...newConfig.monetization } : currentConfig.monetization
    };
    return currentConfig;
  },
  resetToDefault: (): AppConfig => {
    currentConfig = JSON.parse(JSON.stringify(defaultConfig));
    return currentConfig;
  }
};
