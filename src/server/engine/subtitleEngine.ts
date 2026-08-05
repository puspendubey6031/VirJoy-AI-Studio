import type { GranularSceneSpec, SubtitleCue, SubtitleEngineSpec } from './types.js';

export class UniversalSubtitleEngine {
  public generateSubtitles(
    scenes: GranularSceneSpec[],
    format: SubtitleEngineSpec['format'] = 'burned',
    targetLanguage?: string
  ): SubtitleEngineSpec {
    const cues: SubtitleCue[] = [];
    let cueIndex = 1;

    for (const scene of scenes) {
      const text = scene.narrationText;
      const duration = scene.durationSeconds;
      const words = text.split(/\s+/).filter(Boolean);

      // Split text into short subtitle blocks (3-6 words each for readability)
      const chunkSize = 5;
      const numChunks = Math.ceil(words.length / chunkSize) || 1;
      const chunkDuration = duration / numChunks;

      for (let c = 0; c < numChunks; c++) {
        const chunkWords = words.slice(c * chunkSize, (c + 1) * chunkSize);
        const chunkText = chunkWords.join(' ');
        const startSec = Math.round((scene.subtitleStartTime + c * chunkDuration) * 100) / 100;
        const endSec = Math.round((scene.subtitleStartTime + (c + 1) * chunkDuration) * 100) / 100;

        cues.push({
          id: `cue_${cueIndex}`,
          index: cueIndex,
          startTimeSec: startSec,
          endTimeSec: endSec,
          text: chunkText,
          translatedText: targetLanguage ? `[${targetLanguage}] ${chunkText}` : undefined
        });

        cueIndex++;
      }
    }

    const rawFormattedContent = this.formatSubtitleOutput(cues, format);

    return {
      format,
      sourceLanguage: 'Auto-Detect',
      targetLanguage,
      cues,
      rawFormattedContent
    };
  }

  private formatSubtitleOutput(cues: SubtitleCue[], format: SubtitleEngineSpec['format']): string {
    if (format === 'srt') {
      return cues
        .map(
          (c) =>
            `${c.index}\n${this.formatSrtTime(c.startTimeSec)} --> ${this.formatSrtTime(c.endTimeSec)}\n${c.translatedText || c.text}\n`
        )
        .join('\n');
    } else if (format === 'vtt') {
      const header = 'WEBVTT - VirJoy AI Generated Subtitles\n\n';
      const body = cues
        .map(
          (c) =>
            `${this.formatVttTime(c.startTimeSec)} --> ${this.formatVttTime(c.endTimeSec)}\n${c.translatedText || c.text}\n`
        )
        .join('\n');
      return header + body;
    } else if (format === 'ass') {
      return `[Script Info]\nTitle: VirJoy AI Subtitle\nScriptType: v4.00+\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n` +
        cues.map((c) => `Dialogue: 0,${this.formatAssTime(c.startTimeSec)},${this.formatAssTime(c.endTimeSec)},Default,,0,0,0,,${c.translatedText || c.text}`).join('\n');
    }
    // Burned format representation
    return JSON.stringify(cues, null, 2);
  }

  private formatSrtTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  private formatVttTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  private formatAssTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
}

export const subtitleEngine = new UniversalSubtitleEngine();
