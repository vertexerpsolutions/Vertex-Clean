import React, { useState } from 'react';
import { RefreshCw, Cloud, Database, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { portableService } from '../../../services/portableService';
import { PortableSyncLog } from '../../../core/portable/PortableTypes';

export const PortableSyncView: React.FC = () => {
  const [syncLogs, setSyncLogs] = useState<PortableSyncLog[]>(() => portableService.getSyncLogs());
  const [syncing, setSyncing] = useState(false);

  const handleTriggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      portableService.triggerSync();
      setSyncLogs([...portableService.getSyncLogs()]);
      setSyncing(false);
    }, 900);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 04: Local-First Synchronization Engine</h2>
            <p className="text-xs text-slate-400">Offline Ledger Queueing, Incremental Delta Sync with Central Cloud ERP & Conflict Resolution</p>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs mt-6">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Sync Mode</span>
            <span className="text-sm font-bold text-cyan-400">Local-First Ledger with HTTPS Cloud Gateway</span>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            className="px-5 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing Delta...' : 'Trigger Local-to-Cloud Delta Sync'}</span>
          </button>
        </div>
      </div>

      {/* Sync Logs Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Sync Audit History ({syncLogs.length})</h3>

        <div className="space-y-3">
          {syncLogs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{log.id}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center space-x-1">
                    {log.direction === 'LOCAL_TO_CLOUD' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                    <span>{log.direction}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {log.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Endpoint: {log.targetCloudEndpoint} | Delta Records: {log.changedRecordsCount}</p>
              </div>

              <div className="text-right text-[10px] text-slate-500">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
