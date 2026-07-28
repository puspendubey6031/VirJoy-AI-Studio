import React, { useState } from 'react';
import { AppConfig, PlanKey, APIKeysConfig, CustomProviderKey } from '../types';
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
  ShieldAlert,
  Eye,
  EyeOff,
  Plus,
  PlusCircle,
  Save
} from 'lucide-react';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig, adminKey?: string) => void;
  onResetCredits: () => void;
  isAdmin?: boolean;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetCredits,
  isAdmin = false
}) => {
  if (!isOpen) return null;

  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [localConfig, setLocalConfig] = useState<AppConfig>(() => {
    const parsed = JSON.parse(JSON.stringify(config));
    if (!parsed.apiKeys) {
      parsed.apiKeys = {
        geminiApiKey: '',
        groqApiKey: '',
        cohereApiKey: '',
        huggingFaceApiKey: '',
        mistralApiKey: '',
        pexelsApiKey: '',
        pixabayApiKey: '',
        unsplashApiKey: '',
        razorpayKeyId: '',
        razorpayKeySecret: '',
        customProviders: []
      };
    }
    if (!parsed.apiKeys.customProviders) {
      parsed.apiKeys.customProviders = [];
    }
    return parsed;
  });
  const [activeTab, setActiveTab] = useState<'apikeys' | 'plans' | 'retention' | 'ads' | 'ai' | 'voice' | 'password'>('apikeys');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  // Key Visibility & Saved Notification state
  const [visibleKeyFields, setVisibleKeyFields] = useState<Record<string, boolean>>({});
  const [savedFieldKeys, setSavedFieldKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeyFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSingleSave = (fieldKey: string) => {
    onUpdateConfig(localConfig, adminKeyInput);
    setSavedFieldKeys(prev => ({ ...prev, [fieldKey]: true }));
    setTimeout(() => {
      setSavedFieldKeys(prev => ({ ...prev, [fieldKey]: false }));
    }, 2500);
  };

  // Dynamic Custom API Provider state
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomEnvVar, setNewCustomEnvVar] = useState('');
  const [newCustomApiKey, setNewCustomApiKey] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  const handleAddCustomProvider = () => {
    if (!newCustomName.trim() || !newCustomEnvVar.trim()) return;
    const formattedEnvVar = newCustomEnvVar.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const newProvider: CustomProviderKey = {
      id: 'prov_' + Date.now(),
      name: newCustomName.trim(),
      envVar: formattedEnvVar,
      apiKey: newCustomApiKey.trim()
    };

    setLocalConfig(prev => {
      const existing = prev.apiKeys?.customProviders || [];
      return {
        ...prev,
        apiKeys: {
          ...prev.apiKeys,
          customProviders: [...existing, newProvider]
        }
      };
    });

    setNewCustomName('');
    setNewCustomEnvVar('');
    setNewCustomApiKey('');
    setShowAddCustomModal(false);
  };

  const handleRemoveCustomProvider = (id: string) => {
    setLocalConfig(prev => {
      const existing = prev.apiKeys?.customProviders || [];
      return {
        ...prev,
        apiKeys: {
          ...prev.apiKeys,
          customProviders: existing.filter(p => p.id !== id)
        }
      };
    });
  };

  const handleCustomProviderKeyChange = (id: string, value: string) => {
    setLocalConfig(prev => {
      const existing = prev.apiKeys?.customProviders || [];
      return {
        ...prev,
        apiKeys: {
          ...prev.apiKeys,
          customProviders: existing.map(p => p.id === id ? { ...p, apiKey: value } : p)
        }
      };
    });
  };

  const renderApiKeyInput = (
    fieldKey: string,
    label: string,
    placeholder: string,
    value: string,
    onChange: (val: string) => void
  ) => {
    const isVisible = visibleKeyFields[fieldKey] || false;
    const isSaved = savedFieldKeys[fieldKey] || false;

    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-semibold text-slate-300 text-xs">{label}</label>
          {isSaved && (
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 transition-all">
              <Check className="w-3.5 h-3.5" /> Saved Successfully
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 pr-10 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              style={{
                WebkitTextSecurity: isVisible ? 'none' : 'disc',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                WebkitTouchCallout: 'default',
                touchAction: 'auto',
                pointerEvents: 'auto'
              } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => toggleKeyVisibility(fieldKey)}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isVisible ? "Hide value" : "Show value"}
            >
              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleSingleSave(fieldKey)}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
            title="Save this key"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    );
  };

  // Admin Password Change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPass) {
      setPassError('Please enter your current admin password.');
      return;
    }
    if (!newPass) {
      setPassError('Please enter a new password.');
      return;
    }
    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New password and Confirm password do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPass,
          newPassword: newPass,
          confirmPassword: confirmPass
        })
      });
      const data = await res.json();
      if (data.success) {
        setPassSuccess(data.message || 'Password updated successfully!');
        setAdminKeyInput(newPass);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassError(data.message || 'Failed to update admin password.');
      }
    } catch (err: any) {
      setPassError('Network error while updating password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) {
      setAuthError('Please enter the Admin Secret Key');
      return;
    }
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminKeyInput.trim() })
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError(data.message || 'Access Denied: Invalid Admin Password');
      }
    } catch (err: any) {
      setAuthError('Error verifying admin password. Please try again.');
    }
  };

  const handleApiKeyChange = (field: keyof APIKeysConfig, value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      apiKeys: {
        ...(prev.apiKeys || {}),
        [field]: value
      }
    }));
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
    onUpdateConfig(localConfig, adminKeyInput);
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
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Enter Admin Secret Key..."
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-white light:text-slate-900 text-sm pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:border-indigo-500"
                    style={{
                      WebkitTextSecurity: visibleKeyFields['admin_login'] ? 'none' : 'disc',
                      userSelect: 'text',
                      WebkitUserSelect: 'text',
                      WebkitTouchCallout: 'default',
                      touchAction: 'auto',
                      pointerEvents: 'auto'
                    } as React.CSSProperties}
                  />
                  <div className="absolute right-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility('admin_login')}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={visibleKeyFields['admin_login'] ? "Hide password" : "Show password"}
                    >
                      {visibleKeyFields['admin_login'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
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
            onClick={() => setActiveTab('apikeys')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'apikeys' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" /> API Key Configuration
          </button>
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
          <button
            onClick={() => setActiveTab('password')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'password' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Change Admin Password
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* TAB 0: API KEY CONFIGURATION */}
          {activeTab === 'apikeys' && (
            <div className="space-y-5">
              {/* AI & Media Provider Keys */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" /> Standard AI Engine & Media Generation API Keys
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {renderApiKeyInput(
                    'gemini',
                    'GEMINI_API_KEY (Primary AI Provider):',
                    'AIzaSy...',
                    localConfig.apiKeys?.geminiApiKey || '',
                    (val) => handleApiKeyChange('geminiApiKey', val)
                  )}

                  {renderApiKeyInput(
                    'groq',
                    'GROQ_API_KEY (Script Fallback 1):',
                    'gsk_...',
                    localConfig.apiKeys?.groqApiKey || '',
                    (val) => handleApiKeyChange('groqApiKey', val)
                  )}

                  {renderApiKeyInput(
                    'cohere',
                    'COHERE_API_KEY (Script Fallback 2):',
                    'cohere_...',
                    localConfig.apiKeys?.cohereApiKey || '',
                    (val) => handleApiKeyChange('cohereApiKey', val)
                  )}

                  {renderApiKeyInput(
                    'huggingface',
                    'HUGGINGFACE_API_KEY (FLUX / Wan2.1 / LTX Video):',
                    'hf_...',
                    localConfig.apiKeys?.huggingFaceApiKey || '',
                    (val) => handleApiKeyChange('huggingFaceApiKey', val)
                  )}

                  {renderApiKeyInput(
                    'mistral',
                    'MISTRAL_API_KEY (Script Fallback 3 / Mistral AI):',
                    'mistral_...',
                    localConfig.apiKeys?.mistralApiKey || '',
                    (val) => handleApiKeyChange('mistralApiKey', val)
                  )}
                </div>
              </div>

              {/* Payment Gateway & Stock Media Keys */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Payment Gateway & Stock Media API Keys
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {renderApiKeyInput(
                    'razorpay_id',
                    'RAZORPAY_KEY_ID:',
                    'rzp_test_...',
                    localConfig.apiKeys?.razorpayKeyId || '',
                    (val) => handleApiKeyChange('razorpayKeyId', val)
                  )}

                  {renderApiKeyInput(
                    'razorpay_secret',
                    'RAZORPAY_KEY_SECRET:',
                    'Secret key...',
                    localConfig.apiKeys?.razorpayKeySecret || '',
                    (val) => handleApiKeyChange('razorpayKeySecret', val)
                  )}

                  {renderApiKeyInput(
                    'pexels',
                    'PEXELS_API_KEY:',
                    'Pexels key...',
                    localConfig.apiKeys?.pexelsApiKey || '',
                    (val) => handleApiKeyChange('pexelsApiKey', val)
                  )}

                  {renderApiKeyInput(
                    'pixabay',
                    'PIXABAY_API_KEY:',
                    'Pixabay key...',
                    localConfig.apiKeys?.pixabayApiKey || '',
                    (val) => handleApiKeyChange('pixabayApiKey', val)
                  )}

                  <div className="md:col-span-2">
                    {renderApiKeyInput(
                      'unsplash',
                      'UNSPLASH_ACCESS_KEY:',
                      'Unsplash key...',
                      localConfig.apiKeys?.unsplashApiKey || '',
                      (val) => handleApiKeyChange('unsplashApiKey', val)
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Custom API Providers */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-indigo-400" /> Dynamic Custom API Providers
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Provider
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Add custom third-party AI, video, image, or media API providers dynamically without touching code or rebuilding the UI. Environment variables update in runtime server state immediately.
                </p>

                {(localConfig.apiKeys?.customProviders || []).length === 0 ? (
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-center text-xs text-slate-400">
                    No custom API providers added yet. Click "+ Add Provider" above to define custom keys (e.g. DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {(localConfig.apiKeys?.customProviders || []).map((prov) => (
                      <div key={prov.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-3 relative">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100">{prov.name}</span>
                            <span className="font-mono text-[10px] text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                              {prov.envVar}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomProvider(prov.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                            title="Delete Provider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {renderApiKeyInput(
                          prov.id,
                          `API Key Value:`,
                          `Key for ${prov.name}...`,
                          prov.apiKey || '',
                          (val) => handleCustomProviderKeyChange(prov.id, val)
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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

          {/* TAB 6: CHANGE ADMIN PASSWORD */}
          {activeTab === 'password' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 max-w-lg mx-auto">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Change Admin Password</h4>
                  <p className="text-xs text-slate-400">Update the administrative secret key for system control access.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                {renderApiKeyInput(
                  'current_pass',
                  'Current Password:',
                  'Enter current password...',
                  currentPass,
                  setCurrentPass
                )}

                {renderApiKeyInput(
                  'new_pass',
                  'New Password (Min. 8 characters):',
                  'Enter new password...',
                  newPass,
                  setNewPass
                )}

                {renderApiKeyInput(
                  'confirm_pass',
                  'Confirm New Password:',
                  'Re-enter new password...',
                  confirmPass,
                  setConfirmPass
                )}

                {passError && (
                  <div className="bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}

                {passSuccess && (
                  <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isChangingPass ? 'Saving Password...' : 'Save Password'}
                </button>
              </form>
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

      {/* Add Custom Provider Modal Dialog */}
      {showAddCustomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Add Custom API Provider</h3>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Provider Display Name:</label>
              <input
                type="text"
                placeholder="e.g. DeepSeek AI, Anthropic"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl font-sans text-slate-200 focus:outline-none focus:border-indigo-500"
                style={{ userSelect: 'text', WebkitUserSelect: 'text', WebkitTouchCallout: 'default' }}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Environment Variable Name:</label>
              <input
                type="text"
                placeholder="e.g. DEEPSEEK_API_KEY"
                value={newCustomEnvVar}
                onChange={(e) => setNewCustomEnvVar(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 uppercase"
                style={{ userSelect: 'text', WebkitUserSelect: 'text', WebkitTouchCallout: 'default' }}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Standard env key name (e.g. DEEPSEEK_API_KEY, ANTHROPIC_API_KEY).
              </span>
            </div>

            {renderApiKeyInput(
              'new_custom_key',
              'API Key Value:',
              'sk-...',
              newCustomApiKey,
              setNewCustomApiKey
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomProvider}
                disabled={!newCustomName.trim() || !newCustomEnvVar.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-semibold disabled:opacity-50 cursor-pointer"
              >
                Add Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
