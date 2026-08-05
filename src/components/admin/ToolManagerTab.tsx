import React, { useState } from 'react';
import { AppConfig, ToolItem, UserRole, PlanKey } from '../../types';
import {
  Wrench,
  Video,
  Image,
  Sparkles,
  Type,
  Mic,
  Subtitles,
  ShoppingBag,
  Sliders,
  Check,
  X,
  Shield,
  Coins,
  Lock,
  Edit2
} from 'lucide-react';

interface ToolManagerTabProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  showToast: (msg: string) => void;
}

export const ToolManagerTab: React.FC<ToolManagerTabProps> = ({
  config,
  onUpdateConfig,
  showToast
}) => {
  const [tools, setTools] = useState<ToolItem[]>(() => {
    return (
      config.toolManagerConfig?.tools || [
        { id: 'tool-1', name: 'AI Video Generator', key: 'videoGenerator', category: 'Video', minRole: 'Free User', minPlan: 'Free', creditsPerUse: 5, enabled: true, description: 'Prompt-to-video & script video generation engine' },
        { id: 'tool-2', name: 'AI Image & Artwork', key: 'imageGenerator', category: 'Graphics', minRole: 'Free User', minPlan: 'Free', creditsPerUse: 3, enabled: true, description: 'High-res image synthesis with FLUX & Gemini models' },
        { id: 'tool-3', name: 'Logo & Emblem Creator', key: 'logoGenerator', category: 'Graphics', minRole: 'Free User', minPlan: 'Free', creditsPerUse: 5, enabled: true, description: 'Vector logo design, badges, and company branding' },
        { id: 'tool-4', name: 'Banner & Poster Studio', key: 'bannerGenerator', category: 'Graphics', minRole: 'Free User', minPlan: 'Free', creditsPerUse: 5, enabled: true, description: 'Social media headers, display banners, and marketing posters' },
        { id: 'tool-5', name: 'YouTube Thumbnail Studio', key: 'thumbnailGenerator', category: 'Graphics', minRole: 'Free User', minPlan: 'Free', creditsPerUse: 3, enabled: true, description: 'High CTR thumbnail graphics with auto glow & text' },
        { id: 'tool-6', name: 'Neural AI Voiceovers', key: 'aiVoiceAccess', category: 'Audio', minRole: 'Free User', minPlan: 'Free', creditsPerUse: 1, enabled: true, description: 'Natural text-to-speech narration in 20+ languages' },
        { id: 'tool-7', name: 'Auto Subtitles & Captions', key: 'subtitleAccess', category: 'Audio', minRole: 'Free User', minPlan: 'Free', creditsPerUse: 1, enabled: true, description: 'Animated pop-in captions and auto-translation' },
        { id: 'tool-8', name: 'Idea-to-Video Workflow', key: 'ideaToVideoWorkflow', category: 'Video', minRole: 'Premium User', minPlan: '₹799', creditsPerUse: 20, enabled: true, description: 'Complete automated script, storyboard, and video production' },
        { id: 'tool-9', name: 'Product URL Extraction', key: 'productUrlExtraction', category: 'Utility', minRole: 'Free User', minPlan: 'Free', creditsPerUse: 5, enabled: true, description: 'Extract e-commerce product title, price & images to video' }
      ]
    );
  });

  const [editingTool, setEditingTool] = useState<ToolItem | null>(null);

  const handleToggleTool = (id: string) => {
    const updated = tools.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    setTools(updated);
    saveToolsConfig(updated);
    showToast('Tool status updated.');
  };

  const handleSaveTool = () => {
    if (!editingTool) return;
    const updated = tools.map((t) => (t.id === editingTool.id ? editingTool : t));
    setTools(updated);
    saveToolsConfig(updated);
    setEditingTool(null);
    showToast(`Tool settings saved for ${editingTool.name}`);
  };

  const saveToolsConfig = (updatedTools: ToolItem[]) => {
    onUpdateConfig({
      ...config,
      toolManagerConfig: {
        tools: updatedTools
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Wrench className="w-6 h-6 text-indigo-400" />
          Tool & Feature Permission Manager
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Centralized control over tool availability, required minimum user roles, plan tiers, and AI credit costs.
        </p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {tool.category}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">{tool.name}</h4>
                </div>

                <button
                  onClick={() => handleToggleTool(tool.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    tool.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {tool.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>

              <p className="text-xs text-slate-400">{tool.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" /> Min Role:
                </span>
                <span className="font-semibold text-white">{tool.minRole}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-purple-400" /> Min Plan:
                </span>
                <span className="font-semibold text-purple-300">{tool.minPlan}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Cost:
                </span>
                <span className="font-mono font-bold text-amber-300">{tool.creditsPerUse} Credits</span>
              </div>
            </div>

            <button
              onClick={() => setEditingTool(tool)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Configure Tool Rule
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTool && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white">Configure {editingTool.name}</h4>
              <button onClick={() => setEditingTool(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Minimum Required User Role</label>
                <select
                  value={editingTool.minRole}
                  onChange={(e) => setEditingTool({ ...editingTool, minRole: e.target.value as UserRole })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Free User">Free User</option>
                  <option value="Premium User">Premium User</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Minimum Required Subscription Plan</label>
                <select
                  value={editingTool.minPlan}
                  onChange={(e) => setEditingTool({ ...editingTool, minPlan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Free">Free Plan</option>
                  <option value="₹199">Starter Plan (₹199)</option>
                  <option value="₹399">Pro Creator (₹399)</option>
                  <option value="₹799">Ultra Suite (₹799)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">AI Credits Required Per Use</label>
                <input
                  type="number"
                  value={editingTool.creditsPerUse}
                  onChange={(e) => setEditingTool({ ...editingTool, creditsPerUse: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingTool(null)}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTool}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/25"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
