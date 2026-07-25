import React, { useState } from 'react';
import { AppConfig, PlanKey, VideoProjectInputs } from '../types';
import { Sparkles, X, Lightbulb, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface IdeaToVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  currentPlan: PlanKey;
  onGenerateFromIdea: (data: {
    prompt: string;
    targetDurationSeconds: number;
    aspectRatio: '16:9' | '9:16' | '1:1';
    inputs: VideoProjectInputs;
    scenes: any[];
  }) => void;
  onOpenPricing: () => void;
}

export const IdeaToVideoModal: React.FC<IdeaToVideoModalProps> = ({
  isOpen,
  onClose,
  config,
  currentPlan,
  onGenerateFromIdea,
  onOpenPricing
}) => {
  if (!isOpen) return null;

  const planConfig = config.plans[currentPlan] || config.plans.Free;
  const isEligible = planConfig.hasIdeaToVideoWorkflow;

  const [concept, setConcept] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ideaResult, setIdeaResult] = useState<any | null>(null);
  const [selectedHook, setSelectedHook] = useState('');
  const [error, setError] = useState('');

  const handleGenerateIdea = async () => {
    if (!concept.trim()) return;
    setIsProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/video/idea-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept })
      });
      const data = await res.json();

      if (data.success && data.ideaResult) {
        setIdeaResult(data.ideaResult);
        setSelectedHook(data.ideaResult.viralHooks?.[0] || '');
      } else {
        setError(data.error || 'Failed to process creative idea workflow');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error executing idea workflow');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmProject = () => {
    if (!ideaResult) return;

    onGenerateFromIdea({
      prompt: `${selectedHook || ideaResult.title}: ${ideaResult.recommendedScript}`,
      targetDurationSeconds: ideaResult.suggestedDuration || 30,
      aspectRatio: '9:16', // Default 9:16 vertical shorts for viral ideas
      inputs: {
        textPrompt: ideaResult.recommendedScript,
        ideaConcept: concept
      },
      scenes: ideaResult.scenes || []
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden my-8">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">₹799 AI Idea-to-Video Workflow</h3>
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Premium
                </span>
              </div>
              <p className="text-xs text-slate-400">Turn any rough thought or topic into viral hook scripts & full videos.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Entitlement Notice */}
        {!isEligible && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You are testing the AI Idea Assistant. Upgrade to ₹799 Ultra Plan for full priority access.</span>
            </div>
            <button
              onClick={onOpenPricing}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg shrink-0"
            >
              Upgrade Plan
            </button>
          </div>
        )}

        {/* Step 1: Input Concept */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              What is your rough idea or topic?
            </label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={3}
              placeholder="e.g. A portable coffee maker for hikers, or 3 financial habits every 20-year-old should know, or why remote workers burn out."
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateIdea}
            disabled={isProcessing || !concept.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-purple-300" />
                <span>AI Brainstorming Viral Hooks & Script...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Transform Idea into Script & Scenes</span>
              </>
            )}
          </button>

          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        {/* Step 2: AI Generated Output */}
        {ideaResult && (
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI Creative Strategy Result
            </h4>

            {/* Title */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Recommended Title</span>
              <span className="text-sm font-bold text-white">{ideaResult.title}</span>
            </div>

            {/* Hooks Selection */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">Select Your Viral Hook Angle:</span>
              <div className="space-y-1.5">
                {ideaResult.viralHooks?.map((hook: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedHook(hook)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                      selectedHook === hook
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {hook}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Script Summary */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono mb-1">Generated Script Preview</span>
              <p className="text-xs text-slate-300 italic leading-relaxed">"{ideaResult.recommendedScript}"</p>
            </div>

            {/* Confirm CTA */}
            <button
              type="button"
              onClick={handleConfirmProject}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Build Video Project From This Strategy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
