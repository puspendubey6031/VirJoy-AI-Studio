import React, { useState } from 'react';
import { AppConfig, CommissionItem } from '../../types';
import {
  DollarSign,
  Users,
  Percent,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  ShieldCheck
} from 'lucide-react';

interface CommissionManagerTabProps {
  commissionItems: CommissionItem[];
  onChange: (updated: CommissionItem[]) => void;
  showToast: (msg: string) => void;
}

export const CommissionManagerTab: React.FC<CommissionManagerTabProps> = ({
  commissionItems = [],
  onChange,
  showToast
}) => {
  const [items, setItems] = useState<CommissionItem[]>(commissionItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<CommissionItem> | null>(null);

  const totalPayoutsPending = items.reduce((acc, it) => acc + (it.pendingPayoutINR || 0), 0);
  const totalEarnedAll = items.reduce((acc, it) => acc + (it.totalEarnedINR || 0), 0);

  const filtered = items.filter(
    (it) =>
      it.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.partnerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprovePayout = (id: string) => {
    const updated = items.map((it) => {
      if (it.id === id) {
        return {
          ...it,
          totalEarnedINR: it.totalEarnedINR + it.pendingPayoutINR,
          pendingPayoutINR: 0,
          lastPayoutDate: new Date().toISOString().split('T')[0]
        };
      }
      return it;
    });
    setItems(updated);
    onChange(updated);
    showToast('Payout approved and processed.');
  };

  const handleSaveItem = () => {
    if (!editingItem?.partnerName || !editingItem?.partnerEmail) {
      showToast('Please enter partner name and email.');
      return;
    }
    let updated: CommissionItem[];
    if (editingItem.id) {
      updated = items.map((it) => (it.id === editingItem.id ? ({ ...it, ...editingItem } as CommissionItem) : it));
    } else {
      const newItem: CommissionItem = {
        id: `comm_${Date.now()}`,
        partnerId: `part_${Date.now()}`,
        partnerName: editingItem.partnerName,
        partnerEmail: editingItem.partnerEmail,
        commissionRatePercent: editingItem.commissionRatePercent ?? 20,
        totalEarnedINR: 0,
        pendingPayoutINR: 0,
        status: 'Active',
        referralCount: 0
      };
      updated = [newItem, ...items];
    }
    setItems(updated);
    onChange(updated);
    setIsModalOpen(false);
    setEditingItem(null);
    showToast('Partner commission updated.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-emerald-400" />
            Affiliate & Partner Commission Manager
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Track affiliate referral payouts, customize partner commission percentages, and approve withdrawal requests.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem({ commissionRatePercent: 20 });
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Partner Rule
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-1">
          <span className="text-xs text-slate-400">Total Partner Earned (INR)</span>
          <div className="text-2xl font-bold text-emerald-400">₹{totalEarnedAll.toLocaleString()}</div>
          <p className="text-xs text-slate-500">Lifetime referral earnings</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-1">
          <span className="text-xs text-slate-400">Pending Payouts (INR)</span>
          <div className="text-2xl font-bold text-amber-400">₹{totalPayoutsPending.toLocaleString()}</div>
          <p className="text-xs text-slate-500">Awaiting admin clearance</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-1">
          <span className="text-xs text-slate-400">Active Partners</span>
          <div className="text-2xl font-bold text-indigo-400">{items.length}</div>
          <p className="text-xs text-slate-500">Registered affiliate accounts</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search partner name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Partner</th>
                <th className="p-4">Commission %</th>
                <th className="p-4">Referrals</th>
                <th className="p-4">Pending Payout</th>
                <th className="p-4">Total Earned</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-800/40">
                  <td className="p-4">
                    <div className="font-semibold text-white">{partner.partnerName}</div>
                    <div className="text-xs text-slate-400">{partner.partnerEmail}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-indigo-400">{partner.commissionRatePercent}%</td>
                  <td className="p-4 font-mono">{partner.referralCount}</td>
                  <td className="p-4 font-mono font-bold text-amber-400">
                    ₹{partner.pendingPayoutINR.toLocaleString()}
                  </td>
                  <td className="p-4 font-mono text-emerald-400">₹{partner.totalEarnedINR.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {partner.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {partner.pendingPayoutINR > 0 && (
                      <button
                        onClick={() => handleApprovePayout(partner.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
                      >
                        Approve Payout
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingItem(partner);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white">
                {editingItem?.id ? 'Edit Partner Rule' : 'Add Partner Rule'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Partner Name</label>
                <input
                  type="text"
                  value={editingItem?.partnerName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, partnerName: e.target.value })}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Partner Email</label>
                <input
                  type="email"
                  value={editingItem?.partnerEmail || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, partnerEmail: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Commission Rate (%)</label>
                <input
                  type="number"
                  value={editingItem?.commissionRatePercent ?? 20}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, commissionRatePercent: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-500/25"
              >
                Save Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
