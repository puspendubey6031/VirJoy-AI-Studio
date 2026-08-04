import React from 'react';
import { AppConfig, PlanKey, PlanConfig } from '../types';
import { defaultConfig } from '../server/configStore';
import { X, Check, Sparkles, Shield, Zap, ArrowRight, Star, Lock, Gift, CheckCircle2 } from 'lucide-react';

interface PlanPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  currentPlan: PlanKey | string;
  onSelectPlan: (planKey: any) => void;
  onOpenAdmin?: () => void;
  upgradeMessage?: string;
  customTitle?: string;
}

export const PlanPricingModal: React.FC<PlanPricingModalProps> = ({
  isOpen,
  onClose,
  config,
  currentPlan,
  onSelectPlan,
  onOpenAdmin,
  upgradeMessage,
  customTitle
}) => {
  if (!isOpen) return null;

  const lockModalConfig = config.subscriptionLockConfig?.lockModal || defaultConfig.subscriptionLockConfig!.lockModal;
  const plansObj = config.plans || defaultConfig.plans;

  // Filter and sort active plans dynamically
  const planKeys = Object.keys(plansObj).filter(key => {
    const plan = plansObj[key];
    return plan && plan.enabled !== false;
  });

  const modalTitle = customTitle || lockModalConfig.title || 'Select Your VirJoy AI Subscription';
  const modalDesc = lockModalConfig.description || 'Credit-based generation system. Upgrades grant monthly credits, longer video caps, and HD/4K rendering.';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-8 overflow-hidden transition-colors">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Premium Subscription Control
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">
              {modalTitle}
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {modalDesc}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Offer Text Banner */}
        {lockModalConfig.offerText && (
          <div className="mt-4 bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-amber-300 text-xs font-bold shadow-lg">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{lockModalConfig.offerText}</span>
            </div>
            {lockModalConfig.bannerImage && (
              <span className="hidden sm:inline-block text-[10px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-md font-extrabold">
                SPECIAL DEAL
              </span>
            )}
          </div>
        )}

        {/* Upgrade Banner Message if triggered from locked feature */}
        {upgradeMessage && (
          <div className="mt-3 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl p-4 flex items-center gap-3 text-indigo-300 text-xs font-semibold">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0 animate-bounce" />
            <span>{upgradeMessage}</span>
          </div>
        )}

        {/* Dynamic Benefits Bullet List */}
        {lockModalConfig.benefits && lockModalConfig.benefits.length > 0 && (
          <div className="mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" /> Unlock Subscription Privileges:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {lockModalConfig.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Pricing Cards Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(4, Math.max(1, planKeys.length))} gap-4 my-6`}>
          {planKeys.map((key) => {
            const plan: PlanConfig = plansObj[key];
            const isCurrent = currentPlan === key;
            const isPopular = plan.badge === 'POPULAR' || key === '₹399' || key.includes('399');
            const isUltra = plan.badge === 'ULTRA' || key === '₹799' || key.includes('799');

            const monthlyCredits = plan.monthlyCredits || plan.maxMonthlyDurationSeconds || 30;
            const maxSingleVideoCredits = plan.maxSingleVideoCredits || plan.maxVideoDurationSeconds || 30;

            return (
              <div
                key={key}
                className={`rounded-2xl p-5 flex flex-col justify-between transition-all relative border ${
                  isUltra
                    ? 'bg-gradient-to-b from-purple-950/60 to-slate-950 border-purple-500/50 shadow-xl shadow-purple-500/10'
                    : isPopular
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-950 border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                {/* Custom Badge */}
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-indigo-600 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-100 text-base">{plan.name}</h4>
                    {isCurrent && (
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-slate-100">
                      {plan.priceINR === 0 ? 'Free' : `₹${plan.priceINR}`}
                    </span>
                    <span className="text-slate-400 text-xs font-medium"> / month</span>
                  </div>

                  {/* Core Metrics: Credits & Duration Caps */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 mb-4 space-y-1.5 text-xs shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Monthly Credits:</span>
                      <strong className="text-indigo-400 font-bold">{monthlyCredits.toLocaleString()} Credits</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Max Video Length:</span>
                      <strong className="text-slate-200 font-bold">{plan.maxVideoDurationSeconds}s ({maxSingleVideoCredits} Cr)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Export Quality:</span>
                      <strong className="text-amber-400 font-bold">{plan.exportQuality}</strong>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2 mb-6">
                    {(plan.features || []).map((f, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.hasIdeaToVideoWorkflow && (
                      <li className="text-xs text-purple-300 font-bold flex items-start gap-2 bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>AI Idea Assistant</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Switch Plan Button */}
                <button
                  disabled={isCurrent}
                  onClick={() => {
                    onSelectPlan(key);
                    onClose();
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-500 cursor-default'
                      : isUltra
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                      : isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-lg'
                  }`}
                >
                  <span>{isCurrent ? 'Current Plan' : (lockModalConfig.buttonText || `Subscribe to ${plan.name}`)}</span>
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Centralized credit billing — Server-enforced plan entitlements.</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
            >
              Continue with {currentPlan} Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
