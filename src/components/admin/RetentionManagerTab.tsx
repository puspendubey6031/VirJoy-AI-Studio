import React, { useState } from 'react';
import { RetentionConfig } from '../../types';
import { Clock, Save, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface RetentionManagerTabProps {
  retentionConfig: RetentionConfig;
  onChange: (updatedConfig: RetentionConfig) => void;
  showToast: (msg: string) => void;
}

export const RetentionManagerTab: React.FC<RetentionManagerTabProps> = ({
  retentionConfig,
  onChange,
  showToast
}) => {
  const [retentionHours, setRetentionHours] = useState(retentionConfig?.retentionHours || 24);
  const [autoCleanupIntervalMinutes, setAutoCleanupIntervalMinutes] = useState(
    retentionConfig?.autoCleanupIntervalMinutes || 15
  );
  const [explanationMessage, setExplanationMessage] = useState(
    retentionConfig?.explanationMessage ||
      `Generated videos are automatically deleted after ${retentionHours} hours. Download before expiry.`
  );

  const handleSave = () => {
    const updated: RetentionConfig = {
      retentionHours,
      autoCleanupIntervalMinutes,
      explanationMessage
    };
    onChange(updated);
    showToast('Retention policy rules saved successfully!');
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Auto Retention & Storage Cleanup Rules</h3>
            <p className="text-xs text-slate-400">Configure media retention windows, cleanup intervals & user alerts</p>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-slate-300 font-bold block text-xs">Video Retention Window (Hours)</label>
              <input
                type="number"
                min="1"
                max="720"
                value={retentionHours}
                onChange={e => setRetentionHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl font-bold text-amber-400 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500">
                Default: 24 hours. Rendered video files older than this will be auto-purged from storage cache.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-slate-300 font-bold block text-xs">Auto Cleanup Worker Interval (Minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                value={autoCleanupIntervalMinutes}
                onChange={e => setAutoCleanupIntervalMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500">
                Frequency at which the background storage cleanup job runs to remove expired media files.
              </p>
            </div>
          </div>

          {/* Explanation message displayed in user modal */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-slate-300 font-bold block text-xs">
              User Modal Explanation Message
            </label>
            <textarea
              rows={3}
              value={explanationMessage}
              onChange={e => setExplanationMessage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="Explanation displayed when user clicks 24h Auto Retention info button..."
            />
            <p className="text-[10px] text-slate-500">
              This message is shown to users when they view the Auto-Retention policy modal.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Retention Rules
          </button>
        </div>
      </div>
    </div>
  );
};
