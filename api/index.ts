import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { configStore, userStatsStore, videoProjectsStore } from '../src/server/configStore';
import { extractProductFromUrl } from '../src/server/productExtractor';
import { generateIdeaWorkflow, planVideoWithAI } from '../src/server/videoEngine';
import { cleanupStats, purgeExpiredVideos } from '../src/server/cleanupService';
import { checkBackendSupabaseConnection, supabaseServer } from '../src/server/supabaseServer';
import {
  getProviderStatusReport,
  generateImageWithFallback,
  generateSpeechWithFallback,
  searchStockMediaWithFallback,
  generateVideoClipWithFallback,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature
} from '../src/server/providers';
import { VideoProject, PlanKey } from '../src/types';

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'VirJoy AI', timestamp: new Date().toISOString() });
});

// AI Provider Layer Health & Fallback Status
app.get('/api/providers/status', (_req, res) => {
  res.json({
    success: true,
    app: 'VirJoy AI Provider Layer',
    timestamp: new Date().toISOString(),
    report: getProviderStatusReport()
  });
});

// Stock Media Search API
app.get('/api/providers/stock-media', async (req, res) => {
  try {
    const query = (req.query.q as string) || 'technology product';
    const type = (req.query.type as 'video' | 'photo') || 'video';
    const media = await searchStockMediaWithFallback(query, type);
    res.json({ success: true, query, type, results: media });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Stock media search failed' });
  }
});

// AI Image Generation API with Fallback
app.post('/api/providers/generate-image', async (req, res) => {
  try {
    const { prompt, width, height, aspectRatio, style } = req.body;
    const result = await generateImageWithFallback({ prompt, width, height, aspectRatio, style });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Image generation failed' });
  }
});

// AI Voice Synthesis API with Fallback
app.post('/api/providers/generate-voice', async (req, res) => {
  try {
    const { text, voice, language, speed } = req.body;
    const result = await generateSpeechWithFallback({ text, voice, language, speed });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Voice generation failed' });
  }
});

// AI Video Clip Generation API with Fallback
app.post('/api/providers/generate-video', async (req, res) => {
  try {
    const { prompt, durationSeconds, sourceImageUrl, aspectRatio } = req.body;
    const result = await generateVideoClipWithFallback({ prompt, durationSeconds, sourceImageUrl, aspectRatio });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Video generation failed' });
  }
});

// Payment API: Create Razorpay Order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amountINR, planName, userId = 'user_guest' } = req.body;
    if (!amountINR || !planName) {
      return res.status(400).json({ error: 'amountINR and planName are required' });
    }
    const order = await createRazorpayOrder(amountINR, planName, userId);
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Order creation failed' });
  }
});

// Payment API: Verify Razorpay Payment Signature
app.post('/api/payment/verify-signature', async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId) {
      return res.status(400).json({ error: 'orderId and paymentId are required' });
    }
    const verification = await verifyRazorpayPaymentSignature(orderId, paymentId, signature || '');
    res.json({ success: true, ...verification });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Payment verification failed' });
  }
});

// Supabase Connection Status
app.get('/api/supabase/status', async (_req, res) => {
  const status = await checkBackendSupabaseConnection();
  res.json({
    app: 'VirJoy AI',
    timestamp: new Date().toISOString(),
    ...status
  });
});

// Get dynamic configuration
app.get('/api/config', (_req, res) => {
  res.json(configStore.get());
});

// Secure Admin Password Hashing System
const PASSWORD_SALT = 'virjoy_admin_salt_2026';
const hashAdminPassword = (password: string): string => {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 10000, 64, 'sha512').toString('hex');
};

let currentAdminPasswordHash = hashAdminPassword(process.env.ADMIN_PASSWORD || 'virjoy_admin_super_secret_2026');

const verifyAdminAuthorization = (req: express.Request): boolean => {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  if (!adminKey) return false;
  return hashAdminPassword(String(adminKey).trim()) === currentAdminPasswordHash;
};

// Verify Admin Password Endpoint
app.post('/api/admin/verify-password', (req, res) => {
  const { password } = req.body;
  if (password && hashAdminPassword(password.trim()) === currentAdminPasswordHash) {
    return res.json({ success: true, valid: true });
  }
  return res.status(401).json({ success: false, valid: false, message: 'Access Denied: Invalid Admin Password' });
});

// Update dynamic configuration
app.post('/api/config/update', (req, res) => {
  try {
    if (!verifyAdminAuthorization(req)) {
      return res.status(403).json({
        error: 'UNAUTHORIZED_ADMIN_ACCESS',
        message: 'Access Denied: Valid Admin/Developer secret key required to update plan configuration.'
      });
    }

    const updated = configStore.update(req.body);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update config' });
  }
});

// Extract Product Details
app.post('/api/product/extract', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Product URL is required' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const productInfo = await extractProductFromUrl(url, apiKey);
    res.json({ success: true, productInfo });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Product extraction failed' });
  }
});

// Plan Video Script & Scenes
app.post('/api/video/plan', async (req, res) => {
  try {
    const { prompt, targetDurationSeconds = 15, aspectRatio = '16:9', inputs = {}, planKey = 'Free' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const config = configStore.get();
    const currentPlanConfig = config.plans[planKey as PlanKey] || config.plans.Free;
    const requestedSec = Number(targetDurationSeconds);
    const allowedMaxSec = currentPlanConfig.maxSingleVideoCredits || currentPlanConfig.maxVideoDurationSeconds || 30;

    if (requestedSec > allowedMaxSec) {
      return res.status(403).json({
        error: 'DURATION_LIMIT_EXCEEDED',
        message: `Requested video duration of ${requestedSec}s exceeds your ${currentPlanConfig.name} single-video cap of ${allowedMaxSec}s. Please upgrade your plan or select a shorter video length.`,
        requiredPlan: planKey === 'Free' ? '₹199' : planKey === '₹199' ? '₹399' : '₹799'
      });
    }

    const scenes = await planVideoWithAI({
      prompt: prompt || 'Product commercial ad',
      targetDurationSeconds: requestedSec,
      aspectRatio,
      inputs,
      planKey: planKey as PlanKey
    }, apiKey);

    res.json({ success: true, scenes });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Video planning failed' });
  }
});

// AI Idea-to-Video Workflow
app.post('/api/video/idea-workflow', async (req, res) => {
  try {
    const { concept } = req.body;
    if (!concept) {
      return res.status(400).json({ error: 'Idea concept is required' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const ideaResult = await generateIdeaWorkflow(concept, apiKey);
    res.json({ success: true, ideaResult });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Idea workflow generation failed' });
  }
});

// Render & Finalize Video Project
app.post('/api/video/render', async (req, res) => {
  try {
    const {
      title,
      prompt,
      inputs = {},
      aspectRatio = '16:9',
      scenes = [],
      planKey = userStatsStore.currentPlan
    } = req.body;

    const config = configStore.get();
    const currentPlanConfig = config.plans[planKey] || config.plans.Free;

    const totalDurationSeconds = scenes.reduce((acc: number, s: any) => acc + (s.duration || 4), 0);
    const requiredCredits = totalDurationSeconds;

    if (requiredCredits > (currentPlanConfig.maxSingleVideoCredits || currentPlanConfig.maxVideoDurationSeconds)) {
      return res.status(403).json({
        error: 'DURATION_LIMIT_EXCEEDED',
        message: `This single video requires ${requiredCredits} Credits (${totalDurationSeconds}s), which exceeds your ${currentPlanConfig.name} single-video cap of ${currentPlanConfig.maxSingleVideoCredits || currentPlanConfig.maxVideoDurationSeconds} Credits. Please upgrade your plan or select a shorter video length.`,
        requiredPlan: planKey === 'Free' ? '₹199' : planKey === '₹199' ? '₹399' : '₹799'
      });
    }

    const maxMonthlyCredits = currentPlanConfig.monthlyCredits || currentPlanConfig.maxMonthlyDurationSeconds;
    const projectedCredits = userStatsStore.usedCredits + requiredCredits;
    if (projectedCredits > maxMonthlyCredits) {
      const remaining = Math.max(0, maxMonthlyCredits - userStatsStore.usedCredits);
      return res.status(403).json({
        error: 'MONTHLY_CREDIT_EXHAUSTED',
        message: `Insufficient Credits! This video requires ${requiredCredits} Credits, but you only have ${remaining} Credits left on your ${currentPlanConfig.name} (${userStatsStore.usedCredits} used of ${maxMonthlyCredits}). Upgrade your subscription to unlock more credits!`,
        currentUsage: userStatsStore.usedCredits,
        maxMonthlyLimit: maxMonthlyCredits,
        requiredPlan: planKey === 'Free' ? '₹199' : planKey === '₹199' ? '₹399' : '₹799'
      });
    }

    const retentionHours = config.retention.retentionHours || 24;
    const createdAtDate = new Date();
    const expiresAtDate = new Date(createdAtDate.getTime() + retentionHours * 60 * 60 * 1000);
    const projectId = `vj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newProject: VideoProject = {
      id: projectId,
      title: title || `VirJoy Video - ${prompt.substring(0, 25)}`,
      prompt,
      inputs,
      aspectRatio,
      totalDurationSeconds,
      language: inputs.language || 'en-US',
      voice: inputs.voice || 'female-ananya',
      voiceTone: inputs.voiceTone || 'Energetic',
      scenes,
      status: 'completed',
      planUsed: planKey,
      watermarked: currentPlanConfig.hasWatermark,
      exportQuality: currentPlanConfig.exportQuality,
      shareUrl: `/share/${projectId}`,
      createdAt: createdAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString()
    };

    videoProjectsStore.set(projectId, newProject);

    userStatsStore.usedCredits += requiredCredits;
    userStatsStore.usedMonthlyDurationSeconds += totalDurationSeconds;
    userStatsStore.history.unshift({
      projectId,
      title: newProject.title,
      durationSeconds: totalDurationSeconds,
      creditsUsed: requiredCredits,
      createdAt: newProject.createdAt
    });

    res.json({
      success: true,
      project: newProject,
      userUsage: {
        usedCredits: userStatsStore.usedCredits,
        monthlyCredits: maxMonthlyCredits,
        remainingCredits: Math.max(0, maxMonthlyCredits - userStatsStore.usedCredits),
        usedMonthlySeconds: userStatsStore.usedMonthlyDurationSeconds,
        maxMonthlySeconds: currentPlanConfig.maxMonthlyDurationSeconds
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Video rendering failed' });
  }
});

// Get Video Project
app.get('/api/video/:id', (req, res) => {
  const project = videoProjectsStore.get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Video project not found or expired by 24h retention policy' });
  }
  res.json({ success: true, project });
});

// User Stats & Plan
app.get('/api/user/stats', (_req, res) => {
  const config = configStore.get();
  const planConfig = config.plans[userStatsStore.currentPlan] || config.plans.Free;
  const monthlyCredits = planConfig.monthlyCredits || planConfig.maxMonthlyDurationSeconds;
  const remainingCredits = Math.max(0, monthlyCredits - userStatsStore.usedCredits);

  res.json({
    success: true,
    user: {
      userId: userStatsStore.userId,
      currentPlan: userStatsStore.currentPlan,
      planDetails: planConfig,
      usedCredits: userStatsStore.usedCredits,
      monthlyCredits,
      remainingCredits,
      usedMonthlyDurationSeconds: userStatsStore.usedMonthlyDurationSeconds,
      maxMonthlyDurationSeconds: planConfig.maxMonthlyDurationSeconds,
      remainingSeconds: Math.max(0, planConfig.maxMonthlyDurationSeconds - userStatsStore.usedMonthlyDurationSeconds),
      history: userStatsStore.history
    }
  });
});

export default app;
