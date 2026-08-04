import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GlobalAIJob, GlobalJobType, UserStats, AppConfig } from '../types';

interface SubmitJobOptions {
  onSuccess?: (result: any) => void;
  onError?: (errorMsg: string) => void;
}

interface GlobalJobContextType {
  activeJob: GlobalAIJob | null;
  isModalOpen: boolean;
  submitAIJob: (type: GlobalJobType, params: any, options?: SubmitJobOptions) => Promise<GlobalAIJob>;
  cancelAIJob: (jobId: string) => Promise<void>;
  retryAIJob: (jobId: string) => Promise<void>;
  closeModal: () => void;
  openModal: () => void;
  setCompletedHandler: (handler: ((job: GlobalAIJob) => void) | null) => void;
}

const GlobalJobContext = createContext<GlobalJobContextType | undefined>(undefined);

const LOCAL_STORAGE_JOB_KEY = 'virjoy_active_job_id';

export const GlobalJobProvider: React.FC<{
  children: ReactNode;
  onUpdateUserStats?: (stats: UserStats) => void;
  config?: AppConfig;
}> = ({ children, onUpdateUserStats, config }) => {
  const [activeJob, setActiveJob] = useState<GlobalAIJob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [onCompletedCallback, setOnCompletedCallback] = useState<((job: GlobalAIJob) => void) | null>(null);

  // Poll job status from server
  const fetchJobStatus = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/ai/jobs/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) {
          localStorage.removeItem(LOCAL_STORAGE_JOB_KEY);
          setActiveJob(null);
        }
        return;
      }
      const data = await res.json();
      if (data.success && data.job) {
        const job: GlobalAIJob = data.job;
        setActiveJob(job);

        // Check if finished
        if (job.stage === 'completed' || job.stage === 'failed' || job.stage === 'cancelled') {
          if (job.stage === 'completed') {
            localStorage.removeItem(LOCAL_STORAGE_JOB_KEY);
            // Refresh stats
            try {
              const statsRes = await fetch('/api/user-stats');
              const statsData = await statsRes.json();
              if (statsData.success && onUpdateUserStats) {
                onUpdateUserStats(statsData.stats);
              }
            } catch (e) {
              console.warn('Stats refresh error:', e);
            }

            if (onCompletedCallback) {
              onCompletedCallback(job);
            }
          } else if (job.stage === 'failed' || job.stage === 'cancelled') {
            localStorage.removeItem(LOCAL_STORAGE_JOB_KEY);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to poll job status:', err);
    }
  }, [onCompletedCallback, onUpdateUserStats]);

  // Restore active job on initial load or tab focus
  useEffect(() => {
    const restoreActiveJob = async () => {
      const savedJobId = localStorage.getItem(LOCAL_STORAGE_JOB_KEY);
      if (savedJobId) {
        await fetchJobStatus(savedJobId);
        setIsModalOpen(true);
      } else {
        // Query server for any active jobs for current user
        try {
          const res = await fetch('/api/ai/jobs/active');
          const data = await res.json();
          if (data.success && data.activeJobs && data.activeJobs.length > 0) {
            const latestJob = data.activeJobs[0];
            localStorage.setItem(LOCAL_STORAGE_JOB_KEY, latestJob.id);
            setActiveJob(latestJob);
            setIsModalOpen(true);
          }
        } catch (e) {
          console.warn('Error fetching active jobs on startup:', e);
        }
      }
    };

    restoreActiveJob();

    // Re-check on tab re-focus
    const handleFocus = () => {
      const savedJobId = localStorage.getItem(LOCAL_STORAGE_JOB_KEY);
      if (savedJobId) {
        fetchJobStatus(savedJobId);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchJobStatus]);

  // Polling loop while job is active
  useEffect(() => {
    if (!activeJob) return;

    const isActive = ['queued', 'preparing', 'generating', 'rendering', 'optimizing', 'saving'].includes(activeJob.stage);
    if (!isActive) return;

    const interval = setInterval(() => {
      fetchJobStatus(activeJob.id);
    }, 800);

    return () => clearInterval(interval);
  }, [activeJob, fetchJobStatus]);

  // Submit new job
  const submitAIJob = async (type: GlobalJobType, params: any, options?: SubmitJobOptions): Promise<GlobalAIJob> => {
    try {
      setIsModalOpen(true);
      if (options?.onSuccess) {
        setOnCompletedCallback(() => (job: GlobalAIJob) => {
          options.onSuccess!(job.result);
        });
      }

      const res = await fetch('/api/ai/jobs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, params })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || data.message || 'AI Job submission failed';
        if (options?.onError) {
          options.onError(errorMsg);
        }
        throw new Error(errorMsg);
      }

      const job: GlobalAIJob = data.job;
      setActiveJob(job);
      localStorage.setItem(LOCAL_STORAGE_JOB_KEY, job.id);
      return job;
    } catch (err: any) {
      if (!activeJob) {
        setIsModalOpen(false);
      }
      throw err;
    }
  };

  // Cancel running job
  const cancelAIJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/ai/jobs/${jobId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.job) {
        setActiveJob(data.job);
        localStorage.removeItem(LOCAL_STORAGE_JOB_KEY);
      }
    } catch (err) {
      console.error('Cancel job error:', err);
    }
  };

  // Retry job
  const retryAIJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/ai/jobs/${jobId}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.job) {
        const job: GlobalAIJob = data.job;
        setActiveJob(job);
        localStorage.setItem(LOCAL_STORAGE_JOB_KEY, job.id);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Retry job error:', err);
    }
  };

  const closeModal = () => setIsModalOpen(false);
  const openModal = () => setIsModalOpen(true);
  const setCompletedHandler = (handler: ((job: GlobalAIJob) => void) | null) => {
    setOnCompletedCallback(() => handler);
  };

  return (
    <GlobalJobContext.Provider
      value={{
        activeJob,
        isModalOpen,
        submitAIJob,
        cancelAIJob,
        retryAIJob,
        closeModal,
        openModal,
        setCompletedHandler
      }}
    >
      {children}
    </GlobalJobContext.Provider>
  );
};

export const useGlobalJob = () => {
  const context = useContext(GlobalJobContext);
  if (!context) {
    throw new Error('useGlobalJob must be used within a GlobalJobProvider');
  }
  return context;
};
