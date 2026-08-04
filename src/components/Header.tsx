import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, AuthUser, UserStats } from '../types';
import { Video, Sparkles, Settings, CreditCard, ShieldAlert, Zap, Sun, Moon, Laptop, User, LogOut, LogIn, Menu, HelpCircle, Info, Mail, KeyRound, Gift, Bug, Lightbulb, MessageSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  config: AppConfig;
  userStats: UserStats;
  authUser: AuthUser | null;
  supabaseUserRaw?: any;
  isAdmin?: boolean;
  onOpenPricing: () => void;
  onOpenAdmin: () => void;
  onOpenIdeaLab: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
  onOpenAccountProfile: () => void;
  onOpenCreditsUsage: () => void;
  onOpenHowToUse: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  onOpenMyVideos?: () => void;
  onOpenReferrals?: () => void;
  onOpenBilling?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onOpenDownloads?: () => void;
  onOpenSavedProjects?: () => void;
  onOpenLegalPolicies?: (tab?: 'privacy' | 'terms' | 'ai_policy') => void;
  onOpenDeleteAccount?: () => void;
  onOpenRetentionInfo?: () => void;
  onOpenRewardedAd?: () => void;
  onReportBug?: () => void;
  onSuggestFeature?: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  config,
  userStats,
  authUser,
  supabaseUserRaw,
  isAdmin = false,
  onOpenPricing,
  onOpenAdmin,
  onOpenIdeaLab,
  onOpenAuth,
  onSignOut,
  onOpenAccountProfile,
  onOpenCreditsUsage,
  onOpenHowToUse,
  onOpenAbout,
  onOpenContact,
  onOpenMyVideos,
  onOpenReferrals,
  onOpenBilling,
  onOpenNotifications,
  onOpenSettings,
  onOpenDownloads,
  onOpenSavedProjects,
  onOpenLegalPolicies,
  onOpenDeleteAccount,
  onOpenRetentionInfo,
  onOpenRewardedAd,
  onReportBug,
  onSuggestFeature
}) => {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hidden Admin Trigger: 7 consecutive taps on logo
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    const next = logoTapCount + 1;
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);

    if (next >= 7) {
      setLogoTapCount(0);
      onOpenAdmin();
    } else {
      setLogoTapCount(next);
      logoTimerRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, 3000);
    }
  };

  const currentPlanKey = userStats.currentPlan || 'Free';
  const planConfig = config.plans[currentPlanKey] || config.plans.Free;

  const monthlyCredits = userStats.monthlyCredits || planConfig.monthlyCredits || planConfig.maxMonthlyDurationSeconds || 30;
  const usedCredits = userStats.usedCredits !== undefined ? userStats.usedCredits : (userStats.usedMonthlyDurationSeconds || 0);
  const remainingCredits = Math.max(0, monthlyCredits - usedCredits);
  const pct = Math.min(100, Math.round((usedCredits / monthlyCredits) * 100));

  const isLimitReached = usedCredits >= monthlyCredits;

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-slate-950/90 dark:bg-slate-950/90 light:bg-white/90 backdrop-blur-md border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Brand (Hidden Admin Trigger: Tap 7 times) */}
        <div className="flex items-center justify-between">
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
            title="VirJoy AI"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 dark:bg-slate-950 light:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Video className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-100 dark:text-white light:text-slate-900 tracking-tight">VirJoy AI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                  v2.5 Full-Stack
                </span>
              </div>
              <p className="text-xs text-indigo-300 dark:text-indigo-300 light:text-indigo-600 font-medium hidden sm:block">by Rishaan Studio — AI Video Platform</p>
            </div>
          </div>

          {/* Mobile Right Quick Action Group */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenPricing}
              className="text-xs bg-indigo-600/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 font-semibold px-2 py-1.5 rounded-lg border border-indigo-500/30 flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {currentPlanKey}
            </button>
          </div>
        </div>

        {/* Center/Right Controls & Single Auth / 3-Dot Entry Point */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-4">
          {/* Theme Selector */}
          <div className="flex items-center bg-slate-900 dark:bg-slate-900 light:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 p-1 rounded-xl">
            <button
              onClick={() => setTheme('dark')}
              title="Dark Mode (Premium Default)"
              className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                theme === 'dark'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('light')}
              title="Light Mode"
              className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                theme === 'light'
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              title="System Preference Mode"
              className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                theme === 'system'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Monthly Credits Usage Bar */}
          <div
            onClick={onOpenCreditsUsage}
            className="cursor-pointer group bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100/90 hover:bg-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-300 px-3 py-1.5 rounded-xl flex flex-col min-w-[170px] sm:min-w-[210px] transition-all"
          >
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium flex items-center gap-1">
                <Zap className={`w-3 h-3 ${isLimitReached ? 'text-rose-400' : 'text-amber-400'}`} />
                Monthly Credits
              </span>
              <span className={`font-bold ${isLimitReached ? 'text-rose-400' : 'text-indigo-400'}`}>
                {remainingCredits} / {monthlyCredits} Left
              </span>
            </div>
            <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-slate-300 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isLimitReached
                    ? 'bg-rose-500'
                    : pct > 80
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-indigo-500 to-amber-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {isLimitReached && (
              <span className="text-[10px] text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 inline" /> 0 Credits Left — Upgrade Plan
              </span>
            )}
          </div>

          {/* Action Buttons & Auth Account / Three-Dot Menu Area */}
          <div className="flex items-center gap-2 relative" ref={menuRef}>
            {/* ₹799 Exclusive Idea Lab Button */}
            <button
              onClick={onOpenIdeaLab}
              className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-800/60 hover:to-indigo-800/60 text-purple-200 dark:text-purple-200 light:text-purple-900 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
              <span className="hidden xl:inline">AI Idea Lab</span>
              <span className="bg-purple-500/20 text-purple-300 dark:text-purple-300 light:text-purple-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                ₹799
              </span>
            </button>

            {/* Refer & Earn Free Credits Button */}
            {onOpenReferrals && (
              <button
                onClick={onOpenReferrals}
                className="bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden lg:inline">Refer & Earn</span>
              </button>
            )}

            {/* Plan Badge & Upgrade */}
            <button
              onClick={onOpenPricing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{currentPlanKey}</span>
            </button>

            {/* AUTHENTICATED OR UNAUTHENTICATED HEADER ENTRY POINT */}
            <div className="flex items-center gap-1.5 relative">
              {authUser ? (
                /* User Avatar Button */
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  title="User Profile & Account"
                  className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-amber-400 p-0.5 shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                >
                  <div className="w-full h-full bg-slate-950 dark:bg-slate-950 light:bg-slate-900 rounded-[10px] flex items-center justify-center text-xs font-extrabold text-amber-300">
                    {authUser.name ? authUser.name.charAt(0).toUpperCase() : authUser.email.charAt(0).toUpperCase()}
                  </div>
                </button>
              ) : (
                /* Single Header Sign In / Sign Up Entry Point */
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-300" />
                  <span>Sign In / Sign Up</span>
                </button>
              )}

              {/* Professional Three-Line Navigation Menu Control */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Navigation Menu (☰)"
                className="p-2 text-slate-300 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300 transition-all cursor-pointer"
              >
                <Menu className="w-4 h-4 text-indigo-400" />
              </button>

              {/* PROFESSIONAL THREE-LINE DROPDOWN MENU */}
              {isMenuOpen && (
                <div className="absolute right-0 top-11 w-64 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-2.5 shadow-2xl z-50 animate-fade-in text-slate-200">
                  {/* User / Plan Summary Header */}
                  <div className="p-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 mb-1.5">
                    <p className="text-xs font-bold text-white dark:text-white light:text-slate-900 truncate">
                      {authUser ? (authUser.name || 'VirJoy Creator') : 'VirJoy Guest Creator'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {authUser ? authUser.email : 'Sign in to sync your videos'}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-extrabold">{currentPlanKey} Plan</span>
                      <span className="text-indigo-300 font-bold">{remainingCredits} Credits Available</span>
                    </div>
                  </div>

                  {/* Option 1: Sign In / Sign Out */}
                  {!authUser ? (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAuth('signin');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-400 hover:bg-indigo-950/40 dark:hover:bg-indigo-950/40 light:hover:bg-indigo-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <LogIn className="w-4 h-4 text-amber-400" />
                      <span>Sign In / Sign Up</span>
                    </button>
                  ) : null}

                  {/* Option 2: Account / Profile */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (authUser) {
                        onOpenAccountProfile();
                      } else {
                        onOpenAuth('signin');
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Account & Profile</span>
                  </button>

                  {/* Option 3: Current Plan & Credits */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCreditsUsage();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Credits & Usage ({remainingCredits} Left)</span>
                  </button>

                  {/* Option 4: Subscription / Plan */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenPricing();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    <span>Subscription & Plan ({currentPlanKey})</span>
                  </button>

                  {/* Option 5: Refer & Earn Hub */}
                  {onOpenReferrals && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenReferrals();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>Refer & Earn Free Credits</span>
                    </button>
                  )}

                  {/* Option 6: Billing & Payment History */}
                  {onOpenBilling && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenBilling();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Billing & Payment History</span>
                    </button>
                  )}

                  {/* Option 7: Notifications */}
                  {onOpenNotifications && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenNotifications();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Notifications</span>
                    </button>
                  )}

                  {/* Option 8: Downloads */}
                  {onOpenDownloads && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenDownloads();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Video className="w-4 h-4 text-indigo-400" />
                      <span>Downloads</span>
                    </button>
                  )}

                  {/* Option 9: Saved Projects */}
                  {onOpenSavedProjects && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSavedProjects();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>Saved Projects</span>
                    </button>
                  )}

                  {/* Option 10: 24h Auto Retention Info */}
                  {onOpenRetentionInfo && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenRetentionInfo();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-950/30 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>24h Auto Retention Policy</span>
                    </button>
                  )}

                  {/* Option 11: Settings */}
                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </button>
                  )}

                  {/* Feedback: Report Bug */}
                  {onReportBug && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onReportBug();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Bug className="w-4 h-4 text-rose-400" />
                      <span>Report Bug</span>
                    </button>
                  )}

                  {/* Feedback: Suggest Feature */}
                  {onSuggestFeature && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSuggestFeature();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-300 hover:bg-indigo-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-300" />
                      <span>Suggest Feature</span>
                    </button>
                  )}

                  {/* Option 12: Legal Policies (Privacy, Terms, AI Policy) */}
                  {onOpenLegalPolicies && (
                    <>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenLegalPolicies('privacy');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        <span>Privacy Policy</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenLegalPolicies('terms');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                        <span>Terms & Conditions</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenLegalPolicies('ai_policy');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>AI Usage Policy</span>
                      </button>
                    </>
                  )}

                  {/* Option 13: Watch Ad for Bonus Credits */}
                  {onOpenRewardedAd && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenRewardedAd();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-amber-400 hover:bg-amber-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Earn Free Credits (Watch Ad)</span>
                    </button>
                  )}

                  {/* Option 14: How to Use */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHowToUse();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                    <span>How to Use VirJoy AI</span>
                  </button>

                  {/* Option 15: Contact Support */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenContact();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span>Contact Support</span>
                  </button>

                  {/* Option 16: About VirJoy AI */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAbout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Info className="w-4 h-4 text-purple-400" />
                    <span>About VirJoy AI</span>
                  </button>

                  {authUser && (
                    <>
                      <div className="my-1.5 border-t border-slate-800 dark:border-slate-800 light:border-slate-200" />

                      {/* Option 17: Delete Account */}
                      {onOpenDeleteAccount && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenDeleteAccount();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                          <span>Delete Account</span>
                        </button>
                      )}

                      {/* Option 18: Sign Out */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 dark:hover:bg-rose-950/40 light:hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});
