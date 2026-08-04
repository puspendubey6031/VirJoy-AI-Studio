import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Wand2,
  Sparkles,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Globe,
  Upload,
  X,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Coins,
  ShieldAlert,
  ArrowRight,
  Zap,
  Tag,
  ShieldCheck,
  FileText,
  Paintbrush
} from 'lucide-react';
import { PlanKey, UserStats, AppConfig, DesignHistoryItem } from '../types';
import { CustomDropdown, DropdownOption } from './CustomDropdown';
import { useSubscription } from '../hooks/useSubscription';
import { useGlobalJob } from '../context/GlobalJobContext';

export type DesignToolType = 'image' | 'logo' | 'poster' | 'banner' | 'thumbnail';

export interface DesignStudioFormProps {
  userStats: UserStats;
  currentPlan: PlanKey;
  config?: AppConfig;
  onUpdateUserStats?: (updatedStats: UserStats) => void;
  onOpenPricing?: (msg?: string) => void;
  onCheckProtectedAccess?: () => boolean;
}

// Common Field Options
const LANGUAGES = ['English', 'Bengali', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Auto Detect'];

const STYLES = [
  'Modern',
  'Minimal',
  'Professional',
  'Luxury',
  'Cartoon',
  '3D',
  'Flat',
  'Realistic',
  'Cinematic'
];

const COLOR_THEMES = [
  'Auto',
  'Blue',
  'Red',
  'Green',
  'Black',
  'White',
  'Gold',
  'Purple',
  'Orange',
  'Multi Color'
];

const BACKGROUNDS = ['Transparent', 'White', 'Black', 'Gradient', 'Custom Color'];

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:5', '3:2'] as const;

// Logo Generator Options
const LOGO_TYPES = ['Text Logo', 'Icon Logo', 'Text + Icon'];
const ICON_STYLES = ['Minimalist', 'Geometric', 'Abstract', 'Vintage', 'Mascot', 'Line Art', 'Modern Badge', 'Emblem'];
const FONT_STYLES = ['Modern Sans-Serif', 'Elegant Serif', 'Bold Display', 'Creative Script', 'Futuristic Monospace', 'Gothic Vintage'];
const LOGO_SHAPES = ['Circle Badge', 'Shield', 'Geometric Hexagon', 'Minimalist Square', 'Freeform Vector', 'Crest Emblem'];

// Poster Options
const POSTER_SIZES = ['A4 Standard (210x297mm)', 'A3 Event Poster', 'Digital Poster (1080x1350)', 'Concert Poster (18x24in)', 'Large Billboard'];
const POSTER_THEMES = ['Tech Conference', 'Music Concert', 'Movie Premiere', 'Corporate Event', 'Product Launch', 'Fashion Show', 'Art Exhibition', 'Sports Tournament', 'Custom Event'];
const POSTER_STYLES = ['Modern Minimalist', 'Vintage Retro', 'Neon Cyberpunk', 'Typographic Bold', 'Abstract Art', 'Luxury Elegant'];

// Banner Options
const BANNER_PLATFORMS = ['Website', 'Facebook', 'LinkedIn', 'YouTube', 'Instagram', 'X', 'Custom'];
const BANNER_SIZES = ['Website Hero (1920x1080)', 'YouTube Cover (2560x1440)', 'Facebook Header (820x312)', 'LinkedIn Banner (1584x396)', 'X Header (1500x500)', 'Instagram Banner (1080x1080)', 'Custom Banner (1200x630)'];

// Thumbnail Options
const THUMBNAIL_PLATFORMS = ['YouTube', 'Facebook', 'Instagram'];
const THUMBNAIL_STYLES = ['Gaming', 'Clickbait', 'Professional', 'Educational', 'Tech', 'News'];
const THUMBNAIL_BORDERS = ['None', 'High Contrast Yellow', 'Neon Blue', 'Glowing White', 'Red Accent'];
const THUMBNAIL_SHADOWS = ['None', 'Soft Shadow', 'Heavy Drop Shadow', 'Glow Effect'];
const THUMBNAIL_FACE_FOCUS = ['Expressive Face Closeup', 'Medium Subject Focus', 'No Face (Product Focus)'];

// Image Generator Options
const IMAGE_TYPES = ['Photo', 'Illustration', '3D', 'Digital Art', 'Anime', 'Realistic'];
const LIGHTING_OPTIONS = ['Studio Light', 'Cinematic Golden Hour', 'Dramatic Cyberpunk Neon', 'Natural Daylight', 'Soft Ambient', 'Volumetric Raytracing'];
const CAMERA_ANGLES = ['Eye Level', 'Wide Angle', 'Close-Up Macro', 'Low Angle Hero', 'Aerial Drone Shot', 'Bokeh Portrait'];
const BG_TYPES = ['Blurred Bokeh', 'Studio Minimal', 'Urban Street', 'Futuristic Space', 'Nature Landscape', 'Solid Studio Color'];
const IMAGE_QUALITIES = ['Standard (HD)', 'High Quality (4K)', 'Ultra High Quality (8K)'];

export const DesignStudioForm: React.FC<DesignStudioFormProps> = ({
  userStats,
  currentPlan,
  config,
  onUpdateUserStats,
  onOpenPricing,
  onCheckProtectedAccess
}) => {
  const [studioSubTab, setStudioSubTab] = useState<'creator' | 'history'>('creator');
  const [activeTool, setActiveTool] = useState<DesignToolType>('image');

  // Dynamic Credit Costs from Config Store
  const costs = useMemo(() => {
    return config?.designStudioConfig?.costs || {
      image: 3,
      thumbnail: 3,
      poster: 5,
      logo: 5,
      banner: 5
    };
  }, [config]);

  const activeToolCost = useMemo(() => {
    return costs[activeTool] || (activeTool === 'poster' || activeTool === 'logo' || activeTool === 'banner' ? 5 : 3);
  }, [costs, activeTool]);

  // Available Credits Calculation
  const availableCredits = useMemo(() => {
    if (typeof userStats.remainingCredits === 'number') {
      return userStats.remainingCredits;
    }
    const maxMonthly = userStats.monthlyCredits || 30;
    return Math.max(0, maxMonthly - (userStats.usedCredits || 0));
  }, [userStats]);

  const hasEnoughCredits = availableCredits >= activeToolCost;

  // Common Fields State
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('Modern');
  const [colorTheme, setColorTheme] = useState('Auto');
  const [background, setBackground] = useState('White');
  const [customBgColor, setCustomBgColor] = useState('#1E293B');
  const [aspectRatio, setAspectRatio] = useState<typeof ASPECT_RATIOS[number]>('1:1');

  // Logo Generator Extra Fields State
  const [logoType, setLogoType] = useState('Text + Icon');
  const [logoBrandName, setLogoBrandName] = useState('VirJoy AI');
  const [logoTransparentBg, setLogoTransparentBg] = useState(true);
  const [logoIconStyle, setLogoIconStyle] = useState('Minimalist');
  const [logoFontStyle, setLogoFontStyle] = useState('Modern Sans-Serif');
  const [logoShape, setLogoShape] = useState('Circle Badge');
  const [logoPrimaryColor, setLogoPrimaryColor] = useState('#6366F1');
  const [logoSecondaryColor, setLogoSecondaryColor] = useState('#F59E0B');

  // Poster Generator Extra Fields State
  const [posterSize, setPosterSize] = useState('Digital Poster (1080x1350)');
  const [posterEventType, setPosterEventType] = useState('Tech Conference');
  const [posterStyle, setPosterStyle] = useState('Modern Minimalist');
  const [posterMainHeading, setPosterMainHeading] = useState('AI INNOVATION SUMMIT');
  const [posterSubHeading, setPosterSubHeading] = useState('Building the Future of Digital Creation');
  const [posterCtaText, setPosterCtaText] = useState('REGISTER NOW - LIMITED SEATS');
  const [posterThemeColor, setPosterThemeColor] = useState('#8B5CF6');
  const [posterSecondaryColor, setPosterSecondaryColor] = useState('#EC4899');
  const [posterBgImageDesc, setPosterBgImageDesc] = useState('Futuristic cybernetic background with glowing particle network');
  const [posterLogoFile, setPosterLogoFile] = useState<string | null>(null);

  // Banner Generator Extra Fields State
  const [bannerPlatform, setBannerPlatform] = useState('Website');
  const [bannerSize, setBannerSize] = useState('Website Hero (1920x1080)');
  const [bannerBrandName, setBannerBrandName] = useState('VirJoy Studio');
  const [bannerPrimaryColor, setBannerPrimaryColor] = useState('#3B82F6');
  const [bannerSecondaryColor, setBannerSecondaryColor] = useState('#10B981');
  const [bannerButtonText, setBannerButtonText] = useState('Explore Platform');
  const [bannerBrandLogo, setBannerBrandLogo] = useState<string | null>(null);

  // Thumbnail Generator Extra Fields State
  const [thumbPlatform, setThumbPlatform] = useState('YouTube');
  const [thumbStyle, setThumbStyle] = useState('Tech');
  const [thumbFaceFocus, setThumbFaceFocus] = useState('Expressive Face Closeup');
  const [thumbBigText, setThumbBigText] = useState('100X YOUR PRODUCTIVITY');
  const [thumbSmallText, setThumbSmallText] = useState('Secret AI Tools Revealed');
  const [thumbBorder, setThumbBorder] = useState('High Contrast Yellow');
  const [thumbShadow, setThumbShadow] = useState('Heavy Drop Shadow');

  // Image Generator Extra Fields State
  const [imageType, setImageType] = useState('3D');
  const [imageLighting, setImageLighting] = useState('Cinematic Golden Hour');
  const [imageCameraAngle, setImageCameraAngle] = useState('Wide Angle');
  const [imageBgType, setImageBgType] = useState('Futuristic Space');
  const [imageQuality, setImageQuality] = useState('High Quality (4K)');
  const [imageNegativePrompt, setImageNegativePrompt] = useState('blurry, low quality, distorted anatomy, text overlay, extra limbs');
  const [imageSeed, setImageSeed] = useState('');

  // Output & Processing State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressStageText, setProgressStageText] = useState('Initializing...');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lastGeneratedItem, setLastGeneratedItem] = useState<DesignHistoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);

  // Design History
  const [historyItems, setHistoryItems] = useState<DesignHistoryItem[]>(userStats.designHistory || []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/design-studio/history');
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setHistoryItems(data.history);
      }
    } catch (e) {
      if (userStats.designHistory) setHistoryItems(userStats.designHistory);
    }
  }, [userStats.designHistory]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // UNIFIED DROPDOWN OPTIONS LISTS (Memoized)
  const languageOptions: DropdownOption[] = useMemo(() => LANGUAGES.map(l => ({ id: l, label: l })), []);
  const styleOptions: DropdownOption[] = useMemo(() => STYLES.map(s => ({ id: s, label: s })), []);
  const colorThemeOptions: DropdownOption[] = useMemo(() => COLOR_THEMES.map(c => ({ id: c, label: c })), []);
  const backgroundOptions: DropdownOption[] = useMemo(() => BACKGROUNDS.map(b => ({ id: b, label: b })), []);
  const aspectRatioOptions: DropdownOption[] = useMemo(() => ASPECT_RATIOS.map(a => ({ id: a, label: a })), []);

  // Image Tool Options
  const imageTypeOptions: DropdownOption[] = useMemo(() => IMAGE_TYPES.map(t => ({ id: t, label: t })), []);
  const lightingOptions: DropdownOption[] = useMemo(() => LIGHTING_OPTIONS.map(l => ({ id: l, label: l })), []);
  const cameraAngleOptions: DropdownOption[] = useMemo(() => CAMERA_ANGLES.map(c => ({ id: c, label: c })), []);
  const bgTypeOptions: DropdownOption[] = useMemo(() => BG_TYPES.map(b => ({ id: b, label: b })), []);
  const imageQualityOptions: DropdownOption[] = useMemo(() => IMAGE_QUALITIES.map(q => ({ id: q, label: q })), []);

  // Logo Tool Options
  const logoTypeOptions: DropdownOption[] = useMemo(() => LOGO_TYPES.map(t => ({ id: t, label: t })), []);
  const iconStyleOptions: DropdownOption[] = useMemo(() => ICON_STYLES.map(s => ({ id: s, label: s })), []);
  const fontStyleOptions: DropdownOption[] = useMemo(() => FONT_STYLES.map(f => ({ id: f, label: f })), []);
  const logoShapeOptions: DropdownOption[] = useMemo(() => LOGO_SHAPES.map(s => ({ id: s, label: s })), []);

  // Poster Tool Options
  const posterSizeOptions: DropdownOption[] = useMemo(() => POSTER_SIZES.map(s => ({ id: s, label: s })), []);
  const posterThemeOptions: DropdownOption[] = useMemo(() => POSTER_THEMES.map(t => ({ id: t, label: t })), []);
  const posterStyleOptions: DropdownOption[] = useMemo(() => POSTER_STYLES.map(s => ({ id: s, label: s })), []);

  // Banner Tool Options
  const bannerPlatformOptions: DropdownOption[] = useMemo(() => BANNER_PLATFORMS.map(p => ({ id: p, label: p })), []);
  const bannerSizeOptions: DropdownOption[] = useMemo(() => BANNER_SIZES.map(s => ({ id: s, label: s })), []);

  // Thumbnail Tool Options
  const thumbPlatformOptions: DropdownOption[] = useMemo(() => THUMBNAIL_PLATFORMS.map(p => ({ id: p, label: p })), []);
  const thumbStyleOptions: DropdownOption[] = useMemo(() => THUMBNAIL_STYLES.map(s => ({ id: s, label: s })), []);
  const thumbFaceFocusOptions: DropdownOption[] = useMemo(() => THUMBNAIL_FACE_FOCUS.map(f => ({ id: f, label: f })), []);
  const thumbBorderOptions: DropdownOption[] = useMemo(() => THUMBNAIL_BORDERS.map(b => ({ id: b, label: b })), []);
  const thumbShadowOptions: DropdownOption[] = useMemo(() => THUMBNAIL_SHADOWS.map(s => ({ id: s, label: s })), []);

  // AUTOMATIC PROMPT COMPILER
  // Every selected option from every tool automatically becomes part of the final AI prompt
  const compiledPrompt = useMemo(() => {
    const parts: string[] = [];

    // Base Prompt
    if (prompt.trim()) {
      parts.push(prompt.trim());
    } else {
      parts.push(`Create a professional ${activeTool.toUpperCase()} design`);
    }

    // Tool Specific Extra Fields
    if (activeTool === 'image') {
      parts.push(`Render Type: ${imageType}`);
      parts.push(`Lighting Setup: ${imageLighting}`);
      parts.push(`Camera Perspective: ${imageCameraAngle}`);
      parts.push(`Background Atmosphere: ${imageBgType}`);
      parts.push(`Image Quality: ${imageQuality}`);
      if (imageNegativePrompt.trim()) {
        parts.push(`Negative Prompt (Avoid): ${imageNegativePrompt.trim()}`);
      }
      if (imageSeed.trim()) {
        parts.push(`Seed: ${imageSeed.trim()}`);
      }
    } else if (activeTool === 'logo') {
      parts.push(`Logo Type: ${logoType}`);
      if (logoBrandName.trim()) parts.push(`Brand Name Text: "${logoBrandName.trim()}"`);
      parts.push(`Icon Style: ${logoIconStyle}`);
      parts.push(`Font Style: ${logoFontStyle}`);
      parts.push(`Logo Shape Geometry: ${logoShape}`);
      if (logoPrimaryColor) parts.push(`Primary Color: ${logoPrimaryColor}`);
      if (logoSecondaryColor) parts.push(`Secondary Color: ${logoSecondaryColor}`);
      if (logoTransparentBg) parts.push('Transparent Background: Yes (isolated vector feel)');
    } else if (activeTool === 'poster') {
      parts.push(`Poster Size Format: ${posterSize}`);
      parts.push(`Poster Visual Style: ${posterStyle}`);
      if (posterEventType) parts.push(`Event Category/Theme: ${posterEventType}`);
      if (posterMainHeading.trim()) parts.push(`Main Heading Text: "${posterMainHeading.trim()}"`);
      if (posterSubHeading.trim()) parts.push(`Sub Heading Text: "${posterSubHeading.trim()}"`);
      if (posterCtaText.trim()) parts.push(`CTA Button Text: "${posterCtaText.trim()}"`);
      if (posterThemeColor) parts.push(`Primary Theme Color: ${posterThemeColor}`);
      if (posterSecondaryColor) parts.push(`Secondary Accent Color: ${posterSecondaryColor}`);
      if (posterBgImageDesc.trim()) parts.push(`Background Concept: ${posterBgImageDesc.trim()}`);
    } else if (activeTool === 'banner') {
      parts.push(`Platform Target: ${bannerPlatform}`);
      parts.push(`Banner Dimensions: ${bannerSize}`);
      if (bannerBrandName.trim()) parts.push(`Brand Name: "${bannerBrandName.trim()}"`);
      if (bannerPrimaryColor) parts.push(`Primary Brand Color: ${bannerPrimaryColor}`);
      if (bannerSecondaryColor) parts.push(`Secondary Accent Color: ${bannerSecondaryColor}`);
      if (bannerButtonText.trim()) parts.push(`Action Button CTA: "${bannerButtonText.trim()}"`);
    } else if (activeTool === 'thumbnail') {
      parts.push(`Platform Target: ${thumbPlatform}`);
      parts.push(`Thumbnail Niche Style: ${thumbStyle}`);
      parts.push(`Subject Focus: ${thumbFaceFocus}`);
      if (thumbBigText.trim()) parts.push(`High Impact Big Overlay Text: "${thumbBigText.trim()}"`);
      if (thumbSmallText.trim()) parts.push(`Sub Text Caption: "${thumbSmallText.trim()}"`);
      if (thumbBorder !== 'None') parts.push(`Outline Border: ${thumbBorder}`);
      if (thumbShadow !== 'None') parts.push(`Text Shadow Effect: ${thumbShadow}`);
    }

    // Common Fields
    if (language && language !== 'Auto Detect') {
      parts.push(`Language context: ${language}`);
    }
    if (style) {
      parts.push(`Visual Style: ${style}`);
    }
    if (colorTheme && colorTheme !== 'Auto') {
      parts.push(`Color Palette Theme: ${colorTheme}`);
    }
    if (background) {
      if (background === 'Custom Color') {
        parts.push(`Background Finish: Custom Solid Color (${customBgColor})`);
      } else {
        parts.push(`Background Finish: ${background}`);
      }
    }
    if (aspectRatio) {
      parts.push(`Aspect Ratio: ${aspectRatio}`);
    }

    return parts.join(', ');
  }, [
    activeTool,
    prompt,
    imageType,
    imageLighting,
    imageCameraAngle,
    imageBgType,
    imageQuality,
    imageNegativePrompt,
    imageSeed,
    logoType,
    logoBrandName,
    logoIconStyle,
    logoFontStyle,
    logoShape,
    logoPrimaryColor,
    logoSecondaryColor,
    logoTransparentBg,
    posterSize,
    posterStyle,
    posterEventType,
    posterMainHeading,
    posterSubHeading,
    posterCtaText,
    posterThemeColor,
    posterSecondaryColor,
    posterBgImageDesc,
    bannerPlatform,
    bannerSize,
    bannerBrandName,
    bannerPrimaryColor,
    bannerSecondaryColor,
    bannerButtonText,
    thumbPlatform,
    thumbStyle,
    thumbFaceFocus,
    thumbBigText,
    thumbSmallText,
    thumbBorder,
    thumbShadow,
    language,
    style,
    colorTheme,
    background,
    customBgColor,
    aspectRatio
  ]);

  // Handle Logo Upload Callback
  const handleLogoFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, target: 'poster' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === 'poster') setPosterLogoFile(event.target?.result as string);
      else setBannerBrandLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { canGenerate } = useSubscription(config, userStats);
  const { submitAIJob } = useGlobalJob();

  // Submit Handler -> Sends request to backend with Universal Global AI Processing pipeline
  const handleGenerateDesign = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (onCheckProtectedAccess && !onCheckProtectedAccess()) return;

    // Check dynamic subscription lock and credit requirements
    const canGenCheck = canGenerate(activeTool, activeToolCost);
    if (!canGenCheck.allowed) {
      if (onOpenPricing) {
        onOpenPricing(canGenCheck.reason || `Generating ${activeTool.toUpperCase()} requires a plan upgrade.`);
      } else {
        setErrorMsg(canGenCheck.reason || `Upgrade plan to unlock ${activeTool.toUpperCase()} generator.`);
      }
      return;
    }

    if (!hasEnoughCredits) {
      if (onOpenPricing) {
        onOpenPricing(`Generating an ${activeTool.toUpperCase()} requires ${activeToolCost} Credits, but you only have ${availableCredits} Available Credits. Please upgrade your plan!`);
      }
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      toolType: activeTool,
      prompt,
      compiledPrompt,
      aspectRatio,
      style,
      language,
      colorTheme,
      background,
      customBgColor,

      // Image Generator Payload
      imageType,
      imageLighting,
      imageCameraAngle,
      imageBgType,
      imageQuality,
      imageNegativePrompt,
      imageSeed,

      // Logo Generator Payload
      logoType,
      logoBrandName,
      logoIconStyle,
      logoFontStyle,
      logoShape,
      logoPrimaryColor,
      logoSecondaryColor,
      logoTransparentBg,

      // Poster Generator Payload
      posterSize,
      posterStyle,
      eventType: posterEventType,
      mainHeading: posterMainHeading,
      subHeading: posterSubHeading,
      ctaText: posterCtaText,
      posterThemeColor,
      posterSecondaryColor,
      posterBgImageDesc,

      // Banner Generator Payload
      platform: bannerPlatform,
      bannerSize,
      bannerBrandName,
      bannerButtonText,
      bannerPrimaryColor,
      bannerSecondaryColor,

      // Thumbnail Generator Payload
      thumbPlatform,
      thumbStyle,
      thumbFaceFocus,
      thumbBigText,
      thumbSmallText,
      thumbBorder,
      thumbShadow
    };

    try {
      await submitAIJob(activeTool as any, payload, {
        onSuccess: (result) => {
          if (result?.item) {
            setGeneratedImage(result.item.imageUrl);
            setLastGeneratedItem(result.item);
            setSuccessMsg(`Successfully generated ${activeTool.toUpperCase()}! ${result.item.creditsUsed} Credits deducted.`);
            fetchHistory();
          }
        },
        onError: (errMsg) => {
          setErrorMsg(errMsg || 'Design creation failed. If credits were deducted, they have been automatically refunded.');
        }
      });
    } catch (err: any) {
      console.error('Design generation error:', err);
      setErrorMsg(err?.message || 'Design creation failed. If credits were deducted, they have been automatically refunded.');
    }
  }, [
    onCheckProtectedAccess,
    hasEnoughCredits,
    activeTool,
    activeToolCost,
    availableCredits,
    onOpenPricing,
    prompt,
    compiledPrompt,
    aspectRatio,
    style,
    language,
    colorTheme,
    background,
    customBgColor,
    imageType,
    imageLighting,
    imageCameraAngle,
    imageBgType,
    imageQuality,
    imageNegativePrompt,
    imageSeed,
    logoType,
    logoBrandName,
    logoIconStyle,
    logoFontStyle,
    logoShape,
    logoPrimaryColor,
    logoSecondaryColor,
    logoTransparentBg,
    posterSize,
    posterStyle,
    posterEventType,
    posterMainHeading,
    posterSubHeading,
    posterCtaText,
    posterThemeColor,
    posterSecondaryColor,
    posterBgImageDesc,
    bannerPlatform,
    bannerSize,
    bannerBrandName,
    bannerButtonText,
    bannerPrimaryColor,
    bannerSecondaryColor,
    thumbPlatform,
    thumbStyle,
    thumbFaceFocus,
    thumbBigText,
    thumbSmallText,
    thumbBorder,
    thumbShadow,
    canGenerate,
    submitAIJob,
    fetchHistory,
    onUpdateUserStats
  ]);

  const handleDeleteHistory = useCallback(async (id: string) => {
    try {
      await fetch(`/api/design-studio/history/${id}`, { method: 'DELETE' });
      setHistoryItems(prev => prev.filter(item => item.id !== id));
      if (userStats.designHistory) {
        const updated = userStats.designHistory.filter(i => i.id !== id);
        if (onUpdateUserStats) {
          onUpdateUserStats({
            ...userStats,
            designHistory: updated
          });
        }
      }
    } catch (e) {
      console.warn('Failed to delete design history item:', e);
    }
  }, [userStats, onUpdateUserStats]);

  const handleRegenerate = useCallback((item: DesignHistoryItem) => {
    setActiveTool(item.toolType);
    setPrompt(item.prompt || '');
    if (item.aspectRatio && ASPECT_RATIOS.includes(item.aspectRatio as any)) {
      setAspectRatio(item.aspectRatio as typeof ASPECT_RATIOS[number]);
    }
    setStyle(item.style || 'Modern');
    setStudioSubTab('creator');
  }, []);

  const copyPromptToClipboard = useCallback(() => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }, [compiledPrompt]);

  // Word and character counters for main prompt
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const charCount = prompt.length;

  return (
    <div className="bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-visible transition-colors w-full max-w-full">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-amber-500/10 blur-2xl pointer-events-none" />

      {/* Top Bar with Available Credits Display */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-300 dark:text-violet-300 light:text-violet-700 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> VirJoy AI Design Studio
          </div>
          <h2 className="text-xl font-black text-slate-100 dark:text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            Multi-Tool Graphic & Art Generator
          </h2>
        </div>

        {/* Dynamic Credit Wallet Display */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-950 border border-indigo-500/30 rounded-2xl flex items-center gap-2.5 shadow-lg">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Available Credits</div>
              <div className="text-sm font-black font-mono text-amber-400">
                {availableCredits} <span className="text-[10px] text-slate-400">Credits</span>
              </div>
            </div>
          </div>

          {onOpenPricing && (
            <button
              type="button"
              onClick={() => onOpenPricing()}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Top Up
            </button>
          )}
        </div>
      </div>

      {/* SUB-TABS: Creator vs Design History */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setStudioSubTab('creator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            studioSubTab === 'creator'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Create Design</span>
        </button>

        <button
          type="button"
          onClick={() => setStudioSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            studioSubTab === 'history'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Design Vault History ({historyItems.length})</span>
        </button>
      </div>

      {/* CONTENT FOR CREATOR TAB */}
      {studioSubTab === 'creator' && (
        <>
          {/* TOOL NAVIGATION BUTTONS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTool('image')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                activeTool === 'image'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-100 text-slate-400 hover:text-slate-200 border-slate-800 dark:border-slate-800 light:border-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>AI IMAGE ({costs.image || 3} Credits)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('logo')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                activeTool === 'logo'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-100 text-slate-400 hover:text-slate-200 border-slate-800 dark:border-slate-800 light:border-slate-200'
              }`}
            >
              <Wand2 className="w-4 h-4 text-amber-400" />
              <span>AI LOGO ({costs.logo || 5} Credits)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('poster')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                activeTool === 'poster'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-100 text-slate-400 hover:text-slate-200 border-slate-800 dark:border-slate-800 light:border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>AI POSTER ({costs.poster || 5} Credits)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('banner')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                activeTool === 'banner'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-100 text-slate-400 hover:text-slate-200 border-slate-800 dark:border-slate-800 light:border-slate-200'
              }`}
            >
              <Layout className="w-4 h-4 text-emerald-400" />
              <span>AI BANNER ({costs.banner || 5} Credits)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('thumbnail')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer col-span-2 sm:col-span-1 ${
                activeTool === 'thumbnail'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-100 text-slate-400 hover:text-slate-200 border-slate-800 dark:border-slate-800 light:border-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-rose-400" />
              <span>AI THUMBNAIL ({costs.thumbnail || 3} Credits)</span>
            </button>
          </div>

          <form onSubmit={handleGenerateDesign} className="space-y-6">
            {/* COMMON FIELDS CONTAINER */}
            <div className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Common Fields
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Shared across all AI design tools</span>
              </div>

              {/* 1. Main Prompt Textarea (6-8 Visible Lines = min-h-[160px] / rows={7}) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="design-prompt-input" className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Prompt Description:</span>
                  </label>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                    <span>{wordCount} words</span> • <span>{charCount} chars</span>
                  </div>
                </div>

                <div className="relative group">
                  <textarea
                    id="design-prompt-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={7}
                    placeholder={
                      activeTool === 'logo'
                        ? 'e.g. Modern tech startup logo for a quantum AI platform called VirJoy...\nDescribe icon shape, brand personality, typography preferences, and target audience.'
                        : activeTool === 'poster'
                        ? 'e.g. High energy music festival poster with neon stage lights and crowd silhouettes...\nInclude event vibe, color palette, lighting details, and subject composition.'
                        : activeTool === 'banner'
                        ? 'e.g. Sleek web hero banner promoting next-gen SaaS video creation software...\nInclude product highlights, dark mode finish, and clean call-to-action placement.'
                        : activeTool === 'thumbnail'
                        ? 'e.g. Shocking Youtube thumbnail about 10 secret AI productivity hacks...\nDescribe main character expression, bold text placement, high contrast lighting, and background atmosphere.'
                        : 'e.g. A surreal 3D isometric cyberpunk city floating in cloud nebula with glowing light trails...\nSpecify camera lens, lighting source, atmospheric fog, color grading, and level of detail.'
                    }
                    className="w-full min-h-[160px] bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-xl p-3.5 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder-slate-500 outline-none transition-all duration-200 resize-y leading-relaxed shadow-inner"
                    aria-label="Design Prompt Description"
                  />
                  <div className="absolute bottom-3 right-3 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                    <Wand2 className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>

              {/* 2. Grid of Common Fields using UNIFIED CUSTOM DROPDOWNS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Language */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-indigo-400" /> Language:
                  </label>
                  <CustomDropdown
                    value={language}
                    options={languageOptions}
                    onChange={(val) => setLanguage(val)}
                    enableSearch
                    searchPlaceholder="Search language..."
                  />
                </div>

                {/* Style */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-amber-400" /> Style:
                  </label>
                  <CustomDropdown
                    value={style}
                    options={styleOptions}
                    onChange={(val) => setStyle(val)}
                    enableSearch
                    searchPlaceholder="Search style..."
                  />
                </div>

                {/* Color Theme */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-rose-400" /> Color Theme:
                  </label>
                  <CustomDropdown
                    value={colorTheme}
                    options={colorThemeOptions}
                    onChange={(val) => setColorTheme(val)}
                    enableSearch
                    searchPlaceholder="Search theme..."
                  />
                </div>

                {/* Background */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-purple-400" /> Background:
                  </label>
                  <CustomDropdown
                    value={background}
                    options={backgroundOptions}
                    onChange={(val) => setBackground(val)}
                    enableSearch
                    searchPlaceholder="Search background..."
                  />
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1 flex items-center gap-1">
                    <Layout className="w-3 h-3 text-emerald-400" /> Aspect Ratio:
                  </label>
                  <CustomDropdown
                    value={aspectRatio}
                    options={aspectRatioOptions}
                    onChange={(val) => setAspectRatio(val as any)}
                    enableSearch
                    searchPlaceholder="Search ratio..."
                  />
                </div>
              </div>

              {/* Custom Color Input if Background === 'Custom Color' */}
              {background === 'Custom Color' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <label className="text-xs text-slate-300 font-semibold">Choose Hex Background Color:</label>
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-28 bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              )}
            </div>

            {/* TOOL SPECIFIC EXTRA FIELDS PANELS */}

            {/* 1. IMAGE GENERATOR EXTRA FIELDS */}
            {activeTool === 'image' && (
              <div className="bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-lg">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-800/80 pb-2">
                  <ImageIcon className="w-3.5 h-3.5" /> AI Image Generator Parameters
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Image Render Type:</label>
                    <CustomDropdown
                      value={imageType}
                      options={imageTypeOptions}
                      onChange={(val) => setImageType(val)}
                      enableSearch
                      searchPlaceholder="Search render type..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Lighting Setup:</label>
                    <CustomDropdown
                      value={imageLighting}
                      options={lightingOptions}
                      onChange={(val) => setImageLighting(val)}
                      enableSearch
                      searchPlaceholder="Search lighting..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Camera Angle:</label>
                    <CustomDropdown
                      value={imageCameraAngle}
                      options={cameraAngleOptions}
                      onChange={(val) => setImageCameraAngle(val)}
                      enableSearch
                      searchPlaceholder="Search camera angle..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold font-semibold">Background Atmosphere:</label>
                    <CustomDropdown
                      value={imageBgType}
                      options={bgTypeOptions}
                      onChange={(val) => setImageBgType(val)}
                      enableSearch
                      searchPlaceholder="Search atmosphere..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Image Quality:</label>
                    <CustomDropdown
                      value={imageQuality}
                      options={imageQualityOptions}
                      onChange={(val) => setImageQuality(val)}
                      enableSearch
                      searchPlaceholder="Search quality..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Seed (Optional):</label>
                    <input
                      type="text"
                      value={imageSeed}
                      onChange={(e) => setImageSeed(e.target.value)}
                      placeholder="e.g. 12345 (Leave empty for random)"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 text-xs text-slate-200 placeholder-slate-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Negative Prompt (Elements to avoid):</label>
                  <input
                    type="text"
                    value={imageNegativePrompt}
                    onChange={(e) => setImageNegativePrompt(e.target.value)}
                    placeholder="e.g. blurry, low quality, distorted anatomy, text overlay, extra fingers"
                    className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 text-xs text-slate-200 placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* 2. LOGO GENERATOR EXTRA FIELDS */}
            {activeTool === 'logo' && (
              <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Wand2 className="w-3.5 h-3.5" /> Logo Generator Extra Fields
                  </span>
                  {/* Style Preset Quick Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                    {['Minimal', 'Luxury', 'Modern', 'Vintage'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setStyle(preset);
                          if (preset === 'Minimal') setLogoIconStyle('Minimalist');
                          if (preset === 'Luxury') setLogoFontStyle('Elegant Serif');
                          if (preset === 'Modern') setLogoFontStyle('Modern Sans-Serif');
                          if (preset === 'Vintage') setLogoIconStyle('Vintage');
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          style === preset
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Logo Type:</label>
                    <CustomDropdown
                      value={logoType}
                      options={logoTypeOptions}
                      onChange={(val) => setLogoType(val)}
                      enableSearch
                      searchPlaceholder="Search logo type..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Brand / Text Name:</label>
                    <input
                      type="text"
                      value={logoBrandName}
                      onChange={(e) => setLogoBrandName(e.target.value)}
                      placeholder="e.g. VirJoy AI"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 text-xs text-slate-200 font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Icon Style:</label>
                    <CustomDropdown
                      value={logoIconStyle}
                      options={iconStyleOptions}
                      onChange={(val) => setLogoIconStyle(val)}
                      enableSearch
                      searchPlaceholder="Search icon style..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Font Style:</label>
                    <CustomDropdown
                      value={logoFontStyle}
                      options={fontStyleOptions}
                      onChange={(val) => setLogoFontStyle(val)}
                      enableSearch
                      searchPlaceholder="Search font style..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Logo Shape:</label>
                    <CustomDropdown
                      value={logoShape}
                      options={logoShapeOptions}
                      onChange={(val) => setLogoShape(val)}
                      enableSearch
                      searchPlaceholder="Search shape..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Primary Color:</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="color"
                        value={logoPrimaryColor}
                        onChange={(e) => setLogoPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={logoPrimaryColor}
                        onChange={(e) => setLogoPrimaryColor(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Secondary Color:</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="color"
                        value={logoSecondaryColor}
                        onChange={(e) => setLogoSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={logoSecondaryColor}
                        onChange={(e) => setLogoSecondaryColor(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="logoTransCheck"
                      checked={logoTransparentBg}
                      onChange={(e) => setLogoTransparentBg(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="logoTransCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
                      Transparent Background
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 3. POSTER GENERATOR EXTRA FIELDS */}
            {activeTool === 'poster' && (
              <div className="bg-slate-950/80 border border-purple-500/20 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-lg">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-800/80 pb-2">
                  <Layers className="w-3.5 h-3.5" /> Poster Generator Extra Fields
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Poster Size:</label>
                    <CustomDropdown
                      value={posterSize}
                      options={posterSizeOptions}
                      onChange={(val) => setPosterSize(val)}
                      enableSearch
                      searchPlaceholder="Search poster size..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Event Theme / Category:</label>
                    <CustomDropdown
                      value={posterEventType}
                      options={posterThemeOptions}
                      onChange={(val) => setPosterEventType(val)}
                      enableSearch
                      searchPlaceholder="Search theme..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Poster Style:</label>
                    <CustomDropdown
                      value={posterStyle}
                      options={posterStyleOptions}
                      onChange={(val) => setPosterStyle(val)}
                      enableSearch
                      searchPlaceholder="Search poster style..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Main Heading:</label>
                    <input
                      type="text"
                      value={posterMainHeading}
                      onChange={(e) => setPosterMainHeading(e.target.value)}
                      placeholder="e.g. AI INNOVATION SUMMIT"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 text-xs text-slate-200 font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Sub Heading:</label>
                    <input
                      type="text"
                      value={posterSubHeading}
                      onChange={(e) => setPosterSubHeading(e.target.value)}
                      placeholder="e.g. Building the future of creation"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">CTA Button Text:</label>
                    <input
                      type="text"
                      value={posterCtaText}
                      onChange={(e) => setPosterCtaText(e.target.value)}
                      placeholder="e.g. BUY TICKETS NOW"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Primary Theme Color:</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="color"
                        value={posterThemeColor}
                        onChange={(e) => setPosterThemeColor(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={posterThemeColor}
                        onChange={(e) => setPosterThemeColor(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Secondary Color:</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="color"
                        value={posterSecondaryColor}
                        onChange={(e) => setPosterSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={posterSecondaryColor}
                        onChange={(e) => setPosterSecondaryColor(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Logo Upload (Optional):</label>
                    <div className="flex items-center gap-2 h-10">
                      <label className="flex-1 h-10 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 text-xs text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span className="truncate">{posterLogoFile ? 'Logo Attached' : 'Choose Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoFileUpload(e, 'poster')}
                          className="hidden"
                        />
                      </label>
                      {posterLogoFile && (
                        <button
                          type="button"
                          onClick={() => setPosterLogoFile(null)}
                          className="h-10 px-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Background Style / Concept:</label>
                  <input
                    type="text"
                    value={posterBgImageDesc}
                    onChange={(e) => setPosterBgImageDesc(e.target.value)}
                    placeholder="e.g. Neon light grid with particle wave"
                    className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. BANNER GENERATOR EXTRA FIELDS */}
            {activeTool === 'banner' && (
              <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-lg">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-800/80 pb-2">
                  <Layout className="w-3.5 h-3.5" /> Banner Generator Extra Fields
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Platform:</label>
                    <CustomDropdown
                      value={bannerPlatform}
                      options={bannerPlatformOptions}
                      onChange={(val) => setBannerPlatform(val)}
                      enableSearch
                      searchPlaceholder="Search platform..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Banner Dimensions:</label>
                    <CustomDropdown
                      value={bannerSize}
                      options={bannerSizeOptions}
                      onChange={(val) => setBannerSize(val)}
                      enableSearch
                      searchPlaceholder="Search banner size..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Brand Name:</label>
                    <input
                      type="text"
                      value={bannerBrandName}
                      onChange={(e) => setBannerBrandName(e.target.value)}
                      placeholder="e.g. VirJoy Studio"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 text-xs text-slate-200 font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Action Button Text (CTA):</label>
                    <input
                      type="text"
                      value={bannerButtonText}
                      onChange={(e) => setBannerButtonText(e.target.value)}
                      placeholder="e.g. Explore Features"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Primary Brand Color:</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="color"
                        value={bannerPrimaryColor}
                        onChange={(e) => setBannerPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={bannerPrimaryColor}
                        onChange={(e) => setBannerPrimaryColor(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Secondary Accent Color:</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="color"
                        value={bannerSecondaryColor}
                        onChange={(e) => setBannerSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={bannerSecondaryColor}
                        onChange={(e) => setBannerSecondaryColor(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Brand Logo Upload:</label>
                    <div className="flex items-center gap-2 h-10">
                      <label className="flex-1 h-10 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 text-xs text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="truncate">{bannerBrandLogo ? 'Logo Uploaded' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoFileUpload(e, 'banner')}
                          className="hidden"
                        />
                      </label>
                      {bannerBrandLogo && (
                        <button
                          type="button"
                          onClick={() => setBannerBrandLogo(null)}
                          className="h-10 px-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. THUMBNAIL GENERATOR EXTRA FIELDS */}
            {activeTool === 'thumbnail' && (
              <div className="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-lg">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-800/80 pb-2">
                  <Sliders className="w-3.5 h-3.5" /> Thumbnail Generator Extra Fields
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Platform Target:</label>
                    <CustomDropdown
                      value={thumbPlatform}
                      options={thumbPlatformOptions}
                      onChange={(val) => setThumbPlatform(val)}
                      enableSearch
                      searchPlaceholder="Search platform..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Thumbnail Niche Style:</label>
                    <CustomDropdown
                      value={thumbStyle}
                      options={thumbStyleOptions}
                      onChange={(val) => setThumbStyle(val)}
                      enableSearch
                      searchPlaceholder="Search style..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Subject / Face Focus:</label>
                    <CustomDropdown
                      value={thumbFaceFocus}
                      options={thumbFaceFocusOptions}
                      onChange={(val) => setThumbFaceFocus(val)}
                      enableSearch
                      searchPlaceholder="Search focus..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Big Overlay Text (High Impact):</label>
                    <input
                      type="text"
                      value={thumbBigText}
                      onChange={(e) => setThumbBigText(e.target.value)}
                      placeholder="e.g. 100X PRODUCTIVITY"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-xl px-3 text-xs text-slate-200 font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Sub Text / Caption:</label>
                    <input
                      type="text"
                      value={thumbSmallText}
                      onChange={(e) => setThumbSmallText(e.target.value)}
                      placeholder="e.g. Secret AI tools revealed"
                      className="w-full h-10 bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-xl px-3 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Border Highlight:</label>
                    <CustomDropdown
                      value={thumbBorder}
                      options={thumbBorderOptions}
                      onChange={(val) => setThumbBorder(val)}
                      enableSearch
                      searchPlaceholder="Search border..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Text Shadow Effect:</label>
                    <CustomDropdown
                      value={thumbShadow}
                      options={thumbShadowOptions}
                      onChange={(val) => setThumbShadow(val)}
                      enableSearch
                      searchPlaceholder="Search shadow..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COMPILED AI PROMPT PREVIEW BOX */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdvancedPrompt(!showAdvancedPrompt)}
                  className="text-[11px] font-bold text-slate-300 hover:text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer select-none transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showAdvancedPrompt ? '▼ Hide AI Prompt' : '▶ Show AI Prompt'}</span>
                </button>

                {showAdvancedPrompt && (
                  <button
                    type="button"
                    onClick={copyPromptToClipboard}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" /> Copy Prompt
                      </>
                    )}
                  </button>
                )}
              </div>

              {showAdvancedPrompt && (
                <div className="pt-1">
                  <div className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Final Compiled Prompt String
                  </div>
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 leading-relaxed break-words">
                    {compiledPrompt}
                  </div>
                </div>
              )}
            </div>

            {/* LIVE AI PROCESSING PIPELINE */}
            {isGenerating && (
              <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    Live AI Processing Pipeline
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {generationProgress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 h-full rounded-full transition-all duration-300 shadow-md"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    {progressStageText}
                  </span>
                  <span className="text-slate-500 italic">
                    Rendering High-Res AI Vector Asset
                  </span>
                </div>
              </div>
            )}

            {/* ERROR AND SUCCESS MESSAGES */}
            {errorMsg && (
              <div className="p-4 bg-rose-950/80 border border-rose-500/30 rounded-2xl text-xs text-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Generation Notice</div>
                  <div>{errorMsg}</div>
                </div>
              </div>
            )}

            {successMsg && !isGenerating && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="font-medium">{successMsg}</div>
              </div>
            )}

            {/* GENERATE BUTTON & CREDIT PREVIEW BAR */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                {/* Dynamic Credit Preview Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-amber-500/30 rounded-xl">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300 font-medium">
                    Credit Preview: <strong className="text-amber-400 font-bold">{activeToolCost} Credits</strong>
                  </span>
                </div>

                {/* Available credits check */}
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Available: <strong className="text-slate-200 font-mono">{availableCredits} Credits</strong></span>
                  {!hasEnoughCredits && (
                    <span className="text-rose-400 text-[11px] font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Not Enough Credits
                    </span>
                  )}
                </div>
              </div>

              {/* GENERATE SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isGenerating || !hasEnoughCredits}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  !hasEnoughCredits
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
                    : isGenerating
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-wait'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:via-purple-500 hover:to-violet-500 text-white border border-indigo-400/30 shadow-indigo-600/30 hover:scale-[1.01]'
                }`}
              >
                {!hasEnoughCredits ? (
                  <>
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <span>Not Enough Credits ({activeToolCost} Required)</span>
                  </>
                ) : isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                    <span>Processing AI {activeTool.toUpperCase()} Generation...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 text-amber-400" />
                    <span>GENERATE {activeTool.toUpperCase()} ({activeToolCost} CREDITS)</span>
                  </>
                )}
              </button>

              {/* AUTO-DELETE RETENTION NOTICE */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center space-y-1">
                <p className="text-[11px] text-amber-400/90 font-medium flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Generated files are automatically deleted after 24 hours.
                </p>
                <p className="text-[10px] text-slate-500">
                  Please download your files before they expire from the server vault.
                </p>
              </div>
            </div>
          </form>

          {/* GENERATED RESULT PREVIEW CARD */}
          {generatedImage && (
            <div className="mt-8 bg-slate-950 border border-indigo-500/30 rounded-3xl p-5 space-y-4 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    AI Studio Result Output
                  </div>
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Generated {activeTool.toUpperCase()} Asset
                  </h3>
                </div>

                <a
                  href={generatedImage}
                  download={`virjoy-${activeTool}-${Date.now()}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" /> Download High Res
                </a>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 max-h-[500px] flex items-center justify-center group">
                <img
                  src={generatedImage}
                  alt="Generated AI Design"
                  className="max-h-[480px] w-auto object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-3 bg-slate-900 rounded-xl text-[11px] text-slate-400 font-mono leading-relaxed break-words">
                <strong className="text-slate-300">Compiled Prompt Used:</strong> {compiledPrompt}
              </div>
            </div>
          )}
        </>
      )}

      {/* CONTENT FOR HISTORY TAB */}
      {studioSubTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> AI Design Studio Vault
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved design assets generated in your session.
              </p>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Auto Delete Policy
              </div>
              <div className="text-[11px] text-slate-400">24 Hours Expiration</div>
            </div>
          </div>

          {/* Retention warning notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Generated files are automatically deleted after 24 hours. Please download your files before they expire!</span>
          </div>

          {historyItems.length === 0 ? (
            <div className="text-center py-12 bg-slate-950 border border-slate-800 rounded-3xl space-y-3">
              <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-slate-300 font-bold text-sm">No Design Assets Created Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the Creator tab to generate your first AI Image, Logo, Poster, Banner, or Thumbnail!
              </p>
              <button
                type="button"
                onClick={() => setStudioSubTab('creator')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Create Your First Design
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden p-3 space-y-3 flex flex-col justify-between transition-all"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group">
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-[10px] font-bold text-indigo-300 uppercase">
                        {item.toolType}
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black font-mono">
                        {item.creditsUsed} Credits
                      </div>
                    </div>

                    <div className="text-xs text-slate-200 line-clamp-2 font-medium">
                      {item.prompt}
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span className="text-amber-400 font-mono">Expires in 24h</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                    <a
                      href={item.imageUrl}
                      download={`virjoy-${item.toolType}-${item.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>

                    <button
                      type="button"
                      onClick={() => handleRegenerate(item)}
                      title="Re-populate prompt and options"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-[11px] cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteHistory(item.id)}
                      title="Delete asset"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg text-[11px] cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
