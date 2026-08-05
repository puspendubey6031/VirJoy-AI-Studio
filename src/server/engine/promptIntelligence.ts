import { GoogleGenAI, Type } from '@google/genai';
import type { PromptIntelligenceResult } from './types.js';

export async function analyzePromptIntelligence(
  prompt: string,
  targetDurationSeconds?: number,
  apiKey?: string
): Promise<PromptIntelligenceResult> {
  // If Gemini API Key is available, use Gemini 2.0 Flash for structured JSON extraction
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Perform deep prompt intelligence analysis for an AI Video Generation Engine (VirJoy AI).
User Prompt: "${prompt}"
User Requested Duration (optional): ${targetDurationSeconds || 'Auto-detect'}

Analyze and return JSON with:
1. detectedLanguage (e.g., "Hindi", "English", "Spanish", "Hindi-English Code-Switched")
2. category ("Commercial", "Educational", "Reel/Short", "SaaS Explainer", "Storytelling", "Product Showcase", "Entertainment")
3. tone ("Energetic", "Cinematic", "Professional", "Casual", "Dramatic", "Inspirational", "Humorous")
4. emotion ("Excited", "Calm", "Urgent", "Warm", "Mysterious", "Confident")
5. visualStyle ("3D Render", "Cinematic Live Action", "Minimalist Animated", "Neon Cyberpunk", "Documentary", "Isometric")
6. targetAudience
7. targetPlatform ("Instagram Reels", "TikTok", "YouTube Shorts", "YouTube 16:9", "LinkedIn", "Universal")
8. recommendedDurationSeconds (number between 10 and 120)
9. recommendedSceneCount (number between 2 and 10)
10. extractedKeywords (array of 4 key strings)
11. suggestedMusicMood ("upbeat_electronic", "cinematic_synth", "ambient_chill", "dark_dramatic", "acoustic_warm")`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: { type: Type.STRING },
              category: { type: Type.STRING },
              tone: { type: Type.STRING },
              emotion: { type: Type.STRING },
              visualStyle: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              targetPlatform: { type: Type.STRING },
              recommendedDurationSeconds: { type: Type.NUMBER },
              recommendedSceneCount: { type: Type.NUMBER },
              extractedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedMusicMood: { type: Type.STRING }
            },
            required: [
              'detectedLanguage',
              'category',
              'tone',
              'emotion',
              'visualStyle',
              'targetAudience',
              'targetPlatform',
              'recommendedDurationSeconds',
              'recommendedSceneCount',
              'extractedKeywords',
              'suggestedMusicMood'
            ]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          detectedLanguage: parsed.detectedLanguage || 'English',
          category: validateEnum(parsed.category, ['Commercial', 'Educational', 'Reel/Short', 'SaaS Explainer', 'Storytelling', 'Product Showcase', 'Entertainment'], 'Reel/Short'),
          tone: validateEnum(parsed.tone, ['Energetic', 'Cinematic', 'Professional', 'Casual', 'Dramatic', 'Inspirational', 'Humorous'], 'Energetic'),
          emotion: validateEnum(parsed.emotion, ['Excited', 'Calm', 'Urgent', 'Warm', 'Mysterious', 'Confident'], 'Excited'),
          visualStyle: validateEnum(parsed.visualStyle, ['3D Render', 'Cinematic Live Action', 'Minimalist Animated', 'Neon Cyberpunk', 'Documentary', 'Isometric'], 'Cinematic Live Action'),
          targetAudience: parsed.targetAudience || 'Digital Creators & Social Media Audience',
          targetPlatform: validateEnum(parsed.targetPlatform, ['Instagram Reels', 'TikTok', 'YouTube Shorts', 'YouTube 16:9', 'LinkedIn', 'Universal'], 'Instagram Reels'),
          recommendedDurationSeconds: targetDurationSeconds || parsed.recommendedDurationSeconds || 30,
          recommendedSceneCount: Math.max(2, Math.min(10, parsed.recommendedSceneCount || 4)),
          extractedKeywords: parsed.extractedKeywords || ['VirJoy AI', 'Video Creation', 'Cinematic'],
          suggestedMusicMood: validateEnum(parsed.suggestedMusicMood, ['upbeat_electronic', 'cinematic_synth', 'ambient_chill', 'dark_dramatic', 'acoustic_warm'], 'cinematic_synth')
        };
      }
    } catch (err) {
      console.warn('Prompt Intelligence AI failed, using intelligent rule engine:', err);
    }
  }

  // Intelligent Fallback Rule Engine
  const pLower = prompt.toLowerCase();
  const duration = targetDurationSeconds || (pLower.includes('short') ? 15 : pLower.includes('long') ? 60 : 30);
  const sceneCount = Math.max(2, Math.min(8, Math.round(duration / 7.5)));

  let category: PromptIntelligenceResult['category'] = 'Reel/Short';
  if (pLower.includes('product') || pLower.includes('ad') || pLower.includes('commercial') || pLower.includes('buy')) category = 'Commercial';
  else if (pLower.includes('explain') || pLower.includes('saas') || pLower.includes('app') || pLower.includes('software')) category = 'SaaS Explainer';
  else if (pLower.includes('learn') || pLower.includes('how to') || pLower.includes('guide')) category = 'Educational';

  let language = 'English';
  if (/[\u0900-\u097F]/.test(prompt) || pLower.includes('hindi') || pLower.includes('namaste')) language = 'Hindi';
  else if (pLower.includes('spanish') || pLower.includes('hola')) language = 'Spanish';

  return {
    detectedLanguage: language,
    category,
    tone: pLower.includes('energetic') ? 'Energetic' : 'Cinematic',
    emotion: 'Excited',
    visualStyle: pLower.includes('3d') ? '3D Render' : pLower.includes('neon') ? 'Neon Cyberpunk' : 'Cinematic Live Action',
    targetAudience: 'Social Media Enthusiasts & Buyers',
    targetPlatform: duration <= 60 ? 'Instagram Reels' : 'YouTube 16:9',
    recommendedDurationSeconds: duration,
    recommendedSceneCount: sceneCount,
    extractedKeywords: prompt.split(' ').filter((w) => w.length > 3).slice(0, 4),
    suggestedMusicMood: category === 'Commercial' ? 'upbeat_electronic' : 'cinematic_synth'
  };
}

function validateEnum<T>(val: any, validList: T[], fallback: T): T {
  if (validList.includes(val as T)) return val as T;
  return fallback;
}
