import React, { useState } from 'react';
import { Smartphone, Download, Wifi, RefreshCw, Save, CheckCircle2, Sparkles, Globe, Shield, Plus, Trash2, Bell } from 'lucide-react';
import { AppConfig, PWAConfig, PWAShortcutItem } from '../../types';

interface PWAConfigTabProps {
  config: AppConfig;
  onSave: (updatedConfig: Partial<AppConfig>) => void;
  isSaving?: boolean;
}

export const PWAConfigTab: React.FC<PWAConfigTabProps> = ({ config, onSave, isSaving }) => {
  const currentPWA = config.pwaConfig || {
    appName: 'VirJoy AI - AI Video & Studio',
    shortName: 'VirJoy AI',
    description: 'Create viral AI videos, studio graphics, banners, and logos instantly with VirJoy AI.',
    themeColor: '#4f46e5',
    backgroundColor: '#020617',
    appIconUrl: '/icon-512.png',
    maskableIconUrl: '/icon-512-maskable.png',
    startUrl: '/',
    displayMode: 'standalone',
    orientation: 'portrait',
    installPrompt: {
      enabled: true,
      title: 'Install VirJoy AI App',
      description: 'Get the native mobile app experience with instant access, offline mode, and push notifications.',
      delaySeconds: 3,
      allowLater: true,
      allowNever: true,
    },
    offlineMode: {
      enabled: true,
      fallbackMessage: 'You are currently offline. Core app features are cached and ready when reconnected.',
    },
    updateNotice: {
      enabled: true,
      title: 'New Version Available',
      message: 'A fresh update with new features and optimizations is available for VirJoy AI.',
      buttonText: 'Update Now',
    },
    shortcuts: [
      { name: 'AI Video Generator', shortName: 'AI Video', url: '/?tab=video', icon: '/icon-192.png' },
      { name: 'Design Studio', shortName: 'Design', url: '/?tab=design', icon: '/icon-192.png' }
    ]
  };

  const [pwaState, setPwaState] = useState<PWAConfig>(JSON.parse(JSON.stringify(currentPWA)));
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handlePWAChange = (key: keyof PWAConfig, value: any) => {
    setPwaState(prev => ({ ...prev, [key]: value }));
  };

  const handleInstallPromptChange = (key: string, value: any) => {
    setPwaState(prev => ({
      ...prev,
      installPrompt: { ...prev.installPrompt, [key]: value }
    }));
  };

  const handleOfflineModeChange = (key: string, value: any) => {
    setPwaState(prev => ({
      ...prev,
      offlineMode: { ...prev.offlineMode, [key]: value }
    }));
  };

  const handleUpdateNoticeChange = (key: string, value: any) => {
    setPwaState(prev => ({
      ...prev,
      updateNotice: { ...prev.updateNotice, [key]: value }
    }));
  };

  const handleShortcutChange = (index: number, key: keyof PWAShortcutItem, value: string) => {
    const updated = [...pwaState.shortcuts];
    updated[index] = { ...updated[index], [key]: value };
    setPwaState(prev => ({ ...prev, shortcuts: updated }));
  };

  const addShortcut = () => {
    setPwaState(prev => ({
      ...prev,
      shortcuts: [...prev.shortcuts, { name: 'New Shortcut', shortName: 'Shortcut', url: '/' }]
    }));
  };

  const removeShortcut = (index: number) => {
    setPwaState(prev => ({
      ...prev,
      shortcuts: prev.shortcuts.filter((_, i) => i !== index)
    }));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ pwaConfig: pwaState });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSaveSubmit} className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 shrink-0">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Progressive Web App (PWA) Management</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PWA Enabled
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Configure mobile app manifest, install popups, offline caching, update banners, and app shortcuts.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-xs transition-all disabled:opacity-50 shrink-0"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save PWA Configuration'}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>PWA settings saved and live manifest updated successfully!</span>
        </div>
      )}

      {/* 1. App Identity & Manifest */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Globe className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">1. App Identity & Web Manifest</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">App Name (Full Title)</label>
            <input
              type="text"
              value={pwaState.appName}
              onChange={(e) => handlePWAChange('appName', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Short Name (Home Screen Label)</label>
            <input
              type="text"
              value={pwaState.shortName}
              onChange={(e) => handlePWAChange('shortName', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">App Description</label>
            <textarea
              rows={2}
              value={pwaState.description}
              onChange={(e) => handlePWAChange('description', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Theme Color (Status Bar)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pwaState.themeColor}
                onChange={(e) => handlePWAChange('themeColor', e.target.value)}
                className="w-10 h-9 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={pwaState.themeColor}
                onChange={(e) => handlePWAChange('themeColor', e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Background Color (Splash Screen)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pwaState.backgroundColor}
                onChange={(e) => handlePWAChange('backgroundColor', e.target.value)}
                className="w-10 h-9 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={pwaState.backgroundColor}
                onChange={(e) => handlePWAChange('backgroundColor', e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Display Mode</label>
            <select
              value={pwaState.displayMode}
              onChange={(e) => handlePWAChange('displayMode', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="standalone">Standalone (Full App Experience, Recommended)</option>
              <option value="fullscreen">Fullscreen (Immersive)</option>
              <option value="minimal-ui">Minimal UI</option>
              <option value="browser">Browser</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Orientation</label>
            <select
              value={pwaState.orientation}
              onChange={(e) => handlePWAChange('orientation', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="portrait">Portrait Only</option>
              <option value="any">Any (Auto-rotate)</option>
              <option value="landscape">Landscape Only</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">App Icon URL (512x512)</label>
            <input
              type="text"
              value={pwaState.appIconUrl}
              onChange={(e) => handlePWAChange('appIconUrl', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Maskable Icon URL (Adaptive)</label>
            <input
              type="text"
              value={pwaState.maskableIconUrl}
              onChange={(e) => handlePWAChange('maskableIconUrl', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Install Prompt Popup Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">2. Install App Popup Prompt</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={pwaState.installPrompt?.enabled}
              onChange={(e) => handleInstallPromptChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Popup Title</label>
            <input
              type="text"
              value={pwaState.installPrompt?.title}
              onChange={(e) => handleInstallPromptChange('title', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Trigger Delay (Seconds)</label>
            <input
              type="number"
              min={0}
              max={60}
              value={pwaState.installPrompt?.delaySeconds}
              onChange={(e) => handleInstallPromptChange('delaySeconds', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">Popup Description</label>
            <textarea
              rows={2}
              value={pwaState.installPrompt?.description}
              onChange={(e) => handleInstallPromptChange('description', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pwaState.installPrompt?.allowLater}
                onChange={(e) => handleInstallPromptChange('allowLater', e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 bg-slate-950"
              />
              <span>Allow "Remind Later" Option</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pwaState.installPrompt?.allowNever}
                onChange={(e) => handleInstallPromptChange('allowNever', e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 bg-slate-950"
              />
              <span>Allow "Never Ask Again" Option</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Offline Mode & Service Worker Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">3. Offline Caching & Fallback Mode</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={pwaState.offlineMode?.enabled}
              onChange={(e) => handleOfflineModeChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="text-xs space-y-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Offline Fallback Banner Message</label>
            <input
              type="text"
              value={pwaState.offlineMode?.fallbackMessage}
              onChange={(e) => handleOfflineModeChange('fallbackMessage', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            * Caching is powered by Service Worker sw.js using Network-First for core navigation and Stale-While-Revalidate for app assets. Sensitive APIs are automatically excluded from cache.
          </p>
        </div>
      </div>

      {/* 4. Update System Notice */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">4. Instant Version Update Notification</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={pwaState.updateNotice?.enabled}
              onChange={(e) => handleUpdateNoticeChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Update Title</label>
            <input
              type="text"
              value={pwaState.updateNotice?.title}
              onChange={(e) => handleUpdateNoticeChange('title', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Button Text</label>
            <input
              type="text"
              value={pwaState.updateNotice?.buttonText}
              onChange={(e) => handleUpdateNoticeChange('buttonText', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">Update Notice Message</label>
            <textarea
              rows={2}
              value={pwaState.updateNotice?.message}
              onChange={(e) => handleUpdateNoticeChange('message', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 5. Shortcuts Manager */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">5. Mobile Home Screen App Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={addShortcut}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Shortcut
          </button>
        </div>

        <div className="space-y-3">
          {pwaState.shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <input
                type="text"
                placeholder="Name"
                value={sc.name}
                onChange={(e) => handleShortcutChange(i, 'name', e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
              <input
                type="text"
                placeholder="Short Label"
                value={sc.shortName || ''}
                onChange={(e) => handleShortcutChange(i, 'shortName', e.target.value)}
                className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
              <input
                type="text"
                placeholder="Target URL (e.g. /?tab=video)"
                value={sc.url}
                onChange={(e) => handleShortcutChange(i, 'url', e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
              <button
                type="button"
                onClick={() => removeShortcut(i)}
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition-colors"
                title="Remove Shortcut"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
