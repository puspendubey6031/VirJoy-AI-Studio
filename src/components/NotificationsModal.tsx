import React, { useState } from 'react';
import { X, Bell, CheckCircle2, Sparkles, AlertTriangle, Info, Trash2, ExternalLink } from 'lucide-react';
import { AppConfig, NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  config
}) => {
  if (!isOpen) return null;

  const defaultNotifications: NotificationItem[] = config.notificationsList && config.notificationsList.length > 0
    ? config.notificationsList
    : [
        {
          id: 'notif-1',
          title: '🚀 Major AI Video Engine Upgrade!',
          message: 'Experience 2x faster video rendering and improved voiceover sync across all video commercial templates.',
          type: 'Announcement',
          targetAudience: 'All Users',
          enabled: true,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString().replace('T', ' ').substring(0, 16)
        },
        {
          id: 'notif-2',
          title: '🎁 Referral Program Launched',
          message: 'Invite friends using your unique referral link to earn up to 100 free AI credits when they subscribe!',
          type: 'Update Notice',
          targetAudience: 'All Users',
          enabled: true,
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString().replace('T', ' ').substring(0, 16)
        },
        {
          id: 'notif-3',
          title: '⚡ 24-Hour Auto-Retention System Active',
          message: 'Generated videos are saved in studio cache for 24 hours. Be sure to download your high-res mp4 files before expiry.',
          type: 'Maintenance',
          targetAudience: 'All Users',
          enabled: true,
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString().replace('T', ' ').substring(0, 16)
        }
      ];

  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const toggleRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close Notifications"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Notifications Center</h3>
              <p className="text-xs text-slate-400">Updates, credit alerts & platform announcements</p>
            </div>
          </div>
        </div>

        {/* Control buttons */}
        {notifications.length > 0 && (
          <div className="flex justify-between items-center mb-4 text-xs">
            <button
              onClick={markAllRead}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark all as read
            </button>
            <button
              onClick={clearNotifications}
              className="text-slate-500 hover:text-rose-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear list
            </button>
          </div>
        )}

        {/* List of notifications */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Bell className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="font-semibold text-slate-400">You are all caught up!</p>
              <p className="text-[11px]">No active notifications at this time.</p>
            </div>
          ) : (
            notifications.map(notif => {
              const isRead = readIds.has(notif.id);
              return (
                <div
                  key={notif.id}
                  onClick={() => toggleRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isRead
                      ? 'bg-slate-950/50 border-slate-800/80 opacity-75'
                      : 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-indigo-500/30 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      )}
                      <h4 className={`text-xs font-bold ${isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">{notif.createdAt}</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{notif.message}</p>

                  {notif.ctaUrl && (
                    <a
                      href={notif.ctaUrl}
                      className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-400 hover:underline"
                    >
                      {notif.ctaText || 'Learn More'} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
