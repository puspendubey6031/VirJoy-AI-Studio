import { AppConfig, PlanKey, UserStats, VideoProject, DesignHistoryItem, DesignStudioConfig } from '../types';
import { supabaseServer } from './supabaseServer';

export const designProjectsStore = new Map<string, DesignHistoryItem>();

export const defaultConfig: AppConfig = {
  subscriptionLockConfig: {
    features: {
      videoGenerator: { enabled: true, minPlan: 'Free', requiredCredits: 5 },
      imageGenerator: { enabled: true, minPlan: 'Free', requiredCredits: 3 },
      logoGenerator: { enabled: true, minPlan: 'Free', requiredCredits: 5 },
      bannerGenerator: { enabled: true, minPlan: 'Free', requiredCredits: 5 },
      posterGenerator: { enabled: true, minPlan: 'Free', requiredCredits: 5 },
      thumbnailGenerator: { enabled: true, minPlan: 'Free', requiredCredits: 3 },
      aiVoiceAccess: { enabled: true, minPlan: 'Free', requiredCredits: 1 },
      subtitleAccess: { enabled: true, minPlan: 'Free', requiredCredits: 1 },
      ideaToVideoWorkflow: { enabled: true, minPlan: '₹799', requiredCredits: 20, customUpgradeMsg: 'AI Idea-to-Video Assistant requires the Ultra AI Suite (₹799).' },
      productUrlExtraction: { enabled: true, minPlan: 'Free', requiredCredits: 5 },
      premiumTemplates: { enabled: true, minPlan: '₹199', requiredCredits: 0, customUpgradeMsg: 'Premium Templates require a Starter or Pro subscription.' },
      highResExport: { enabled: true, minPlan: '₹399', requiredCredits: 0, customUpgradeMsg: '1080p / 4K Export requires Pro Creator or Ultra Suite.' }
    },
    lockModal: {
      title: 'Unlock Premium Feature',
      description: 'Upgrade your subscription plan to unlock high-speed AI video generation, premium voice personas, and 4K exports without watermarks.',
      benefits: [
        '300 to 3,600 AI Monthly Credits included',
        'No VirJoy watermark on exported videos',
        'Full 1080p HD & 4K Ultra video rendering',
        'Access to premium neural voice personas',
        'Exclusive AI Idea-to-Video assistant',
        'Priority render queue processing'
      ],
      buttonText: 'Upgrade Plan Now',
      bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      offerText: '⚡ Limited Time Offer: Upgrade today and get 20% BONUS CREDITS!'
    },
    credits: {
      creditsPerVideo: 5,
      creditsPer10Seconds: 2,
      dailyFreeCredits: 10,
      trialCredits: 50,
      bonusCredits: 20,
      refundOnFailure: true
    },
    durations: [
      { seconds: 10, label: '10 sec', minPlan: 'Free', requiredCredits: 2, enabled: true },
      { seconds: 15, label: '15 sec', minPlan: 'Free', requiredCredits: 3, enabled: true },
      { seconds: 30, label: '30 sec', minPlan: 'Free', requiredCredits: 5, enabled: true },
      { seconds: 60, label: '60 sec', minPlan: '₹199', requiredCredits: 10, enabled: true },
      { seconds: 90, label: '90 sec', minPlan: '₹399', requiredCredits: 15, enabled: true },
      { seconds: 120, label: '120 sec', minPlan: '₹399', requiredCredits: 20, enabled: true },
      { seconds: 180, label: '180 sec', minPlan: '₹399', requiredCredits: 30, enabled: true },
      { seconds: 300, label: '300 sec', minPlan: '₹799', requiredCredits: 50, enabled: true }
    ]
  },
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
      { id: 'en-IN', name: 'English (India)', nativeName: 'English (IN)', code: 'en-IN', flag: '🇮🇳' },
      { id: 'hi-IN', name: 'Hindi (India)', nativeName: 'हिन्दी', code: 'hi-IN', flag: '🇮🇳' },
      { id: 'bn-IN', name: 'Bengali (India / Bangladesh)', nativeName: 'বাংলা', code: 'bn-IN', flag: '🇮🇳' },
      { id: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN', flag: '🇮🇳' },
      { id: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN', flag: '🇮🇳' },
      { id: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn-IN', flag: '🇮🇳' },
      { id: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-IN', flag: '🇮🇳' },
      { id: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN', flag: '🇮🇳' },
      { id: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu-IN', flag: '🇮🇳' },
      { id: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa-IN', flag: '🇮🇳' },
      { id: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', code: 'or-IN', flag: '🇮🇳' },
      { id: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া', code: 'as-IN', flag: '🇮🇳' },
      { id: 'ur-IN', name: 'Urdu', nativeName: 'اردو', code: 'ur-IN', flag: '🇮🇳' },
      { id: 'es-ES', name: 'Spanish', nativeName: 'Español', code: 'es-ES', flag: '🇪🇸' },
      { id: 'fr-FR', name: 'French', nativeName: 'Français', code: 'fr-FR', flag: '🇫🇷' },
      { id: 'de-DE', name: 'German', nativeName: 'Deutsch', code: 'de-DE', flag: '🇩🇪' },
      { id: 'ar-SA', name: 'Arabic', nativeName: 'العربية', code: 'ar-SA', flag: '🇸🇦' },
      { id: 'ja-JP', name: 'Japanese', nativeName: '日本語', code: 'ja-JP', flag: '🇯🇵' }
    ],
    supportedVoices: [
      { id: 'female-ananya', name: 'Ananya', gender: 'female', provider: 'VirJoy Neural Synth', sampleDescription: 'Warm, clear, and engaging female voice', minPlan: 'Free' },
      { id: 'male-aarav', name: 'Aarav', gender: 'male', provider: 'VirJoy Neural Synth', sampleDescription: 'Deep, resonant male voice for promos', minPlan: 'Free' },
      { id: 'child-anika', name: 'Anika (Kid Voice)', gender: 'child', provider: 'VirJoy Young Neural', sampleDescription: 'Playful, cheerful child voice', minPlan: 'Free' },
      { id: 'adult-vikram', name: 'Vikram (Adult Narrator)', gender: 'adult', provider: 'VirJoy Neural Pro', sampleDescription: 'Professional, confident adult voice', minPlan: 'Free' },
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
      'Story',
      'Educational',
      'Funny',
      'Motivational',
      'News style'
    ],
    durationOptions: [
      { seconds: 10, label: '10s', minPlan: 'Free' },
      { seconds: 15, label: '15s', minPlan: 'Free' },
      { seconds: 30, label: '30s', minPlan: 'Free' },
      { seconds: 60, label: '60s (1m)', minPlan: '₹199' },
      { seconds: 90, label: '90s (1.5m)', minPlan: '₹399' },
      { seconds: 120, label: '2 mins', minPlan: '₹399' },
      { seconds: 180, label: '3 mins', minPlan: '₹399' },
      { seconds: 300, label: '5 mins', minPlan: '₹799' }
    ]
  },
  subtitleConfig: {
    autoSubtitle: true,
    enabled: true,
    position: 'Bottom',
    font: 'Inter',
    color: '#FACC15',
    size: 'Medium',
    animation: 'Pop-in',
    supportedFonts: ['Inter', 'Impact', 'Montserrat', 'Playfair Display', 'Roboto', 'Plus Jakarta Sans'],
    supportedColors: [
      { name: 'Yellow Gold', hex: '#FACC15' },
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Cyan Blue', hex: '#06B6D4' },
      { name: 'Lime Green', hex: '#84CC16' },
      { name: 'Amber Orange', hex: '#F59E0B' },
      { name: 'Magenta Pink', hex: '#EC4899' }
    ],
    supportedPositions: ['Bottom', 'Center', 'Top'],
    supportedAnimations: ['Pop-in', 'Fade', 'Bounce', 'Word-Highlight']
  },
  retention: {
    retentionHours: 24, // Configurable cleanup mechanism (24h default)
    autoCleanupIntervalMinutes: 15,
    explanationMessage: 'Generated videos are automatically deleted after 24 hours. Download before expiry.'
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
      enabled: true,
      appId: 'ca-app-pub-3940256099942544~3347511713',
      bannerUnitId: 'ca-app-pub-3940256099942544/6300978111',
      interstitialUnitId: 'ca-app-pub-3940256099942544/1033173712',
      rewardedUnitId: 'ca-app-pub-3940256099942544/5224354917',
      rewardedCreditsBonus: 10,
      showOnGeneration: true,
      showBeforeDownload: true,
      showOnNavigation: false
    }
  },
  legalPolicies: {
    privacyPolicy: `Privacy Policy for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Information Collection\nVirJoy AI ("we", "our", or "us") respects your privacy. We collect account details (email, display name), user-submitted prompts, media uploads, and generated video metadata to provide our AI video commercial creation service.\n\n2. Data Usage & AI Model Processing\nPrompts and user uploads are processed securely via encrypted AI API gateways solely to synthesize video commercials, voiceovers, and graphics. We do not sell your personal information or use your content for public model training without explicit consent.\n\n3. Data Retention & Auto-Cleanup\nTo protect user data and optimize storage, generated media outputs are automatically deleted after a default duration of 24 hours (or as configured by system policy). Users are advised to download generated assets promptly.\n\n4. Account Deletion Rights\nIn compliance with Google Play Store Developer Policies, users can permanently delete their account and all associated personal data directly within the app under User Settings -> Delete Account or by contacting support@virjoy.ai.\n\n5. Contact Information\nIf you have questions regarding this Privacy Policy, please email support@virjoy.ai.`,
    termsAndConditions: `Terms & Conditions for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Acceptance of Terms\nBy accessing or using VirJoy AI, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the application.\n\n2. AI Credit System & Usage Limits\nVirJoy AI operates on an AI Credit allocation system. Credits are consumed according to video duration (1 second = 1 credit). Unused monthly credits roll over or expire according to your subscription tier.\n\n3. Subscription & Billing\nUpgrades and recurring plans are processed securely via verified payment partners. Plan benefits, credit allocations, and refund terms are detailed during purchase.\n\n4. User Responsibilities\nYou agree not to generate illegal, abusive, sexually explicit, defamatory, or fraudulent content. VirJoy AI reserves the right to terminate accounts violating these guidelines.`,
    aiUsagePolicy: `AI Usage & Synthetic Content Policy for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Responsible AI Generation\nVirJoy AI employs automated content safety classifiers and neural synthesis tools to ensure safe commercial generation.\n\n2. Deepfake & Misinformation Prohibition\nUsers are strictly prohibited from creating non-consensual deepfakes, impersonating public figures, or generating deceptive political media.\n\n3. Copyright & Media Rights\nUsers retain rights to their original uploaded assets and commercial outputs created under active paid plans, subject to third-party AI licensing laws.\n\n4. Disclosure of Synthetic Media\nAll generated outputs may contain subtle digital watermarks or synthetic metadata tags in accordance with Google Play AI Content Standards.`,
    lastUpdated: '2026-08-02'
  },
  themeConfig: {
    activeThemeId: 'theme-dark-default',
    themes: [
      {
        id: 'theme-dark-default',
        name: 'Dark Velvet (Default)',
        type: 'gradient',
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        accentColor: '#f59e0b',
        backgroundColor: '#020617',
        cardColor: '#0f172a',
        buttonColor: '#4f46e5',
        borderColor: '#1e293b',
        textColor: '#f8fafc',
        enabled: true,
        active: true
      },
      {
        id: 'theme-light-pro',
        name: 'Light Slate',
        type: 'single',
        primaryColor: '#4f46e5',
        secondaryColor: '#6366f1',
        accentColor: '#d97706',
        backgroundColor: '#f8fafc',
        cardColor: '#ffffff',
        buttonColor: '#4f46e5',
        borderColor: '#e2e8f0',
        textColor: '#0f172a',
        enabled: true,
        active: false
      },
      {
        id: 'theme-neon-cyber',
        name: 'Neon Cyberpunk',
        type: 'gradient',
        primaryColor: '#06b6d4',
        secondaryColor: '#ec4899',
        accentColor: '#10b981',
        backgroundColor: '#030712',
        cardColor: '#111827',
        buttonColor: '#0891b2',
        borderColor: '#1f2937',
        textColor: '#f9fafb',
        enabled: true,
        active: false
      },
      {
        id: 'theme-emerald-gold',
        name: 'Emerald Gold',
        type: 'mixed',
        primaryColor: '#10b981',
        secondaryColor: '#f59e0b',
        accentColor: '#6366f1',
        backgroundColor: '#022c22',
        cardColor: '#064e3b',
        buttonColor: '#059669',
        borderColor: '#047857',
        textColor: '#ecfdf5',
        enabled: true,
        active: false
      }
    ]
  },
  creditsConfig: {
    creditsPerVideo: 5,
    creditsPer10Seconds: 2,
    dailyFreeCredits: 10,
    trialCredits: 50,
    bonusCredits: 20
  },
  designStudioConfig: {
    costs: {
      image: 3,
      thumbnail: 3,
      poster: 5,
      logo: 5,
      banner: 5
    },
    resolutionOptions: ['1:1', '16:9', '9:16', '4:5', '3:2'],
    qualityOptions: ['Standard HD', 'High Resolution', '4K Ultra Vector'],
    maxImageCount: 4,
    retryCount: 3,
    timeoutSeconds: 60,
    processingLimits: 10,
    historyRetentionHours: 24
  },
  providerManagerConfig: {
    fallbackOrder: [
      'prov-gemini',
      'prov-groq',
      'prov-cohere',
      'prov-mistral',
      'prov-huggingface',
      'prov-edgetts',
      'prov-gtts',
      'prov-pexels',
      'prov-pixabay',
      'prov-pollinations'
    ],
    providers: [
      {
        id: 'prov-gemini',
        name: 'Google Gemini 3.6 Flash',
        providerType: 'gemini',
        model: 'gemini-3.6-flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
        enabled: true,
        priority: 1,
        status: 'Operational'
      },
      {
        id: 'prov-groq',
        name: 'Groq Llama 3.3 70B',
        providerType: 'groq',
        model: 'llama-3.3-70b-versatile',
        endpoint: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY || '',
        enabled: true,
        priority: 2,
        status: 'Operational'
      },
      {
        id: 'prov-cohere',
        name: 'Cohere Command R+',
        providerType: 'cohere',
        model: 'command-r-plus',
        endpoint: 'https://api.cohere.com/v2',
        apiKey: process.env.COHERE_API_KEY || '',
        enabled: true,
        priority: 3,
        status: 'Operational'
      },
      {
        id: 'prov-mistral',
        name: 'Mistral Large 2',
        providerType: 'mistral',
        model: 'mistral-large-latest',
        endpoint: 'https://api.mistral.ai/v1',
        apiKey: process.env.MISTRAL_API_KEY || '',
        enabled: true,
        priority: 4,
        status: 'Operational'
      },
      {
        id: 'prov-huggingface',
        name: 'Hugging Face FLUX & Video',
        providerType: 'huggingface',
        model: 'black-forest-labs/FLUX.1-schnell',
        endpoint: 'https://api-inference.huggingface.co/models',
        apiKey: process.env.HUGGINGFACE_API_KEY || '',
        enabled: true,
        priority: 5,
        status: 'Operational'
      },
      {
        id: 'prov-edgetts',
        name: 'Edge Neural Voice Engine',
        providerType: 'edgetts',
        model: 'en-US-AriaNeural',
        endpoint: 'ms-edge-tts://synth',
        apiKey: '',
        enabled: true,
        priority: 6,
        status: 'Operational'
      },
      {
        id: 'prov-gtts',
        name: 'Google Text-to-Speech (gTTS)',
        providerType: 'gtts',
        model: 'standard-tts',
        endpoint: 'https://translate.google.com/translate_tts',
        apiKey: '',
        enabled: true,
        priority: 7,
        status: 'Operational'
      },
      {
        id: 'prov-pixabay',
        name: 'Pixabay Media Search API',
        providerType: 'pixabay',
        model: 'media-search-v1',
        endpoint: 'https://pixabay.com/api/videos',
        apiKey: process.env.PIXABAY_API_KEY || '',
        enabled: true,
        priority: 8,
        status: 'Operational'
      },
      {
        id: 'prov-pexels',
        name: 'Pexels Video Engine',
        providerType: 'pexels',
        model: 'video-search-v1',
        endpoint: 'https://api.pexels.com/videos',
        apiKey: process.env.PEXELS_API_KEY || '',
        enabled: true,
        priority: 9,
        status: 'Operational'
      },
      {
        id: 'prov-pollinations',
        name: 'Pollinations AI Visuals',
        providerType: 'pollinations',
        model: 'flux-realism',
        endpoint: 'https://image.pollinations.ai/prompt',
        apiKey: '',
        enabled: true,
        priority: 10,
        status: 'Operational'
      }
    ]
  },
  apiKeys: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    groqApiKey: process.env.GROQ_API_KEY || '',
    cohereApiKey: process.env.COHERE_API_KEY || '',
    huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
    mistralApiKey: process.env.MISTRAL_API_KEY || '',
    pexelsApiKey: process.env.PEXELS_API_KEY || '',
    pixabayApiKey: process.env.PIXABAY_API_KEY || '',
    unsplashApiKey: process.env.UNSPLASH_API_KEY || '',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    customProviders: []
  },
  usersList: [
    {
      id: 'usr-101',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      mobile: '+1 (555) 234-5678',
      country: 'United States',
      joinDate: '2026-01-15',
      lastActive: '2026-07-29 22:15',
      accountType: 'Pro',
      subscriptionStatus: 'Active',
      credits: 250,
      totalVideos: 42,
      referralCode: 'ALEX2026',
      referralCount: 8,
      status: 'Active'
    },
    {
      id: 'usr-102',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      mobile: '+91 98765 43210',
      country: 'India',
      joinDate: '2026-02-04',
      lastActive: '2026-07-30 08:30',
      accountType: 'Enterprise',
      subscriptionStatus: 'Active',
      credits: 1200,
      totalVideos: 185,
      referralCode: 'PRIYA99',
      referralCount: 23,
      status: 'Active'
    },
    {
      id: 'usr-103',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      name: 'Sophie Laurent',
      email: 'sophie.laurent@example.com',
      mobile: '+33 6 12 34 56 78',
      country: 'France',
      joinDate: '2026-03-20',
      lastActive: '2026-07-28 14:10',
      accountType: 'Free',
      subscriptionStatus: 'Trial',
      credits: 30,
      totalVideos: 5,
      referralCode: 'SOPHIE_FR',
      referralCount: 1,
      status: 'Active'
    },
    {
      id: 'usr-104',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      mobile: '+1 (555) 987-6543',
      country: 'Canada',
      joinDate: '2026-04-12',
      lastActive: '2026-07-25 19:00',
      accountType: 'Free',
      subscriptionStatus: 'Expired',
      credits: 0,
      totalVideos: 12,
      referralCode: 'CHEN_CA',
      referralCount: 0,
      status: 'Blocked'
    }
  ],
  paymentsList: [
    {
      id: 'pay-501',
      transactionId: 'TXN_9988771122',
      userName: 'Priya Sharma',
      userEmail: 'priya.sharma@example.com',
      amount: 49.99,
      currency: 'USD',
      planName: 'Enterprise Plan (Monthly)',
      date: '2026-07-29 18:45',
      status: 'Success',
      paymentMethod: 'Stripe'
    },
    {
      id: 'pay-502',
      transactionId: 'TXN_4433221100',
      userName: 'Alex Rivera',
      userEmail: 'alex.rivera@example.com',
      amount: 19.99,
      currency: 'USD',
      planName: 'Pro Creator (Monthly)',
      date: '2026-07-28 11:20',
      status: 'Success',
      paymentMethod: 'Razorpay'
    },
    {
      id: 'pay-503',
      transactionId: 'TXN_8877665544',
      userName: 'Michael Chen',
      userEmail: 'michael.chen@example.com',
      amount: 19.99,
      currency: 'USD',
      planName: 'Pro Creator (Monthly)',
      date: '2026-07-25 09:15',
      status: 'Failed',
      paymentMethod: 'Credit Card'
    }
  ],
  notificationsList: [
    {
      id: 'notif-201',
      title: '🚀 Major AI Video Engine 3.0 Update!',
      message: 'Experience 2x faster rendering and brand new neural voices. Try generating a video now!',
      type: 'Announcement',
      targetAudience: 'All Users',
      ctaText: 'Generate Now',
      ctaUrl: '/app',
      enabled: true,
      createdAt: '2026-07-28 10:00'
    },
    {
      id: 'notif-202',
      title: 'Scheduled System Maintenance Notice',
      message: 'VirJoy AI backend will undergo brief maintenance on Sunday from 02:00 UTC to 02:30 UTC.',
      type: 'Maintenance',
      targetAudience: 'All Users',
      enabled: true,
      createdAt: '2026-07-29 16:00'
    }
  ],
  crossPromotionsList: [
    {
      id: 'cp-301',
      appName: 'VirJoy Voice Studio Pro',
      logoUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120',
      bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
      description: 'Ultra-realistic AI voiceover cloning & multi-speaker podcast generator.',
      ctaButtonText: 'Try Voice Studio Free',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.virjoy.voicestudio',
      websiteUrl: 'https://voicestudio.virjoy.ai',
      placement: 'Home',
      enabled: true,
      priority: 1
    }
  ],
  referralConfig: {
    campaignStatus: 'Active',
    planRewards: {
      '₹199': { referrerCredits: 20, newUserBonusCredits: 10, enabled: true },
      '₹399': { referrerCredits: 40, newUserBonusCredits: 20, enabled: true },
      '₹799': { referrerCredits: 100, newUserBonusCredits: 40, enabled: true },
      'Free': { referrerCredits: 0, newUserBonusCredits: 0, enabled: false }
    },
    notifications: {
      referrerMessage: 'You earned {credits} Credits because {referred_user} subscribed to {plan}!',
      newUserMessage: 'You received {credits} Bonus Credits for subscribing with referral code {ref_code}!',
      refundReversalMessage: 'Referral reward of {credits} Credits was reversed due to subscription refund.'
    },
    referralBonusCredits: 50,
    inviterRewardCredits: 20,
    inviteeRewardCredits: 10,
    referralBannerUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    referralPopupMessage: 'Invite your friends to VirJoy AI! Get up to 100 Free Credits when they subscribe.',
    analytics: {
      totalReferrals: 142,
      pendingReferrals: 44,
      completedReferrals: 98,
      expiredReferrals: 0,
      cancelledReferrals: 0,
      totalRewardsPaid: 4260
    }
  },
  activityLogs: [
    {
      id: 'log-1',
      actionType: 'Admin Login',
      details: 'Super Admin authenticated from console.',
      adminUser: 'puspendubey6031@gmail.com',
      timestamp: '2026-07-30 00:05:12'
    },
    {
      id: 'log-2',
      actionType: 'Theme Change',
      details: 'Switched active platform theme to Dark Velvet (Default)',
      adminUser: 'puspendubey6031@gmail.com',
      timestamp: '2026-07-30 00:15:40'
    },
    {
      id: 'log-3',
      actionType: 'Save Config',
      details: 'Updated credits configuration rules in Supabase runtime store.',
      adminUser: 'puspendubey6031@gmail.com',
      timestamp: '2026-07-30 00:22:01'
    }
  ],
  maintenanceConfig: {
    enabled: false,
    title: 'Platform Maintenance & Upgrade in Progress',
    message: 'VirJoy AI is currently undergoing scheduled platform upgrades to improve generation speed and quality. We will be back online shortly!',
    expectedReturnTime: '2026-08-02 12:00 UTC',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    displayMode: 'Banner',
    whitelistedAdminEmails: ['puspendubey6031@gmail.com', 'admin@virjoy.ai'],
    whitelistedIps: ['127.0.0.1', '192.168.1.1']
  },
  onboardingConfig: {
    enabled: true,
    title: 'Welcome to VirJoy AI Studio',
    subtitle: 'Master AI video creation, custom graphic design, neural voices, and earnings in 7 simple steps.',
    themeColor: '#6366f1',
    gradientFrom: '#4f46e5',
    gradientTo: '#9333ea',
    skipButtonText: 'Skip Overview',
    nextButtonText: 'Next Step',
    prevButtonText: 'Previous',
    finishButtonText: 'Get Started Now',
    steps: [
      {
        id: 'step-1',
        title: '1. Prompt Engineering',
        description: 'Type any text prompt, product URL, or video concept into the AI input bar to instantly draft cinematic scripts and scenes.',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        badgeText: 'Prompt Studio'
      },
      {
        id: 'step-2',
        title: '2. Upload Media Assets',
        description: 'Attach your own product images, brand logos, audio clips, or background music to personalize every generated video.',
        imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
        badgeText: 'Media Center'
      },
      {
        id: 'step-3',
        title: '3. AI Credits System',
        description: 'Every video or image creation uses AI credits. Free users receive 30 free monthly credits, while Pro members get up to 3,600.',
        imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80',
        badgeText: 'Credits'
      },
      {
        id: 'step-4',
        title: '4. Reward Ads Bonus',
        description: 'Need extra credits? Watch quick rewarded partner ads to earn free bonus credits anytime without paying.',
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
        badgeText: 'Watch & Earn'
      },
      {
        id: 'step-5',
        title: '5. Refer & Earn Program',
        description: 'Invite creators with your custom referral code. Earn up to 100 free credits when your friends sign up or upgrade.',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
        badgeText: 'Referrals'
      },
      {
        id: 'step-6',
        title: '6. High-Speed Generation',
        description: 'Our cloud worker engine renders 1080p video clips, voiceovers, thumbnails, and banners in seconds with multi-provider fallback.',
        imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
        badgeText: 'AI Engine'
      },
      {
        id: 'step-7',
        title: '7. Instant 4K Downloads',
        description: 'Preview scenes, refine animated captions, and export high-resolution MP4/PNG files directly to your device with 24h retention.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
        badgeText: 'Export & Share'
      }
    ]
  },
  feedbackConfig: {
    enabled: true,
    categories: ['Video Generation', 'UI / Theme', 'Audio & Voice', 'Billing & Credits', 'Other']
  },
  feedbackList: [
    {
      id: 'fb-101',
      type: 'Feature Suggestion',
      category: 'Video Generation',
      title: 'Add 9:16 Vertical Reel Template Presets',
      description: 'It would be great to have quick vertical templates specifically tailored for Instagram Reels and TikTok shorts with top/bottom captions.',
      userEmail: 'creator.pro@example.com',
      userName: 'Alex Rivers',
      status: 'In Progress',
      adminReply: 'Thanks Alex! 9:16 templates are currently being integrated into the upcoming v3.6 release.',
      createdAt: '2026-08-01 14:20'
    },
    {
      id: 'fb-102',
      type: 'Bug Report',
      category: 'Audio & Voice',
      title: 'Audio playback volume slider glitch on mobile Web Safari',
      description: 'When playing voiceover samples on mobile Safari iOS 18, the volume slider resets to 100% when changing scenes.',
      userEmail: 'dev.tester@example.com',
      userName: 'Sam Chen',
      status: 'Open',
      createdAt: '2026-08-02 01:10'
    }
  ],
  systemHealthConfig: {
    autoRefreshEnabled: true,
    thresholds: {
      latencyWarningMs: 1500,
      latencyOfflineMs: 5000,
      errorRateWarningPercent: 5,
      errorRateOfflinePercent: 20,
      storageWarningPercent: 85,
      maxWorkerQueueJobs: 10,
      autoRefreshIntervalSeconds: 10
    },
    services: [
      { id: 'gemini', name: 'Gemini API', category: 'API', status: 'Healthy', latencyMs: 320, errorRatePercent: 0.1, details: 'Google Gemini 2.5 Flash / Pro Multimodal API online.', lastChecked: new Date().toISOString() },
      { id: 'pexels', name: 'Pexels API', category: 'API', status: 'Healthy', latencyMs: 180, errorRatePercent: 0.0, details: 'Pexels Stock Video & Photo Provider online.', lastChecked: new Date().toISOString() },
      { id: 'ffmpeg', name: 'FFmpeg Transcoder', category: 'Infrastructure', status: 'Healthy', latencyMs: 45, errorRatePercent: 0.0, details: 'Local FFmpeg WASM / Binary video stitcher ready.', lastChecked: new Date().toISOString() },
      { id: 'render_queue', name: 'Rendering Queue', category: 'Worker', status: 'Healthy', latencyMs: 12, errorRatePercent: 0.0, details: 'Queue operational. 0 jobs pending.', lastChecked: new Date().toISOString() },
      { id: 'supabase', name: 'Supabase Auth & DB', category: 'Database', status: 'Healthy', latencyMs: 85, errorRatePercent: 0.0, details: 'Supabase PostgreSQL connection active.', lastChecked: new Date().toISOString() },
      { id: 'storage', name: 'Cloud Storage', category: 'Infrastructure', status: 'Healthy', latencyMs: 110, errorRatePercent: 0.0, details: 'Object storage active. Retention auto-purge operational.', lastChecked: new Date().toISOString() },
      { id: 'database', name: 'Config Database', category: 'Database', status: 'Healthy', latencyMs: 5, errorRatePercent: 0.0, details: 'In-memory + Supabase synced runtime store.', lastChecked: new Date().toISOString() },
      { id: 'worker_status', name: 'Worker Cluster Status', category: 'Worker', status: 'Healthy', latencyMs: 25, errorRatePercent: 0.0, details: 'All GPU video workers operational.', lastChecked: new Date().toISOString() }
    ]
  },
  brandingConfig: {
    appName: 'VirJoy AI',
    companyName: 'VirJoy Technologies Inc.',
    logoUrl: '/favicon.ico',
    splashLogoUrl: '/favicon.ico',
    appIconUrl: '/favicon.ico',
    supportEmail: 'support@virjoy.ai',
    websiteUrl: 'https://virjoy.ai',
    privacyPolicyUrl: 'https://virjoy.ai/privacy',
    termsUrl: 'https://virjoy.ai/terms',
    aboutUrl: 'https://virjoy.ai/about',
    socialLinks: {
      twitter: 'https://twitter.com/virjoyai',
      youtube: 'https://youtube.com/@virjoyai',
      discord: 'https://discord.gg/virjoy',
      github: 'https://github.com/virjoy-ai',
      instagram: 'https://instagram.com/virjoy.ai'
    },
    versionNotes: 'v3.5.0 Enterprise Control Center Build - High Performance Video Engine with Multi-Provider Auto-Fallback.'
  },
  securityLogs: {
    sessions: [
      {
        id: 'sec-1',
        adminEmail: 'puspendubey6031@gmail.com',
        ipAddress: '103.21.124.5',
        device: 'Chrome / macOS (1080p Desktop)',
        loginTime: '2026-07-30 00:01:10',
        lastActive: '2026-07-30 01:12:44',
        status: 'Active'
      },
      {
        id: 'sec-2',
        adminEmail: 'puspendubey6031@gmail.com',
        ipAddress: '103.21.124.5',
        device: 'Mobile Safari / iOS 18',
        loginTime: '2026-07-29 18:30:00',
        lastActive: '2026-07-29 19:15:00',
        status: 'Logged Out'
      }
    ],
    blockedIps: ['185.220.101.4', '198.51.100.22'],
    blockedUserEmails: ['spammer@baddomain.com'],
    failedLoginAttempts: 2
  },
  pwaConfig: {
    appName: 'VirJoy AI - AI Video & Studio',
    shortName: 'VirJoy AI',
    description: 'Create viral AI videos, studio graphics, banners, and logos instantly with VirJoy AI.',
    themeColor: '#4f46e5',
    backgroundColor: '#020617',
    appIconUrl: '/icon-512.png',
    maskableIconUrl: '/icon-512-maskable.png',
    startUrl: '/',
    displayMode: 'standalone',
    orientation: 'portrait',
    installPrompt: {
      enabled: true,
      title: 'Install VirJoy AI App',
      description: 'Get the full native mobile app experience with instant access, offline mode, and push notifications.',
      delaySeconds: 3,
      allowLater: true,
      allowNever: true,
    },
    offlineMode: {
      enabled: true,
      fallbackMessage: 'You are currently offline. Core app features are cached and ready when reconnected.',
    },
    updateNotice: {
      enabled: true,
      title: 'New Version Available',
      message: 'A fresh update with new features and optimizations is available for VirJoy AI.',
      buttonText: 'Update Now',
    },
    shortcuts: [
      { name: 'AI Video Generator', shortName: 'AI Video', url: '/?tab=video', icon: '/icon-192.png' },
      { name: 'Design Studio', shortName: 'Design', url: '/?tab=design', icon: '/icon-192.png' }
    ],
    pushNotifications: {
      enabled: false
    }
  },
  globalProcessingConfig: {
    enabled: true,
    maxConcurrentJobs: 5,
    maxQueueLimit: 20,
    timeoutSeconds: 120,
    enableAnimation: true,
    animationStyle: 'smooth',
    progressBarColor: '#6366f1',
    stageNames: {
      queued: 'Queued',
      preparing: 'Preparing AI',
      generating: 'Generating',
      rendering: 'Rendering',
      optimizing: 'Optimizing',
      saving: 'Saving',
      completed: 'Completed'
    },
    messages: {
      video: 'Synthesizing scene frames, neural voiceovers & timeline animations...',
      image: 'Crafting high-definition diffusion artwork...',
      logo: 'Generating vector emblems, typography & brand geometry...',
      banner: 'Layouting responsive header banner & background elements...',
      poster: 'Compositioning event typography & high-res graphic art...',
      thumbnail: 'Optimizing click-through contrast, subject focus & glow effects...',
      voice: 'Synthesizing natural neural speech cadence & acoustics...',
      subtitle: 'Translating captions & aligning video subtitle timing...',
      product_extraction: 'Scraping product metadata, images & features from store URL...',
      default: 'Processing your request with VirJoy AI Neural Engine...'
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
  get: (): AppConfig => {
    return {
      ...currentConfig,
      apiKeys: {
        geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || currentConfig.apiKeys?.geminiApiKey || '',
        groqApiKey: process.env.GROQ_API_KEY || currentConfig.apiKeys?.groqApiKey || '',
        cohereApiKey: process.env.COHERE_API_KEY || currentConfig.apiKeys?.cohereApiKey || '',
        huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || currentConfig.apiKeys?.huggingFaceApiKey || '',
        mistralApiKey: process.env.MISTRAL_API_KEY || currentConfig.apiKeys?.mistralApiKey || '',
        pexelsApiKey: process.env.PEXELS_API_KEY || currentConfig.apiKeys?.pexelsApiKey || '',
        pixabayApiKey: process.env.PIXABAY_API_KEY || currentConfig.apiKeys?.pixabayApiKey || '',
        unsplashApiKey: process.env.UNSPLASH_API_KEY || currentConfig.apiKeys?.unsplashApiKey || '',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || currentConfig.apiKeys?.razorpayKeyId || '',
        razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || currentConfig.apiKeys?.razorpayKeySecret || '',
        customProviders: (currentConfig.apiKeys?.customProviders || []).map(p => ({
          ...p,
          apiKey: process.env[p.envVar] || p.apiKey || ''
        }))
      }
    };
  },
  update: (newConfig: Partial<AppConfig>): AppConfig => {
    if (newConfig.apiKeys) {
      if (newConfig.apiKeys.geminiApiKey !== undefined) {
        process.env.GEMINI_API_KEY = newConfig.apiKeys.geminiApiKey.trim();
      }
      if (newConfig.apiKeys.groqApiKey !== undefined) {
        process.env.GROQ_API_KEY = newConfig.apiKeys.groqApiKey.trim();
      }
      if (newConfig.apiKeys.cohereApiKey !== undefined) {
        process.env.COHERE_API_KEY = newConfig.apiKeys.cohereApiKey.trim();
      }
      if (newConfig.apiKeys.huggingFaceApiKey !== undefined) {
        process.env.HUGGINGFACE_API_KEY = newConfig.apiKeys.huggingFaceApiKey.trim();
      }
      if (newConfig.apiKeys.mistralApiKey !== undefined) {
        process.env.MISTRAL_API_KEY = newConfig.apiKeys.mistralApiKey.trim();
      }
      if (newConfig.apiKeys.pexelsApiKey !== undefined) {
        process.env.PEXELS_API_KEY = newConfig.apiKeys.pexelsApiKey.trim();
      }
      if (newConfig.apiKeys.pixabayApiKey !== undefined) {
        process.env.PIXABAY_API_KEY = newConfig.apiKeys.pixabayApiKey.trim();
      }
      if (newConfig.apiKeys.unsplashApiKey !== undefined) {
        process.env.UNSPLASH_API_KEY = newConfig.apiKeys.unsplashApiKey.trim();
      }
      if (newConfig.apiKeys.razorpayKeyId !== undefined) {
        process.env.RAZORPAY_KEY_ID = newConfig.apiKeys.razorpayKeyId.trim();
      }
      if (newConfig.apiKeys.razorpayKeySecret !== undefined) {
        process.env.RAZORPAY_KEY_SECRET = newConfig.apiKeys.razorpayKeySecret.trim();
      }
      if (Array.isArray(newConfig.apiKeys.customProviders)) {
        newConfig.apiKeys.customProviders.forEach(p => {
          if (p.envVar && p.apiKey !== undefined) {
            process.env[p.envVar.trim()] = p.apiKey.trim();
          }
        });
      }
    }

    currentConfig = {
      ...currentConfig,
      ...newConfig,
      subscriptionLockConfig: newConfig.subscriptionLockConfig ? {
        ...(currentConfig.subscriptionLockConfig || defaultConfig.subscriptionLockConfig!),
        ...newConfig.subscriptionLockConfig,
        features: {
          ...(currentConfig.subscriptionLockConfig?.features || defaultConfig.subscriptionLockConfig!.features),
          ...(newConfig.subscriptionLockConfig?.features || {})
        },
        lockModal: {
          ...(currentConfig.subscriptionLockConfig?.lockModal || defaultConfig.subscriptionLockConfig!.lockModal),
          ...(newConfig.subscriptionLockConfig?.lockModal || {})
        },
        credits: {
          ...(currentConfig.subscriptionLockConfig?.credits || defaultConfig.subscriptionLockConfig!.credits),
          ...(newConfig.subscriptionLockConfig?.credits || {})
        },
        durations: newConfig.subscriptionLockConfig?.durations || currentConfig.subscriptionLockConfig?.durations || defaultConfig.subscriptionLockConfig!.durations
      } : (currentConfig.subscriptionLockConfig || defaultConfig.subscriptionLockConfig),
      plans: newConfig.plans ? { ...currentConfig.plans, ...newConfig.plans } : currentConfig.plans,
      aiProvider: newConfig.aiProvider ? { ...currentConfig.aiProvider, ...newConfig.aiProvider } : currentConfig.aiProvider,
      apiKeys: newConfig.apiKeys ? { ...currentConfig.apiKeys, ...newConfig.apiKeys } : currentConfig.apiKeys,
      voiceConfig: newConfig.voiceConfig ? { ...currentConfig.voiceConfig, ...newConfig.voiceConfig } : currentConfig.voiceConfig,
      subtitleConfig: newConfig.subtitleConfig ? { ...(currentConfig.subtitleConfig || {}), ...newConfig.subtitleConfig } as any : currentConfig.subtitleConfig,
      retention: newConfig.retention ? { ...currentConfig.retention, ...newConfig.retention } : currentConfig.retention,
      monetization: newConfig.monetization ? { ...currentConfig.monetization, ...newConfig.monetization } : currentConfig.monetization,
      themeConfig: newConfig.themeConfig ? { ...currentConfig.themeConfig, ...newConfig.themeConfig } : currentConfig.themeConfig,
      creditsConfig: newConfig.creditsConfig ? { ...currentConfig.creditsConfig, ...newConfig.creditsConfig } : currentConfig.creditsConfig,
      designStudioConfig: newConfig.designStudioConfig ? {
        ...(currentConfig.designStudioConfig || defaultConfig.designStudioConfig!),
        ...newConfig.designStudioConfig,
        costs: {
          ...(currentConfig.designStudioConfig?.costs || defaultConfig.designStudioConfig!.costs),
          ...(newConfig.designStudioConfig?.costs || {})
        }
      } : currentConfig.designStudioConfig,
      providerManagerConfig: newConfig.providerManagerConfig ? { ...currentConfig.providerManagerConfig, ...newConfig.providerManagerConfig } : currentConfig.providerManagerConfig,
      usersList: newConfig.usersList ? newConfig.usersList : currentConfig.usersList,
      paymentsList: newConfig.paymentsList ? newConfig.paymentsList : currentConfig.paymentsList,
      notificationsList: newConfig.notificationsList ? newConfig.notificationsList : currentConfig.notificationsList,
      crossPromotionsList: newConfig.crossPromotionsList ? newConfig.crossPromotionsList : currentConfig.crossPromotionsList,
      referralConfig: newConfig.referralConfig ? { ...currentConfig.referralConfig, ...newConfig.referralConfig } : currentConfig.referralConfig,
      activityLogs: newConfig.activityLogs ? newConfig.activityLogs : currentConfig.activityLogs,
      pwaConfig: newConfig.pwaConfig ? {
        ...(currentConfig.pwaConfig || defaultConfig.pwaConfig!),
        ...newConfig.pwaConfig,
        installPrompt: {
          ...(currentConfig.pwaConfig?.installPrompt || defaultConfig.pwaConfig!.installPrompt),
          ...(newConfig.pwaConfig?.installPrompt || {})
        },
        offlineMode: {
          ...(currentConfig.pwaConfig?.offlineMode || defaultConfig.pwaConfig!.offlineMode),
          ...(newConfig.pwaConfig?.offlineMode || {})
        },
        updateNotice: {
          ...(currentConfig.pwaConfig?.updateNotice || defaultConfig.pwaConfig!.updateNotice),
          ...(newConfig.pwaConfig?.updateNotice || {})
        }
      } : (currentConfig.pwaConfig || defaultConfig.pwaConfig),
      globalProcessingConfig: newConfig.globalProcessingConfig ? {
        ...(currentConfig.globalProcessingConfig || defaultConfig.globalProcessingConfig!),
        ...newConfig.globalProcessingConfig,
        stageNames: {
          ...(currentConfig.globalProcessingConfig?.stageNames || defaultConfig.globalProcessingConfig!.stageNames),
          ...(newConfig.globalProcessingConfig?.stageNames || {})
        },
        messages: {
          ...(currentConfig.globalProcessingConfig?.messages || defaultConfig.globalProcessingConfig!.messages),
          ...(newConfig.globalProcessingConfig?.messages || {})
        }
      } : (currentConfig.globalProcessingConfig || defaultConfig.globalProcessingConfig)
    };

    // Asynchronously save updated config to Supabase database settings table
    if (supabaseServer) {
      Promise.resolve(
        supabaseServer
          .from('settings')
          .upsert({
            id: 'app_config',
            created_at: new Date().toISOString()
          })
      ).catch(err => console.warn('Supabase settings persist note:', err?.message));

      Promise.resolve(
        supabaseServer
          .from('app_settings')
          .upsert({
            id: 'app_config',
            default_credits: currentConfig.subscriptionLockConfig?.credits?.creditsPerVideo || 5,
            per_video_cost: currentConfig.subscriptionLockConfig?.credits?.creditsPer10Seconds || 2,
            updated_at: new Date().toISOString()
          })
      ).catch(err => console.warn('Supabase app_settings persist note:', err?.message));
    }

    return currentConfig;
  },
  loadFromSupabase: async (): Promise<AppConfig> => {
    if (!supabaseServer) return currentConfig;
    try {
      const { data: plansData } = await supabaseServer.from('plans').select('*');
      if (plansData && plansData.length > 0) {
        const updatedPlans = { ...currentConfig.plans };
        plansData.forEach((p: any) => {
          if (p.name || p.id) {
            const key = (p.id || p.name) as PlanKey;
            if (updatedPlans[key]) {
              updatedPlans[key] = {
                ...updatedPlans[key],
                name: p.name || updatedPlans[key].name,
                priceINR: p.price_inr !== undefined ? p.price_inr : updatedPlans[key].priceINR,
                monthlyCredits: p.credits_per_month || updatedPlans[key].monthlyCredits,
                enabled: p.is_active !== undefined ? p.is_active : true
              };
            }
          }
        });
        currentConfig.plans = updatedPlans;
      }
    } catch (err: any) {
      console.warn('Supabase config load note:', err?.message);
    }
    return currentConfig;
  },
  resetToDefault: (): AppConfig => {
    currentConfig = JSON.parse(JSON.stringify(defaultConfig));
    return currentConfig;
  }
};
