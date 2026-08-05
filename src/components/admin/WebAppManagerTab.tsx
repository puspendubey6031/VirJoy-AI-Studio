import React, { useState } from 'react';
import { AppConfig, WebAppManagerConfig, UserRole } from '../../types';
import {
  Globe,
  Settings,
  Shield,
  UserCheck,
  Mail,
  ToggleLeft,
  ToggleRight,
  Save,
  Check,
  AlertTriangle,
  Crown
} from 'lucide-react';

interface WebAppManagerTabProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  showToast: (msg: string) => void;
}

export const WebAppManagerTab: React.FC<WebAppManagerTabProps> = ({
  config,
  onUpdateConfig,
  showToast
}) => {
  const [webAppConfig, setWebAppConfig] = useState<WebAppManagerConfig>(() => ({
    appName: 'VirJoy AI Studio',
    appTitle: 'VirJoy AI Studio - AI Video & Graphic Creation Platform',
    appDescription: 'Create professional 1080p/4K AI videos, thumbnail graphics, neural voices, and marketing banners in seconds.',
    primaryDomain: 'virjoy.ai',
    maintenanceMode: false,
    allowPublicSignups: true,
    enableGuestMode: true,
    defaultUserRole: 'Free User',
    metaKeywords: ['AI Video', 'Gemini Video', 'YouTube Shorts AI', 'Text to Video', 'Thumbnail Generator'],
    ownerEmail: 'puspendubey6031@gmail.com',
    ...(config.webAppManagerConfig || {})
  }));

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      webAppManagerConfig: webAppConfig
    });
    showToast('Web App configuration saved successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" />
            Web Application & Platform Master Manager
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Global web application metadata, OWNER_EMAIL detection, signup permissions, and guest access.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
        >
          <Save className="w-4 h-4" />
          Save Web App Config
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Account Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Owner Account Configuration (OWNER_EMAIL)
          </h4>

          <div>
            <label className="text-xs text-slate-400 mb-1 block font-semibold">Configured Owner Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                value={webAppConfig.ownerEmail}
                onChange={(e) => setWebAppConfig({ ...webAppConfig, ownerEmail: e.target.value })}
                placeholder="puspendubey6031@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-mono"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              When a user logs in with this email, they automatically get the <strong className="text-amber-300">Owner</strong> role, Unlimited Credits, Unlimited Generations, No Watermarks, and Developer Mode.
            </p>
          </div>
        </div>

        {/* Global Access & Signup Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            User Registration & Access Controls
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <h5 className="text-sm font-semibold text-white">Allow Public Signups</h5>
                <p className="text-xs text-slate-400">Enable new user registration on the website</p>
              </div>
              <button
                onClick={() => setWebAppConfig({ ...webAppConfig, allowPublicSignups: !webAppConfig.allowPublicSignups })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  webAppConfig.allowPublicSignups ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {webAppConfig.allowPublicSignups ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <h5 className="text-sm font-semibold text-white">Enable Guest Mode</h5>
                <p className="text-xs text-slate-400">Allow unregistered users to preview the studio interface</p>
              </div>
              <button
                onClick={() => setWebAppConfig({ ...webAppConfig, enableGuestMode: !webAppConfig.enableGuestMode })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  webAppConfig.enableGuestMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {webAppConfig.enableGuestMode ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Default User Role for New Accounts</label>
              <select
                value={webAppConfig.defaultUserRole}
                onChange={(e) => setWebAppConfig({ ...webAppConfig, defaultUserRole: e.target.value as UserRole })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="Free User">Free User</option>
                <option value="Premium User">Premium User</option>
                <option value="Moderator">Moderator</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* App Branding & Metadata */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h4 className="text-base font-bold text-white">App Branding & HTML Title Metadata</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Application Display Name</label>
            <input
              type="text"
              value={webAppConfig.appName}
              onChange={(e) => setWebAppConfig({ ...webAppConfig, appName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Primary Web Domain</label>
            <input
              type="text"
              value={webAppConfig.primaryDomain}
              onChange={(e) => setWebAppConfig({ ...webAppConfig, primaryDomain: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Browser Tab Title</label>
          <input
            type="text"
            value={webAppConfig.appTitle}
            onChange={(e) => setWebAppConfig({ ...webAppConfig, appTitle: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">SEO Meta Description</label>
          <textarea
            value={webAppConfig.appDescription}
            onChange={(e) => setWebAppConfig({ ...webAppConfig, appDescription: e.target.value })}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white"
          />
        </div>
      </div>
    </div>
  );
};
