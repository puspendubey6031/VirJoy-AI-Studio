import React, { useState } from 'react';
import { APIProviderManagerConfig, ProviderItem } from '../../types';
import {
  Cpu,
  Plus,
  Trash2,
  Power,
  RefreshCw,
  Save,
  Check,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Radio,
  Sliders,
  CheckCircle2,
  XCircle,
  RotateCcw
} from 'lucide-react';

interface APIProviderManagerTabProps {
  providerManagerConfig: APIProviderManagerConfig;
  onChange: (updated: APIProviderManagerConfig) => void;
  onSaveSingle: (fieldKey: string) => void;
  onCancelChanges: () => void;
  onResetToDefaults: () => void;
  showToast: (msg: string) => void;
}

export const APIProviderManagerTab: React.FC<APIProviderManagerTabProps> = ({
  providerManagerConfig,
  onChange,
  onSaveSingle,
  onCancelChanges,
  onResetToDefaults,
  showToast
}) => {
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; latencyMs: number; message: string }>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ProviderItem['providerType']>('custom');
  const [newModel, setNewModel] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  const providers = providerManagerConfig.providers || [];

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateProvider = (id: string, field: keyof ProviderItem, val: any) => {
    const updated = providers.map(p => {
      if (p.id === id) {
        return { ...p, [field]: val };
      }
      return p;
    });
    onChange({
      ...providerManagerConfig,
      providers: updated
    });
  };

  const handleMovePriority = (id: string, direction: 'up' | 'down') => {
    const index = providers.findIndex(p => p.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= providers.length) return;

    const copy = [...providers];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Reassign priority numbers
    const reordered = copy.map((p, idx) => ({ ...p, priority: idx + 1 }));
    const fallbackOrder = reordered.map(p => p.id);

    onChange({
      fallbackOrder,
      providers: reordered
    });
    showToast('Provider priority reordered');
  };

  const handleToggleEnable = (id: string) => {
    const updated = providers.map(p => {
      if (p.id === id) {
        return { ...p, enabled: !p.enabled };
      }
      return p;
    });
    onChange({
      ...providerManagerConfig,
      providers: updated
    });
  };

  const handleRemoveProvider = (id: string) => {
    if (!window.confirm('Delete this API provider permanently?')) return;
    const filtered = providers.filter(p => p.id !== id);
    onChange({
      fallbackOrder: filtered.map(p => p.id),
      providers: filtered
    });
    showToast('Provider removed');
  };

  const handleTestProvider = async (provider: ProviderItem) => {
    setTestingProviderId(provider.id);
    try {
      const res = await fetch('/api/admin/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          providerType: provider.providerType,
          endpoint: provider.endpoint,
          apiKey: provider.apiKey,
          model: provider.model
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResults(prev => ({
          ...prev,
          [provider.id]: {
            status: data.status,
            latencyMs: data.latencyMs,
            message: data.message
          }
        }));

        // Update provider status in state
        handleUpdateProvider(provider.id, 'status', data.status);
        showToast(`Test passed: ${data.message} (${data.latencyMs}ms)`);
      } else {
        setTestResults(prev => ({
          ...prev,
          [provider.id]: {
            status: 'Offline',
            latencyMs: 0,
            message: data.error || 'Connection failed'
          }
        }));
        handleUpdateProvider(provider.id, 'status', 'Offline');
      }
    } catch (e: any) {
      setTestResults(prev => ({
        ...prev,
        [provider.id]: {
          status: 'Offline',
          latencyMs: 0,
          message: e.message || 'Connection test failed'
        }
      }));
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleAddProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProv: ProviderItem = {
      id: 'prov-' + Date.now(),
      name: newName.trim(),
      providerType: newType,
      model: newModel.trim() || 'default-model',
      endpoint: newEndpoint.trim() || 'https://api.example.com',
      apiKey: newApiKey.trim(),
      enabled: true,
      priority: providers.length + 1,
      status: 'Operational'
    };

    const updatedProvs = [...providers, newProv];
    onChange({
      fallbackOrder: updatedProvs.map(p => p.id),
      providers: updatedProvs
    });

    setNewName('');
    setNewModel('');
    setNewEndpoint('');
    setNewApiKey('');
    setShowAddModal(false);
    showToast('New API Provider added successfully!');
  };

  const handleSave = () => {
    onSaveSingle('api_provider_manager');
    showToast('Settings Updated Successfully');
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Multi-Provider AI Fallback & Router Manager
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage multi-engine AI models (Gemini, Groq, Cohere, Mistral, FLUX, Edge TTS, gTTS, Media APIs) with priority failover routing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Provider
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              type="button"
              onClick={onCancelChanges}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
            <button
              type="button"
              onClick={onResetToDefaults}
              className="px-3.5 py-2 bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Provider List Cards */}
      <div className="space-y-4">
        {providers.map((provider, index) => {
          const testRes = testResults[provider.id];
          const isTesting = testingProviderId === provider.id;
          const isKeyVisible = visibleKeys[provider.id] || false;

          return (
            <div
              key={provider.id}
              className={`bg-slate-950 border rounded-2xl p-4 space-y-4 transition-all ${
                provider.enabled ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
              }`}
            >
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-indigo-400 text-xs">
                    #{provider.priority}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{provider.name}</span>
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                        {provider.providerType}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block">Model: {provider.model}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Indicator */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      provider.status === 'Operational'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : provider.status === 'Degraded'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        provider.status === 'Operational'
                          ? 'bg-emerald-400 animate-pulse'
                          : provider.status === 'Degraded'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                    />
                    {provider.status}
                  </span>

                  {/* Priority Order Buttons */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMovePriority(provider.id, 'up')}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move Priority Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === providers.length - 1}
                      onClick={() => handleMovePriority(provider.id, 'down')}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move Priority Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Enable Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleEnable(provider.id)}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                      provider.enabled
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {provider.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  {/* Test Ping Button */}
                  <button
                    type="button"
                    onClick={() => handleTestProvider(provider)}
                    disabled={isTesting}
                    className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    Test Ping
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveProvider(provider.id)}
                    className="p-2 text-rose-400 hover:bg-rose-950/40 border border-rose-500/20 rounded-xl cursor-pointer"
                    title="Delete Provider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Model Name:</label>
                  <input
                    type="text"
                    value={provider.model}
                    onChange={(e) => handleUpdateProvider(provider.id, 'model', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">API Endpoint Base URL:</label>
                  <input
                    type="text"
                    value={provider.endpoint}
                    onChange={(e) => handleUpdateProvider(provider.id, 'endpoint', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">API Secret Key:</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="Optional or Configured Key..."
                      value={provider.apiKey}
                      onChange={(e) => handleUpdateProvider(provider.id, 'apiKey', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 pr-8 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                      style={{
                        WebkitTextSecurity: isKeyVisible ? 'none' : 'disc',
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        WebkitTouchCallout: 'default',
                        touchAction: 'auto',
                        pointerEvents: 'auto'
                      } as React.CSSProperties}
                    />
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility(provider.id)}
                      className="absolute right-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Ping Result Bar */}
              {testRes && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
                    testRes.status === 'Operational'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <span>{testRes.message}</span>
                  {testRes.latencyMs > 0 && <span className="font-bold">{testRes.latencyMs}ms</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Adding Provider */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Add New AI Provider
            </h4>

            <form onSubmit={handleAddProvider} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">Provider Display Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anthropic Claude 3.5 Sonnet"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">Provider Engine Category:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="groq">Groq AI</option>
                  <option value="cohere">Cohere AI</option>
                  <option value="mistral">Mistral AI</option>
                  <option value="huggingface">Hugging Face</option>
                  <option value="edgetts">Edge TTS</option>
                  <option value="gtts">Google TTS (gTTS)</option>
                  <option value="pixabay">Pixabay</option>
                  <option value="pexels">Pexels</option>
                  <option value="pollinations">Pollinations AI</option>
                  <option value="custom">Custom API Provider</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">Model Name:</label>
                <input
                  type="text"
                  placeholder="e.g. claude-3-5-sonnet-20241022"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">API Endpoint URL:</label>
                <input
                  type="text"
                  placeholder="e.g. https://api.anthropic.com/v1"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 text-xs mb-1">API Secret Key:</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
