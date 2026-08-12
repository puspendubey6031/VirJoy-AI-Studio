import type { GlobalAIJob, GlobalJobType, GlobalJobStage, AppConfig, PlanKey, DesignHistoryItem } from '../types.js';
import { configStore, designProjectsStore, videoProjectsStore, userStatsStore } from './configStore.js';
import { isOwnerEmail } from '../lib/roles.js';
import {
  generateImageWithFallback,
  generateSpeechWithFallback,
  generateVideoClipWithFallback
} from './providers/index.js';
import { planVideoWithAI } from './videoEngine.js';
import { extractProductFromUrl } from './productExtractor.js';
import { supabaseServer } from './supabaseServer.js';

// Centralized in-memory store for all global AI jobs
export const globalJobsStore = new Map<string, GlobalAIJob>();

// Helper to calculate cost for job type
export function calculateJobCost(jobType: GlobalJobType, params: any, config: AppConfig): number {
  const lockConfig = config.subscriptionLockConfig;
  const dsConfig = config.designStudioConfig;
  
  const lowType = (jobType || '').toLowerCase();
  
  if (lowType === 'video') {
    const scenes = params.scenes || [];
    const duration = scenes.reduce((acc: number, s: any) => acc + (s.duration || 4), 0) || params.targetDurationSeconds || 15;
    return Math.max(1, duration);
  }
  
  if (lowType === 'voice') {
    return lockConfig?.features?.aiVoiceAccess?.requiredCredits || 1;
  }
  
  if (lowType === 'subtitle') {
    return lockConfig?.features?.subtitleAccess?.requiredCredits || 1;
  }
  
  if (lowType === 'product_extraction') {
    return lockConfig?.features?.productUrlExtraction?.requiredCredits || 5;
  }
  
  // Design studio tools: image, logo, banner, poster, thumbnail
  const costs = dsConfig?.costs || { image: 3, thumbnail: 3, poster: 5, logo: 5, banner: 5 };
  if (lowType in costs) {
    return (costs as any)[lowType];
  }
  
  return 3;
}

// Get feature lock key for job type
function getFeatureLockKey(jobType: GlobalJobType): string {
  const low = (jobType || '').toLowerCase();
  if (low === 'video') return 'videoGenerator';
  if (low === 'logo') return 'logoGenerator';
  if (low === 'banner') return 'bannerGenerator';
  if (low === 'poster') return 'posterGenerator';
  if (low === 'thumbnail') return 'thumbnailGenerator';
  if (low === 'voice') return 'aiVoiceAccess';
  if (low === 'subtitle') return 'subtitleAccess';
  if (low === 'product_extraction') return 'productUrlExtraction';
  return 'imageGenerator';
}

// Check feature lock & user plan credits
export function checkJobEligibility(jobType: GlobalJobType, userPlan: string, cost: number) {
  // If Owner account, bypass all credit and feature lock restrictions
  if (isOwnerEmail(userStatsStore.email) || userStatsStore.isOwner || userStatsStore.role === 'Owner') {
    return { allowed: true, maxMonthly: 999999, currentPlanConfig: { monthlyCredits: 999999 } };
  }

  const config = configStore.get();
  const lockConfig = config.subscriptionLockConfig;
  const featureKey = getFeatureLockKey(jobType);
  
  if (lockConfig && lockConfig.features) {
    const rule = (lockConfig.features as any)[featureKey];
    if (rule) {
      if (rule.enabled === false) {
        return { allowed: false, status: 403, error: 'FEATURE_DISABLED', message: `${featureKey} is disabled by Admin.` };
      }
    }
  }

  const currentPlanConfig = config.plans[userPlan] || config.plans.Free;
  const maxMonthly = currentPlanConfig.monthlyCredits || currentPlanConfig.maxMonthlyDurationSeconds || 30;
  const remainingCredits = Math.max(0, maxMonthly - userStatsStore.usedCredits);

  if (remainingCredits < cost) {
    return {
      allowed: false,
      status: 403,
      error: 'INSUFFICIENT_CREDITS',
      message: `Insufficient Credits! This request requires ${cost} Credits, but you only have ${remainingCredits} Credits left.`,
      requiredCredits: cost,
      availableCredits: remainingCredits
    };
  }

  return { allowed: true, maxMonthly, currentPlanConfig };
}

// Deduct credits for a job
export function deductJobCredits(cost: number, jobId: string, title: string) {
  // Ignore credit deduction for Owner
  if (isOwnerEmail(userStatsStore.email) || userStatsStore.isOwner || userStatsStore.role === 'Owner') {
    return;
  }

  const config = configStore.get();
  const currentPlanConfig = config.plans[userStatsStore.currentPlan] || config.plans.Free;
  const maxMonthly = currentPlanConfig.monthlyCredits || currentPlanConfig.maxMonthlyDurationSeconds || 30;

  userStatsStore.usedCredits += cost;
  
  if (supabaseServer) {
    const creditsBefore = Math.max(0, maxMonthly - (userStatsStore.usedCredits - cost));
    const creditsAfter = Math.max(0, maxMonthly - userStatsStore.usedCredits);
    
    Promise.resolve(
      supabaseServer.from('credit_logs').insert({
        id: `clog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id: userStatsStore.userId || 'demo-user-1',
        action: 'job_deduction',
        credits_used: cost,
        credits_before: creditsBefore,
        credits_after: creditsAfter,
        job_id: jobId,
        description: `Deducted ${cost} credits for AI processing: ${title}`,
        created_at: new Date().toISOString()
      })
    ).catch(err => console.warn('Supabase credit_logs insert note:', err?.message));
  }
}

// Auto-refund credits on failure or cancellation
export function refundJobCredits(cost: number, jobId: string, reason: string) {
  if (cost <= 0) return;
  
  userStatsStore.usedCredits = Math.max(0, userStatsStore.usedCredits - cost);
  
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer.from('credit_logs').insert({
        id: `clog_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id: userStatsStore.userId || 'demo-user-1',
        action: 'job_refund',
        credits_used: -cost,
        credits_before: 0,
        credits_after: 0,
        job_id: jobId,
        description: `Refunded ${cost} credits due to job failure/cancellation: ${reason}`,
        created_at: new Date().toISOString()
      })
    ).catch(err => console.warn('Supabase credit_logs refund note:', err?.message));
  }
}

// Get active jobs for user
export function getActiveJobsForUser(userId: string = 'demo-user-1'): GlobalAIJob[] {
  const activeStages: GlobalJobStage[] = ['queued', 'preparing', 'generating', 'rendering', 'optimizing', 'saving'];
  return Array.from(globalJobsStore.values()).filter(j => 
    (j.userId === userId || userId === 'demo-user-1') && activeStages.includes(j.stage)
  );
}

// Helper to get stage label from Admin config
function getStageLabel(stage: GlobalJobStage, config: AppConfig): string {
  const stageNames = config.globalProcessingConfig?.stageNames;
  if (!stageNames) {
    if (stage === 'queued') return 'Queued';
    if (stage === 'preparing') return 'Preparing AI';
    if (stage === 'generating') return 'Generating';
    if (stage === 'rendering') return 'Rendering';
    if (stage === 'optimizing') return 'Optimizing';
    if (stage === 'saving') return 'Saving';
    if (stage === 'completed') return 'Completed';
    if (stage === 'failed') return 'Failed';
    if (stage === 'cancelled') return 'Cancelled';
  }
  return (stageNames as any)[stage] || stage;
}

// Helper to get status message from Admin config
function getStageMessage(jobType: GlobalJobType, stage: GlobalJobStage, config: AppConfig): string {
  const pConfig = config.globalProcessingConfig;
  const customMessages = pConfig?.messages || {} as any;
  const stageName = getStageLabel(stage, config);
  
  const typeMessage = customMessages[jobType] || customMessages.default || 'Processing AI Request...';
  
  if (stage === 'queued') return `Job in queue. ${pConfig?.messages?.default || 'Standing by for available worker slot...'}`;
  if (stage === 'preparing') return `[${stageName}] Initializing AI pipeline & prompt parameters...`;
  if (stage === 'generating') return `[${stageName}] ${typeMessage}`;
  if (stage === 'rendering') return `[${stageName}] Synthesizing output layers, colors & neural details...`;
  if (stage === 'optimizing') return `[${stageName}] Formatting high-speed preview & output files...`;
  if (stage === 'saving') return `[${stageName}] Finalizing persistence & history gallery...`;
  if (stage === 'completed') return 'Generation completed successfully!';
  if (stage === 'failed') return 'AI Generation encountered an error.';
  if (stage === 'cancelled') return 'Job processing was cancelled by user.';
  return typeMessage;
}

// Submit a new job to the universal queue
export async function submitGlobalJob(jobType: GlobalJobType, params: any, userId: string = 'demo-user-1'): Promise<GlobalAIJob> {
  const config = configStore.get();
  const pConfig = config.globalProcessingConfig;
  
  // Enforce queue limits & concurrent limits
  const activeJobs = getActiveJobsForUser(userId);
  const maxQueue = pConfig?.maxQueueLimit || 20;
  if (activeJobs.length >= maxQueue) {
    throw new Error(`Queue capacity reached (${activeJobs.length}/${maxQueue}). Please wait for existing AI jobs to complete.`);
  }

  // Idempotency: return existing active job if duplicate request
  const duplicate = activeJobs.find(j => j.type === jobType && JSON.stringify(j.params) === JSON.stringify(params));
  if (duplicate) {
    return duplicate;
  }

  // Cost calculation & credit deduction
  const cost = calculateJobCost(jobType, params, config);
  const eligibility = checkJobEligibility(jobType, userStatsStore.currentPlan, cost);
  if (!eligibility.allowed) {
    const err: any = new Error(eligibility.message);
    err.status = eligibility.status;
    err.details = eligibility;
    throw err;
  }

  const title = params.title || params.prompt || params.mainHeading || `${jobType.toUpperCase()} Creation`;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Deduct credits once at job start
  deductJobCredits(cost, jobId, title);

  const newJob: GlobalAIJob = {
    id: jobId,
    type: jobType,
    title,
    userId,
    stage: 'queued',
    stageLabel: getStageLabel('queued', config),
    progress: 5,
    etaSeconds: getInitialETA(jobType),
    statusMessage: getStageMessage(jobType, 'queued', config),
    params,
    creditsDeducted: cost,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  globalJobsStore.set(jobId, newJob);

  // Trigger background job execution pipeline
  executeJobPipeline(jobId).catch(err => {
    console.error(`Error in job pipeline (${jobId}):`, err);
  });

  return newJob;
}

// Initial ETA estimate in seconds based on job type
function getInitialETA(jobType: GlobalJobType): number {
  const low = (jobType || '').toLowerCase();
  if (low === 'video') return 18;
  if (low === 'poster' || low === 'banner' || low === 'logo') return 8;
  if (low === 'voice' || low === 'subtitle') return 5;
  if (low === 'product_extraction') return 4;
  return 6; // image, thumbnail, default
}

// Asynchronous execution pipeline for all AI modules
async function executeJobPipeline(jobId: string) {
  const job = globalJobsStore.get(jobId);
  if (!job || job.stage === 'cancelled' || job.stage === 'failed') return;

  const updateJobState = (stage: GlobalJobStage, progress: number, etaSeconds: number, extraMsg?: string) => {
    const freshJob = globalJobsStore.get(jobId);
    if (!freshJob || freshJob.stage === 'cancelled') return false;

    const currentConfig = configStore.get();
    freshJob.stage = stage;
    freshJob.stageLabel = getStageLabel(stage, currentConfig);
    freshJob.progress = Math.min(99, Math.max(freshJob.progress, progress));
    freshJob.etaSeconds = Math.max(0, etaSeconds);
    freshJob.statusMessage = extraMsg || getStageMessage(freshJob.type, stage, currentConfig);
    freshJob.updatedAt = new Date().toISOString();

    globalJobsStore.set(jobId, freshJob);
    return true;
  };

  try {
    const config = configStore.get();
    
    // Stage 1: Preparing AI
    await delay(300);
    if (!updateJobState('preparing', 15, Math.max(1, job.etaSeconds - 2))) return;

    // Stage 2: Generating
    await delay(400);
    if (!updateJobState('generating', 35, Math.max(1, job.etaSeconds - 4))) return;

    // Stage 3: Real Underlying AI Generator Execution
    let resultPayload: any = null;
    const lowType = job.type.toLowerCase();

    if (lowType === 'video') {
      const {
        title,
        prompt = 'Product commercial ad',
        inputs = {},
        aspectRatio = '16:9',
        scenes = [],
        planKey = userStatsStore.currentPlan
      } = job.params;

      // Update progress to Rendering
      if (!updateJobState('rendering', 60, 6, 'Rendering high-definition scene frames & stitching timeline...')) return;

      const currentPlanConfig = config.plans[planKey] || config.plans.Free;
      const totalDurationSeconds = scenes.length > 0
        ? scenes.reduce((acc: number, s: any) => acc + (s.duration || 4), 0)
        : (job.params.targetDurationSeconds || 15);

      let finalScenes = scenes;
      if (finalScenes.length === 0) {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        finalScenes = await planVideoWithAI({
          prompt,
          targetDurationSeconds: totalDurationSeconds,
          aspectRatio,
          inputs,
          planKey: planKey as PlanKey
        }, apiKey);
      }

      await delay(500);
      if (!updateJobState('optimizing', 85, 3, 'Applying voiceovers, subtitles & color optimization...')) return;

      const retentionHours = config.retention.retentionHours || 24;
      const createdAtDate = new Date();
      const expiresAtDate = new Date(createdAtDate.getTime() + retentionHours * 60 * 60 * 1000);

      const projectId = `vj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newProject = {
        id: projectId,
        title: title || `VirJoy Video - ${prompt.substring(0, 25)}`,
        prompt,
        inputs,
        aspectRatio,
        totalDurationSeconds,
        language: inputs.language || 'en-US',
        voice: inputs.voice || 'female-ananya',
        voiceTone: inputs.voiceTone || 'Energetic',
        scenes: finalScenes,
        status: 'completed' as const,
        planUsed: planKey,
        watermarked: currentPlanConfig.hasWatermark,
        exportQuality: currentPlanConfig.exportQuality,
        shareUrl: `/share/${projectId}`,
        createdAt: createdAtDate.toISOString(),
        expiresAt: expiresAtDate.toISOString()
      };

      videoProjectsStore.set(projectId, newProject as any);
      userStatsStore.usedMonthlyDurationSeconds += totalDurationSeconds;
      userStatsStore.history.unshift({
        projectId,
        title: newProject.title,
        durationSeconds: totalDurationSeconds,
        creditsUsed: job.creditsDeducted,
        createdAt: newProject.createdAt
      });

      resultPayload = { project: newProject };

    } else if (['image', 'logo', 'banner', 'poster', 'thumbnail'].includes(lowType)) {
      if (!updateJobState('rendering', 65, 4, `Rendering ${job.type.toUpperCase()} layout & lighting physics...`)) return;

      const {
        prompt,
        compiledPrompt,
        aspectRatio = '1:1',
        style = 'Modern',
        mainHeading
      } = job.params;

      const finalPrompt = compiledPrompt || prompt || `${job.type} design for ${mainHeading || ''}, style: ${style}`;

      const imgResult = await generateImageWithFallback({
        prompt: finalPrompt,
        aspectRatio,
        style
      });

      await delay(400);
      if (!updateJobState('optimizing', 88, 2, 'Upscaling & sharpening export texture...')) return;

      const retentionHours = config.designStudioConfig?.historyRetentionHours || config.retention.retentionHours || 24;
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + retentionHours * 3600 * 1000).toISOString();
      const itemId = `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const designItem: DesignHistoryItem = {
        id: itemId,
        toolType: lowType as any,
        prompt: prompt || mainHeading || 'Design Studio Creation',
        compiledPrompt: finalPrompt,
        imageUrl: imgResult.imageUrl,
        creditsUsed: job.creditsDeducted,
        aspectRatio,
        style,
        createdAt,
        expiresAt
      };

      designProjectsStore.set(itemId, designItem);
      if (!userStatsStore.designHistory) userStatsStore.designHistory = [];
      userStatsStore.designHistory.unshift(designItem);

      resultPayload = { item: designItem };

    } else if (lowType === 'voice') {
      if (!updateJobState('rendering', 70, 3, 'Synthesizing voice acoustics & tone waveform...')) return;

      const { text, voice, language, speed } = job.params;
      const speechResult = await generateSpeechWithFallback({ text, voice, language, speed });

      await delay(300);
      if (!updateJobState('optimizing', 90, 1, 'Balancing audio loudness & noise gate...')) return;

      resultPayload = speechResult;

    } else if (lowType === 'subtitle') {
      if (!updateJobState('rendering', 70, 2, 'Translating subtitle tokens with Gemini...')) return;

      const { text, targetLanguage } = job.params;
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      let translatedText = text;

      if (geminiKey) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following subtitle caption accurately into ${targetLanguage}. Keep it punchy, concise, and natural for video subtitles (max 12 words). Return ONLY the translated subtitle text without quotes or explanations:\n"${text}"`
          });
          if (response.text) {
            translatedText = response.text.trim().replace(/^["']|["']$/g, '');
          }
        } catch (e: any) {
          console.warn('Job pipeline subtitle warning:', e?.message);
        }
      }

      await delay(200);
      if (!updateJobState('optimizing', 92, 1, 'Finalizing subtitle timestamps...')) return;

      resultPayload = { translatedText };

    } else if (lowType === 'product_extraction') {
      if (!updateJobState('rendering', 65, 3, 'Scraping product metadata, images & price...')) return;

      const { url } = job.params;
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const productInfo = await extractProductFromUrl(url, apiKey);

      await delay(200);
      if (!updateJobState('optimizing', 90, 1, 'Structuring product metadata JSON...')) return;

      resultPayload = { productInfo };
    }

    // Stage 4: Saving
    if (!updateJobState('saving', 96, 1, 'Saving asset & updating database history...')) return;
    await delay(300);

    // Stage 5: Completion
    const completedJob = globalJobsStore.get(jobId);
    if (!completedJob || completedJob.stage === 'cancelled') return;

    completedJob.stage = 'completed';
    completedJob.stageLabel = getStageLabel('completed', configStore.get());
    completedJob.progress = 100;
    completedJob.etaSeconds = 0;
    completedJob.statusMessage = getStageMessage(completedJob.type, 'completed', configStore.get());
    completedJob.result = resultPayload;
    completedJob.updatedAt = new Date().toISOString();
    completedJob.completedAt = new Date().toISOString();

    globalJobsStore.set(jobId, completedJob);

  } catch (err: any) {
    console.error(`Job (${jobId}) failed:`, err);
    
    // Auto refund credits on job failure
    refundJobCredits(job.creditsDeducted, jobId, err?.message || 'Processing error');

    const failedJob = globalJobsStore.get(jobId);
    if (failedJob) {
      failedJob.stage = 'failed';
      failedJob.stageLabel = getStageLabel('failed', configStore.get());
      failedJob.statusMessage = err?.message || 'Processing failed. Your credits have been automatically refunded.';
      failedJob.error = err?.message || 'Processing failed';
      failedJob.updatedAt = new Date().toISOString();
      globalJobsStore.set(jobId, failedJob);
    }
  }
}

// Cancel job manually
export function cancelGlobalJob(jobId: string): GlobalAIJob {
  const job = globalJobsStore.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  if (job.stage === 'completed') {
    return job; // Cannot cancel finished job
  }

  // Refund credits on manual cancellation
  refundJobCredits(job.creditsDeducted, jobId, 'User manually cancelled job');

  const config = configStore.get();
  job.stage = 'cancelled';
  job.stageLabel = getStageLabel('cancelled', config);
  job.statusMessage = 'Job processing cancelled. Credits have been refunded.';
  job.updatedAt = new Date().toISOString();

  globalJobsStore.set(jobId, job);
  return job;
}

// Retry failed job
export async function retryGlobalJob(jobId: string): Promise<GlobalAIJob> {
  const oldJob = globalJobsStore.get(jobId);
  if (!oldJob) {
    throw new Error('Job not found for retry');
  }

  return submitGlobalJob(oldJob.type, oldJob.params, oldJob.userId);
}

// Helper function for artificial pause
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
