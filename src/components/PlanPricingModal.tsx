import React from 'react';
import { AppConfig, PlanKey } from '../types';
import { X, Check, Sparkles, Shield, Zap, ArrowRight, Star, Lock } from 'lucide-react';

interface PlanPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  currentPlan: PlanKey;
  onSelectPlan: (planKey: PlanKey) => void;
  onOpenAdmin?: () => void;
  upgradeMessage?: string;
}

export const PlanPricingModal: React.FC<PlanPricingModalProps> = ({
  isOpen,
  onClose,
  config,
  currentPlan,
  onSelectPlan,
  onOpenAdmin,
  upgradeMessage
}) => {
  if (!isOpen) return null;

  const planKeys: PlanKey[] = ['Free', '₹199', '₹399', '₹799'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-8 overflow-hidden transition-colors">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border border-indigo-500/30">
                VirJoy AI Credit Plans
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 mt-1">
              Select Your VirJoy AI Subscription
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">
              Credit-based generation system. Upgrades grant monthly credits, longer video caps, and HD/4K rendering.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upgrade Banner Message if triggered from locked feature */}
        {upgradeMessage && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-300 dark:text-amber-300 light:text-amber-800 text-xs font-semibold">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{upgradeMessage}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          {planKeys.map((key) => {
            const plan = config.plans[key];
            const isCurrent = currentPlan === key;
            const isPopular = key === '₹399';
            const isUltra = key === '₹799';

            const monthlyCredits = plan.monthlyCredits || plan.maxMonthlyDurationSeconds || 30;
            const maxSingleVideoCredits = plan.maxSingleVideoCredits || plan.maxVideoDurationSeconds || 30;

            return (
              <div
                key={key}
                className={`rounded-2xl p-5 flex flex-col justify-between transition-all relative border ${
                  isUltra
                    ? 'bg-gradient-to-b from-purple-950/60 to-slate-950 dark:from-purple-950/60 dark:to-slate-950 light:from-purple-50 light:to-white border-purple-500/50 shadow-xl shadow-purple-500/10'
                    : isPopular
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-950 dark:from-indigo-950/60 dark:to-slate-950 light:from-indigo-50 light:to-white border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                    : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border-slate-800 dark:border-slate-800 light:border-slate-200'
                }`}
              >
                {/* Popular / Ultra Badge */}
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-extrabold text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    Most Popular
                  </span>
                )}
                {isUltra && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white font-extrabold text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Ultra Suite
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-100 dark:text-white light:text-slate-900 text-base">{plan.name}</h4>
                    {isCurrent && (
                      <span className="bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                        Current Plan
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-slate-100 dark:text-white light:text-slate-900">
                      {plan.priceINR === 0 ? 'Free' : `₹${plan.priceINR}`}
                    </span>
                    <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-xs font-medium"> / month</span>
                  </div>

                  {/* Core Metrics: Credits & Duration Caps */}
                  <div className="bg-slate-900/80 dark:bg-slate-900/80 light:bg-white p-3 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 mb-4 space-y-1.5 text-xs shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">Monthly Credits:</span>
                      <strong className="text-indigo-400 dark:text-indigo-300 light:text-indigo-700 font-bold">{monthlyCredits.toLocaleString()} Credits</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">Max Video Length:</span>
                      <strong className="text-slate-200 dark:text-slate-200 light:text-slate-800 font-bold">{plan.maxVideoDurationSeconds}s ({maxSingleVideoCredits} Credits)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">Export Quality:</span>
                      <strong className="text-amber-400 dark:text-amber-300 light:text-amber-700 font-bold">{plan.exportQuality}</strong>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2 mb-6">
                    {plan.features?.map((f, i) => (
                      <li key={i} className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.hasIdeaToVideoWorkflow && (
                      <li className="text-xs text-purple-300 dark:text-purple-300 light:text-purple-800 font-bold flex items-start gap-2 bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Includes Exclusive AI Idea Assistant</span>
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
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-500 cursor-default'
                      : isUltra
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                      : isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-100 dark:text-slate-100 light:text-slate-900'
                  }`}
                >
                  <span>{isCurrent ? 'Active Subscription' : `Subscribe to ${key}`}</span>
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
            {onOpenAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs"
              >
                <Lock className="w-3 h-3 text-slate-500" /> Developer/Admin Key
              </button>
            )}
            <button
              onClick={onClose}
              className="text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              Continue with {currentPlan} Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
