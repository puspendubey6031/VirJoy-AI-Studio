import React from 'react';
import { AppConfig, PlanKey } from '../types';
import { Sparkles, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  placement: 'headerBanner' | 'sidebarRect' | 'queueOverlay' | 'exportBanner';
  config: AppConfig;
  currentPlan: PlanKey;
  onOpenPricing: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, config, currentPlan, onOpenPricing }) => {
  const planConfig = config.plans[currentPlan];

  // If monetization is globally disabled OR if user's plan hides ads OR if this specific placement is disabled
  if (!config.monetization.adSenseEnabled || !planConfig?.showAds || !config.monetization.placements[placement]) {
    return null;
  }

  const pubId = config.monetization.pubId || 'ca-pub-demo';

  if (placement === 'headerBanner') {
    return (
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase border border-amber-500/20">
            AdSense Sponsored
          </span>
          <span className="text-slate-300 font-medium">VirJoy Cloud GPU Clusters — Fast 4K AI Video Rendering</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-mono hidden md:inline">[{pubId}]</span>
          <button
            onClick={onOpenPricing}
            className="text-amber-400 hover:text-amber-300 underline font-medium flex items-center gap-1 cursor-pointer"
          >
            Upgrade to remove ads
          </button>
        </div>
      </div>
    );
  }

  if (placement === 'sidebarRect') {
    return (
      <div className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3 text-xs text-slate-300 relative overflow-hidden my-4">
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded uppercase">
            Sponsored Ad
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Slot: Sidebar</span>
        </div>
        <p className="font-medium text-slate-200">
          🚀 Turn Amazon Product Links into Viral Reels with 1-Click VirJoy Automation.
        </p>
        <div className="flex items-center justify-between pt-1">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert('Redirecting to sponsored promotional partner...'); }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-md flex items-center gap-1 transition-all text-xs"
          >
            Learn More <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onOpenPricing}
            className="text-slate-400 hover:text-white text-[11px] underline"
          >
            Hide Ads (₹199/mo)
          </button>
        </div>
      </div>
    );
  }

  if (placement === 'queueOverlay') {
    return (
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-center text-xs text-slate-300 my-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-semibold text-amber-300 uppercase tracking-wide text-[10px]">Sponsored During Render</span>
        </div>
        <p className="text-slate-200 text-xs">Generating your video scenes... Upgrade to ₹199 Starter Plan to remove queue ads and watermarks.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs text-slate-400 my-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">Ad</span>
        <span>Exporting standard quality. Upgrade to ₹399 Pro for 1080p HD Ad-Free exports.</span>
      </div>
      <button onClick={onOpenPricing} className="text-amber-400 font-medium hover:underline">
        Upgrade
      </button>
    </div>
  );
};
