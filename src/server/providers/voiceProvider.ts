import { runWithFallback, type FallbackProvider } from './providerFallback.js';

export interface VoiceGenerationOptions {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
}

export interface VoiceGenerationResult {
  audioUrl: string;
  providerUsed: 'gTTS' | 'Bark' | 'LongCatAudioDiT';
  voiceName: string;
}

/**
 * Voice Provider — Fallback Order:
 * 1. Google Translate TTS (gTTS) — no key required
 * 2. Bark via Hugging Face    (if HUGGINGFACE_API_KEY configured)
 * 3. LongCat AudioDiT         — no key required, guaranteed last resort
 *
 * Note: "Edge-TTS" in the original code pointed to the same gTTS URL.
 * The chain is consolidated to gTTS → Bark → LongCat.
 */
export async function generateSpeechWithFallback(
  options: VoiceGenerationOptions
): Promise<VoiceGenerationResult> {
  const { text, language = 'en-US' } = options;
  const cleanText = text.replace(/[*#_~]/g, '').substring(0, 1000);
  const langCode = language.startsWith('hi') ? 'hi' : language.startsWith('ta') ? 'ta' : 'en';
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  type R = VoiceGenerationResult;
  const chain: FallbackProvider<R>[] = [];

  // 1. Google Translate TTS — no key, URL-based delivery
  chain.push({
    name: 'gTTS',
    timeoutMs: 5_000, // URL construction only; no network call here
    run: async () => ({
      audioUrl: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${langCode}&client=tw-ob`,
      providerUsed: 'gTTS' as const,
      voiceName: `GoogleTTS-${langCode}`
    })
  });

  // 2. Bark via Hugging Face
  if (hfKey) {
    chain.push({
      name: 'Bark',
      timeoutMs: 60_000, // Bark is slow on cold start
      run: async () => {
        const res = await fetch('https://api-inference.huggingface.co/models/suno/bark-small', {
          method: 'POST',
          headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: cleanText })
        });
        if (!res.ok) throw new Error(`Bark HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const base64 = Buffer.from(buf).toString('base64');
        if (!base64 || base64.length < 100) throw new Error('Bark returned empty audio');
        return { audioUrl: `data:audio/mp3;base64,${base64}`, providerUsed: 'Bark' as const, voiceName: 'bark-speaker-6' };
      }
    });
  }

  // 3. LongCat AudioDiT — zero-key, guaranteed last resort
  chain.push({
    name: 'LongCatAudioDiT',
    timeoutMs: 5_000,
    run: async () => ({
      audioUrl: `https://audio.pollinations.ai/prompt/${encodeURIComponent(cleanText)}?voice=longcat`,
      providerUsed: 'LongCatAudioDiT' as const,
      voiceName: 'longcat-audiodit-v1'
    })
  });

  const { result } = await runWithFallback<R>('voice', chain, 30_000);
  return result;
}
