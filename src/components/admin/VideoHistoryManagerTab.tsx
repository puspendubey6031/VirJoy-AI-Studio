import React, { useState } from 'react';
import { AppConfig } from '../../types';
import {
  Film,
  Search,
  Filter,
  Trash2,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
  Video,
  X,
  Play,
  Calendar,
  User,
  Info
} from 'lucide-react';

interface HistoryVideoItem {
  id: string;
  title: string;
  prompt: string;
  userEmail: string;
  durationSeconds: number;
  resolution: string;
  createdAt: string;
  status: 'active' | 'deleted' | 'expired';
  viewsCount: number;
}

interface VideoHistoryManagerTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

const initialHistoryItems: HistoryVideoItem[] = [
  {
    id: 'vj-history-001',
    title: 'Cyberpunk Smartwatch Reveal Ad',
    prompt: 'Hyper-realistic neon futuristic smartwatch commercial on dark background with holographic features',
    userEmail: 'creator@virjoy.ai',
    durationSeconds: 15,
    resolution: '1080p',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'active',
    viewsCount: 42
  },
  {
    id: 'vj-history-002',
    title: 'Aura Organic Tea Social Reel',
    prompt: 'Steam rising from fresh herbal matcha tea cup with bamboo leaves in warm morning light',
    userEmail: 'media@brand.com',
    durationSeconds: 30,
    resolution: '4K',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'active',
    viewsCount: 128
  },
  {
    id: 'vj-history-003',
    title: 'SaaS Dashboard Feature Highlights',
    prompt: 'Modern clean UI animation showing automated analytics reports generating instantly',
    userEmail: 'devs@saas.io',
    durationSeconds: 15,
    resolution: '1080p',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    status: 'expired',
    viewsCount: 19
  },
  {
    id: 'vj-history-004',
    title: 'Electric SUV Mountain Drive',
    prompt: 'Red electric SUV driving through snowy pine mountain pass at sunrise cinematic drone shot',
    userEmail: 'test_user@virjoy.ai',
    durationSeconds: 60,
    resolution: '720p',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'deleted',
    viewsCount: 5
  }
];

export const VideoHistoryManagerTab: React.FC<VideoHistoryManagerTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [historyItems, setHistoryItems] = useState<HistoryVideoItem[]>(initialHistoryItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<HistoryVideoItem | null>(null);

  const filteredItems = historyItems.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleDeleteItem = (id: string) => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'deleted' } : item))
    );
    showToast(`Video ${id} marked as deleted.`);
  };

  const handleRestoreItem = (id: string) => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'active' } : item))
    );
    showToast(`Video ${id} restored to active history.`);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setHistoryItems((prev) =>
      prev.map((item) =>
        selectedIds.includes(item.id) ? { ...item, status: 'deleted' } : item
      )
    );
    showToast(`Marked ${selectedIds.length} items as deleted.`);
    setSelectedIds([]);
  };

  const handlePermanentPurge = (id: string) => {
    setHistoryItems((prev) => prev.filter((i) => i.id !== id));
    showToast(`Permanently purged video record ${id}.`);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" /> Platform Video History Manager
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Global video project archive, metadata search, video preview, soft-delete, and restoration control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" /> Bulk Delete ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user email, prompt, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {['all', 'active', 'deleted', 'expired'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 w-8">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white cursor-pointer">
                    {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Video Title & ID</th>
                <th className="p-3">User Email</th>
                <th className="p-3">Spec</th>
                <th className="p-3">Created Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                    No video history records found matching search query.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3">
                        <button onClick={() => toggleSelect(item.id)} className="text-slate-400 hover:text-white cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3">
                        <span className="text-white font-bold block">{item.title}</span>
                        <span className="text-indigo-400 font-mono text-[10px] block">{item.id}</span>
                      </td>

                      <td className="p-3 text-slate-300">{item.userEmail}</td>

                      <td className="p-3 text-slate-300">
                        {item.resolution} • {item.durationSeconds}s
                      </td>

                      <td className="p-3 text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            item.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'expired'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                            title="Preview Video Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          </button>

                          {item.status === 'deleted' ? (
                            <>
                              <button
                                onClick={() => handleRestoreItem(item.id)}
                                className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg cursor-pointer"
                                title="Restore Video"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handlePermanentPurge(item.id)}
                                className="p-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg cursor-pointer"
                                title="Purge Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg cursor-pointer"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">{previewItem.title}</h3>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group">
              <div className="w-12 h-12 rounded-full bg-indigo-600/80 text-white flex items-center justify-center shadow-lg mb-2">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <span className="text-slate-300 font-bold">{previewItem.title}</span>
              <span className="text-slate-500 text-[10px] font-mono">{previewItem.id} • {previewItem.resolution}</span>
            </div>

            <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div><span className="text-slate-500">Creator Email:</span> <span className="text-white font-bold">{previewItem.userEmail}</span></div>
              <div><span className="text-slate-500">Prompt:</span> <span className="text-slate-200">{previewItem.prompt}</span></div>
              <div><span className="text-slate-500">Duration:</span> <span className="text-indigo-300 font-bold">{previewItem.durationSeconds} seconds</span></div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setPreviewItem(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
