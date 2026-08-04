import React, { useState } from 'react';
import { AppConfig } from '../../types';
import {
  Activity,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart,
  Cpu,
  Layers,
  Sparkles,
  Server
} from 'lucide-react';

interface RenderPerformanceTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const RenderPerformanceTab: React.FC<RenderPerformanceTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  // Daily processing volume mock data for visual bar chart
  const dailyData = [
    { day: 'Mon', videos: 142, avgTimeSec: 11.2, successRate: 99.2 },
    { day: 'Tue', videos: 185, avgTimeSec: 12.8, successRate: 98.8 },
    { day: 'Wed', videos: 210, avgTimeSec: 10.5, successRate: 99.5 },
    { day: 'Thu', videos: 195, avgTimeSec: 11.8, successRate: 99.0 },
    { day: 'Fri', videos: 240, avgTimeSec: 13.1, successRate: 98.4 },
    { day: 'Sat', videos: 280, avgTimeSec: 12.0, successRate: 99.1 },
    { day: 'Sun', videos: 310, avgTimeSec: 11.4, successRate: 99.6 }
  ];

  const totalVideos = dailyData.reduce((acc, curr) => acc + curr.videos, 0);
  const avgOverallTime = (dailyData.reduce((acc, curr) => acc + curr.avgTimeSec, 0) / dailyData.length).toFixed(1);
  const avgSuccessRate = (dailyData.reduce((acc, curr) => acc + curr.successRate, 0) / dailyData.length).toFixed(1);
  const avgFailureRate = (100 - Number(avgSuccessRate)).toFixed(1);

  const maxDailyVideos = Math.max(...dailyData.map((d) => d.videos));

  return (
    <div className="space-y-6 text-xs">
      {/* Overview Banner */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Processing Performance & Worker Engine Telemetry
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Server-agnostic performance metrics for video generation throughput, success rates, and worker response latency.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(['7d', '30d', '90d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  timeframe === tf ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Performance KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-1">Total Videos Processed</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-white">{totalVideos.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-400 font-bold">+18.4%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-1">Avg Processing Latency</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-indigo-400">{avgOverallTime}s</span>
              <span className="text-[10px] text-emerald-400 font-bold">-0.8s faster</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-1">Processing Success Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-400">{avgSuccessRate}%</span>
              <span className="text-[10px] text-slate-500 font-bold">Optimal</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-1">Processing Failure Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-rose-400">{avgFailureRate}%</span>
              <span className="text-[10px] text-slate-500 font-bold">Below 1% Cap</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Bar Chart Component (Daily Processing Volume) */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Daily Video Processing Volume ({timeframe})
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">Peak: {maxDailyVideos} videos/day</span>
        </div>

        {/* Visual CSS Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="h-44 flex items-end justify-between gap-2 border-b border-slate-800 pb-2 px-2">
            {dailyData.map((d, i) => {
              const heightPercent = Math.round((d.videos / maxDailyVideos) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white font-mono text-[10px] px-2 py-1 rounded-lg shadow-xl absolute -mt-10 pointer-events-none whitespace-nowrap z-10">
                    {d.videos} videos • {d.avgTimeSec}s avg • {d.successRate}%
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[36px] bg-slate-900 rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-purple-400 rounded-t-md group-hover:from-indigo-500 group-hover:to-pink-400 transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                  </div>

                  {/* Day Label */}
                  <span className="text-slate-400 text-[11px] font-bold group-hover:text-white transition-colors">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Processing Speed & Worker Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h4 className="font-bold text-white text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" /> Average Processing Latency by Quality Preset
          </h4>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold">720p HD Standard (Free / Promo)</span>
                <span className="text-indigo-400 font-mono font-bold">8.2s avg</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold">1080p Full HD (Pro Plan ₹399)</span>
                <span className="text-purple-400 font-mono font-bold">12.4s avg</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300 font-bold">4K Ultra HD Cinema (Agency Plan ₹799)</span>
                <span className="text-emerald-400 font-mono font-bold">21.8s avg</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h4 className="font-bold text-white text-xs flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> Worker Engine Workload Distribution
          </h4>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-200 font-bold">Local Edge Workers (Vercel Functions / Browser)</span>
              <span className="text-indigo-300 font-mono font-black">48%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-200 font-bold">External GPU / VPS Worker Nodes</span>
              <span className="text-purple-300 font-mono font-black">36%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-200 font-bold">Cloud APIs (Runway, Luma, Pika, SVD)</span>
              <span className="text-emerald-300 font-mono font-black">16%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
