import { analyzePromptIntelligence } from './promptIntelligence.js';
import fs from 'fs';
import path from 'path';
import { generateGranularScenes } from './sceneGenerator.js';
import { mediaManager } from './mediaManager.js';
import { voiceEngine } from './voiceEngine.js';
import { subtitleEngine } from './subtitleEngine.js';
import { timelineEngine } from './timelineEngine.js';
import { videoComposer } from './videoComposer.js';
import { generateScriptWithFallback } from '../providers/scriptProvider.js';
import { generateTalkingCharacterWithFallback, AllProvidersFailedError } from '../providers/talkingCharacterProvider.js';
import { generateBackgroundMusic, generateSFX } from '../providers/musicProvider.js';
import type {
  EngineCheckpoint,
  GranularSceneSpec,
  MediaAssetSpec,
  PromptIntelligenceResult,
  RenderInstructionPackage,
  StageProgress,
  SubtitleEngineSpec,
  TimelinePackage,
  VoiceEngineSpec,
  WorkflowStage
} from './types.js';

export interface ExecutePipelineOptions {
  jobId: string;
  userId: string;
  prompt: string;
  targetDurationSeconds?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  voice?: string;
  language?: string;
  subtitleLanguage?: string;
  userUploads?: string[];
  planKey?: any;
  resumeFromCheckpoint?: EngineCheckpoint;
  apiKey?: string;
  skipFFmpegRender?: boolean;
  /**
   * URL of a character portrait image for the talking-character / lip-sync pipeline.
   * When provided, a lip-sync video is generated (voice audio + face animation)
   * and wired into the FFmpeg composition as the primary video track.
   * Omit to use the standard static-image slideshow pipeline.
   */
  characterImageUrl?: string;
}

export class MasterWorkflowEngine {
  private checkpointsStore: Map<string, EngineCheckpoint> = new Map();

  public getCheckpoint(jobId: string): EngineCheckpoint | undefined {
    return this.checkpointsStore.get(jobId);
  }

  public async runFullPipeline(
    options: ExecutePipelineOptions,
    onProgressUpdate?: (checkpoint: EngineCheckpoint) => void
  ): Promise<EngineCheckpoint> {
    const {
      jobId,
      userId,
      prompt,
      targetDurationSeconds = 30,
      aspectRatio = '16:9',
      voice,
      language,
      subtitleLanguage,
      userUploads,
      planKey = 'Free',
      resumeFromCheckpoint,
      apiKey,
      skipFFmpegRender = false,
      characterImageUrl
    } = options;

    // Initialize or load existing checkpoint for stage recovery
    let checkpoint: EngineCheckpoint = resumeFromCheckpoint || {
      jobId,
      currentStage: 'queued',
      overallProgressPercent: 0,
      completedStages: [],
      stageProgresses: this.initStageProgresses(),
      costBreakdown: {
        promptTokens: 0,
        completionTokens: 0,
        ttsCharacters: 0,
        imageGenerations: 0,
        estimatedCostUSD: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Track musicTmpDir across stages so it can be cleaned up after render
    let musicTmpDir = '';

    const updateStage = (
      stage: WorkflowStage,
      stageName: string,
      percent: number,
      status: StageProgress['status'],
      details?: string,
      error?: string
    ) => {
      checkpoint.currentStage = stage;
      checkpoint.overallProgressPercent = percent;
      checkpoint.updatedAt = new Date().toISOString();

      checkpoint.stageProgresses[stage] = {
        stage,
        stageName,
        progressPercent: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
        status,
        startedAt: checkpoint.stageProgresses[stage]?.startedAt || new Date().toISOString(),
        finishedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
        details,
        error
      };

      if (status === 'completed' && !checkpoint.completedStages.includes(stage)) {
        checkpoint.completedStages.push(stage);
      }

      this.checkpointsStore.set(jobId, checkpoint);
      if (onProgressUpdate) onProgressUpdate(checkpoint);
    };

    try {
      // STAGE 1: PROMPT INTELLIGENCE
      if (!checkpoint.completedStages.includes('prompt_analysis')) {
        updateStage('prompt_analysis', 'Prompt Intelligence & Intent Analysis', 10, 'in_progress', 'Analyzing prompt structure...');
        const promptIntel = await analyzePromptIntelligence(prompt, targetDurationSeconds, apiKey);
        checkpoint.promptIntelligence = promptIntel;
        checkpoint.costBreakdown.promptTokens += 150;
        updateStage('prompt_analysis', 'Prompt Intelligence & Intent Analysis', 15, 'completed', `Detected language: ${promptIntel.detectedLanguage}, style: ${promptIntel.visualStyle}`);
      }

      const intel = checkpoint.promptIntelligence!;

      // STAGE 2: SCRIPT GENERATION
      if (!checkpoint.completedStages.includes('script_generation')) {
        updateStage('script_generation', 'AI Script Generation', 25, 'in_progress', 'Generating script text across AI providers...');
        const scriptResult = await generateScriptWithFallback({
          prompt,
          targetDurationSeconds: intel.recommendedDurationSeconds,
          aspectRatio,
          inputs: { prompt },
          planKey
        });
        const fullScriptText = scriptResult.scenes.map((s) => s.voiceoverText).join(' ') || prompt;
        checkpoint.scriptText = fullScriptText;
        checkpoint.costBreakdown.completionTokens += 350;
        updateStage('script_generation', 'AI Script Generation', 30, 'completed', `Generated ${fullScriptText.length} chars script.`);
      }

      const scriptText = checkpoint.scriptText!;

      // STAGE 3: SCENE BREAKDOWN
      if (!checkpoint.completedStages.includes('scene_breakdown')) {
        updateStage('scene_breakdown', 'Scene Breakdown & Camera Motion', 40, 'in_progress', 'Splitting script into granular camera scenes...');
        const scenes = await generateGranularScenes(prompt, scriptText, intel, apiKey);
        checkpoint.scenes = scenes;
        updateStage('scene_breakdown', 'Scene Breakdown & Camera Motion', 45, 'completed', `Created ${scenes.length} structured scenes.`);
      }

      const scenes = checkpoint.scenes!;

      // STAGE 4: MEDIA COLLECTION
      if (!checkpoint.completedStages.includes('media_collection')) {
        updateStage('media_collection', 'Multi-Source Asset Collection & Caching', 55, 'in_progress', 'Fetching assets from stock providers & user uploads...');
        const { mediaAssets, updatedScenes } = await mediaManager.collectMediaAssetsForScenes(scenes, userUploads);
        checkpoint.mediaAssets = mediaAssets;
        checkpoint.scenes = updatedScenes;
        checkpoint.costBreakdown.imageGenerations += mediaAssets.filter((a) => a.source === 'ai_generated').length;
        updateStage('media_collection', 'Multi-Source Asset Collection & Caching', 60, 'completed', `Collected ${mediaAssets.length} visual assets.`);
      }

      // STAGE 5: VOICE GENERATION
      if (!checkpoint.completedStages.includes('voice_generation')) {
        updateStage('voice_generation', 'Universal Voice Generation', 68, 'in_progress', 'Synthesizing audio voiceover...');
        const voiceSpec = await voiceEngine.generateVoiceover(scriptText, voice, language || intel.detectedLanguage);
        checkpoint.voiceSpec = voiceSpec;
        checkpoint.costBreakdown.ttsCharacters += scriptText.length;
        updateStage('voice_generation', 'Universal Voice Generation', 72, 'completed', `Synthesized ${voiceSpec.voiceName} audio.`);
      }

      const voiceSpec = checkpoint.voiceSpec!;

      // STAGE 5b: MUSIC / BGM / SFX GENERATION (optional — failures never abort the pipeline)
      if (!checkpoint.completedStages.includes('music_generation')) {
        updateStage('music_generation', 'Music & Background Audio Generation', 73, 'in_progress',
          'Selecting background music and generating sound effects...');

        const musicMood = checkpoint.scenes?.[0]?.musicMood || 'cinematic_synth';
        const duration  = checkpoint.scenes?.reduce((a, s) => a + s.durationSeconds, 0) || targetDurationSeconds;
        musicTmpDir = path.join(process.cwd(), `tmp_music_${jobId}_${Date.now()}`);

        let bgmResult: Awaited<ReturnType<typeof generateBackgroundMusic>> = null;
        let sfxResult: Awaited<ReturnType<typeof generateSFX>>            = null;

        // ── BGM ───────────────────────────────────────────────────────────────
        try {
          bgmResult = await generateBackgroundMusic(musicMood, duration, musicTmpDir);
          if (bgmResult) {
            checkpoint.bgmLocalPath = bgmResult.localPath;
            console.log(`[WorkflowEngine] BGM ready via ${bgmResult.providerUsed} (${bgmResult.durationSeconds.toFixed(1)}s)`);
          } else {
            console.warn('[WorkflowEngine] BGM generation returned null — videoComposer will use sine-wave fallback');
          }
        } catch (bgmErr: any) {
          console.warn('[WorkflowEngine] BGM generation threw (non-fatal):', bgmErr?.message);
        }

        // ── Per-scene SFX (optional — tied to transitionEffect of each scene) ───
        const scenes = checkpoint.scenes || [];
        const sceneSfxMap: Record<number, string> = {};
        let sfxCount = 0;

        // Generate SFX for each scene that has a non-'none' sfxType.
        // We skip the LAST scene (no outgoing transition).
        for (let sceneIdx = 0; sceneIdx < scenes.length - 1; sceneIdx++) {
          const scene = scenes[sceneIdx];
          const sfxType = scene.sfxType;
          if (!sfxType || sfxType === 'none') continue;
          try {
            sfxResult = await generateSFX(sfxType, 1.5, musicTmpDir);
            if (sfxResult) {
              sceneSfxMap[sceneIdx] = sfxResult.localPath;
              sfxCount++;
              console.log(`[WorkflowEngine] Scene ${sceneIdx + 1} SFX (${sfxType}) via ${sfxResult.providerUsed}`);
            }
          } catch (sfxErr: any) {
            console.warn(`[WorkflowEngine] Scene ${sceneIdx + 1} SFX failed (non-fatal):`, sfxErr?.message);
          }
        }

        // Legacy single-SFX path: if no per-scene SFX generated, try a global one
        if (sfxCount === 0) {
          try {
            sfxResult = await generateSFX('transition', Math.min(duration, 3), musicTmpDir);
            if (sfxResult) {
              checkpoint.sfxLocalPath = sfxResult.localPath;
              sfxCount = 1;
              console.log(`[WorkflowEngine] Global SFX (fallback) via ${sfxResult.providerUsed}`);
            }
          } catch (sfxErr: any) {
            console.warn('[WorkflowEngine] Global SFX generation threw (non-fatal):', sfxErr?.message);
          }
        } else {
          checkpoint.sceneSfxMap = sceneSfxMap;
        }

        const detail = [
          bgmResult ? `BGM: ${bgmResult.providerUsed}` : 'BGM: sine-wave fallback (videoComposer)',
          sfxCount > 0 ? `SFX: ${sfxCount} scene clip(s) via ${sfxResult?.providerUsed ?? 'mixed'}` : 'SFX: skipped'
        ].join(' | ');
        updateStage('music_generation', 'Music & Background Audio Generation', 75, 'completed', detail);
      }

      // STAGE 5c: TALKING CHARACTER / LIP-SYNC (optional — only runs when characterImageUrl is provided)
      if (characterImageUrl && !checkpoint.completedStages.includes('talking_character')) {
        updateStage('talking_character', 'Talking Character / Lip-Sync Generation', 73, 'in_progress',
          'Generating lip-synced character animation from portrait + voice audio...');
        try {
          const tcResult = await generateTalkingCharacterWithFallback({
            characterImageUrl,
            audioUrl: voiceSpec.audioBufferUrl || '',
            durationSeconds: voiceSpec.audioDurationSeconds
          });
          checkpoint.talkingCharacterLocalPath = tcResult.localPath;
          checkpoint.talkingCharacterClipUrl = tcResult.videoUrl;
          updateStage('talking_character', 'Talking Character / Lip-Sync Generation', 77, 'completed',
            `Talking-character clip generated via ${tcResult.providerUsed} (${tcResult.durationSeconds.toFixed(1)}s, ${Math.round(tcResult.fileSizeBytes / 1024)}KB).`);
        } catch (tcErr: any) {
          const isAllFailed = tcErr instanceof AllProvidersFailedError;
          const detail = isAllFailed
            ? `All lip-sync providers failed. Chain: ${tcErr.message}`
            : tcErr?.message || 'Talking-character generation failed';
          updateStage('talking_character', 'Talking Character / Lip-Sync Generation', 73, 'failed', undefined, detail);
          // Re-throw: characterImageUrl was explicitly requested — a silent fallback to plain video is not acceptable
          throw new Error(`[TalkingCharacter] ${detail}`);
        }
      } else if (!characterImageUrl && !checkpoint.completedStages.includes('talking_character')) {

        // No character image provided — mark skipped, proceed with standard pipeline
        checkpoint.completedStages.push('talking_character');
        checkpoint.stageProgresses['talking_character'] = {
          stage: 'talking_character',
          stageName: 'Talking Character / Lip-Sync Generation',
          progressPercent: 100,
          status: 'skipped',
          details: 'Skipped — no characterImageUrl provided.'
        };
      }

      // STAGE 6: SUBTITLE GENERATION
      if (!checkpoint.completedStages.includes('subtitle_generation')) {
        updateStage('subtitle_generation', 'Subtitle Sync & Format Compiler', 78, 'in_progress', 'Generating timestamped subtitle blocks...');
        const subtitleSpec = subtitleEngine.generateSubtitles(checkpoint.scenes!, 'burned', subtitleLanguage);
        checkpoint.subtitleSpec = subtitleSpec;
        updateStage('subtitle_generation', 'Subtitle Sync & Format Compiler', 82, 'completed', `Compiled ${subtitleSpec.cues.length} synchronized subtitle cues.`);
      }

      const subtitleSpec = checkpoint.subtitleSpec!;

      // STAGE 7: TIMELINE BUILDER
      if (!checkpoint.completedStages.includes('timeline_builder')) {
        updateStage('timeline_builder', 'Unified Timeline Package Builder', 88, 'in_progress', 'Assembling audio, video, transitions, and overlays...');
        const timelinePackage = timelineEngine.assembleTimelinePackage({
          title: `VirJoy Video - ${prompt.substring(0, 30)}`,
          aspectRatio,
          scenes: checkpoint.scenes!,
          mediaAssets: checkpoint.mediaAssets!,
          voiceSpec,
          subtitles: subtitleSpec,
          hasWatermark: planKey === 'Free'
        });
        // Wire talking-character clip into the timeline when available
        if (checkpoint.talkingCharacterLocalPath) {
          timelinePackage.talkingCharacterLocalPath = checkpoint.talkingCharacterLocalPath;
          timelinePackage.talkingCharacterClipUrl   = checkpoint.talkingCharacterClipUrl;
        }
        // Wire pre-validated BGM / SFX paths from music_generation stage
        if (checkpoint.bgmLocalPath) {
          timelinePackage.bgmLocalPath = checkpoint.bgmLocalPath;
        }
        if (checkpoint.sfxLocalPath) {
          timelinePackage.sfxLocalPath = checkpoint.sfxLocalPath;
        }
        if (checkpoint.sceneSfxMap && Object.keys(checkpoint.sceneSfxMap).length > 0) {
          timelinePackage.sceneSfxMap = checkpoint.sceneSfxMap;
        }
        checkpoint.timelinePackage = timelinePackage;
        updateStage('timeline_builder', 'Unified Timeline Package Builder', 90, 'completed', 'Timeline package assembled successfully.');
      }

      const timelinePackage = checkpoint.timelinePackage!;

      // STAGE 8: VIDEO COMPOSITION & RENDER INSTRUCTION PACKAGE
      if (!checkpoint.completedStages.includes('video_composition')) {
        updateStage('video_composition', 'Video Composition & Worker Package', 95, 'in_progress', 'Compiling render package...');
        const renderPackage = videoComposer.compileRenderPackage(timelinePackage, 'ffmpeg');
        checkpoint.renderPackage = renderPackage;

        if (skipFFmpegRender) {
          // Planning path: skip actual FFmpeg execution; render happens in /api/video/render
          updateStage('video_composition', 'Video Composition & Worker Package', 98, 'completed', 'Render package compiled (FFmpeg deferred to render step).');
        } else {
          // Full render path: actually execute FFmpeg
          const exportDir = path.join(process.cwd(), 'public', 'exports');
          if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
          }
          const fileName = `video_${jobId}_${Date.now()}.mp4`;
          const exportPath = path.join(exportDir, fileName);

          try {
            await videoComposer.executeFFmpegRender(timelinePackage, exportPath);
            checkpoint.renderedVideoUrl = `/exports/${fileName}`;
            updateStage('video_composition', 'Video Composition & Worker Package', 98, 'completed', `Render completed. Video exported to /exports/${fileName}`);
          } catch (renderErr: any) {
            console.error('[WorkflowEngine] FFmpeg render failed:', renderErr?.message || renderErr);
            updateStage('video_composition', 'Video Composition & Worker Package', 98, 'failed', undefined, renderErr?.message);
            throw renderErr;
          }
        }
      }

      // STAGE 9: WORKER ENGINE DISPATCH & COMPLETION
      updateStage('worker_processing', 'Processing Engine Finalization', 100, 'completed', 'Video job successfully processed and verified.');
      checkpoint.currentStage = 'completed';
      checkpoint.costBreakdown.estimatedCostUSD =
        checkpoint.costBreakdown.promptTokens * 0.000001 +
        checkpoint.costBreakdown.completionTokens * 0.000003 +
        checkpoint.costBreakdown.ttsCharacters * 0.000015 +
        checkpoint.costBreakdown.imageGenerations * 0.02;

      return checkpoint;
    } catch (err: any) {
      console.error(`Workflow Engine Error at stage ${checkpoint.currentStage}:`, err);
      updateStage(
        checkpoint.currentStage,
        `Error in ${checkpoint.currentStage}`,
        checkpoint.overallProgressPercent,
        'failed',
        undefined,
        err?.message || 'Workflow pipeline step failed'
      );
      checkpoint.currentStage = 'failed';
      return checkpoint;
    } finally {
      // Clean up music/SFX temp files created in music_generation stage.
      // BGM was already copied into the render tmpDir by executeFFmpegRender;
      // SFX files were read directly by FFmpeg — both are safe to delete now.
      if (musicTmpDir) {
        try { fs.rmSync(musicTmpDir, { recursive: true, force: true }); } catch (_) {}
      }
    }
  }

  private initStageProgresses(): Record<WorkflowStage, StageProgress> {
    const stages: WorkflowStage[] = [
      'queued',
      'prompt_analysis',
      'script_generation',
      'scene_breakdown',
      'media_collection',
      'voice_generation',
      'music_generation',
      'talking_character',
      'subtitle_generation',
      'timeline_builder',
      'video_composition',
      'render_queue',
      'worker_processing',
      'completed',
      'failed',
      'cancelled'
    ];

    const record: Partial<Record<WorkflowStage, StageProgress>> = {};
    for (const st of stages) {
      record[st] = {
        stage: st,
        stageName: st.replace('_', ' ').toUpperCase(),
        progressPercent: 0,
        status: 'pending'
      };
    }
    return record as Record<WorkflowStage, StageProgress>;
  }
}

export const masterWorkflowEngine = new MasterWorkflowEngine();
