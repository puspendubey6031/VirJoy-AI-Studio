import React, { useState, useEffect } from 'react';
import { ReferralConfig, ReferralItem, TopReferrerItem } from '../../types';
import {
  Users,
  Gift,
  Coins,
  CheckCircle2,
  XCircle,
  BarChart3,
  Save,
  Sparkles,
  Download,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface ReferralManagerTabProps {
  referralConfig: ReferralConfig;
  onChange: (updatedConfig: ReferralConfig) => void;
  onSaveSingle: (fieldKey: string, payload: any) => void;
  showToast: (msg: string) => void;
}

export const ReferralManagerTab: React.FC<ReferralManagerTabProps> = ({
  referralConfig,
  onChange,
  onSaveSingle,
  showToast
}) => {
  const [localConfig, setLocalConfig] = useState<ReferralConfig>(() => {
    const copy = JSON.parse(JSON.stringify(referralConfig));
    if (!copy.planRewards) {
      copy.planRewards = {
        '₹199': { referrerCredits: 20, newUserBonusCredits: 10, enabled: true },
        '₹399': { referrerCredits: 40, newUserBonusCredits: 20, enabled: true },
        '₹799': { referrerCredits: 100, newUserBonusCredits: 40, enabled: true }
      };
    }
    if (!copy.notifications) {
      copy.notifications = {
        referrerMessage: 'You earned {credits} Credits because {referred_user} subscribed to {plan}!',
        newUserMessage: 'You received {credits} Bonus Credits for subscribing with referral code {ref_code}!',
        refundReversalMessage: 'Referral reward of {credits} Credits was reversed due to subscription refund.'
      };
    }
    return copy;
  });

  const [adminData, setAdminData] = useState<{
    metrics: {
      totalReferrals: number;
      pendingReferrals: number;
      completedReferrals: number;
      expiredReferrals: number;
      cancelledReferrals: number;
      totalCreditsDistributed: number;
    };
    referrals: ReferralItem[];
    topReferrers: TopReferrerItem[];
  }>({
    metrics: {
      totalReferrals: 0,
      pendingReferrals: 0,
      completedReferrals: 0,
      expiredReferrals: 0,
      cancelledReferrals: 0,
      totalCreditsDistributed: 0
    },
    referrals: [],
    topReferrers: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real-time referral logs from backend
  const fetchBackendReferrals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (planFilter !== 'All') params.append('planKey', planFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/referrals/admin?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setAdminData(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch admin referral logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendReferrals();
  }, [statusFilter, planFilter, searchQuery]);

  const handleSave = () => {
    onChange(localConfig);
    onSaveSingle('referral_config', localConfig);
    showToast('Saved Referral Rules & Templates to Backend Source of Truth!');
  };

  const handleToggleStatus = () => {
    const newStatus = localConfig.campaignStatus === 'Active' ? 'Paused' : 'Active';
    const updated = { ...localConfig, campaignStatus: newStatus as any };
    setLocalConfig(updated);
    onChange(updated);
    onSaveSingle('referral_config', updated);
    showToast(`Referral Campaign is now ${newStatus}`);
  };

  const handlePlanRewardChange = (planKey: string, field: 'referrerCredits' | 'newUserBonusCredits' | 'enabled', value: any) => {
    const current = localConfig.planRewards?.[planKey] || { referrerCredits: 20, newUserBonusCredits: 10, enabled: true };
    const updatedPlanRewards = {
      ...localConfig.planRewards,
      [planKey]: {
        ...current,
        [field]: value
      }
    };
    setLocalConfig(prev => ({
      ...prev,
      planRewards: updatedPlanRewards
    }));
  };

  const handleExportCSV = () => {
    window.open('/api/referrals/admin/export-csv', '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="text-lg font-extrabold text-white">Referral & Viral Reward Engine</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
              Backend Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure dynamic plan-based reward rates, notification text templates, and inspect real-time referral conversions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleToggleStatus}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
              localConfig.campaignStatus === 'Active'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
            }`}
          >
            Campaign: {localConfig.campaignStatus}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Rules Realtime
          </button>
        </div>
      </div>

      {/* Realtime Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Referrals</p>
            <p className="text-2xl font-black text-white mt-1">
              {adminData.metrics.totalReferrals.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-indigo-950/80 border border-indigo-800/60 rounded-xl text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Pending Signups</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {adminData.metrics.pendingReferrals.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-amber-950/80 border border-amber-800/60 rounded-xl text-amber-400">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Paid Conversions</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {adminData.metrics.completedReferrals.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Credits Distributed</p>
            <p className="text-2xl font-black text-amber-300 mt-1">
              {adminData.metrics.totalCreditsDistributed.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-amber-950/80 border border-amber-800/60 rounded-xl text-amber-300">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* PLAN-BASED REWARD RATES (NO HARDCODING) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Plan-Based Referral Reward Rules (Backend Dynamic)
          </h4>
          <span className="text-[11px] text-slate-400">Rewards trigger ONLY after paid subscription purchase.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Starter Plan (₹199) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-extrabold text-amber-400 text-sm">Starter Plan (₹199)</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={localConfig.planRewards?.['₹199']?.enabled ?? true}
                  onChange={e => handlePlanRewardChange('₹199', 'enabled', e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <span className="font-bold text-slate-300">Enabled</span>
              </label>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Referrer Reward (Credits):</label>
              <input
                type="number"
                min={0}
                value={localConfig.planRewards?.['₹199']?.referrerCredits ?? 20}
                onChange={e => handlePlanRewardChange('₹199', 'referrerCredits', Number(e.target.value))}
                className="w-full bg-slate-900 text-amber-400 font-black p-2.5 rounded-xl border border-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">New User Welcome Bonus (Credits):</label>
              <input
                type="number"
                min={0}
                value={localConfig.planRewards?.['₹199']?.newUserBonusCredits ?? 10}
                onChange={e => handlePlanRewardChange('₹199', 'newUserBonusCredits', Number(e.target.value))}
                className="w-full bg-slate-900 text-emerald-400 font-black p-2.5 rounded-xl border border-slate-800"
              />
            </div>
          </div>

          {/* Pro Plan (₹399) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-extrabold text-indigo-400 text-sm">Pro Plan (₹399)</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={localConfig.planRewards?.['₹399']?.enabled ?? true}
                  onChange={e => handlePlanRewardChange('₹399', 'enabled', e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <span className="font-bold text-slate-300">Enabled</span>
              </label>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Referrer Reward (Credits):</label>
              <input
                type="number"
                min={0}
                value={localConfig.planRewards?.['₹399']?.referrerCredits ?? 40}
                onChange={e => handlePlanRewardChange('₹399', 'referrerCredits', Number(e.target.value))}
                className="w-full bg-slate-900 text-amber-400 font-black p-2.5 rounded-xl border border-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">New User Welcome Bonus (Credits):</label>
              <input
                type="number"
                min={0}
                value={localConfig.planRewards?.['₹399']?.newUserBonusCredits ?? 20}
                onChange={e => handlePlanRewardChange('₹399', 'newUserBonusCredits', Number(e.target.value))}
                className="w-full bg-slate-900 text-emerald-400 font-black p-2.5 rounded-xl border border-slate-800"
              />
            </div>
          </div>

          {/* Ultra Plan (₹799) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-extrabold text-purple-400 text-sm">Ultra Plan (₹799)</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={localConfig.planRewards?.['₹799']?.enabled ?? true}
                  onChange={e => handlePlanRewardChange('₹799', 'enabled', e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <span className="font-bold text-slate-300">Enabled</span>
              </label>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Referrer Reward (Credits):</label>
              <input
                type="number"
                min={0}
                value={localConfig.planRewards?.['₹799']?.referrerCredits ?? 100}
                onChange={e => handlePlanRewardChange('₹799', 'referrerCredits', Number(e.target.value))}
                className="w-full bg-slate-900 text-amber-400 font-black p-2.5 rounded-xl border border-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">New User Welcome Bonus (Credits):</label>
              <input
                type="number"
                min={0}
                value={localConfig.planRewards?.['₹799']?.newUserBonusCredits ?? 40}
                onChange={e => handlePlanRewardChange('₹799', 'newUserBonusCredits', Number(e.target.value))}
                className="w-full bg-slate-900 text-emerald-400 font-black p-2.5 rounded-xl border border-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION TEXT TEMPLATES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg text-xs">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-emerald-400" /> Automated Notification Text Templates
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Referrer Notification Message:</label>
            <input
              type="text"
              value={localConfig.notifications?.referrerMessage || ''}
              onChange={e =>
                setLocalConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, referrerMessage: e.target.value }
                }))
              }
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 font-medium"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Supports variables: <code className="text-amber-300">{'{credits}'}</code>, <code className="text-amber-300">{'{referred_user}'}</code>, <code className="text-amber-300">{'{plan}'}</code>
            </p>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">New User Bonus Notification Message:</label>
            <input
              type="text"
              value={localConfig.notifications?.newUserMessage || ''}
              onChange={e =>
                setLocalConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, newUserMessage: e.target.value }
                }))
              }
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 font-medium"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Supports variables: <code className="text-emerald-300">{'{credits}'}</code>, <code className="text-emerald-300">{'{ref_code}'}</code>, <code className="text-emerald-300">{'{plan}'}</code>
            </p>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Refund Reversal Notification Message:</label>
            <input
              type="text"
              value={localConfig.notifications?.refundReversalMessage || ''}
              onChange={e =>
                setLocalConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, refundReversalMessage: e.target.value }
                }))
              }
              className="w-full bg-slate-950 text-rose-300 p-2.5 rounded-xl border border-slate-800 font-medium"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Supports variable: <code className="text-rose-400">{'{credits}'}</code>
            </p>
          </div>
        </div>
      </div>

      {/* TOP REFERRERS LEADERBOARD */}
      {adminData.topReferrers.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg text-xs">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" /> Top Referrers Leaderboard
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Referrer</th>
                  <th className="py-2.5 px-3">Referral Code</th>
                  <th className="py-2.5 px-3">Total Invites</th>
                  <th className="py-2.5 px-3">Paid Conversions</th>
                  <th className="py-2.5 px-3">Credits Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {adminData.topReferrers.map((tr, idx) => (
                  <tr key={tr.userId || idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white">{tr.userName}</p>
                        <p className="text-[10px] text-slate-400">{tr.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">{tr.referralCode}</td>
                    <td className="py-2.5 px-3 font-bold">{tr.totalReferrals}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{tr.completedReferrals}</td>
                    <td className="py-2.5 px-3 font-black text-amber-300">{tr.totalCreditsEarned} Credits</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REFERRAL LOGS AUDIT TRAIL & FILTER TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Referral Activity & Audit Trail
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={fetchBackendReferrals}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search code, email, name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 pl-9 pr-3 py-2 rounded-xl border border-slate-800 text-slate-200 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 p-2 rounded-xl text-slate-200 font-bold text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Refunded">Refunded / Reversed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold text-[11px]">Plan:</span>
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 p-2 rounded-xl text-slate-200 font-bold text-xs"
            >
              <option value="All">All Plans</option>
              <option value="₹199">Starter (₹199)</option>
              <option value="₹399">Pro (₹399)</option>
              <option value="₹799">Ultra (₹799)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Referrer Code</th>
                <th className="py-2.5 px-3">Referred User</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Plan / Amount</th>
                <th className="py-2.5 px-3">Credits Issued</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {adminData.referrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-500 italic">
                    No referral records found matching current filters.
                  </td>
                </tr>
              ) : (
                adminData.referrals.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{r.id}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">{r.referrerCode}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-white">{r.referredUserName || 'Creator'}</p>
                      <p className="text-[10px] text-slate-400">{r.referredUserEmail || 'N/A'}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          r.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : r.status === 'Refunded'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      {r.planKey ? `${r.planKey} (₹${r.amountPaid || 0})` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-300">
                      {r.status === 'Completed'
                        ? `+${r.referrerCreditsAwarded || 0} Ref / +${r.newUserCreditsAwarded || 0} New`
                        : '0'}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
