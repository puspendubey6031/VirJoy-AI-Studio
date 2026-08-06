import type {
  GranularSceneSpec,
  MediaAssetSpec,
  SubtitleEngineSpec,
  TimelinePackage,
  VoiceEngineSpec
} from './types.js';

export class TimelineEngine {
  public assembleTimelinePackage(params: {
    title: string;
    aspectRatio: '16:9' | '9:16' | '1:1';
    scenes: GranularSceneSpec[];
    mediaAssets: MediaAssetSpec[];
    voiceSpec: VoiceEngineSpec;
    subtitles: SubtitleEngineSpec;
    hasWatermark?: boolean;
    watermarkText?: string;
    brandLogoUrl?: string;
  }): TimelinePackage {
    const {
      title,
      aspectRatio,
      scenes,
      mediaAssets,
      voiceSpec,
      subtitles,
      hasWatermark = false,
      watermarkText = 'Created with VirJoy AI',
      brandLogoUrl
    } = params;

    const totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

    // Resolve background music track based on music mood
    const musicMood = scenes[0]?.musicMood || 'cinematic_synth';
    const backgroundMusicUrl = this.resolveMusicTrackUrl(musicMood);

    return {
      id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      aspectRatio,
      totalDurationSeconds,
      scenes,
      mediaAssets,
      voiceAudioUrl: voiceSpec.audioBufferUrl || 'https://assets.virjoy.ai/audio/synthesized_voice.mp3',
      backgroundMusicUrl,
      subtitles,
      overlayConfig: {
        logoUrl: brandLogoUrl,
        watermarkText: hasWatermark ? watermarkText : undefined,
        brandColor: '#6366f1'
      }
    };
  }

  private resolveMusicTrackUrl(mood: string): string {
    // Royalty-free background music tracks from local static server
    const musicMap: Record<string, string> = {
      upbeat_electronic: '/audio/upbeat.mp3',
      cinematic_synth: '/audio/cinematic.mp3',
      ambient_chill: '/audio/ambient.mp3',
      dark_dramatic: '/audio/dramatic.mp3',
      acoustic_warm: '/audio/acoustic.mp3'
    };
    return musicMap[mood] || musicMap.cinematic_synth;
  }
}

export const timelineEngine = new TimelineEngine();
