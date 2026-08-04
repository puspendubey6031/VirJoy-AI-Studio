import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  X,
  ExternalLink,
  Download,
  Share2,
  Eye,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useGlobalJob } from '../context/GlobalJobContext';
import { AppConfig, GlobalJobStage } from '../types';

interface GlobalProcessingModalProps {
  config?: AppConfig;
  onPreviewResult?: (result: any, jobType: string) => void;
}

const STAGES: { key: GlobalJobStage; labelKey: keyof Required<AppConfig>['globalProcessingConfig']['stageNames'] }[] = [
  { key: 'queued', labelKey: 'queued' },
  { key: 'preparing', labelKey: 'preparing' },
  { key: 'generating', labelKey: 'generating' },
  { key: 'rendering', labelKey: 'rendering' },
  { key: 'optimizing', labelKey: 'optimizing' },
  { key: 'saving', labelKey: 'saving' },
  { key: 'completed', labelKey: 'completed' }
];

export const GlobalProcessingModal: React.FC<GlobalProcessingModalProps> = ({
  config,
  onPreviewResult
}) => {
  const { activeJob, isModalOpen, closeModal, cancelAIJob, retryAIJob } = useGlobalJob();
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isModalOpen || !activeJob) {
    return null;
  }

  const pConfig = config?.globalProcessingConfig;
  const stageNames = pConfig?.stageNames;
  const barColor = pConfig?.progressBarColor || '#6366f1';
  const animStyle = pConfig?.animationStyle || 'smooth';

  const isFinished = activeJob.stage === 'completed';
  const isFailed = activeJob.stage === 'failed';
  const isCancelled = activeJob.stage === 'cancelled';
  const isInProgress = !isFinished && !isFailed && !isCancelled;

  // Calculate current stage index
  const stageOrder: GlobalJobStage[] = ['queued', 'preparing', 'generating', 'rendering', 'optimizing', 'saving', 'completed'];
  const currentStageIndex = stageOrder.indexOf(activeJob.stage as GlobalJobStage);

  const getStageLabel = (stageKey: GlobalJobStage) => {
    if (stageNames && (stageNames as any)[stageKey]) {
      return (stageNames as any)[stageKey];
    }
    if (stageKey === 'queued') return 'Queued';
    if (stageKey === 'preparing') return 'Preparing AI';
    if (stageKey === 'generating') return 'Generating';
    if (stageKey === 'rendering') return 'Rendering';
    if (stageKey === 'optimizing') return 'Optimizing';
    if (stageKey === 'saving') return 'Saving';
    if (stageKey === 'completed') return 'Completed';
    return stageKey;
  };

  const handleCopyShare = () => {
    const shareUrl = activeJob.result?.project?.shareUrl || activeJob.result?.item?.imageUrl || window.location.href;
    const fullUrl = shareUrl.startsWith('http') ? shareUrl : `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleDownload = () => {
    const item = activeJob.result?.item || activeJob.result?.project;
    const downloadUrl = item?.imageUrl || item?.shareUrl || '#';
    if (downloadUrl !== '#') {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `virjoy_${activeJob.type}_${Date.now()}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handlePreview = () => {
    if (onPreviewResult && activeJob.result) {
      onPreviewResult(activeJob.result, activeJob.type);
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white my-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                VirJoy AI Central Engine
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeJob.type.replace('_', ' ')}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-sm">
                {activeJob.title}
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Minimize to background (Job continues processing)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">

          {/* Status Display Header */}
          <div className="text-center space-y-2">
            {isInProgress && (
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
                {animStyle === 'pulse' && <Zap className="w-8 h-8 animate-bounce" />}
                {animStyle === 'wave' && <Layers className="w-8 h-8 animate-pulse" />}
                {(animStyle === 'smooth' || animStyle === 'shimmer') && <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />}
              </div>
            )}

            {isFinished && (
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            )}

            {(isFailed || isCancelled) && (
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-2">
                <XCircle className="w-10 h-10 text-rose-400" />
              </div>
            )}

            <h4 className="text-xl font-extrabold text-slate-100">
              {isInProgress && `${activeJob.stageLabel || 'Processing'}...`}
              {isFinished && 'Generation Completed! 🎉'}
              {isFailed && 'Generation Failed'}
              {isCancelled && 'Generation Cancelled'}
            </h4>

            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-700/40">
              {activeJob.statusMessage}
            </p>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                {isInProgress ? (
                  <span>
                    ETA: <strong className="text-indigo-300 font-mono">{activeJob.etaSeconds}s remaining</strong>
                  </span>
                ) : (
                  <span>Status: {activeJob.stageLabel}</span>
                )}
              </span>
              <span className="text-sm font-bold font-mono text-indigo-400">
                {activeJob.progress}%
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  animStyle === 'shimmer' ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse' : ''
                } ${isFinished ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : ''}`}
                style={{
                  width: `${activeJob.progress}%`,
                  backgroundColor: isFinished ? '#10b981' : isFailed ? '#f43f5e' : barColor
                }}
              />
            </div>
          </div>

          {/* Universal Processing Pipeline Stage Stepper */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Universal Processing Pipeline</span>
              <span className="text-slate-500 font-normal">Server-Authoritative</span>
            </p>

            <div className="grid grid-cols-7 gap-1 text-center">
              {STAGES.map((s, idx) => {
                const label = getStageLabel(s.key);
                const isPassed = idx < currentStageIndex || isFinished;
                const isCurrent = idx === currentStageIndex && isInProgress;

                return (
                  <div key={s.key} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isCurrent
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[9px] font-medium leading-tight truncate w-full ${
                        isCurrent
                          ? 'text-indigo-300 font-bold'
                          : isPassed
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }`}
                      title={label}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Background continuation hint */}
          {isInProgress && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-indigo-950/30 border border-indigo-900/40 py-2 px-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Job processes safely in background if tab reloads or phone locks.</span>
            </div>
          )}

          {/* Error Refund Banner */}
          {(isFailed || isCancelled) && activeJob.creditsDeducted > 0 && (
            <div className="flex items-center justify-between text-xs text-rose-300 bg-rose-950/30 border border-rose-900/40 py-2 px-3 rounded-lg">
              <span>Auto Credit Refund:</span>
              <strong className="font-bold text-rose-200">
                +{activeJob.creditsDeducted} Credits refunded
              </strong>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          {isInProgress && (
            <>
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
              >
                <span>Run in Background</span>
              </button>

              <button
                onClick={() => cancelAIJob(activeJob.id)}
                className="px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors"
              >
                Cancel Job
              </button>
            </>
          )}

          {isFailed && (
            <>
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => retryAIJob(activeJob.id)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Generation
              </button>
            </>
          )}

          {isFinished && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {onPreviewResult && activeJob.result && (
                  <button
                    onClick={handlePreview}
                    className="px-4 py-2 text-xs font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                )}

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>

                <button
                  onClick={handleCopyShare}
                  className="px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copiedShare ? 'Copied Link!' : 'Share'}
                </button>
              </div>

              <button
                onClick={closeModal}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <span>Done</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
