import React, { useState } from 'react';
import { AppConfig, OnboardingConfig, OnboardingStep } from '../../types';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Image,
  Eye,
  CheckCircle2,
  Edit3,
  Layers,
  Palette
} from 'lucide-react';

interface OnboardingManagerTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const OnboardingManagerTab: React.FC<OnboardingManagerTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [onboarding, setOnboarding] = useState<OnboardingConfig>(() => {
    return config.onboardingConfig || {
      enabled: true,
      title: 'Welcome to VirJoy AI Studio',
      subtitle: 'Master AI video creation, custom graphic design, neural voices, and earnings in 7 simple steps.',
      themeColor: '#6366f1',
      gradientFrom: '#4f46e5',
      gradientTo: '#9333ea',
      skipButtonText: 'Skip Overview',
      nextButtonText: 'Next Step',
      prevButtonText: 'Previous',
      finishButtonText: 'Get Started Now',
      steps: [
        { id: 'step-1', title: '1. Prompt Engineering', description: 'Enter detailed prompts or product URLs.', imageUrl: '', badgeText: 'Prompt Studio' },
        { id: 'step-2', title: '2. Upload Media', description: 'Attach images, logos, or audio files.', imageUrl: '', badgeText: 'Media Center' },
        { id: 'step-3', title: '3. AI Credits', description: 'Manage monthly free and pro credits.', imageUrl: '', badgeText: 'Credits' },
        { id: 'step-4', title: '4. Reward Ads', description: 'Watch short partner ads for bonus credits.', imageUrl: '', badgeText: 'Watch & Earn' },
        { id: 'step-5', title: '5. Refer & Earn', description: 'Earn credits by inviting fellow creators.', imageUrl: '', badgeText: 'Referrals' },
        { id: 'step-6', title: '6. High-Speed Generation', description: 'Render HD video clips and voiceovers.', imageUrl: '', badgeText: 'AI Engine' },
        { id: 'step-7', title: '7. Instant 4K Downloads', description: 'Export MP4 files without watermarks.', imageUrl: '', badgeText: 'Export' }
      ]
    };
  });

  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const handleStepChange = (idx: number, key: keyof OnboardingStep, val: string) => {
    setOnboarding(prev => {
      const updatedSteps = [...prev.steps];
      if (updatedSteps[idx]) {
        updatedSteps[idx] = { ...updatedSteps[idx], [key]: val };
      }
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleAddStep = () => {
    const newId = `step-${Date.now()}`;
    const newStep: OnboardingStep = {
      id: newId,
      title: `${onboarding.steps.length + 1}. New Tutorial Step`,
      description: 'Describe what this feature allows users to accomplish.',
      badgeText: 'Tutorial'
    };

    setOnboarding(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    setActiveStepIdx(onboarding.steps.length);
  };

  const handleRemoveStep = (idx: number) => {
    if (onboarding.steps.length <= 1) {
      showToast('At least 1 onboarding step is required.');
      return;
    }
    setOnboarding(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx)
    }));
    setActiveStepIdx(Math.max(0, idx - 1));
  };

  const handleSave = () => {
    onSave('onboarding_config', onboarding);
    showToast('First-Time User Onboarding Settings Saved Successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> First-Time User Onboarding Manager
          </h4>
          <p className="text-xs text-slate-400">Configure modal tutorial steps, title, images, buttons, and theme colors shown to new users.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Onboarding Settings
          </button>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-5 text-xs">
        {/* Toggle Switch & Title */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div>
            <span className="font-bold text-white text-sm block">Onboarding Tutorial Switch</span>
            <span className="text-slate-400">When enabled, first-time users will see the tutorial modal on landing.</span>
          </div>

          <button
            onClick={() => setOnboarding(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              onboarding.enabled
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {onboarding.enabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
          </button>
        </div>

        {/* Modal Titles & Buttons Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Modal Header Title</label>
            <input
              type="text"
              value={onboarding.title}
              onChange={(e) => setOnboarding(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Modal Subtitle / Description</label>
            <input
              type="text"
              value={onboarding.subtitle}
              onChange={(e) => setOnboarding(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Skip Button Text</label>
            <input
              type="text"
              value={onboarding.skipButtonText}
              onChange={(e) => setOnboarding(prev => ({ ...prev, skipButtonText: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Finish Button Text</label>
            <input
              type="text"
              value={onboarding.finishButtonText}
              onChange={(e) => setOnboarding(prev => ({ ...prev, finishButtonText: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Steps Management */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Tutorial Steps ({onboarding.steps.length} Steps)
            </span>
            <button
              onClick={handleAddStep}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>

          {/* Step Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {onboarding.steps.map((step, idx) => (
              <button
                key={step.id || idx}
                onClick={() => setActiveStepIdx(idx)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                  activeStepIdx === idx
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Step {idx + 1}
              </button>
            ))}
          </div>

          {/* Active Step Details Form */}
          {onboarding.steps[activeStepIdx] && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-indigo-300">Editing Step {activeStepIdx + 1}</span>
                <button
                  onClick={() => handleRemoveStep(activeStepIdx)}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Step
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Step Title</label>
                  <input
                    type="text"
                    value={onboarding.steps[activeStepIdx].title}
                    onChange={(e) => handleStepChange(activeStepIdx, 'title', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Badge Tag</label>
                  <input
                    type="text"
                    value={onboarding.steps[activeStepIdx].badgeText || ''}
                    onChange={(e) => handleStepChange(activeStepIdx, 'badgeText', e.target.value)}
                    placeholder="e.g. Prompt Studio"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-semibold text-slate-300">Description</label>
                  <textarea
                    rows={2}
                    value={onboarding.steps[activeStepIdx].description}
                    onChange={(e) => handleStepChange(activeStepIdx, 'description', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-semibold text-slate-300">Image URL</label>
                  <input
                    type="text"
                    value={onboarding.steps[activeStepIdx].imageUrl || ''}
                    onChange={(e) => handleStepChange(activeStepIdx, 'imageUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
