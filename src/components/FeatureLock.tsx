import React from 'react';
import { AppConfig, UserStats } from '../types';
import { useSubscription } from '../hooks/useSubscription';
import { Lock, Sparkles, ArrowUpRight, Zap, ShieldAlert } from 'lucide-react';

export interface FeatureLockProps {
  featureKey: string;
  minPlan?: string;
  requiredCredits?: number;
  children: React.ReactNode;
  mode?: 'overlay' | 'inline-badge' | 'intercept-click' | 'hide';
  customTitle?: string;
  customMessage?: string;
  fallback?: React.ReactNode;
  config: AppConfig;
  userStats: UserStats;
  onOpenPricing?: (upgradeMsg?: string) => void;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  featureKey,
  minPlan,
  requiredCredits,
  children,
  mode = 'overlay',
  customTitle,
  customMessage,
  fallback,
  config,
  userStats,
  onOpenPricing
}) => {
  const { isPlanSufficient, subscriptionLockConfig, isFeatureAllowed } = useSubscription(config, userStats);

  const featureRule = subscriptionLockConfig.features[featureKey as keyof typeof subscriptionLockConfig.features];
  const requiredMinPlan = minPlan || featureRule?.minPlan || 'Free';
  const reqCredits = requiredCredits ?? (featureRule?.requiredCredits || 0);

  const isAllowed = isFeatureAllowed(featureKey) && isPlanSufficient(requiredMinPlan);

  if (isAllowed) {
    return <>{children}</>;
  }

  const upgradeMessage =
    customMessage ||
    featureRule?.customUpgradeMsg ||
    `Upgrade to ${requiredMinPlan} plan or higher to unlock this feature.`;

  const titleText = customTitle || `Unlock ${featureKey.replace(/([A-Z])/g, ' $1').trim()}`;

  const handleUnlockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenPricing) {
      onOpenPricing(upgradeMessage);
    }
  };

  if (mode === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  if (mode === 'inline-badge') {
    return (
      <button
        onClick={handleUnlockClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
        title={upgradeMessage}
      >
        <Lock className="w-3.5 h-3.5 text-amber-400" />
        <span>{requiredMinPlan}</span>
        <ArrowUpRight className="w-3 h-3" />
      </button>
    );
  }

  if (mode === 'intercept-click') {
    return (
      <div className="relative group cursor-pointer" onClick={handleUnlockClick}>
        <div className="pointer-events-none opacity-60 filter grayscale-[40%]">
          {children}
        </div>
        <div className="absolute top-2 right-2 bg-amber-500/90 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-lg border border-amber-400">
          <Lock className="w-3 h-3" />
          <span>{requiredMinPlan}</span>
        </div>
      </div>
    );
  }

  // Default: 'overlay' mode
  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 group">
      {/* Blurred background content preview */}
      <div className="pointer-events-none filter blur-[3px] opacity-40 select-none">
        {children}
      </div>

      {/* High-contrast Lock Overlay Card */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 transition-all">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/40 flex items-center justify-center mb-3 shadow-xl shadow-amber-500/10">
          <Lock className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 uppercase tracking-wide mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Requires {requiredMinPlan} Subscription</span>
        </div>

        <h4 className="text-lg font-extrabold text-slate-100 capitalize mb-1">
          {titleText}
        </h4>

        <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
          {upgradeMessage}
        </p>

        <button
          onClick={handleUnlockClick}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>{subscriptionLockConfig.lockModal.buttonText || 'Upgrade Plan Now'}</span>
        </button>

        {reqCredits > 0 && (
          <span className="text-[10px] text-slate-400 mt-2 font-medium">
            Generation Cost: <strong className="text-amber-400">{reqCredits} Credits</strong>
          </span>
        )}
      </div>
    </div>
  );
};
