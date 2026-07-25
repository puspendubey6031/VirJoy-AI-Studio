import React from 'react';
import { VideoProject } from '../types';
import {
  Film,
  Play,
  Clock,
  Download,
  Share2,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface HistoryItem {
  projectId: string;
  title: string;
  durationSeconds: number;
  creditsUsed?: number;
  createdAt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  exportQuality?: string;
  status?: string;
  projectData?: VideoProject;
}

interface GenerationsHistoryProps {
  history: HistoryItem[];
  activeProjectId?: string;
  onSelectProject: (item: HistoryItem) => void;
  onOpenPricing: () => void;
}

export const GenerationsHistory: React.FC<GenerationsHistoryProps> = ({
  history,
  activeProjectId,
  onSelectProject,
  onOpenPricing
}) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-6 text-center text-slate-400 dark:text-slate-400 light:text-slate-600 transition-colors">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Film className="w-6 h-6" />
          </div>
        </div>
        <h4 className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
          No Saved Generations Yet
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 mt-1 max-w-sm mx-auto">
          Generated videos appear here automatically with 24-hour retention and quick preview/download access.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-5 shadow-xl transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900">
              Generations & History
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500">
              {history.length} video{history.length === 1 ? '' : 's'} retained in auto-cleanup queue
            </p>
          </div>
        </div>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 px-2.5 py-1 rounded-full font-bold border border-indigo-500/20">
          24h Auto-Retention
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = item.projectId === activeProjectId;
          const formattedDate = new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={item.projectId}
              onClick={() => onSelectProject(item)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950 dark:bg-slate-950 light:bg-slate-50 hover:bg-slate-900 dark:hover:bg-slate-900 light:hover:bg-slate-100 border-slate-800 dark:border-slate-800 light:border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-bold text-slate-100 dark:text-white light:text-slate-900 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h4>
                  {isActive && (
                    <span className="bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {item.durationSeconds || 15}s
                  </span>
                  <span>•</span>
                  <span className="bg-slate-800 dark:bg-slate-800 light:bg-slate-200 px-1.5 py-0.5 rounded font-bold text-indigo-300 dark:text-indigo-300 light:text-indigo-800">
                    {item.exportQuality || '720p'}
                  </span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready to Preview
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProject(item);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Preview
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
