import { GoogleGenAI, Type } from '@google/genai';
import { PlanKey, Scene, VideoProject, VideoProjectInputs } from '../types';
import { configStore } from './configStore';

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
  targetDurationSeconds: number; // 10s to 180s
  aspectRatio: '16:9' | '9:16' | '1:1';
  inputs: VideoProjectInputs;
  planKey: PlanKey;
}

export async function planVideoWithAI(options: PlanVideoOptions, apiKey?: string): Promise<Scene[]> {
  const { prompt, targetDurationSeconds, inputs, planKey } = options;
  const config = configStore.get();
  const planConfig = config.plans[planKey] || config.plans.Free;

  // Estimate scene count based on total duration (e.g., 3-5 seconds per scene)
  const estimatedSceneCount = Math.max(2, Math.min(10, Math.round(targetDurationSeconds / 4)));

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const lang = inputs.language || 'en-US';
      const voice = inputs.voice || 'female-ananya';
      const tone = inputs.voiceTone || 'Energetic';

      const systemInstruction = `${config.aiProvider.systemPrompt}
You are generating a scene-by-scene video breakdown for a short video ad/clip.
The user prompt is: "${prompt}".
Target Language for narration and captions: ${lang} (Write narration & subtitles strictly in ${lang}).
Voice Style / Tone: ${tone} (${voice}).
${inputs.productData ? `Product Context: Title: ${inputs.productData.title}, Price: ${inputs.productData.price}, Highlights: ${inputs.productData.features?.join(', ')}.` : ''}
${inputs.ideaConcept ? `Idea Concept (₹799 Ultra Workflow): ${inputs.ideaConcept}` : ''}
Total Target Duration: ${targetDurationSeconds} seconds across exactly ${estimatedSceneCount} scenes.
Plan details: ${planConfig.name} (${planKey}). Export quality: ${planConfig.exportQuality}.

Generate structured scenes for this video. Each scene MUST have:
- title: Short scene title (e.g. "Hook - Problem Statement", "Product Reveal", "Feature Highlight", "Call to Action")
- duration: duration in seconds (sum of all scene durations MUST equal approximately ${targetDurationSeconds})
- narration: engaging spoken script for AI voiceover matching language ${lang} and tone ${tone}
- caption: concise, punchy subtitle text in ${lang} to display on screen (1-8 words max)
- visualPrompt: vivid description of what is shown visually in this frame`;

      const response = await ai.models.generateContent({
        model: config.aiProvider.model || 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
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
        }
      });

      if (response.text) {
        const rawScenes = JSON.parse(response.text);
        if (Array.isArray(rawScenes) && rawScenes.length > 0) {
          return rawScenes.map((s, idx) => ({
            id: `scene-${idx + 1}-${Date.now()}`,
            title: s.title || `Scene ${idx + 1}`,
            duration: Math.max(2, Math.round(s.duration || 4)),
            narration: s.narration || prompt,
            caption: s.caption || s.narration || 'VirJoy AI Video',
            visualPrompt: s.visualPrompt || 'Dynamic animated motion graphics',
            bgGradient: GRADIENTS[idx % GRADIENTS.length],
            imageUrl: inputs.images?.[idx % (inputs.images.length || 1)] || undefined
          }));
        }
      }
    } catch (err) {
      console.warn('Gemini video planning fallback:', err);
    }
  }

  // Fallback scene generator if Gemini API key not present or call fails
  const perSceneDuration = Math.round(targetDurationSeconds / estimatedSceneCount);
  const fallbackScenes: Scene[] = [];

  for (let i = 0; i < estimatedSceneCount; i++) {
    let title = `Scene ${i + 1}`;
    let narration = `Key point ${i + 1} for ${prompt.substring(0, 40)}`;
    let caption = `${prompt.substring(0, 30)}...`;
    let visualPrompt = `Cinematic visual representation of scene ${i + 1}`;

    if (i === 0) {
      title = '1. Hook & Attention';
      narration = inputs.ideaConcept 
        ? `What if you could solve this instantly? ${inputs.ideaConcept}`
        : `Stop scrolling! Here is what you need to know about ${inputs.productData?.title || prompt}`;
      caption = '⚡ Stop Scrolling! Watch This';
      visualPrompt = 'High-energy kinetic text intro with dramatic particle movement';
    } else if (i === estimatedSceneCount - 1) {
      title = `${estimatedSceneCount}. Call to Action`;
      narration = inputs.productData
        ? `Get yours now at ${inputs.productData.price || 'a special offer'}! Link in description.`
        : `Try VirJoy AI today and create stunning videos in seconds!`;
      caption = '🚀 Get Started Today!';
      visualPrompt = 'Clean call-to-action screen with glowing button and brand logo';
    } else {
      if (inputs.productData?.features?.[i - 1]) {
        title = `${i + 1}. Feature ${i}`;
        narration = `Featuring: ${inputs.productData.features[i - 1]}`;
        caption = `✨ ${inputs.productData.features[i - 1]}`;
      }
    }

    fallbackScenes.push({
      id: `scene-${i + 1}-${Date.now()}`,
      title,
      duration: perSceneDuration,
      narration,
      caption,
      visualPrompt,
      bgGradient: GRADIENTS[i % GRADIENTS.length],
      imageUrl: inputs.images?.[i % (inputs.images.length || 1)] || undefined
    });
  }

  return fallbackScenes;
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
