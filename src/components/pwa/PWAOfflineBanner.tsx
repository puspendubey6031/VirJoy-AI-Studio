import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, X } from 'lucide-react';

interface PWAOfflineBannerProps {
  isOnline: boolean;
  fallbackMessage?: string;
}

export const PWAOfflineBanner: React.FC<PWAOfflineBannerProps> = ({ isOnline, fallbackMessage }) => {
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setIsDismissed(false);
    } else if (wasOffline) {
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRestoredNotice) return null;
  if (isDismissed && !showRestoredNotice) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg animate-in slide-in-from-top duration-300">
      {!isOnline ? (
        <div className="bg-amber-950/90 border border-amber-500/50 backdrop-blur-md rounded-2xl p-3.5 shadow-xl text-amber-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="truncate">
              <p className="font-semibold text-amber-100">You are currently offline</p>
              <p className="text-[11px] text-amber-300/80 truncate">
                {fallbackMessage || 'Cached features remain accessible. Connect to sync new requests.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-amber-400 hover:text-amber-100 rounded-lg hover:bg-amber-900/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : showRestoredNotice ? (
        <div className="bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md rounded-2xl p-3.5 shadow-xl text-emerald-200 flex items-center gap-2.5 text-xs">
          <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="font-semibold text-emerald-100">Connection restored! You are back online.</p>
        </div>
      ) : null}
    </div>
  );
};
