import React from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { PWAConfig } from '../../types';

interface PWAUpdateModalProps {
  isOpen: boolean;
  pwaConfig?: PWAConfig;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const PWAUpdateModal: React.FC<PWAUpdateModalProps> = ({
  isOpen,
  pwaConfig,
  onUpdate,
  onDismiss
}) => {
  if (!isOpen) return null;

  const title = pwaConfig?.updateNotice?.title || 'New Version Available';
  const message =
    pwaConfig?.updateNotice?.message ||
    'A fresh update with performance improvements, new features, and bug fixes is ready for VirJoy AI.';
  const buttonText = pwaConfig?.updateNotice?.buttonText || 'Update Now';

  return (
    <div className="fixed bottom-6 right-6 z-50 w-11/12 max-w-sm bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-300 text-slate-100 pwa-safe-bottom">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-200 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white leading-snug">{title}</h4>
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">{message}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onUpdate}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {buttonText}
            </button>
            <button
              onClick={onDismiss}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
