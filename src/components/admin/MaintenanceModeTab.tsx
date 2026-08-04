import React, { useState } from 'react';
import { AppConfig, MaintenanceConfig } from '../../types';
import {
  ShieldAlert,
  Save,
  RotateCcw,
  Clock,
  Plus,
  Trash2,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  Globe
} from 'lucide-react';

interface MaintenanceModeTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const MaintenanceModeTab: React.FC<MaintenanceModeTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>(() => {
    return (
      config.maintenanceConfig || {
        enabled: false,
        message: 'VirJoy AI is currently undergoing scheduled platform upgrades. We will be back online shortly!',
        expectedReturnTime: '2026-07-30 04:00 UTC',
        displayMode: 'Banner',
        whitelistedAdminEmails: ['puspendubey6031@gmail.com', 'admin@virjoy.ai'],
        whitelistedIps: ['127.0.0.1']
      }
    );
  });

  const [newEmail, setNewEmail] = useState('');
  const [newIp, setNewIp] = useState('');

  const handleAddEmail = () => {
    if (!newEmail.trim() || maintenance.whitelistedAdminEmails.includes(newEmail.trim())) return;
    setMaintenance(prev => ({
      ...prev,
      whitelistedAdminEmails: [...prev.whitelistedAdminEmails, newEmail.trim()]
    }));
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    setMaintenance(prev => ({
      ...prev,
      whitelistedAdminEmails: prev.whitelistedAdminEmails.filter(e => e !== email)
    }));
  };

  const handleAddIp = () => {
    if (!newIp.trim() || maintenance.whitelistedIps.includes(newIp.trim())) return;
    setMaintenance(prev => ({
      ...prev,
      whitelistedIps: [...prev.whitelistedIps, newIp.trim()]
    }));
    setNewIp('');
  };

  const handleRemoveIp = (ip: string) => {
    setMaintenance(prev => ({
      ...prev,
      whitelistedIps: prev.whitelistedIps.filter(i => i !== ip)
    }));
  };

  const handleSave = () => {
    onSave('maintenance_config', maintenance);
    showToast(`Maintenance Mode ${maintenance.enabled ? 'ENABLED' : 'DISABLED'} & Config Saved!`);
  };

  const handleReset = () => {
    if (config.maintenanceConfig) {
      setMaintenance(JSON.parse(JSON.stringify(config.maintenanceConfig)));
      showToast('Reverted maintenance configuration.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Master Switch Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> Platform Maintenance Center
          </h4>
          <p className="text-xs text-slate-400">Lock application or display maintenance warning banners to non-admin visitors.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Maintenance Settings
          </button>
        </div>
      </div>

      {/* Main Mode Toggle Card */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-5">
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div>
            <span className="font-bold text-white text-sm block">Maintenance Mode Switch</span>
            <span className="text-xs text-slate-400">When active, normal users will see the specified maintenance notice.</span>
          </div>

          <button
            onClick={() => setMaintenance(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              maintenance.enabled
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {maintenance.enabled ? 'ACTIVE (ON)' : 'INACTIVE (OFF)'}
          </button>
        </div>

        {/* Display Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Notice Display Format</label>
          <div className="grid grid-cols-3 gap-3">
            {(['Banner', 'Popup', 'Full Page'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMaintenance(prev => ({ ...prev, displayMode: mode }))}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  maintenance.displayMode === mode
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Title, Message, Image & Return Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Maintenance Page Title</label>
            <input
              type="text"
              value={maintenance.title || ''}
              onChange={(e) => setMaintenance(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Platform Maintenance & Upgrade in Progress"
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Expected Return Time</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={maintenance.expectedReturnTime}
                onChange={(e) => setMaintenance(prev => ({ ...prev, expectedReturnTime: e.target.value }))}
                placeholder="e.g. 2026-08-02 12:00 UTC"
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 pl-9"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3" />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300">Custom Maintenance Message</label>
            <textarea
              rows={3}
              value={maintenance.message}
              onChange={(e) => setMaintenance(prev => ({ ...prev, message: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300">Banner / Splash Image URL</label>
            <input
              type="text"
              value={maintenance.imageUrl || ''}
              onChange={(e) => setMaintenance(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Whitelisted Admins & IPs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Whitelisted Emails */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Mail className="w-4 h-4 text-indigo-400" /> Whitelisted Admin Emails (Bypass Lock)
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddEmail}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {maintenance.whitelistedAdminEmails.map((email) => (
              <div key={email} className="flex justify-between items-center p-2 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-200">
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Whitelisted IPs */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Globe className="w-4 h-4 text-cyan-400" /> Whitelisted IP Addresses
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="192.168.1.1 or 127.0.0.1"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddIp}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {maintenance.whitelistedIps.map((ip) => (
              <div key={ip} className="flex justify-between items-center p-2 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-200 font-mono">
                <span>{ip}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIp(ip)}
                  className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
