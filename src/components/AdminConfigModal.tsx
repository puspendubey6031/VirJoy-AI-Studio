import React, { useState, useEffect } from 'react';
import { AppConfig, PlanKey, APIKeysConfig, CustomProviderKey } from '../types';
import { defaultConfig } from '../server/configStore';
import { ThemeManagerTab } from './admin/ThemeManagerTab';
import { CreditsManagerTab } from './admin/CreditsManagerTab';
import { APIProviderManagerTab } from './admin/APIProviderManagerTab';
import { UsersManagerTab } from './admin/UsersManagerTab';
import { SubscriptionsManagerTab } from './admin/SubscriptionsManagerTab';
import { PaymentsManagerTab } from './admin/PaymentsManagerTab';
import { NotificationsManagerTab } from './admin/NotificationsManagerTab';
import { CrossPromotionTab } from './admin/CrossPromotionTab';
import { ReferralManagerTab } from './admin/ReferralManagerTab';
import { ActivityLogsTab } from './admin/ActivityLogsTab';
import { AnalyticsDashboardTab } from './admin/AnalyticsDashboardTab';
import { RevenueCenterTab } from './admin/RevenueCenterTab';
import { ProviderHealthTab } from './admin/ProviderHealthTab';
import { SystemMonitorTab } from './admin/SystemMonitorTab';
import { DatabaseToolsTab } from './admin/DatabaseToolsTab';
import { MaintenanceModeTab } from './admin/MaintenanceModeTab';
import { SecurityCenterTab } from './admin/SecurityCenterTab';
import { BrandingCenterTab } from './admin/BrandingCenterTab';
import { VideoJobsCenterTab } from './admin/VideoJobsCenterTab';
import { StorageManagerTab } from './admin/StorageManagerTab';
import { AIUsageLogsTab } from './admin/AIUsageLogsTab';
import { VideoHistoryManagerTab } from './admin/VideoHistoryManagerTab';
import { RenderPerformanceTab } from './admin/RenderPerformanceTab';
import { PWAConfigTab } from './admin/PWAConfigTab';
import { RetentionManagerTab } from './admin/RetentionManagerTab';
import { AdMobManagerTab } from './admin/AdMobManagerTab';
import { LegalPoliciesManagerTab } from './admin/LegalPoliciesManagerTab';
import { OnboardingManagerTab } from './admin/OnboardingManagerTab';
import { FeedbackManagerTab } from './admin/FeedbackManagerTab';
import { SystemHealthTab } from './admin/SystemHealthTab';
import { DeveloperModeTab } from './admin/DeveloperModeTab';
import { MarketplaceManagerTab } from './admin/MarketplaceManagerTab';
import { CommissionManagerTab } from './admin/CommissionManagerTab';
import { ToolManagerTab } from './admin/ToolManagerTab';
import { WebAppManagerTab } from './admin/WebAppManagerTab';
import {
  X,
  Settings,
  DollarSign,
  Trash2,
  Tv,
  Cpu,
  ShoppingBag,
  Percent,
  Wrench,
  Globe,
  Code,
  Crown,
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
  Save,
  BarChart3,
  Users,
  User,
  Zap,
  HardDrive,
  Activity,
  ShieldCheck,
  Shield,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
  Database,
  Palette,
  Coins,
  Sparkles
} from 'lucide-react';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig, adminKey?: string) => void;
  onResetCredits: () => void;
  isAdmin?: boolean;
  userEmail?: string;
  isOwner?: boolean;
}

interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  revenueINR: number;
  totalVideos: number;
  aiProvidersCount: number;
  totalCreditsAllocated: number;
  usedCredits: number;
  storageUsedMB: string;
  apiStatus: string;
  systemHealth: string;
  retentionPurgedCount?: number;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetCredits,
  isAdmin = false,
  userEmail,
  isOwner = false
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
    if (!parsed.themeConfig) parsed.themeConfig = defaultConfig.themeConfig;
    if (!parsed.creditsConfig) parsed.creditsConfig = defaultConfig.creditsConfig;
    if (!parsed.providerManagerConfig) parsed.providerManagerConfig = defaultConfig.providerManagerConfig;
    if (!parsed.usersList) parsed.usersList = defaultConfig.usersList;
    if (!parsed.paymentsList) parsed.paymentsList = defaultConfig.paymentsList;
    if (!parsed.notificationsList) parsed.notificationsList = defaultConfig.notificationsList;
    if (!parsed.crossPromotionsList) parsed.crossPromotionsList = defaultConfig.crossPromotionsList;
    if (!parsed.referralConfig) parsed.referralConfig = defaultConfig.referralConfig;
    if (!parsed.activityLogs) parsed.activityLogs = defaultConfig.activityLogs;
    return parsed;
  });

  const [activeTab, setActiveTab] = useState<
    | 'developer_mode'
    | 'marketplace'
    | 'commissions'
    | 'tool_manager'
    | 'webapp_manager'
    | 'onboarding'
    | 'feedback'
    | 'system_health'
    | 'dashboard'
    | 'videojobs'
    | 'storage'
    | 'aiusagelogs'
    | 'videohistory'
    | 'renderperf'
    | 'analytics'
    | 'revenue'
    | 'providerhealth'
    | 'sysmonitor'
    | 'dbtools'
    | 'maintenance'
    | 'security'
    | 'branding'
    | 'users'
    | 'subscriptions'
    | 'payments'
    | 'notifications'
    | 'crosspromo'
    | 'referrals'
    | 'logs'
    | 'theme'
    | 'credits'
    | 'providers'
    | 'apikeys'
    | 'plans'
    | 'retention'
    | 'ads'
    | 'ai'
    | 'voice'
    | 'password'
  >('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  // Dashboard Stats State
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 124,
    premiumUsers: 38,
    freeUsers: 86,
    revenueINR: 31142,
    totalVideos: 156,
    aiProvidersCount: 8,
    totalCreditsAllocated: 3600,
    usedCredits: 420,
    storageUsedMB: '1326.4',
    apiStatus: 'Operational',
    systemHealth: 'Healthy (100% Uptime)'
  });
  const [isFetchingStats, setIsFetchingStats] = useState(false);

  // Key Visibility & Saved Notification state
  const [visibleKeyFields, setVisibleKeyFields] = useState<Record<string, boolean>>({});
  const [savedFieldKeys, setSavedFieldKeys] = useState<Record<string, boolean>>({});

  // Sync prop changes into local state
  useEffect(() => {
    const parsed = JSON.parse(JSON.stringify(config));
    if (!parsed.themeConfig) parsed.themeConfig = defaultConfig.themeConfig;
    if (!parsed.creditsConfig) parsed.creditsConfig = defaultConfig.creditsConfig;
    if (!parsed.providerManagerConfig) parsed.providerManagerConfig = defaultConfig.providerManagerConfig;
    if (!parsed.usersList) parsed.usersList = defaultConfig.usersList;
    if (!parsed.paymentsList) parsed.paymentsList = defaultConfig.paymentsList;
    if (!parsed.notificationsList) parsed.notificationsList = defaultConfig.notificationsList;
    if (!parsed.crossPromotionsList) parsed.crossPromotionsList = defaultConfig.crossPromotionsList;
    if (!parsed.referralConfig) parsed.referralConfig = defaultConfig.referralConfig;
    if (!parsed.activityLogs) parsed.activityLogs = defaultConfig.activityLogs;
    setLocalConfig(parsed);
  }, [config]);

  // Fetch Dashboard Metrics on authentication or manual trigger
  const fetchDashboardStats = async () => {
    setIsFetchingStats(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.warn('Dashboard stats fetch notice:', e);
    } finally {
      setIsFetchingStats(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
    }
  }, [isAuthenticated]);

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeyFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isConfigChanged = JSON.stringify(localConfig) !== JSON.stringify(config);

  const handleSingleSave = (fieldKey: string, payload?: any) => {
    const keyMapping: Record<string, keyof AppConfig> = {
      payments_list: 'paymentsList',
      notifications_list: 'notificationsList',
      cross_promotions: 'crossPromotionsList',
      referral_config: 'referralConfig',
      activity_logs: 'activityLogs',
      users_list: 'usersList',
      theme_config: 'themeConfig',
      credits_config: 'creditsConfig',
      provider_manager_config: 'providerManagerConfig',
      maintenance_config: 'maintenanceConfig',
      branding_config: 'brandingConfig',
      security_logs: 'securityLogs'
    };

    let updatedConfig = localConfig;
    const targetKey = (keyMapping[fieldKey] || fieldKey) as keyof AppConfig;

    if (payload !== undefined) {
      updatedConfig = {
        ...localConfig,
        [targetKey]: payload
      };
      setLocalConfig(updatedConfig);
    }

    onUpdateConfig(updatedConfig, adminKeyInput);
    setSavedFieldKeys(prev => ({ ...prev, [fieldKey]: true }));
    showToast('Settings Updated Successfully');
    setTimeout(() => {
      setSavedFieldKeys(prev => ({ ...prev, [fieldKey]: false }));
    }, 2500);
  };

  const handleSaveAll = () => {
    setValidationError(null);
    // Validate required fields
    if (localConfig.retention.retentionHours < 1) {
      setValidationError('Retention hours must be at least 1 hour.');
      return;
    }
    onUpdateConfig(localConfig, adminKeyInput);
    showToast('Settings Updated Successfully');
  };

  const handleCancelChanges = () => {
    setLocalConfig(JSON.parse(JSON.stringify(config)));
    setValidationError(null);
    showToast('Unsaved changes cancelled.');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all admin configurations to system defaults?')) {
      const resetConf = JSON.parse(JSON.stringify(defaultConfig));
      setLocalConfig(resetConf);
      onUpdateConfig(resetConf, adminKeyInput);
      setValidationError(null);
      showToast('Settings reset to defaults and saved.');
    }
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
    showToast('Custom API Provider added');
  };

  const handleRemoveCustomProvider = (id: string) => {
    if (!window.confirm('Super Admin Security Action: Delete this API Provider?')) return;
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
    showToast('Provider removed successfully.');
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
              className="w-full bg-slate-900 border border-slate-800 p-2.5 pr-10 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
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
        showToast('Settings Updated Successfully');
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
        setActiveTab('dashboard');
      } else {
        setAuthError(data.message || 'Incorrect Password');
      }
    } catch (err: any) {
      setAuthError('Incorrect Password');
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

  const handleTriggerCleanup = async () => {
    try {
      const res = await fetch('/api/cleanup/trigger', { method: 'POST' });
      const data = await res.json();
      setCleanupResult(`Purged ${data.purgedCount || 0} expired file(s) > ${localConfig.retention.retentionHours}h.`);
      fetchDashboardStats();
      setTimeout(() => setCleanupResult(null), 4000);
    } catch (e: any) {
      setCleanupResult('Error running cleanup');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[92vh] flex flex-col transition-colors">
        
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-slate-800 light:bg-slate-100 border border-slate-700 dark:border-slate-700 light:border-slate-300 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100 dark:text-white light:text-slate-900">System Admin & Control Panel</h3>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" /> Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Enterprise control center for VirJoy AI full-stack platform.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <KeyRound className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-100 dark:text-white light:text-slate-900 mb-1">
              Admin Key Verification
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6 leading-relaxed">
              Plan configuration, prices, credits, and backend rules are restricted to administrators. Enter admin password to proceed.
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
                    placeholder="Enter Admin Password..."
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                Authenticate Admin Console
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Navigation Bar */}
            <div className="flex items-center gap-2 border-b border-slate-800 py-3 overflow-x-auto shrink-0">
              {(isOwner || userEmail === 'puspendubey6031@gmail.com') && (
                <button
                  onClick={() => setActiveTab('developer_mode')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'developer_mode'
                      ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-lg'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 text-amber-400" /> 👑 Developer Mode
                </button>
              )}
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'marketplace' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Marketplace
              </button>
              <button
                onClick={() => setActiveTab('commissions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'commissions' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-emerald-400" /> Commissions
              </button>
              <button
                onClick={() => setActiveTab('tool_manager')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'tool_manager' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-purple-400" /> Tool Manager
              </button>
              <button
                onClick={() => setActiveTab('webapp_manager')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'webapp_manager' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" /> Web App Manager
              </button>
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'onboarding' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Onboarding Manager
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'feedback' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-rose-400" /> Feedback & Bug Reports
              </button>
              <button
                onClick={() => setActiveTab('system_health')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'system_health' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> System Health Dashboard
              </button>
              <button
                onClick={() => setActiveTab('pwa')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'pwa' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Mobile PWA App
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Executive Dashboard
              </button>
              <button
                onClick={() => setActiveTab('videojobs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'videojobs' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" /> Video Jobs Center
              </button>
              <button
                onClick={() => setActiveTab('storage')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'storage' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Storage Manager
              </button>
              <button
                onClick={() => setActiveTab('aiusagelogs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'aiusagelogs' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-amber-400" /> AI Usage Logs
              </button>
              <button
                onClick={() => setActiveTab('videohistory')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'videohistory' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Video History
              </button>
              <button
                onClick={() => setActiveTab('renderperf')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'renderperf' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Processing Performance
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Analytics
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'revenue' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Revenue Center
              </button>
              <button
                onClick={() => setActiveTab('providerhealth')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'providerhealth' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> AI Provider Health
              </button>
              <button
                onClick={() => setActiveTab('sysmonitor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'sysmonitor' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> System Monitor
              </button>
              <button
                onClick={() => setActiveTab('dbtools')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dbtools' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-400" /> Database Tools
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'maintenance' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Maintenance Mode
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" /> Security Center
              </button>
              <button
                onClick={() => setActiveTab('branding')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'branding' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-pink-400" /> Branding Center
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Users Manager
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'subscriptions' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Subscription Manager
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" /> Payments & Ledger
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Broadcast Notices
              </button>
              <button
                onClick={() => setActiveTab('crosspromo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'crosspromo' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-400" /> Cross Promotion
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'referrals' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-pink-400" /> Referral Program
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Search & Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'theme' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-pink-400" /> Theme Manager
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'credits' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Credits Manager
              </button>
              <button
                onClick={() => setActiveTab('providers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'providers' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> API Provider Router
              </button>
              <button
                onClick={() => setActiveTab('apikeys')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'apikeys' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> API Keys
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Plans & Limits
              </button>
              <button
                onClick={() => setActiveTab('retention')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'retention' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Retention
              </button>
              <button
                onClick={() => setActiveTab('ads')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ads' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5" /> Monetization & Ads
              </button>
              <button
                onClick={() => setActiveTab('legal_policies')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'legal_policies' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Legal & Google Play Policies
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> AI Model Defaults
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'voice' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" /> Voice & Audio
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'password' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Password
              </button>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2 mt-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">

              {activeTab === 'developer_mode' && (
                <DeveloperModeTab
                  config={localConfig}
                  onUpdateConfig={(updated) => {
                    setLocalConfig(updated);
                    onUpdateConfig(updated);
                  }}
                  showToast={(msg) => setToastMessage(msg)}
                  isOwner={isOwner || userEmail === 'puspendubey6031@gmail.com'}
                />
              )}

              {activeTab === 'marketplace' && (
                <MarketplaceManagerTab
                  marketplaceItems={localConfig.marketplaceItems || []}
                  onChange={(updatedItems) => {
                    const updated = { ...localConfig, marketplaceItems: updatedItems };
                    setLocalConfig(updated);
                    onUpdateConfig(updated);
                  }}
                  showToast={(msg) => setToastMessage(msg)}
                />
              )}

              {activeTab === 'commissions' && (
                <CommissionManagerTab
                  commissionItems={localConfig.commissionItems || []}
                  onChange={(updatedComms) => {
                    const updated = { ...localConfig, commissionItems: updatedComms };
                    setLocalConfig(updated);
                    onUpdateConfig(updated);
                  }}
                  showToast={(msg) => setToastMessage(msg)}
                />
              )}

              {activeTab === 'tool_manager' && (
                <ToolManagerTab
                  config={localConfig}
                  onUpdateConfig={(updated) => {
                    setLocalConfig(updated);
                    onUpdateConfig(updated);
                  }}
                  showToast={(msg) => setToastMessage(msg)}
                />
              )}

              {activeTab === 'webapp_manager' && (
                <WebAppManagerTab
                  config={localConfig}
                  onUpdateConfig={(updated) => {
                    setLocalConfig(updated);
                    onUpdateConfig(updated);
                  }}
                  showToast={(msg) => setToastMessage(msg)}
                />
              )}
              
              {/* TAB: PWA MOBILE APP MANAGEMENT */}
              {activeTab === 'pwa' && (
                <PWAConfigTab
                  config={localConfig}
                  onSave={(updatedConfig) => handleSingleSave('pwaConfig', updatedConfig.pwaConfig)}
                />
              )}

              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-400" /> Executive Metrics Overview
                      </h4>
                      <p className="text-xs text-slate-400">Real-time stats from full-stack runtime & Supabase database.</p>
                    </div>
                    <button
                      onClick={fetchDashboardStats}
                      disabled={isFetchingStats}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingStats ? 'animate-spin' : ''}`} /> Refresh Metrics
                    </button>
                  </div>

                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Card 1: Total Users */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Total Users</span>
                        <Users className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-xl font-black text-white">{stats.totalUsers}</div>
                      <div className="text-[10px] text-indigo-400 font-medium mt-1">Registered Accounts</div>
                    </div>

                    {/* Card 2: Premium Users */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Premium Users</span>
                        <Crown className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-xl font-black text-amber-400">{stats.premiumUsers}</div>
                      <div className="text-[10px] text-amber-300 font-medium mt-1">Paid Subscribers</div>
                    </div>

                    {/* Card 3: Free Users */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Free Users</span>
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-xl font-black text-slate-300">{stats.freeUsers}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">Standard Tier</div>
                    </div>

                    {/* Card 4: Revenue */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Revenue</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-xl font-black text-emerald-400">₹{stats.revenueINR.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-300 font-medium mt-1">Razorpay Inflow</div>
                    </div>

                    {/* Card 5: Total Videos */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Total Videos</span>
                        <Zap className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-xl font-black text-purple-400">{stats.totalVideos}</div>
                      <div className="text-[10px] text-purple-300 font-medium mt-1">Rendered Projects</div>
                    </div>

                    {/* Card 6: AI Providers */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>AI Providers</span>
                        <Cpu className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-xl font-black text-blue-400">{stats.aiProvidersCount} Active</div>
                      <div className="text-[10px] text-blue-300 font-medium mt-1">Fallback Matrix</div>
                    </div>

                    {/* Card 7: Credits */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Credits</span>
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-xl font-black text-amber-300">{stats.usedCredits} Used</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">Allocated: {stats.totalCreditsAllocated}</div>
                    </div>

                    {/* Card 8: Storage */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Storage</span>
                        <HardDrive className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-xl font-black text-indigo-300">{stats.storageUsedMB} MB</div>
                      <div className="text-[10px] text-indigo-400 font-medium mt-1">Temp Video Files</div>
                    </div>

                    {/* Card 9: API Status */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>API Status</span>
                        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                      </div>
                      <div className="text-sm font-black text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        {stats.apiStatus}
                      </div>
                      <div className="text-[10px] text-emerald-300 font-medium mt-1">All Endpoints Live</div>
                    </div>

                    {/* Card 10: System Health */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>System Health</span>
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-xs font-black text-white">{stats.systemHealth}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">Purged: {stats.retentionPurgedCount || 0} Files</div>
                    </div>
                  </div>

                  {/* Admin Quick Action Tools */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-white block">System Utilities</span>
                      <span className="text-slate-400 text-[11px]">Run manual maintenance or credit resets directly.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onResetCredits}
                        className="px-3.5 py-2 bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Usage Credits
                      </button>
                      <button
                        onClick={handleTriggerCleanup}
                        className="px-3.5 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Trigger 24h Cleanup
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ONBOARDING MANAGER */}
              {activeTab === 'onboarding' && (
                <OnboardingManagerTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: FEEDBACK MANAGER */}
              {activeTab === 'feedback' && (
                <FeedbackManagerTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: SYSTEM HEALTH DASHBOARD */}
              {activeTab === 'system_health' && (
                <SystemHealthTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: VIDEO JOBS CENTER */}
              {activeTab === 'videojobs' && (
                <VideoJobsCenterTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: STORAGE MANAGER */}
              {activeTab === 'storage' && (
                <StorageManagerTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: AI USAGE LOGS */}
              {activeTab === 'aiusagelogs' && (
                <AIUsageLogsTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: VIDEO HISTORY MANAGER */}
              {activeTab === 'videohistory' && (
                <VideoHistoryManagerTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: RENDER PERFORMANCE DASHBOARD */}
              {activeTab === 'renderperf' && (
                <RenderPerformanceTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: ANALYTICS DASHBOARD */}
              {activeTab === 'analytics' && (
                <AnalyticsDashboardTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: REVENUE CENTER */}
              {activeTab === 'revenue' && (
                <RevenueCenterTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: PROVIDER HEALTH */}
              {activeTab === 'providerhealth' && (
                <ProviderHealthTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: SYSTEM MONITOR */}
              {activeTab === 'sysmonitor' && (
                <SystemMonitorTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: DATABASE TOOLS */}
              {activeTab === 'dbtools' && (
                <DatabaseToolsTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: MAINTENANCE MODE */}
              {activeTab === 'maintenance' && (
                <MaintenanceModeTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: SECURITY CENTER */}
              {activeTab === 'security' && (
                <SecurityCenterTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: BRANDING CENTER */}
              {activeTab === 'branding' && (
                <BrandingCenterTab
                  config={localConfig}
                  onSave={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: USERS MANAGEMENT */}
              {activeTab === 'users' && (
                <UsersManagerTab
                  usersList={localConfig.usersList || defaultConfig.usersList!}
                  onChange={(updated) => setLocalConfig(prev => ({ ...prev, usersList: updated }))}
                  onSaveSingle={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: SUBSCRIPTION MANAGEMENT */}
              {activeTab === 'subscriptions' && (
                <SubscriptionsManagerTab
                  plans={localConfig.plans || defaultConfig.plans}
                  subscriptionLockConfig={localConfig.subscriptionLockConfig || defaultConfig.subscriptionLockConfig!}
                  onChange={(updatedPlans) => setLocalConfig(prev => ({ ...prev, plans: updatedPlans }))}
                  onUpdateLockConfig={(updatedLockConfig) => setLocalConfig(prev => ({ ...prev, subscriptionLockConfig: updatedLockConfig }))}
                  onSaveSingle={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: PAYMENTS MANAGEMENT */}
              {activeTab === 'payments' && (
                <PaymentsManagerTab
                  paymentsList={localConfig.paymentsList || defaultConfig.paymentsList!}
                  onChange={(updated) => setLocalConfig(prev => ({ ...prev, paymentsList: updated }))}
                  onSaveSingle={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: NOTIFICATIONS BROADCAST */}
              {activeTab === 'notifications' && (
                <NotificationsManagerTab
                  notificationsList={localConfig.notificationsList || defaultConfig.notificationsList!}
                  onChange={(updated) => setLocalConfig(prev => ({ ...prev, notificationsList: updated }))}
                  onSaveSingle={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: CROSS PROMOTION */}
              {activeTab === 'crosspromo' && (
                <CrossPromotionTab
                  crossPromotionsList={localConfig.crossPromotionsList || defaultConfig.crossPromotionsList!}
                  onChange={(updated) => setLocalConfig(prev => ({ ...prev, crossPromotionsList: updated }))}
                  onSaveSingle={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: REFERRAL MANAGER */}
              {activeTab === 'referrals' && (
                <ReferralManagerTab
                  referralConfig={localConfig.referralConfig || defaultConfig.referralConfig!}
                  onChange={(updated) => setLocalConfig(prev => ({ ...prev, referralConfig: updated }))}
                  onSaveSingle={handleSingleSave}
                  showToast={showToast}
                />
              )}

              {/* TAB: SEARCH & AUDIT LOGS */}
              {activeTab === 'logs' && (
                <ActivityLogsTab
                  activityLogs={localConfig.activityLogs || defaultConfig.activityLogs!}
                  usersList={localConfig.usersList || defaultConfig.usersList!}
                  paymentsList={localConfig.paymentsList || defaultConfig.paymentsList!}
                  notificationsList={localConfig.notificationsList || defaultConfig.notificationsList!}
                  crossPromotionsList={localConfig.crossPromotionsList || defaultConfig.crossPromotionsList!}
                  plans={localConfig.plans}
                  onClearLogs={() => {
                    setLocalConfig(prev => ({ ...prev, activityLogs: [] }));
                    handleSingleSave('activity_logs');
                    showToast('Audit logs cleared');
                  }}
                  showToast={showToast}
                />
              )}

              {/* TAB 2: DYNAMIC THEME MANAGER */}
              {activeTab === 'theme' && (
                <ThemeManagerTab
                  themeConfig={localConfig.themeConfig || defaultConfig.themeConfig!}
                  onChange={(updated) => setLocalConfig(prev => ({ ...prev, themeConfig: updated }))}
                  onSaveSingle={handleSingleSave}
                  showToast={showToast}
                  isSaved={savedFieldKeys['theme_manager']}
                />
              )}

              {/* TAB 3: CREDITS MANAGER */}
              {activeTab === 'credits' && (
                <CreditsManagerTab
                  creditsConfig={localConfig.creditsConfig || defaultConfig.creditsConfig!}
                  onChange={(updated) => setLocalConfig(prev => ({ ...prev, creditsConfig: updated }))}
                  onSaveSingle={handleSingleSave}
                  onCancelChanges={handleCancelChanges}
                  onResetToDefaults={handleResetToDefaults}
                  showToast={showToast}
                  isSaved={savedFieldKeys['credits_manager']}
                />
              )}

              {/* TAB 4: API PROVIDER ROUTER */}
              {activeTab === 'providers' && (
                <APIProviderManagerTab
                  providerManagerConfig={localConfig.providerManagerConfig || defaultConfig.providerManagerConfig!}
                  onChange={(updated) => setLocalConfig(prev => ({ ...prev, providerManagerConfig: updated }))}
                  onSaveSingle={handleSingleSave}
                  onCancelChanges={handleCancelChanges}
                  onResetToDefaults={handleResetToDefaults}
                  showToast={showToast}
                />
              )}

              {/* TAB 2: API KEY CONFIGURATION */}
              {activeTab === 'apikeys' && (
                <div className="space-y-5">
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
                        'MISTRAL_API_KEY (Script Fallback 3):',
                        'mistral_...',
                        localConfig.apiKeys?.mistralApiKey || '',
                        (val) => handleApiKeyChange('mistralApiKey', val)
                      )}

                      {renderApiKeyInput(
                        'pexels',
                        'PEXELS_API_KEY (Stock Photos & Videos):',
                        'pexels_...',
                        localConfig.apiKeys?.pexelsApiKey || '',
                        (val) => handleApiKeyChange('pexelsApiKey', val)
                      )}

                      {renderApiKeyInput(
                        'pixabay',
                        'PIXABAY_API_KEY (Stock Photos & Videos):',
                        'pixabay_...',
                        localConfig.apiKeys?.pixabayApiKey || '',
                        (val) => handleApiKeyChange('pixabayApiKey', val)
                      )}

                      {renderApiKeyInput(
                        'unsplash',
                        'UNSPLASH_API_KEY (Stock Imagery Fallback):',
                        'unsplash_...',
                        localConfig.apiKeys?.unsplashApiKey || '',
                        (val) => handleApiKeyChange('unsplashApiKey', val)
                      )}
                    </div>
                  </div>

                  {/* Payment Gateway Keys */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Razorpay Payment Gateway Credentials
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {renderApiKeyInput(
                        'razorpay_id',
                        'RAZORPAY_KEY_ID (Live Key ID):',
                        'rzp_live_...',
                        localConfig.apiKeys?.razorpayKeyId || '',
                        (val) => handleApiKeyChange('razorpayKeyId', val)
                      )}

                      {renderApiKeyInput(
                        'razorpay_secret',
                        'RAZORPAY_KEY_SECRET (Live Key Secret):',
                        'secret_...',
                        localConfig.apiKeys?.razorpayKeySecret || '',
                        (val) => handleApiKeyChange('razorpayKeySecret', val)
                      )}
                    </div>
                  </div>

                  {/* Custom API Providers */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-indigo-400" /> Custom / Third-Party API Providers
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomModal(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Provider
                      </button>
                    </div>

                    {(localConfig.apiKeys?.customProviders || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No custom API providers added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {localConfig.apiKeys?.customProviders?.map((prov) => (
                          <div key={prov.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                            <div className="flex-1">
                              <span className="font-bold text-white block">{prov.name}</span>
                              <span className="text-[10px] text-indigo-400 font-mono">{prov.envVar}</span>
                            </div>
                            <div className="flex-1">
                              {renderApiKeyInput(
                                `custom_${prov.id}`,
                                'API Key:',
                                'sk-...',
                                prov.apiKey,
                                (val) => handleCustomProviderKeyChange(prov.id, val)
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomProvider(prov.id)}
                              className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl border border-rose-500/20 cursor-pointer self-end md:self-center"
                              title="Delete Provider (Super Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PLANS & LIMITS */}
              {activeTab === 'plans' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Configure prices (INR), monthly credit allowances, and video limits for each plan tier.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(localConfig.plans) as PlanKey[]).map((pKey) => {
                      const plan = localConfig.plans[pKey];
                      return (
                        <div key={pKey} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-white text-sm">{plan.name} ({pKey})</span>
                            <span className="text-indigo-400 font-extrabold text-xs">₹{plan.priceINR}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">Price (INR):</label>
                              <input
                                type="number"
                                value={plan.priceINR}
                                onChange={(e) => handlePlanChange(pKey, 'priceINR', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">Monthly Credits:</label>
                              <input
                                type="number"
                                value={plan.monthlyCredits || 30}
                                onChange={(e) => handlePlanChange(pKey, 'monthlyCredits', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-amber-300 font-bold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">Max Video Length (s):</label>
                              <input
                                type="number"
                                value={plan.maxVideoDurationSeconds}
                                onChange={(e) => handlePlanChange(pKey, 'maxVideoDurationSeconds', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">Export Quality:</label>
                              <select
                                value={plan.exportQuality}
                                onChange={(e) => handlePlanChange(pKey, 'exportQuality', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white cursor-pointer"
                              >
                                <option value="720p">720p HD</option>
                                <option value="1080p">1080p Full HD</option>
                                <option value="4K">4K Ultra HD</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={plan.hasWatermark}
                                onChange={(e) => handlePlanChange(pKey, 'hasWatermark', e.target.checked)}
                                className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                              />
                              <span className="text-slate-300">VirJoy Watermark</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={plan.showAds}
                                onChange={(e) => handlePlanChange(pKey, 'showAds', e.target.checked)}
                                className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                              />
                              <span className="text-slate-300">Show Ads</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: RETENTION CLEANUP */}
              {activeTab === 'retention' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" /> Automated 24-Hour File Retention Policy
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    To optimize storage and guarantee privacy, generated temporary video files are automatically purged after the retention window expires.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Retention Window (Hours):</label>
                      <input
                        type="number"
                        min={1}
                        value={localConfig.retention.retentionHours}
                        onChange={(e) => setLocalConfig(prev => ({
                          ...prev,
                          retention: { ...prev.retention, retentionHours: Number(e.target.value) }
                        }))}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Cleanup Check Frequency (Minutes):</label>
                      <input
                        type="number"
                        min={5}
                        value={localConfig.retention.cleanupIntervalMinutes}
                        onChange={(e) => setLocalConfig(prev => ({
                          ...prev,
                          retention: { ...prev.retention, cleanupIntervalMinutes: Number(e.target.value) }
                        }))}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-300 font-semibold block">Manual Retention Purge Trigger</span>
                      <span className="text-slate-500 text-[11px]">Run a manual purge sweep now.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerCleanup}
                      className="px-4 py-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Execute Cleanup
                    </button>
                  </div>
                  {cleanupResult && (
                    <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 rounded-xl font-mono text-[11px]">
                      {cleanupResult}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AUTO RETENTION MANAGER */}
              {activeTab === 'retention' && (
                <RetentionManagerTab
                  retentionConfig={localConfig.retention}
                  onChange={(updatedRetention) => {
                    setLocalConfig(prev => ({
                      ...prev,
                      retention: updatedRetention
                    }));
                  }}
                  showToast={showToast}
                />
              )}

              {/* TAB 5: MONETIZATION & ADMOB ADS */}
              {activeTab === 'ads' && (
                <AdMobManagerTab
                  monetizationConfig={localConfig.monetization}
                  onChange={(updatedMonetization) => {
                    setLocalConfig(prev => ({
                      ...prev,
                      monetization: updatedMonetization
                    }));
                  }}
                  showToast={showToast}
                />
              )}

              {/* TAB LEGAL: LEGAL POLICIES & GOOGLE PLAY COMPLIANCE */}
              {activeTab === 'legal_policies' && (
                <LegalPoliciesManagerTab
                  legalPoliciesConfig={localConfig.legalPolicies}
                  onChange={(updatedLegal) => {
                    setLocalConfig(prev => ({
                      ...prev,
                      legalPolicies: updatedLegal
                    }));
                  }}
                  showToast={showToast}
                />
              )}

              {/* TAB 6: AI ENGINE & GLOBAL PROCESSING SYSTEM */}
              {activeTab === 'ai' && (
                <div className="space-y-6 text-xs">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" /> System Prompt & AI Model Rules
                    </h4>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Video Studio Master System Prompt:</label>
                      <textarea
                        rows={3}
                        value={localConfig.systemPrompt || ''}
                        onChange={(e) => setLocalConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* GLOBAL AI PROCESSING ENGINE CONTROL */}
                  <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" /> Centralized AI Processing & Rendering Engine
                        </h4>
                        <p className="text-[11px] text-slate-400">Configure global queue limits, stage names, progress bar colors, and animation styles shared by all 9 AI generators.</p>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localConfig.globalProcessingConfig?.enabled ?? true}
                          onChange={(e) => setLocalConfig(prev => ({
                            ...prev,
                            globalProcessingConfig: {
                              ...prev.globalProcessingConfig!,
                              enabled: e.target.checked
                            }
                          }))}
                          className="rounded bg-slate-900 border-slate-800 text-indigo-600 w-4 h-4"
                        />
                        <span className="text-white font-bold">Engine Active</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Max Queue Limit:</label>
                        <input
                          type="number"
                          value={localConfig.globalProcessingConfig?.maxQueueLimit || 20}
                          onChange={(e) => setLocalConfig(prev => ({
                            ...prev,
                            globalProcessingConfig: {
                              ...prev.globalProcessingConfig!,
                              maxQueueLimit: Number(e.target.value)
                            }
                          }))}
                          className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Max Concurrent Jobs:</label>
                        <input
                          type="number"
                          value={localConfig.globalProcessingConfig?.maxConcurrentJobs || 5}
                          onChange={(e) => setLocalConfig(prev => ({
                            ...prev,
                            globalProcessingConfig: {
                              ...prev.globalProcessingConfig!,
                              maxConcurrentJobs: Number(e.target.value)
                            }
                          }))}
                          className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Animation Style:</label>
                        <select
                          value={localConfig.globalProcessingConfig?.animationStyle || 'smooth'}
                          onChange={(e) => setLocalConfig(prev => ({
                            ...prev,
                            globalProcessingConfig: {
                              ...prev.globalProcessingConfig!,
                              animationStyle: e.target.value as any
                            }
                          }))}
                          className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-semibold"
                        >
                          <option value="smooth">Smooth Spinner</option>
                          <option value="shimmer">Neural Shimmer</option>
                          <option value="pulse">Glow Pulse</option>
                          <option value="wave">Wave Layer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Progress Bar Color:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={localConfig.globalProcessingConfig?.progressBarColor || '#6366f1'}
                            onChange={(e) => setLocalConfig(prev => ({
                              ...prev,
                              globalProcessingConfig: {
                                ...prev.globalProcessingConfig!,
                                progressBarColor: e.target.value
                              }
                            }))}
                            className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={localConfig.globalProcessingConfig?.progressBarColor || '#6366f1'}
                            onChange={(e) => setLocalConfig(prev => ({
                              ...prev,
                              globalProcessingConfig: {
                                ...prev.globalProcessingConfig!,
                                progressBarColor: e.target.value
                              }
                            }))}
                            className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Stage Names Control */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/80">
                      <span className="font-bold text-white block">Pipeline Stage Display Names:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { key: 'queued', label: 'Queued' },
                          { key: 'preparing', label: 'Preparing AI' },
                          { key: 'generating', label: 'Generating' },
                          { key: 'rendering', label: 'Rendering' },
                          { key: 'optimizing', label: 'Optimizing' },
                          { key: 'saving', label: 'Saving' },
                          { key: 'completed', label: 'Completed' }
                        ].map((s) => (
                          <div key={s.key}>
                            <label className="block text-[10px] text-slate-400 capitalize mb-1">{s.key} Stage:</label>
                            <input
                              type="text"
                              value={(localConfig.globalProcessingConfig?.stageNames as any)?.[s.key] || s.label}
                              onChange={(e) => setLocalConfig(prev => ({
                                ...prev,
                                globalProcessingConfig: {
                                  ...prev.globalProcessingConfig!,
                                  stageNames: {
                                    ...prev.globalProcessingConfig?.stageNames!,
                                    [s.key]: e.target.value
                                  }
                                }
                              }))}
                              className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-indigo-300 font-semibold"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 7: VOICE & LANGUAGES */}
              {activeTab === 'voice' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-400" /> Voice, Language & Subtitle Preset Options
                  </h4>
                  <p className="text-slate-400">All language presets, voice tones, and subtitle formatting rules are active for selection.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-white block mb-2">Supported Voice Tones ({localConfig.voiceTones.length}):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {localConfig.voiceTones.map((tone) => (
                          <span key={tone} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-medium text-[11px]">
                            {tone}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-white block mb-2">Supported Languages ({localConfig.languages.length}):</span>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {localConfig.languages.map((lang) => (
                          <span key={lang.code} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-indigo-300 font-medium text-[11px]">
                            {lang.name} ({lang.code})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: CHANGE ADMIN PASSWORD */}
              {activeTab === 'password' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" /> Super Admin Password Configuration
                  </h4>
                  <p className="text-slate-400">Update the master admin password required to unlock this panel.</p>

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Current Admin Password:</label>
                      <input
                        type="password"
                        placeholder="Current password..."
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">New Admin Password (min 8 chars):</label>
                      <input
                        type="password"
                        placeholder="New password..."
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Confirm New Admin Password:</label>
                      <input
                        type="password"
                        placeholder="Confirm new password..."
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white"
                      />
                    </div>

                    {passError && (
                      <p className="text-rose-400 text-xs font-semibold">{passError}</p>
                    )}
                    {passSuccess && (
                      <p className="text-emerald-400 text-xs font-semibold">{passSuccess}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 shadow-md"
                    >
                      {isChangingPass ? 'Updating Password...' : 'Save New Admin Password'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Footer with Save, Cancel, Reset */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-rose-400 border border-rose-500/20 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Reset to system defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleCancelChanges}
                  disabled={!isConfigChanged}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold text-xs disabled:opacity-40 cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={!isConfigChanged}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Configuration
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
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
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
