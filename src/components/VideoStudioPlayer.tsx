import React, { useState, useEffect, useRef } from 'react';
import { VideoProject } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Volume2,
  VolumeX,
  Edit3,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldAlert,
  Film,
  Maximize2,
  Minimize2,
  Clock,
  Zap
} from 'lucide-react';

interface VideoStudioPlayerProps {
  project: VideoProject | null;
  onOpenTimelineEditor: () => void;
  onOpenPricing: () => void;
}

export const VideoStudioPlayer: React.FC<VideoStudioPlayerProps> = ({
  project,
  onOpenTimelineEditor,
  onOpenPricing
}) => {
  if (!project) {
    return (
      <div className="bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-400 light:text-slate-600 flex flex-col items-center justify-center min-h-[400px]">
        <Film className="w-12 h-12 text-slate-600 dark:text-slate-600 light:text-slate-400 mb-3 animate-pulse" />
        <h3 className="text-base font-bold text-slate-300 dark:text-slate-300 light:text-slate-800">No Generated Video Active</h3>
        <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 max-w-sm mt-1">
          Enter a prompt, upload media, or extract a product URL above to generate your AI video project.
        </p>
      </div>
    );
  }

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Preview View Modes: Normal, Expanded (Cinema), Fullscreen
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const totalDuration = project.scenes.reduce((acc, s) => acc + (s.duration || 4), 0);
  const currentScene = project.scenes[currentSceneIndex] || project.scenes[0];

  // Speech narration synth
  const speakNarration = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Playback timer ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.2;
          if (next >= totalDuration) {
            setIsPlaying(false);
            window.speechSynthesis?.cancel();
            return 0;
          }

          // Calculate current scene index based on time
          let accumulated = 0;
          for (let i = 0; i < project.scenes.length; i++) {
            accumulated += project.scenes[i].duration;
            if (next <= accumulated) {
              if (i !== currentSceneIndex) {
                setCurrentSceneIndex(i);
                speakNarration(project.scenes[i].narration);
              }
              break;
            }
          }
          return next;
        });
      }, 200);
    } else {
      window.speechSynthesis?.cancel();
    }

    return () => {
      clearInterval(timer);
    };
  }, [isPlaying, totalDuration, currentSceneIndex, project, isMuted]);

  // Canvas Frame Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size based on aspect ratio
    const width = project.aspectRatio === '9:16' ? 360 : project.aspectRatio === '1:1' ? 480 : 640;
    const height = project.aspectRatio === '9:16' ? 640 : project.aspectRatio === '1:1' ? 480 : 360;

    canvas.width = width;
    canvas.height = height;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic animated glowing rings
    const pulse = Math.sin(currentTime * 3) * 20;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 80 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Scene Title Header
    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentScene?.title?.toUpperCase() || 'VIRJOY SCENE', width / 2, 35);

    // Scene Visual Description Center Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
    ctx.lineWidth = 1;
    const boxW = width * 0.8;
    const boxH = height * 0.35;
    ctx.fillRect((width - boxW) / 2, (height - boxH) / 2 - 10, boxW, boxH);
    ctx.strokeRect((width - boxW) / 2, (height - boxH) / 2 - 10, boxW, boxH);

    // Visual prompt label inside
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    const visualText = currentScene?.visualPrompt || 'Dynamic Motion Frame';
    ctx.fillText(visualText.length > 50 ? visualText.substring(0, 50) + '...' : visualText, width / 2, height / 2 - 10);

    // Subtitle Caption Box at Bottom
    if (currentScene?.caption) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(20, height - 70, width - 40, 45);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, height - 70, width - 40, 45);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentScene.caption, width / 2, height - 42);
    }

    // VirJoy Watermark if project is watermarked
    if (project.watermarked) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⚡ Created with VirJoy AI (Free)', width - 15, 20);
    }
  }, [currentScene, currentTime, project]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!isPlaying) {
      speakNarration(currentScene.narration);
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle Fullscreen Mode
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Download Video function using MediaRecorder canvas recording
  const handleDownloadVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDownloading(true);

    try {
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title.replace(/\s+/g, '_')}_${project.exportQuality}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsDownloading(false);
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, 3000);
    } catch (e) {
      console.warn('Canvas recorder fallback:', e);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${project.title.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setIsDownloading(false);
    }
  };

  const fullShareUrl = window.location.origin + project.shareUrl;

  const copyShareLink = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl relative transition-all duration-300 ${
        isExpanded ? 'lg:col-span-12 ring-2 ring-indigo-500/50' : ''
      } ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto' : ''
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 dark:text-white light:text-slate-900 max-w-md truncate">
              {project.title}
            </h3>
            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" /> Ready
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-indigo-500/30">
              {project.exportQuality}
            </span>
            <span className="bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> 24h Retention
            </span>
            {project.watermarked && (
              <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-amber-500/30">
                Watermarked
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {project.scenes.length} Scenes • {totalDuration}s Total Duration • Ratio: {project.aspectRatio}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Standard View' : 'Expand Cinema Mode'}
            className="hidden lg:flex bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-xl text-xs items-center gap-1 transition-all"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isExpanded ? 'Compact' : 'Cinema Mode'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Preview"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          <button
            onClick={onOpenTimelineEditor}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Editor
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>

          <button
            onClick={handleDownloadVideo}
            disabled={isDownloading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer min-h-[36px]"
          >
            {isDownloading ? (
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isDownloading ? 'Rendering...' : 'Download MP4'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Player Stage */}
      <div className={`relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-3 sm:p-6 ${isExpanded ? 'min-h-[520px]' : ''}`}>
        {/* Aspect ratio frame container */}
        <div className="relative max-w-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className={`rounded-lg shadow-2xl w-auto object-contain border border-slate-800/80 transition-all ${
              isExpanded ? 'max-h-[580px]' : 'max-h-[360px] sm:max-h-[460px]'
            }`}
          />

          {/* Watermark Banner Badge */}
          {project.watermarked && (
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" /> Watermarked —{' '}
              <button onClick={onOpenPricing} className="underline font-bold hover:text-white">
                Remove with ₹199
              </button>
            </div>
          )}
        </div>

        {/* Video Player Controls Bar */}
        <div className="w-full max-w-xl mt-4 space-y-2">
          {/* Progress Seek Bar */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-mono text-[11px]">{currentTime.toFixed(1)}s</span>
            <input
              type="range"
              min="0"
              max={totalDuration}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
              }}
              className="flex-1 accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <span className="font-mono text-[11px]">{totalDuration}s</span>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full transition-all shadow-md cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={() => {
                  setCurrentTime(0);
                  setCurrentSceneIndex(0);
                  setIsPlaying(false);
                }}
                title="Restart Video"
                className="text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-900 border border-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="text-slate-400 hover:text-white p-2.5 rounded-xl bg-slate-900 border border-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Scene Indicators */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-none">
              {project.scenes.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentSceneIndex(idx);
                    let acc = 0;
                    for (let i = 0; i < idx; i++) acc += project.scenes[i].duration;
                    setCurrentTime(acc);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                    currentSceneIndex === idx
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                  }`}
                >
                  Scene {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h4 className="text-base font-bold text-white mb-2">Share VirJoy Generated Video</h4>
            <p className="text-xs text-slate-400 mb-4">
              Copy public link or share directly to social media. Files are retained for 24 hours per policy.
            </p>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl mb-4">
              <input
                type="text"
                readOnly
                value={fullShareUrl}
                className="bg-transparent text-xs text-slate-200 outline-none flex-1 truncate"
              />
              <button
                onClick={copyShareLink}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my AI video generated with VirJoy AI: ${fullShareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold py-2 rounded-xl text-center border border-emerald-500/30"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Created this video with VirJoy AI! ${fullShareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-semibold py-2 rounded-xl text-center border border-sky-500/30"
              >
                Twitter / X
              </a>
            </div>

            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full mt-4 bg-slate-800 text-slate-300 hover:text-white py-2 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

