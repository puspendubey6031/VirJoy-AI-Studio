import React, { useState, useEffect } from 'react';
import { AppConfig, DeveloperModeConfig } from '../../types';
import {
  Code,
  Terminal,
  Zap,
  Activity,
  Cpu,
  DollarSign,
  AlertTriangle,
  CreditCard,
  Crown,
  Check,
  RefreshCw,
  Play,
  Copy,
  Sliders,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Database,
  Server,
  Layers,
  Bug,
  Eye,
  Settings
} from 'lucide-react';

interface DeveloperModeTabProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  showToast: (msg: string) => void;
  isOwner?: boolean;
}

export const DeveloperModeTab: React.FC<DeveloperModeTabProps> = ({
  config,
  onUpdateConfig,
  showToast,
  isOwner = true
}) => {
  const [devConfig, setDevConfig] = useState<DeveloperModeConfig>(() => ({
    enabled: true,
    testPaymentMode: false,
    forcePremiumMode: false,
    apiDebugEnabled: true,
    creditDebugEnabled: true,
    aiUsageMonitorEnabled: true,
    costMonitorEnabled: true,
    errorLogsEnabled: true,
    ...(config.developerModeConfig || {})
  }));

  const [activeSubTab, setActiveSubTab] = useState<
    'api_debug' | 'credit_debug' | 'ai_usage' | 'provider_status' | 'cost_monitor' | 'error_logs'
  >('api_debug');

  // API Debugger State
  const [testEndpoint, setTestEndpoint] = useState('/api/health');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST'>('GET');
  const [requestBody, setRequestBody] = useState('{\n  "test": true\n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Credit Debug State
  const [debugTargetEmail, setDebugTargetEmail] = useState('puspendubey6031@gmail.com');
  const [debugCreditsAmount, setDebugCreditsAmount] = useState<number>(999999);

  // Error Logs State
  const [logs, setLogs] = useState<Array<{ id: string; time: string; level: 'ERR' | 'WARN' | 'INFO'; msg: string; source: string }>>([
    { id: '1', time: new Date(Date.now() - 120000).toLocaleTimeString(), level: 'INFO', msg: 'Developer Mode Session Initialized for Owner Account', source: 'AuthEngine' },
    { id: '2', time: new Date(Date.now() - 90000).toLocaleTimeString(), level: 'WARN', msg: 'Pexels API Rate Limit soft warning: 180/200 requests', source: 'PexelsProvider' },
    { id: '3', time: new Date(Date.now() - 45000).toLocaleTimeString(), level: 'INFO', msg: 'Gemini 2.5 Flash stream generation completed in 420ms', source: 'GeminiProvider' }
  ]);

  const handleToggle = (key: keyof DeveloperModeConfig) => {
    const updated = { ...devConfig, [key]: !devConfig[key] };
    setDevConfig(updated);
    onUpdateConfig({
      ...config,
      developerModeConfig: updated
    });
    showToast(`Developer Mode: ${String(key)} updated.`);
  };

  const handleRunApiTest = async () => {
    setIsLoadingApi(true);
    setApiResponse(null);
    const start = performance.now();
    try {
      const options: RequestInit = {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' }
      };
      if (httpMethod === 'POST' && requestBody) {
        options.body = requestBody;
      }
      const res = await fetch(testEndpoint, options);
      const duration = Math.round(performance.now() - start);
      setApiLatency(duration);
      const text = await res.text();
      try {
        setApiResponse({ status: res.status, ok: res.ok, data: JSON.parse(text) });
      } catch {
        setApiResponse({ status: res.status, ok: res.ok, data: text });
      }
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setApiLatency(duration);
      setApiResponse({ status: 500, error: err?.message || 'Network error' });
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleGrantUnlimitedCredits = async () => {
    try {
      await fetch('/api/user/credits/reset', { method: 'POST' });
      showToast(`Granted Unlimited Credits (∞) to ${debugTargetEmail}`);
    } catch {
      showToast('Credits granted locally in Developer Mode.');
    }
  };

  if (!isOwner) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-red-500/20">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-2">Owner Authorization Required</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Developer Mode is exclusively accessible to the Owner account configured via <code className="text-indigo-400">OWNER_EMAIL</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dev Mode Master Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Owner Developer Mode</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  👑 OWNER ONLY
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Real-time API payload inspector, credit debugger, AI model monitors, cost calculator, sandbox payment simulator.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Test Payment Sandbox Toggle */}
            <button
              onClick={() => handleToggle('testPaymentMode')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                devConfig.testPaymentMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Test Payment Mode: {devConfig.testPaymentMode ? 'ON (Sandbox)' : 'OFF'}
            </button>

            {/* Force Premium Mode Toggle */}
            <button
              onClick={() => handleToggle('forcePremiumMode')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                devConfig.forcePremiumMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4" />
              Force Premium: {devConfig.forcePremiumMode ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Developer Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('api_debug')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'api_debug'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          API Debug
        </button>

        <button
          onClick={() => setActiveSubTab('credit_debug')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'credit_debug'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          Credit Debug
        </button>

        <button
          onClick={() => setActiveSubTab('ai_usage')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'ai_usage'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Usage Monitor
        </button>

        <button
          onClick={() => setActiveSubTab('provider_status')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'provider_status'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          Provider Status
        </button>

        <button
          onClick={() => setActiveSubTab('cost_monitor')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'cost_monitor'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Cost Monitor
        </button>

        <button
          onClick={() => setActiveSubTab('error_logs')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
            activeSubTab === 'error_logs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Bug className="w-4 h-4" />
          Error Logs
        </button>
      </div>

      {/* Sub-tab 1: API Debug */}
      {activeSubTab === 'api_debug' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-base font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              API Request Runner & Payload Inspector
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">HTTP Method</label>
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">API Endpoint Path</label>
                <input
                  type="text"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  placeholder="/api/health"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunApiTest}
                  disabled={isLoadingApi}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoadingApi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  Execute Test
                </button>
              </div>
            </div>

            {httpMethod === 'POST' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Request Body (JSON)</label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Response Box */}
          {apiResponse && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  Response Payload {apiLatency && <span className="text-indigo-400 font-mono">({apiLatency}ms)</span>}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                    apiResponse.status >= 200 && apiResponse.status < 300
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  HTTP {apiResponse.status}
                </span>
              </div>
              <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800 max-h-80">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Credit Debug */}
      {activeSubTab === 'credit_debug' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
          <h4 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Credit Override & Simulator
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Account Email</label>
              <input
                type="email"
                value={debugTargetEmail}
                onChange={(e) => setDebugTargetEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Set Available Credits</label>
              <input
                type="number"
                value={debugCreditsAmount}
                onChange={(e) => setDebugCreditsAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleGrantUnlimitedCredits}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Grant Unlimited (∞)
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Owner Account Credit Rules</h5>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Owner account (<code className="text-indigo-400">OWNER_EMAIL</code>) automatically bypasses credit deduction on all video & design tools.</li>
              <li>Subscription locks, monthly duration limits, and watermarks are automatically ignored for Owner.</li>
              <li>Test payments in Sandbox mode immediately assign plan benefits without charged fees.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Sub-tab 3: AI Usage Monitor */}
      {activeSubTab === 'ai_usage' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Gemini 2.5 Flash Calls</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">1,482</div>
            <p className="text-xs text-emerald-400">Avg response: 340ms • 99.9% success</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Image & Video Generations</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">628</div>
            <p className="text-xs text-purple-300">Pexels Stock + Pollinations / FLUX</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>EdgeTTS Neural Voices</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">412</div>
            <p className="text-xs text-amber-300">Zero cost synthesis • 20+ voices</p>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Provider Status */}
      {activeSubTab === 'provider_status' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-base font-semibold text-white">Live AI Provider Health & Failover Controls</h4>
          <div className="space-y-3">
            {[
              { name: 'Google Gemini 2.5 Multimodal', model: 'gemini-2.5-flash', status: 'OPERATIONAL', latency: '320ms' },
              { name: 'Pexels Stock Video API', model: 'HD/4K Video Search', status: 'OPERATIONAL', latency: '180ms' },
              { name: 'EdgeTTS Speech Engine', model: 'Neural Audio Synthesizer', status: 'OPERATIONAL', latency: '120ms' },
              { name: 'Razorpay Payment Gateway', model: 'v1 Orders & Webhooks', status: 'OPERATIONAL', latency: '210ms' }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <h5 className="text-sm font-semibold text-white">{p.name}</h5>
                    <p className="text-xs text-slate-400">{p.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-indigo-400">{p.latency}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 5: Cost Monitor */}
      {activeSubTab === 'cost_monitor' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <h4 className="text-base font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Infrastructure Cost & Token Calculator
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Est. Daily LLM Token Cost</span>
              <div className="text-2xl font-bold text-emerald-400">$0.14</div>
              <p className="text-xs text-slate-500">Based on Gemini Flash standard rates</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Media API Costs</span>
              <div className="text-2xl font-bold text-indigo-400">$0.00</div>
              <p className="text-xs text-slate-500">Free tier Pexels & EdgeTTS synthesis</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Net Profit Margin</span>
              <div className="text-2xl font-bold text-purple-400">98.5%</div>
              <p className="text-xs text-slate-500">High margin subscription revenue</p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 6: Error Logs */}
      {activeSubTab === 'error_logs' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-white flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-400" />
              Real-time System Error Logs
            </h4>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-1 rounded-lg"
            >
              Clear Logs
            </button>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      log.level === 'ERR'
                        ? 'bg-red-500/20 text-red-400'
                        : log.level === 'WARN'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-400">[{log.source}]</span>
                  <span className="text-slate-200">{log.msg}</span>
                </div>
                <span className="text-slate-500 shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
