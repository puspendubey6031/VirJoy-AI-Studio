import express from 'express';
import cors from 'cors';
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

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'VirJoy AI', timestamp: new Date().toISOString() });
});

app.get('/api/providers/status', (_req, res) => {
  res.json({
    success: true,
    app: 'VirJoy AI Provider Layer',
    timestamp: new Date().toISOString(),
    report: getProviderStatusReport()
  });
});

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

app.post('/api/providers/generate-image', async (req, res) => {
  try {
    const { prompt, width, height, aspectRatio, style } = req.body;
    const result = await generateImageWithFallback({ prompt, width, height, aspectRatio, style });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Image generation failed' });
  }
});

app.post('/api/providers/generate-voice', async (req, res) => {
  try {
    const { text, voice, language, speed } = req.body;
    const result = await generateSpeechWithFallback({ text, voice, language, speed });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Voice generation failed' });
  }
});

app.post('/api/providers/generate-video', async (req, res) => {
  try {
    const { prompt, durationSeconds, sourceImageUrl, aspectRatio } = req.body;
    const result = await generateVideoClipWithFallback({ prompt, durationSeconds, sourceImageUrl, aspectRatio });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Video generation failed' });
  }
});

export default app;
