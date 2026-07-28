import React, { useState, useEffect } from 'react';
import { AppConfig, AuthUser, PlanKey, UserStats, VideoProject, VideoProjectInputs, Scene } from './types';
import { supabase } from './lib/supabaseClient';
import { Header } from './components/Header';
import { MultiModalInput } from './components/MultiModalInput';
import { VideoStudioPlayer } from './components/VideoStudioPlayer';
import { GenerationsHistory } from './components/GenerationsHistory';
import { AuthModal } from './components/AuthModal';
import { AuthVerificationGate } from './components/AuthVerificationGate';
import { TimelineEditor } from './components/TimelineEditor';
import { PlanPricingModal } from './components/PlanPricingModal';
import { IdeaToVideoModal } from './components/IdeaToVideoModal';
import { AdminConfigModal } from './components/AdminConfigModal';
import { AdBanner } from './components/AdBanner';
import {
  AccountProfileModal,
  CreditsUsageModal,
  HowToUseModal,
  AboutModal,
  ContactModal
} from './components/UserMenuAndModals';
import { defaultConfig } from './server/configStore';
import { AlertTriangle, Sparkles, ShieldCheck, Zap, X } from 'lucide-react';

const demoProject: VideoProject = {
  id: 'proj_demo_1',
  title: 'Futuristic Cyberpunk Neon Cityscape',
  prompt: 'Cinematic drone shot of a futuristic cyberpunk city with neon lights and flying vehicles',
  inputs: { textPrompt: 'Cinematic drone shot of a futuristic cyberpunk city with neon lights' },
  aspectRatio: '16:9',
  totalDurationSeconds: 12,
  language: 'en-US',
  voice: 'en-US-Standard-A',
  voiceTone: 'Professional',
  scenes: [
    {
      id: 'scene_1',
      title: 'Neon Skyscraper Horizon',
      duration: 4,
      narration: 'Soar through shimmering towers in a hyper-technological metropolis.',
      caption: 'Beneath the neon glow of futuristic spires.',
      visualPrompt: 'Cyberpunk Skyscrapers with hologram billboards',
      bgGradient: 'from-violet-900 to-indigo-950'
    },
    {
      id: 'scene_2',
      title: 'Aerial Traffic Arteries',
      duration: 4,
      narration: 'Autonomous transit streams weave across multi-tiered skyways.',
      caption: 'Speeding light trails across airborne sky-lanes.',
      visualPrompt: 'Flying car stream with light trails',
      bgGradient: 'from-indigo-900 to-purple-950'
    },
    {
      id: 'scene_3',
      title: 'Central Core Nexus',
      duration: 4,
      narration: 'Experience the pulsing energy of VirJoy AI automated video rendering.',
      caption: 'Powered by VirJoy AI high-speed video engine.',
      visualPrompt: 'Quantum AI core pulsing with energy',
      bgGradient: 'from-purple-900 to-slate-950'
    }
  ],
  status: 'completed',
  planUsed: 'Free',
  watermarked: true,
  exportQuality: '720p',
  shareUrl: '/share/proj_demo_1',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000).toISOString()
};

export default function App() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);

  // Authentication State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [supabaseUserRaw, setSupabaseUserRaw] = useState<any>(null);

  const syncSupabaseSessionUser = (u: any) => {
    setSupabaseUserRaw(u);
    if (!u) {
      setAuthUser(null);
      return;
    }
    const userObj: AuthUser = {
      id: u.id,
      email: u.email || '',
      name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'VirJoy Creator',
      phone: u.phone || u.user_metadata?.mobile_number,
      emailVerified: Boolean(u.email_confirmed_at || u.confirmed_at || u.user_metadata?.email_verified),
      phoneVerified: Boolean(u.phone_confirmed_at || u.user_metadata?.mobile_verified || u.user_metadata?.phone_verified),
      provider: 'email',
      createdAt: u.created_at
    };
    setAuthUser(userObj);

    fetch('/api/user/sync-supabase-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseUid: u.id,
        email: u.email,
        fullName: userObj.name
      })
    }).catch(err => console.warn('Sync user error:', err));
  };

  // Restore Supabase Auth session and listen for auth state changes
  useEffect(() => {
    if (!supabase) return;

    // Restore active session on page refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSupabaseSessionUser(session?.user || null);
    });

    // Listen for real-time auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSupabaseSessionUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [userStats, setUserStats] = useState<UserStats>({
    userId: 'demo-user-1',
    currentPlan: 'Free',
    usedCredits: 0,
    monthlyCredits: 30,
    remainingCredits: 30,
    usedMonthlyDurationSeconds: 0,
    history: [
      {
        projectId: demoProject.id,
        title: demoProject.title,
        durationSeconds: demoProject.totalDurationSeconds,
        creditsUsed: 12,
        createdAt: demoProject.createdAt,
        aspectRatio: demoProject.aspectRatio,
        exportQuality: demoProject.exportQuality,
        status: 'completed',
        projectData: demoProject
      }
    ]
  });

  const [activeProject, setActiveProject] = useState<VideoProject | null>(demoProject);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorNotice, setErrorNotice] = useState<{ title: string; message: string; requiredPlan?: string } | null>(null);

  // Modals
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [pricingUpgradeMessage, setPricingUpgradeMessage] = useState<string | undefined>(undefined);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isIdeaLabOpen, setIsIdeaLabOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'signin' | 'signup'>('signin');

  // Menu Modals
  const [isAccountProfileOpen, setIsAccountProfileOpen] = useState(false);
  const [isCreditsUsageOpen, setIsCreditsUsageOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleSignIn = (user: AuthUser) => {
    setAuthUser(user);
    setUserStats(prev => ({
      ...prev,
      userId: user.id
    }));
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    if (sessionGateState === 'email_unverified' || sessionGateState === 'mobile_unverified') {
      setIsVerificationModalOpen(true);
      return;
    }
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const checkProtectedAccess = (): boolean => {
    if (sessionGateState === 'authenticated') {
      return true;
    }
    if (sessionGateState === 'unauthenticated') {
      handleOpenAuth('signin');
    } else {
      setIsVerificationModalOpen(true);
    }
    return false;
  };

  const handleOpenPricingWithMessage = (msg?: string) => {
    setPricingUpgradeMessage(msg);
    setIsPricingOpen(true);
  };

  // Fetch initial configuration & user stats from backend API
  const fetchConfigAndStats = async () => {
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/user/stats')
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.user) {
          setUserStats(prev => ({
            ...prev,
            userId: statsData.user.userId || prev.userId,
            currentPlan: statsData.user.currentPlan || prev.currentPlan,
            usedMonthlyDurationSeconds: statsData.user.usedMonthlyDurationSeconds || 0,
            usedCredits: statsData.user.usedCredits !== undefined ? statsData.user.usedCredits : (statsData.user.usedMonthlyDurationSeconds || 0),
            monthlyCredits: statsData.user.monthlyCredits || prev.monthlyCredits,
            remainingCredits: statsData.user.remainingCredits !== undefined ? statsData.user.remainingCredits : prev.remainingCredits,
            history: statsData.user.history && statsData.user.history.length > 0 ? statsData.user.history : prev.history
          }));
        }
      }
    } catch (e) {
      console.warn('API fetch error, using local fallback:', e);
    }
  };

  useEffect(() => {
    fetchConfigAndStats();
  }, []);

  // Update System Configuration with x-admin-key Authorization
  const handleUpdateConfig = async (newConfig: AppConfig, adminKey?: string) => {
    setConfig(newConfig);
    try {
      await fetch('/api/config/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey || ''
        },
        body: JSON.stringify(newConfig)
      });
      fetchConfigAndStats();
    } catch (e) {
      console.warn('Failed to persist config to server:', e);
    }
  };

  // Switch Plan
  const handleSelectPlan = async (planKey: PlanKey) => {
    if (!checkProtectedAccess()) {
      setIsPricingOpen(false);
      return;
    }
    try {
      const res = await fetch('/api/user/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey })
      });
      const data = await res.json();
      if (data.success) {
        setUserStats(prev => ({ ...prev, currentPlan: planKey }));
        setErrorNotice(null);
        fetchConfigAndStats();
      }
    } catch (e) {
      console.warn('Failed to update plan:', e);
    }
  };

  // Reset User Monthly Credit Count
  const handleResetCredits = async () => {
    try {
      await fetch('/api/user/credits/reset', { method: 'POST' });
      setUserStats(prev => ({ ...prev, usedMonthlyDurationSeconds: 0, usedCredits: 0 }));
      setErrorNotice(null);
    } catch (e) {
      console.warn('Failed to reset credits:', e);
    }
  };

  // Generate Video Handler (Calls /api/video/plan and /api/video/render with plan limit checks)
  const handleGenerateVideo = async (options: {
    prompt: string;
    targetDurationSeconds: number;
    aspectRatio: '16:9' | '9:16' | '1:1';
    inputs: VideoProjectInputs;
  }) => {
    if (!checkProtectedAccess()) {
      return;
    }
    setIsGenerating(true);
    setErrorNotice(null);

    try {
      // Step 1: Plan Scenes using Gemini AI
      const planRes = await fetch('/api/video/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: options.prompt,
          targetDurationSeconds: options.targetDurationSeconds,
          aspectRatio: options.aspectRatio,
          inputs: options.inputs,
          planKey: userStats.currentPlan
        })
      });

      const planData = await planRes.json();
      if (!planData.success || !planData.scenes) {
        throw new Error(planData.error || 'Failed to generate video scene breakdown');
      }

      // Step 2: Render & Finalize Project
      const renderRes = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `VirJoy - ${options.prompt.substring(0, 25)}`,
          prompt: options.prompt,
          inputs: options.inputs,
          aspectRatio: options.aspectRatio,
          scenes: planData.scenes,
          planKey: userStats.currentPlan
        })
      });

      const renderData = await renderRes.json();

      if (!renderRes.ok) {
        if (renderData.error === 'MONTHLY_CREDIT_EXHAUSTED' || renderData.error === 'DURATION_LIMIT_EXCEEDED') {
          setErrorNotice({
            title: 'Monthly Credit Limit Reached',
            message: renderData.message,
            requiredPlan: renderData.requiredPlan || '₹199'
          });
          setIsPricingOpen(true);
          return;
        }
        throw new Error(renderData.message || renderData.error || 'Video render failed');
      }

      if (renderData.success && renderData.project) {
        const proj = renderData.project;
        setActiveProject(proj);

        // Add to History
        const historyItem = {
          projectId: proj.id,
          title: proj.title,
          durationSeconds: proj.totalDurationSeconds,
          creditsUsed: proj.totalDurationSeconds,
          createdAt: proj.createdAt,
          aspectRatio: proj.aspectRatio,
          exportQuality: proj.exportQuality,
          status: 'completed',
          projectData: proj
        };

        setUserStats(prev => ({
          ...prev,
          usedMonthlyDurationSeconds: renderData.userUsage?.usedMonthlySeconds ?? prev.usedMonthlyDurationSeconds,
          history: [historyItem, ...(prev.history || [])]
        }));
      }
    } catch (e: any) {
      console.error('Video generation error:', e);
      setErrorNotice({
        title: 'Video Creation Issue',
        message: e?.message || 'An error occurred during video creation. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate From Idea-To-Video Workflow (₹799 Plan Assistant)
  const handleGenerateFromIdea = async (data: {
    prompt: string;
    targetDurationSeconds: number;
    aspectRatio: '16:9' | '9:16' | '1:1';
    inputs: VideoProjectInputs;
    scenes: Scene[];
  }) => {
    if (!checkProtectedAccess()) {
      setIsIdeaLabOpen(false);
      return;
    }
    setIsGenerating(true);
    setErrorNotice(null);

    try {
      const renderRes = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Viral Idea: ${data.inputs.ideaConcept?.substring(0, 20) || 'AI Video'}`,
          prompt: data.prompt,
          inputs: data.inputs,
          aspectRatio: data.aspectRatio,
          scenes: data.scenes,
          planKey: userStats.currentPlan
        })
      });

      const renderData = await renderRes.json();

      if (!renderRes.ok) {
        setErrorNotice({
          title: 'Credit Limit Reached',
          message: renderData.message,
          requiredPlan: renderData.requiredPlan
        });
        setIsPricingOpen(true);
        return;
      }

      if (renderData.success && renderData.project) {
        const proj = renderData.project;
        setActiveProject(proj);

        const historyItem = {
          projectId: proj.id,
          title: proj.title,
          durationSeconds: proj.totalDurationSeconds,
          creditsUsed: proj.totalDurationSeconds,
          createdAt: proj.createdAt,
          aspectRatio: proj.aspectRatio,
          exportQuality: proj.exportQuality,
          status: 'completed',
          projectData: proj
        };

        setUserStats(prev => ({
          ...prev,
          usedMonthlyDurationSeconds: renderData.userUsage?.usedMonthlySeconds ?? prev.usedMonthlyDurationSeconds,
          history: [historyItem, ...(prev.history || [])]
        }));
      }
    } catch (e: any) {
      setErrorNotice({
        title: 'Idea Render Error',
        message: e?.message || 'Failed to render project from idea workflow.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Update project scenes from Timeline Editor
  const handleUpdateProjectScenes = (updatedScenes: Scene[]) => {
    if (!activeProject) return;
    const newTotalDuration = updatedScenes.reduce((acc, s) => acc + (s.duration || 4), 0);
    setActiveProject(prev => prev ? {
      ...prev,
      scenes: updatedScenes,
      totalDurationSeconds: newTotalDuration
    } : null);
  };

  // Handle selecting a project from Generations History
  const handleSelectHistoryProject = (item: any) => {
    if (item.projectData) {
      setActiveProject(item.projectData);
    } else {
      // Fallback rebuild project shell if projectData not stored
      const rebuilt: VideoProject = {
        id: item.projectId,
        title: item.title,
        prompt: item.title,
        inputs: { textPrompt: item.title },
        aspectRatio: item.aspectRatio || '16:9',
        totalDurationSeconds: item.durationSeconds || 12,
        language: 'en-US',
        voice: 'en-US-Standard-A',
        voiceTone: 'Professional',
        scenes: demoProject.scenes,
        status: 'completed',
        planUsed: userStats.currentPlan,
        watermarked: userStats.currentPlan === 'Free',
        exportQuality: item.exportQuality || '720p',
        shareUrl: `/share/${item.projectId}`,
        createdAt: item.createdAt || new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
      setActiveProject(rebuilt);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Session Access Rules: Valid Session + Verified Email + Verified Mobile = Access
  const isSessionValid = Boolean(authUser);
  const isEmailVerified = Boolean(
    supabaseUserRaw?.email_confirmed_at ||
    supabaseUserRaw?.confirmed_at ||
    supabaseUserRaw?.user_metadata?.email_verified ||
    authUser?.emailVerified
  );
  const isMobileVerified = Boolean(
    supabaseUserRaw?.phone_confirmed_at ||
    supabaseUserRaw?.user_metadata?.mobile_verified ||
    supabaseUserRaw?.user_metadata?.phone_verified ||
    authUser?.phoneVerified
  );

  let sessionGateState: 'authenticated' | 'unauthenticated' | 'email_unverified' | 'mobile_unverified' = 'unauthenticated';

  if (!isSessionValid) {
    sessionGateState = 'unauthenticated';
  } else if (!isEmailVerified) {
    sessionGateState = 'email_unverified';
  } else if (!isMobileVerified) {
    sessionGateState = 'mobile_unverified';
  } else {
    sessionGateState = 'authenticated';
  }

  useEffect(() => {
    if (sessionGateState === 'email_unverified' || sessionGateState === 'mobile_unverified') {
      setIsVerificationModalOpen(true);
    } else if (sessionGateState === 'authenticated') {
      setIsVerificationModalOpen(false);
    }
  }, [sessionGateState]);

  const isAdmin = Boolean(
    authUser?.isAdmin ||
    authUser?.role === 'admin' ||
    authUser?.email?.toLowerCase() === 'admin@virjoy.ai' ||
    authUser?.email?.toLowerCase() === 'admin@rishaan.com' ||
    supabaseUserRaw?.user_metadata?.role === 'admin' ||
    supabaseUserRaw?.user_metadata?.isAdmin === true
  );

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-12 flex flex-col transition-colors duration-200">
      {/* Header */}
      <Header
        config={config}
        userStats={userStats}
        authUser={authUser}
        supabaseUserRaw={supabaseUserRaw}
        isAdmin={isAdmin}
        onOpenPricing={() => {
          if (!checkProtectedAccess()) return;
          setIsPricingOpen(true);
        }}
        onOpenAdmin={() => {
          setIsAdminOpen(true);
        }}
        onOpenIdeaLab={() => {
          if (!checkProtectedAccess()) return;
          setIsIdeaLabOpen(true);
        }}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
        onOpenAccountProfile={() => {
          if (!checkProtectedAccess()) return;
          setIsAccountProfileOpen(true);
        }}
        onOpenCreditsUsage={() => {
          if (!checkProtectedAccess()) return;
          setIsCreditsUsageOpen(true);
        }}
        onOpenHowToUse={() => setIsHowToUseOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenMyVideos={() => {
          const historySection = document.getElementById('generations-history-section');
          if (historySection) {
            historySection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 flex-1 w-full space-y-6">
        {/* Top Sponsored AdSense Placement */}
        <AdBanner
          placement="headerBanner"
          config={config}
          currentPlan={userStats.currentPlan}
          onOpenPricing={() => {
            if (!checkProtectedAccess()) return;
            setIsPricingOpen(true);
          }}
        />

        {/* Error / Credit Limit Alert Banner */}
        {errorNotice && (
          <div className="bg-rose-950/80 dark:bg-rose-950/80 light:bg-rose-100 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 dark:text-rose-400 light:text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-rose-200 dark:text-rose-200 light:text-rose-900">{errorNotice.title}</h4>
                <p className="text-xs text-rose-300/90 dark:text-rose-300/90 light:text-rose-800 mt-0.5">{errorNotice.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!checkProtectedAccess()) return;
                  setIsPricingOpen(true);
                }}
                className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow cursor-pointer shrink-0"
              >
                Upgrade to {errorNotice.requiredPlan || '₹199'} Plan
              </button>
            </div>
          </div>
        )}

        {/* Hero Concept Intro */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/60 dark:from-slate-900 dark:via-indigo-950/60 dark:to-purple-950/60 light:from-white light:via-indigo-50 light:to-purple-50 border border-slate-800 dark:border-slate-800 light:border-indigo-100 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-2xl transition-colors">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs text-indigo-300 dark:text-indigo-300 light:text-indigo-700 font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> VirJoy AI SaaS Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 dark:text-white light:text-slate-900 tracking-tight leading-tight">
              Turn Prompts, Images & Product URLs into Production Videos
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 mt-2 leading-relaxed">
              Fully prompt-driven AI video studio. Support multi-modal text, images, video clips, and Amazon product URLs. Subject to monthly duration & entitlement rules.
            </p>
          </div>
        </div>

        {/* Main Grid: MultiModal Creator Studio & Video Player */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Creator Input Studio (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <MultiModalInput
              config={config}
              userStats={userStats}
              currentPlan={userStats.currentPlan}
              isGenerating={isGenerating}
              onGenerate={handleGenerateVideo}
              onOpenPricing={handleOpenPricingWithMessage}
              onCheckProtectedAccess={checkProtectedAccess}
            />

            {/* Generations History Component */}
            <GenerationsHistory
              history={userStats.history || []}
              activeProjectId={activeProject?.id}
              onSelectProject={handleSelectHistoryProject}
              onOpenPricing={() => {
                if (!checkProtectedAccess()) return;
                setIsPricingOpen(true);
              }}
            />

            {/* Sidebar Ad Banner */}
            <AdBanner
              placement="sidebarRect"
              config={config}
              currentPlan={userStats.currentPlan}
              onOpenPricing={() => handleOpenPricingWithMessage()}
            />
          </div>

          {/* Right Column: Live Video Canvas Player & Project Output (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            <VideoStudioPlayer
              project={activeProject}
              onOpenTimelineEditor={() => {
                if (!checkProtectedAccess()) return;
                setIsTimelineOpen(true);
              }}
              onOpenPricing={() => handleOpenPricingWithMessage()}
            />
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      {/* Auth Verification Modal Popup */}
      {isVerificationModalOpen && sessionGateState !== 'authenticated' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-2 shadow-2xl">
            <button
              onClick={() => setIsVerificationModalOpen(false)}
              className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
              title="Close verification dialog"
            >
              <X className="w-4 h-4" />
            </button>
            <AuthVerificationGate
              sessionState={sessionGateState}
              userEmail={authUser?.email || supabaseUserRaw?.email}
              userPhone={authUser?.phone || supabaseUserRaw?.phone || supabaseUserRaw?.user_metadata?.mobile_number}
              onOpenAuth={(mode) => {
                setIsVerificationModalOpen(false);
                handleOpenAuth(mode);
              }}
              onSignOut={() => {
                setIsVerificationModalOpen(false);
                handleSignOut();
              }}
              onVerifiedComplete={async () => {
                if (supabase) {
                  const { data: { session } } = await supabase.auth.getSession();
                  syncSupabaseSessionUser(session?.user || null);
                }
                setIsVerificationModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignIn={handleSignIn}
        initialMode={authModalInitialMode}
      />

      <PlanPricingModal
        isOpen={isPricingOpen}
        onClose={() => {
          setIsPricingOpen(false);
          setPricingUpgradeMessage(undefined);
        }}
        config={config}
        currentPlan={userStats.currentPlan}
        onSelectPlan={handleSelectPlan}
        onOpenAdmin={() => setIsAdminOpen(true)}
        upgradeMessage={pricingUpgradeMessage}
      />

      <IdeaToVideoModal
        isOpen={isIdeaLabOpen}
        onClose={() => setIsIdeaLabOpen(false)}
        config={config}
        currentPlan={userStats.currentPlan}
        onGenerateFromIdea={handleGenerateFromIdea}
        onOpenPricing={() => {
          setIsIdeaLabOpen(false);
          setIsPricingOpen(true);
        }}
      />

      <AdminConfigModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onResetCredits={handleResetCredits}
        isAdmin={isAdmin}
      />

      <TimelineEditor
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        project={activeProject}
        onUpdateProjectScenes={handleUpdateProjectScenes}
      />

      <AccountProfileModal
        isOpen={isAccountProfileOpen}
        onClose={() => setIsAccountProfileOpen(false)}
        authUser={authUser}
        supabaseUserRaw={supabaseUserRaw}
        userStats={userStats}
        config={config}
        onOpenPricing={() => {
          setIsAccountProfileOpen(false);
          setIsPricingOpen(true);
        }}
      />

      <CreditsUsageModal
        isOpen={isCreditsUsageOpen}
        onClose={() => setIsCreditsUsageOpen(false)}
        userStats={userStats}
        config={config}
        onOpenPricing={() => {
          setIsCreditsUsageOpen(false);
          setIsPricingOpen(true);
        }}
      />

      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 lg:px-8 mt-12 text-center text-xs text-slate-500 border-t border-slate-900 pt-6">
        <p className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>VirJoy AI — Production AI Video Platform. 24h retention cleanup active.</span>
        </p>
      </footer>
    </div>
  );
}

