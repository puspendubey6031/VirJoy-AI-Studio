import React, { useState } from 'react';
import { X, FolderHeart, Video, Play, Trash2, Plus, Sparkles, Clock } from 'lucide-react';
import { VideoProject } from '../types';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: VideoProject[];
  onSelectProject?: (project: VideoProject) => void;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  isOpen,
  onClose,
  projects = [],
  onSelectProject
}) => {
  if (!isOpen) return null;

  const [projectList, setProjectList] = useState<VideoProject[]>(projects);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectList(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close Saved Projects"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
            <FolderHeart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Saved Projects & Drafts</h3>
            <p className="text-xs text-slate-400">View and resume your saved AI video commercial drafts</p>
          </div>
        </div>

        {/* Projects Grid / List */}
        <div className="space-y-3">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs">
            {projectList.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <FolderHeart className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-medium">No saved projects found.</p>
                <p className="text-slate-500 text-[11px]">
                  When you create or save a video commercial in VirJoy Studio, it will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-[380px] overflow-y-auto">
                {projectList.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (onSelectProject) {
                        onSelectProject(p);
                        onClose();
                      }
                    }}
                    className="p-4 flex items-center justify-between hover:bg-slate-900/80 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-900 to-purple-900 text-indigo-300 border border-indigo-700/50 flex flex-col items-center justify-center font-bold shrink-0">
                        <Video className="w-4 h-4 text-amber-400" />
                        <span className="text-[9px] text-slate-300 mt-0.5">{p.aspectRatio}</span>
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-xs group-hover:text-amber-400 transition-colors truncate max-w-[240px]">
                          {p.title || p.prompt}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {p.scenes?.length || 0} Scenes • {p.totalDurationSeconds}s • Created: {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (onSelectProject) {
                            onSelectProject(p);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" /> Open Studio
                      </button>
                      <button
                        onClick={e => handleDelete(p.id, e)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        title="Delete saved project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
