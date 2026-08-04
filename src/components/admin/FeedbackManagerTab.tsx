import React, { useState, useEffect } from 'react';
import { AppConfig, FeedbackItem, FeedbackConfig } from '../../types';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Send,
  Plus,
  RefreshCw,
  Filter,
  Save,
  Tag
} from 'lucide-react';

interface FeedbackManagerTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const FeedbackManagerTab: React.FC<FeedbackManagerTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(() => {
    return config.feedbackList || [
      {
        id: 'fb-101',
        type: 'Feature Suggestion',
        category: 'Video Generation',
        title: 'Add 9:16 Vertical Reel Template Presets',
        description: 'It would be great to have quick vertical templates specifically tailored for Instagram Reels and TikTok shorts.',
        userEmail: 'creator.pro@example.com',
        userName: 'Alex Rivers',
        status: 'In Progress',
        adminReply: 'Thanks Alex! 9:16 templates are currently being integrated.',
        createdAt: '2026-08-01 14:20'
      },
      {
        id: 'fb-102',
        type: 'Bug Report',
        category: 'Audio & Voice',
        title: 'Audio playback volume slider glitch on mobile Web Safari',
        description: 'When playing voiceover samples on mobile Safari iOS 18, the volume slider resets.',
        userEmail: 'dev.tester@example.com',
        userName: 'Sam Chen',
        status: 'Open',
        createdAt: '2026-08-02 01:10'
      }
    ];
  });

  const [feedbackConfig, setFeedbackConfig] = useState<FeedbackConfig>(() => {
    return config.feedbackConfig || {
      enabled: true,
      categories: ['Video Generation', 'UI / Theme', 'Audio & Voice', 'Billing & Credits', 'Other']
    };
  });

  const [filterType, setFilterType] = useState<'All' | 'Bug Report' | 'Feature Suggestion'>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Fetch live feedback list from API
  const fetchLiveFeedback = async () => {
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.feedbackList)) {
          setFeedbackList(data.feedbackList);
        }
        if (data.feedbackConfig) {
          setFeedbackConfig(data.feedbackConfig);
        }
      }
    } catch (err) {
      console.warn('Could not fetch feedback from API:', err);
    }
  };

  useEffect(() => {
    fetchLiveFeedback();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: FeedbackItem['status']) => {
    const updated = feedbackList.map(item => item.id === id ? { ...item, status: newStatus } : item);
    setFeedbackList(updated);

    try {
      await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn('API update failed:', err);
    }

    onSave('feedback_list', updated);
    showToast(`Feedback status updated to ${newStatus}`);
  };

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    const updated = feedbackList.map(item => item.id === id ? { ...item, adminReply: replyText.trim(), status: 'Reviewed' as const } : item);
    setFeedbackList(updated);

    try {
      await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText.trim(), status: 'Reviewed' })
      });
    } catch (err) {
      console.warn('API reply failed:', err);
    }

    onSave('feedback_list', updated);
    setReplyText('');
    setActiveReplyId(null);
    showToast('Admin reply saved & sent to creator!');
  };

  const handleDeleteFeedback = async (id: string) => {
    const updated = feedbackList.filter(item => item.id !== id);
    setFeedbackList(updated);

    try {
      await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete failed:', err);
    }

    onSave('feedback_list', updated);
    showToast('Feedback record deleted.');
  };

  const handleAddCategory = () => {
    if (!newCategory.trim() || feedbackConfig.categories.includes(newCategory.trim())) return;
    const updatedCategories = [...feedbackConfig.categories, newCategory.trim()];
    const updatedConfig = { ...feedbackConfig, categories: updatedCategories };
    setFeedbackConfig(updatedConfig);
    setNewCategory('');
    onSave('feedback_config', updatedConfig);
    showToast(`Category "${newCategory.trim()}" added.`);
  };

  const handleRemoveCategory = (cat: string) => {
    if (feedbackConfig.categories.length <= 1) {
      showToast('At least 1 category is required.');
      return;
    }
    const updatedCategories = feedbackConfig.categories.filter(c => c !== cat);
    const updatedConfig = { ...feedbackConfig, categories: updatedCategories };
    setFeedbackConfig(updatedConfig);
    onSave('feedback_config', updatedConfig);
    showToast(`Category "${cat}" removed.`);
  };

  const filteredList = feedbackList.filter(item => {
    if (filterType !== 'All' && item.type !== filterType) return false;
    if (filterStatus !== 'All' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" /> User Feedback & Bug Report Center
          </h4>
          <p className="text-xs text-slate-400">Review bug reports and feature requests submitted by creators, reply, mark fixed, and edit categories.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveFeedback}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Dynamic Categories Manager */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 text-xs">
        <div className="flex items-center justify-between font-bold text-white">
          <span className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" /> Editable Feedback Categories (No Hardcoded Values)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {feedbackConfig.categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-semibold">
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                className="text-slate-400 hover:text-rose-400 cursor-pointer"
                title="Remove category"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="New Category..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAddCategory}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-3 rounded-2xl text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-300">Type:</span>
          {(['All', 'Bug Report', 'Feature Suggestion'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                filterType === t ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-white font-medium focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Fixed">Fixed</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Submissions Feed List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
            No feedback entries match your filters.
          </div>
        ) : (
          filteredList.map((item) => (
            <div key={item.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase flex items-center gap-1 ${
                    item.type === 'Bug Report' ? 'bg-rose-950 text-rose-300 border border-rose-800/50' : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                  }`}>
                    {item.type === 'Bug Report' ? <Bug className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
                    {item.type}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-lg">
                    {item.category}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{item.createdAt}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                    className={`px-2.5 py-1 rounded-xl font-bold text-xs border focus:outline-none cursor-pointer ${
                      item.status === 'Fixed' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                      item.status === 'In Progress' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Fixed">Mark Fixed</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Closed">Closed</option>
                  </select>

                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h5 className="font-bold text-white text-sm">{item.title}</h5>
                <p className="text-slate-300 leading-relaxed">{item.description}</p>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                <span>Submitted by: <strong className="text-white">{item.userName || 'Creator'}</strong> ({item.userEmail})</span>
                <button
                  onClick={() => {
                    setActiveReplyId(activeReplyId === item.id ? null : item.id);
                    setReplyText(item.adminReply || '');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {item.adminReply ? 'Edit Admin Reply' : 'Reply to User'}
                </button>
              </div>

              {/* Admin Reply Box */}
              {item.adminReply && activeReplyId !== item.id && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Official Admin Response</span>
                  <p className="text-slate-200 text-xs">{item.adminReply}</p>
                </div>
              )}

              {activeReplyId === item.id && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300">Write Reply to Creator</label>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter official resolution or response note..."
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveReplyId(null)}
                      className="px-3 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendReply(item.id)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" /> Save Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
