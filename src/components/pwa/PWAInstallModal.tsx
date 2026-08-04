import React from 'react';
import { Download, X, Sparkles, ShieldCheck, Zap, Smartphone, CheckCircle } from 'lucide-react';
import { PWAConfig } from '../../types';

interface PWAInstallModalProps {
  isOpen: boolean;
  pwaConfig?: PWAConfig;
  onInstall: () => void;
  onLater: () => void;
  onNever: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  pwaConfig,
  onInstall,
  onLater,
  onNever
}) => {
  if (!isOpen) return null;

  const title = pwaConfig?.installPrompt?.title || 'Install VirJoy AI App';
  const description =
    pwaConfig?.installPrompt?.description ||
    'Get the native mobile application experience with full-screen view, instant offline access, and fast background AI rendering.';
  const appName = pwaConfig?.appName || 'VirJoy AI - AI Video & Studio';
  const allowLater = pwaConfig?.installPrompt?.allowLater !== false;
  const allowNever = pwaConfig?.installPrompt?.allowNever !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-100 pwa-safe-bottom">
        {/* Top Decorative Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Close / Dismiss Later Button */}
        {allowLater && (
          <button
            onClick={onLater}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors"
            title="Dismiss for now"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
              <img
                src={pwaConfig?.appIconUrl || '/icon.svg'}
                alt="App Icon"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Smartphone className="w-8 h-8 text-indigo-400 absolute" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Mobile App
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-tight mt-1">{appName}</h3>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="space-y-3 mb-6">
          <h4 className="text-base font-bold text-slate-100">{title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{description}</p>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3 space-y-2 mt-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full-screen app interface without browser URL bar</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Faster loading with offline fallback cache</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Secure, persistent session state preservation</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onInstall}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-98"
          >
            <Download className="w-4 h-4" /> Install App Now
          </button>

          <div className="flex items-center gap-2 pt-1">
            {allowLater && (
              <button
                onClick={onLater}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-colors text-center"
              >
                Remind Later
              </button>
            )}
            {allowNever && (
              <button
                onClick={onNever}
                className="flex-1 py-2.5 px-3 bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl transition-colors text-center"
              >
                Never Ask Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
