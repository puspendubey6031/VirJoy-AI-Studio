import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { configStore, userStatsStore, videoProjectsStore } from './src/server/configStore';
import { extractProductFromUrl } from './src/server/productExtractor';
import { generateIdeaWorkflow, planVideoWithAI } from './src/server/videoEngine';
import { cleanupStats, purgeExpiredVideos, startCleanupWorker } from './src/server/cleanupService';
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

  // Get dynamic configuration
  app.get('/api/config', (_req, res) => {
    res.json(configStore.get());
  });

  // Admin secret authorization verification function
  const verifyAdminAuthorization = (req: express.Request): boolean => {
    const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
    const expectedKey = process.env.ADMIN_KEY || 'virjoy-admin-2026';
    return adminKey === expectedKey;
  };

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

      const scenes = await planVideoWithAI({
        prompt: prompt || 'Product commercial ad',
        targetDurationSeconds: Number(targetDurationSeconds),
        aspectRatio,
        inputs,
        planKey
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

      // Deduct credits and update monthly usage stats
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
