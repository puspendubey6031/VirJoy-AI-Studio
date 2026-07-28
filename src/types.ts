export type PlanKey = 'Free' | '₹199' | '₹399' | '₹799';

export interface PlanConfig {
  id: PlanKey;
  name: string;
  priceINR: number;
  monthlyCredits: number;           // e.g. 30 credits for Free, 300 for ₹199, 1200 for ₹399, 3600 for ₹799
  maxSingleVideoCredits: number;    // max credits allowed for a single video generation
  maxMonthlyDurationSeconds: number; // internal technical parameter
  maxVideoDurationSeconds: number;   // max length per single video in seconds
  exportQuality: '720p' | '1080p' | '4K';
  hasWatermark: boolean;
  hasIdeaToVideoWorkflow: boolean;
  hasProductUrlExtraction: boolean;
  hasPriorityRendering: boolean;
  showAds: boolean;
  features: string[];
}

export interface AIProviderConfig {
  provider: 'gemini' | 'veo' | 'custom';
  model: string;
  systemPrompt: string;
  fallbackEnabled: boolean;
}

export interface RetentionConfig {
  retentionHours: number; // default 24 hours
  autoCleanupIntervalMinutes: number;
}

export interface PlacementConfig {
  headerBanner: boolean;
  sidebarRect: boolean;
  queueOverlay: boolean;
  exportBanner: boolean;
}

export interface MobileAdMobConfig {
  enabled: boolean;
  appId: string;
  bannerUnitId: string;
  interstitialUnitId: string;
}

export interface MonetizationConfig {
  adSenseEnabled: boolean;
  pubId: string;
  placements: PlacementConfig;
  mobileAdMobConfig: MobileAdMobConfig;
}

export interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  flag?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  provider: string;
  sampleDescription?: string;
  minPlan?: PlanKey;
}

export interface DurationOption {
  seconds: number;
  label: string;
  minPlan: PlanKey;
}

export interface VoiceConfig {
  activeVoiceProvider: string;
  supportedLanguages: LanguageOption[];
  supportedVoices: VoiceOption[];
  supportedTones: string[];
  durationOptions: DurationOption[];
}

export interface CustomProviderKey {
  id: string;
  name: string;
  envVar: string;
  apiKey: string;
}

export interface APIKeysConfig {
  geminiApiKey?: string;
  groqApiKey?: string;
  cohereApiKey?: string;
  huggingFaceApiKey?: string;
  mistralApiKey?: string;
  pexelsApiKey?: string;
  pixabayApiKey?: string;
  unsplashApiKey?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  customProviders?: CustomProviderKey[];
}

export interface AppConfig {
  plans: Record<PlanKey, PlanConfig>;
  aiProvider: AIProviderConfig;
  apiKeys?: APIKeysConfig;
  voiceConfig: VoiceConfig;
  retention: RetentionConfig;
  monetization: MonetizationConfig;
}

export interface Scene {
  id: string;
  title: string;
  duration: number; // seconds
  narration: string;
  caption: string;
  visualPrompt: string;
  bgGradient: string;
  iconName?: string;
  imageUrl?: string;
}

export interface ProductMetadata {
  title: string;
  vendor?: string;
  price?: string;
  rating?: string;
  features?: string[];
  imageUrl?: string;
  description?: string;
}

export interface VideoProjectInputs {
  textPrompt?: string;
  images?: string[];
  videoClips?: string[];
  screenshots?: string[];
  productUrl?: string;
  productData?: ProductMetadata;
  ideaConcept?: string;
  language?: string;
  voice?: string;
  voiceTone?: string;
  targetDurationSeconds?: number;
}

export interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  inputs: VideoProjectInputs;
  aspectRatio: '16:9' | '9:16' | '1:1';
  totalDurationSeconds: number;
  language: string;
  voice: string;
  voiceTone: string;
  scenes: Scene[];
  status: 'draft' | 'planning' | 'rendering' | 'completed' | 'failed' | 'expired';
  planUsed: PlanKey;
  watermarked: boolean;
  exportQuality: string;
  shareUrl: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  avatarUrl?: string;
  provider?: 'email' | 'google' | 'github';
  createdAt?: string;
}

export interface UserStats {
  userId: string;
  currentPlan: PlanKey;
  usedCredits: number;
  monthlyCredits: number;
  remainingCredits: number;
  usedMonthlyDurationSeconds: number;
  history: {
    projectId: string;
    title: string;
    durationSeconds: number;
    creditsUsed?: number;
    createdAt: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    exportQuality?: string;
    status?: string;
  }[];
}

