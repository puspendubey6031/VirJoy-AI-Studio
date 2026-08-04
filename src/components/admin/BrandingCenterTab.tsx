import React, { useState } from 'react';
import { AppConfig, BrandingConfig } from '../../types';
import {
  Palette,
  Save,
  RotateCcw,
  Globe,
  Mail,
  FileText,
  Share2,
  Info,
  CheckCircle2,
  Sparkles,
  Link,
  Image as ImageIcon
} from 'lucide-react';

interface BrandingCenterTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const BrandingCenterTab: React.FC<BrandingCenterTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    return (
      config.brandingConfig || {
        appName: 'VirJoy AI',
        companyName: 'VirJoy Technologies Inc.',
        logoUrl: '/favicon.ico',
        splashLogoUrl: '/favicon.ico',
        appIconUrl: '/favicon.ico',
        supportEmail: 'support@virjoy.ai',
        websiteUrl: 'https://virjoy.ai',
        privacyPolicyUrl: 'https://virjoy.ai/privacy',
        termsUrl: 'https://virjoy.ai/terms',
        aboutUrl: 'https://virjoy.ai/about',
        socialLinks: {
          twitter: 'https://twitter.com/virjoyai',
          youtube: 'https://youtube.com/@virjoyai',
          discord: 'https://discord.gg/virjoy',
          github: 'https://github.com/virjoy-ai',
          instagram: 'https://instagram.com/virjoy.ai'
        },
        versionNotes: 'v3.5.0 Enterprise Control Center Build - High Performance Video Engine with Multi-Provider Auto-Fallback.'
      }
    );
  });

  const handleSaveBranding = () => {
    onSave('branding_config', branding);
    showToast('App Identity & Branding updated dynamically!');
  };

  const handleReset = () => {
    if (config.brandingConfig) {
      setBranding(JSON.parse(JSON.stringify(config.brandingConfig)));
      showToast('Reverted branding to saved values.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Platform Identity & Branding Center
          </h4>
          <p className="text-xs text-slate-400">Dynamically update app name, logos, legal document links, social channels, and release release notes.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleSaveBranding}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Branding
          </button>
        </div>
      </div>

      {/* Basic App Metadata */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h5 className="font-bold text-white text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" /> Primary Application Metadata
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Application Name</label>
            <input
              type="text"
              value={branding.appName}
              onChange={(e) => setBranding(prev => ({ ...prev, appName: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Company / Entity Name</label>
            <input
              type="text"
              value={branding.companyName}
              onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Support Email Address</label>
            <input
              type="email"
              value={branding.supportEmail}
              onChange={(e) => setBranding(prev => ({ ...prev, supportEmail: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Official Website URL</label>
            <input
              type="url"
              value={branding.websiteUrl}
              onChange={(e) => setBranding(prev => ({ ...prev, websiteUrl: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Asset URLs & Logo Icons */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h5 className="font-bold text-white text-sm flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-purple-400" /> Logo Assets & Vector Graphics
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Header Logo URL</label>
            <input
              type="text"
              value={branding.logoUrl}
              onChange={(e) => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Splash Screen Logo URL</label>
            <input
              type="text"
              value={branding.splashLogoUrl}
              onChange={(e) => setBranding(prev => ({ ...prev, splashLogoUrl: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Favicon / App Icon URL</label>
            <input
              type="text"
              value={branding.appIconUrl}
              onChange={(e) => setBranding(prev => ({ ...prev, appIconUrl: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Legal & Document Links */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h5 className="font-bold text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" /> Legal & Terms Documentation URLs
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Privacy Policy URL</label>
            <input
              type="url"
              value={branding.privacyPolicyUrl}
              onChange={(e) => setBranding(prev => ({ ...prev, privacyPolicyUrl: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Terms of Service URL</label>
            <input
              type="url"
              value={branding.termsUrl}
              onChange={(e) => setBranding(prev => ({ ...prev, termsUrl: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">About Us Page URL</label>
            <input
              type="url"
              value={branding.aboutUrl}
              onChange={(e) => setBranding(prev => ({ ...prev, aboutUrl: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Social Links & Version Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Social Links */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h5 className="font-bold text-white text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-400" /> Social Channels & Community Links
          </h5>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Twitter / X</label>
              <input
                type="text"
                value={branding.socialLinks.twitter || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">YouTube Channel</label>
              <input
                type="text"
                value={branding.socialLinks.youtube || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))}
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Discord Community</label>
              <input
                type="text"
                value={branding.socialLinks.discord || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, discord: e.target.value } }))}
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Release Notes */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h5 className="font-bold text-white text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" /> Version Release Notes Tag
          </h5>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-400">Release Notes & Version Tagline</label>
            <textarea
              rows={5}
              value={branding.versionNotes}
              onChange={(e) => setBranding(prev => ({ ...prev, versionNotes: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
