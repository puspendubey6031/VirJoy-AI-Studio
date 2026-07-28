import { GoogleGenAI, Type } from '@google/genai';
import { PlanKey, Scene, VideoProject, VideoProjectInputs } from '../types';
import { configStore } from './configStore';
import { generateScriptWithFallback } from './providers/scriptProvider';

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

  // Delegate to Provider Integration Layer (Gemini -> Groq -> Cohere -> BuiltInRuleEngine)
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
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are a viral TikTok/Reels video creator for the ₹799 Ultra Plan in VirJoy AI.
Take this creative idea concept: "${concept}".
Generate:
1. Video Title
2. 3 Viral Hook options
3. Full voiceover script
4. Suggested total duration (15 to 90 seconds)
5. 4 structured video scenes (title, duration, narration, caption, visualPrompt)`,
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
                    title: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                    narration: { type: Type.STRING },
                    caption: { type: Type.STRING },
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

      if (response.text) {
        const parsed = JSON.parse(response.text);
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
    } catch (e) {
      console.warn('Idea workflow AI error:', e);
    }
  }

  // Fallback idea generator
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
