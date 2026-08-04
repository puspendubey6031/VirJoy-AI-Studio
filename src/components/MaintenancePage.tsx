import React from 'react';
import { MaintenanceConfig } from '../types';
import { ShieldAlert, Clock, RefreshCw, Mail, Lock } from 'lucide-react';

interface MaintenancePageProps {
  config: MaintenanceConfig;
  onAdminBypass?: () => void;
  isAdmin?: boolean;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = React.memo(({
  config,
  onAdminBypass,
  isAdmin = false
}) => {
  const title = config.title || 'Platform Maintenance & Upgrades';
  const message = config.message || 'VirJoy AI is currently undergoing scheduled platform upgrades to improve generation speed. We will be back online shortly!';
  const returnTime = config.expectedReturnTime || '2026-08-02 12:00 UTC';
  const imageUrl = config.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6">
        {/* Maintenance Banner Image */}
        {imageUrl && (
          <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
            <img
              src={imageUrl}
              alt="System Maintenance"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-lg flex items-center gap-1.5 shadow-md">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>System Maintenance Active</span>
            </div>
          </div>
        )}

        {/* Title & Message */}
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h2>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Return Time Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-amber-300 text-xs font-bold shadow-md">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Estimated Return Time: {returnTime}</span>
        </div>

        {/* Quick Refresh & Contact Support */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer transition-all hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Platform Status</span>
          </button>

          {isAdmin && onAdminBypass && (
            <button
              onClick={onAdminBypass}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Admin Bypass Mode</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500 pt-2">
          Need urgent assistance? Contact us at{' '}
          <a href="mailto:support@virjoy.ai" className="text-indigo-400 underline hover:text-indigo-300">
            support@virjoy.ai
          </a>
        </p>
      </div>
    </div>
  );
});
