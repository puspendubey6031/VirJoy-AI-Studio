import React, { useState } from 'react';
import { NotificationItem } from '../../types';
import {
  Bell,
  Send,
  Plus,
  Trash2,
  Calendar,
  Users,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Clock,
  X,
  Edit2
} from 'lucide-react';

interface NotificationsManagerTabProps {
  notificationsList: NotificationItem[];
  onChange: (updatedNotifications: NotificationItem[]) => void;
  onSaveSingle: (fieldKey: string, payload: any) => void;
  showToast: (msg: string) => void;
}

export const NotificationsManagerTab: React.FC<NotificationsManagerTabProps> = ({
  notificationsList,
  onChange,
  onSaveSingle,
  showToast
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState<NotificationItem | null>(null);
  const [formData, setFormData] = useState<Partial<NotificationItem>>({
    title: '',
    message: '',
    type: 'Announcement',
    targetAudience: 'All Users',
    ctaText: 'Learn More',
    ctaUrl: '',
    enabled: true
  });

  const handleOpenCreate = () => {
    setEditingNotif(null);
    setFormData({
      title: '',
      message: '',
      type: 'Announcement',
      targetAudience: 'All Users',
      ctaText: 'Learn More',
      ctaUrl: '',
      enabled: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (notif: NotificationItem) => {
    setEditingNotif(notif);
    setFormData(JSON.parse(JSON.stringify(notif)));
    setModalOpen(true);
  };

  const handleToggleEnable = (id: string) => {
    const updated = notificationsList.map(n => {
      if (n.id === id) {
        const newEnabled = !n.enabled;
        showToast(`Notification ${newEnabled ? 'published' : 'paused'}`);
        return { ...n, enabled: newEnabled };
      }
      return n;
    });
    onChange(updated);
    onSaveSingle('notifications_list', updated);
  };

  const handleDeleteNotif = (id: string, title: string) => {
    if (!window.confirm(`Delete notification "${title}"?`)) return;
    const updated = notificationsList.filter(n => n.id !== id);
    onChange(updated);
    onSaveSingle('notifications_list', updated);
    showToast('Notification deleted');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      alert('Title and Message are required.');
      return;
    }

    if (editingNotif) {
      const updated = notificationsList.map(n => (n.id === editingNotif.id ? { ...n, ...formData } as NotificationItem : n));
      onChange(updated);
      onSaveSingle('notifications_list', updated);
      showToast('Notification updated successfully');
    } else {
      const created: NotificationItem = {
        id: `notif-${Date.now().toString().slice(-4)}`,
        title: formData.title!,
        message: formData.message!,
        type: (formData.type as any) || 'Announcement',
        targetAudience: (formData.targetAudience as any) || 'All Users',
        ctaText: formData.ctaText,
        ctaUrl: formData.ctaUrl,
        scheduledAt: formData.scheduledAt,
        enabled: formData.enabled ?? true,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      const updated = [created, ...notificationsList];
      onChange(updated);
      onSaveSingle('notifications_list', updated);
      showToast('New notification published!');
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">Broadcast Notifications & Announcements</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch in-app popups, top warning banners, release notes, and scheduled maintenance alerts to users.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Send className="w-4 h-4" /> Create Broadcast Notice
        </button>
      </div>

      {/* Notifications List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notificationsList.length === 0 ? (
          <div className="col-span-2 bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-500 italic">
            No active or scheduled notifications. Click "Create Broadcast Notice" to dispatch one.
          </div>
        ) : (
          notificationsList.map(notif => (
            <div
              key={notif.id}
              className={`bg-slate-900/90 rounded-2xl border p-5 flex flex-col justify-between transition-all space-y-4 ${
                notif.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/40 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      notif.type === 'Maintenance'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : notif.type === 'Popup'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : notif.type === 'Banner'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    <Megaphone className="w-3 h-3" /> {notif.type}
                  </span>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-indigo-400" /> {notif.targetAudience}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-100">{notif.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  {notif.message}
                </p>

                {notif.ctaText && (
                  <p className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1 pt-1">
                    CTA Button: <span className="underline">{notif.ctaText}</span> ({notif.ctaUrl || 'Default App Page'})
                  </p>
                )}

                <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                  <span>Created: {notif.createdAt}</span>
                  {notif.scheduledAt && <span>Scheduled: {notif.scheduledAt}</span>}
                </div>
              </div>

              {/* Card Footer Controls */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <button
                  onClick={() => handleToggleEnable(notif.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    notif.enabled
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                  }`}
                >
                  {notif.enabled ? 'Active Broadcast' : 'Paused'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(notif)}
                    className="p-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl cursor-pointer"
                    title="Edit Notice"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNotif(notif.id, notif.title)}
                    className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl cursor-pointer"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT / CREATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                {editingNotif ? 'Edit Notification Notice' : 'Create Broadcast Notification'}
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 🚀 Major AI Engine Update"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notification Message *</label>
                <textarea
                  rows={3}
                  placeholder="Type message text shown to target users..."
                  value={formData.message || ''}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Display Type</label>
                  <select
                    value={formData.type || 'Announcement'}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Popup">Popup Dialog</option>
                    <option value="Banner">Top Banner</option>
                    <option value="Maintenance">Maintenance Warning</option>
                    <option value="Update Notice">Update Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience || 'All Users'}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <option value="All Users">All Users</option>
                    <option value="Premium">Premium Subscribers Only</option>
                    <option value="Free">Free Tier Users Only</option>
                    <option value="Selected Users">Selected User Emails</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">CTA Button Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Try Now"
                    value={formData.ctaText || ''}
                    onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">CTA Action URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /app or https://..."
                    value={formData.ctaUrl || ''}
                    onChange={e => setFormData({ ...formData, ctaUrl: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Schedule Publish Date & Time (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-08-01 10:00"
                  value={formData.scheduledAt || ''}
                  onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl cursor-pointer"
              >
                Publish Broadcast
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
