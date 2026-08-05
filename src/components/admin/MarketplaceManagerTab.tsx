import React, { useState } from 'react';
import { AppConfig, MarketplaceItem } from '../../types';
import {
  ShoppingBag,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  Star,
  Download,
  Coins,
  Sparkles,
  Layers,
  Tag,
  X
} from 'lucide-react';

interface MarketplaceManagerTabProps {
  marketplaceItems: MarketplaceItem[];
  onChange: (updatedItems: MarketplaceItem[]) => void;
  showToast: (msg: string) => void;
}

export const MarketplaceManagerTab: React.FC<MarketplaceManagerTabProps> = ({
  marketplaceItems = [],
  onChange,
  showToast
}) => {
  const [items, setItems] = useState<MarketplaceItem[]>(marketplaceItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MarketplaceItem> | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleEnable = (id: string) => {
    const updated = items.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it));
    setItems(updated);
    onChange(updated);
    showToast('Marketplace item status updated.');
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    onChange(updated);
    showToast('Marketplace item deleted.');
  };

  const handleSaveItem = () => {
    if (!editingItem?.name) {
      showToast('Please provide an item name.');
      return;
    }
    let updated: MarketplaceItem[];
    if (editingItem.id) {
      updated = items.map((it) => (it.id === editingItem.id ? ({ ...it, ...editingItem } as MarketplaceItem) : it));
    } else {
      const newItem: MarketplaceItem = {
        id: `mp_${Date.now()}`,
        name: editingItem.name || 'New Template',
        category: editingItem.category || 'Prompt Template',
        description: editingItem.description || '',
        creditsCost: editingItem.creditsCost ?? 2,
        author: editingItem.author || 'VirJoy Admin',
        downloads: 0,
        rating: 5.0,
        isOfficial: editingItem.isOfficial ?? true,
        enabled: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      updated = [newItem, ...items];
    }
    setItems(updated);
    onChange(updated);
    setIsModalOpen(false);
    setEditingItem(null);
    showToast('Marketplace item saved.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            AI Marketplace & Template Manager
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Manage AI video presets, prompt templates, neural voice packs, and graphic design add-ons.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem({ category: 'Prompt Template', creditsCost: 2, isOfficial: true });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Marketplace Item
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search templates, presets or plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="Prompt Template">Prompt Templates</option>
          <option value="Video Preset">Video Presets</option>
          <option value="Voice Persona">Voice Personas</option>
          <option value="AI Plugin">AI Plugins</option>
          <option value="Graphic Style">Graphic Styles</option>
        </select>
      </div>

      {/* Grid of Marketplace Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 relative group transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {item.category}
                </span>
                <h4 className="text-base font-bold text-white mt-1.5">{item.name}</h4>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Coins className="w-3.5 h-3.5" />
                {item.creditsCost === 0 ? 'FREE' : `${item.creditsCost} Credits`}
              </div>

              <div className="flex items-center gap-3 text-slate-400">
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" /> {item.downloads}
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Star className="w-3 h-3 fill-current" /> {item.rating}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">By {item.author}</span>
              <button
                onClick={() => handleToggleEnable(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  item.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {item.enabled ? 'Published' : 'Hidden'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white">
                {editingItem?.id ? 'Edit Marketplace Item' : 'Create Marketplace Item'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Item Name</label>
                <input
                  type="text"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Cyberpunk Reels Preset"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <select
                    value={editingItem?.category || 'Prompt Template'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Prompt Template">Prompt Template</option>
                    <option value="Video Preset">Video Preset</option>
                    <option value="Voice Persona">Voice Persona</option>
                    <option value="AI Plugin">AI Plugin</option>
                    <option value="Graphic Style">Graphic Style</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Credits Cost</label>
                  <input
                    type="number"
                    value={editingItem?.creditsCost ?? 2}
                    onChange={(e) => setEditingItem({ ...editingItem, creditsCost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <textarea
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Author / Publisher</label>
                <input
                  type="text"
                  value={editingItem?.author || 'VirJoy Official'}
                  onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/25"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
