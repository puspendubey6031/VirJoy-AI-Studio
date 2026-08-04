import React, { useState } from 'react';
import { MonetizationConfig, MobileAdMobConfig } from '../../types';
import { Tv, Save, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface AdMobManagerTabProps {
  monetizationConfig: MonetizationConfig;
  onChange: (updatedConfig: MonetizationConfig) => void;
  showToast: (msg: string) => void;
}

export const AdMobManagerTab: React.FC<AdMobManagerTabProps> = ({
  monetizationConfig,
  onChange,
  showToast
}) => {
  const [adMobConfig, setAdMobConfig] = useState<MobileAdMobConfig>(() => {
    return (
      monetizationConfig?.mobileAdMobConfig || {
        enabled: true,
        appId: 'ca-app-pub-3940256099942544~3347511713',
        bannerUnitId: 'ca-app-pub-3940256099942544/6300978111',
        interstitialUnitId: 'ca-app-pub-3940256099942544/1033173712',
        rewardedUnitId: 'ca-app-pub-3940256099942544/5224354917',
        rewardedCreditsBonus: 10,
        showOnGeneration: true,
        showBeforeDownload: true,
        showOnNavigation: false
      }
    );
  });

  const handleSave = () => {
    const updated: MonetizationConfig = {
      ...monetizationConfig,
      mobileAdMobConfig: adMobConfig
    };
    onChange(updated);
    showToast('AdMob advertisement settings saved successfully!');
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Google AdMob Advertisement Manager</h3>
              <p className="text-xs text-slate-400">Configure AdMob Publisher IDs, Ad Units, Rewarded Credits & triggers</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">Enable AdMob Ads</span>
            <input
              type="checkbox"
              checked={adMobConfig.enabled}
              onChange={e => setAdMobConfig({ ...adMobConfig, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-5 text-xs">
          {/* Unit IDs */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-bold text-white block text-xs uppercase tracking-wider">AdMob Unit Configurations</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-[11px]">AdMob App ID</label>
                <input
                  type="text"
                  value={adMobConfig.appId}
                  onChange={e => setAdMobConfig({ ...adMobConfig, appId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-[11px]">Banner Ad Unit ID</label>
                <input
                  type="text"
                  value={adMobConfig.bannerUnitId}
                  onChange={e => setAdMobConfig({ ...adMobConfig, bannerUnitId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-[11px]">Interstitial Ad Unit ID</label>
                <input
                  type="text"
                  value={adMobConfig.interstitialUnitId}
                  onChange={e => setAdMobConfig({ ...adMobConfig, interstitialUnitId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-[11px]">Rewarded Video Ad Unit ID</label>
                <input
                  type="text"
                  value={adMobConfig.rewardedUnitId || ''}
                  onChange={e => setAdMobConfig({ ...adMobConfig, rewardedUnitId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Rewarded Ad Bonus Credits */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-slate-300 font-bold block text-xs">Rewarded Ad Bonus Credits</label>
            <input
              type="number"
              min="1"
              max="500"
              value={adMobConfig.rewardedCreditsBonus || 10}
              onChange={e => setAdMobConfig({ ...adMobConfig, rewardedCreditsBonus: Number(e.target.value) })}
              className="w-full max-w-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl font-extrabold text-amber-400 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-500">
              Credits awarded to the user after completing a rewarded video advertisement.
            </p>
          </div>

          {/* Triggers */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-white block text-xs uppercase tracking-wider">Interstitial Display Rules</span>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Show Interstitial Ad after video generation</span>
                <input
                  type="checkbox"
                  checked={adMobConfig.showOnGeneration !== false}
                  onChange={e => setAdMobConfig({ ...adMobConfig, showOnGeneration: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Show Interstitial Ad before video download</span>
                <input
                  type="checkbox"
                  checked={adMobConfig.showBeforeDownload !== false}
                  onChange={e => setAdMobConfig({ ...adMobConfig, showBeforeDownload: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Show Interstitial Ad on selected navigation events</span>
                <input
                  type="checkbox"
                  checked={Boolean(adMobConfig.showOnNavigation)}
                  onChange={e => setAdMobConfig({ ...adMobConfig, showOnNavigation: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save AdMob Config
          </button>
        </div>
      </div>
    </div>
  );
};
