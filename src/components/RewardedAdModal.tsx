import React, { useState, useEffect } from 'react';
import { X, Sparkles, Tv, CheckCircle2, Coins, Play, AlertCircle } from 'lucide-react';
import { AppConfig } from '../types';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onRewardGranted: (bonusCredits: number) => void;
  adType?: 'rewarded' | 'interstitial';
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onClose,
  config,
  onRewardGranted,
  adType = 'rewarded'
}) => {
  if (!isOpen) return null;

  const adMobConfig = config.monetization?.mobileAdMobConfig;
  const rewardCredits = adMobConfig?.rewardedCreditsBonus || 10;

  const [countdown, setCountdown] = useState(5);
  const [isAdFinished, setIsAdFinished] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWatching && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (isWatching && countdown === 0) {
      setIsAdFinished(true);
      setIsWatching(false);
    }
    return () => clearTimeout(timer);
  }, [isWatching, countdown]);

  const handleStartWatch = () => {
    setIsWatching(true);
    setCountdown(5);
    setIsAdFinished(false);
  };

  const handleClaimReward = () => {
    onRewardGranted(rewardCredits);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 my-8 text-center">
        {!isWatching && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
            title="Close Ad"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 mx-auto mb-4 shadow-xl">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Tv className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        <h3 className="text-xl font-black text-white">
          {adType === 'rewarded' ? 'Watch Video & Earn Free Credits' : 'AdMob Sponsored Showcase'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {adType === 'rewarded'
            ? `Watch a short 5-second video ad to receive +${rewardCredits} Bonus AI Credits!`
            : 'Sponsoring VirJoy AI Video Rendering Engine'}
        </p>

        {/* AdMob Video Container */}
        <div className="my-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[180px]">
          {isWatching ? (
            <div className="space-y-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-indigo-600/30 border-2 border-indigo-500 flex items-center justify-center text-amber-300 font-mono text-xl font-black mx-auto">
                {countdown}s
              </div>
              <p className="text-xs text-indigo-300 font-bold">Playing AdMob Rewarded Video Ad...</p>
              <div className="w-48 bg-slate-800 h-1.5 rounded-full mx-auto overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-1000"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
            </div>
          ) : isAdFinished ? (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-sm font-extrabold text-emerald-400">Ad Completion Confirmed!</p>
              <p className="text-xs text-slate-300">
                +{rewardCredits} AI Credits ready to claim
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider block bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                AdMob ID: {adMobConfig?.rewardedUnitId || adMobConfig?.bannerUnitId || 'ca-app-pub-demo'}
              </span>
              <p className="text-xs text-slate-300">
                Click Play below to watch the video sponsor.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isAdFinished ? (
          <button
            onClick={handleClaimReward}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Claim +{rewardCredits} Credits Now
          </button>
        ) : isWatching ? (
          <p className="text-[11px] text-slate-500 font-mono">Please wait until ad completes...</p>
        ) : (
          <button
            onClick={handleStartWatch}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> Watch Ad ({rewardCredits} Credits)
          </button>
        )}
      </div>
    </div>
  );
};
