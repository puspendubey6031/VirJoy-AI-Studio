import React, { useState } from 'react';
import { OnboardingConfig, OnboardingStep } from '../types';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Upload,
  Coins,
  Tv,
  Gift,
  Zap,
  Download,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: OnboardingConfig;
  onComplete: () => void;
}

const STEP_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'step-1': Sparkles,
  'step-2': Upload,
  'step-3': Coins,
  'step-4': Tv,
  'step-5': Gift,
  'step-6': Zap,
  'step-7': Download
};

export const OnboardingModal: React.FC<OnboardingModalProps> = React.memo(({
  isOpen,
  onClose,
  config,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen || !config || !config.enabled) return null;

  const steps = config.steps || [];
  const currentStep: OnboardingStep | undefined = steps[currentStepIndex];

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  const IconComponent = currentStep ? (STEP_ICONS[currentStep.id] || Sparkles) : Sparkles;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base leading-tight">
                {config.title || 'Welcome to VirJoy AI Studio'}
              </h3>
              <p className="text-xs text-slate-400">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onComplete();
            }}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-all"
            title={config.skipButtonText || 'Skip'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-slate-950 h-1.5 flex">
          {steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className={`h-full transition-all duration-300 ${
                idx <= currentStepIndex
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 flex-1'
                  : 'bg-slate-800 flex-1 opacity-40'
              }`}
            />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {currentStep && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Image Preview / Visual Card */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video md:aspect-square flex items-center justify-center shadow-inner group">
                {currentStep.imageUrl ? (
                  <img
                    src={currentStep.imageUrl}
                    alt={currentStep.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                    <IconComponent className="w-12 h-12 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-semibold">{currentStep.badgeText || 'VirJoy AI'}</span>
                  </div>
                )}

                {/* Badge Overlay */}
                {currentStep.badgeText && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1.5">
                    <IconComponent className="w-3 h-3 text-amber-300" />
                    <span>{currentStep.badgeText}</span>
                  </div>
                )}
              </div>

              {/* Text Description */}
              <div className="space-y-4 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/60 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold w-fit">
                  <IconComponent className="w-3.5 h-3.5 text-amber-400" />
                  <span>Feature Overview</span>
                </div>

                <h4 className="text-xl font-bold text-white leading-snug">
                  {currentStep.title}
                </h4>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Step indicators dots */}
                <div className="pt-2 flex items-center gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStepIndex(i)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        i === currentStepIndex
                          ? 'w-6 bg-indigo-500'
                          : 'w-2 bg-slate-800 hover:bg-slate-700'
                      }`}
                      title={`Go to step ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between gap-3">
          {/* Skip Button */}
          <button
            onClick={onComplete}
            className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            {config.skipButtonText || 'Skip Overview'}
          </button>

          <div className="flex items-center gap-2">
            {/* Previous Button */}
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{config.prevButtonText || 'Previous'}</span>
              </button>
            )}

            {/* Next / Finish Button */}
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer transition-all hover:scale-105"
            >
              <span>{isLastStep ? (config.finishButtonText || 'Get Started Now') : (config.nextButtonText || 'Next Step')}</span>
              {isLastStep ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
