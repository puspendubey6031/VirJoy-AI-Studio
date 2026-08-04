import React, { useState, useEffect } from 'react';
import { X, Settings, Moon, Sun, Monitor, Video, Volume2, Shield, Save, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeleteAccount?: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenDeleteAccount
}) => {
  if (!isOpen) return null;

  const { theme, setTheme } = useTheme();

  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [exportQuality, setExportQuality] = useState('1080p');
  const [autoDownload, setAutoDownload] = useState(false);
  const [subtitleDefault, setSubtitleDefault] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const savedAspect = localStorage.getItem('virjoy_pref_aspect') || '16:9';
    const savedQuality = localStorage.getItem('virjoy_pref_quality') || '1080p';
    const savedAutoDL = localStorage.getItem('virjoy_pref_autodl') === 'true';
    const savedSub = localStorage.getItem('virjoy_pref_subtitle') !== 'false';

    setAspectRatio(savedAspect);
    setExportQuality(savedQuality);
    setAutoDownload(savedAutoDL);
    setSubtitleDefault(savedSub);
  }, []);

  const handleSave = () => {
    localStorage.setItem('virjoy_pref_aspect', aspectRatio);
    localStorage.setItem('virjoy_pref_quality', exportQuality);
    localStorage.setItem('virjoy_pref_autodl', String(autoDownload));
    localStorage.setItem('virjoy_pref_subtitle', String(subtitleDefault));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">App Preferences & Settings</h3>
            <p className="text-xs text-slate-400">Customize video studio defaults & user preferences</p>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          {/* Theme Mode */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="font-bold text-white block uppercase tracking-wider text-[11px]">Appearance Theme</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  theme === 'dark' ? 'bg-indigo-600 text-white border-indigo-500 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  theme === 'light' ? 'bg-indigo-600 text-white border-indigo-500 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" /> Light Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  theme === 'system' ? 'bg-indigo-600 text-white border-indigo-500 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" /> System Auto
              </button>
            </div>
          </div>

          {/* Video Studio Defaults */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="font-bold text-white block uppercase tracking-wider text-[11px]">Video Studio Defaults</span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-[11px]">Default Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="16:9">16:9 Landscape (YouTube/TV)</option>
                  <option value="9:16">9:16 Portrait (Reels/TikTok)</option>
                  <option value="1:1">1:1 Square (Instagram/FB)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold text-[11px]">Default Export Quality</label>
                <select
                  value={exportQuality}
                  onChange={e => setExportQuality(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="720p">720p Standard SD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4K">4K Ultra HD</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Auto-Download video when render completes</span>
                <input
                  type="checkbox"
                  checked={autoDownload}
                  onChange={e => setAutoDownload(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 font-medium">Enable AI Subtitles by default on new projects</span>
                <input
                  type="checkbox"
                  checked={subtitleDefault}
                  onChange={e => setSubtitleDefault(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Account Privacy & Security */}
          {onOpenDeleteAccount && (
            <div className="bg-rose-950/30 border border-rose-900/40 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-300 block text-xs">Account Data & Erasure</span>
                <p className="text-[10px] text-slate-400">Permanently delete your VirJoy AI account and data</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenDeleteAccount();
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shrink-0"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
              <Check className="w-4 h-4" /> Preferences Saved!
            </span>
          ) : <div />}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" /> Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
