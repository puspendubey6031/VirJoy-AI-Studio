import { configStore, videoProjectsStore, designProjectsStore, userStatsStore } from './configStore';
import { supabaseServer } from './supabaseServer';

export interface CleanupStats {
  lastRunAt: string;
  totalPurgedCount: number;
  recentPurgedTitles: string[];
}

export const cleanupStats: CleanupStats = {
  lastRunAt: new Date().toISOString(),
  totalPurgedCount: 0,
  recentPurgedTitles: []
};

export async function purgeExpiredVideos(): Promise<{ purgedCount: number; purgedIds: string[] }> {
  const config = configStore.get();
  const retentionMs = (config.designStudioConfig?.historyRetentionHours || config.retention.retentionHours || 24) * 60 * 60 * 1000;
  const nowMs = Date.now();

  const purgedIds: string[] = [];
  const purgedTitles: string[] = [];

  for (const [id, project] of videoProjectsStore.entries()) {
    const createdMs = new Date(project.createdAt).getTime();
    const ageMs = nowMs - createdMs;

    // If age exceeds retention period or status is explicitly expired
    if (ageMs > retentionMs || project.status === 'expired') {
      videoProjectsStore.delete(id);
      purgedIds.push(id);
      purgedTitles.push(project.title);
    }
  }

  // Purge design projects store as well
  for (const [id, item] of designProjectsStore.entries()) {
    const createdMs = new Date(item.createdAt).getTime();
    const ageMs = nowMs - createdMs;
    const isExpiredByTime = item.expiresAt ? new Date(item.expiresAt).getTime() <= nowMs : false;

    if (ageMs > retentionMs || isExpiredByTime) {
      designProjectsStore.delete(id);
      purgedIds.push(id);
      purgedTitles.push(`Design Asset (${item.toolType}): ${item.prompt.substring(0, 20)}...`);
    }
  }

  // Purge userStatsStore.designHistory
  if (userStatsStore.designHistory && Array.isArray(userStatsStore.designHistory)) {
    userStatsStore.designHistory = userStatsStore.designHistory.filter(item => {
      const createdMs = new Date(item.createdAt).getTime();
      const isExpiredByTime = item.expiresAt ? new Date(item.expiresAt).getTime() <= nowMs : false;
      return (nowMs - createdMs <= retentionMs) && !isExpiredByTime;
    });
  }

  // Purge expired records from Supabase database tables if configured
  if (supabaseServer) {
    try {
      const cutoffIso = new Date(nowMs - retentionMs).toISOString();
      await supabaseServer.from('video_jobs').delete().lt('created_at', cutoffIso);
      await supabaseServer.from('design_projects').delete().lt('created_at', cutoffIso);
      await supabaseServer.from('ai_history').delete().lt('created_at', cutoffIso);
    } catch (dbErr: any) {
      console.warn('[Retention Cleanup] Supabase database purge note:', dbErr?.message);
    }
  }

  cleanupStats.lastRunAt = new Date().toISOString();
  cleanupStats.totalPurgedCount += purgedIds.length;
  cleanupStats.recentPurgedTitles = [...purgedTitles, ...cleanupStats.recentPurgedTitles].slice(0, 10);

  if (purgedIds.length > 0) {
    console.log(`[Retention Cleanup Worker] Purged ${purgedIds.length} video & design asset(s) older than ${config.retention.retentionHours} hours.`);
  }

  return { purgedCount: purgedIds.length, purgedIds };
}

let cleanupIntervalTimer: NodeJS.Timeout | null = null;

export function startCleanupWorker(): void {
  if (cleanupIntervalTimer) {
    clearInterval(cleanupIntervalTimer);
  }

  const config = configStore.get();
  const intervalMinutes = config.retention.autoCleanupIntervalMinutes || 15;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[Retention Worker] Started periodic cleanup worker every ${intervalMinutes} mins. Retention threshold: ${config.retention.retentionHours}h.`);

  cleanupIntervalTimer = setInterval(() => {
    purgeExpiredVideos();
  }, intervalMs);
}
