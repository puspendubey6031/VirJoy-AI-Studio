import type { VoiceEngineSpec } from './types.js';
import { generateSpeechWithFallback } from '../providers/voiceProvider.js';

export class UniversalVoiceEngine {
  private defaultProvider: VoiceEngineSpec['provider'] = 'edge_tts';

  public async generateVoiceover(
    text: string,
    requestedVoice?: string,
    requestedLanguage?: string,
    providerOverride?: VoiceEngineSpec['provider']
  ): Promise<VoiceEngineSpec> {
    const provider = providerOverride || this.defaultProvider;
    const language = requestedLanguage || this.detectLanguage(text);

    let voiceId = requestedVoice || 'female-ananya';
    if (language === 'Hindi' && !requestedVoice) voiceId = 'female-ananya';
    else if (language === 'Spanish' && !requestedVoice) voiceId = 'spanish-sofia';

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Average speech rate = 2.5 words per second
    const estimatedDuration = Math.max(2, Math.round((wordCount / 2.5) * 10) / 10);

    let audioBufferUrl = '';
    try {
      const speechRes = await generateSpeechWithFallback({
        text,
        voice: voiceId,
        language
      });
      audioBufferUrl = speechRes.audioUrl;
    } catch (e) {
      console.warn('[UniversalVoiceEngine] Speech generation fallback note:', e);
      audioBufferUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=en&client=tw-ob`;
    }

    return {
      provider,
      voiceId,
      voiceName: this.getVoiceDisplayName(voiceId),
      language,
      emotion: 'Energetic & Professional',
      speedMultiplier: 1.0,
      pitchMultiplier: 1.0,
      audioBufferUrl,
      audioDurationSeconds: estimatedDuration
    };
  }

  public detectLanguage(text: string): string {
    if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
    if (/[áéíóúñ¿¡]/i.test(text)) return 'Spanish';
    if (/[äöüß]/i.test(text)) return 'German';
    if (/[éèêëàâùûç]/i.test(text)) return 'French';
    return 'English';
  }

  private getVoiceDisplayName(voiceId: string): string {
    const map: Record<string, string> = {
      'female-ananya': 'Ananya (Hindi/English - Warm Indian Female)',
      'male-arav': 'Arav (Hindi/English - Energetic Indian Male)',
      'female-riya': 'Riya (Hindi/English - Casual Soft Female)',
      'male-child-kabir': 'Kabir (Hindi/English - Playful Kid Voice)',
      'neutral-alex': 'Alex (English - Professional Global Neutral)',
      'spanish-sofia': 'Sofia (Spanish - Latin American Warm)'
    };
    return map[voiceId] || voiceId;
  }
}

export const voiceEngine = new UniversalVoiceEngine();
