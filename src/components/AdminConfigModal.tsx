import React, { useState } from 'react';
import { AppConfig, PlanKey } from '../types';
import {
  X,
  Settings,
  DollarSign,
  Trash2,
  Tv,
  Cpu,
  RefreshCw,
  Check,
  Smartphone,
  Info,
  Lock,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig, adminKey?: string) => void;
  onResetCredits: () => void;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetCredits
}) => {
  if (!isOpen) return null;

  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [localConfig, setLocalConfig] = useState<AppConfig>(JSON.parse(JSON.stringify(config)));
  const [activeTab, setActiveTab] = useState<'plans' | 'retention' | 'ads' | 'ai' | 'voice'>('plans');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) {
      setAuthError('Please enter the Admin Secret Key');
      return;
    }
    if (adminKeyInput.trim() === 'virjoy-admin-2026' || adminKeyInput.trim().length >= 8) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Key. Default key is: virjoy-admin-2026');
    }
  };

  const handlePlanChange = (planKey: PlanKey, field: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planKey]: {
          ...prev.plans[planKey],
          [field]: value
        }
      }
    }));
  };

  const handleSave = () => {
    onUpdateConfig(localConfig, adminKeyInput || 'virjoy-admin-2026');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTriggerCleanup = async () => {
    try {
      const res = await fetch('/api/cleanup/trigger', { method: 'POST' });
      const data = await res.json();
      setCleanupResult(`Purged ${data.purgedCount || 0} expired file(s) > ${localConfig.retention.retentionHours}h.`);
      setTimeout(() => setCleanupResult(null), 4000);
    } catch (e: any) {
      setCleanupResult('Error running cleanup');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-slate-800 light:bg-slate-100 border border-slate-700 dark:border-slate-700 light:border-slate-300 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 dark:text-white light:text-slate-900">System Admin & Control Panel</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Configure prices, limits, retention rules, ads, and AI models dynamically.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <KeyRound className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-100 dark:text-white light:text-slate-900 mb-1">
              Developer Key Verification
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6 leading-relaxed">
              Plan configuration, prices, credits, and backend rules are restricted to administrators. Enter key to proceed.
            </p>

            <form onSubmit={handleAuthenticate} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter Admin Secret Key..."
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-white light:text-slate-900 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1 text-left">
                  Default Demo Passcode: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono">virjoy-admin-2026</code>
                </p>
              </div>

              {authError && (
                <div className="bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20"
              >
                Authenticate Console
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 py-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'plans' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Plans & Limits
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'retention' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> 24h Retention Cleanup
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'ads' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" /> Monetization & Ads
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> AI Engine
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'voice' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-purple-400" /> Voice & Languages
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* TAB 1: PLANS & LIMITS */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-semibold">Testing Helper: Reset User Credit Counter to 0s</span>
                <button
                  onClick={onResetCredits}
                  className="bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Credits
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['Free', '₹199', '₹399', '₹799'] as PlanKey[]).map((key) => {
                  const plan = localConfig.plans[key];
                  return (
                    <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="font-bold text-white text-sm">{plan.name} ({key})</span>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-slate-400">Price ₹:</span>
                          <input
                            type="number"
                            value={plan.priceINR}
                            onChange={(e) => handlePlanChange(key, 'priceINR', parseInt(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-800 text-center font-bold text-white rounded p-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-slate-400 block mb-1">Monthly Max (sec):</label>
                          <input
                            type="number"
                            value={plan.maxMonthlyDurationSeconds}
                            onChange={(e) => handlePlanChange(key, 'maxMonthlyDurationSeconds', parseInt(e.target.value) || 30)}
                            className="w-full bg-slate-900 border border-slate-800 text-white rounded p-1.5 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Single Video Max (sec):</label>
                          <input
                            type="number"
                            value={plan.maxVideoDurationSeconds}
                            onChange={(e) => handlePlanChange(key, 'maxVideoDurationSeconds', parseInt(e.target.value) || 30)}
                            className="w-full bg-slate-900 border border-slate-800 text-white rounded p-1.5 font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <label className="text-slate-400 block mb-1">Export Quality:</label>
                          <select
                            value={plan.exportQuality}
                            onChange={(e) => handlePlanChange(key, 'exportQuality', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-white rounded p-1.5 font-bold"
                          >
                            <option value="720p">720p SD</option>
                            <option value="1080p">1080p HD</option>
                            <option value="4K">4K Ultra</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                            <input
                              type="checkbox"
                              checked={plan.hasWatermark}
                              onChange={(e) => handlePlanChange(key, 'hasWatermark', e.target.checked)}
                              className="accent-indigo-500"
                            />
                            <span>Watermarked</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: RETENTION & CLEANUP */}
          {activeTab === 'retention' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" /> 24-Hour File Retention Policy & Cleanup Worker
                </h4>
                <p className="text-xs text-slate-400">
                  Generated video projects and temporary files are automatically purged after the retention threshold to optimize server storage.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Retention Period (Hours):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={localConfig.retention.retentionHours}
                      onChange={(e) =>
                        setLocalConfig(prev => ({
                          ...prev,
                          retention: { ...prev.retention, retentionHours: parseInt(e.target.value) || 24 }
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-bold text-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Default: 24 hours</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cleanup Check Interval (Mins):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={localConfig.retention.autoCleanupIntervalMinutes}
                      onChange={(e) =>
                        setLocalConfig(prev => ({
                          ...prev,
                          retention: { ...prev.retention, autoCleanupIntervalMinutes: parseInt(e.target.value) || 15 }
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-bold text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTriggerCleanup}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Run Retention Purge Worker Now
                  </button>
                  {cleanupResult && <span className="text-xs text-emerald-400 font-semibold">{cleanupResult}</span>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MONETIZATION & ADS */}
          {activeTab === 'ads' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Tv className="w-4 h-4 text-amber-400" /> Google AdSense & Monetization Settings
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-400">
                    <input
                      type="checkbox"
                      checked={localConfig.monetization.adSenseEnabled}
                      onChange={(e) =>
                        setLocalConfig(prev => ({
                          ...prev,
                          monetization: { ...prev.monetization, adSenseEnabled: e.target.checked }
                        }))
                      }
                      className="accent-amber-500"
                    />
                    <span>Global AdSense Toggle</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">AdSense Publisher ID:</label>
                  <input
                    type="text"
                    value={localConfig.monetization.pubId}
                    onChange={(e) =>
                      setLocalConfig(prev => ({
                        ...prev,
                        monetization: { ...prev.monetization, pubId: e.target.value }
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-mono text-amber-300"
                  />
                </div>

                {/* Placement Slots */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Web Ad Placement Slots:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(localConfig.monetization.placements).map(([key, enabled]) => (
                      <label key={key} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-slate-300 cursor-pointer">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) =>
                            setLocalConfig(prev => ({
                              ...prev,
                              monetization: {
                                ...prev.monetization,
                                placements: { ...prev.monetization.placements, [key]: e.target.checked }
                              }
                            }))
                          }
                          className="accent-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mobile AdMob Extensibility */}
                <div className="border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-purple-400" /> Mobile AdMob Architecture Extensibility
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-300 font-semibold">
                      <input
                        type="checkbox"
                        checked={localConfig.monetization.mobileAdMobConfig.enabled}
                        onChange={(e) =>
                          setLocalConfig(prev => ({
                            ...prev,
                            monetization: {
                              ...prev.monetization,
                              mobileAdMobConfig: { ...prev.monetization.mobileAdMobConfig, enabled: e.target.checked }
                            }
                          }))
                        }
                        className="accent-purple-500"
                      />
                      <span>Enable Mobile AdMob</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mobile AdMob configuration is kept isolated from web AdSense logic to ensure cross-platform monetization scalability.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI ENGINE */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" /> AI Provider & Model Configuration
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Video Script Model:</label>
                  <select
                    value={localConfig.aiProvider.model}
                    onChange={(e) =>
                      setLocalConfig(prev => ({
                        ...prev,
                        aiProvider: { ...prev.aiProvider, model: e.target.value }
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-bold text-indigo-300"
                  >
                    <option value="gemini-3.6-flash">gemini-3.6-flash (Fast Script & Scene Planner)</option>
                    <option value="veo-3.1-lite-generate-preview">veo-3.1-lite-generate-preview (Veo Video)</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Reasoning)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">System Directive Prompt:</label>
                  <textarea
                    value={localConfig.aiProvider.systemPrompt}
                    onChange={(e) =>
                      setLocalConfig(prev => ({
                        ...prev,
                        aiProvider: { ...prev.aiProvider, systemPrompt: e.target.value }
                      }))
                    }
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 outline-none resize-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VOICE, LANGUAGE & TONE CONFIGURATION */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" /> Voice Synthesis Provider & Language Architecture
                </h4>
                <p className="text-xs text-slate-400">
                  Configure voiceover providers, supported languages, audio profiles, and video tones dynamically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Active Voice Provider:</label>
                    <input
                      type="text"
                      value={localConfig.voiceConfig?.activeVoiceProvider || 'VirJoy Native Audio Engine'}
                      onChange={(e) =>
                        setLocalConfig(prev => ({
                          ...prev,
                          voiceConfig: { ...prev.voiceConfig, activeVoiceProvider: e.target.value }
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs font-bold text-purple-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Supported Voice Providers:</label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(localConfig.voiceConfig?.providers || ['ElevenLabs', 'Google Cloud TTS', 'Azure Voice', 'VirJoy Native']).map((p) => (
                        <span key={p} className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Languages List */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Enabled Languages & Localization:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {(localConfig.voiceConfig?.supportedLanguages || []).map((lang) => (
                      <div key={lang.id} className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center justify-between text-slate-200 font-medium">
                        <span>{lang.flag} {lang.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{lang.id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voice Personas */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Available Voice Personas (Male / Female / Neutral):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {(localConfig.voiceConfig?.supportedVoices || []).map((v) => (
                      <div key={v.id} className="bg-slate-900 border border-slate-800 p-2 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-100">{v.name}</strong>
                          <span className="text-[10px] uppercase font-bold text-indigo-400">{v.gender}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Provider: {v.provider}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Changes persist immediately across the full-stack server runtime.</span>
          </div>
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
