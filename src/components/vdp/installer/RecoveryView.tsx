import React, { useState } from 'react';
import { RotateCcw, ShieldAlert, CheckCircle2, Play, Plus, Clock } from 'lucide-react';
import { installerService } from '../../../services/installerService';
import { RecoverySnapshot } from '../../../core/installer/InstallerTypes';

export const RecoveryView: React.FC = () => {
  const [snapshots, setSnapshots] = useState<RecoverySnapshot[]>(() => installerService.getRecoverySnapshots());
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleCreateSnapshot = () => {
    installerService.createRecoverySnapshot('Manual User On-Demand Snapshot');
    setSnapshots([...installerService.getRecoverySnapshots()]);
  };

  const handleRestore = (id: string) => {
    setRestoringId(id);
    setTimeout(() => {
      const updated = installerService.restoreSnapshot(id);
      setSnapshots([...updated]);
      setRestoringId(null);
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Disaster Recovery & Repair System</h2>
            <p className="text-xs text-slate-400">System Configuration Rollback, In-Place Repair & Atomic State Restoration</p>
          </div>
        </div>

        <button
          onClick={handleCreateSnapshot}
          className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-lg shadow-rose-500/20 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Recovery Snapshot</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Available Recovery Snapshots ({snapshots.length})</h3>
        <div className="space-y-3">
          {snapshots.map((s) => (
            <div key={s.snapshotId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{s.snapshotId}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 uppercase">
                    {s.version}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                      s.status === 'restored'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">{s.reason}</div>
                <div className="text-slate-500 text-[10px]">
                  Created: {new Date(s.timestamp).toLocaleString()} | Size: {s.configBackupSizeKb} KB
                </div>
              </div>

              <button
                onClick={() => handleRestore(s.snapshotId)}
                disabled={restoringId === s.snapshotId}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-500 hover:text-slate-950 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
              >
                {restoringId === s.snapshotId ? 'Restoring System State...' : 'Restore State'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
