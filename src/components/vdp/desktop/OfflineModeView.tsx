import React, { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { desktopService } from '../../../services/desktopService';
import { OfflineSyncQueueItem } from '../../../core/desktop/DesktopTypes';

export const OfflineModeView: React.FC = () => {
  const [queue, setQueue] = useState<OfflineSyncQueueItem[]>(desktopService.getSyncQueue());
  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updated = desktopService.processSyncQueue();
      setQueue([...updated]);
      setIsSyncing(false);
    }, 600);
  };

  const handleAddDemoTx = () => {
    desktopService.addSyncItem(
      'CREATE_TRANSACTION',
      'AccountsPayable_VGF04',
      { vendor: 'Global Logistics Corp', amount: 8420.00, timestamp: new Date().toISOString() }
    );
    setQueue([...desktopService.getSyncQueue()]);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <WifiOff className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 04: Offline Mode & Synchronization Engine</h2>
              <p className="text-xs text-slate-400">Offline Authentication, Local Journal Queue & Auto-Sync Reconciliation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleAddDemoTx}
            className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-xs font-mono font-bold transition-all"
          >
            + Create Offline Ledger Entry
          </button>
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-mono text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Force Queue Sync'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono flex items-center justify-between">
          <span>Offline Pending Transaction Sync Queue</span>
          <span className="text-xs text-amber-400 font-mono">
            {queue.filter(q => q.status === 'pending').length} Items Pending
          </span>
        </h3>

        <div className="space-y-3">
          {queue.map(item => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold font-mono text-slate-200">{item.actionType}</span>
                  <span className="text-xs font-mono text-amber-400">[{item.entityName}]</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  ID: {item.id} | Timestamp: {new Date(item.timestamp).toLocaleTimeString()} | Payload: {JSON.stringify(item.payload)}
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {item.status === 'synced' ? (
                  <span className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SYNCED</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>PENDING ({item.attempts} retries)</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
