import React, { useState } from 'react';
import { AppConfig } from '../../types';
import {
  HardDrive,
  Trash2,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  Video,
  Image,
  Music,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface StorageManagerTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const StorageManagerTab: React.FC<StorageManagerTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  // Storage Stats State
  const [totalStorageGB] = useState(100);
  const [usedStorageMB, setUsedStorageMB] = useState(1350);
  const [imagesMB, setImagesMB] = useState(320);
  const [videosMB, setVideosMB] = useState(840);
  const [audioMB, setAudioMB] = useState(110);
  const [tempFilesMB, setTempFilesMB] = useState(80);

  // Auto Cleanup Scheduler State (Syncs with localConfig retention / scheduler)
  const [tempRetentionHours, setTempRetentionHours] = useState<number>(
    config.retention?.retentionHours || 24
  );
  const [videoHistoryDays, setVideoHistoryDays] = useState<number>(30);
  const [failedJobsRetentionHours, setFailedJobsRetentionHours] = useState<number>(12);
  const [oldLogsRetentionDays, setOldLogsRetentionDays] = useState<number>(90);

  const [isCleaning, setIsCleaning] = useState(false);
  const [lastCleanResult, setLastCleanResult] = useState<string | null>(null);

  const usedStorageGB = Number((usedStorageMB / 1024).toFixed(2));
  const freeStorageGB = Number((totalStorageGB - usedStorageGB).toFixed(2));
  const usedPercent = Math.min(100, Math.round((usedStorageGB / totalStorageGB) * 100));

  const handleDeleteTemp = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const freed = tempFilesMB;
      setTempFilesMB(0);
      setUsedStorageMB((prev) => Math.max(0, prev - freed));
      setIsCleaning(false);
      setLastCleanResult(`Freed ${freed} MB by purging all temporary canvas buffer files.`);
      showToast(`Purged ${freed} MB temp files.`);
    }, 600);
  };

  const handleDeleteExpired = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const freed = Math.floor(videosMB * 0.25);
      setVideosMB((prev) => Math.max(0, prev - freed));
      setUsedStorageMB((prev) => Math.max(0, prev - freed));
      setIsCleaning(false);
      setLastCleanResult(`Purged ${freed} MB of expired video renders past the retention window.`);
      showToast(`Purged ${freed} MB expired files.`);
    }, 600);
  };

  const handleDeleteFailedUploads = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const freed = 45;
      setUsedStorageMB((prev) => Math.max(0, prev - freed));
      setIsCleaning(false);
      setLastCleanResult('Purged 45 MB of dangling/orphaned upload fragments.');
      showToast('Cleared broken upload fragments.');
    }, 500);
  };

  const handleOptimizeStorage = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const freed = Math.floor(usedStorageMB * 0.15);
      setUsedStorageMB((prev) => Math.max(0, prev - freed));
      setIsCleaning(false);
      setLastCleanResult(`Compressed media assets & freed ${freed} MB disk space.`);
      showToast(`Storage optimized! Freed ${freed} MB.`);
    }, 800);
  };

  const handleSaveSchedulerSettings = () => {
    if (tempRetentionHours < 1 || videoHistoryDays < 1) {
      showToast('Retention windows must be at least 1.');
      return;
    }

    const updatedRetention = {
      ...config.retention,
      retentionHours: tempRetentionHours,
      videoHistoryDays,
      failedJobsHours: failedJobsRetentionHours,
      oldLogsDays: oldLogsRetentionDays
    };

    onSave('retention', updatedRetention);
    showToast('Auto Cleanup Scheduler settings updated & active!');
  };

  const handleResetSchedulerSettings = () => {
    setTempRetentionHours(24);
    setVideoHistoryDays(30);
    setFailedJobsRetentionHours(12);
    setOldLogsRetentionDays(90);
    showToast('Reset scheduler settings to system defaults.');
  };

  return (
    <div className="space-y-6 text-xs">
      {/* 1. Storage Overview Dashboard */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" /> Platform Storage Manager & Asset Allocation
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Monitor cloud storage usage, media buckets, temp files, and execute manual cleanup triggers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDeleteTemp}
              disabled={isCleaning || tempFilesMB === 0}
              className="px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Temp ({tempFilesMB}MB)
            </button>
            <button
              onClick={handleDeleteExpired}
              disabled={isCleaning}
              className="px-3 py-1.5 bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" /> Delete Expired
            </button>
            <button
              onClick={handleDeleteFailedUploads}
              disabled={isCleaning}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete Failed Uploads
            </button>
            <button
              onClick={handleOptimizeStorage}
              disabled={isCleaning}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" /> Optimize Storage
            </button>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-2">
              <span>Used: {usedStorageGB} GB</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400">Free: {freeStorageGB} GB</span>
            </span>
            <span className="text-slate-400 font-mono">Total Capacity: {totalStorageGB} GB ({usedPercent}% used)</span>
          </div>

          <div className="w-full bg-slate-900 border border-slate-800 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${usedPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Media Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Video Exports</span>
              <span className="text-sm font-black text-white">{videosMB} MB</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">AI Generated Images</span>
              <span className="text-sm font-black text-white">{imagesMB} MB</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Audio & Voice Clips</span>
              <span className="text-sm font-black text-white">{audioMB} MB</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Temp Scratch Files</span>
              <span className="text-sm font-black text-rose-300">{tempFilesMB} MB</span>
            </div>
          </div>
        </div>

        {lastCleanResult && (
          <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 rounded-xl font-mono text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lastCleanResult}</span>
          </div>
        )}
      </div>

      {/* 2. Auto Cleanup Scheduler Settings */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Automated Cleanup Scheduler Configuration
          </h4>
          <p className="text-slate-400 text-[11px]">
            Configure background cron schedules for automated storage retention, log pruning, and temp file purges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Delete Temp Scratch Files After (Hours):
            </label>
            <input
              type="number"
              min={1}
              value={tempRetentionHours}
              onChange={(e) => setTempRetentionHours(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-xs"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Purges temporary audio chunks and frame buffers.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Delete Expired Video History After (Days):
            </label>
            <input
              type="number"
              min={1}
              value={videoHistoryDays}
              onChange={(e) => setVideoHistoryDays(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-xs"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Purges completed video project records past retention limit.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Delete Failed Video Jobs After (Hours):
            </label>
            <input
              type="number"
              min={1}
              value={failedJobsRetentionHours}
              onChange={(e) => setFailedJobsRetentionHours(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-xs"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Removes failed render records from queue memory.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Delete Audit & Search Logs After (Days):
            </label>
            <input
              type="number"
              min={1}
              value={oldLogsRetentionDays}
              onChange={(e) => setOldLogsRetentionDays(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-xs"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Archives and purges system audit logs older than specified days.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetSchedulerSettings}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Reset Scheduler Defaults
          </button>

          <button
            type="button"
            onClick={handleSaveSchedulerSettings}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" /> Save Scheduler Settings
          </button>
        </div>
      </div>
    </div>
  );
};
