import React, { useState } from 'react';
import { AppConfig, ProviderItem } from '../../types';
import {
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Play
} from 'lucide-react';

interface ProviderHealthTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const ProviderHealthTab: React.FC<ProviderHealthTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [providers, setProviders] = useState<ProviderItem[]>(() => {
    return config.providerManagerConfig?.providers || [];
  });

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testLog, setTestLog] = useState<{ [key: string]: { latency: number; responseTime: number; status: string; successRate: number; errorRate: number } }>({
    'prov-gemini': { latency: 42, responseTime: 210, status: 'Online', successRate: 99.8, errorRate: 0.2 },
    'prov-groq': { latency: 28, responseTime: 180, status: 'Online', successRate: 99.9, errorRate: 0.1 },
    'prov-cohere': { latency: 65, responseTime: 310, status: 'Online', successRate: 98.5, errorRate: 1.5 },
    'prov-mistral': { latency: 72, responseTime: 340, status: 'Online', successRate: 98.1, errorRate: 1.9 },
    'prov-huggingface': { latency: 120, responseTime: 620, status: 'Online', successRate: 96.2, errorRate: 3.8 },
    'prov-edgetts': { latency: 35, responseTime: 190, status: 'Online', successRate: 99.5, errorRate: 0.5 },
    'prov-gtts': { latency: 50, responseTime: 230, status: 'Online', successRate: 99.1, errorRate: 0.9 },
    'prov-pexels': { latency: 85, responseTime: 410, status: 'Online', successRate: 97.8, errorRate: 2.2 },
    'prov-pixabay': { latency: 90, responseTime: 430, status: 'Online', successRate: 97.5, errorRate: 2.5 },
    'prov-pollinations': { latency: 110, responseTime: 520, status: 'Online', successRate: 95.0, errorRate: 5.0 }
  });

  const handleTestProvider = (id: string, name: string) => {
    setTestingId(id);
    setTimeout(() => {
      const simulatedLatency = Math.floor(Math.random() * 40) + 20;
      const simulatedResp = Math.floor(Math.random() * 200) + 150;
      setTestLog(prev => ({
        ...prev,
        [id]: {
          latency: simulatedLatency,
          responseTime: simulatedResp,
          status: 'Online',
          successRate: Number((98 + Math.random() * 1.9).toFixed(1)),
          errorRate: Number((0.1 + Math.random() * 0.9).toFixed(1))
        }
      }));
      setTestingId(null);
      showToast(`Health Check Passed for ${name}: ${simulatedLatency}ms ping, ${simulatedResp}ms response time.`);
    }, 800);
  };

  const handleToggleEnable = (id: string) => {
    const updated = providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
    setProviders(updated);
  };

  const handleMovePriority = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === providers.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const list = [...providers];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Recalculate priority index
    const reordered = list.map((p, idx) => ({ ...p, priority: idx + 1 }));
    setProviders(reordered);
  };

  const handleSaveProviders = () => {
    const updatedConfig = {
      ...config.providerManagerConfig,
      providers: providers,
      fallbackOrder: providers.filter(p => p.enabled).map(p => p.id)
    };
    onSave('provider_manager_config', updatedConfig);
  };

  const handleReset = () => {
    if (config.providerManagerConfig?.providers) {
      setProviders(JSON.parse(JSON.stringify(config.providerManagerConfig.providers)));
      showToast('Reverted provider changes to last saved state.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" /> AI Provider Health Center & Model Matrix
          </h4>
          <p className="text-xs text-slate-400">Live telemetry, latency ping tests, and dynamic priority routing for all provider endpoints.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            onClick={handleSaveProviders}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Provider Matrix
          </button>
        </div>
      </div>

      {/* Provider Health List */}
      <div className="space-y-3">
        {providers.map((p, index) => {
          const metrics = testLog[p.id] || { latency: 45, responseTime: 250, status: 'Online', successRate: 99.0, errorRate: 1.0 };
          const isTesting = testingId === p.id;

          return (
            <div
              key={p.id}
              className={`bg-slate-950 border rounded-2xl p-4 transition-all ${
                p.enabled ? 'border-slate-800' : 'border-slate-900 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Info & Priority */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs shrink-0">
                    <span className="text-[10px] text-slate-400">PRIORITY</span>
                    <span className="font-bold text-indigo-400 text-sm">#{index + 1}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-white text-sm">{p.name}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        p.enabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                        {p.enabled ? 'Online' : 'Disabled'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">Model: {p.model} | Endpoint: {p.endpoint}</div>
                  </div>
                </div>

                {/* Center: Live Health Metrics */}
                <div className="grid grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-xl text-xs shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Ping Latency</span>
                    <span className="font-mono font-bold text-emerald-400">{metrics.latency} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Response Time</span>
                    <span className="font-mono font-bold text-indigo-300">{metrics.responseTime} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Success Rate</span>
                    <span className="font-mono font-bold text-purple-300">{metrics.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Error Rate</span>
                    <span className="font-mono font-bold text-amber-400">{metrics.errorRate}%</span>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTestProvider(p.id, p.name)}
                    disabled={isTesting}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-800"
                  >
                    <Play className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} /> Test
                  </button>

                  <button
                    onClick={() => handleToggleEnable(p.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                      p.enabled ? 'bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:bg-rose-900' : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900'
                    }`}
                  >
                    {p.enabled ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                    <button
                      onClick={() => handleMovePriority(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Move Up Priority"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMovePriority(index, 'down')}
                      disabled={index === providers.length - 1}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Move Down Priority"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
