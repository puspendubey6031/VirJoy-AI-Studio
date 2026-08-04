import React, { useState } from 'react';
import { ActivityLogItem, AdminUserItem, PaymentItem, NotificationItem, CrossPromotionItem, PlanConfig } from '../../types';
import {
  ShieldAlert,
  Search,
  Clock,
  User,
  Trash2,
  FileText,
  Activity,
  Filter,
  CheckCircle2,
  Lock,
  Layers,
  Coins,
  Palette,
  CreditCard,
  Bell,
  Share2
} from 'lucide-react';

interface ActivityLogsTabProps {
  activityLogs: ActivityLogItem[];
  usersList: AdminUserItem[];
  paymentsList: PaymentItem[];
  notificationsList: NotificationItem[];
  crossPromotionsList: CrossPromotionItem[];
  plans: Record<string, PlanConfig>;
  onClearLogs: () => void;
  showToast: (msg: string) => void;
}

export const ActivityLogsTab: React.FC<ActivityLogsTabProps> = ({
  activityLogs,
  usersList,
  paymentsList,
  notificationsList,
  crossPromotionsList,
  plans,
  onClearLogs,
  showToast
}) => {
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('ALL');

  // Filtered Activity Logs
  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch =
      log.actionType.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      log.adminUser.toLowerCase().includes(globalSearchTerm.toLowerCase());

    const matchesCategory = logCategoryFilter === 'ALL' || log.actionType === logCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Search Results across entity domain if global search term >= 2 chars
  const isGlobalSearching = globalSearchTerm.trim().length >= 2;

  const matchedUsers = isGlobalSearching
    ? usersList.filter(u => u.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(globalSearchTerm.toLowerCase()))
    : [];

  const matchedPayments = isGlobalSearching
    ? paymentsList.filter(p => p.transactionId.toLowerCase().includes(globalSearchTerm.toLowerCase()) || p.userName.toLowerCase().includes(globalSearchTerm.toLowerCase()))
    : [];

  const matchedNotifs = isGlobalSearching
    ? notificationsList.filter(n => n.title.toLowerCase().includes(globalSearchTerm.toLowerCase()) || n.message.toLowerCase().includes(globalSearchTerm.toLowerCase()))
    : [];

  const matchedCrossPromos = isGlobalSearching
    ? crossPromotionsList.filter(cp => cp.appName.toLowerCase().includes(globalSearchTerm.toLowerCase()) || cp.description.toLowerCase().includes(globalSearchTerm.toLowerCase()))
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">Global Admin Search & Audit Logs</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search all system entities (Users, Payments, Notifications, Promotions) and view immutable admin audit trails.
          </p>
        </div>

        <button
          onClick={onClearLogs}
          className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold text-xs rounded-xl border border-rose-800/60 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4" /> Clear Audit Logs
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
        <label className="block text-xs font-bold text-slate-200">Global System Search</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-indigo-400" />
          <input
            type="text"
            placeholder="Search Users, Transactions, Notifications, Cross Promos, or Log Actions..."
            value={globalSearchTerm}
            onChange={e => setGlobalSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-slate-100 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>

        {/* Global Search Results Preview Panel */}
        {isGlobalSearching && (
          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 space-y-3 text-xs">
            <p className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
              Search Results Preview for "{globalSearchTerm}":
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Users Matched */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-300 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Users ({matchedUsers.length})
                </p>
                {matchedUsers.slice(0, 3).map(u => (
                  <p key={u.id} className="text-[11px] text-slate-400 truncate">• {u.name} ({u.email})</p>
                ))}
              </div>

              {/* Payments Matched */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-300 flex items-center gap-1 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Payments ({matchedPayments.length})
                </p>
                {matchedPayments.slice(0, 3).map(p => (
                  <p key={p.id} className="text-[11px] text-slate-400 truncate">• {p.transactionId} (${p.amount})</p>
                ))}
              </div>

              {/* Notifications Matched */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-300 flex items-center gap-1 mb-1">
                  <Bell className="w-3.5 h-3.5 text-amber-400" /> Notifications ({matchedNotifs.length})
                </p>
                {matchedNotifs.slice(0, 3).map(n => (
                  <p key={n.id} className="text-[11px] text-slate-400 truncate">• {n.title}</p>
                ))}
              </div>

              {/* Cross Promos Matched */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-300 flex items-center gap-1 mb-1">
                  <Share2 className="w-3.5 h-3.5 text-purple-400" /> Cross Promos ({matchedCrossPromos.length})
                </p>
                {matchedCrossPromos.slice(0, 3).map(cp => (
                  <p key={cp.id} className="text-[11px] text-slate-400 truncate">• {cp.appName}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Timestamped Activity Audit Trail
          </h4>

          {/* Action Filter */}
          <select
            value={logCategoryFilter}
            onChange={e => setLogCategoryFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
          >
            <option value="ALL">All Action Types</option>
            <option value="Admin Login">Admin Login</option>
            <option value="Save Config">Save Config</option>
            <option value="Delete User">Delete User</option>
            <option value="API Change">API Change</option>
            <option value="Credit Change">Credit Change</option>
            <option value="Theme Change">Theme Change</option>
            <option value="Plan Change">Plan Change</option>
            <option value="Notification Sent">Notification Sent</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3 text-right">Admin User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                    No activity log entries match the search or filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          log.actionType === 'Admin Login'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : log.actionType === 'Delete User'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : log.actionType === 'Credit Change'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : log.actionType === 'Theme Change'
                            ? 'bg-pink-950 text-pink-300 border border-pink-800'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {log.details}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {log.adminUser}
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
