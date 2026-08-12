import type { RenderInstructionPackage, TimelinePackage } from './types.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  public async executeFFmpegRender(
    timeline: TimelinePackage,
    outputFilePath: string
  ): Promise<{
    outputPath: string;
    downloadedImages: { sceneIndex: number; localPath: string; originalUrl: string }[];
    voiceLocalPath: string;
    musicLocalPath: string;
    ffmpegCommand: string;
    stdout: string;
    stderr: string;
    durationMs: number;
    fileSizeBytes: number;
  }> {
    const startTime = Date.now();
    const tmpDir = path.join(process.cwd(), 'tmp_render_' + Date.now());
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const resolutionMap: Record<TimelinePackage['aspectRatio'], string> = {
      '16:9': '1920x1080',
      '9:16': '1080x1920',
      '1:1': '1080x1080'
    };
    const resolution = resolutionMap[timeline.aspectRatio] || '1920x1080';
    const [width, height] = resolution.split('x').map(Number);

    // 1. Download Scene Images locally (sequential or batched with retries to prevent rate limiting)
    const downloadedImages: { sceneIndex: number; localPath: string; originalUrl: string }[] = [];

    for (let i = 0; i < timeline.scenes.length; i++) {
      const scene = timeline.scenes[i];
      let imageUrl = scene.assignedAssetUrl || '';
      const localImagePath = path.join(tmpDir, `scene_${i + 1}.jpg`);

      let downloaded = false;
      
      // Try primary assigned URL first with retries
      for (let attempt = 1; attempt <= 2; attempt++) {
        if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
          try {
            const res = await fetch(imageUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              signal: AbortSignal.timeout(15000)
            });
            if (res.ok) {
              const arrayBuffer = await res.arrayBuffer();
              const buf = Buffer.from(arrayBuffer);
              if (buf.length > 3000) {
                fs.writeFileSync(localImagePath, buf);
                downloaded = true;
                break;
              }
            }
          } catch (err) {
            console.warn(`[VideoComposer] Fetch attempt ${attempt} failed for scene ${i + 1}:`, err);
          }
        }
      }

      // If primary failed, use a short, clean Pollinations or Unsplash image request
      if (!downloaded) {
        const cleanPrompt = (scene.visualPrompt || scene.narrationText || 'nature landscape')
          .substring(0, 100)
          .replace(/[^a-zA-Z0-9 ]/g, ' ')
          .trim();
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true&seed=${1000 + i}`;
        try {
          const res = await fetch(fallbackUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: AbortSignal.timeout(15000)
          });
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buf = Buffer.from(arrayBuffer);
            if (buf.length > 3000) {
              fs.writeFileSync(localImagePath, buf);
              downloaded = true;
            }
          }
        } catch (err) {
          console.warn(`[VideoComposer] Pollinations fallback failed for scene ${i + 1}:`, err);
        }
      }

      // Ultimate fallback: High resolution stock image stream from Unsplash Source
      if (!downloaded) {
        const keywords = ['forest', 'animals', 'landscape', 'running', 'nature', 'story', 'adventure', 'dramatic'][i % 8];
        const unsplashUrl = `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=${width}&h=${height}&fit=crop`;
        try {
          const res = await fetch(unsplashUrl, { signal: AbortSignal.timeout(10000) });
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            fs.writeFileSync(localImagePath, Buffer.from(arrayBuffer));
            downloaded = true;
          }
        } catch (_) {}
      }

      if (!downloaded) {
        // Last-resort colored canvas
        const fallbackCmd = `ffmpeg -y -f lavfi -i "color=c=0x1e1b4b:s=${resolution}" -vframes 1 "${localImagePath}"`;
        await execAsync(fallbackCmd);
      }

      downloadedImages.push({
        sceneIndex: i + 1,
        localPath: localImagePath,
        originalUrl: imageUrl
      });
    }

    // 2. Resolve or Download Voice Audio Track
    const voiceLocalPath = path.join(tmpDir, 'voice.mp3');
    let voiceSuccess = false;
    if (timeline.voiceAudioUrl && (timeline.voiceAudioUrl.startsWith('http://') || timeline.voiceAudioUrl.startsWith('https://'))) {
      try {
        const res = await fetch(timeline.voiceAudioUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          fs.writeFileSync(voiceLocalPath, Buffer.from(buffer));
          voiceSuccess = true;
        }
      } catch (err) {
        console.warn('[VideoComposer] Voice audio download failed:', err);
      }
    } else if (timeline.voiceAudioUrl && timeline.voiceAudioUrl.startsWith('/')) {
      const localSource = path.join(process.cwd(), 'public', timeline.voiceAudioUrl);
      if (fs.existsSync(localSource)) {
        fs.copyFileSync(localSource, voiceLocalPath);
        voiceSuccess = true;
      }
    }

    if (!voiceSuccess) {
      // Fallback sine wave voice track
      const genVoice = `ffmpeg -y -f lavfi -i "sine=frequency=300:duration=${timeline.totalDurationSeconds}" -c:a libmp3lame -b:a 128k "${voiceLocalPath}"`;
      await execAsync(genVoice);
    }

    // 3. Resolve or Download Background Music
    const musicLocalPath = path.join(tmpDir, 'music.mp3');
    let musicSuccess = false;
    if (timeline.backgroundMusicUrl && (timeline.backgroundMusicUrl.startsWith('http://') || timeline.backgroundMusicUrl.startsWith('https://'))) {
      try {
        const res = await fetch(timeline.backgroundMusicUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          fs.writeFileSync(musicLocalPath, Buffer.from(buffer));
          musicSuccess = true;
        }
      } catch (err) {
        console.warn('[VideoComposer] Music download failed:', err);
      }
    } else if (timeline.backgroundMusicUrl && timeline.backgroundMusicUrl.startsWith('/')) {
      const localSource = path.join(process.cwd(), 'public', timeline.backgroundMusicUrl);
      if (fs.existsSync(localSource)) {
        fs.copyFileSync(localSource, musicLocalPath);
        musicSuccess = true;
      }
    }

    if (!musicSuccess) {
      const genMusic = `ffmpeg -y -f lavfi -i "sine=frequency=180:duration=${timeline.totalDurationSeconds}" -c:a libmp3lame -b:a 128k "${musicLocalPath}"`;
      await execAsync(genMusic);
    }

    // 4. Build Exact FFmpeg Command with Local Files
    const inputs = downloadedImages
      .map((img, idx) => `-loop 1 -t ${timeline.scenes[idx].durationSeconds} -i "${img.localPath}"`)
      .join(' ');

    const scalePadFilters = downloadedImages
      .map((_, idx) => `[${idx}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${idx}];`)
      .join('');

    const concatInputs = downloadedImages.map((_, idx) => `[v${idx}]`).join('');
    const concatFilter = `${concatInputs}concat=n=${downloadedImages.length}:v=1:a=0[vconcat];`;

    const voiceIndex = downloadedImages.length;
    const musicIndex = downloadedImages.length + 1;
    const audioMixFilter = `[${voiceIndex}:a][${musicIndex}:a]amix=inputs=2:duration=first:weights=1.0 0.25[aout]`;

    const filterComplex = `"${scalePadFilters}${concatFilter}${audioMixFilter}"`;

    const ffmpegCommand = `ffmpeg -y ${inputs} -i "${voiceLocalPath}" -i "${musicLocalPath}" -filter_complex ${filterComplex} -map "[vconcat]" -map "[aout]" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputFilePath}"`;

    // 5. Execute FFmpeg Command
    const { stdout, stderr } = await execAsync(ffmpegCommand);

    const stats = fs.statSync(outputFilePath);
    const durationMs = Date.now() - startTime;

    // Cleanup tmp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}

    return {
      outputPath: outputFilePath,
      downloadedImages,
      voiceLocalPath,
      musicLocalPath,
      ffmpegCommand,
      stdout,
      stderr,
      durationMs,
      fileSizeBytes: stats.size
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
