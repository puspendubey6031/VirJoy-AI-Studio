import React, { useState } from 'react';
import { PaymentItem } from '../../types';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  X
} from 'lucide-react';

interface PaymentsManagerTabProps {
  paymentsList: PaymentItem[];
  onChange: (updatedPayments: PaymentItem[]) => void;
  onSaveSingle: (fieldKey: string, payload: any) => void;
  showToast: (msg: string) => void;
}

export const PaymentsManagerTab: React.FC<PaymentsManagerTabProps> = ({
  paymentsList,
  onChange,
  onSaveSingle,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [newTxnModal, setNewTxnModal] = useState(false);
  const [newTxnData, setNewTxnData] = useState<Partial<PaymentItem>>({
    userName: '',
    userEmail: '',
    amount: 19.99,
    currency: 'USD',
    planName: 'Pro Creator (Monthly)',
    status: 'Success',
    paymentMethod: 'Stripe'
  });

  // Filtered payments calculation
  const filteredPayments = paymentsList.filter(pay => {
    const matchesSearch =
      pay.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.planName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || pay.status === statusFilter;

    let matchesTime = true;
    if (timeFilter !== 'ALL') {
      const payDate = new Date(pay.date);
      const now = new Date();
      if (timeFilter === 'TODAY') {
        matchesTime = payDate.toDateString() === now.toDateString();
      } else if (timeFilter === 'WEEK') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesTime = payDate >= oneWeekAgo;
      } else if (timeFilter === 'MONTH') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesTime = payDate >= oneMonthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  const totalRevenue = filteredPayments
    .filter(p => p.status === 'Success')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      showToast('No payment records to export.');
      return;
    }

    const headers = ['Transaction ID', 'User Name', 'User Email', 'Amount', 'Currency', 'Plan Name', 'Date', 'Status', 'Payment Method'];
    const rows = filteredPayments.map(p => [
      `"${p.transactionId}"`,
      `"${p.userName}"`,
      `"${p.userEmail}"`,
      p.amount,
      p.currency,
      `"${p.planName}"`,
      `"${p.date}"`,
      p.status,
      p.paymentMethod
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `virjoy_payments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported payments CSV successfully!');
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxnData.userName || !newTxnData.userEmail) {
      alert('User Name and Email are required.');
      return;
    }

    const created: PaymentItem = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      transactionId: `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      userName: newTxnData.userName!,
      userEmail: newTxnData.userEmail!,
      amount: Number(newTxnData.amount) || 19.99,
      currency: newTxnData.currency || 'USD',
      planName: newTxnData.planName || 'Pro Creator (Monthly)',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: (newTxnData.status as any) || 'Success',
      paymentMethod: (newTxnData.paymentMethod as any) || 'Stripe'
    };

    const updated = [created, ...paymentsList];
    onChange(updated);
    onSaveSingle('payments_list', updated);
    setNewTxnModal(false);
    showToast(`Logged manual payment transaction ${created.transactionId}`);
  };

  const handleDeletePayment = (id: string, txnId: string) => {
    if (!window.confirm(`Delete payment transaction record ${txnId}?`)) return;
    const updated = paymentsList.filter(p => p.id !== id);
    onChange(updated);
    onSaveSingle('payments_list', updated);
    showToast('Payment record deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">Payments & Revenue Ledger</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time transaction tracking, payment gateway logs, success rates, and CSV reporting.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>
          <button
            onClick={() => setNewTxnModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Payment
          </button>
        </div>
      </div>

      {/* Revenue Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Revenue (Filtered)</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Transactions</p>
          <p className="text-xl font-extrabold text-slate-100 mt-0.5">{filteredPayments.length}</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Successful Payments</p>
          <p className="text-xl font-extrabold text-indigo-400 mt-0.5">
            {filteredPayments.filter(p => p.status === 'Success').length}
          </p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Failed / Refunded</p>
          <p className="text-xl font-extrabold text-rose-400 mt-0.5">
            {filteredPayments.filter(p => p.status === 'Failed' || p.status === 'Refunded').length}
          </p>
        </div>
      </div>

      {/* Toolbar: Search & Time Filters */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Transaction ID, User, Email, or Plan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Time Filters */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTimeFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              timeFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeFilter('TODAY')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              timeFilter === 'TODAY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter('WEEK')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              timeFilter === 'WEEK' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFilter('MONTH')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              timeFilter === 'MONTH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            This Month
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Plan Name</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                      {pay.transactionId}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-100">{pay.userName}</p>
                      <p className="text-[10px] text-slate-400">{pay.userEmail}</p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {pay.planName}
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-400 text-sm">
                      ${pay.amount.toFixed(2)} <span className="text-[10px] text-slate-500">{pay.currency}</span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {pay.date}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          pay.status === 'Success'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : pay.status === 'Failed'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : pay.status === 'Refunded'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                        }`}
                      >
                        {pay.status === 'Success' && <CheckCircle2 className="w-3 h-3" />}
                        {pay.status === 'Failed' && <XCircle className="w-3 h-3" />}
                        {pay.status === 'Refunded' && <RotateCcw className="w-3 h-3" />}
                        {pay.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeletePayment(pay.id, pay.transactionId)}
                        className="p-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 rounded-lg transition-all cursor-pointer"
                        title="Delete Payment Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TRANSACTION MODAL */}
      {newTxnModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTransaction} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" /> Log Manual Payment Transaction
              </h4>
              <button
                type="button"
                onClick={() => setNewTxnModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">User Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={newTxnData.userName || ''}
                  onChange={e => setNewTxnData({ ...newTxnData, userName: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">User Email *</label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={newTxnData.userEmail || ''}
                  onChange={e => setNewTxnData({ ...newTxnData, userEmail: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTxnData.amount ?? 19.99}
                    onChange={e => setNewTxnData({ ...newTxnData, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={newTxnData.paymentMethod || 'Stripe'}
                    onChange={e => setNewTxnData({ ...newTxnData, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <option value="Stripe">Stripe</option>
                    <option value="Razorpay">Razorpay</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Crypto">Crypto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={newTxnData.planName || 'Pro Creator (Monthly)'}
                    onChange={e => setNewTxnData({ ...newTxnData, planName: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={newTxnData.status || 'Success'}
                    onChange={e => setNewTxnData({ ...newTxnData, status: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <option value="Success">Success</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewTxnModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
