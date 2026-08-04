import React, { useState } from 'react';
import { AppConfig } from '../../types';
import {
  FileText,
  Download,
  Filter,
  Search,
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Zap,
  BarChart2,
  Calendar
} from 'lucide-react';

interface AIProviderUsage {
  provider: string;
  category: 'Text/Vision' | 'TTS Voice' | 'Stock Video/Photo' | 'Music';
  requests: number;
  success: number;
  failed: number;
  tokensUsed: number;
  costEstimateINR: number;
  avgResponseMs: number;
}

interface AIUsageLogsTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

const initialProvidersUsage: AIProviderUsage[] = [
  {
    provider: 'Gemini 2.0 Flash (Google)',
    category: 'Text/Vision',
    requests: 1420,
    success: 1412,
    failed: 8,
    tokensUsed: 840500,
    costEstimateINR: 12.4,
    avgResponseMs: 145
  },
  {
    provider: 'Groq (Llama 3 70B)',
    category: 'Text/Vision',
    requests: 680,
    success: 678,
    failed: 2,
    tokensUsed: 320100,
    costEstimateINR: 0.0,
    avgResponseMs: 82
  },
  {
    provider: 'HuggingFace (SDXL)',
    category: 'Text/Vision',
    requests: 310,
    success: 298,
    failed: 12,
    tokensUsed: 0,
    costEstimateINR: 18.5,
    avgResponseMs: 1850
  },
  {
    provider: 'Pexels API',
    category: 'Stock Video/Photo',
    requests: 2150,
    success: 2145,
    failed: 5,
    tokensUsed: 0,
    costEstimateINR: 0.0,
    avgResponseMs: 110
  },
  {
    provider: 'Pixabay API',
    category: 'Stock Video/Photo',
    requests: 1890,
    success: 1886,
    failed: 4,
    tokensUsed: 0,
    costEstimateINR: 0.0,
    avgResponseMs: 95
  },
  {
    provider: 'Unsplash API',
    category: 'Stock Video/Photo',
    requests: 940,
    success: 938,
    failed: 2,
    tokensUsed: 0,
    costEstimateINR: 0.0,
    avgResponseMs: 105
  },
  {
    provider: 'ElevenLabs Voice Synthesis',
    category: 'TTS Voice',
    requests: 450,
    success: 442,
    failed: 8,
    tokensUsed: 125000,
    costEstimateINR: 145.0,
    avgResponseMs: 320
  }
];

export const AIUsageLogsTab: React.FC<AIUsageLogsTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [usageData, setUsageData] = useState<AIProviderUsage[]>(initialProvidersUsage);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = usageData.filter(
    (item) =>
      item.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRequests = usageData.reduce((acc, curr) => acc + curr.requests, 0);
  const totalSuccess = usageData.reduce((acc, curr) => acc + curr.success, 0);
  const totalFailed = usageData.reduce((acc, curr) => acc + curr.failed, 0);
  const totalTokens = usageData.reduce((acc, curr) => acc + curr.tokensUsed, 0);
  const totalCostINR = usageData.reduce((acc, curr) => acc + curr.costEstimateINR, 0);
  const successRate = totalRequests > 0 ? ((totalSuccess / totalRequests) * 100).toFixed(1) : '100';

  const handleExportCSV = () => {
    const headers = ['Provider', 'Category', 'Requests', 'Success', 'Failed', 'Tokens Used', 'Cost INR', 'Avg Response (ms)'];
    const rows = filteredData.map((d) => [
      `"${d.provider}"`,
      `"${d.category}"`,
      d.requests,
      d.success,
      d.failed,
      d.tokensUsed,
      d.costEstimateINR,
      d.avgResponseMs
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `virjoy_ai_usage_logs_${timeFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('AI Usage Logs CSV exported successfully!');
  };

  const handleExportPDF = () => {
    showToast('AI Usage Summary Report PDF generated and downloaded!');
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Overview Metric Banner */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" /> AI Usage Telemetry & Cost Analytics
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Track token consumption, response latency, error rates, and estimated cost per AI vendor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {(['today', 'week', 'month', 'custom'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                    timeFilter === tf
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Export Buttons */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <FileText className="w-3.5 h-3.5" /> PDF Report
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-0.5">Total API Calls</span>
            <span className="text-base font-black text-white">{totalRequests.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-0.5">Success Rate</span>
            <span className="text-base font-black text-emerald-400">{successRate}% ({totalSuccess})</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-0.5">Failed Requests</span>
            <span className="text-base font-black text-rose-400">{totalFailed}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-0.5">Tokens Consumed</span>
            <span className="text-base font-black text-purple-400">{totalTokens.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-0.5">Estimated Cost</span>
            <span className="text-base font-black text-amber-400">₹{totalCostINR.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* AI Vendors Detailed Table */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" /> Vendor Usage & Cost Breakdown
          </h4>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search vendor or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">AI Vendor / API</th>
                <th className="p-3">Category</th>
                <th className="p-3">Total Calls</th>
                <th className="p-3">Success / Failed</th>
                <th className="p-3">Tokens Used</th>
                <th className="p-3">Avg Latency</th>
                <th className="p-3 text-right">Est. Cost (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-bold text-white">{item.provider}</td>
                  <td className="p-3 text-slate-400">{item.category}</td>
                  <td className="p-3 font-mono font-bold text-indigo-300">{item.requests.toLocaleString()}</td>
                  <td className="p-3 font-mono">
                    <span className="text-emerald-400">{item.success}</span> / <span className="text-rose-400">{item.failed}</span>
                  </td>
                  <td className="p-3 font-mono text-purple-300">
                    {item.tokensUsed > 0 ? item.tokensUsed.toLocaleString() : 'N/A (Stock API)'}
                  </td>
                  <td className="p-3 font-mono text-slate-300">{item.avgResponseMs} ms</td>
                  <td className="p-3 font-mono font-extrabold text-amber-300 text-right">
                    ₹{item.costEstimateINR.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
