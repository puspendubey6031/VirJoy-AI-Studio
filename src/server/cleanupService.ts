import { configStore, videoProjectsStore } from './configStore';

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

export function purgeExpiredVideos(): { purgedCount: number; purgedIds: string[] } {
  const config = configStore.get();
  const retentionMs = (config.retention.retentionHours || 24) * 60 * 60 * 1000;
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

  cleanupStats.lastRunAt = new Date().toISOString();
  cleanupStats.totalPurgedCount += purgedIds.length;
  cleanupStats.recentPurgedTitles = [...purgedTitles, ...cleanupStats.recentPurgedTitles].slice(0, 10);

  if (purgedIds.length > 0) {
    console.log(`[Retention Cleanup Worker] Purged ${purgedIds.length} video project(s) older than ${config.retention.retentionHours} hours.`);
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
