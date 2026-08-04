import React from 'react';
import { X, Clock, AlertCircle, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { AppConfig } from '../types';

interface AutoRetentionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onOpenDownloads?: () => void;
}

export const AutoRetentionInfoModal: React.FC<AutoRetentionInfoModalProps> = ({
  isOpen,
  onClose,
  config,
  onOpenDownloads
}) => {
  if (!isOpen) return null;

  const retentionHours = config.retention?.retentionHours || 24;
  const explanationMsg = config.retention?.explanationMessage ||
    `Generated videos are automatically deleted after ${retentionHours} hours. Download before expiry.`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close Dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Banner */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{retentionHours}-Hour Auto Retention</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Active Policy
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Automated Media Cleanup System</p>
          </div>
        </div>

        {/* Policy Message Box */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs leading-relaxed">
          <p className="text-amber-300 font-extrabold text-sm flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            {explanationMsg}
          </p>

          <p className="text-slate-300 text-[11px]">
            To optimize high-speed GPU video rendering cache and protect user privacy, VirJoy AI automatically purges old temporary render files from cloud storage every <strong className="text-white">{retentionHours} hours</strong>.
          </p>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-white block">Key Rules:</span>
            <ul className="list-disc list-inside space-y-1">
              <li>Always download rendered MP4 videos before the {retentionHours}h timer expires.</li>
              <li>Project scripts and scene timelines remain saved under Saved Projects.</li>
              <li>Admin can adjust retention window in the Admin Panel.</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          {onOpenDownloads && (
            <button
              onClick={() => {
                onClose();
                onOpenDownloads();
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> View Downloads
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
