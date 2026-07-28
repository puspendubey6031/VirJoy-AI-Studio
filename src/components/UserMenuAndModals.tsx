import React from 'react';
import { AuthUser, AppConfig, UserStats } from '../types';
import { X, User, Zap, HelpCircle, Info, Mail, CheckCircle2, ShieldAlert, CreditCard, ExternalLink, Sparkles } from 'lucide-react';

interface AccountProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  supabaseUserRaw?: any;
  userStats: UserStats;
  config: AppConfig;
  onOpenPricing: () => void;
}

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({
  isOpen,
  onClose,
  authUser,
  supabaseUserRaw,
  userStats,
  config,
  onOpenPricing
}) => {
  if (!isOpen) return null;

  const currentPlanKey = userStats.currentPlan || 'Free';
  const planConfig = config.plans[currentPlanKey] || config.plans.Free;

  const monthlyCredits = userStats.monthlyCredits || planConfig.monthlyCredits || planConfig.maxMonthlyDurationSeconds || 30;
  const usedCredits = userStats.usedCredits !== undefined ? userStats.usedCredits : (userStats.usedMonthlyDurationSeconds || 0);
  const remainingCredits = Math.max(0, monthlyCredits - usedCredits);

  const phoneNum = authUser?.phone || supabaseUserRaw?.phone || supabaseUserRaw?.user_metadata?.mobile_number || 'Not Linked';
  const isEmailVerified = Boolean(authUser?.emailVerified || supabaseUserRaw?.email_confirmed_at || supabaseUserRaw?.confirmed_at);
  const isPhoneVerified = Boolean(authUser?.phoneVerified || supabaseUserRaw?.phone_confirmed_at || supabaseUserRaw?.user_metadata?.mobile_verified);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-amber-400 flex items-center justify-center text-xl font-extrabold text-white shadow-lg">
            {authUser?.name ? authUser.name.charAt(0).toUpperCase() : (authUser?.email ? authUser.email.charAt(0).toUpperCase() : 'U')}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Account & Profile</h3>
            <p className="text-xs text-slate-400">VirJoy AI Verified User Account</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* User Credentials */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Full Name:</span>
              <span className="font-bold text-white">{authUser?.name || 'VirJoy Creator'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Email Address:</span>
              <span className="font-semibold text-indigo-300 truncate max-w-[180px]">{authUser?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Mobile Number:</span>
              <span className="font-semibold text-slate-200">{phoneNum}</span>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verification Badges</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">Email Verification</span>
              {isEmailVerified ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Pending</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">Mobile OTP Verification</span>
              {isPhoneVerified ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Pending</span>
              )}
            </div>
          </div>

          {/* Plan & Credits Info */}
          <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 p-3.5 rounded-2xl border border-indigo-500/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Current Plan:
              </span>
              <span className="font-extrabold text-amber-400 text-sm">{currentPlanKey} Plan</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Available Credits:
              </span>
              <span className="font-extrabold text-indigo-300 text-sm">{remainingCredits} / {monthlyCredits} Credits</span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 border-t border-indigo-500/20">
              Rule: 1 Second Video = 1 Credit. Standard duration caps apply per plan.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenPricing();
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer text-center"
          >
            Upgrade Plan & Credits
          </button>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface CreditsUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  config: AppConfig;
  onOpenPricing: () => void;
}

export const CreditsUsageModal: React.FC<CreditsUsageModalProps> = ({
  isOpen,
  onClose,
  userStats,
  config,
  onOpenPricing
}) => {
  if (!isOpen) return null;

  const currentPlanKey = userStats.currentPlan || 'Free';
  const planConfig = config.plans[currentPlanKey] || config.plans.Free;

  const monthlyCredits = userStats.monthlyCredits || planConfig.monthlyCredits || planConfig.maxMonthlyDurationSeconds || 30;
  const usedCredits = userStats.usedCredits !== undefined ? userStats.usedCredits : (userStats.usedMonthlyDurationSeconds || 0);
  const remainingCredits = Math.max(0, monthlyCredits - usedCredits);
  const pct = Math.min(100, Math.round((usedCredits / monthlyCredits) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Credits & Usage Overview</h3>
            <p className="text-xs text-slate-400">VirJoy AI Credit System</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Available Monthly Balance:</span>
              <span className="font-extrabold text-amber-400 text-sm">{remainingCredits} Credits Left</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>{usedCredits} Used</span>
              <span>{monthlyCredits} Total Allocation ({currentPlanKey} Plan)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-white block mb-1">Credit Usage Calculator:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">10s Video:</span>
                <span className="font-bold text-indigo-300">10 Credits</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">30s Video:</span>
                <span className="font-bold text-indigo-300">30 Credits</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">60s Video:</span>
                <span className="font-bold text-indigo-300">60 Credits</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">300s (5m) Video:</span>
                <span className="font-bold text-indigo-300">300 Credits</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenPricing();
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer text-center"
          >
            Upgrade / Buy Credits
          </button>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close guide"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">How to Use VirJoy AI</h3>
            <p className="text-xs text-slate-400">Step-by-step Video Creation Guide</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">1</div>
            <div>
              <h4 className="font-bold text-white text-sm">Describe Your Idea or Paste Product URL</h4>
              <p className="text-slate-400 mt-0.5">Type a text prompt describing your commercial, attach media images/clips, or paste an Amazon product URL for auto-extraction.</p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">2</div>
            <div>
              <h4 className="font-bold text-white text-sm">Select Video Duration & Format</h4>
              <p className="text-slate-400 mt-0.5">Choose video length from 10s up to 5 minutes (300s). Each 1 second = 1 credit. Pick 16:9, 9:16 reels, or 1:1 square ratio.</p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">3</div>
            <div>
              <h4 className="font-bold text-white text-sm">AI Video Commercial Rendering</h4>
              <p className="text-slate-400 mt-0.5">VirJoy AI generates scene breakdown, script, synthetic voiceover narration, sound effects, and visual composition automatically.</p>
            </div>
          </div>

          <div className="flex gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">4</div>
            <div>
              <h4 className="font-bold text-white text-sm">Timeline Editor & Download</h4>
              <p className="text-slate-400 mt-0.5">Preview scenes in Video Studio Player, adjust voiceover settings in Timeline Editor, and download your finished commercial.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
        >
          Got It, Let's Create!
        </button>
      </div>
    </div>
  );
};

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-amber-400 p-0.5 mx-auto mb-3 shadow-xl">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h3 className="text-xl font-black text-white">VirJoy AI</h3>
          <p className="text-xs text-indigo-400 font-extrabold mt-0.5">by Rishaan Studio</p>
          <span className="inline-block bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-2 border border-slate-700">
            Version 2.5 Full-Stack Commercial Engine
          </span>
        </div>

        <div className="mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            VirJoy AI is a state-of-the-art AI Video Commercial platform created by <strong>Rishaan Studio</strong>.
          </p>
          <p>
            Designed to produce high-performing video ads, product promos, and social media reels from simple text prompts, uploaded media assets, or Amazon product links.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Contact & Support</h3>
            <p className="text-xs text-slate-400">Rishaan Studio VirJoy AI Support</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-1 font-semibold">Official Support Email:</span>
            <a href="mailto:support@rishaanstudio.com" className="text-indigo-400 font-bold text-sm hover:underline flex items-center gap-1">
              support@rishaanstudio.com <ExternalLink className="w-3.5 h-3.5 inline" />
            </a>
          </div>
          <div>
            <span className="text-slate-400 block mb-1 font-semibold">Studio:</span>
            <span className="text-white font-medium">Rishaan Studio</span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            For inquiry regarding commercial API usage, enterprise video limits, billing, or custom voiceovers, reach out directly to our support desk.
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
