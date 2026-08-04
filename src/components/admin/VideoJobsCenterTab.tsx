import React, { useState } from 'react';
import { AppConfig, WorkerEngineConfig } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Eye,
  XCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Zap,
  Activity,
  Layers,
  Search,
  Filter,
  Check,
  Info,
  X,
  Server,
  Settings,
  Save,
  Radio,
  Sliders,
  Shield,
  CheckSquare
} from 'lucide-react';

interface ServerAgnosticJob {
  id: string;
  userId: string;
  userEmail: string;
  prompt: string;
  durationSeconds: number;
  resolution: string;
  voice: string;
  subtitle: string;
  aiProvider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progressPercent: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  assignedWorker: string;
  workerType: 'Local Worker' | 'Server Worker' | 'GPU Worker' | 'External Worker';
  retryCount: number;
  processingTimeSeconds?: number;
  errorMessage?: string;
}

interface VideoJobsCenterTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

const initialWorkerEngineConfig: WorkerEngineConfig = {
  workerMode: 'Local',
  workerUrl: 'https://api.virjoy.ai/v1/worker-engine',
  apiKey: 'vj_worker_sec_live_99831',
  maxConcurrentJobs: 4,
  timeoutSeconds: 300,
  retryCount: 3,
  allowedWorkerTypes: ['FFmpeg', 'Remotion', 'Runway API', 'Pika API', 'Luma API', 'Stable Video Diffusion', 'Custom GPU VPS']
};

const initialAgnosticJobs: ServerAgnosticJob[] = [
  {
    id: 'job_vj_9081',
    userId: 'usr_882',
    userEmail: 'alex.creator@virjoy.ai',
    prompt: '3D realistic cybernetic watch commercial with glowing blue accents and slick transitions',
    durationSeconds: 15,
    resolution: '1080p (16:9)',
    voice: 'female-ananya',
    subtitle: 'English (Custom Subtitles)',
    aiProvider: 'Gemini 2.0 Flash + Pexels',
    status: 'completed',
    progressPercent: 100,
    createdAt: new Date(Date.now() - 325000).toISOString(),
    startedAt: new Date(Date.now() - 320000).toISOString(),
    finishedAt: new Date(Date.now() - 308000).toISOString(),
    assignedWorker: 'Worker Node #01 (Local Edge)',
    workerType: 'Local Worker',
    retryCount: 0,
    processingTimeSeconds: 12
  },
  {
    id: 'job_vj_9082',
    userId: 'usr_412',
    userEmail: 'sarah.m@agency.com',
    prompt: 'Luxury perfume splash cinematic teaser with golden particles and ambient lighting',
    durationSeconds: 30,
    resolution: '4K (9:16)',
    voice: 'male-arav',
    subtitle: 'Spanish (Latin America)',
    aiProvider: 'Groq Llama-3 + Pixabay',
    status: 'processing',
    progressPercent: 68,
    createdAt: new Date(Date.now() - 50000).toISOString(),
    startedAt: new Date(Date.now() - 45000).toISOString(),
    assignedWorker: 'Worker Node #04 (GPU VPS)',
    workerType: 'GPU Worker',
    retryCount: 0,
    processingTimeSeconds: 45
  },
  {
    id: 'job_vj_9083',
    userId: 'usr_905',
    userEmail: 'dev.team@startup.io',
    prompt: 'SaaS analytics platform explainer video with animated charts and modern voiceover',
    durationSeconds: 15,
    resolution: '1080p (16:9)',
    voice: 'neutral-alex',
    subtitle: 'Hindi',
    aiProvider: 'HuggingFace SDXL',
    status: 'pending',
    progressPercent: 0,
    createdAt: new Date(Date.now() - 12000).toISOString(),
    assignedWorker: 'Unassigned (Processing Queue)',
    workerType: 'Server Worker',
    retryCount: 0
  },
  {
    id: 'job_vj_9084',
    userId: 'usr_102',
    userEmail: 'robert.k@marketing.org',
    prompt: 'Organic coffee beans roasting process documentary with serene acoustic music background',
    durationSeconds: 60,
    resolution: '1080p (1:1)',
    voice: 'male-child-kabir',
    subtitle: 'German',
    aiProvider: 'Unsplash API',
    status: 'failed',
    progressPercent: 42,
    createdAt: new Date(Date.now() - 610000).toISOString(),
    startedAt: new Date(Date.now() - 600000).toISOString(),
    finishedAt: new Date(Date.now() - 580000).toISOString(),
    assignedWorker: 'Worker Node #02 (Remotion/FFmpeg)',
    workerType: 'External Worker',
    retryCount: 2,
    processingTimeSeconds: 20,
    errorMessage: 'Worker Engine Timeout: External worker API rate limit exceeded. Retry queued.'
  },
  {
    id: 'job_vj_9085',
    userId: 'usr_331',
    userEmail: 'user_guest_8921@virjoy.ai',
    prompt: 'Futuristic electric supercar highway racing at dusk with synthwave neon aesthetic',
    durationSeconds: 15,
    resolution: '720p (16:9)',
    voice: 'female-riya',
    subtitle: 'French',
    aiProvider: 'Gemini 2.0 Flash',
    status: 'cancelled',
    progressPercent: 15,
    createdAt: new Date(Date.now() - 910000).toISOString(),
    startedAt: new Date(Date.now() - 900000).toISOString(),
    finishedAt: new Date(Date.now() - 898000).toISOString(),
    assignedWorker: 'Worker Node #01 (Local Edge)',
    workerType: 'Local Worker',
    retryCount: 0,
    processingTimeSeconds: 2,
    errorMessage: 'User cancelled job processing from studio controls.'
  }
];

export const VideoJobsCenterTab: React.FC<VideoJobsCenterTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [jobs, setJobs] = useState<ServerAgnosticJob[]>(initialAgnosticJobs);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<ServerAgnosticJob | null>(null);

  // Worker Settings Local State
  const [workerConfig, setWorkerConfig] = useState<WorkerEngineConfig>(
    config.workerEngineConfig || initialWorkerEngineConfig
  );
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Queue Control
  const [isQueuePaused, setIsQueuePaused] = useState(false);

  // Worker Node Telemetry
  const activeWorkersCount = 3;
  const idleWorkersCount = 2;
  const offlineWorkersCount = 0;

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesSearch =
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.assignedWorker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.aiProvider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = jobs.filter((j) => j.status === 'pending').length;
  const processingCount = jobs.filter((j) => j.status === 'processing').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const cancelledCount = jobs.filter((j) => j.status === 'cancelled').length;

  const avgProcessingTimeSec = 11.8;

  const handleRetryJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'processing',
              progressPercent: 5,
              retryCount: j.retryCount + 1,
              startedAt: new Date().toISOString(),
              finishedAt: undefined,
              errorMessage: undefined
            }
          : j
      )
    );
    showToast(`Job ${id} re-queued into Processing Queue.`);
  };

  const handleCancelJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'cancelled',
              finishedAt: new Date().toISOString(),
              errorMessage: 'Cancelled by Admin from Video Jobs Center.'
            }
          : j
      )
    );
    showToast(`Job ${id} cancelled by admin.`);
  };

  const handleDeleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    showToast(`Job ${id} permanently removed from processing records.`);
  };

  const handleRetryAllFailed = () => {
    let count = 0;
    setJobs((prev) =>
      prev.map((j) => {
        if (j.status === 'failed') {
          count++;
          return {
            ...j,
            status: 'processing',
            progressPercent: 5,
            retryCount: j.retryCount + 1,
            startedAt: new Date().toISOString(),
            finishedAt: undefined,
            errorMessage: undefined
          };
        }
        return j;
      })
    );
    showToast(`Re-queued ${count} failed jobs into Processing Engine.`);
  };

  const handleClearQueue = () => {
    let count = 0;
    setJobs((prev) =>
      prev.map((j) => {
        if (j.status === 'pending') {
          count++;
          return { ...j, status: 'cancelled', errorMessage: 'Processing Queue cleared by admin.' };
        }
        return j;
      })
    );
    showToast(`Cleared ${count} pending jobs in Processing Queue.`);
  };

  const toggleQueuePause = () => {
    const nextState = !isQueuePaused;
    setIsQueuePaused(nextState);
    showToast(nextState ? 'Processing Queue Paused.' : 'Processing Queue Resumed.');
  };

  const handleSaveWorkerConfig = () => {
    onSave('workerEngineConfig', workerConfig);
    setShowConfigModal(false);
    showToast('Worker Engine Configuration updated and saved!');
  };

  return (
    <div className="space-y-6 text-xs">
      {/* 1. Worker Dashboard & Processing Engine Telemetry */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" /> Worker Engine & Processing Dashboard
              </h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isQueuePaused
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isQueuePaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                ></span>
                {isQueuePaused ? 'PROCESSING QUEUE PAUSED' : 'PROCESSING ENGINE ACTIVE'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Server-agnostic worker orchestration (Vercel, Supabase, Local, or Custom GPU/VPS Worker).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" /> Worker Settings
            </button>
            <button
              onClick={toggleQueuePause}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isQueuePaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
              }`}
            >
              {isQueuePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isQueuePaused ? 'Resume Queue' : 'Pause Queue'}
            </button>
            <button
              onClick={handleClearQueue}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" /> Clear Pending
            </button>
            <button
              onClick={handleRetryAllFailed}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry Failed ({failedCount})
            </button>
          </div>
        </div>

        {/* Worker Dashboard Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Active Workers</span>
            <span className="text-base font-black text-emerald-400">{activeWorkersCount} Online</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Idle Workers</span>
            <span className="text-base font-black text-cyan-400">{idleWorkersCount} Ready</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Offline Workers</span>
            <span className="text-base font-black text-slate-500">{offlineWorkersCount}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Queue Length</span>
            <span className="text-base font-black text-indigo-400">{pendingCount + processingCount} Jobs</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Avg Processing Time</span>
            <span className="text-base font-black text-amber-400">~{avgProcessingTimeSec}s</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Failed Jobs</span>
            <span className="text-base font-black text-rose-400">{failedCount}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Worker Mode</span>
            <span className="text-xs font-black text-purple-300 uppercase">{workerConfig.workerMode}</span>
          </div>
        </div>
      </div>

      {/* 2. Video Jobs Table */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Video Jobs Center
            </h4>
            <p className="text-slate-400 text-[11px]">
              Inspect, retry, cancel, or audit video jobs across all connected worker engines.
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search job ID, email, prompt, worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {[
                { id: 'all', label: `All (${jobs.length})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'processing', label: `Processing (${processingCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
                { id: 'failed', label: `Failed (${failedCount})` },
                { id: 'cancelled', label: `Cancelled (${cancelledCount})` }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setFilterStatus(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    filterStatus === st.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs List Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Job ID & User</th>
                <th className="p-3">Prompt & Spec</th>
                <th className="p-3">Assigned Worker Engine</th>
                <th className="p-3">Progress & Time</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                    No video jobs found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-mono">
                      <span className="text-indigo-300 font-bold block">{job.id}</span>
                      <span className="text-slate-400 text-[11px] font-sans block">{job.userEmail}</span>
                    </td>

                    <td className="p-3 max-w-xs">
                      <span className="text-slate-200 block truncate" title={job.prompt}>
                        {job.prompt}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {job.resolution} • {job.durationSeconds}s • {job.aiProvider}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="text-white font-bold block">{job.assignedWorker}</span>
                      <span className="text-purple-400 text-[10px] block font-mono">{job.workerType}</span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-20 bg-slate-900 border border-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              job.status === 'completed'
                                ? 'bg-emerald-400'
                                : job.status === 'failed'
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${job.progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 font-bold">{job.progressPercent}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {job.processingTimeSeconds ? `${job.processingTimeSeconds}s processing time` : 'In Queue'}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          job.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : job.status === 'processing'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                            : job.status === 'pending'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : job.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                          title="View Inspector Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        </button>

                        {(job.status === 'failed' || job.status === 'cancelled') && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg cursor-pointer"
                            title="Retry Job"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {(job.status === 'pending' || job.status === 'processing') && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="p-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg cursor-pointer"
                            title="Cancel Job"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg cursor-pointer"
                          title="Delete Job Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Worker Engine Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Worker Engine Configuration</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 text-[11px]">
              VirJoy AI operates server-agnostically on Vercel + Supabase, or plugs into custom worker endpoints (FFmpeg, Remotion, Runway, Pika, Luma, SVD, or GPU VPS) without UI rebuilding.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Worker Operating Mode:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkerConfig((prev) => ({ ...prev, workerMode: 'Local' }))}
                    className={`p-2.5 rounded-xl font-bold border text-center cursor-pointer transition-all ${
                      workerConfig.workerMode === 'Local'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Local (In-Browser / Edge)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkerConfig((prev) => ({ ...prev, workerMode: 'External' }))}
                    className={`p-2.5 rounded-xl font-bold border text-center cursor-pointer transition-all ${
                      workerConfig.workerMode === 'External'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    External Worker Server
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Worker Endpoint URL:</label>
                <input
                  type="text"
                  value={workerConfig.workerUrl}
                  onChange={(e) => setWorkerConfig((prev) => ({ ...prev, workerUrl: e.target.value }))}
                  placeholder="https://worker-api.yourdomain.com"
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white font-mono text-xs outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Custom endpoint for external GPU worker node or cloud API dispatcher.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Worker API Key / Secret:</label>
                <input
                  type="password"
                  value={workerConfig.apiKey}
                  onChange={(e) => setWorkerConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white font-mono text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Concurrent Jobs:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={workerConfig.maxConcurrentJobs}
                    onChange={(e) => setWorkerConfig((prev) => ({ ...prev, maxConcurrentJobs: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Timeout (Sec):</label>
                  <input
                    type="number"
                    min={10}
                    max={3600}
                    value={workerConfig.timeoutSeconds}
                    onChange={(e) => setWorkerConfig((prev) => ({ ...prev, timeoutSeconds: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Retry Count:</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={workerConfig.retryCount}
                    onChange={(e) => setWorkerConfig((prev) => ({ ...prev, retryCount: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkerConfig}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold cursor-pointer shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Job Inspector Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Video Job Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div><span className="text-slate-500">Job ID:</span> <span className="text-indigo-300 font-bold">{selectedJob.id}</span></div>
                <div><span className="text-slate-500">User Email:</span> <span className="text-white">{selectedJob.userEmail}</span></div>
                <div><span className="text-slate-500">User ID:</span> <span className="text-slate-300">{selectedJob.userId}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-amber-400 uppercase font-bold">{selectedJob.status}</span></div>
                <div><span className="text-slate-500">Assigned Worker:</span> <span className="text-purple-300 font-bold">{selectedJob.assignedWorker}</span></div>
                <div><span className="text-slate-500">Worker Type:</span> <span className="text-cyan-300">{selectedJob.workerType}</span></div>
                <div><span className="text-slate-500">Retry Count:</span> <span className="text-white">{selectedJob.retryCount}</span></div>
              </div>

              <div>
                <span className="text-slate-400 font-sans block font-bold mb-1">Prompt Input:</span>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 font-sans leading-relaxed">
                  {selectedJob.prompt}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div><span className="text-slate-500">Created:</span> <span className="text-slate-300">{new Date(selectedJob.createdAt).toLocaleString()}</span></div>
                <div><span className="text-slate-500">Processing Time:</span> <span className="text-emerald-400">{selectedJob.processingTimeSeconds ? `${selectedJob.processingTimeSeconds}s` : 'N/A'}</span></div>
              </div>

              {selectedJob.errorMessage && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-xl font-sans text-xs">
                  <span className="font-bold block mb-1">Worker Error Log:</span>
                  {selectedJob.errorMessage}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
