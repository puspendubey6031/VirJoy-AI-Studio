import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { configStore, userStatsStore, videoProjectsStore } from './src/server/configStore';
import { extractProductFromUrl } from './src/server/productExtractor';
import { generateIdeaWorkflow, planVideoWithAI } from './src/server/videoEngine';
import { cleanupStats, purgeExpiredVideos, startCleanupWorker } from './src/server/cleanupService';
import { checkBackendSupabaseConnection, supabaseServer } from './src/server/supabaseServer';
import {
  getProviderStatusReport,
  generateImageWithFallback,
  generateSpeechWithFallback,
  searchStockMediaWithFallback,
  generateVideoClipWithFallback,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature
} from './src/server/providers';
import { VideoProject, PlanKey } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '25mb' }));

  // Start background retention cleanup task
  startCleanupWorker();

  // --- API ROUTES ---

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

  // Supabase Mapped Schema Overview (Read-Only)
  app.get('/api/supabase/schema', async (_req, res) => {
    res.json({
      app: 'VirJoy AI',
      tables: [
        { name: 'users', feature: 'user profiles & user credits', columns: ['id', 'created_at', 'email', 'supabase_uid', 'mobile_number', 'mobile_verified', 'username', 'current_plan', 'credits', 'free_credits_last_claimed', 'updated_at'] },
        { name: 'plans', feature: 'plans catalog', columns: ['id', 'name', 'price_inr', 'credits_per_month', 'is_active', 'created_at', 'updated_at'] },
        { name: 'subscriptions', feature: 'subscriptions management', columns: ['id', 'user_id', 'plan_id', 'status', 'credits_per_month', 'starts_at', 'ends_at', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_subscription_id', 'created_at'] },
        { name: 'credit_logs', feature: 'credit transactions history', columns: ['id', 'user_id', 'action', 'credits_used', 'credits_before', 'credits_after', 'job_id', 'description', 'created_at'] },
        { name: 'video_jobs', feature: 'projects / video generation history', columns: ['id', 'prompt', 'title', 'video_type', 'duration', 'plan', 'status', 'has_watermark', 'output_path', 'output_url', 'error_message', 'image_count', 'clip_count', 'created_at', 'updated_at', 'userId'] },
        { name: 'app_settings', feature: 'app settings & API keys', columns: ['id', 'openai_key', 'replicate_key', 'default_credits', 'per_video_cost', 'maintenance_mode', 'updated_at'] },
        { name: 'banner_ads', feature: 'promotional banner ads', columns: ['id', 'title', 'image_url', 'target_url', 'is_active', 'display_location', 'created_at', 'updated_at'] },
        { name: 'notifications', feature: 'user notifications', columns: ['id', 'userId', 'type', 'title', 'message', 'is_read', 'created_at'] },
        { name: 'videos', feature: 'video outputs', columns: ['id', 'created_at'] },
        { name: 'settings', feature: 'extra key-value settings', columns: ['id', 'created_at'] }
      ]
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

  // Admin secret authorization verification function
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

  // Change Admin Password Endpoint
  app.post('/api/admin/change-password', (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || hashAdminPassword(currentPassword.trim()) !== currentAdminPasswordHash) {
        return res.status(401).json({ success: false, message: 'Current admin password is incorrect.' });
      }

      if (!newPassword || newPassword.trim().length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and Confirm password do not match.' });
      }

      const newHash = hashAdminPassword(newPassword.trim());
      currentAdminPasswordHash = newHash;
      process.env.ADMIN_PASSWORD = newPassword.trim();

      return res.json({ success: true, message: 'Admin password successfully updated!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to update admin password.' });
    }
  });

  // Update dynamic configuration (SECURE ADMIN / DEVELOPER ONLY)
  app.post('/api/config/update', (req, res) => {
    try {
      if (!verifyAdminAuthorization(req)) {
        return res.status(403).json({
          error: 'UNAUTHORIZED_ADMIN_ACCESS',
          message: 'Access Denied: Valid Admin/Developer secret key required to update plan configuration.'
        });
      }

      const updated = configStore.update(req.body);
      // Restart cleanup worker if retention interval changed
      startCleanupWorker();
      res.json({ success: true, config: updated });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to update config' });
    }
  });

  // Reset configuration (SECURE ADMIN / DEVELOPER ONLY)
  app.post('/api/config/reset', (req, res) => {
    if (!verifyAdminAuthorization(req)) {
      return res.status(403).json({
        error: 'UNAUTHORIZED_ADMIN_ACCESS',
        message: 'Access Denied: Valid Admin/Developer secret key required to reset configuration.'
      });
    }

    const reset = configStore.resetToDefault();
    res.json({ success: true, config: reset });
  });

  // Extract Product Details from URL
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

  // AI Idea-to-Video Workflow (₹799 Plan Feature)
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

  // Render & Finalize Video Project (WITH MONTHLY CREDIT ENFORCEMENT)
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

      // Calculate total video duration and required credits (1 second = 1 Credit)
      const totalDurationSeconds = scenes.reduce((acc: number, s: any) => acc + (s.duration || 4), 0);
      const requiredCredits = totalDurationSeconds;

      // --- CRITICAL PLAN & CREDIT ENFORCEMENT ---
      // Check single video credit/duration limit
      if (requiredCredits > (currentPlanConfig.maxSingleVideoCredits || currentPlanConfig.maxVideoDurationSeconds)) {
        return res.status(403).json({
          error: 'DURATION_LIMIT_EXCEEDED',
          message: `This single video requires ${requiredCredits} Credits (${totalDurationSeconds}s), which exceeds your ${currentPlanConfig.name} single-video cap of ${currentPlanConfig.maxSingleVideoCredits || currentPlanConfig.maxVideoDurationSeconds} Credits. Please upgrade your plan or select a shorter video length.`,
          requiredPlan: planKey === 'Free' ? '₹199' : planKey === '₹199' ? '₹399' : '₹799'
        });
      }

      // Check cumulative monthly credit balance
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

      // Calculate expiration time based on retention policy (default 24h)
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

      // Store project
      videoProjectsStore.set(projectId, newProject);

      // Deduct credits and update monthly usage stats (1 second = 1 Credit)
      userStatsStore.usedCredits += requiredCredits;
      userStatsStore.usedMonthlyDurationSeconds += totalDurationSeconds;
      userStatsStore.history.unshift({
        projectId,
        title: newProject.title,
        durationSeconds: totalDurationSeconds,
        creditsUsed: requiredCredits,
        createdAt: newProject.createdAt
      });

      // Persist transaction to Supabase credit_logs and video_jobs if Supabase is connected
      if (supabaseServer) {
        try {
          const creditsBefore = maxMonthlyCredits - (userStatsStore.usedCredits - requiredCredits);
          const creditsAfter = Math.max(0, creditsBefore - requiredCredits);

          // 1. Record credit usage in credit_logs
          try {
            await supabaseServer.from('credit_logs').insert({
              id: `clog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              user_id: userStatsStore.userId || 'demo-user-1',
              action: 'video_render',
              credits_used: requiredCredits,
              credits_before: creditsBefore,
              credits_after: creditsAfter,
              job_id: projectId,
              description: `Generated ${totalDurationSeconds}s video (${requiredCredits} credits): ${newProject.title}`,
              created_at: createdAtDate.toISOString()
            });
          } catch (clogErr: any) {
            console.warn('Supabase credit_logs insert notice:', clogErr?.message);
          }

          // 2. Record video job in video_jobs
          try {
            await supabaseServer.from('video_jobs').insert({
              id: projectId,
              prompt: prompt || 'Product commercial ad',
              title: newProject.title,
              video_type: aspectRatio,
              duration: totalDurationSeconds,
              plan: planKey,
              status: 'completed',
              has_watermark: currentPlanConfig.hasWatermark,
              output_url: newProject.shareUrl,
              created_at: createdAtDate.toISOString(),
              userId: userStatsStore.userId || 'demo-user-1'
            });
          } catch (vjobErr: any) {
            console.warn('Supabase video_jobs insert notice:', vjobErr?.message);
          }
        } catch (sbErr: any) {
          console.warn('Supabase persistence warning:', sbErr?.message);
        }
      }

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

  // Share Video Project
  app.post('/api/video/:id/share', (req, res) => {
    const project = videoProjectsStore.get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Video project not found or expired' });
    }
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${project.id}`;
    res.json({ success: true, shareUrl, project });
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

  // Sync / Link Supabase Auth user to Supabase users table
  app.post('/api/user/sync-supabase-user', async (req, res) => {
    try {
      const { supabaseUid, email, fullName } = req.body;
      if (!supabaseUid) {
        return res.status(400).json({ error: 'supabaseUid is required' });
      }

      if (!supabaseServer) {
        return res.json({ success: true, message: 'Server database client not initialized' });
      }

      // 1. Check if user already exists in users table by supabase_uid
      const { data: existingUser, error: selectErr } = await supabaseServer
        .from('users')
        .select('*')
        .eq('supabase_uid', supabaseUid)
        .maybeSingle();

      if (!selectErr && existingUser) {
        return res.json({ success: true, user: existingUser });
      }

      // 2. Check if user exists by email
      if (email) {
        const { data: existingByEmail } = await supabaseServer
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (existingByEmail) {
          if (!existingByEmail.supabase_uid) {
            const { data: updatedUser } = await supabaseServer
              .from('users')
              .update({ supabase_uid: supabaseUid, updated_at: new Date().toISOString() })
              .eq('id', existingByEmail.id)
              .select()
              .single();
            return res.json({ success: true, user: updatedUser || existingByEmail });
          }
          return res.json({ success: true, user: existingByEmail });
        }
      }

      // 3. Insert new user into users table matching existing schema
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const { data: newUser, error: insertErr } = await supabaseServer
        .from('users')
        .insert({
          id: newUserId,
          supabase_uid: supabaseUid,
          email: email || null,
          username: fullName || email?.split('@')[0] || 'VirJoy Creator',
          current_plan: 'Free',
          credits: 30,
          mobile_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertErr) {
        console.warn('Sync user insert warning:', insertErr.message);
        return res.json({
          success: true,
          message: insertErr.message,
          user: { id: newUserId, supabase_uid: supabaseUid, email, current_plan: 'Free', credits: 30 }
        });
      }

      return res.json({ success: true, user: newUser });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'User sync failed' });
    }
  });

  // Switch Plan (Simulator)
  app.post('/api/user/plan', (req, res) => {
    const { planKey } = req.body;
    const config = configStore.get();
    if (!config.plans[planKey as PlanKey]) {
      return res.status(400).json({ error: 'Invalid plan key' });
    }
    userStatsStore.currentPlan = planKey as PlanKey;
    res.json({ success: true, currentPlan: userStatsStore.currentPlan });
  });

  // Reset User Credit Usage (Admin/Testing helper)
  app.post('/api/user/credits/reset', (_req, res) => {
    userStatsStore.usedCredits = 0;
    userStatsStore.usedMonthlyDurationSeconds = 0;
    res.json({ success: true, usedCredits: 0, usedMonthlyDurationSeconds: 0 });
  });

  // Manual Trigger for 24-hour Retention Cleanup
  app.post('/api/cleanup/trigger', (_req, res) => {
    const result = purgeExpiredVideos();
    res.json({ success: true, ...result, stats: cleanupStats });
  });

  // Cleanup Stats
  app.get('/api/cleanup/stats', (_req, res) => {
    res.json({ success: true, stats: cleanupStats, currentActiveProjects: videoProjectsStore.size });
  });

  // --- VITE / SERVING FRONTEND ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VirJoy AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
