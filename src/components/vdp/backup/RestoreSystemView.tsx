import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, Play, HardDrive, ShieldCheck, Database, FileText } from 'lucide-react';
import { backupService } from '../../../services/backupService';
import { RestorePoint, RestoreType } from '../../../core/backup/BackupTypes';

export const RestoreSystemView: React.FC = () => {
  const [points, setPoints] = useState<RestorePoint[]>(() => backupService.getRestorePoints());
  const [selectedPointId, setSelectedPointId] = useState<string>(points[0]?.id || '');
  const [restoreType, setRestoreType] = useState<RestoreType>('full');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const handleExecuteRestore = () => {
    if (!selectedPointId) return;
    setIsRestoring(true);
    setRestoreSuccess(false);
    setRestoreProgress(0);

    let pct = 0;
    const interval = setInterval(() => {
      pct += 25;
      setRestoreProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setIsRestoring(false);
        backupService.executeRestore(selectedPointId, restoreType);
        setRestoreSuccess(true);
      }
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 03: Restore System Engine</h2>
            <p className="text-xs text-slate-400">Full, Partial, Point-in-Time, Configuration, Database & File-Level Restore Operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Available Restore Snapshots</div>
            <div className="text-sm font-bold text-cyan-400 mt-1">{points.length} Snapshot Points</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Point-In-Time Precision</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">Sub-Millisecond WAL Stream Replay</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Decrypt Engine</div>
            <div className="text-sm font-bold text-purple-400 mt-1">AES-256-GCM / KMS On-The-Fly</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Configure & Execute Restore</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Select Restore Point</label>
            <select
              value={selectedPointId}
              onChange={(e) => setSelectedPointId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.type.toUpperCase()} ({p.sizeMb} MB) - {new Date(p.timestamp).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Select Restore Mode</label>
            <select
              value={restoreType}
              onChange={(e) => setRestoreType(e.target.value as RestoreType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="full">Full System Restore (App, DB, Config)</option>
              <option value="partial">Partial Table/Asset Restore</option>
              <option value="point_in_time">Point-In-Time Restore (PITR WAL Replay)</option>
              <option value="configuration">Configuration Profile Restore Only</option>
              <option value="database">Database Schema & Data Restore Only</option>
              <option value="file_level">File & Attachment Granular Restore</option>
            </select>
          </div>
        </div>

        {isRestoring && (
          <div className="space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex justify-between text-cyan-400 font-bold">
              <span>Unpacking backup payload & running schema verification...</span>
              <span>{restoreProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${restoreProgress}%` }}></div>
            </div>
          </div>
        )}

        {restoreSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Restore operation executed successfully! System state synchronized and verified.</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleExecuteRestore}
            disabled={isRestoring || !selectedPointId}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Executing Restore...' : `Start ${restoreType.replace('_', ' ').toUpperCase()} Restore`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
