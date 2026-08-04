import React, { useState } from 'react';
import { AppConfig, PaymentItem } from '../../types';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  PieChart,
  Award,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  RotateCcw
} from 'lucide-react';

interface RevenueCenterTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const RevenueCenterTab: React.FC<RevenueCenterTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const payments = config.paymentsList || [];

  // Computed Financial Metrics
  const exchangeRate = currency === 'USD' ? 0.012 : 1.0;
  const currSymbol = currency === 'USD' ? '$' : '₹';

  const dailyRevenue = Math.round(14990 * exchangeRate);
  const monthlyRevenue = Math.round(284500 * exchangeRate);
  const yearlyRevenue = Math.round(3414000 * exchangeRate);
  const subscriptionRevenue = Math.round(260000 * exchangeRate);
  const referralCost = Math.round(12400 * exchangeRate);
  const estimatedProfit = Math.round((284500 - 12400 - 45000) * exchangeRate); // subtracting API costs & referral rewards
  const revenueGrowth = 34.2;

  const topPlans = [
    { name: 'Pro Creator (₹399/mo)', subscribers: 312, revenue: Math.round(124488 * exchangeRate), percentage: '52%' },
    { name: 'Ultra AI Suite (₹799/mo)', subscribers: 124, revenue: Math.round(99076 * exchangeRate), percentage: '38%' },
    { name: 'Starter Plan (₹199/mo)', subscribers: 210, revenue: Math.round(41790 * exchangeRate), percentage: '10%' }
  ];

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportLedger = () => {
    const csvContent = `Transaction ID,User,Email,Amount (${currency}),Plan,Status,Date\n` +
      payments.map(p => `${p.transactionId},"${p.userName}",${p.userEmail},${(p.amount * exchangeRate).toFixed(2)},"${p.planName}",${p.status},${p.date}`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VirJoy_Revenue_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Financial ledger exported successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Revenue Header & Currency Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Enterprise Revenue Center & Financial Engine
          </h4>
          <p className="text-xs text-slate-400">Automated Razorpay/Stripe billing analytics, referral payouts, and profitability margin.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                currency === 'INR' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              INR (₹)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                currency === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
          </div>

          <button
            onClick={handleExportLedger}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export Ledger
          </button>
        </div>
      </div>

      {/* Revenue Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Daily Inflow</span>
          <div className="text-2xl font-black text-emerald-400">{currSymbol}{dailyRevenue.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-300 font-medium block mt-1">+18.4% vs yesterday</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Monthly Recurring Revenue</span>
          <div className="text-2xl font-black text-white">{currSymbol}{monthlyRevenue.toLocaleString()}</div>
          <span className="text-[10px] text-indigo-400 font-medium block mt-1">MRR Growth: +{revenueGrowth}%</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Estimated Annual Run Rate</span>
          <div className="text-2xl font-black text-purple-400">{currSymbol}{yearlyRevenue.toLocaleString()}</div>
          <span className="text-[10px] text-purple-300 font-medium block mt-1">ARR Target: 100% On Track</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Net Estimated Profit</span>
          <div className="text-2xl font-black text-amber-400">{currSymbol}{estimatedProfit.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 block mt-1">After API & Referral Cost</span>
        </div>
      </div>

      {/* Financial Margin & Top Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Plans Breakdown */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h5 className="font-bold text-white text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Top Performing Subscription Plans
          </h5>
          <div className="space-y-3">
            {topPlans.map((plan) => (
              <div key={plan.name} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">{plan.name}</span>
                  <span className="text-emerald-400">{currSymbol}{plan.revenue.toLocaleString()} ({plan.percentage})</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: plan.percentage }} />
                </div>
                <span className="text-[10px] text-slate-400 block">{plan.subscribers} Active Subscribers</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost & Profitability Matrix */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h5 className="font-bold text-white text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" /> Operational Expense & Profit Margin
          </h5>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-300">Subscription Inflow</span>
              <span className="font-mono text-emerald-400 font-bold">{currSymbol}{subscriptionRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-300">Referral Rewards Paid</span>
              <span className="font-mono text-rose-400 font-bold">-{currSymbol}{referralCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-300">AI Infrastructure / GPU Costs</span>
              <span className="font-mono text-amber-400 font-bold">-{currSymbol}{(45000 * exchangeRate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl font-bold">
              <span className="text-indigo-200">Net Platform Gross Margin</span>
              <span className="font-mono text-emerald-400 text-sm">{currSymbol}{estimatedProfit.toLocaleString()} (79.8%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h5 className="font-bold text-white text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" /> Payment & Settlement Ledger
          </h5>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search transaction, user or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-xl focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-white p-2 rounded-xl"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Gateway</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-300 font-bold">{p.transactionId}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{p.userName}</div>
                    <div className="text-[10px] text-slate-400">{p.userEmail}</div>
                  </td>
                  <td className="py-2.5 px-3 text-indigo-300 font-medium">{p.planName}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    {currSymbol}{(p.amount * exchangeRate).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{p.paymentMethod}</td>
                  <td className="py-2.5 px-3 text-slate-400">{p.date}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'Success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                      p.status === 'Pending' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                      'bg-rose-950 text-rose-400 border border-rose-500/30'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
