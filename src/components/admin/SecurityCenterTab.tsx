import React, { useState } from 'react';
import { AppConfig, SecurityLogsConfig, SecuritySessionItem } from '../../types';
import {
  ShieldAlert,
  Lock,
  Smartphone,
  Globe,
  UserX,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  KeyRound
} from 'lucide-react';

interface SecurityCenterTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const SecurityCenterTab: React.FC<SecurityCenterTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [securityData, setSecurityData] = useState<SecurityLogsConfig>(() => {
    return (
      config.securityLogs || {
        sessions: [
          {
            id: 'sec-1',
            adminEmail: 'puspendubey6031@gmail.com',
            ipAddress: '103.21.124.5',
            device: 'Chrome / macOS (1080p Desktop)',
            loginTime: '2026-07-30 00:01:10',
            lastActive: '2026-07-30 01:12:44',
            status: 'Active'
          },
          {
            id: 'sec-2',
            adminEmail: 'puspendubey6031@gmail.com',
            ipAddress: '103.21.124.5',
            device: 'Mobile Safari / iOS 18',
            loginTime: '2026-07-29 18:30:00',
            lastActive: '2026-07-29 19:15:00',
            status: 'Logged Out'
          }
        ],
        blockedIps: ['185.220.101.4', '198.51.100.22'],
        blockedUserEmails: ['spammer@baddomain.com'],
        failedLoginAttempts: 2
      }
    );
  });

  const [newBlockedIp, setNewBlockedIp] = useState('');
  const [newBlockedUser, setNewBlockedUser] = useState('');

  const handleAddBlockedIp = () => {
    if (!newBlockedIp.trim() || securityData.blockedIps.includes(newBlockedIp.trim())) return;
    setSecurityData(prev => ({
      ...prev,
      blockedIps: [...prev.blockedIps, newBlockedIp.trim()]
    }));
    setNewBlockedIp('');
  };

  const handleRemoveBlockedIp = (ip: string) => {
    setSecurityData(prev => ({
      ...prev,
      blockedIps: prev.blockedIps.filter(i => i !== ip)
    }));
  };

  const handleAddBlockedUser = () => {
    if (!newBlockedUser.trim() || securityData.blockedUserEmails.includes(newBlockedUser.trim())) return;
    setSecurityData(prev => ({
      ...prev,
      blockedUserEmails: [...prev.blockedUserEmails, newBlockedUser.trim()]
    }));
    setNewBlockedUser('');
  };

  const handleRemoveBlockedUser = (email: string) => {
    setSecurityData(prev => ({
      ...prev,
      blockedUserEmails: prev.blockedUserEmails.filter(e => e !== email)
    }));
  };

  const handleLogoutSession = (sessionId: string) => {
    setSecurityData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === sessionId ? { ...s, status: 'Logged Out' } : s)
    }));
    showToast('Session logged out successfully.');
  };

  const handleLogoutAllDevices = () => {
    if (window.confirm('Emergency Action: Force termination of ALL active administrative sessions across all devices?')) {
      setSecurityData(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => ({ ...s, status: 'Logged Out' }))
      }));
      showToast('All active sessions invalidated.');
    }
  };

  const handleSaveSecurity = () => {
    onSave('security_logs', securityData);
    showToast('Security policy and blocklist rules saved!');
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" /> Enterprise Security & Access Control Center
          </h4>
          <p className="text-xs text-slate-400">Admin session tracking, IP firewalls, account blocklists, and brute-force defenses.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogoutAllDevices}
            className="px-3.5 py-2 bg-rose-950/80 border border-rose-500/30 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout All Devices
          </button>
          <button
            onClick={handleSaveSecurity}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Security Rules
          </button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Active Sessions</span>
          <div className="text-2xl font-black text-emerald-400">
            {securityData.sessions.filter(s => s.status === 'Active').length}
          </div>
          <span className="text-[10px] text-emerald-300 font-medium block mt-1">Authenticated Admins</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Failed Login Attempts</span>
          <div className="text-2xl font-black text-amber-400">{securityData.failedLoginAttempts}</div>
          <span className="text-[10px] text-amber-300 font-medium block mt-1">Rate Limit Active</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Blocked IPs</span>
          <div className="text-2xl font-black text-rose-400">{securityData.blockedIps.length}</div>
          <span className="text-[10px] text-slate-400 block mt-1">Firewall Blocklist</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Blocked Accounts</span>
          <div className="text-2xl font-black text-purple-400">{securityData.blockedUserEmails.length}</div>
          <span className="text-[10px] text-slate-400 block mt-1">Suspended Emails</span>
        </div>
      </div>

      {/* Active Sessions Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h5 className="font-bold text-white text-sm flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" /> Active Admin Sessions & Device Logs
        </h5>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Admin User</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Device & Browser</th>
                <th className="py-2.5 px-3">Last Active</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {securityData.sessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{session.adminEmail}</td>
                  <td className="py-2.5 px-3 font-mono text-indigo-300">{session.ipAddress}</td>
                  <td className="py-2.5 px-3 text-slate-300">{session.device}</td>
                  <td className="py-2.5 px-3 text-slate-400">{session.lastActive}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      session.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {session.status === 'Active' && (
                      <button
                        onClick={() => handleLogoutSession(session.id)}
                        className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firewall IP & Email Blocklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blocked IPs */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Globe className="w-4 h-4 text-rose-400" /> IP Address Firewall Blocklist
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 185.220.101.4"
              value={newBlockedIp}
              onChange={(e) => setNewBlockedIp(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
            />
            <button
              onClick={handleAddBlockedIp}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Block
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {securityData.blockedIps.map((ip) => (
              <div key={ip} className="flex justify-between items-center p-2 bg-slate-900 border border-slate-800/80 rounded-xl text-xs font-mono text-slate-200">
                <span>{ip}</span>
                <button
                  onClick={() => handleRemoveBlockedIp(ip)}
                  className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer"
                  title="Unblock IP"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Accounts */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <UserX className="w-4 h-4 text-amber-400" /> Suspended User Accounts
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="user@domain.com"
              value={newBlockedUser}
              onChange={(e) => setNewBlockedUser(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleAddBlockedUser}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Suspend
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {securityData.blockedUserEmails.map((email) => (
              <div key={email} className="flex justify-between items-center p-2 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-200">
                <span>{email}</span>
                <button
                  onClick={() => handleRemoveBlockedUser(email)}
                  className="p-1 text-slate-400 hover:text-emerald-400 cursor-pointer"
                  title="Reinstate Account"
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
