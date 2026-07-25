import React, { useState } from 'react';
import { AppConfig, PlanKey, ProductMetadata, UserStats, VideoProjectInputs } from '../types';
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
  Lock
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

export const MultiModalInput: React.FC<MultiModalInputProps> = ({
  config,
  userStats,
  currentPlan,
  isGenerating,
  onGenerate,
  onOpenPricing
}) => {
  const planConfig = config.plans[currentPlan] || config.plans.Free;
  const voiceConfig = config.voiceConfig;

  // Remaining monthly duration credits
  const usedMonthly = userStats.usedMonthlyDurationSeconds || 0;
  const maxMonthly = planConfig.maxMonthlyDurationSeconds || 30;
  const remainingMonthly = Math.max(0, maxMonthly - usedMonthly);

  // Prompt state
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(15);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  // Voice, Tone & Language selection
  const [language, setLanguage] = useState<string>('en-US');
  const [voice, setVoice] = useState<string>('female-ananya');
  const [voiceTone, setVoiceTone] = useState<string>('Energetic');

  // Input tab / attachments
  const [activeTab, setActiveTab] = useState<'text' | 'media' | 'url'>('text');
  const [images, setImages] = useState<string[]>([]);
  const [videoClips, setVideoClips] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  // Product URL state
  const [productUrl, setProductUrl] = useState('');
  const [isExtractingProduct, setIsExtractingProduct] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<ProductMetadata | null>(null);
  const [extractError, setExtractError] = useState('');

  // Handle URL product extraction
  const handleExtractProduct = async () => {
    if (!productUrl.trim()) return;
    setIsExtractingProduct(true);
    setExtractError('');

    try {
      const res = await fetch('/api/product/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl })
      });
      const data = await res.json();
      if (data.success && data.productInfo) {
        setExtractedProduct(data.productInfo);
        if (!prompt) {
          setPrompt(`Create a promotional product ad for ${data.productInfo.title} by ${data.productInfo.vendor || 'store'}. Highlight price (${data.productInfo.price}) and features: ${data.productInfo.features?.slice(0, 3).join(', ')}.`);
        }
      } else {
        setExtractError(data.error || 'Failed to extract product metadata');
      }
    } catch (e: any) {
      setExtractError(e?.message || 'Network error extracting product URL');
    } finally {
      setIsExtractingProduct(false);
    }
  };

  // Upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setScreenshots(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      setVideoClips(prev => [...prev, file.name]);
    });
  };

  // Trigger video generation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        targetDurationSeconds: duration
      }
    });
  };

  // Configurable durations: 10s up to 3 mins (180s)
  const durationList = voiceConfig?.durationOptions || [
    { seconds: 10, label: '10s', minPlan: 'Free' as PlanKey },
    { seconds: 15, label: '15s', minPlan: 'Free' as PlanKey },
    { seconds: 30, label: '30s', minPlan: 'Free' as PlanKey },
    { seconds: 60, label: '60s (1m)', minPlan: '₹199' as PlanKey },
    { seconds: 90, label: '90s (1.5m)', minPlan: '₹399' as PlanKey },
    { seconds: 120, label: '2 mins', minPlan: '₹399' as PlanKey },
    { seconds: 180, label: '3 mins', minPlan: '₹799' as PlanKey }
  ];

  return (
    <div className="bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden transition-colors">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Studio Title & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 dark:text-white light:text-slate-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-400" />
            Prompt-Driven AI Video Studio
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-0.5">
            Provide text prompts, images, video clips, screenshots, or product URLs to create custom videos.
          </p>
        </div>

        {/* Input Format Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 dark:bg-slate-950 light:bg-slate-100 p-1 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Prompt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Media ({images.length + videoClips.length + screenshots.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" /> Product URL
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* TAB 1: TEXT PROMPT & PRESETS */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Describe the Video You Want VirJoy AI to Create:</span>
                <span className="text-[11px] text-slate-500 font-normal">Supports multi-sentence prompts</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g., A dynamic 30-second ad for wireless earbuds. Start with a dramatic subway noise hook, show sleek earbud design, highlight 30hr battery life in Hindi voiceover, end with 20% off CTA."
                className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder-slate-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 block mb-2">Prompt Ideas & Templates:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p.prompt)}
                    className="text-left bg-slate-950 dark:bg-slate-950 light:bg-slate-50 hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:border-indigo-500/40 p-2.5 rounded-xl transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-indigo-400 block">
                      {p.title}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 line-clamp-2 mt-1">
                      {p.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-MEDIA ATTACHMENTS */}
        {activeTab === 'media' && (
          <div className="space-y-4 bg-slate-950 dark:bg-slate-950 light:bg-slate-50 p-4 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Image Upload */}
              <div className="border border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-indigo-500/50 p-4 rounded-xl text-center flex flex-col items-center justify-center relative bg-slate-900/50 dark:bg-slate-900/50 light:bg-white">
                <ImageIcon className="w-6 h-6 text-indigo-400 mb-2" />
                <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">Images / Assets</span>
                <span className="text-[10px] text-slate-500 mb-3">JPG, PNG, WebP</span>
                <label className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/30 cursor-pointer">
                  Browse Images
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              {/* Video Clip Upload */}
              <div className="border border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-indigo-500/50 p-4 rounded-xl text-center flex flex-col items-center justify-center relative bg-slate-900/50 dark:bg-slate-900/50 light:bg-white">
                <Video className="w-6 h-6 text-purple-400 mb-2" />
                <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">Video Clips</span>
                <span className="text-[10px] text-slate-500 mb-3">MP4, WebM (B-Roll)</span>
                <label className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 dark:text-purple-300 light:text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-500/30 cursor-pointer">
                  Browse Video Clips
                  <input type="file" multiple accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              </div>

              {/* Screenshot Upload */}
              <div className="border border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-indigo-500/50 p-4 rounded-xl text-center flex flex-col items-center justify-center relative bg-slate-900/50 dark:bg-slate-900/50 light:bg-white">
                <Film className="w-6 h-6 text-amber-400 mb-2" />
                <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">Screenshots</span>
                <span className="text-[10px] text-slate-500 mb-3">UI / App Screenshots</span>
                <label className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 dark:text-amber-300 light:text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 cursor-pointer">
                  Browse Screenshots
                  <input type="file" multiple accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Attached Thumbnails list */}
            {(images.length > 0 || videoClips.length > 0 || screenshots.length > 0) && (
              <div className="pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                <span className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 block mb-2">
                  Attached Media Assets ({images.length + videoClips.length + screenshots.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div key={`img-${i}`} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-indigo-500/40">
                      <img src={img} alt="upload" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 bg-slate-950/80 text-rose-400 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {videoClips.map((clip, i) => (
                    <div key={`vid-${i}`} className="bg-purple-950/60 dark:bg-purple-950/60 light:bg-purple-100 border border-purple-500/40 rounded-lg p-2 text-[10px] text-purple-200 dark:text-purple-200 light:text-purple-800 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-purple-400" />
                      <span className="max-w-[100px] truncate">{clip}</span>
                      <button
                        type="button"
                        onClick={() => setVideoClips(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-rose-400 hover:text-rose-300 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {screenshots.map((s, i) => (
                    <div key={`scr-${i}`} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-amber-500/40">
                      <img src={s} alt="screenshot" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 bg-slate-950/80 text-rose-400 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCT URL EXTRACTION */}
        {activeTab === 'url' && (
          <div className="space-y-4 bg-slate-950 dark:bg-slate-950 light:bg-slate-50 p-4 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Enter Product Link (e.g. Amazon, Shopify, Brand Page):</span>
                <span className="text-[10px] text-amber-400 font-medium">Safe Extraction Engine</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://www.amazon.in/dp/B0CX234XYZ or https://store.com/product"
                  className="flex-1 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleExtractProduct}
                  disabled={isExtractingProduct || !productUrl.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isExtractingProduct ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="w-4 h-4" />
                  )}
                  <span>{isExtractingProduct ? 'Extracting...' : 'Extract Product'}</span>
                </button>
              </div>
              {extractError && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {extractError}
                </p>
              )}
            </div>

            {/* Extracted Product Preview Badge */}
            {extractedProduct && (
              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-300 dark:text-amber-300 light:text-amber-700 block">{extractedProduct.title}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                      <span>{extractedProduct.vendor}</span> •{' '}
                      <span className="text-emerald-400 font-semibold">{extractedProduct.price}</span> •{' '}
                      <span className="text-amber-400">{extractedProduct.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                  <Check className="w-3 h-3" /> Ready for Product Video
                </div>
              </div>
            )}
          </div>
        )}

        {/* VOICE, LANGUAGE & TONE SETTINGS PANEL */}
        <div className="bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-indigo-400" /> AI Voiceover, Language & Tone Controls
            </span>
            <span className="text-[10px] text-indigo-400 dark:text-indigo-400 light:text-indigo-600 font-medium">
              Provider: {voiceConfig?.activeVoiceProvider || 'VirJoy Native Synth'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Language Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-400" /> Audio & Subtitle Language:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 outline-none focus:border-indigo-500"
              >
                {(voiceConfig?.supportedLanguages || []).map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag ? `${lang.flag} ` : ''}{lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Voice Selection (Male / Female / Neutral) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-purple-400" /> Voice Profile:
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 outline-none focus:border-indigo-500"
              >
                {(voiceConfig?.supportedVoices || []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.gender === 'male' ? '👨 Male' : v.gender === 'female' ? '👩 Female' : '🎙️ Neutral'} — {v.name} ({v.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Voice Tone & Style */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Tone & Emotion:
              </label>
              <select
                value={voiceTone}
                onChange={(e) => setVoiceTone(e.target.value)}
                className="w-full bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 outline-none focus:border-indigo-500"
              >
                {(voiceConfig?.supportedTones || ['Natural', 'Professional', 'Energetic', 'Calm']).map((toneOption) => (
                  <option key={toneOption} value={toneOption}>
                    ✨ {toneOption}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* DURATION & FORMAT CONFIGURATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
          {/* Duration Selector (10s to 3 mins / 180s) */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Video Duration Options:
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
                Single Video Limit: <strong className="text-indigo-400">{planConfig.maxVideoDurationSeconds}s</strong> • Remaining Monthly: <strong className="text-amber-400">{remainingMonthly}s</strong>
              </span>
            </label>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {durationList.map((opt) => {
                const sec = opt.seconds;
                // Check if this duration is permitted by current plan single-video limit AND remaining monthly duration
                const isSingleVideoAllowed = sec <= planConfig.maxVideoDurationSeconds;
                const isMonthlyCreditsSufficient = sec <= remainingMonthly;
                const isLocked = !isSingleVideoAllowed || !isMonthlyCreditsSufficient;

                let lockReason = '';
                if (!isSingleVideoAllowed) {
                  lockReason = `Requires plan with ${sec}s video limit. Current plan max is ${planConfig.maxVideoDurationSeconds}s.`;
                } else if (!isMonthlyCreditsSufficient) {
                  lockReason = `Exceeds your remaining monthly duration (${remainingMonthly}s remaining). Upgrade plan for more credits.`;
                }

                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        onOpenPricing(lockReason);
                      } else {
                        setDuration(sec);
                      }
                    }}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer relative ${
                      duration === sec && !isLocked
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : isLocked
                        ? 'bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 text-slate-500 dark:text-slate-500 light:text-slate-400 border-slate-800/80 dark:border-slate-800/80 light:border-slate-300 hover:border-amber-500/50'
                        : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-300 dark:text-slate-300 light:text-slate-800 border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-indigo-500'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {isLocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                      <span>{opt.label}</span>
                    </div>
                    {isLocked && (
                      <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-tight">
                        Unlock
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-2 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-indigo-400" /> Aspect Ratio / Format:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 dark:text-white light:text-indigo-900 shadow-md'
                    : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-5 h-3 border border-current rounded-sm" />
                <span className="text-[10px]">16:9 YT</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 dark:text-white light:text-indigo-900 shadow-md'
                    : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-3 h-5 border border-current rounded-sm" />
                <span className="text-[10px]">9:16 Reel</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  aspectRatio === '1:1'
                    ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 dark:text-white light:text-indigo-900 shadow-md'
                    : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-3.5 h-3.5 border border-current rounded-sm" />
                <span className="text-[10px]">1:1 Square</span>
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY SUBMIT CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-[0.99] cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>VirJoy AI is Synthesizing Video Scenes & Voiceover...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-amber-200" />
                <span>
                  Generate AI Video ({duration}s • {voiceConfig?.supportedLanguages?.find(l => l.id === language)?.name || 'English'} • {voiceTone} Tone)
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

