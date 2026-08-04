import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AppConfig, PlanKey, ProductMetadata, UserStats, VideoProjectInputs } from '../types';
import { CustomDropdown, DropdownOption } from './CustomDropdown';
import { SubtitlePreviewBox } from './SubtitlePreviewBox';
import {
  Wand2,
  Image as ImageIcon,
  Video,
  Link,
  ShoppingBag,
  Clock,
  Layout,
  X,
  Sparkles,
  Check,
  AlertCircle,
  Film,
  Globe,
  Mic,
  Volume2,
  Lock,
  Captions,
  Type,
  Palette,
  Maximize2,
  Upload,
  Star,
  Tag,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle2,
  FileVideo,
  Layers
} from 'lucide-react';

interface MultiModalInputProps {
  config: AppConfig;
  userStats: UserStats;
  currentPlan: PlanKey;
  isGenerating: boolean;
  onGenerate: (data: {
    prompt: string;
    targetDurationSeconds: number;
    aspectRatio: '16:9' | '9:16' | '1:1';
    inputs: VideoProjectInputs;
  }) => void;
  onOpenPricing: (upgradeMsg?: string) => void;
  onCheckProtectedAccess?: () => boolean;
}

const PRESET_PROMPTS = [
  {
    title: '🛒 Amazon Product Ad',
    prompt: 'Create a high-converting 15s commercial ad showcasing key product features, instant discounts, and a bold Call-To-Action.',
    type: 'product'
  },
  {
    title: '⚡ Viral Reels Hook',
    prompt: 'Create an engaging short video with a curiosity hook: 3 productivity secrets nobody told you about AI video creation.',
    type: 'reels'
  },
  {
    title: '📱 Tech Showcase',
    prompt: 'A sleek futurist showcase highlighting ultra-sleek build quality, long battery life, and crystal-clear sound.',
    type: 'tech'
  },
  {
    title: '🌟 Brand Story',
    prompt: 'An inspiring 30-second brand origin video highlighting craftsmanship, customer happiness, and premium design.',
    type: 'brand'
  }
];

const DEFAULT_LANGUAGES = [
  { id: 'en-US', name: 'English (US / Global)', nativeName: 'English', code: 'en-US', flag: '🇺🇸' },
  { id: 'en-IN', name: 'English (India)', nativeName: 'English (IN)', code: 'en-IN', flag: '🇮🇳' },
  { id: 'hi-IN', name: 'Hindi (India)', nativeName: 'हिन्दी', code: 'hi-IN', flag: '🇮🇳' },
  { id: 'bn-IN', name: 'Bengali (India / Bangladesh)', nativeName: 'বাংলা', code: 'bn-IN', flag: '🇮🇳' },
  { id: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN', flag: '🇮🇳' },
  { id: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN', flag: '🇮🇳' },
  { id: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn-IN', flag: '🇮🇳' },
  { id: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-IN', flag: '🇮🇳' },
  { id: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN', flag: '🇮🇳' },
  { id: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu-IN', flag: '🇮🇳' },
  { id: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa-IN', flag: '🇮🇳' },
  { id: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', code: 'or-IN', flag: '🇮🇳' },
  { id: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া', code: 'as-IN', flag: '🇮🇳' },
  { id: 'ur-IN', name: 'Urdu', nativeName: 'اردو', code: 'ur-IN', flag: '🇮🇳' },
  { id: 'es-ES', name: 'Spanish', nativeName: 'Español', code: 'es-ES', flag: '🇪🇸' },
  { id: 'fr-FR', name: 'French', nativeName: 'Français', code: 'fr-FR', flag: '🇫🇷' },
  { id: 'de-DE', name: 'German', nativeName: 'Deutsch', code: 'de-DE', flag: '🇩🇪' },
  { id: 'ar-SA', name: 'Arabic', nativeName: 'العربية', code: 'ar-SA', flag: '🇸🇦' },
  { id: 'ja-JP', name: 'Japanese', nativeName: '日本語', code: 'ja-JP', flag: '🇯🇵' }
];

const DEFAULT_VOICES = [
  { id: 'female-ananya', name: 'Ananya', gender: 'female' as const, provider: 'VirJoy Neural Synth' },
  { id: 'male-aarav', name: 'Aarav', gender: 'male' as const, provider: 'VirJoy Neural Synth' },
  { id: 'child-anika', name: 'Anika (Kid Voice)', gender: 'child' as const, provider: 'VirJoy Young Neural' },
  { id: 'adult-vikram', name: 'Vikram (Adult Narrator)', gender: 'adult' as const, provider: 'VirJoy Neural Pro' },
  { id: 'female-priya-energetic', name: 'Priya (High Energy)', gender: 'female' as const, provider: 'VirJoy Neural Pro' },
  { id: 'male-rohan-narrator', name: 'Rohan (Storyteller)', gender: 'male' as const, provider: 'VirJoy Neural Pro' },
  { id: 'neutral-alex-cinema', name: 'Alex (Neutral Studio)', gender: 'neutral' as const, provider: 'VirJoy Ultra Neural' }
];

const DEFAULT_TONES = [
  'Natural',
  'Professional',
  'Energetic',
  'Calm',
  'Friendly',
  'Serious',
  'Dramatic',
  'Cinematic',
  'Storytelling',
  'Educational',
  'Funny',
  'Motivational',
  'News style'
];

const DEFAULT_FONTS = ['Inter', 'Impact', 'Montserrat', 'Playfair Display', 'Roboto', 'Plus Jakarta Sans'];

const DEFAULT_COLORS = [
  { name: 'Yellow Gold', hex: '#FACC15' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Cyan Blue', hex: '#06B6D4' },
  { name: 'Lime Green', hex: '#84CC16' },
  { name: 'Amber Orange', hex: '#F59E0B' },
  { name: 'Magenta Pink', hex: '#EC4899' }
];

const DEFAULT_POSITIONS = ['Bottom', 'Center', 'Top'];
const DEFAULT_ANIMATIONS = ['Pop-in', 'Fade', 'Bounce', 'Word-Highlight'];
const DEFAULT_SIZES = ['Small', 'Medium', 'Large', 'Extra Large'];

export const MultiModalInput: React.FC<MultiModalInputProps> = ({
  config,
  userStats,
  currentPlan,
  isGenerating,
  onGenerate,
  onOpenPricing,
  onCheckProtectedAccess
}) => {
  const planConfig = config.plans[currentPlan] || config.plans.Free;
  const voiceConfig = config.voiceConfig;
  const subtitleConfig = config.subtitleConfig || {
    autoSubtitle: true,
    enabled: true,
    position: 'Bottom',
    font: 'Inter',
    color: '#FACC15',
    size: 'Medium',
    animation: 'Pop-in',
    supportedFonts: DEFAULT_FONTS,
    supportedColors: DEFAULT_COLORS,
    supportedPositions: DEFAULT_POSITIONS,
    supportedAnimations: DEFAULT_ANIMATIONS
  };

  // Resolved arrays with complete defaults - Memoized for reference stability
  const languagesList = useMemo(() => {
    return (voiceConfig?.supportedLanguages && voiceConfig.supportedLanguages.length > 0)
      ? voiceConfig.supportedLanguages
      : DEFAULT_LANGUAGES;
  }, [voiceConfig?.supportedLanguages]);

  const voicesList = useMemo(() => {
    return (voiceConfig?.supportedVoices && voiceConfig.supportedVoices.length > 0)
      ? voiceConfig.supportedVoices
      : DEFAULT_VOICES;
  }, [voiceConfig?.supportedVoices]);

  const tonesList = useMemo(() => {
    return (voiceConfig?.supportedTones && voiceConfig.supportedTones.length > 0)
      ? voiceConfig.supportedTones
      : DEFAULT_TONES;
  }, [voiceConfig?.supportedTones]);

  const fontsList = useMemo(() => {
    return (subtitleConfig?.supportedFonts && subtitleConfig.supportedFonts.length > 0)
      ? subtitleConfig.supportedFonts
      : DEFAULT_FONTS;
  }, [subtitleConfig?.supportedFonts]);

  const colorsList = useMemo(() => {
    return (subtitleConfig?.supportedColors && subtitleConfig.supportedColors.length > 0)
      ? subtitleConfig.supportedColors
      : DEFAULT_COLORS;
  }, [subtitleConfig?.supportedColors]);

  const positionsList = useMemo(() => {
    return (subtitleConfig?.supportedPositions && subtitleConfig.supportedPositions.length > 0)
      ? subtitleConfig.supportedPositions
      : DEFAULT_POSITIONS;
  }, [subtitleConfig?.supportedPositions]);

  const animationsList = useMemo(() => {
    return (subtitleConfig?.supportedAnimations && subtitleConfig.supportedAnimations.length > 0)
      ? subtitleConfig.supportedAnimations
      : DEFAULT_ANIMATIONS;
  }, [subtitleConfig?.supportedAnimations]);

  const sizesList = DEFAULT_SIZES;

  // Formatted dropdown options - PART 3 UNIFIED DROPDOWNS
  const positionDropdownOptions: DropdownOption[] = useMemo(() => {
    return positionsList.map((pos) => ({ id: pos, label: pos }));
  }, [positionsList]);

  const fontDropdownOptions: DropdownOption[] = useMemo(() => {
    return fontsList.map((f) => ({ id: f, label: f }));
  }, [fontsList]);

  const colorDropdownOptions: DropdownOption[] = useMemo(() => {
    return colorsList.map((c) => ({ id: c.hex, label: c.name, colorHex: c.hex }));
  }, [colorsList]);

  const sizeDropdownOptions: DropdownOption[] = useMemo(() => {
    return sizesList.map((s) => ({ id: s, label: s }));
  }, [sizesList]);

  const animationDropdownOptions: DropdownOption[] = useMemo(() => {
    return animationsList.map((anim) => ({ id: anim, label: anim }));
  }, [animationsList]);

  const languageDropdownOptions: DropdownOption[] = useMemo(() => {
    return languagesList.map((lang) => ({
      id: lang.id,
      label: `${lang.name} (${lang.nativeName})`,
      flag: lang.flag
    }));
  }, [languagesList]);

  const subtitleLanguageDropdownOptions: DropdownOption[] = useMemo(() => {
    return [
      { id: 'auto', label: 'Auto (Match Audio Voice Language)', flag: '🌐' },
      ...languagesList.map((lang) => ({
        id: lang.id,
        label: `${lang.name} (${lang.nativeName})`,
        flag: lang.flag
      }))
    ];
  }, [languagesList]);

  const voiceDropdownOptions: DropdownOption[] = useMemo(() => {
    return voicesList.map((v) => ({
      id: v.id,
      label: v.name,
      sublabel: `${v.gender.toUpperCase()} • ${v.provider}`,
      badge: v.gender
    }));
  }, [voicesList]);

  const toneDropdownOptions: DropdownOption[] = useMemo(() => {
    return tonesList.map((t) => ({ id: t, label: t }));
  }, [tonesList]);

  // Hidden file input refs for native picker triggers
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Monthly credits & remaining balance (1 second = 1 Credit)
  const monthlyCredits = userStats.monthlyCredits || planConfig.monthlyCredits || planConfig.maxMonthlyDurationSeconds || 30;
  const usedCredits = userStats.usedCredits !== undefined ? userStats.usedCredits : (userStats.usedMonthlyDurationSeconds || 0);
  const remainingCredits = Math.max(0, monthlyCredits - usedCredits);

  // Prompt state - ALWAYS VISIBLE
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(15);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  // Voice, Tone & Dynamic Language selection
  const [language, setLanguage] = useState<string>(() => languagesList[0]?.id || 'en-US');
  const [voice, setVoice] = useState<string>(() => voicesList[0]?.id || 'female-ananya');
  const [voiceTone, setVoiceTone] = useState<string>(() => tonesList[0] || 'Energetic');

  // Sync state safely without resetting user selection if present in resolved option lists
  useEffect(() => {
    if (languagesList.length > 0 && !languagesList.some(l => l.id === language)) {
      setLanguage(languagesList[0].id);
    }
  }, [languagesList, language]);

  useEffect(() => {
    if (voicesList.length > 0 && !voicesList.some(v => v.id === voice)) {
      setVoice(voicesList[0].id);
    }
  }, [voicesList, voice]);

  useEffect(() => {
    if (tonesList.length > 0 && !tonesList.includes(voiceTone)) {
      setVoiceTone(tonesList[0]);
    }
  }, [tonesList, voiceTone]);

  // Subtitle / Caption controls
  const [subtitleEnabled, setSubtitleEnabled] = useState<boolean>(subtitleConfig.enabled ?? true);
  const [subtitleLanguage, setSubtitleLanguage] = useState<string>(subtitleConfig.defaultSubtitleLanguage || 'auto');
  const [subtitlePosition, setSubtitlePosition] = useState<string>(subtitleConfig.position || 'Bottom');
  const [subtitleFont, setSubtitleFont] = useState<string>(subtitleConfig.font || 'Inter');
  const [subtitleColor, setSubtitleColor] = useState<string>(subtitleConfig.color || '#FACC15');
  const [subtitleSize, setSubtitleSize] = useState<string>(subtitleConfig.size || 'Medium');
  const [subtitleAnimation, setSubtitleAnimation] = useState<string>(subtitleConfig.animation || 'Pop-in');

  // Attachment workspace tabs & media
  const [attachmentSection, setAttachmentSection] = useState<'media' | 'url' | 'subtitles' | 'none'>('none');
  const [images, setImages] = useState<string[]>([]);
  const [videoClips, setVideoClips] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  // Drag & drop state for attachments
  const [isDragOverImages, setIsDragOverImages] = useState(false);
  const [isDragOverVideos, setIsDragOverVideos] = useState(false);
  const [isDragOverScreenshots, setIsDragOverScreenshots] = useState(false);

  // Product URL state
  const [productUrl, setProductUrl] = useState('');
  const [isExtractingProduct, setIsExtractingProduct] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<ProductMetadata | null>(null);
  const [extractError, setExtractError] = useState('');

  // Handle URL product extraction - PART 1 & PART 6
  const handleExtractProduct = useCallback(async () => {
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
    if (!productUrl.trim()) return;
    setIsExtractingProduct(true);
    setExtractError('');

    try {
      const res = await fetch('/api/product/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl.trim() })
      });
      const data = await res.json();
      if (data.success && data.productInfo) {
        setExtractedProduct(data.productInfo);
        if (!prompt.trim()) {
          const title = data.productInfo.title || 'Product';
          const vendor = data.productInfo.vendor ? ` by ${data.productInfo.vendor}` : '';
          const price = data.productInfo.price ? ` (${data.productInfo.price})` : '';
          const features = data.productInfo.features && data.productInfo.features.length > 0
            ? `. Key features: ${data.productInfo.features.slice(0, 3).join(', ')}`
            : '';
          setPrompt(`Create a high-converting promotional product ad for ${title}${vendor}${price}${features}. Highlight value and end with a strong CTA.`);
        }
      } else {
        setExtractError(data.error || 'Failed to extract product metadata. Check URL and try again.');
      }
    } catch (e: any) {
      setExtractError(e?.message || 'Network error extracting product URL');
    } finally {
      setIsExtractingProduct(false);
    }
  }, [onCheckProtectedAccess, productUrl, prompt]);

  // Upload handlers - PART 5 & PART 12
  const processImageFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
    const files = e.target.files;
    if (files) processImageFiles(files);
  }, [onCheckProtectedAccess, processImageFiles]);

  const processScreenshotFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setScreenshots((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleScreenshotUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
    const files = e.target.files;
    if (files) processScreenshotFiles(files);
  }, [onCheckProtectedAccess, processScreenshotFiles]);

  const processVideoFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      setVideoClips((prev) => [...prev, file.name]);
    });
  }, []);

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
    const files = e.target.files;
    if (files) processVideoFiles(files);
  }, [onCheckProtectedAccess, processVideoFiles]);

  // Drag & drop event handlers for attachment zones
  const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverImages(false);
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  }, [onCheckProtectedAccess, processImageFiles]);

  const handleVideoDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverVideos(false);
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processVideoFiles(e.dataTransfer.files);
    }
  }, [onCheckProtectedAccess, processVideoFiles]);

  const handleScreenshotDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverScreenshots(false);
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processScreenshotFiles(e.dataTransfer.files);
    }
  }, [onCheckProtectedAccess, processScreenshotFiles]);

  // Trigger video generation - PART 11 & PART 12
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
    const finalPrompt = prompt.trim() || (extractedProduct ? `Product video for ${extractedProduct.title}` : 'AI promotional video');

    onGenerate({
      prompt: finalPrompt,
      targetDurationSeconds: duration,
      aspectRatio,
      inputs: {
        textPrompt: finalPrompt,
        images,
        videoClips,
        screenshots,
        productUrl: productUrl.trim() || undefined,
        productData: extractedProduct || undefined,
        language,
        voice,
        voiceTone,
        targetDurationSeconds: duration,
        subtitleEnabled,
        subtitleLanguage,
        subtitlePosition,
        subtitleFont,
        subtitleColor,
        subtitleSize,
        subtitleAnimation
      }
    });
  }, [
    onCheckProtectedAccess,
    prompt,
    extractedProduct,
    onGenerate,
    duration,
    aspectRatio,
    images,
    videoClips,
    screenshots,
    productUrl,
    language,
    voice,
    voiceTone,
    subtitleEnabled,
    subtitleLanguage,
    subtitlePosition,
    subtitleFont,
    subtitleColor,
    subtitleSize,
    subtitleAnimation
  ]);

  // Clamp duration to active plan's max video duration limit if current selection exceeds it
  useEffect(() => {
    if (duration > planConfig.maxVideoDurationSeconds) {
      setDuration(planConfig.maxVideoDurationSeconds);
    }
  }, [currentPlan, planConfig.maxVideoDurationSeconds, duration]);

  // Configurable durations list
  const durationList = voiceConfig?.durationOptions || [
    { seconds: 10, label: '10s', minPlan: 'Free' as PlanKey },
    { seconds: 15, label: '15s', minPlan: 'Free' as PlanKey },
    { seconds: 30, label: '30s', minPlan: 'Free' as PlanKey },
    { seconds: 60, label: '60s (1m)', minPlan: '₹199' as PlanKey },
    { seconds: 90, label: '90s (1.5m)', minPlan: '₹399' as PlanKey },
    { seconds: 120, label: '2 mins', minPlan: '₹399' as PlanKey },
    { seconds: 180, label: '3 mins', minPlan: '₹399' as PlanKey },
    { seconds: 300, label: '5 mins', minPlan: '₹799' as PlanKey }
  ];

  // Character & word counters for prompt
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const charCount = prompt.length;

  return (
    <div className="bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-visible transition-colors w-full max-w-full">
      {/* Decorative background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 flex items-center gap-2 tracking-tight">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Wand2 className="w-5 h-5" />
            </span>
            Prompt-Driven AI Video Studio
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">
            Generate high-converting videos from text prompts, media attachments, product links, and customized AI voiceovers.
          </p>
        </div>

        {/* Hidden inputs for native file pickers */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Upload Images"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleVideoUpload}
          className="hidden"
          aria-label="Upload Video Clips"
        />
        <input
          ref={screenshotInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleScreenshotUpload}
          className="hidden"
          aria-label="Upload Screenshots"
        />

        {/* Media & Options Toggle Action Bar */}
        <div className="flex items-center gap-1.5 bg-slate-950 dark:bg-slate-950 light:bg-slate-100 p-1.5 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 flex-wrap">
          {/* 1. Image Button */}
          <button
            type="button"
            onClick={() => {
              if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
              setAttachmentSection('media');
              imageInputRef.current?.click();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              images.length > 0
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            aria-label="Attach Images"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Images {images.length > 0 ? `(${images.length})` : ''}</span>
          </button>

          {/* 2. Video Clip Button */}
          <button
            type="button"
            onClick={() => {
              if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
              setAttachmentSection('media');
              videoInputRef.current?.click();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              videoClips.length > 0
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            aria-label="Attach Video Clips"
          >
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>Video Clip {videoClips.length > 0 ? `(${videoClips.length})` : ''}</span>
          </button>

          {/* 3. Product URL Button */}
          <button
            type="button"
            onClick={() => setAttachmentSection((prev) => (prev === 'url' ? 'none' : 'url'))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              attachmentSection === 'url' || productUrl
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            aria-label="Integrate Product Link"
          >
            <Link className="w-3.5 h-3.5 text-amber-400" />
            <span>Product Link {productUrl ? '✓' : ''}</span>
          </button>

          {/* 4. Subtitles Button */}
          <button
            type="button"
            onClick={() => setAttachmentSection((prev) => (prev === 'subtitles' ? 'none' : 'subtitles'))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              attachmentSection === 'subtitles' || subtitleEnabled
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            aria-label="Configure Subtitles"
          >
            <Captions className="w-3.5 h-3.5 text-purple-400" />
            <span>Subtitles</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PART 4 — PROMPT AREA */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="prompt-input" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Describe the Video You Want VirJoy AI to Create:
              </label>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <span>{wordCount} words</span> • <span>{charCount} chars</span>
              </div>
            </div>

            <div className="relative group">
              <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g., A dynamic 30-second ad for noise-canceling wireless earbuds. Start with a dramatic subway noise hook, show sleek earbud design in close-up, highlight 30hr battery life in Hindi voiceover, end with a 20% discount offer and bold Call-To-Action."
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck={true}
                className="w-full min-h-[120px] bg-slate-950/80 backdrop-blur-md border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl p-3.5 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder-slate-500 outline-none transition-all duration-200 resize-y shadow-inner leading-relaxed"
                aria-label="Video prompt input"
              />
              <div className="absolute bottom-3 right-3 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                <Wand2 className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Prompt Presets */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Instant Prompt Ideas & Templates:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p.prompt)}
                  className="text-left bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 p-3 rounded-xl transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-indigo-500/10"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 flex items-center justify-between">
                    <span>{p.title}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all text-indigo-400" />
                  </span>
                  <span className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                    {p.prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PART 5 — ATTACHMENT SECTION: MEDIA UPLOAD (Images, Video Clips, Screenshots) */}
        {(attachmentSection === 'media' || images.length > 0 || videoClips.length > 0 || screenshots.length > 0) && (
          <div className="space-y-4 bg-slate-950/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 transition-all shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" /> Attached Media Assets & Drag-and-Drop Workspace
              </span>
              <button
                type="button"
                onClick={() => setAttachmentSection('none')}
                className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Collapse
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Image Upload Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOverImages(true); }}
                onDragLeave={() => setIsDragOverImages(false)}
                onDrop={handleImageDrop}
                className={`border-2 border-dashed p-4 rounded-xl text-center flex flex-col items-center justify-center relative transition-all duration-200 bg-slate-900/60 ${
                  isDragOverImages
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                    : 'border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2.5">
                  <ImageIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-slate-200">Images / Photos</span>
                <span className="text-[10px] text-slate-500 mb-3">Drag & Drop or browse (JPG, PNG, WebP)</span>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse Images</span>
                </button>
              </div>

              {/* Video Clip Upload Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOverVideos(true); }}
                onDragLeave={() => setIsDragOverVideos(false)}
                onDrop={handleVideoDrop}
                className={`border-2 border-dashed p-4 rounded-xl text-center flex flex-col items-center justify-center relative transition-all duration-200 bg-slate-900/60 ${
                  isDragOverVideos
                    ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
                    : 'border-slate-800 hover:border-purple-500/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-2.5">
                  <Video className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs font-bold text-slate-200">Video Clips (B-Roll)</span>
                <span className="text-[10px] text-slate-500 mb-3">Drag & Drop or browse (MP4, WebM)</span>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse Video Clips</span>
                </button>
              </div>

              {/* Screenshot Upload Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOverScreenshots(true); }}
                onDragLeave={() => setIsDragOverScreenshots(false)}
                onDrop={handleScreenshotDrop}
                className={`border-2 border-dashed p-4 rounded-xl text-center flex flex-col items-center justify-center relative transition-all duration-200 bg-slate-900/60 ${
                  isDragOverScreenshots
                    ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                    : 'border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2.5">
                  <Film className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs font-bold text-slate-200">App / UI Screenshots</span>
                <span className="text-[10px] text-slate-500 mb-3">Drag & Drop or browse UI mockups</span>
                <button
                  type="button"
                  onClick={() => screenshotInputRef.current?.click()}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse Screenshots</span>
                </button>
              </div>
            </div>

            {/* Attached Thumbnails preview list */}
            {images.length === 0 && videoClips.length === 0 && screenshots.length === 0 ? (
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 py-2.5 px-3 bg-slate-900/40 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <span>No media attachments uploaded yet. Drag & drop or browse files above.</span>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 block mb-2.5">
                  Attached Assets ({images.length + videoClips.length + screenshots.length}):
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {images.map((img, i) => (
                    <div key={`img-${i}`} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-indigo-500/40 shadow-md bg-slate-900">
                      <img src={img} alt={`uploaded-${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-lg transform scale-90 hover:scale-100 transition-transform"
                          aria-label="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {videoClips.map((clip, i) => (
                    <div key={`vid-${i}`} className="bg-purple-950/60 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-purple-200 flex items-center gap-2 shadow-md">
                      <FileVideo className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="max-w-[120px] truncate font-medium">{clip}</span>
                      <button
                        type="button"
                        onClick={() => setVideoClips((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-rose-400 hover:text-rose-300 transition-colors ml-1 p-0.5 rounded-full hover:bg-rose-950/50"
                        aria-label="Remove video clip"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {screenshots.map((s, i) => (
                    <div key={`scr-${i}`} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-amber-500/40 shadow-md bg-slate-900">
                      <img src={s} alt={`screenshot-${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                          className="bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-lg transform scale-90 hover:scale-100 transition-transform"
                          aria-label="Remove screenshot"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PART 6 — PRODUCT URL SECTION */}
        {(attachmentSection === 'url' || productUrl) && (
          <div className="space-y-4 bg-slate-950/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 transition-all shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Link className="w-4 h-4 text-amber-400" /> Automated Product Link Metadata Extractor
              </span>
              <button
                type="button"
                onClick={() => setAttachmentSection('none')}
                className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Collapse
              </button>
            </div>

            <div>
              <label htmlFor="product-url-input" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Enter Product Link (Amazon, Shopify, Flipkart, Brand Page):</span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Auto Feature Extraction</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    id="product-url-input"
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://www.amazon.in/dp/B0CX234XYZ or https://yourstore.com/products/item"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                    aria-label="Product URL input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExtractProduct}
                  disabled={isExtractingProduct || !productUrl.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-md shadow-amber-500/10"
                  aria-label="Extract Product Metadata"
                >
                  {isExtractingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Extract Product</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error State */}
              {extractError && (
                <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{extractError}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setExtractError('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Success State: Redesigned Extracted Product Card */}
            {extractedProduct && (
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 shadow-xl flex flex-col gap-3 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    {extractedProduct.imageUrl ? (
                      <img
                        src={extractedProduct.imageUrl}
                        alt={extractedProduct.title}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-6 h-6 text-amber-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-amber-200 leading-snug">
                          {extractedProduct.title}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> In Stock
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1 flex-wrap">
                        {extractedProduct.vendor && (
                          <span className="font-semibold text-slate-300">{extractedProduct.vendor}</span>
                        )}
                        {extractedProduct.price && (
                          <span className="text-emerald-400 font-bold">{extractedProduct.price}</span>
                        )}
                        {extractedProduct.rating && (
                          <span className="text-amber-400 flex items-center gap-1 font-semibold">
                            <Star className="w-3 h-3 fill-current" /> {extractedProduct.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Verified Link
                    </span>
                    <button
                      type="button"
                      onClick={() => setExtractedProduct(null)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Clear product"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Feature Chips */}
                {extractedProduct.features && extractedProduct.features.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Extracted Features:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedProduct.features.slice(0, 4).map((feat, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-slate-950 text-slate-300 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PART 7 — SUBTITLE PANEL */}
        {(attachmentSection === 'subtitles' || subtitleEnabled) && (
          <div className="bg-slate-950/80 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <Captions className="w-4 h-4 text-purple-400" /> Auto Subtitle Customizer & Style Controls
              </span>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subtitleEnabled}
                  onChange={(e) => setSubtitleEnabled(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                />
                <span>Auto-Subtitles Enabled</span>
              </label>
            </div>

            {(subtitleEnabled || attachmentSection === 'subtitles') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  {/* 1. Subtitle Language Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-purple-400" /> Subtitle Lang:
                    </label>
                    <CustomDropdown
                      value={subtitleLanguage}
                      options={subtitleLanguageDropdownOptions}
                      onChange={(val) => setSubtitleLanguage(val)}
                      enableSearch
                      searchPlaceholder="Search subtitle lang..."
                    />
                  </div>

                  {/* 2. Subtitle Position */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-indigo-400" /> Position:
                    </label>
                    <CustomDropdown
                      value={subtitlePosition}
                      options={positionDropdownOptions}
                      onChange={(val) => setSubtitlePosition(val)}
                    />
                  </div>

                  {/* 3. Subtitle Font */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Type className="w-3 h-3 text-amber-400" /> Font Style:
                    </label>
                    <CustomDropdown
                      value={subtitleFont}
                      options={fontDropdownOptions}
                      onChange={(val) => setSubtitleFont(val)}
                    />
                  </div>

                  {/* 4. Subtitle Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-rose-400" /> Text Color:
                    </label>
                    <CustomDropdown
                      value={subtitleColor}
                      options={colorDropdownOptions}
                      onChange={(val) => setSubtitleColor(val)}
                      colorPreview={subtitleColor}
                    />
                  </div>

                  {/* 5. Subtitle Size */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Type className="w-3 h-3 text-emerald-400" /> Size:
                    </label>
                    <CustomDropdown
                      value={subtitleSize}
                      options={sizeDropdownOptions}
                      onChange={(val) => setSubtitleSize(val)}
                    />
                  </div>

                  {/* 6. Subtitle Animation */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> Animation:
                    </label>
                    <CustomDropdown
                      value={subtitleAnimation}
                      options={animationDropdownOptions}
                      onChange={(val) => setSubtitleAnimation(val)}
                    />
                  </div>
                </div>

                {/* Subtitle Live Interactive Preview Box */}
                <SubtitlePreviewBox
                  font={subtitleFont}
                  size={subtitleSize}
                  color={subtitleColor}
                  position={subtitlePosition}
                  animation={subtitleAnimation}
                  subtitleLanguage={subtitleLanguage}
                  voiceLanguage={language}
                  languagesList={languagesList}
                />
              </div>
            )}
          </div>
        )}

        {/* PART 8 — VOICE, DYNAMIC LANGUAGE & TONE SETTINGS PANEL */}
        <div className="bg-slate-950/70 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" /> AI Voiceover, Language & Tone Engine
            </span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-semibold">
              Provider: {voiceConfig?.activeVoiceProvider || 'VirJoy Native Synth'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Dynamic Voice Language Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-400" /> Voice Language:
              </label>
              <CustomDropdown
                value={language}
                options={languageDropdownOptions}
                onChange={(val) => setLanguage(val)}
                enableSearch
                searchPlaceholder="Search audio language..."
              />
            </div>

            {/* 2. Dynamic Voice Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Voice Profile:
              </label>
              <CustomDropdown
                value={voice}
                options={voiceDropdownOptions}
                onChange={(val) => setVoice(val)}
                enableSearch
                searchPlaceholder="Search voice profile..."
              />
            </div>

            {/* 3. Voice Tone & Style */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tone & Emotion:
              </label>
              <CustomDropdown
                value={voiceTone}
                options={toneDropdownOptions}
                onChange={(val) => setVoiceTone(val)}
              />
            </div>
          </div>
        </div>

        {/* PART 9 & PART 10 — DURATION & ASPECT RATIO CONFIGURATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
          {/* Duration Selector */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" /> Video Duration Options:
              </label>
              <span className="text-[11px] text-slate-400">
                Single Video Limit: <strong className="text-indigo-400">{planConfig.maxVideoDurationSeconds}s</strong> • Remaining Monthly: <strong className="text-amber-400">{remainingCredits} Credits</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {durationList.map((opt) => {
                const sec = opt.seconds;
                const requiredCredits = sec;
                const isSingleVideoAllowed = sec <= planConfig.maxVideoDurationSeconds;
                const isMonthlyCreditsSufficient = requiredCredits <= remainingCredits;
                const isLocked = !isSingleVideoAllowed || !isMonthlyCreditsSufficient;

                let lockReason = '';
                if (!isSingleVideoAllowed) {
                  lockReason = `Requires plan with ${sec}s (${requiredCredits} Credits) video limit. Your plan cap is ${planConfig.maxVideoDurationSeconds}s.`;
                } else if (!isMonthlyCreditsSufficient) {
                  lockReason = `This ${sec}s video requires ${requiredCredits} Credits, but you have ${remainingCredits} Credits left on your ${planConfig.name}. Upgrade plan for more credits!`;
                }

                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;
                      if (isLocked) {
                        onOpenPricing(lockReason);
                      } else {
                        setDuration(sec);
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all duration-200 border flex flex-col items-center justify-center gap-1 cursor-pointer relative ${
                      duration === sec && !isLocked
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                        : isLocked
                        ? 'bg-slate-950/60 text-slate-500 border-slate-800/80 hover:border-amber-500/50'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-indigo-500/70 hover:text-white'
                    }`}
                    aria-label={`Select ${opt.label} duration`}
                  >
                    <div className="flex items-center gap-1">
                      {isLocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                      <span>{opt.label}</span>
                    </div>

                    <span className={`text-[9px] font-bold ${isLocked ? 'text-amber-400 uppercase tracking-tighter' : 'text-slate-400'}`}>
                      {isLocked ? 'Upgrade Required' : `${sec} Credits`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-indigo-400" /> Format / Aspect Ratio:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* 16:9 YouTube */}
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                aria-label="16:9 YouTube Format"
              >
                <div className="w-6 h-3.5 border-2 border-current rounded-xs" />
                <span className="text-[10px]">16:9 YT</span>
              </button>

              {/* 9:16 Reel */}
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                aria-label="9:16 Reels Format"
              >
                <div className="w-3.5 h-6 border-2 border-current rounded-xs" />
                <span className="text-[10px]">9:16 Reel</span>
              </button>

              {/* 1:1 Square */}
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  aspectRatio === '1:1'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                aria-label="1:1 Square Format"
              >
                <div className="w-4.5 h-4.5 border-2 border-current rounded-xs" />
                <span className="text-[10px]">1:1 Square</span>
              </button>
            </div>
          </div>
        </div>

        {/* PART 11 — PRIMARY GENERATE CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 disabled:opacity-50 text-white font-extrabold py-4 px-6 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/25 transition-all duration-200 transform active:scale-[0.99] cursor-pointer tracking-wide"
            aria-label="Generate AI Video"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin text-amber-200" />
                <span>VirJoy AI is Synthesizing Video Scenes & Voiceover...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-amber-200 animate-pulse" />
                <span>
                  Generate AI Video ({duration}s • {languagesList.find((l) => l.id === language)?.name || 'English'} • {voiceTone} Tone)
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
