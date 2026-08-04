import React, { useState } from 'react';
import { PlanConfig, SubscriptionLockConfig, FeatureLockRule, DynamicDurationConfig } from '../../types';
import { defaultConfig } from '../../server/configStore';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Award,
  Clock,
  Coins,
  Layers,
  Save,
  Check,
  X,
  Lock,
  Unlock,
  Sparkles,
  ShieldAlert,
  Sliders,
  Type,
  Image as ImageIcon,
  Video,
  FileText,
  RotateCcw,
  Zap,
  HelpCircle
} from 'lucide-react';

interface SubscriptionsManagerTabProps {
  plans: Record<string, PlanConfig>;
  subscriptionLockConfig?: SubscriptionLockConfig;
  onChange: (updatedPlans: Record<string, PlanConfig>) => void;
  onUpdateLockConfig?: (updatedLockConfig: SubscriptionLockConfig) => void;
  onSaveSingle: (fieldKey: string, payload: any) => void;
  showToast: (msg: string) => void;
}

export const SubscriptionsManagerTab: React.FC<SubscriptionsManagerTabProps> = ({
  plans,
  subscriptionLockConfig,
  onChange,
  onUpdateLockConfig,
  onSaveSingle,
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'locks' | 'modal' | 'durations' | 'credits'>('plans');

  // Lock Config Local State
  const lockConfig: SubscriptionLockConfig = subscriptionLockConfig || defaultConfig.subscriptionLockConfig!;

  // Editing state for Plans
  const [editingPlanKey, setEditingPlanKey] = useState<string | null>(null);
  const [editingPlanData, setEditingPlanData] = useState<Partial<PlanConfig>>({});
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [isCreatingNewPlan, setIsCreatingNewPlan] = useState(false);
  const [newPlanKey, setNewPlanKey] = useState('');

  // Editing state for Duration options
  const [newDurationSec, setNewDurationSec] = useState<number>(45);
  const [newDurationLabel, setNewDurationLabel] = useState<string>('45 sec');
  const [newDurationMinPlan, setNewDurationMinPlan] = useState<string>('Free');
  const [newDurationCredits, setNewDurationCredits] = useState<number>(8);

  // Editing state for Modal Benefits
  const [newBenefitInput, setNewBenefitInput] = useState('');

  const planEntries = Object.entries(plans) as [string, PlanConfig][];

  // --- PLAN MANAGEMENT HANDLERS ---
  const handleStartEditPlan = (key: string, plan: PlanConfig) => {
    setEditingPlanKey(key);
    setEditingPlanData(JSON.parse(JSON.stringify(plan)));
    setIsCreatingNewPlan(false);
  };

  const handleTogglePlanEnabled = (key: string) => {
    const target = plans[key];
    const updated = {
      ...plans,
      [key]: { ...target, enabled: !(target.enabled ?? true) }
    };
    onChange(updated);
    onSaveSingle('plans', updated);
    showToast(`Plan "${target.name}" ${!(target.enabled ?? true) ? 'enabled' : 'disabled'}`);
  };

  const handleDeletePlan = (key: string, name: string) => {
    if (Object.keys(plans).length <= 1) {
      alert('Cannot delete the only remaining subscription plan.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the "${name}" plan?`)) return;

    const copy = { ...plans };
    delete copy[key];
    onChange(copy);
    onSaveSingle('plans', copy);
    showToast(`Deleted plan "${name}"`);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlanKey || !editingPlanData.name) return;

    const updated = {
      ...plans,
      [editingPlanKey]: {
        ...plans[editingPlanKey],
        ...editingPlanData
      } as PlanConfig
    };

    onChange(updated);
    onSaveSingle('plans', updated);
    setEditingPlanKey(null);
    showToast(`Saved subscription details for ${editingPlanData.name}`);
  };

  const handleCreateNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanKey.trim() || !editingPlanData.name) {
      alert('Plan Identifier Key and Plan Display Name are required.');
      return;
    }

    const key = newPlanKey.trim();
    const created: PlanConfig = {
      id: key,
      name: editingPlanData.name || 'New Custom Tier',
      priceINR: editingPlanData.priceINR || 299,
      monthlyCredits: editingPlanData.monthlyCredits || 500,
      maxSingleVideoCredits: editingPlanData.maxSingleVideoCredits || 60,
      maxMonthlyDurationSeconds: editingPlanData.maxMonthlyDurationSeconds || 600,
      maxVideoDurationSeconds: editingPlanData.maxVideoDurationSeconds || 90,
      exportQuality: editingPlanData.exportQuality || '1080p',
      hasWatermark: editingPlanData.hasWatermark ?? false,
      hasIdeaToVideoWorkflow: editingPlanData.hasIdeaToVideoWorkflow ?? true,
      hasProductUrlExtraction: true,
      hasPriorityRendering: true,
      showAds: false,
      enabled: true,
      features: editingPlanData.features || ['Full HD Video Generator', 'No Watermark', 'Priority Processing'],
      badge: editingPlanData.badge || 'POPULAR'
    };

    const updated = { ...plans, [key]: created };
    onChange(updated);
    onSaveSingle('plans', updated);
    setIsCreatingNewPlan(false);
    setEditingPlanKey(null);
    showToast(`Created new plan "${created.name}"`);
  };

  const handleAddFeatureToPlan = () => {
    if (!newFeatureInput.trim()) return;
    const currentFeatures = editingPlanData.features || [];
    setEditingPlanData({
      ...editingPlanData,
      features: [...currentFeatures, newFeatureInput.trim()]
    });
    setNewFeatureInput('');
  };

  const handleRemoveFeatureFromPlan = (index: number) => {
    const currentFeatures = editingPlanData.features || [];
    setEditingPlanData({
      ...editingPlanData,
      features: currentFeatures.filter((_, i) => i !== index)
    });
  };

  // --- FEATURE LOCK MATRIX HANDLERS ---
  const handleUpdateFeatureRule = (featureKey: string, field: keyof FeatureLockRule, value: any) => {
    if (!onUpdateLockConfig) return;
    const updatedFeatures = {
      ...lockConfig.features,
      [featureKey]: {
        ...lockConfig.features[featureKey as keyof typeof lockConfig.features],
        [field]: value
      }
    };
    const updatedLockConfig = {
      ...lockConfig,
      features: updatedFeatures
    };
    onUpdateLockConfig(updatedLockConfig);
    onSaveSingle('subscriptionLockConfig', updatedLockConfig);
    showToast(`Updated lock rules for ${featureKey}`);
  };

  // --- LOCK MODAL COPY HANDLERS ---
  const handleUpdateModalCopy = (field: string, value: any) => {
    if (!onUpdateLockConfig) return;
    const updatedLockConfig = {
      ...lockConfig,
      lockModal: {
        ...lockConfig.lockModal,
        [field]: value
      }
    };
    onUpdateLockConfig(updatedLockConfig);
    onSaveSingle('subscriptionLockConfig', updatedLockConfig);
    showToast('Updated Lock Modal settings');
  };

  const handleAddBenefit = () => {
    if (!newBenefitInput.trim() || !onUpdateLockConfig) return;
    const currentBenefits = lockConfig.lockModal.benefits || [];
    handleUpdateModalCopy('benefits', [...currentBenefits, newBenefitInput.trim()]);
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    if (!onUpdateLockConfig) return;
    const currentBenefits = lockConfig.lockModal.benefits || [];
    handleUpdateModalCopy(
      'benefits',
      currentBenefits.filter((_, i) => i !== index)
    );
  };

  // --- DURATION OPTIONS HANDLERS ---
  const handleAddDurationOption = () => {
    if (!newDurationSec || !onUpdateLockConfig) return;
    const currentDurations = lockConfig.durations || [];
    const newOption: DynamicDurationConfig = {
      seconds: newDurationSec,
      label: newDurationLabel || `${newDurationSec} sec`,
      minPlan: newDurationMinPlan,
      requiredCredits: newDurationCredits,
      enabled: true
    };

    const updatedDurations = [...currentDurations.filter(d => d.seconds !== newDurationSec), newOption].sort((a, b) => a.seconds - b.seconds);
    const updatedLockConfig = {
      ...lockConfig,
      durations: updatedDurations
    };
    onUpdateLockConfig(updatedLockConfig);
    onSaveSingle('subscriptionLockConfig', updatedLockConfig);
    showToast(`Added duration option ${newOption.label}`);
  };

  const handleToggleDuration = (seconds: number) => {
    if (!onUpdateLockConfig) return;
    const updatedDurations = (lockConfig.durations || []).map(d =>
      d.seconds === seconds ? { ...d, enabled: !d.enabled } : d
    );
    const updatedLockConfig = {
      ...lockConfig,
      durations: updatedDurations
    };
    onUpdateLockConfig(updatedLockConfig);
    onSaveSingle('subscriptionLockConfig', updatedLockConfig);
    showToast(`Toggled ${seconds}s duration option`);
  };

  const handleDeleteDuration = (seconds: number) => {
    if (!onUpdateLockConfig) return;
    const updatedDurations = (lockConfig.durations || []).filter(d => d.seconds !== seconds);
    const updatedLockConfig = {
      ...lockConfig,
      durations: updatedDurations
    };
    onUpdateLockConfig(updatedLockConfig);
    onSaveSingle('subscriptionLockConfig', updatedLockConfig);
    showToast(`Removed ${seconds}s duration option`);
  };

  // --- CREDITS RULES HANDLERS ---
  const handleUpdateCreditRules = (field: string, value: any) => {
    if (!onUpdateLockConfig) return;
    const updatedLockConfig = {
      ...lockConfig,
      credits: {
        ...lockConfig.credits,
        [field]: value
      }
    };
    onUpdateLockConfig(updatedLockConfig);
    onSaveSingle('subscriptionLockConfig', updatedLockConfig);
    showToast(`Updated credit configuration for ${field}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">Subscription & Feature Lock Control Center</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fully dynamic settings — manage plans, generator feature locks, duration rules, credits, and Lock Modal content.
          </p>
        </div>

        <button
          onClick={() => {
            setNewPlanKey(`custom_${Date.now().toString().slice(-4)}`);
            setEditingPlanData({
              name: 'Custom VIP Creator',
              priceINR: 599,
              monthlyCredits: 2000,
              maxVideoDurationSeconds: 180,
              badge: 'VIP',
              exportQuality: '1080p',
              features: ['2,000 Monthly AI Credits', 'Custom Voice Personas', 'Priority Render Queue']
            });
            setIsCreatingNewPlan(true);
            setEditingPlanKey('custom_plan');
            setActiveSubTab('plans');
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Subscription Plan
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('plans')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'plans'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-300" />
          <span>Plans ({planEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('locks')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'locks'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Feature Locks Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('modal')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'modal'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Type className="w-4 h-4 text-purple-400" />
          <span>Lock Modal Content</span>
        </button>

        <button
          onClick={() => setActiveSubTab('durations')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'durations'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Video Durations</span>
        </button>

        <button
          onClick={() => setActiveSubTab('credits')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'credits'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-400" />
          <span>Credits & Refunds</span>
        </button>
      </div>

      {/* --- SUB-TAB 1: PLANS MANAGER --- */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          {/* Create / Edit Plan Form */}
          {(editingPlanKey || isCreatingNewPlan) && (
            <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-400" />
                  {isCreatingNewPlan ? 'Create New Subscription Plan' : `Editing Plan: ${editingPlanData.name}`}
                </h4>
                <button
                  onClick={() => {
                    setEditingPlanKey(null);
                    setIsCreatingNewPlan(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={isCreatingNewPlan ? handleCreateNewPlan : handleSavePlan} className="space-y-4 text-xs">
                {isCreatingNewPlan && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Unique Plan Identifier Key (e.g. ₹199, ₹999, Pro):</label>
                    <input
                      type="text"
                      value={newPlanKey}
                      onChange={(e) => setNewPlanKey(e.target.value)}
                      placeholder="₹499"
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-mono"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Plan Display Name:</label>
                    <input
                      type="text"
                      value={editingPlanData.name || ''}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Price (INR):</label>
                    <input
                      type="number"
                      min={0}
                      value={editingPlanData.priceINR ?? 0}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, priceINR: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Monthly AI Credits:</label>
                    <input
                      type="number"
                      min={0}
                      value={editingPlanData.monthlyCredits ?? 30}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, monthlyCredits: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-indigo-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Max Video Length Limit (seconds):</label>
                    <input
                      type="number"
                      min={10}
                      value={editingPlanData.maxVideoDurationSeconds ?? 30}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, maxVideoDurationSeconds: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Export Quality:</label>
                    <select
                      value={editingPlanData.exportQuality || '720p'}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, exportQuality: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white"
                    >
                      <option value="720p">720p Standard</option>
                      <option value="1080p">1080p Full HD</option>
                      <option value="4K">4K Ultra HD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Badge Tag (e.g. POPULAR, NEW, ULTRA):</label>
                    <input
                      type="text"
                      value={editingPlanData.badge || ''}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, badge: e.target.value })}
                      placeholder="POPULAR"
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white uppercase font-mono"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlanData.hasWatermark ?? false}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, hasWatermark: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600"
                    />
                    <span className="text-slate-300">Add Watermark to Exports</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlanData.hasIdeaToVideoWorkflow ?? false}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, hasIdeaToVideoWorkflow: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600"
                    />
                    <span className="text-slate-300">Enable Idea-to-Video Workflow</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlanData.hasPriorityRendering ?? false}
                      onChange={(e) => setEditingPlanData({ ...editingPlanData, hasPriorityRendering: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600"
                    />
                    <span className="text-slate-300">Priority Render Queue</span>
                  </label>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-slate-300 font-bold">Plan Features Matrix:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newFeatureInput}
                      onChange={(e) => setNewFeatureInput(e.target.value)}
                      placeholder="e.g. 1080p HD rendering without watermark"
                      className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-xl text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeatureToPlan}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer"
                    >
                      Add Feature
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(editingPlanData.features || []).map((feat, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5">
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeatureFromPlan(idx)}
                          className="text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlanKey(null);
                      setIsCreatingNewPlan(false);
                    }}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer"
                  >
                    Save Plan Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {planEntries.map(([key, plan]) => {
              const isEnabled = plan.enabled !== false;

              return (
                <div
                  key={key}
                  className={`bg-slate-950 rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                    isEnabled ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/50 opacity-60'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-base font-extrabold text-slate-100">{plan.name}</h4>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-slate-100">
                          {plan.priceINR === 0 ? 'Free' : `₹${plan.priceINR}`}
                        </span>
                        <span className="text-xs text-slate-400">/ month</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Coins className="w-3.5 h-3.5 text-amber-400" /> Credits / mo:
                        </span>
                        <span className="font-bold text-amber-400">{(plan.monthlyCredits || 30).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> Max Video:
                        </span>
                        <span className="font-bold text-slate-200">{plan.maxVideoDurationSeconds}s</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Layers className="w-3.5 h-3.5 text-purple-400" /> Quality:
                        </span>
                        <span className="font-mono text-purple-300">{plan.exportQuality}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px] text-slate-400">
                      <p className="font-semibold uppercase text-slate-500 text-[10px]">Features:</p>
                      <ul className="space-y-1">
                        {(plan.features || []).slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-slate-300 truncate">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditPlan(key, plan)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePlanEnabled(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border ${
                        isEnabled
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {isEnabled ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePlan(key, plan.name)}
                      className="p-1.5 bg-slate-900 hover:bg-rose-950/40 text-rose-400 border border-slate-800 rounded-xl cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: FEATURE LOCKS MATRIX --- */}
      {activeSubTab === 'locks' && (
        <div className="space-y-5">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" /> Generator & Tool Subscription Lock Settings
            </h4>
            <p className="text-slate-400">
              Control subscription requirements and credit fees for every generator in VirJoy AI. If a user does not meet the minimum required plan level, execution is blocked and the Premium Lock Modal opens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {Object.entries(lockConfig.features).map(([fKey, rule]) => {
              const displayName = fKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

              return (
                <div key={fKey} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-sm capitalize flex items-center gap-1.5">
                      {fKey.includes('video') ? <Video className="w-4 h-4 text-indigo-400" /> : <ImageIcon className="w-4 h-4 text-purple-400" />}
                      {displayName}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => handleUpdateFeatureRule(fKey, 'enabled', e.target.checked)}
                        className="rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-0"
                      />
                      <span className={`font-bold ${rule.enabled ? 'text-amber-400' : 'text-slate-500'}`}>
                        {rule.enabled ? 'Locked' : 'Unlocked'}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Minimum Required Plan:</label>
                      <select
                        value={rule.minPlan}
                        onChange={(e) => handleUpdateFeatureRule(fKey, 'minPlan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-bold"
                      >
                        {Object.keys(plans).map(pKey => (
                          <option key={pKey} value={pKey}>{plans[pKey]?.name || pKey} ({pKey})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Credits Per Generation:</label>
                      <input
                        type="number"
                        min={0}
                        value={rule.requiredCredits}
                        onChange={(e) => handleUpdateFeatureRule(fKey, 'requiredCredits', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-bold text-amber-300"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Custom Upgrade Notice (Optional):</label>
                      <input
                        type="text"
                        value={rule.customUpgradeMsg || ''}
                        onChange={(e) => handleUpdateFeatureRule(fKey, 'customUpgradeMsg', e.target.value)}
                        placeholder={`Upgrade to ${rule.minPlan} to use ${displayName}`}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-300 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- SUB-TAB 3: LOCK MODAL COPY & CREATIVE --- */}
      {activeSubTab === 'modal' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-400" /> Premium Lock Modal Content & Banner Editor
            </h4>
            <p className="text-slate-400 mt-1">
              Customize the title, description, benefits bullet list, CTA text, banner image, and special offer copy shown in the Premium Lock Modal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Modal Title:</label>
              <input
                type="text"
                value={lockConfig.lockModal.title}
                onChange={(e) => handleUpdateModalCopy('title', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">CTA Upgrade Button Text:</label>
              <input
                type="text"
                value={lockConfig.lockModal.buttonText}
                onChange={(e) => handleUpdateModalCopy('buttonText', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-emerald-300 font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">Modal Description Copy:</label>
              <textarea
                rows={3}
                value={lockConfig.lockModal.description}
                onChange={(e) => handleUpdateModalCopy('description', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Special Offer Banner Text:</label>
              <input
                type="text"
                value={lockConfig.lockModal.offerText || ''}
                onChange={(e) => handleUpdateModalCopy('offerText', e.target.value)}
                placeholder="⚡ Limited Time Offer: Upgrade today and get 20% BONUS CREDITS!"
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-amber-300 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Banner Image URL:</label>
              <input
                type="text"
                value={lockConfig.lockModal.bannerImage || ''}
                onChange={(e) => handleUpdateModalCopy('bannerImage', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-indigo-300 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Benefits Bullet List Editor */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="block text-slate-300 font-bold">Modal Benefits Bullet List:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newBenefitInput}
                onChange={(e) => setNewBenefitInput(e.target.value)}
                placeholder="e.g. Access to 4K Ultra video exports without watermark"
                className="flex-1 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer"
              >
                Add Benefit
              </button>
            </div>

            <div className="space-y-1.5 mt-2">
              {(lockConfig.lockModal.benefits || []).map((ben, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{ben}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 4: VIDEO DURATIONS & CREDIT PRICING --- */}
      {activeSubTab === 'durations' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Dynamic Video Duration Options & Required Credits
            </h4>
            <p className="text-slate-400 mt-1">
              Configure available video duration options (e.g., 10s, 15s, 30s, 60s, 90s, 120s, 180s, 300s). Each duration option specifies its required plan tier, credit cost, and active status.
            </p>
          </div>

          {/* Add New Duration Form */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
            <span className="font-bold text-white block">Add New Video Duration Option:</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Duration (Seconds):</label>
                <input
                  type="number"
                  min={5}
                  value={newDurationSec}
                  onChange={(e) => {
                    const sec = Number(e.target.value);
                    setNewDurationSec(sec);
                    setNewDurationLabel(`${sec} sec`);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Display Label:</label>
                <input
                  type="text"
                  value={newDurationLabel}
                  onChange={(e) => setNewDurationLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Required Plan:</label>
                <select
                  value={newDurationMinPlan}
                  onChange={(e) => setNewDurationMinPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-bold"
                >
                  {Object.keys(plans).map(pKey => (
                    <option key={pKey} value={pKey}>{plans[pKey]?.name || pKey}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Required Credits:</label>
                <input
                  type="number"
                  min={1}
                  value={newDurationCredits}
                  onChange={(e) => setNewDurationCredits(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-amber-300 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddDurationOption}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                Add Duration Option
              </button>
            </div>
          </div>

          {/* Existing Durations List */}
          <div className="space-y-2">
            <span className="font-bold text-white block">Configured Duration Options:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(lockConfig.durations || []).map((dur) => (
                <div key={dur.seconds} className={`p-3 rounded-xl border flex flex-col justify-between ${dur.enabled ? 'bg-slate-900 border-slate-800' : 'bg-slate-900/50 border-rose-900/40 opacity-50'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-base">{dur.label}</span>
                      <span className="text-xs text-amber-400 font-bold">{dur.requiredCredits} Cr</span>
                    </div>
                    <span className="text-[11px] text-indigo-300 block font-semibold">Min Plan: {dur.minPlan}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
                    <button
                      type="button"
                      onClick={() => handleToggleDuration(dur.seconds)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${dur.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}
                    >
                      {dur.enabled ? 'Enabled' : 'Disabled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDuration(dur.seconds)}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 5: CREDITS & REFUNDS --- */}
      {activeSubTab === 'credits' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" /> Credit Calculation & Auto-Refund Rules
            </h4>
            <p className="text-slate-400 mt-1">
              Manage bonus credits, base credit fees, and server-side auto-refund behavior when AI generation fails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Base Credits Per Video:</label>
              <input
                type="number"
                min={1}
                value={lockConfig.credits.creditsPerVideo}
                onChange={(e) => handleUpdateCreditRules('creditsPerVideo', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Credits Per 10s Video Length:</label>
              <input
                type="number"
                min={1}
                value={lockConfig.credits.creditsPer10Seconds}
                onChange={(e) => handleUpdateCreditRules('creditsPer10Seconds', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Welcome Bonus Credits:</label>
              <input
                type="number"
                min={0}
                value={lockConfig.credits.bonusCredits}
                onChange={(e) => handleUpdateCreditRules('bonusCredits', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-amber-300 font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Auto-Refund Credits on Generation Error:</span>
              <span className="text-slate-400 text-[11px]">Automatically restore credits to user balance if an API call fails.</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lockConfig.credits.refundOnFailure}
                onChange={(e) => handleUpdateCreditRules('refundOnFailure', e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-0"
              />
              <span className={`font-bold ${lockConfig.credits.refundOnFailure ? 'text-emerald-400' : 'text-slate-500'}`}>
                {lockConfig.credits.refundOnFailure ? 'Auto-Refund Active' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
