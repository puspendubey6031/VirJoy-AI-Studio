import React, { useState } from 'react';
import { CrossPromotionItem } from '../../types';
import {
  Share2,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Smartphone,
  Globe,
  Layers,
  X,
  CheckCircle2,
  Eye
} from 'lucide-react';

interface CrossPromotionTabProps {
  crossPromotionsList: CrossPromotionItem[];
  onChange: (updatedPromos: CrossPromotionItem[]) => void;
  onSaveSingle: (fieldKey: string, payload: any) => void;
  showToast: (msg: string) => void;
}

export const CrossPromotionTab: React.FC<CrossPromotionTabProps> = ({
  crossPromotionsList,
  onChange,
  onSaveSingle,
  showToast
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<CrossPromotionItem | null>(null);
  const [formData, setFormData] = useState<Partial<CrossPromotionItem>>({
    appName: '',
    description: '',
    ctaButtonText: 'Install App',
    playStoreUrl: '',
    websiteUrl: '',
    placement: 'Home',
    enabled: true,
    priority: 1
  });

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      appName: '',
      description: '',
      ctaButtonText: 'Install App',
      playStoreUrl: '',
      websiteUrl: '',
      placement: 'Home',
      enabled: true,
      priority: 1
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (promo: CrossPromotionItem) => {
    setEditingPromo(promo);
    setFormData(JSON.parse(JSON.stringify(promo)));
    setModalOpen(true);
  };

  const handleToggleEnable = (id: string) => {
    const updated = crossPromotionsList.map(cp => {
      if (cp.id === id) {
        const newEnabled = !cp.enabled;
        showToast(`Cross promo for ${cp.appName} ${newEnabled ? 'enabled' : 'paused'}`);
        return { ...cp, enabled: newEnabled };
      }
      return cp;
    });
    onChange(updated);
    onSaveSingle('cross_promotions', updated);
  };

  const handleDeletePromo = (id: string, name: string) => {
    if (!window.confirm(`Delete cross promotion for "${name}"?`)) return;
    const updated = crossPromotionsList.filter(cp => cp.id !== id);
    onChange(updated);
    onSaveSingle('cross_promotions', updated);
    showToast('Cross promotion removed');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.appName || !formData.description) {
      alert('App Name and Description are required.');
      return;
    }

    if (editingPromo) {
      const updated = crossPromotionsList.map(cp => (cp.id === editingPromo.id ? { ...cp, ...formData } as CrossPromotionItem : cp));
      onChange(updated);
      onSaveSingle('cross_promotions', updated);
      showToast('Cross promotion updated successfully');
    } else {
      const created: CrossPromotionItem = {
        id: `cp-${Date.now().toString().slice(-4)}`,
        appName: formData.appName!,
        description: formData.description!,
        logoUrl: formData.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        bannerUrl: formData.bannerUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600',
        ctaButtonText: formData.ctaButtonText || 'Try App',
        playStoreUrl: formData.playStoreUrl,
        websiteUrl: formData.websiteUrl,
        placement: (formData.placement as any) || 'Home',
        enabled: formData.enabled ?? true,
        priority: formData.priority || 1
      };
      const updated = [created, ...crossPromotionsList];
      onChange(updated);
      onSaveSingle('cross_promotions', updated);
      showToast('Created cross promotion campaign!');
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">Cross Promotion & Ecosystem Ads</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Promote partner applications, companion tools, Play Store links, and native website placements.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-950/40 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Cross Promotion App
        </button>
      </div>

      {/* Cross Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crossPromotionsList.length === 0 ? (
          <div className="col-span-2 bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-500 italic">
            No cross promotion campaigns added yet.
          </div>
        ) : (
          crossPromotionsList.map(promo => (
            <div
              key={promo.id}
              className={`bg-slate-900/90 rounded-2xl border p-5 flex flex-col justify-between transition-all space-y-4 ${
                promo.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/40 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Placement: {promo.placement}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Priority: #{promo.priority}</span>
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={promo.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'}
                    alt={promo.appName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <h4 className="text-base font-extrabold text-slate-100">{promo.appName}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{promo.description}</p>
                  </div>
                </div>

                {promo.bannerUrl && (
                  <div className="h-28 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={promo.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  {promo.playStoreUrl && (
                    <a
                      href={promo.playStoreUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 hover:underline"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Play Store
                    </a>
                  )}
                  {promo.websiteUrl && (
                    <a
                      href={promo.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-indigo-300 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <button
                  onClick={() => handleToggleEnable(promo.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    promo.enabled
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                  }`}
                >
                  {promo.enabled ? 'Active' : 'Disabled'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(promo)}
                    className="p-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl cursor-pointer"
                    title="Edit Campaign"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePromo(promo.id, promo.appName)}
                    className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl cursor-pointer"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                {editingPromo ? 'Edit Cross Promotion' : 'Add Cross Promotion Campaign'}
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
                <label className="block text-slate-400 mb-1">App Name *</label>
                <input
                  type="text"
                  placeholder="e.g. VirJoy Voice Studio Pro"
                  value={formData.appName || ''}
                  onChange={e => setFormData({ ...formData, appName: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description *</label>
                <textarea
                  rows={2}
                  placeholder="Short promotional tagline for app..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Logo URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.logoUrl || ''}
                    onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.bannerUrl || ''}
                    onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Placement Screen</label>
                  <select
                    value={formData.placement || 'Home'}
                    onChange={e => setFormData({ ...formData, placement: e.target.value as any })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <option value="Home">Home Screen</option>
                    <option value="Settings">Settings Page</option>
                    <option value="Success Screen">Video Render Complete Screen</option>
                    <option value="Popup">Popup Dialog</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Priority Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.priority ?? 1}
                    onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Play Store URL</label>
                  <input
                    type="text"
                    placeholder="https://play.google.com/..."
                    value={formData.playStoreUrl || ''}
                    onChange={e => setFormData({ ...formData, playStoreUrl: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Website URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.websiteUrl || ''}
                    onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-800"
                  />
                </div>
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Save Campaign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
