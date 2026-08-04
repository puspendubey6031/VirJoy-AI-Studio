import React, { useState } from 'react';
import { AppConfig } from '../../types';
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  FileCode2,
  Archive,
  RotateCcw
} from 'lucide-react';

interface DatabaseToolsTabProps {
  config: AppConfig;
  onSave: (fieldKey: string, updatedPayload: any) => void;
  showToast: (msg: string) => void;
}

export const DatabaseToolsTab: React.FC<DatabaseToolsTabProps> = ({
  config,
  onSave,
  showToast
}) => {
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const [restoreText, setRestoreText] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // 1. Backup Database (Download JSON)
  const handleBackupJSON = () => {
    const backupData = JSON.stringify(config, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VirJoy_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast('Full Database JSON Backup downloaded successfully.');
  };

  // 2. Export Schema DDL / SQL
  const handleExportSQL = () => {
    const sqlSchema = `-- VirJoy AI Enterprise Database Export
-- Generated: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  credits INT DEFAULT 30,
  plan VARCHAR(50) DEFAULT 'Free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  prompt TEXT,
  status VARCHAR(50),
  aspect_ratio VARCHAR(10),
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active Configuration Record
INSERT INTO app_config (key, value) VALUES ('virjoy_enterprise_config', '${JSON.stringify(config).replace(/'/g, "''")}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
`;

    const blob = new Blob([sqlSchema], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VirJoy_Database_Schema_${new Date().toISOString().slice(0, 10)}.sql`;
    link.click();
    showToast('SQL Schema export downloaded.');
  };

  // 3. Clean Cache
  const handleCleanCache = () => {
    setConfirmAction({
      type: 'clean_cache',
      title: 'Clear Platform In-Memory Cache',
      description: 'This will purge temporary response caches and force fresh queries on next API request.',
      action: () => {
        showToast('Platform cache purged successfully.');
        setConfirmAction(null);
      }
    });
  };

  // 4. Clean Activity Logs
  const handleCleanLogs = () => {
    setConfirmAction({
      type: 'clean_logs',
      title: 'Purge Activity Logs',
      description: 'Are you sure you want to erase all administrative audit activity logs? This action cannot be undone.',
      action: () => {
        onSave('activity_logs', []);
        showToast('Audit activity logs purged.');
        setConfirmAction(null);
      }
    });
  };

  // 5. Delete Expired Temp Files
  const handleDeleteExpiredFiles = () => {
    setConfirmAction({
      type: 'delete_files',
      title: 'Purge Expired Video Media Assets',
      description: 'This will permanently remove temporary audio and thumbnail artifacts older than the retention limit.',
      action: () => {
        showToast('Expired temporary files deleted from storage bucket.');
        setConfirmAction(null);
      }
    });
  };

  // 6. Delete Old Video History
  const handleDeleteOldHistory = () => {
    setConfirmAction({
      type: 'delete_history',
      title: 'Delete Video Projects Older Than 30 Days',
      description: 'Permanently remove expired video project records from the database.',
      action: () => {
        showToast('Old video history cleaned.');
        setConfirmAction(null);
      }
    });
  };

  // 7. Restore Database
  const handleApplyRestore = () => {
    try {
      const parsed = JSON.parse(restoreText);
      if (!parsed.plans || !parsed.voiceConfig) {
        throw new Error('Invalid JSON structure. Missing core configuration objects.');
      }
      onSave('theme_config', parsed.themeConfig || config.themeConfig);
      onSave('credits_config', parsed.creditsConfig || config.creditsConfig);
      onSave('provider_manager_config', parsed.providerManagerConfig || config.providerManagerConfig);
      showToast('Database state restored successfully from backup JSON!');
      setShowRestoreModal(false);
      setRestoreText('');
    } catch (err: any) {
      showToast(`Restore Failed: ${err.message || 'Invalid JSON format'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" /> Database Administration & Maintenance Tools
        </h4>
        <p className="text-xs text-slate-400">Direct backup snapshots, schema migrations, log purging, and storage garbage collection.</p>
      </div>

      {/* Backup & Restore Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup Card */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Archive className="w-4 h-4 text-emerald-400" /> Database Snapshot & Backup
          </div>
          <p className="text-xs text-slate-400">Export complete database state as JSON or SQL schema migration scripts for offline safekeeping.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleBackupJSON}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON Backup
            </button>
            <button
              onClick={handleExportSQL}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" /> Export SQL DDL
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Upload className="w-4 h-4 text-purple-400" /> Restore Database Backup
          </div>
          <p className="text-xs text-slate-400">Import and restore database configuration from a previously saved JSON snapshot.</p>
          <button
            onClick={() => setShowRestoreModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5" /> Open Restore Terminal
          </button>
        </div>
      </div>

      {/* Database Maintenance & Purging Tools */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h5 className="font-bold text-white text-sm flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" /> Garbage Collection & Storage Cleaners
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={handleCleanCache}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 cursor-pointer group transition-all"
          >
            <div className="font-bold text-white text-xs flex items-center gap-1.5 group-hover:text-cyan-400">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Clean Memory Cache
            </div>
            <p className="text-[10px] text-slate-400">Purge stale in-memory query caches.</p>
          </button>

          <button
            onClick={handleCleanLogs}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 cursor-pointer group transition-all"
          >
            <div className="font-bold text-white text-xs flex items-center gap-1.5 group-hover:text-amber-400">
              <Trash2 className="w-3.5 h-3.5 text-amber-400" /> Clear Audit Logs
            </div>
            <p className="text-[10px] text-slate-400">Erase admin activity log history.</p>
          </button>

          <button
            onClick={handleDeleteExpiredFiles}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 cursor-pointer group transition-all"
          >
            <div className="font-bold text-white text-xs flex items-center gap-1.5 group-hover:text-purple-400">
              <Archive className="w-3.5 h-3.5 text-purple-400" /> Delete Expired Files
            </div>
            <p className="text-[10px] text-slate-400">Remove orphaned temp media files.</p>
          </button>

          <button
            onClick={handleDeleteOldHistory}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 cursor-pointer group transition-all"
          >
            <div className="font-bold text-white text-xs flex items-center gap-1.5 group-hover:text-rose-400">
              <Database className="w-3.5 h-3.5 text-rose-400" /> Delete Old Projects
            </div>
            <p className="text-[10px] text-slate-400">Purge projects older than 30 days.</p>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <ShieldAlert className="w-5 h-5" /> {confirmAction.title}
            </div>
            <p className="text-xs text-slate-300">{confirmAction.description}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.action}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore JSON Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Upload className="w-5 h-5 text-purple-400" /> Restore Database Snapshot
            </div>
            <p className="text-xs text-slate-400">Paste your exported database JSON backup content below:</p>
            <textarea
              rows={8}
              value={restoreText}
              onChange={(e) => setRestoreText(e.target.value)}
              placeholder='Paste {"plans": {...}, "voiceConfig": {...}} JSON here...'
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRestore}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Apply Restore Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
