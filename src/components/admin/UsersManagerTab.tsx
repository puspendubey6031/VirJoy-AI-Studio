import React, { useState } from 'react';
import { AdminUserItem } from '../../types';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Coins,
  KeyRound,
  Eye,
  X,
  Check,
  UserPlus,
  ArrowUpDown,
  Smartphone,
  Globe,
  Calendar,
  Clock,
  Video,
  Share2,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface UsersManagerTabProps {
  usersList: AdminUserItem[];
  onChange: (updatedUsers: AdminUserItem[]) => void;
  onSaveSingle: (fieldKey: string, payload: any) => void;
  showToast: (msg: string) => void;
}

export const UsersManagerTab: React.FC<UsersManagerTabProps> = ({
  usersList,
  onChange,
  onSaveSingle,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'joinDate' | 'credits' | 'totalVideos' | 'lastActive'>('joinDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addCreditModal, setAddCreditModal] = useState(false);
  const [newUserModal, setNewUserModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState<Partial<AdminUserItem>>({});
  const [creditAdjustment, setCreditAdjustment] = useState<number>(50);
  const [creditReason, setCreditReason] = useState('Admin Bonus Credit Grant');
  const [tempPassword, setTempPassword] = useState('');
  const [newUserData, setNewUserData] = useState<Partial<AdminUserItem>>({
    name: '',
    email: '',
    mobile: '',
    country: 'United States',
    accountType: 'Free',
    credits: 30,
    status: 'Active'
  });

  // Filter & Sort logic
  const filteredUsers = usersList.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.referralCode && user.referralCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = accountTypeFilter === 'ALL' || user.accountType === accountTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    let valA: any = a[sortBy];
    let valB: any = b[sortBy];

    if (sortBy === 'credits' || sortBy === 'totalVideos') {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleToggleBlock = (userId: string) => {
    const updated = usersList.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'Blocked' ? 'Active' : 'Blocked';
        showToast(`User ${u.name} is now ${newStatus}`);
        return { ...u, status: newStatus as 'Active' | 'Blocked' };
      }
      return u;
    });
    onChange(updated);
    onSaveSingle('users_list', updated);
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;
    const updated = usersList.filter(u => u.id !== userId);
    onChange(updated);
    onSaveSingle('users_list', updated);
    showToast(`User ${name} deleted successfully`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const updated = usersList.map(u => (u.id === selectedUser.id ? { ...u, ...editFormData } as AdminUserItem : u));
    onChange(updated);
    onSaveSingle('users_list', updated);
    setEditModal(false);
    showToast(`Updated user profile for ${selectedUser.name}`);
  };

  const handleAdjustCredits = (e: React.FormEvent, isAdd: boolean) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amount = isAdd ? creditAdjustment : -creditAdjustment;
    const updated = usersList.map(u => {
      if (u.id === selectedUser.id) {
        const newCredits = Math.max(0, u.credits + amount);
        return { ...u, credits: newCredits };
      }
      return u;
    });
    onChange(updated);
    onSaveSingle('users_list', updated);
    setAddCreditModal(false);
    showToast(`${isAdd ? 'Added' : 'Deducted'} ${creditAdjustment} credits for ${selectedUser.name}`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email) {
      alert('Name and Email are required.');
      return;
    }
    const created: AdminUserItem = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      name: newUserData.name!,
      email: newUserData.email!,
      mobile: newUserData.mobile || '+1 000 000 0000',
      country: newUserData.country || 'United States',
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().replace('T', ' ').slice(0, 16),
      accountType: (newUserData.accountType as any) || 'Free',
      subscriptionStatus: 'Active',
      credits: Number(newUserData.credits) || 30,
      totalVideos: 0,
      referralCode: `REF_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      referralCount: 0,
      status: 'Active'
    };
    const updated = [created, ...usersList];
    onChange(updated);
    onSaveSingle('users_list', updated);
    setNewUserModal(false);
    showToast(`User ${created.name} created successfully!`);
  };

  const handleGenerateResetPassword = () => {
    const generated = `VJ_pass_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setTempPassword(generated);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">User Management</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage user accounts, subscriptions, credit allocation, security blocks, and profile settings.
          </p>
        </div>

        <button
          onClick={() => {
            setNewUserData({ name: '', email: '', mobile: '', country: 'United States', accountType: 'Free', credits: 30, status: 'Active' });
            setNewUserModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-900/30 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Users</p>
          <p className="text-xl font-extrabold text-slate-100 mt-0.5">{usersList.length}</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Active Subscribers</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
            {usersList.filter(u => u.accountType !== 'Free').length}
          </p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Credits Granted</p>
          <p className="text-xl font-extrabold text-amber-400 mt-0.5">
            {usersList.reduce((acc, u) => acc + u.credits, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Videos Made</p>
          <p className="text-xl font-extrabold text-purple-400 mt-0.5">
            {usersList.reduce((acc, u) => acc + u.totalVideos, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Sorting */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Name, Email, Country, Referral..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Account Type */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={accountTypeFilter}
            onChange={e => setAccountTypeFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
          >
            <option value="ALL">All Account Types</option>
            <option value="Free">Free Tier</option>
            <option value="Pro">Pro Creator</option>
            <option value="Enterprise">Enterprise</option>
          </select>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-950 text-slate-300 text-xs px-2 py-1.5 rounded-xl border border-slate-800 cursor-pointer"
          >
            <option value="joinDate">Join Date</option>
            <option value="credits">Credits</option>
            <option value="totalVideos">Total Videos</option>
            <option value="lastActive">Last Active</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-300 transition-all cursor-pointer"
            title="Toggle Sort Order"
          >
            {sortOrder.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Contact & Location</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Credits</th>
                <th className="py-3 px-3">Videos</th>
                <th className="py-3 px-3">Referrals</th>
                <th className="py-3 px-3">Joined / Active</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-slate-100">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-slate-300 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-indigo-400" /> {user.country}
                        </p>
                        <p className="text-slate-400 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-500" /> {user.mobile || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          user.accountType === 'Enterprise'
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                            : user.accountType === 'Pro'
                            ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {user.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Coins className="w-3 h-3" /> {user.credits}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {user.totalVideos}
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      <span className="font-mono text-indigo-300">{user.referralCode}</span>
                      <span className="text-slate-400 block text-[10px]">({user.referralCount} invited)</span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      <p>{user.joinDate}</p>
                      <p className="text-[10px] text-slate-500">{user.lastActive}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'Active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : user.status === 'Blocked'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {user.status === 'Active' && <ShieldCheck className="w-3 h-3" />}
                        {user.status === 'Blocked' && <ShieldAlert className="w-3 h-3" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setViewDetailModal(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Add/Remove Credits */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setAddCreditModal(true);
                          }}
                          className="p-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/50 rounded-lg transition-all cursor-pointer"
                          title="Adjust Credits"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit User */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditFormData(user);
                            setEditModal(true);
                          }}
                          className="p-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 rounded-lg transition-all cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setTempPassword('');
                            setResetPasswordModal(true);
                          }}
                          className="p-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/50 rounded-lg transition-all cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Block/Unblock */}
                        <button
                          onClick={() => handleToggleBlock(user.id)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            user.status === 'Blocked'
                              ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800/50'
                              : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-800/50'
                          }`}
                          title={user.status === 'Blocked' ? 'Unblock User' : 'Block User'}
                        >
                          {user.status === 'Blocked' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="p-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 rounded-lg transition-all cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW USER DETAILS */}
      {viewDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setViewDetailModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <img
                src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={selectedUser.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500"
              />
              <div>
                <h4 className="text-lg font-bold text-slate-100">{selectedUser.name}</h4>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {selectedUser.accountType}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {selectedUser.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">User ID</span>
                <span className="font-mono text-slate-200">{selectedUser.id}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Mobile</span>
                <span className="text-slate-200">{selectedUser.mobile || 'Not provided'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Country</span>
                <span className="text-slate-200">{selectedUser.country}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Join Date</span>
                <span className="text-slate-200">{selectedUser.joinDate}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Current Credits</span>
                <span className="text-amber-400 font-bold">{selectedUser.credits}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Total Videos Generated</span>
                <span className="text-purple-400 font-bold">{selectedUser.totalVideos}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Referral Code</span>
                <span className="font-mono text-indigo-300">{selectedUser.referralCode}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">Referral Count</span>
                <span className="text-emerald-400 font-bold">{selectedUser.referralCount} users</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewDetailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {editModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-indigo-400" /> Edit User Profile
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={editFormData.mobile || ''}
                    onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={editFormData.country || ''}
                    onChange={e => setEditFormData({ ...editFormData, country: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Account Type</label>
                  <select
                    value={editFormData.accountType || 'Free'}
                    onChange={e => setEditFormData({ ...editFormData, accountType: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={editFormData.status || 'Active'}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: ADD / DEDUCT CREDITS */}
      {addCreditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" /> Adjust Credits for {selectedUser.name}
            </h4>

            <p className="text-xs text-slate-400">
              Current balance: <strong className="text-amber-400">{selectedUser.credits} credits</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount</label>
                <input
                  type="number"
                  min={1}
                  value={creditAdjustment}
                  onChange={e => setCreditAdjustment(Number(e.target.value))}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={e => setCreditReason(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddCreditModal(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={e => handleAdjustCredits(e, false)}
                className="px-3 py-2 bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 text-xs font-bold rounded-xl cursor-pointer"
              >
                Deduct Credits
              </button>
              <button
                type="button"
                onClick={e => handleAdjustCredits(e, true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                Add Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RESET PASSWORD */}
      {resetPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" /> Reset Password (Admin Override)
            </h4>

            <p className="text-xs text-slate-400">
              Generate a temporary password for <strong className="text-slate-200">{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <div className="space-y-3">
              {tempPassword ? (
                <div className="bg-slate-950 p-3 rounded-xl border border-indigo-900 flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-300 text-sm">{tempPassword}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      showToast('Copied temporary password to clipboard!');
                    }}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateResetPassword}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Generate Temporary Password
                </button>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setResetPasswordModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD NEW USER */}
      {newUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-400" /> Create New User Account
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. David Miller"
                  value={newUserData.name || ''}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="david@example.com"
                  value={newUserData.email || ''}
                  onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Mobile</label>
                  <input
                    type="text"
                    placeholder="+1 555 123 4567"
                    value={newUserData.mobile || ''}
                    onChange={e => setNewUserData({ ...newUserData, mobile: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={newUserData.country || 'United States'}
                    onChange={e => setNewUserData({ ...newUserData, country: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Initial Plan</label>
                  <select
                    value={newUserData.accountType || 'Free'}
                    onChange={e => setNewUserData({ ...newUserData, accountType: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Credits</label>
                  <input
                    type="number"
                    value={newUserData.credits || 30}
                    onChange={e => setNewUserData({ ...newUserData, credits: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewUserModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
