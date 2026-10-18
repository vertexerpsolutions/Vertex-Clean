import React, { useState } from 'react';
import { History, RotateCcw, CheckCircle2, ShieldCheck, Calendar, HardDrive } from 'lucide-react';
import { updateService } from '../../../services/updateService';
import { VersionHistoryEntry } from '../../../core/update/UpdateTypes';

export const VersionManagementView: React.FC = () => {
  const [history, setHistory] = useState<VersionHistoryEntry[]>(() => updateService.getVersionHistory());
  const [rollingBackVersion, setRollingBackVersion] = useState<string | null>(null);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  const handleRollback = (ver: string) => {
    setRollingBackVersion(ver);
    setRollbackSuccess(null);
    setTimeout(() => {
      updateService.rollbackToVersion(ver);
      setHistory([...updateService.getVersionHistory()]);
      setRollingBackVersion(null);
      setRollbackSuccess(ver);
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 05: Version Management & Rollback Engine</h2>
            <p className="text-xs text-slate-400">Audit trail of installed builds, baseline recovery snapshots, and zero-downtime version rollback</p>
          </div>
        </div>

        {rollbackSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-2 font-mono text-xs mt-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Successfully rolled back to Version v{rollbackSuccess}! Active build updated.</span>
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Installed Version Stack ({history.length} Builds)</h3>

        <div className="space-y-3">
          {history.map((entry) => {
            const isActive = entry.status === 'active';
            return (
              <div
                key={entry.version}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-slate-950 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-xl'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-extrabold text-slate-100">Vertex ERP Ultimate v{entry.version}</span>
                      <span className="text-xs text-slate-400">(Build #{entry.buildNumber})</span>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {entry.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                        {entry.channel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400 text-[11px] mt-2">
                      <div>Installed At: <span className="text-slate-200">{new Date(entry.installedAt).toLocaleString()}</span></div>
                      <div>Operator: <span className="text-slate-200">{entry.installedBy}</span></div>
                      <div>Type: <span className="text-cyan-400 font-bold uppercase">{entry.releaseType}</span></div>
                      <div>Backup Snapshot: <span className="text-slate-200">{entry.backupSnapshotId}</span></div>
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      onClick={() => handleRollback(entry.version)}
                      disabled={rollingBackVersion === entry.version}
                      className="px-4 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50 shrink-0"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${rollingBackVersion === entry.version ? 'animate-spin' : ''}`} />
                      <span>{rollingBackVersion === entry.version ? 'Rolling Back...' : 'Rollback To This Build'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
