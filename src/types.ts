export type UserRole = 'Owner' | 'Admin' | 'Moderator' | 'Premium User' | 'Free User';

export type PlanKey = 'Free' | '₹199' | '₹399' | '₹799';

export interface FeatureLockRule {
  enabled: boolean;
  minPlan: PlanKey | string;
  requiredCredits: number;
  monthlyLimit?: number;
  customUpgradeMsg?: string;
}

export interface LockModalContent {
  title: string;
  description: string;
  benefits: string[];
  buttonText: string;
  bannerImage?: string;
  offerText?: string;
  upgradeUrl?: string;
}

export interface DynamicDurationConfig {
  seconds: number;
  label: string;
  minPlan: PlanKey | string;
  requiredCredits: number;
  enabled: boolean;
}

export interface SubscriptionLockConfig {
  features: {
    videoGenerator: FeatureLockRule;
    imageGenerator: FeatureLockRule;
    logoGenerator: FeatureLockRule;
    bannerGenerator: FeatureLockRule;
    posterGenerator: FeatureLockRule;
    thumbnailGenerator: FeatureLockRule;
    aiVoiceAccess: FeatureLockRule;
    subtitleAccess: FeatureLockRule;
    ideaToVideoWorkflow: FeatureLockRule;
    productUrlExtraction: FeatureLockRule;
    premiumTemplates: FeatureLockRule;
    highResExport: FeatureLockRule;
  };
  lockModal: LockModalContent;
  credits: {
    creditsPerVideo: number;
    creditsPer10Seconds: number;
    dailyFreeCredits: number;
    trialCredits: number;
    bonusCredits: number;
    refundOnFailure: boolean;
  };
  durations: DynamicDurationConfig[];
}

export interface PlanConfig {
  id: PlanKey | string;
  name: string;
  priceINR: number;
  monthlyCredits: number;           // e.g. 30 credits for Free, 300 for ₹199, 1200 for ₹399, 3600 for ₹799
  maxSingleVideoCredits: number;    // max credits allowed for a single video generation
  maxMonthlyDurationSeconds: number; // internal technical parameter
  maxVideoDurationSeconds: number;   // max length per single video in seconds
  exportQuality: '720p' | '1080p' | '4K' | string;
  hasWatermark: boolean;
  hasIdeaToVideoWorkflow: boolean;
  hasProductUrlExtraction: boolean;
  hasPriorityRendering: boolean;
  hasVoiceAccess?: boolean;
  hasSubtitleAccess?: boolean;
  showAds: boolean;
  features: string[];
  badge?: string;
  priceMonthly?: number;
  priceYearly?: number;
  discountPercent?: number;
  trialDays?: number;
  maxQuality?: string;
  enabled?: boolean;
  order?: number;
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
  explanationMessage?: string;
  allowUserExtendedRetention?: boolean;
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
  rewardedUnitId?: string;
  rewardedCreditsBonus?: number;
  showOnGeneration?: boolean;
  showBeforeDownload?: boolean;
  showOnNavigation?: boolean;
}

export interface LegalPoliciesConfig {
  privacyPolicy: string;
  termsAndConditions: string;
  aiUsagePolicy: string;
  lastUpdated: string;
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
  gender: 'male' | 'female' | 'child' | 'adult' | 'neutral';
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

export interface SubtitleColorOption {
  name: string;
  hex: string;
}

export interface SubtitleConfig {
  autoSubtitle: boolean;
  enabled: boolean;
  position: 'Bottom' | 'Center' | 'Top';
  font: string;
  color: string;
  size: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  animation: 'Pop-in' | 'Fade' | 'Bounce' | 'Word-Highlight';
  defaultSubtitleLanguage?: string;
  supportedFonts: string[];
  supportedColors: SubtitleColorOption[];
  supportedPositions: string[];
  supportedAnimations: string[];
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

export interface ThemeItem {
  id: string;
  name: string;
  type: 'single' | 'gradient' | 'mixed';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  buttonColor: string;
  borderColor: string;
  textColor: string;
  enabled: boolean;
  active: boolean;
}

export interface ThemeConfig {
  activeThemeId: string;
  themes: ThemeItem[];
}

export interface CreditsConfig {
  creditsPerVideo: number;
  creditsPer10Seconds: number;
  dailyFreeCredits: number;
  trialCredits: number;
  bonusCredits: number;
}

export interface DesignHistoryItem {
  id: string;
  toolType: 'image' | 'logo' | 'poster' | 'banner' | 'thumbnail';
  prompt: string;
  compiledPrompt?: string;
  imageUrl: string;
  creditsUsed: number;
  aspectRatio: string;
  style: string;
  createdAt: string;
  expiresAt: string;
}

export interface DesignStudioConfig {
  costs: {
    image: number;
    thumbnail: number;
    poster: number;
    logo: number;
    banner: number;
  };
  resolutionOptions: string[];
  qualityOptions: string[];
  maxImageCount: number;
  retryCount: number;
  timeoutSeconds: number;
  processingLimits: number;
  historyRetentionHours: number;
}

export interface ProviderItem {
  id: string;
  name: string;
  providerType: 'gemini' | 'groq' | 'cohere' | 'mistral' | 'huggingface' | 'edgetts' | 'gtts' | 'pixabay' | 'pexels' | 'pollinations' | 'custom';
  model: string;
  endpoint: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  status: 'Operational' | 'Degraded' | 'Offline';
}

export interface APIProviderManagerConfig {
  providers: ProviderItem[];
  fallbackOrder: string[];
}

export interface AdminUserItem {
  id: string;
  avatarUrl?: string;
  name: string;
  email: string;
  mobile?: string;
  country: string;
  joinDate: string;
  lastActive: string;
  role?: UserRole;
  accountType: 'Free' | 'Pro' | 'Enterprise';
  subscriptionStatus: 'Active' | 'Cancelled' | 'Expired' | 'Trial';
  credits: number;
  totalVideos: number;
  referralCode: string;
  referralCount: number;
  status: 'Active' | 'Blocked' | 'Pending';
}

export interface PaymentItem {
  id: string;
  transactionId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  planName: string;
  date: string;
  status: 'Success' | 'Failed' | 'Pending' | 'Refunded';
  paymentMethod: 'Stripe' | 'Razorpay' | 'PayPal' | 'Credit Card' | 'Crypto';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'Popup' | 'Banner' | 'Announcement' | 'Maintenance' | 'Update Notice';
  targetAudience: 'All Users' | 'Premium' | 'Free' | 'Selected Users';
  targetUserEmails?: string[];
  ctaUrl?: string;
  ctaText?: string;
  scheduledAt?: string;
  enabled: boolean;
  createdAt: string;
}

export interface CrossPromotionItem {
  id: string;
  appName: string;
  logoUrl?: string;
  bannerUrl?: string;
  description: string;
  ctaButtonText: string;
  playStoreUrl?: string;
  websiteUrl?: string;
  placement: 'Home' | 'Settings' | 'Success Screen' | 'Popup';
  enabled: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  priority: number;
}

export interface PlanReferralReward {
  referrerCredits: number;
  newUserBonusCredits: number;
  enabled: boolean;
}

export interface ReferralNotificationTemplates {
  referrerMessage: string;
  newUserMessage: string;
  refundReversalMessage: string;
}

export interface ReferralConfig {
  campaignStatus: 'Active' | 'Paused';
  planRewards: Record<string, PlanReferralReward>;
  notifications: ReferralNotificationTemplates;
  referralBonusCredits: number;
  inviterRewardCredits: number;
  inviteeRewardCredits: number;
  referralBannerUrl?: string;
  referralPopupMessage?: string;
  analytics: {
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    expiredReferrals: number;
    cancelledReferrals: number;
    totalRewardsPaid: number;
  };
}

export interface ReferralItem {
  id: string;
  referrerUserId: string;
  referrerCode: string;
  referredUserId: string;
  referredUserName?: string;
  referredUserEmail?: string;
  status: 'Pending' | 'Completed' | 'Expired' | 'Cancelled' | 'Refunded';
  planKey?: PlanKey;
  amountPaid?: number;
  referrerCreditsAwarded?: number;
  newUserCreditsAwarded?: number;
  paymentId?: string;
  createdAt: string;
  completedAt?: string;
  refundedAt?: string;
}

export interface CreditLogItem {
  id: string;
  userId: string;
  userEmail?: string;
  type: 'Referral_Earned' | 'Referral_Bonus' | 'Referral_Reversed' | 'Subscription_Grant' | 'Usage' | 'Admin_Adjustment';
  amount: number;
  description: string;
  referralId?: string;
  createdAt: string;
}

export interface TopReferrerItem {
  userId: string;
  userName: string;
  userEmail: string;
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  totalCreditsEarned: number;
}

export interface ActivityLogItem {
  id: string;
  actionType: 'Admin Login' | 'Save Config' | 'Delete User' | 'API Change' | 'Credit Change' | 'Theme Change' | 'Plan Change' | 'Notification Sent';
  details: string;
  adminUser: string;
  timestamp: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  title?: string;
  message: string;
  expectedReturnTime: string;
  imageUrl?: string;
  displayMode: 'Banner' | 'Popup' | 'Full Page';
  whitelistedAdminEmails: string[];
  whitelistedIps: string[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  iconName?: string;
  badgeText?: string;
}

export interface OnboardingConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  themeColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  skipButtonText: string;
  nextButtonText: string;
  prevButtonText: string;
  finishButtonText: string;
  steps: OnboardingStep[];
}

export interface FeedbackItem {
  id: string;
  type: 'Bug Report' | 'Feature Suggestion';
  category: string;
  title: string;
  description: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  status: 'Open' | 'In Progress' | 'Fixed' | 'Reviewed' | 'Closed';
  adminReply?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackConfig {
  enabled: boolean;
  categories: string[];
}

export interface SystemHealthThresholds {
  latencyWarningMs: number;
  latencyOfflineMs: number;
  errorRateWarningPercent: number;
  errorRateOfflinePercent: number;
  storageWarningPercent: number;
  maxWorkerQueueJobs: number;
  autoRefreshIntervalSeconds: number;
}

export interface SystemHealthServiceStatus {
  id: string;
  name: string;
  category: 'API' | 'Infrastructure' | 'Database' | 'Worker';
  status: 'Healthy' | 'Warning' | 'Offline';
  latencyMs: number;
  errorRatePercent: number;
  details: string;
  lastChecked: string;
}

export interface SystemHealthConfig {
  autoRefreshEnabled: boolean;
  thresholds: SystemHealthThresholds;
  services?: SystemHealthServiceStatus[];
}

export interface BrandingConfig {
  appName: string;
  companyName: string;
  logoUrl: string;
  splashLogoUrl: string;
  appIconUrl: string;
  supportEmail: string;
  websiteUrl: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  aboutUrl: string;
  socialLinks: {
    twitter?: string;
    youtube?: string;
    discord?: string;
    github?: string;
    instagram?: string;
  };
  versionNotes: string;
}

export interface SecuritySessionItem {
  id: string;
  adminEmail: string;
  ipAddress: string;
  device: string;
  loginTime: string;
  lastActive: string;
  status: 'Active' | 'Logged Out' | 'Failed Attempt' | 'Suspicious';
}

export interface SecurityLogsConfig {
  sessions: SecuritySessionItem[];
  blockedIps: string[];
  blockedUserEmails: string[];
  failedLoginAttempts: number;
}

export interface PWAShortcutItem {
  name: string;
  shortName?: string;
  url: string;
  icon?: string;
}

export interface PWAConfig {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  appIconUrl: string;
  maskableIconUrl: string;
  startUrl: string;
  displayMode: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'any' | 'landscape';
  installPrompt: {
    enabled: boolean;
    title: string;
    description: string;
    delaySeconds: number;
    allowLater: boolean;
    allowNever: boolean;
  };
  offlineMode: {
    enabled: boolean;
    fallbackMessage: string;
  };
  updateNotice: {
    enabled: boolean;
    title: string;
    message: string;
    buttonText: string;
  };
  shortcuts: PWAShortcutItem[];
  pushNotifications?: {
    enabled: boolean;
    vapidPublicKey?: string;
  };
}

export interface WorkerEngineConfig {
  workerMode: 'Local' | 'External';
  workerUrl: string;
  apiKey: string;
  maxConcurrentJobs: number;
  timeoutSeconds: number;
  retryCount: number;
  allowedWorkerTypes: ('FFmpeg' | 'Remotion' | 'Runway API' | 'Pika API' | 'Luma API' | 'Stable Video Diffusion' | 'Custom GPU VPS')[];
}

export type GlobalJobType = 
  | 'video'
  | 'image'
  | 'logo'
  | 'banner'
  | 'poster'
  | 'thumbnail'
  | 'voice'
  | 'subtitle'
  | 'product_extraction'
  | string;

export type GlobalJobStage = 
  | 'queued'
  | 'preparing'
  | 'generating'
  | 'rendering'
  | 'optimizing'
  | 'saving'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface GlobalProcessingStageNames {
  queued: string;
  preparing: string;
  generating: string;
  rendering: string;
  optimizing: string;
  saving: string;
  completed: string;
}

export interface GlobalProcessingConfig {
  enabled: boolean;
  maxConcurrentJobs: number;
  maxQueueLimit: number;
  timeoutSeconds: number;
  enableAnimation: boolean;
  animationStyle: 'smooth' | 'shimmer' | 'pulse' | 'wave';
  progressBarColor: string;
  stageNames: GlobalProcessingStageNames;
  messages: {
    video: string;
    image: string;
    logo: string;
    banner: string;
    poster: string;
    thumbnail: string;
    voice: string;
    subtitle: string;
    product_extraction: string;
    default: string;
  };
}

export interface GlobalAIJob {
  id: string;
  type: GlobalJobType;
  title: string;
  userId: string;
  stage: GlobalJobStage;
  stageLabel: string;
  progress: number;
  etaSeconds: number;
  statusMessage: string;
  params: any;
  result?: any;
  error?: string | null;
  creditsDeducted: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface DeveloperModeConfig {
  enabled: boolean;
  testPaymentMode: boolean;
  forcePremiumMode: boolean;
  apiDebugEnabled: boolean;
  creditDebugEnabled: boolean;
  aiUsageMonitorEnabled: boolean;
  costMonitorEnabled: boolean;
  errorLogsEnabled: boolean;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  category: 'Prompt Template' | 'Video Preset' | 'Voice Persona' | 'AI Plugin' | 'Graphic Style';
  description: string;
  creditsCost: number;
  author: string;
  downloads: number;
  rating: number;
  isOfficial: boolean;
  enabled: boolean;
  imageUrl?: string;
  createdAt: string;
}

export interface CommissionItem {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  commissionRatePercent: number;
  totalEarnedINR: number;
  pendingPayoutINR: number;
  status: 'Active' | 'Paused' | 'Pending Review';
  referralCount: number;
  lastPayoutDate?: string;
}

export interface ToolItem {
  id: string;
  name: string;
  key: string;
  category: 'Video' | 'Graphics' | 'Audio' | 'Utility';
  minRole: UserRole;
  minPlan: PlanKey | string;
  creditsPerUse: number;
  enabled: boolean;
  description: string;
  iconName?: string;
}

export interface ToolManagerConfig {
  tools: ToolItem[];
}

export interface WebAppManagerConfig {
  appName: string;
  appTitle: string;
  appDescription: string;
  primaryDomain: string;
  maintenanceMode: boolean;
  allowPublicSignups: boolean;
  enableGuestMode: boolean;
  defaultUserRole: UserRole;
  metaKeywords: string[];
  ownerEmail: string;
}

export interface AppConfig {
  plans: Record<string, PlanConfig>;
  subscriptionLockConfig?: SubscriptionLockConfig;
  aiProvider: AIProviderConfig;
  apiKeys?: APIKeysConfig;
  voiceConfig: VoiceConfig;
  subtitleConfig?: SubtitleConfig;
  retention: RetentionConfig;
  monetization: MonetizationConfig;
  themeConfig?: ThemeConfig;
  creditsConfig?: CreditsConfig;
  designStudioConfig?: DesignStudioConfig;
  providerManagerConfig?: APIProviderManagerConfig;
  usersList?: AdminUserItem[];
  paymentsList?: PaymentItem[];
  notificationsList?: NotificationItem[];
  crossPromotionsList?: CrossPromotionItem[];
  referralConfig?: ReferralConfig;
  activityLogs?: ActivityLogItem[];
  maintenanceConfig?: MaintenanceConfig;
  onboardingConfig?: OnboardingConfig;
  feedbackConfig?: FeedbackConfig;
  feedbackList?: FeedbackItem[];
  systemHealthConfig?: SystemHealthConfig;
  brandingConfig?: BrandingConfig;
  securityLogs?: SecurityLogsConfig;
  workerEngineConfig?: WorkerEngineConfig;
  pwaConfig?: PWAConfig;
  globalProcessingConfig?: GlobalProcessingConfig;
  legalPolicies?: LegalPoliciesConfig;
  developerModeConfig?: DeveloperModeConfig;
  marketplaceItems?: MarketplaceItem[];
  commissionItems?: CommissionItem[];
  toolManagerConfig?: ToolManagerConfig;
  webAppManagerConfig?: WebAppManagerConfig;
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
  cameraMotion?: string;
  transitionEffect?: string;
  visualEffect?: string;
  subtitleStartTime?: number;
  subtitleEndTime?: number;
  voiceAudioUrl?: string;
  backgroundMusicUrl?: string;
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
  subtitleEnabled?: boolean;
  subtitleLanguage?: string;
  subtitlePosition?: string;
  subtitleFont?: string;
  subtitleColor?: string;
  subtitleSize?: string;
  subtitleAnimation?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  inputs: VideoProjectInputs;
  aspectRatio: '16:9' | '9:16' | '1:1';
  totalDurationSeconds: number;
  language: string;
  subtitleLanguage?: string;
  voice: string;
  voiceTone: string;
  scenes: Scene[];
  status: 'draft' | 'planning' | 'rendering' | 'completed' | 'failed' | 'expired';
  planUsed: PlanKey;
  watermarked: boolean;
  exportQuality: string;
  shareUrl: string;
  outputUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  isOwner?: boolean;
  isAdmin?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  avatarUrl?: string;
  provider?: 'email' | 'google' | 'github';
  createdAt?: string;
}

export interface UserStats {
  userId: string;
  email?: string;
  userEmail?: string;
  role?: UserRole;
  isOwner?: boolean;
  isAdmin?: boolean;
  developerMode?: boolean;
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
  designHistory?: DesignHistoryItem[];
}

