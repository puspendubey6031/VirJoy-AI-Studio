import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { configStore, userStatsStore, videoProjectsStore } from '../src/server/configStore.js';
import { extractProductFromUrl } from '../src/server/productExtractor.js';
import { generateIdeaWorkflow, planVideoWithAI } from '../src/server/videoEngine.js';
import { cleanupStats, purgeExpiredVideos } from '../src/server/cleanupService.js';
import { checkBackendSupabaseConnection, supabaseServer } from '../src/server/supabaseServer.js';
import {
  getProviderStatusReport,
  generateImageWithFallback,
  generateSpeechWithFallback,
  searchStockMediaWithFallback,
  generateVideoClipWithFallback,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature
} from '../src/server/providers/index.js';
import type { VideoProject, PlanKey } from '../src/types.js';

process.on('uncaughtException', (err) => {
  console.error('[VERCEL RUNTIME ERROR / UNCAUGHT EXCEPTION]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[VERCEL RUNTIME UNHANDLED REJECTION]:', reason);
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', app: 'VirJoy AI', timestamp: new Date().toISOString() });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/signup or /auth/signup
app.post(['/api/auth/signup', '/auth/signup'], async (req, res) => {
  try {
    const { email, password, name, fullName } = req.body;
    const userName = (name || fullName || '').trim();
    const userEmail = (email || '').trim();

    if (!userEmail || !userEmail.includes('@')) {
      return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Please provide a valid email address' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' });
    }

    let supabaseUser = null;
    let authError = null;

    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer.auth.signUp({
          email: userEmail,
          password,
          options: {
            data: { full_name: userName || userEmail.split('@')[0] }
          }
        });
        if (error) {
          authError = error.message;
        } else if (data?.user) {
          supabaseUser = data.user;
        }
      } catch (sbErr: any) {
        console.warn('[SUPABASE SIGNUP ATTEMPT NOTE]:', sbErr?.message || sbErr);
      }
    }

    if (authError) {
      return res.status(400).json({ error: 'SIGNUP_FAILED', message: authError });
    }

    const userId = supabaseUser?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = supabaseUser?.created_at || new Date().toISOString();
    const displayName = userName || supabaseUser?.user_metadata?.full_name || userEmail.split('@')[0] || 'VirJoy Creator';

    const userObj = {
      id: userId,
      email: userEmail,
      name: displayName,
      provider: 'email',
      createdAt
    };

    return res.json({
      success: true,
      user: userObj,
      token: `token_${userId}`,
      message: 'Account created successfully'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: err?.message || 'Signup failed' });
  }
});

// POST /api/auth/login or /auth/login
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  try {
    const { email, password } = req.body;
    const userEmail = (email || '').trim();

    if (!userEmail) {
      return res.status(400).json({ error: 'MISSING_EMAIL', message: 'Please enter your email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'MISSING_PASSWORD', message: 'Please enter your password' });
    }

    // 1. Check for Demo accounts
    if (userEmail.includes('creator@virjoy.ai')) {
      const role = userEmail.startsWith('pro.') ? 'Pro' : userEmail.startsWith('enterprise.') ? 'Enterprise' : 'Creator';
      return res.json({
        success: true,
        user: {
          id: `usr_demo_${role.toLowerCase()}`,
          email: userEmail,
          name: `${role} VirJoy Creator`,
          provider: 'demo',
          createdAt: new Date().toISOString()
        },
        token: `demo_token_${role.toLowerCase()}`,
        message: 'Signed in successfully as Demo User'
      });
    }

    let supabaseUser = null;
    let authError = null;

    // 2. Try Supabase Auth if configured
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer.auth.signInWithPassword({
          email: userEmail,
          password
        });
        if (error) {
          authError = error.message;
        } else if (data?.user) {
          supabaseUser = data.user;
        }
      } catch (sbErr: any) {
        console.warn('[SUPABASE LOGIN ATTEMPT NOTE]:', sbErr?.message || sbErr);
      }
    }

    // 3. Handle login failure or fallback
    if (authError && authError.includes('Invalid login credentials')) {
      return res.status(400).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const userId = supabaseUser?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = supabaseUser?.created_at || new Date().toISOString();
    const displayName = supabaseUser?.user_metadata?.full_name || userEmail.split('@')[0] || 'VirJoy Creator';

    return res.json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
        name: displayName,
        provider: 'email',
        createdAt
      },
      token: `token_${userId}`,
      message: 'Signed in successfully'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: err?.message || 'Login failed' });
  }
});

// POST /api/auth/logout or /auth/logout
app.post(['/api/auth/logout', '/auth/logout'], async (_req, res) => {
  if (supabaseServer) {
    await supabaseServer.auth.signOut().catch(() => {});
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me or /auth/me
app.get(['/api/auth/me', '/auth/me'], async (req, res) => {
  try {
    if (supabaseServer) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      if (token) {
        const { data: { user } } = await supabaseServer.auth.getUser(token);
        if (user) {
          return res.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'VirJoy Creator',
              provider: 'email',
              createdAt: user.created_at
            }
          });
        }
      }
    }
    return res.json({ success: true, user: null });
  } catch {
    return res.json({ success: true, user: null });
  }
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

// 404 Handler for API routes - Always return JSON
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Route or endpoint not found' });
});

// Express Global Error Handler - Always return JSON
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[EXPRESS RUNTIME ERROR]:', err);
  res.status(500).json({
    success: false,
    error: 'SERVER_ERROR',
    message: err?.message || 'A server error occurred'
  });
});

export default app;
