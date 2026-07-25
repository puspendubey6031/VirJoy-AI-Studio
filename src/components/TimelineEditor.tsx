import React from 'react';
import { Scene, VideoProject } from '../types';
import { X, Plus, Trash2, Clock, MoveUp, MoveDown } from 'lucide-react';

interface TimelineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject | null;
  onUpdateProjectScenes: (updatedScenes: Scene[]) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProjectScenes
}) => {
  if (!isOpen || !project) return null;

  const scenes = project.scenes || [];

  const handleSceneChange = (index: number, field: keyof Scene, value: any) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateProjectScenes(updated);
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: `custom-scene-${Date.now()}`,
      title: `Scene ${scenes.length + 1}`,
      duration: 4,
      narration: 'New scene narration text...',
      caption: '✨ New Scene Caption',
      visualPrompt: 'Clean visual scene transition',
      bgGradient: 'from-slate-900 via-indigo-950 to-slate-900'
    };
    onUpdateProjectScenes([...scenes, newScene]);
  };

  const handleDeleteScene = (index: number) => {
    if (scenes.length <= 1) {
      alert('Video project must have at least 1 scene');
      return;
    }
    const updated = scenes.filter((_, idx) => idx !== index);
    onUpdateProjectScenes(updated);
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;

    const updated = [...scenes];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onUpdateProjectScenes(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Scene Timeline & Script Editor</h3>
            <p className="text-xs text-slate-400">Tweak narrations, subtitle captions, durations, and scene order.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scene List Scrollable Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {scenes.map((scene, idx) => (
            <div key={scene.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => handleSceneChange(idx, 'title', e.target.value)}
                    className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <input
                      type="number"
                      min="2"
                      max="30"
                      value={scene.duration}
                      onChange={(e) => handleSceneChange(idx, 'duration', parseInt(e.target.value) || 3)}
                      className="w-10 bg-transparent text-center text-xs font-bold outline-none"
                    />
                    <span>sec</span>
                  </div>

                  <button
                    onClick={() => handleMoveScene(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveScene(idx, 'down')}
                    disabled={idx === scenes.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteScene(idx)}
                    className="p-1 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid Inputs for Narration & Subtitle Caption */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Voiceover Narration Script:
                  </label>
                  <textarea
                    value={scene.narration}
                    onChange={(e) => handleSceneChange(idx, 'narration', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    On-Screen Subtitle Caption:
                  </label>
                  <input
                    type="text"
                    value={scene.caption}
                    onChange={(e) => handleSceneChange(idx, 'caption', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-amber-300 font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleAddScene}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-400" /> Add Scene
          </button>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md"
          >
            Done Editing
          </button>
        </div>
      </div>
    </div>
  );
};
