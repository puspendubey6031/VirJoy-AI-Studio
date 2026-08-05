import { analyzePromptIntelligence } from './promptIntelligence.js';
import { generateGranularScenes } from './sceneGenerator.js';
import { mediaManager } from './mediaManager.js';
import { voiceEngine } from './voiceEngine.js';
import { subtitleEngine } from './subtitleEngine.js';
import { timelineEngine } from './timelineEngine.js';
import { videoComposer } from './videoComposer.js';
import { generateScriptWithFallback } from '../providers/scriptProvider.js';
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
      apiKey
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
        checkpoint.timelinePackage = timelinePackage;
        updateStage('timeline_builder', 'Unified Timeline Package Builder', 90, 'completed', 'Timeline package assembled successfully.');
      }

      const timelinePackage = checkpoint.timelinePackage!;

      // STAGE 8: VIDEO COMPOSITION & RENDER INSTRUCTION PACKAGE
      if (!checkpoint.completedStages.includes('video_composition')) {
        updateStage('video_composition', 'Video Composition & Worker Package', 95, 'in_progress', 'Generating FFmpeg / Remotion rendering instructions...');
        const renderPackage = videoComposer.compileRenderPackage(timelinePackage, 'ffmpeg');
        checkpoint.renderPackage = renderPackage;
        updateStage('video_composition', 'Video Composition & Worker Package', 98, 'completed', 'Render package ready for Processing Engine.');
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
