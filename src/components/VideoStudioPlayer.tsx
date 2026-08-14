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
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const [, setRenderTrigger] = useState(0);

  const rawScenes = (project.scenes as any);
  const scenes: any[] = Array.isArray(rawScenes)
    ? rawScenes
    : (rawScenes && Array.isArray(rawScenes.scenes) ? rawScenes.scenes : []);

  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 4), 0);
  const currentScene = scenes[currentSceneIndex] || scenes[0];

  // Preload and cache images
  useEffect(() => {
    scenes.forEach(scene => {
      if (scene.imageUrl && !imageCacheRef.current[scene.imageUrl]) {
        const img = new Image();
        if (!scene.imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        img.src = scene.imageUrl;
        img.onload = () => {
          imageCacheRef.current[scene.imageUrl!] = img;
          setRenderTrigger(n => n + 1);
        };
        img.onerror = () => {
          // Retry without crossOrigin
          const retryImg = new Image();
          retryImg.src = scene.imageUrl!;
          retryImg.onload = () => {
            imageCacheRef.current[scene.imageUrl!] = retryImg;
            setRenderTrigger(n => n + 1);
          };
        };
      }
    });
  }, [scenes]);

  // Handle Background Music Playback
  useEffect(() => {
    const musicUrl = currentScene?.backgroundMusicUrl || project.inputs?.backgroundMusicUrl || 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73420.mp3?filename=cinematic-atmosphere-score-10646.mp3';
    if (isPlaying && !isMuted) {
      if (!bgAudioRef.current) {
        bgAudioRef.current = new Audio(musicUrl);
        bgAudioRef.current.loop = true;
        bgAudioRef.current.volume = 0.25;
      }
      bgAudioRef.current.play().catch(() => {});
    } else {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
    }
    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
    };
  }, [isPlaying, isMuted, currentScene, project]);

  // Speech narration synth
  const speakNarration = (text: string, voiceAudioUrl?: string) => {
    if (isMuted) return;
    if (voiceAudioUrl) {
      try {
        const audio = new Audio(voiceAudioUrl);
        audio.volume = 1.0;
        audio.play().catch(() => {});
        return;
      } catch (e) {
        console.warn('Voice audio play fallback to SpeechSynthesis:', e);
      }
    }
    if (!('speechSynthesis' in window)) return;
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
          for (let i = 0; i < scenes.length; i++) {
            accumulated += scenes[i].duration;
            if (next <= accumulated) {
              if (i !== currentSceneIndex) {
                setCurrentSceneIndex(i);
                speakNarration(scenes[i].narration, scenes[i].voiceAudioUrl);
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

    const cachedImg = currentScene?.imageUrl ? imageCacheRef.current[currentScene.imageUrl] : null;

    // If Scene has AI Generated Image URL, draw with camera motion animation
    if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
      ctx.save();

      // Calculate Camera Motion Transform (zoom_in, pan_right, etc.)
      const motion = currentScene.cameraMotion || 'zoom_in';
      const progress = (currentTime % (currentScene.duration || 4)) / (currentScene.duration || 4);

      let scale = 1.0;
      let offsetX = 0;
      let offsetY = 0;

      if (motion === 'zoom_in') {
        scale = 1.0 + progress * 0.12;
      } else if (motion === 'zoom_out') {
        scale = 1.15 - progress * 0.12;
      } else if (motion === 'pan_right') {
        scale = 1.08;
        offsetX = -progress * 25;
      } else if (motion === 'pan_left') {
        scale = 1.08;
        offsetX = progress * 25;
      } else if (motion === 'drone_flyby') {
        scale = 1.0 + progress * 0.15;
        offsetY = -progress * 15;
      } else {
        scale = 1.04;
      }

      ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(cachedImg, -width / 2, -height / 2, width, height);
      ctx.restore();

      // Overlay camera motion indicator badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(15, 15, 120, 24);
      ctx.fillStyle = '#a5b4fc';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🎥 ${motion.toUpperCase()}`, 75, 31);

      // Re-draw Subtitles & Watermark over image
      drawSubtitlesAndWatermark(ctx, width, height);
    } else if (currentScene?.imageUrl) {
      // Async image loading placeholder while image loads
      const img = new Image();
      if (!currentScene.imageUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = currentScene.imageUrl;
      img.onload = () => {
        imageCacheRef.current[currentScene.imageUrl!] = img;
        setRenderTrigger(n => n + 1);
      };
      
      // Fallback ring while loading
      const pulse = Math.sin(currentTime * 3) * 20;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 80 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 4;
      ctx.stroke();

      drawSubtitlesAndWatermark(ctx, width, height);
    } else {
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

      drawSubtitlesAndWatermark(ctx, width, height);
    }

    function drawSubtitlesAndWatermark(context: CanvasRenderingContext2D, w: number, h: number) {
      // Subtitle Caption Box with Dynamic Position, Font, Color, and Size
      if (currentScene?.caption && project.inputs.subtitleEnabled !== false) {
        const subColor = project.inputs.subtitleColor || '#FACC15';
        const subFont = project.inputs.subtitleFont || 'sans-serif';
        const subPos = project.inputs.subtitlePosition || 'Bottom';
        const subSize = project.inputs.subtitleSize || 'Medium';

        let fontPx = 15;
        if (subSize === 'Small') fontPx = 12;
        else if (subSize === 'Large') fontPx = 18;
        else if (subSize === 'Extra Large') fontPx = 22;

        let boxY = h - 70;
        let textY = h - 42;

        if (subPos === 'Top') {
          boxY = 20;
          textY = 48;
        } else if (subPos === 'Center') {
          boxY = h / 2 - 22;
          textY = h / 2 + 5;
        }

        context.fillStyle = 'rgba(15, 23, 42, 0.9)';
        context.fillRect(20, boxY, w - 40, 48);
        context.strokeStyle = subColor;
        context.lineWidth = 2;
        context.strokeRect(20, boxY, w - 40, 48);

        context.fillStyle = subColor;
        context.font = `bold ${fontPx}px ${subFont}, sans-serif`;
        context.textAlign = 'center';
        context.fillText(currentScene.caption, w / 2, textY);
      }

      // VirJoy Watermark if project is watermarked
      if (project.watermarked) {
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.font = 'bold 11px sans-serif';
        context.textAlign = 'right';
        context.fillText('⚡ Created with VirJoy AI (Free)', w - 15, 25);
      }
    }
  }, [currentScene, currentTime, project]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!isPlaying) {
      speakNarration(currentScene.narration, currentScene.voiceAudioUrl);
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

  // Helper to load audio buffer safely with fetch via proxy
  const fetchAudioBuffer = async (ctx: AudioContext, url: string): Promise<AudioBuffer | null> => {
    try {
      const fetchUrl = (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/audio/'))
        ? url
        : `/api/proxy-audio?url=${encodeURIComponent(url)}`;
      console.log('[AudioPreload] Fetching audio from:', fetchUrl);
      const res = await fetch(fetchUrl);
      if (!res.ok) {
        console.warn('[AudioPreload] Response not ok:', res.status, fetchUrl);
        return null;
      }
      const arrayBuffer = await res.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        console.warn('[AudioPreload] ArrayBuffer empty:', fetchUrl);
        return null;
      }
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      console.log('[AudioPreload] Successfully decoded audio:', fetchUrl, 'duration:', decoded.duration);
      return decoded;
    } catch (e) {
      console.warn('[AudioPreload] Error loading audio buffer:', url, e);
      return null;
    }
  };

  // Helper to preload clean same-origin blob image to guarantee canvas is never tainted
  const preloadCleanImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      if (url.startsWith('data:')) {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
        return;
      }

      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      fetch(proxyUrl)
        .then(res => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return res.blob();
        })
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(null);
          };
          img.src = objectUrl;
        })
        .catch((err) => {
          console.warn('[CleanImagePreload] Proxy failed, falling back to direct load:', url, err);
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = 'anonymous';
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = url;
        });
    });
  };

  // Helper to draw canvas frame for a specific time during export
  const drawFrameForTime = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    sceneList: any[]
  ) => {
    let acc = 0;
    let activeScene = sceneList[0];
    let sceneStartTime = 0;
    for (let i = 0; i < sceneList.length; i++) {
      const dur = sceneList[i].duration || 4;
      if (t <= acc + dur || i === sceneList.length - 1) {
        activeScene = sceneList[i];
        sceneStartTime = acc;
        break;
      }
      acc += dur;
    }

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const cachedImg = activeScene?.imageUrl ? imageCacheRef.current[activeScene.imageUrl] : null;

    if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
      ctx.save();
      const motion = activeScene.cameraMotion || 'zoom_in';
      const sceneDur = activeScene.duration || 4;
      const progress = Math.min(1, Math.max(0, (t - sceneStartTime) / sceneDur));

      let scale = 1.0;
      let offsetX = 0;
      let offsetY = 0;

      if (motion === 'zoom_in') scale = 1.0 + progress * 0.12;
      else if (motion === 'zoom_out') scale = 1.15 - progress * 0.12;
      else if (motion === 'pan_right') { scale = 1.08; offsetX = -progress * 25; }
      else if (motion === 'pan_left') { scale = 1.08; offsetX = progress * 25; }
      else if (motion === 'drone_flyby') { scale = 1.0 + progress * 0.15; offsetY = -progress * 15; }
      else scale = 1.04;

      ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(cachedImg, -w / 2, -h / 2, w, h);
      ctx.restore();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(15, 15, 120, 24);
      ctx.fillStyle = '#a5b4fc';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🎥 ${motion.toUpperCase()}`, 75, 31);
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(w * 0.1, h * 0.3, w * 0.8, h * 0.4);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(activeScene?.title || 'VirJoy AI Scene', w / 2, h / 2 - 10);
      ctx.font = '12px sans-serif';
      ctx.fillText(activeScene?.visualPrompt?.substring(0, 45) || '', w / 2, h / 2 + 15);
    }

    if (activeScene?.caption && project.inputs?.subtitleEnabled !== false) {
      const subColor = project.inputs?.subtitleColor || '#FACC15';
      const subFont = project.inputs?.subtitleFont || 'sans-serif';
      const subPos = project.inputs?.subtitlePosition || 'Bottom';
      const subSize = project.inputs?.subtitleSize || 'Medium';

      let fontPx = 15;
      if (subSize === 'Small') fontPx = 12;
      else if (subSize === 'Large') fontPx = 18;
      else if (subSize === 'Extra Large') fontPx = 22;

      let boxY = h - 70;
      let textY = h - 42;
      if (subPos === 'Top') { boxY = 20; textY = 48; }
      else if (subPos === 'Center') { boxY = h / 2 - 22; textY = h / 2 + 5; }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(20, boxY, w - 40, 48);
      ctx.strokeStyle = subColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(20, boxY, w - 40, 48);

      ctx.fillStyle = subColor;
      ctx.font = `bold ${fontPx}px ${subFont}, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(activeScene.caption, w / 2, textY);
    }

    if (project.watermarked) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⚡ Created with VirJoy AI (Free)', w - 15, 25);
    }
  };

  // Download Video function using MediaRecorder + Web Audio API stream mixing
  const handleDownloadVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[Download] Canvas ref missing!');
      return;
    }

    console.log('[Download] 1. Download button clicked');
    console.log('[Download] 2. Scenes loaded:', scenes.length, 'scenes');
    console.log('[Download] 3. Total duration calculated:', totalDuration, 'seconds');

    setIsDownloading(true);

    try {
      // Image Preload Phase
      console.log('[Download] 4. Image preload started');
      const imagePromises = scenes.map(async (scene, i) => {
        if (!scene.imageUrl) return;
        if (imageCacheRef.current[scene.imageUrl]?.complete) return;
        console.log(`[Download] Preloading image for scene ${i + 1}:`, scene.imageUrl);
        const img = await preloadCleanImage(scene.imageUrl);
        if (img) {
          imageCacheRef.current[scene.imageUrl] = img;
          console.log(`[Download] Scene ${i + 1} image preloaded successfully`);
        }
      });

      await Promise.all(imagePromises);
      console.log('[Download] 5. Image preload completed');

      // Audio Setup Phase
      console.log('[Download] 6. Voice preload started');
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      console.log('[Download] 10. AudioContext created & resumed, state:', audioCtx.state);

      const destNode = audioCtx.createMediaStreamDestination();
      console.log('[Download] 11. MediaStreamDestination created');

      // BGM Setup
      console.log('[Download] 8. BGM preload started');
      const musicUrl = scenes[0]?.backgroundMusicUrl || project.inputs?.backgroundMusicUrl || '/audio/cinematic.mp3';
      const bgmBuffer = await fetchAudioBuffer(audioCtx, musicUrl);
      if (bgmBuffer) {
        const bgSource = audioCtx.createBufferSource();
        bgSource.buffer = bgmBuffer;
        bgSource.loop = true;
        const bgGain = audioCtx.createGain();
        bgGain.gain.value = 0.25;
        bgSource.connect(bgGain);
        bgGain.connect(destNode);
        bgSource.start(0);
        console.log('[Download] BGM source connected to destNode');
      }
      console.log('[Download] 9. BGM preload completed');

      // Voice Setup
      let sceneAccTime = 0;
      for (let i = 0; i < scenes.length; i++) {
        const s = scenes[i];
        const dur = s.duration || 4;
        const voiceUrl = s.voiceAudioUrl || `/api/proxy-audio?url=${encodeURIComponent(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(s.narration || 'VirJoy AI')}&tl=en&client=tw-ob`)}`;

        const voiceBuffer = await fetchAudioBuffer(audioCtx, voiceUrl);
        if (voiceBuffer) {
          const vSource = audioCtx.createBufferSource();
          vSource.buffer = voiceBuffer;
          const vGain = audioCtx.createGain();
          vGain.gain.value = 1.0;
          vSource.connect(vGain);
          vGain.connect(destNode);
          vSource.start(audioCtx.currentTime + sceneAccTime);
          console.log(`[Download] Scene ${i + 1} voice connected at +${sceneAccTime}s`);
        }
        sceneAccTime += dur;
      }
      console.log('[Download] 7. Voice preload completed');

      // Canvas & Stream Combination Phase
      const canvasStream = canvas.captureStream(30);
      console.log('[Download] 12. canvas.captureStream created');

      const videoTracks = canvasStream.getVideoTracks();
      console.log('[Download] 13. Video track count:', videoTracks.length);
      if (videoTracks.length === 0) {
        throw new Error('Canvas captureStream returned zero video tracks');
      }

      const audioTracks = destNode.stream.getAudioTracks();
      console.log('[Download] 14. Audio track count:', audioTracks.length);

      const combinedTracks = [...videoTracks, ...audioTracks];
      const combinedStream = new MediaStream(combinedTracks);

      // Select MIME Type
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else {
          mimeType = '';
        }
      }
      console.log('[Download] Selected MIME type:', mimeType);

      const recorderOptions = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      console.log('[Download] 15. MediaRecorder created');

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          console.log('[Download] 20. ondataavailable fired, chunk size:', e.data.size, 'total chunks:', chunks.length);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[Download] 19. MediaRecorder onstop event fired. Chunk count:', chunks.length);
        console.log('[Download] 21. Blob chunks count:', chunks.length);

        audioCtx.close().catch(() => {});

        const finalMime = mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        console.log('[Download] 22. Final Blob size:', blob.size, 'bytes');
        console.log('[Download] 23. Final MIME type:', finalMime);

        if (blob.size === 0) {
          console.error('[Download Error] MediaRecorder blob size is 0');
          setIsDownloading(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        console.log('[Download] 24. Download URL created:', url);

        const a = document.createElement('a');
        a.href = url;
        const ext = finalMime.includes('mp4') ? 'mp4' : 'webm';
        const fileName = `${project.title.replace(/\s+/g, '_')}_${project.exportQuality || 'HD'}.${ext}`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        console.log('[Download] 25. anchor.click() executed for:', fileName);
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(url);
          setIsDownloading(false);
          console.log('[Download] 26. Cleanup completed');
        }, 1000);
      };

      mediaRecorder.start(100);
      console.log('[Download] 16. MediaRecorder started');

      // Frame loop
      const width = project.aspectRatio === '9:16' ? 360 : project.aspectRatio === '1:1' ? 480 : 640;
      const height = project.aspectRatio === '9:16' ? 640 : project.aspectRatio === '1:1' ? 480 : 360;
      const ctx = canvas.getContext('2d');

      let recTime = 0;
      const frameRate = 30;
      const dt = 1 / frameRate;

      console.log('[Download] 17. Frame loop started');

      const recordInterval = setInterval(() => {
        if (recTime >= totalDuration) {
          clearInterval(recordInterval);
          console.log('[Download] 18. Frame loop completed at t =', recTime);
          setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') {
              console.log('[Download] Stopping MediaRecorder');
              mediaRecorder.stop();
            }
          }, 300);
          return;
        }

        if (ctx) {
          drawFrameForTime(ctx, width, height, recTime, scenes);
        }
        recTime += dt;
      }, 1000 / frameRate);

    } catch (e: any) {
      console.error('[Download Critical Failure]:', e?.message || e, e);
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
            {scenes.length} Scenes • {totalDuration}s Total Duration • Ratio: {project.aspectRatio}
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
              {scenes.map((s, idx) => (
                <button
                  key={s.id || `scene-${idx}`}
                  onClick={() => {
                    setCurrentSceneIndex(idx);
                    let acc = 0;
                    for (let i = 0; i < idx; i++) acc += (scenes[i].duration || 4);
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

