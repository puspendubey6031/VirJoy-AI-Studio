import React, { useState, useEffect } from 'react';
import { X, Download, Clock, Video, Trash2, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { AppConfig, VideoProject } from '../types';

interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  projects?: VideoProject[];
  onOpenRetentionInfo?: () => void;
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({
  isOpen,
  onClose,
  config,
  projects = [],
  onOpenRetentionInfo
}) => {
  if (!isOpen) return null;

  const retentionHours = config.retention?.retentionHours || 24;

  const completedProjects = projects.filter(p => p.status === 'completed');

  const handleTriggerDownload = (p: VideoProject) => {
    const videoUrl = p.shareUrl || `https://storage.googleapis.com/virjoy-renders/video_${p.id}.mp4`;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `VirJoy_Video_${p.id}.mp4`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close Downloads Center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Video Downloads & Library</h3>
              <p className="text-xs text-slate-400">Access and export your generated video commercial files</p>
            </div>
          </div>
        </div>

        {/* Auto Retention Alert Notice */}
        <div
          onClick={onOpenRetentionInfo}
          className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-indigo-950/40 border border-amber-500/30 p-3.5 rounded-2xl mb-5 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-300 block">
                {retentionHours}-Hour Auto-Retention System Active
              </span>
              <p className="text-[10px] text-slate-400">
                Generated videos are automatically cleaned up after {retentionHours} hours. Click to learn more.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-400 underline shrink-0">Policy Info</span>
        </div>

        {/* Download list */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Completed Downloads</h4>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs">
            {completedProjects.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Video className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-medium">No rendered videos ready for download.</p>
                <p className="text-slate-500 text-[11px]">
                  Generate an AI video commercial from the home studio to see your files here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {completedProjects.map(p => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {p.aspectRatio || '16:9'}
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-xs truncate max-w-[220px]">{p.title || p.prompt}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Duration: {p.totalDurationSeconds}s • Quality: {p.exportQuality || '1080p'} • Created: {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTriggerDownload(p)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download MP4
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
