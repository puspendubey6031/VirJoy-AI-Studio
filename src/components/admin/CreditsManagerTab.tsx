import React from 'react';
import { CreditsConfig } from '../../types';
import {
  Coins,
  Save,
  RotateCcw,
  XCircle,
  Zap,
  Gift,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';

interface CreditsManagerTabProps {
  creditsConfig: CreditsConfig;
  onChange: (updated: CreditsConfig) => void;
  onSaveSingle: (fieldKey: string) => void;
  onCancelChanges: () => void;
  onResetToDefaults: () => void;
  showToast: (msg: string) => void;
  isSaved?: boolean;
}

export const CreditsManagerTab: React.FC<CreditsManagerTabProps> = ({
  creditsConfig,
  onChange,
  onSaveSingle,
  onCancelChanges,
  onResetToDefaults,
  showToast,
  isSaved = false
}) => {
  const handleChangeField = (field: keyof CreditsConfig, val: number) => {
    const num = Math.max(0, val);
    onChange({
      ...creditsConfig,
      [field]: num
    });
  };

  const handleSave = () => {
    onSaveSingle('credits_manager');
    showToast('Settings Updated Successfully');
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" /> Dynamic Credit System & Allocation Rules
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">
              Configure system consumption rates, video generation credit costs, daily bonuses, and trial allowances.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              type="button"
              onClick={onCancelChanges}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
            <button
              type="button"
              onClick={onResetToDefaults}
              className="px-3.5 py-2 bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Credit Rules Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Per Video Base Cost */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" /> Base Credits per Video
            </span>
            <span className="text-amber-400 font-mono text-sm">{creditsConfig.creditsPerVideo} Credits</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Base cost subtracted when initiating a video render job regardless of video length.
          </p>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Cost in Credits:</label>
            <input
              type="number"
              min={0}
              value={creditsConfig.creditsPerVideo}
              onChange={(e) => handleChangeField('creditsPerVideo', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Card 2: Duration Multiplier */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Credits per 10s Video Length
            </span>
            <span className="text-amber-400 font-mono text-sm">{creditsConfig.creditsPer10Seconds} Credits</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Additional credit charge per 10 seconds of render time.
          </p>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Cost per 10s Interval:</label>
            <input
              type="number"
              min={0}
              value={creditsConfig.creditsPer10Seconds}
              onChange={(e) => handleChangeField('creditsPer10Seconds', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Card 3: Daily Free Credits */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-400" /> Daily Free Credits
            </span>
            <span className="text-emerald-400 font-mono text-sm">{creditsConfig.dailyFreeCredits} Credits/Day</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Free credit top-up allocated automatically to active users every 24 hours.
          </p>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Daily Top-Up Amount:</label>
            <input
              type="number"
              min={0}
              value={creditsConfig.dailyFreeCredits}
              onChange={(e) => handleChangeField('dailyFreeCredits', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Card 4: Trial Credits */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> New Account Trial Credits
            </span>
            <span className="text-amber-300 font-mono text-sm">{creditsConfig.trialCredits} Initial Credits</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Welcome credit grant given to newly registered user accounts upon email signup.
          </p>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Initial Welcome Grant:</label>
            <input
              type="number"
              min={0}
              value={creditsConfig.trialCredits}
              onChange={(e) => handleChangeField('trialCredits', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Card 5: Referral / Bonus Credits */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-400" /> Referral & Promotional Bonus Credits
            </span>
            <span className="text-indigo-400 font-mono text-sm">{creditsConfig.bonusCredits} Bonus Credits</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Bonus credit reward granted for completed referrals and promotional campaign redemptions.
          </p>
          <div className="max-w-md">
            <label className="block text-[11px] text-slate-400 mb-1">Bonus Reward Amount:</label>
            <input
              type="number"
              min={0}
              value={creditsConfig.bonusCredits}
              onChange={(e) => handleChangeField('bonusCredits', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
