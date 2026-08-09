import { GoogleGenAI, Type } from '@google/genai';
import type { PlanKey, Scene, VideoProject, VideoProjectInputs } from '../types.js';
import { configStore } from './configStore.js';
import { generateScriptWithFallback } from './providers/scriptProvider.js';
import { masterWorkflowEngine } from './engine/workflowEngine.js';
import { runWithFallback, type FallbackProvider } from './providers/providerFallback.js';
import { generateTextWithOpenRouter, isOpenRouterConfigured } from './providers/openRouterProvider.js';

// ── Private helper ────────────────────────────────────────────────────────────
function _parseIdeaResult(parsed: any, concept: string): {
  title: string; viralHooks: string[]; recommendedScript: string;
  suggestedDuration: number; scenes: Scene[];
} {
  return {
    title: parsed.title || 'AI Idea Video Project',
    viralHooks: parsed.viralHooks || ['Hook 1: Did you know this secret?', 'Hook 2: Stop making this mistake!'],
    recommendedScript: parsed.recommendedScript || concept,
    suggestedDuration: parsed.suggestedDuration || 30,
    scenes: (parsed.scenes || []).map((s: any, idx: number) => ({
      id: `idea-scene-${idx + 1}`,
      title: s.title || `Scene ${idx + 1}`,
      duration: s.duration || 5,
      narration: s.narration || concept,
      caption: s.caption || s.narration,
      visualPrompt: s.visualPrompt || 'Dynamic visual',
      bgGradient: GRADIENTS[idx % GRADIENTS.length]
    }))
  };
}

const GRADIENTS = [
  'from-slate-900 via-indigo-950 to-slate-900',
  'from-purple-900 via-violet-950 to-slate-900',
  'from-blue-900 via-cyan-950 to-slate-900',
  'from-emerald-950 via-teal-900 to-slate-900',
  'from-amber-950 via-rose-950 to-slate-900',
  'from-rose-900 via-pink-950 to-slate-900'
];

interface PlanVideoOptions {
  prompt: string;
  targetDurationSeconds: number; // 10s to 300s
  aspectRatio: '16:9' | '9:16' | '1:1';
  inputs: VideoProjectInputs;
  planKey: PlanKey;
}

export async function planVideoWithAI(options: PlanVideoOptions, apiKey?: string): Promise<Scene[]> {
  const { prompt, targetDurationSeconds, aspectRatio, inputs, planKey } = options;

  // Execute Phase 5 AI Video Generation Engine Pipeline
  const checkpoint = await masterWorkflowEngine.runFullPipeline({
    jobId: `job_pipeline_${Date.now()}`,
    userId: 'usr_active',
    prompt,
    targetDurationSeconds,
    aspectRatio,
    voice: inputs.voice,
    language: inputs.language,
    userUploads: inputs.images,
    planKey,
    apiKey: apiKey || process.env.GEMINI_API_KEY,
    skipFFmpegRender: true   // planning does not need a rendered file
  });

  if (checkpoint.scenes && checkpoint.scenes.length > 0) {
    return checkpoint.scenes.map((s, idx) => ({
      id: s.sceneId || `scene-${idx + 1}-${Date.now()}`,
      title: `Scene ${s.sceneNumber}: ${s.narrationText.substring(0, 25)}`,
      duration: Math.max(2, s.durationSeconds),
      narration: s.narrationText || prompt,
      caption: s.narrationText || 'VirJoy AI',
      visualPrompt: s.visualPrompt || 'Cinematic visual',
      bgGradient: GRADIENTS[idx % GRADIENTS.length],
      imageUrl: s.assignedAssetUrl || inputs.images?.[idx % (inputs.images.length || 1)] || undefined,
      cameraMotion: s.cameraMotion,
      transitionEffect: s.transitionEffect,
      visualEffect: s.visualEffect,
      subtitleStartTime: s.subtitleStartTime,
      subtitleEndTime: s.subtitleEndTime,
      voiceAudioUrl: checkpoint.voiceSpec?.audioBufferUrl,
      backgroundMusicUrl: checkpoint.timelinePackage?.backgroundMusicUrl
    }));
  }

  // Fallback to Provider Integration Layer
  const scriptResult = await generateScriptWithFallback({
    prompt,
    targetDurationSeconds,
    aspectRatio,
    inputs,
    planKey
  });

  return scriptResult.scenes.map((s, idx) => ({
    id: `scene-${idx + 1}-${Date.now()}`,
    title: `Scene ${s.sceneNumber}: ${s.textOverlay || 'Frame'}`,
    duration: Math.max(2, s.duration),
    narration: s.voiceoverText || prompt,
    caption: s.textOverlay || s.voiceoverText || 'VirJoy AI',
    visualPrompt: s.visualDescription || s.imagePrompt || 'Cinematic visual',
    bgGradient: GRADIENTS[idx % GRADIENTS.length],
    imageUrl: inputs.images?.[idx % (inputs.images.length || 1)] || undefined
  }));
}

export async function generateIdeaWorkflow(concept: string, apiKey?: string): Promise<{
  title: string;
  viralHooks: string[];
  recommendedScript: string;
  suggestedDuration: number;
  scenes: Scene[];
}> {
  type IdeaResult = { title: string; viralHooks: string[]; recommendedScript: string; suggestedDuration: number; scenes: Scene[] };

  const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const ideaPrompt = `You are a viral TikTok/Reels video creator for VirJoy AI.
Take this creative idea concept: "${concept}".
Generate and return JSON with:
- title (string)
- viralHooks (array of 3 strings)
- recommendedScript (string)
- suggestedDuration (number, 15-90)
- scenes (array of 4 objects with: title, duration, narration, caption, visualPrompt)`;

  const chain: FallbackProvider<IdeaResult>[] = [];

  // 1. Gemini (structured schema)
  if (geminiKey) {
    chain.push({
      name: 'Gemini',
      timeoutMs: 30_000,
      run: async () => {
        const ai = new GoogleGenAI({ apiKey: geminiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: ideaPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                viralHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendedScript: { type: Type.STRING },
                suggestedDuration: { type: Type.NUMBER },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING }, duration: { type: Type.NUMBER },
                      narration: { type: Type.STRING }, caption: { type: Type.STRING },
                      visualPrompt: { type: Type.STRING }
                    },
                    required: ['title', 'duration', 'narration', 'caption', 'visualPrompt']
                  }
                }
              },
              required: ['title', 'viralHooks', 'recommendedScript', 'suggestedDuration', 'scenes']
            }
          }
        });
        if (!response.text) throw new Error('Gemini returned empty response');
        return _parseIdeaResult(JSON.parse(response.text), concept);
      }
    });
  }

  // 2. OpenRouter (text operations)
  if (isOpenRouterConfigured()) {
    chain.push({
      name: 'OpenRouter',
      timeoutMs: 30_000,
      run: async () => {
        const { content } = await generateTextWithOpenRouter({
          systemPrompt: 'You are a viral video creator. Return strictly valid JSON only, no markdown.',
          userPrompt: ideaPrompt,
          timeoutMs: 28_000
        });
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return _parseIdeaResult(JSON.parse(cleaned), concept);
      }
    });
  }

  if (chain.length > 0) {
    try {
      const { result } = await runWithFallback<IdeaResult>('idea-workflow', chain, 30_000);
      return result;
    } catch (e) {
      console.warn('[IdeaWorkflow] All AI providers failed, using deterministic fallback:', e instanceof Error ? e.message : e);
    }
  }

  // Deterministic fallback idea generator
  return {
    title: `Viral Video: ${concept.substring(0, 30)}`,
    viralHooks: [
      `🔥 Why nobody is talking about ${concept}?`,
      `🤯 You won't believe what happens when you try this...`,
      `💡 The 30-second guide to ${concept}`
    ],
    recommendedScript: `Here is why ${concept} is changing everything. First, it simplifies your daily workflow. Second, it saves you hours of effort. Try it today with VirJoy AI!`,
    suggestedDuration: 30,
    scenes: [
      {
        id: 'idea-1',
        title: 'Hook - Curiosity Gap',
        duration: 5,
        narration: `Did you know about ${concept}?`,
        caption: `🤯 The Secret Behind ${concept}`,
        visualPrompt: 'Dramatic zoomed lens burst with particle background',
        bgGradient: GRADIENTS[0]
      },
      {
        id: 'idea-2',
        title: 'Core Value Proposition',
        duration: 10,
        narration: `It completely transforms how you create videos from simple prompts.`,
        caption: '✨ Turn Simple Prompts into Videos',
        visualPrompt: 'Sleek neon UI transformation animation',
        bgGradient: GRADIENTS[1]
      },
      {
        id: 'idea-3',
        title: 'Social Proof / Result',
        duration: 10,
        narration: `Thousands of creators are leveraging VirJoy AI to grow their channels.`,
        caption: '📈 10x Faster Video Creation',
        visualPrompt: 'Exponential growth chart with glowing icons',
        bgGradient: GRADIENTS[2]
      },
      {
        id: 'idea-4',
        title: 'Call To Action',
        duration: 5,
        narration: `Create your next video in 30 seconds now!`,
        caption: '🚀 Try VirJoy AI Free',
        visualPrompt: 'Polished call-to-action button with spark effects',
        bgGradient: GRADIENTS[3]
      }
    ]
  };
}
