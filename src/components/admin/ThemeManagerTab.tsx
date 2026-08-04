import React, { useState } from 'react';
import { ThemeConfig, ThemeItem } from '../../types';
import {
  Palette,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Power,
  Sparkles,
  Eye,
  Sliders
} from 'lucide-react';

interface ThemeManagerTabProps {
  themeConfig: ThemeConfig;
  onChange: (updated: ThemeConfig) => void;
  onSaveSingle: (fieldKey: string) => void;
  showToast: (msg: string) => void;
  isSaved?: boolean;
}

export const ThemeManagerTab: React.FC<ThemeManagerTabProps> = ({
  themeConfig,
  onChange,
  onSaveSingle,
  showToast,
  isSaved = false
}) => {
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form for new theme
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeType, setNewThemeType] = useState<'single' | 'gradient' | 'mixed'>('gradient');
  const [newPrimary, setNewPrimary] = useState('#6366f1');
  const [newSecondary, setNewSecondary] = useState('#8b5cf6');
  const [newAccent, setNewAccent] = useState('#f59e0b');
  const [newBackground, setNewBackground] = useState('#020617');
  const [newCard, setNewCard] = useState('#0f172a');
  const [newButton, setNewButton] = useState('#4f46e5');
  const [newBorder, setNewBorder] = useState('#1e293b');
  const [newText, setNewText] = useState('#f8fafc');

  const themes = themeConfig.themes || [];

  const handleSetActiveTheme = (id: string) => {
    const updatedThemes = themes.map(t => ({
      ...t,
      active: t.id === id
    }));
    onChange({
      activeThemeId: id,
      themes: updatedThemes
    });
    showToast('Active theme updated. Save to persist.');
  };

  const handleToggleEnableTheme = (id: string) => {
    const updatedThemes = themes.map(t => {
      if (t.id === id) {
        return { ...t, enabled: !t.enabled };
      }
      return t;
    });
    onChange({
      ...themeConfig,
      themes: updatedThemes
    });
  };

  const handleDeleteTheme = (id: string) => {
    if (themes.length <= 1) {
      alert('Cannot delete the last remaining theme.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this custom theme?')) return;
    const filtered = themes.filter(t => t.id !== id);
    const activeId = themeConfig.activeThemeId === id ? filtered[0].id : themeConfig.activeThemeId;
    onChange({
      activeThemeId: activeId,
      themes: filtered.map(t => ({ ...t, active: t.id === activeId }))
    });
    showToast('Theme deleted successfully');
  };

  const handleThemeColorChange = (themeId: string, colorField: keyof ThemeItem, value: any) => {
    const updated = themes.map(t => {
      if (t.id === themeId) {
        return { ...t, [colorField]: value };
      }
      return t;
    });
    onChange({
      ...themeConfig,
      themes: updated
    });
  };

  const handleCreateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;

    const newId = 'theme-' + Date.now();
    const created: ThemeItem = {
      id: newId,
      name: newThemeName.trim(),
      type: newThemeType,
      primaryColor: newPrimary,
      secondaryColor: newSecondary,
      accentColor: newAccent,
      backgroundColor: newBackground,
      cardColor: newCard,
      buttonColor: newButton,
      borderColor: newBorder,
      textColor: newText,
      enabled: true,
      active: false
    };

    onChange({
      ...themeConfig,
      themes: [...themes, created]
    });

    setNewThemeName('');
    setShowCreateModal(false);
    showToast('New Theme Created Successfully!');
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header & Create Theme Action */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" /> Dynamic UI Theme Manager
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">
              Customize colors, card surfaces, gradients, and buttons across the VirJoy AI platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" /> Create Custom Theme
            </button>
            <button
              type="button"
              onClick={() => onSaveSingle('theme_manager')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" /> Save Theme Settings
            </button>
          </div>
        </div>
      </div>

      {/* List of Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themes.map((theme) => {
          const isActive = theme.id === themeConfig.activeThemeId || theme.active;
          const isEditing = editingThemeId === theme.id;

          return (
            <div
              key={theme.id}
              className={`bg-slate-950 border rounded-2xl p-4 space-y-4 transition-all relative ${
                isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg' : 'border-slate-800'
              }`}
            >
              {/* Theme Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-slate-700 shadow-inner"
                    style={{
                      background:
                        theme.type === 'gradient'
                          ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                          : theme.primaryColor
                    }}
                  />
                  <div>
                    <span className="font-bold text-white text-sm block">{theme.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      Type: {theme.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isActive ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active Theme
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetActiveTheme(theme.id)}
                      disabled={!theme.enabled}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Enable & Activate
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleEnableTheme(theme.id)}
                    className={`p-1.5 rounded-lg border cursor-pointer ${
                      theme.enabled
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                    title={theme.enabled ? 'Theme Enabled' : 'Theme Disabled'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingThemeId(isEditing ? null : theme.id)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                    title="Customize Theme Colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTheme(theme.id)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg border border-rose-500/20 cursor-pointer"
                      title="Delete Theme"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Theme Mini Card Preview Box */}
              <div
                className="p-3 rounded-xl border transition-colors space-y-2 text-xs"
                style={{
                  backgroundColor: theme.backgroundColor,
                  borderColor: theme.borderColor,
                  color: theme.textColor
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: theme.textColor }}>
                    Preview Component Card
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    Badge Accent
                  </span>
                </div>
                <p className="text-[11px] opacity-80">
                  Sample description body text styled with custom background ({theme.backgroundColor}) and card colors.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <div
                    className="px-3 py-1 rounded-lg font-bold text-xs text-white shadow-md cursor-pointer"
                    style={{
                      background:
                        theme.type === 'gradient'
                          ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                          : theme.buttonColor
                    }}
                  >
                    Sample Button
                  </div>
                  <span className="text-[10px] opacity-60">Primary: {theme.primaryColor}</span>
                </div>
              </div>

              {/* Theme Editable Fields (Expanded View) */}
              {isEditing && (
                <div className="pt-3 border-t border-slate-800 space-y-3 bg-slate-900/80 p-3 rounded-xl">
                  <div className="font-bold text-slate-200 text-[11px] flex items-center justify-between">
                    <span>Edit Theme Color Values:</span>
                    <button
                      type="button"
                      onClick={() => setEditingThemeId(null)}
                      className="text-indigo-400 hover:underline cursor-pointer"
                    >
                      Done Editing
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Primary Color:</label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={theme.primaryColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'primaryColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={theme.primaryColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'primaryColor', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Secondary Color:</label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={theme.secondaryColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'secondaryColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={theme.secondaryColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'secondaryColor', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Accent Color:</label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={theme.accentColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'accentColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={theme.accentColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'accentColor', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Background Color:</label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={theme.backgroundColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'backgroundColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={theme.backgroundColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'backgroundColor', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Card Color:</label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={theme.cardColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'cardColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={theme.cardColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'cardColor', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Button Color:</label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={theme.buttonColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'buttonColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={theme.buttonColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'buttonColor', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Border Color:</label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={theme.borderColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'borderColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={theme.borderColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'borderColor', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Text Color:</label>
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <input
                          type="color"
                          value={theme.textColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'textColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={theme.textColor}
                          onChange={(e) => handleThemeColorChange(theme.id, 'textColor', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Creating Theme */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Create Custom UI Theme
            </h4>

            <form onSubmit={handleCreateTheme} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">Theme Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyber Violet"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">Theme Style Mode:</label>
                <select
                  value={newThemeType}
                  onChange={(e) => setNewThemeType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="single">Single Color Minimal</option>
                  <option value="gradient">Gradient Color Flow</option>
                  <option value="mixed">Mixed High Contrast</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Primary Color:</label>
                  <input
                    type="color"
                    value={newPrimary}
                    onChange={(e) => setNewPrimary(e.target.value)}
                    className="w-full h-9 bg-slate-950 rounded-xl cursor-pointer p-1"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Secondary Color:</label>
                  <input
                    type="color"
                    value={newSecondary}
                    onChange={(e) => setNewSecondary(e.target.value)}
                    className="w-full h-9 bg-slate-950 rounded-xl cursor-pointer p-1"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Background Color:</label>
                  <input
                    type="color"
                    value={newBackground}
                    onChange={(e) => setNewBackground(e.target.value)}
                    className="w-full h-9 bg-slate-950 rounded-xl cursor-pointer p-1"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Card Color:</label>
                  <input
                    type="color"
                    value={newCard}
                    onChange={(e) => setNewCard(e.target.value)}
                    className="w-full h-9 bg-slate-950 rounded-xl cursor-pointer p-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
                >
                  Save New Theme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
