import React, { useState, useEffect } from 'react';
import { Type, Sparkles, Captions, Play, Pause, Globe } from 'lucide-react';

interface SubtitlePreviewBoxProps {
  font: string;
  size: string;
  color: string;
  position: string;
  animation: string;
  subtitleLanguage: string;
  voiceLanguage: string;
  languagesList?: Array<{ id: string; name: string; nativeName: string; flag?: string }>;
}

const SAMPLE_SUBTITLES: Record<string, string> = {
  'auto': '⚡ VirJoy AI — Automated Video Subtitle Preview',
  'en-US': '⚡ Experience High-Converting AI Videos with VirJoy AI!',
  'en-IN': '⚡ Experience High-Converting AI Videos with VirJoy AI!',
  'hi-IN': '⚡ VirJoy AI के साथ उच्च-रूपांतरण AI वीडियो बनाएं!',
  'bn-IN': '⚡ VirJoy AI এর সাথে চমৎকার AI ভিডিও তৈরি করুন!',
  'ta-IN': '⚡ VirJoy AI மூலம் தரம்மிக்க வீடியோக்களை உருவாக்குங்கள்!',
  'te-IN': '⚡ VirJoy AI తో అధ్భుతమైన AI వీక్షణలను సృష్టించండి!',
  'kn-IN': '⚡ VirJoy AI ಯೊಂದಿಗೆ ಅದ್ಭುತ AI ವೀಡಿಯೊಗಳನ್ನು ರಚಿಸಿ!',
  'ml-IN': '⚡ VirJoy AI ഉപയോഗിച്ച് ആകർഷകമായ AI വീഡിയോകൾ സൃഷ്ടിക്കൂ!',
  'mr-IN': '⚡ VirJoy AI सह आकर्षक AI व्हिडिओ तयार करा!',
  'gu-IN': '⚡ VirJoy AI સાથે અદ્ભુત AI વિડીયો બનાવો!',
  'pa-IN': '⚡ VirJoy AI ਨਾਲ ਸ਼ਾਨਦਾਰ AI ਵੀਡੀਓ ਬਣਾਓ!',
  'es-ES': '⚡ ¡Crea videos dinámicos con inteligencia artificial en VirJoy AI!',
  'fr-FR': '⚡ Créez des vidéos captivantes avec l\'IA sur VirJoy AI!',
  'de-DE': '⚡ Erstellen Sie fesselnde KI-Videos mit VirJoy AI!',
  'ar-SA': '⚡ انشئ فيديوهات ذكية واحترافية مع VirJoy AI!',
  'ja-JP': '⚡ VirJoy AIで魅力的なAI動画を瞬時に生成！'
};

export const SubtitlePreviewBox: React.FC<SubtitlePreviewBoxProps> = ({
  font,
  size,
  color,
  position,
  animation,
  subtitleLanguage,
  voiceLanguage,
  languagesList = []
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  // Determine actual language display name
  const effectiveLangCode = subtitleLanguage === 'auto' ? voiceLanguage : subtitleLanguage;
  const targetLangObj = languagesList.find((l) => l.id === effectiveLangCode);
  const langLabel = targetLangObj
    ? `${targetLangObj.flag || ''} ${targetLangObj.name} (${targetLangObj.nativeName})`
    : effectiveLangCode;

  // Get sample subtitle text based on language
  const subtitleText =
    SAMPLE_SUBTITLES[effectiveLangCode] ||
    `⚡ ${langLabel} — Synchronized AI Subtitles by VirJoy AI Engine`;

  const words = subtitleText.split(' ');

  // Word-Highlight animation ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % words.length);
    }, 450);
    return () => clearInterval(interval);
  }, [isPlaying, words.length]);

  // CSS Font family mapping
  const getFontFamily = (fName: string) => {
    switch (fName.toLowerCase()) {
      case 'impact':
        return 'Impact, Charcoal, sans-serif';
      case 'montserrat':
        return '"Montserrat", sans-serif';
      case 'playfair display':
        return '"Playfair Display", Georgia, serif';
      case 'roboto':
        return '"Roboto", sans-serif';
      case 'plus jakarta sans':
        return '"Plus Jakarta Sans", sans-serif';
      case 'inter':
      default:
        return '"Inter", system-ui, sans-serif';
    }
  };

  // Font size mapping
  const getFontSizeClass = (sz: string) => {
    switch (sz) {
      case 'Small':
        return 'text-xs sm:text-sm tracking-normal';
      case 'Large':
        return 'text-base sm:text-lg md:text-xl tracking-wide font-extrabold';
      case 'Extra Large':
        return 'text-lg sm:text-xl md:text-2xl tracking-wider font-black';
      case 'Medium':
      default:
        return 'text-sm sm:text-base tracking-normal font-bold';
    }
  };

  // Position class mapping
  const getPositionClass = (pos: string) => {
    switch (pos) {
      case 'Top':
        return 'top-3 left-1/2 -translate-x-1/2';
      case 'Center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'Bottom':
      default:
        return 'bottom-3 left-1/2 -translate-x-1/2';
    }
  };

  // Animation class mapping
  const getAnimationClass = (anim: string) => {
    switch (anim) {
      case 'Fade':
        return 'animate-pulse transition-opacity duration-500';
      case 'Bounce':
        return 'animate-bounce';
      case 'Pop-in':
        return 'transform transition-all duration-300 scale-100 hover:scale-105';
      case 'Word-Highlight':
      default:
        return 'transition-all duration-200';
    }
  };

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
        <span className="flex items-center gap-1.5 text-purple-400">
          <Sparkles className="w-3.5 h-3.5" /> Instant Live Subtitle Preview:
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-400" /> {langLabel}
          </span>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 text-emerald-400" />}
            <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
          </button>
        </div>
      </div>

      {/* 16:9 Video Canvas Frame Simulation */}
      <div className="relative w-full aspect-video sm:aspect-[21/9] bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950 border border-purple-500/30 rounded-xl overflow-hidden shadow-xl flex items-center justify-center p-4 group">
        {/* Animated Cyberpunk Visual Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-purple-950/30 to-slate-950 pointer-events-none" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-400">
          <Captions className="w-3 h-3 text-purple-400" />
          <span>Timing Sync: <strong className="text-emerald-400 font-mono">00:01.45s (0 Delay)</strong></span>
        </div>

        {/* Live Subtitle Overlay */}
        <div
          className={`absolute max-w-[90%] text-center px-4 py-2 rounded-xl backdrop-blur-md bg-slate-950/85 border border-slate-800/80 shadow-2xl z-10 transition-all ${getPositionClass(
            position
          )} ${getAnimationClass(animation)}`}
          style={{
            fontFamily: getFontFamily(font)
          }}
        >
          {animation === 'Word-Highlight' ? (
            <div className={`flex flex-wrap items-center justify-center gap-1.5 ${getFontSizeClass(size)}`}>
              {words.map((word, idx) => (
                <span
                  key={idx}
                  className={`transition-all duration-150 px-1 rounded ${
                    idx === activeWordIndex
                      ? 'bg-amber-400/30 text-amber-300 scale-110 font-black shadow-sm'
                      : ''
                  }`}
                  style={{
                    color: idx === activeWordIndex ? '#FDE047' : color,
                    textShadow: '0px 2px 8px rgba(0,0,0,0.9)'
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <div
              className={`${getFontSizeClass(size)}`}
              style={{
                color: color,
                textShadow: '0px 2px 10px rgba(0,0,0,0.95)'
              }}
            >
              {subtitleText}
            </div>
          )}
        </div>

        {/* Badge showing current style parameters */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] text-slate-400 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded-md">
          <span>{font}</span> • <span>{size}</span> • <span style={{ color }}>{color}</span> • <span>{position}</span> • <span>{animation}</span>
        </div>
      </div>
    </div>
  );
};
