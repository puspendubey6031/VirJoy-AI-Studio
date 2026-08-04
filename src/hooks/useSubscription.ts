import { useState, useMemo, useCallback } from 'react';
import { AppConfig, UserStats, PlanConfig, SubscriptionLockConfig, FeatureLockRule } from '../types';
import { defaultConfig } from '../server/configStore';

export interface CanGenerateResult {
  allowed: boolean;
  reason?: string;
  minPlan?: string;
  requiredCredits?: number;
}

export interface CanUseVoiceResult {
  allowed: boolean;
  reason?: string;
  minPlan?: string;
}

export interface CanUseSubtitleResult {
  allowed: boolean;
  reason?: string;
  minPlan?: string;
}

export interface CanUseDurationResult {
  allowed: boolean;
  reason?: string;
  minPlan?: string;
  requiredCredits?: number;
}

export interface LockModalData {
  isOpen: boolean;
  featureKey?: string;
  customTitle?: string;
  customMsg?: string;
  minPlan?: string;
}

export function useSubscription(config?: AppConfig, userStats?: UserStats) {
  const activeConfig = config || defaultConfig;
  const lockConfig: SubscriptionLockConfig = activeConfig.subscriptionLockConfig || defaultConfig.subscriptionLockConfig!;
  const currentPlan = userStats?.currentPlan || 'Free';
  const currentCredits = userStats?.remainingCredits ?? (userStats?.monthlyCredits || 30);

  const plans = activeConfig.plans || defaultConfig.plans;
  const currentPlanConfig: PlanConfig = plans[currentPlan] || plans.Free || Object.values(plans)[0];

  const [lockModalData, setLockModalData] = useState<LockModalData>({
    isOpen: false
  });

  // Helper function to rank plans for comparison (e.g., Free < ₹199 < ₹399 < ₹799)
  const getPlanRank = useCallback((planKey: string): number => {
    const targetPlan = plans[planKey];
    if (targetPlan && targetPlan.order !== undefined) return targetPlan.order;
    const lowerKey = (planKey || '').toLowerCase();
    if (lowerKey === 'free' || lowerKey.includes('0')) return 0;
    if (lowerKey.includes('199') || lowerKey.includes('starter')) return 1;
    if (lowerKey.includes('399') || lowerKey.includes('pro')) return 2;
    if (lowerKey.includes('799') || lowerKey.includes('ultra') || lowerKey.includes('enterprise')) return 3;
    
    // If custom plan, compare prices
    if (targetPlan?.priceINR !== undefined) {
      if (targetPlan.priceINR === 0) return 0;
      if (targetPlan.priceINR <= 199) return 1;
      if (targetPlan.priceINR <= 399) return 2;
      return 3;
    }
    return 1;
  }, [plans]);

  // Check if current user plan meets or exceeds min required plan
  const isPlanSufficient = useCallback((minPlanRequired?: string): boolean => {
    if (!minPlanRequired || minPlanRequired === 'Free') return true;
    const userRank = getPlanRank(currentPlan);
    const requiredRank = getPlanRank(minPlanRequired);
    return userRank >= requiredRank;
  }, [currentPlan, getPlanRank]);

  // General check: is feature allowed based on plan and admin lock setting?
  const isFeatureAllowed = useCallback((featureKey: string): boolean => {
    const featureRule: FeatureLockRule | undefined = lockConfig.features[featureKey as keyof typeof lockConfig.features];
    if (!featureRule) return true;
    if (!featureRule.enabled) return false;
    return isPlanSufficient(featureRule.minPlan);
  }, [lockConfig, isPlanSufficient]);

  // Detailed generator check for Video, Image, Logo, Banner, Poster, Thumbnail, etc.
  const canGenerate = useCallback((toolType: string = 'video', customRequiredCredits?: number): CanGenerateResult => {
    // Map tool type to feature rule key
    let featureKey = 'videoGenerator';
    if (toolType === 'image') featureKey = 'imageGenerator';
    else if (toolType === 'logo') featureKey = 'logoGenerator';
    else if (toolType === 'banner') featureKey = 'bannerGenerator';
    else if (toolType === 'poster') featureKey = 'posterGenerator';
    else if (toolType === 'thumbnail') featureKey = 'thumbnailGenerator';

    const featureRule = lockConfig.features[featureKey as keyof typeof lockConfig.features];
    const cost = customRequiredCredits ?? (featureRule?.requiredCredits || 5);
    const minPlan = featureRule?.minPlan || 'Free';

    // 1. Check if feature lock is globally disabled by Admin
    if (featureRule && !featureRule.enabled) {
      return {
        allowed: false,
        reason: `${toolType.toUpperCase()} generation is currently disabled by Admin.`,
        minPlan
      };
    }

    // 2. Check if user plan meets required plan
    if (!isPlanSufficient(minPlan)) {
      return {
        allowed: false,
        reason: featureRule?.customUpgradeMsg || `Upgrade to ${minPlan} plan or higher to use the ${toolType.toUpperCase()} generator.`,
        minPlan,
        requiredCredits: cost
      };
    }

    // 3. Check credit balance
    if (currentCredits < cost) {
      return {
        allowed: false,
        reason: `Insufficient AI credits. Required: ${cost} Credits, Remaining: ${currentCredits} Credits.`,
        minPlan,
        requiredCredits: cost
      };
    }

    return { allowed: true, requiredCredits: cost };
  }, [lockConfig, currentCredits, isPlanSufficient]);

  // Voice persona permission check
  const canUseVoice = useCallback((voiceId?: string, minPlan?: string): CanUseVoiceResult => {
    const featureRule = lockConfig.features.aiVoiceAccess;
    const requiredMinPlan = minPlan || featureRule?.minPlan || 'Free';

    if (featureRule && !featureRule.enabled) {
      return { allowed: false, reason: 'AI Voice access is disabled by Admin.' };
    }

    if (!isPlanSufficient(requiredMinPlan)) {
      return {
        allowed: false,
        reason: `Voice persona ${voiceId || ''} requires ${requiredMinPlan} plan or higher.`,
        minPlan: requiredMinPlan
      };
    }

    return { allowed: true };
  }, [lockConfig, isPlanSufficient]);

  // Subtitle access check
  const canUseSubtitle = useCallback((): CanUseSubtitleResult => {
    const featureRule = lockConfig.features.subtitleAccess;
    const minPlan = featureRule?.minPlan || 'Free';

    if (featureRule && !featureRule.enabled) {
      return { allowed: false, reason: 'Subtitle rendering disabled by Admin.' };
    }

    if (!isPlanSufficient(minPlan)) {
      return {
        allowed: false,
        reason: `Auto Subtitle features require ${minPlan} plan or higher.`,
        minPlan
      };
    }

    return { allowed: true };
  }, [lockConfig, isPlanSufficient]);

  // Duration selection check (10s, 15s, 30s, 60s, 90s, 120s, 180s, 300s)
  const canUseDuration = useCallback((seconds: number): CanUseDurationResult => {
    const durationOption = (lockConfig.durations || []).find(d => d.seconds === seconds);
    const minPlan = durationOption?.minPlan || (seconds > 30 ? (seconds > 180 ? '₹799' : '₹399') : 'Free');
    const reqCredits = durationOption?.requiredCredits || Math.max(1, Math.ceil((seconds / 10) * lockConfig.credits.creditsPer10Seconds));

    if (durationOption && !durationOption.enabled) {
      return {
        allowed: false,
        reason: `${seconds}s duration is currently disabled by Admin.`,
        minPlan
      };
    }

    if (!isPlanSufficient(minPlan)) {
      return {
        allowed: false,
        reason: `Generating ${seconds}s video requires ${minPlan} plan or higher.`,
        minPlan,
        requiredCredits: reqCredits
      };
    }

    if (currentCredits < reqCredits) {
      return {
        allowed: false,
        reason: `${seconds}s video requires ${reqCredits} credits. Remaining: ${currentCredits} credits.`,
        minPlan,
        requiredCredits: reqCredits
      };
    }

    return { allowed: true, requiredCredits: reqCredits };
  }, [lockConfig, currentCredits, isPlanSufficient]);

  // Open & Close Lock Modal helpers
  const openLockModal = useCallback((featureKey?: string, customTitle?: string, customMsg?: string) => {
    const rule = featureKey ? lockConfig.features[featureKey as keyof typeof lockConfig.features] : undefined;
    setLockModalData({
      isOpen: true,
      featureKey,
      customTitle: customTitle || lockConfig.lockModal.title,
      customMsg: customMsg || rule?.customUpgradeMsg || lockConfig.lockModal.description,
      minPlan: rule?.minPlan
    });
  }, [lockConfig]);

  const closeLockModal = useCallback(() => {
    setLockModalData({ isOpen: false });
  }, []);

  return useMemo(() => ({
    currentPlan,
    currentCredits,
    planConfig: currentPlanConfig,
    plans,
    subscriptionLockConfig: lockConfig,
    isFeatureAllowed,
    canGenerate,
    canUseVoice,
    canUseSubtitle,
    canUseDuration,
    isPlanSufficient,
    openLockModal,
    closeLockModal,
    isLockModalOpen: lockModalData.isOpen,
    lockModalData
  }), [
    currentPlan,
    currentCredits,
    currentPlanConfig,
    plans,
    lockConfig,
    isFeatureAllowed,
    canGenerate,
    canUseVoice,
    canUseSubtitle,
    canUseDuration,
    isPlanSufficient,
    openLockModal,
    closeLockModal,
    lockModalData
  ]);
}
