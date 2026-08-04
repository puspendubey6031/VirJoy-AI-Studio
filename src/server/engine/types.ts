export type WorkflowStage =
  | 'queued'
  | 'prompt_analysis'
  | 'script_generation'
  | 'scene_breakdown'
  | 'media_collection'
  | 'voice_generation'
  | 'subtitle_generation'
  | 'timeline_builder'
  | 'video_composition'
  | 'render_queue'
  | 'worker_processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PromptIntelligenceResult {
  detectedLanguage: string;
  category: 'Commercial' | 'Educational' | 'Reel/Short' | 'SaaS Explainer' | 'Storytelling' | 'Product Showcase' | 'Entertainment';
  tone: 'Energetic' | 'Cinematic' | 'Professional' | 'Casual' | 'Dramatic' | 'Inspirational' | 'Humorous';
  emotion: 'Excited' | 'Calm' | 'Urgent' | 'Warm' | 'Mysterious' | 'Confident';
  visualStyle: '3D Render' | 'Cinematic Live Action' | 'Minimalist Animated' | 'Neon Cyberpunk' | 'Documentary' | 'Isometric';
  targetAudience: string;
  targetPlatform: 'Instagram Reels' | 'TikTok' | 'YouTube Shorts' | 'YouTube 16:9' | 'LinkedIn' | 'Universal';
  recommendedDurationSeconds: number;
  recommendedSceneCount: number;
  extractedKeywords: string[];
  suggestedMusicMood: 'upbeat_electronic' | 'cinematic_synth' | 'ambient_chill' | 'dark_dramatic' | 'acoustic_warm';
}

export interface GranularSceneSpec {
  sceneId: string;
  sceneNumber: number;
  durationSeconds: number;
  narrationText: string;
  visualPrompt: string;
  cameraMotion: 'pan_left' | 'pan_right' | 'zoom_in' | 'zoom_out' | 'drone_flyby' | 'static_cinematic' | 'handheld_tilt';
  transitionEffect: 'fade_to_black' | 'cross_dissolve' | 'fast_wipe' | 'glitch_slide' | 'zoom_burst' | 'none';
  visualEffect: 'cinematic_color_grade' | 'particle_dust' | 'neon_glow' | 'lens_flare' | 'vignette' | 'none';
  subtitleStartTime: number;
  subtitleEndTime: number;
  musicMood: string;
  assignedAssetUrl?: string;
  assignedAssetSource?: 'user_upload' | 'ai_generated' | 'pexels' | 'pixabay' | 'unsplash' | 'cached';
}

export interface MediaAssetSpec {
  id: string;
  source: 'user_upload' | 'ai_generated' | 'pexels' | 'pixabay' | 'unsplash' | 'cached';
  assetType: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  cacheKey: string;
  priority: number; // 1 = highest
  width?: number;
  height?: number;
  attribution?: string;
}

export interface VoiceEngineSpec {
  provider: 'edge_tts' | 'google_tts' | 'elevenlabs' | 'custom_adapter';
  voiceId: string;
  voiceName: string;
  language: string;
  emotion: string;
  speedMultiplier: number;
  pitchMultiplier: number;
  audioBufferUrl?: string;
  audioDurationSeconds?: number;
}

export interface SubtitleCue {
  id: string;
  index: number;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
  translatedText?: string;
}

export interface SubtitleEngineSpec {
  format: 'srt' | 'vtt' | 'ass' | 'burned';
  sourceLanguage: string;
  targetLanguage?: string;
  cues: SubtitleCue[];
  rawFormattedContent: string;
}

export interface TimelinePackage {
  id: string;
  title: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  totalDurationSeconds: number;
  scenes: GranularSceneSpec[];
  mediaAssets: MediaAssetSpec[];
  voiceAudioUrl: string;
  backgroundMusicUrl: string;
  subtitles: SubtitleEngineSpec;
  overlayConfig?: {
    logoUrl?: string;
    watermarkText?: string;
    brandColor?: string;
  };
}

export interface RenderInstructionPackage {
  packageId: string;
  rendererTarget: 'ffmpeg' | 'remotion' | 'gpu_worker';
  resolution: string; // e.g. "1080x1920"
  frameRate: number;  // 30 or 60
  bitrateKbps: number;
  timeline: TimelinePackage;
  rawFFmpegCommand?: string;
  rawRemotionConfig?: Record<string, any>;
  gpuWorkerPayload?: Record<string, any>;
}

export interface StageProgress {
  stage: WorkflowStage;
  stageName: string;
  progressPercent: number; // 0 to 100
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  finishedAt?: string;
  details?: string;
  error?: string;
}

export interface EngineCheckpoint {
  jobId: string;
  currentStage: WorkflowStage;
  overallProgressPercent: number;
  completedStages: WorkflowStage[];
  stageProgresses: Record<WorkflowStage, StageProgress>;
  promptIntelligence?: PromptIntelligenceResult;
  scriptText?: string;
  scenes?: GranularSceneSpec[];
  mediaAssets?: MediaAssetSpec[];
  voiceSpec?: VoiceEngineSpec;
  subtitleSpec?: SubtitleEngineSpec;
  timelinePackage?: TimelinePackage;
  renderPackage?: RenderInstructionPackage;
  costBreakdown: {
    promptTokens: number;
    completionTokens: number;
    ttsCharacters: number;
    imageGenerations: number;
    estimatedCostUSD: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VideoModelAdapter {
  providerName: string;
  isAvailable(): Promise<boolean>;
  generateVideoClip(prompt: string, durationSec: number, aspectRatio: string): Promise<{
    clipUrl: string;
    costUSD: number;
    providerJobId: string;
  }>;
}
