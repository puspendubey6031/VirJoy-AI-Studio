import { RenderInstructionPackage, TimelinePackage } from './types';

export class VideoComposer {
  public compileRenderPackage(
    timeline: TimelinePackage,
    targetRenderer: 'ffmpeg' | 'remotion' | 'gpu_worker' = 'ffmpeg'
  ): RenderInstructionPackage {
    const resolutionMap: Record<TimelinePackage['aspectRatio'], string> = {
      '16:9': '1920x1080',
      '9:16': '1080x1920',
      '1:1': '1080x1080'
    };

    const resolution = resolutionMap[timeline.aspectRatio] || '1080x1920';

    const rawFFmpegCommand = this.buildFFmpegScript(timeline, resolution);
    const rawRemotionConfig = this.buildRemotionConfig(timeline, resolution);
    const gpuWorkerPayload = this.buildGPUWorkerPayload(timeline, resolution);

    return {
      packageId: `render_pkg_${Date.now()}`,
      rendererTarget: targetRenderer,
      resolution,
      frameRate: 30,
      bitrateKbps: 8000,
      timeline,
      rawFFmpegCommand,
      rawRemotionConfig,
      gpuWorkerPayload
    };
  }

  private buildFFmpegScript(timeline: TimelinePackage, resolution: string): string {
    const inputs = timeline.scenes
      .map((s, idx) => `-loop 1 -t ${s.durationSeconds} -i "${s.assignedAssetUrl || 'placeholder.jpg'}"`)
      .join(' ');

    const filterComplex = timeline.scenes
      .map((s, idx) => `[${idx}:v]scale=${resolution.replace('x', ':')}:force_original_aspect_ratio=decrease,pad=${resolution.replace('x', ':')}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${idx}];`)
      .join('');

    const concatFilter = timeline.scenes.map((_, idx) => `[v${idx}]`).join('') + `concat=n=${timeline.scenes.length}:v=1:a=0[vconcat]`;

    return `ffmpeg -y ${inputs} -i "${timeline.voiceAudioUrl}" -i "${timeline.backgroundMusicUrl}" -filter_complex "${filterComplex}${concatFilter}" -map "[vconcat]" -map ${timeline.scenes.length}:a -map ${
      timeline.scenes.length + 1
    }:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest output.mp4`;
  }

  private buildRemotionConfig(timeline: TimelinePackage, resolution: string): Record<string, any> {
    const [width, height] = resolution.split('x').map(Number);

    return {
      compositionId: 'VirJoyVideoSequence',
      width,
      height,
      fps: 30,
      durationInFrames: Math.round(timeline.totalDurationSeconds * 30),
      props: {
        title: timeline.title,
        aspectRatio: timeline.aspectRatio,
        scenes: timeline.scenes,
        voiceUrl: timeline.voiceAudioUrl,
        musicUrl: timeline.backgroundMusicUrl,
        subtitles: timeline.subtitles,
        overlay: timeline.overlayConfig
      }
    };
  }

  private buildGPUWorkerPayload(timeline: TimelinePackage, resolution: string): Record<string, any> {
    return {
      version: '1.0.0',
      jobType: 'VIRJOY_AI_VIDEO_SYNTHESIS',
      meta: {
        title: timeline.title,
        resolution,
        totalDurationSeconds: timeline.totalDurationSeconds
      },
      timeline: {
        scenes: timeline.scenes,
        voiceoverUrl: timeline.voiceAudioUrl,
        soundtrackUrl: timeline.backgroundMusicUrl,
        subtitles: timeline.subtitles.cues,
        watermark: timeline.overlayConfig?.watermarkText
      }
    };
  }
}

export const videoComposer = new VideoComposer();
