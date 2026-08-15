export interface VoiceGenerationOptions {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
}

export interface VoiceGenerationResult {
  audioUrl: string;
  providerUsed: 'gTTS' | 'Bark' | 'LongCatAudioDiT' | 'PollinationsTTS';
  voiceName: string;
  mimeType?: string;
  byteSize?: number;
}

/**
 * Validates that an audio URL or Data URL actually yields playable audio bytes.
 */
async function validateAudioResource(url: string): Promise<{ valid: boolean; mimeType: string; byteSize: number; dataUrl?: string }> {
  if (!url || typeof url !== 'string') {
    return { valid: false, mimeType: '', byteSize: 0 };
  }

  // If base64 data URL
  if (url.startsWith('data:')) {
    const match = url.match(/^data:(audio\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match || !match[1] || !match[2] || match[2].trim().length === 0) {
      return { valid: false, mimeType: '', byteSize: 0 };
    }
    const byteSize = Math.floor((match[2].length * 3) / 4);
    return { valid: byteSize > 0, mimeType: match[1], byteSize };
  }

  // If remote HTTP/HTTPS URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'audio/*, */*'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return { valid: false, mimeType: '', byteSize: 0 };
      }

      const contentType = res.headers.get('content-type') || '';
      const arrayBuffer = await res.arrayBuffer();
      const byteSize = arrayBuffer.byteLength;

      const isAudioMime = contentType.startsWith('audio/') || contentType.includes('mpeg') || contentType.includes('audio') || contentType.includes('octet-stream');

      if (isAudioMime && byteSize > 100) {
        // Convert to verified base64 data URL so client never hits CORS or remote transport blocks
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        const mime = contentType.startsWith('audio/') ? contentType.split(';')[0] : 'audio/mpeg';
        return {
          valid: true,
          mimeType: mime,
          byteSize,
          dataUrl: `data:${mime};base64,${base64Audio}`
        };
      }
      return { valid: false, mimeType: contentType, byteSize };
    } catch (e: any) {
      console.warn('[VoiceProvider] Remote audio validation error for URL:', url.substring(0, 80), e?.message || e);
      return { valid: false, mimeType: '', byteSize: 0 };
    }
  }

  return { valid: false, mimeType: '', byteSize: 0 };
}

/**
 * Voice Provider with Automatic Fallback Order & Strict Byte Validation:
 * 1. gTTS (Google Text-To-Speech Synthesis Stream)
 * 2. Bark (Hugging Face Bark Audio Model)
 * 3. Pollinations Voice / Audio Synthesis
 *
 * Throws TTS_GENERATION_FAILED if all providers fail to return valid audio bytes.
 */
export async function generateSpeechWithFallback(options: VoiceGenerationOptions): Promise<VoiceGenerationResult> {
  const { text, voice = 'female-ananya', language = 'en-US' } = options;
  const cleanText = (text || '').replace(/[*#_~`]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 1000);

  if (!cleanText) {
    throw new Error('TTS_GENERATION_FAILED: text is empty');
  }

  const langCode = (language || 'en').startsWith('hi') ? 'hi' : (language || 'en').startsWith('ta') ? 'ta' : (language || 'en').startsWith('es') ? 'es' : 'en';

  // --- 1. PRIMARY: GOOGLE TRANSLATE TTS WITH ACTIVE BYTE VERIFICATION ---
  try {
    const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${langCode}&client=tw-ob`;
    const check = await validateAudioResource(gttsUrl);
    if (check.valid && check.dataUrl) {
      console.log(`[VoiceProvider] gTTS synthesis verified: ${check.byteSize} bytes, type=${check.mimeType}`);
      return {
        audioUrl: check.dataUrl,
        providerUsed: 'gTTS',
        voiceName: `GoogleTTS-${langCode}`,
        mimeType: check.mimeType,
        byteSize: check.byteSize
      };
    }
  } catch (err: any) {
    console.warn('[VoiceProvider] Primary gTTS failed validation, trying Bark fallback:', err?.message || err);
  }

  // --- 2. FALLBACK: BARK (Hugging Face Bark Model) ---
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
        if (arrayBuffer.byteLength > 100) {
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          console.log(`[VoiceProvider] Bark synthesis verified: ${arrayBuffer.byteLength} bytes`);
          return {
            audioUrl: `data:audio/mp3;base64,${base64}`,
            providerUsed: 'Bark',
            voiceName: 'bark-speaker-6',
            mimeType: 'audio/mp3',
            byteSize: arrayBuffer.byteLength
          };
        }
      }
    } catch (err: any) {
      console.warn('[VoiceProvider] Bark fallback failed, trying Pollinations fallback:', err?.message || err);
    }
  }

  // --- 3. FALLBACK: POLLINATIONS AUDIO SYNTHESIS ---
  try {
    const polliUrl = `https://audio.pollinations.ai/prompt/${encodeURIComponent(cleanText)}?voice=${encodeURIComponent(voice || 'alloy')}`;
    const check = await validateAudioResource(polliUrl);
    if (check.valid && check.dataUrl) {
      console.log(`[VoiceProvider] PollinationsTTS verified: ${check.byteSize} bytes`);
      return {
        audioUrl: check.dataUrl,
        providerUsed: 'PollinationsTTS',
        voiceName: voice || 'pollinations-voice',
        mimeType: check.mimeType,
        byteSize: check.byteSize
      };
    }
  } catch (err: any) {
    console.warn('[VoiceProvider] PollinationsTTS fallback failed:', err?.message || err);
  }

  // If every existing provider in the fallback chain fails, throw explicit error
  throw new Error(
    `TTS_GENERATION_FAILED: unable to generate valid audio for text="${cleanText.substring(0, 100)}"`
  );
}

