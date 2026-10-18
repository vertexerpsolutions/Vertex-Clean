import React, { useState } from 'react';
import { RefreshCw, ArrowRightLeft, AlertTriangle, CheckCircle2, Play, Plus, Clock } from 'lucide-react';
import { hybridService } from '../../../services/hybridService';
import { SyncConflictPolicy } from '../../../core/hybrid/HybridTypes';

export const SynchronizationView: React.FC = () => {
  const [queue, setQueue] = useState(() => hybridService.getSyncQueue());
  const [policy, setPolicy] = useState<SyncConflictPolicy>(() => hybridService.getConflictPolicy());
  const networkState = hybridService.getNetworkState();

  const handleProcessSync = () => {
    const updated = hybridService.processSyncQueue();
    setQueue([...updated]);
  };

  const handlePolicyChange = (newPolicy: SyncConflictPolicy) => {
    hybridService.setConflictPolicy(newPolicy);
    setPolicy(newPolicy);
  };

  const handleAddDemoItem = () => {
    hybridService.createSyncItem(
      'INSERT',
      'SalesOrder_MOD01',
      { orderNo: `SO-HYB-${Math.floor(1000 + Math.random() * 9000)}`, total: 8500.00 }
    );
    setQueue([...hybridService.getSyncQueue()]);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 03: Incremental Synchronization Engine</h2>
              <p className="text-xs text-slate-400">Background Sync, Conflict Resolution, Queue Management & Retries</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddDemoItem}
            className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enqueue Transaction</span>
          </button>
          <button
            onClick={handleProcessSync}
            disabled={networkState === 'disconnected'}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 transition-all ${
              networkState === 'disconnected'
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Process Sync Queue</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['timestamp_merge', 'cloud_wins', 'local_wins', 'manual_review'] as SyncConflictPolicy[]).map((pol) => (
          <button
            key={pol}
            onClick={() => handlePolicyChange(pol)}
            className={`p-4 rounded-xl border text-left transition-all ${
              policy === pol
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-500 uppercase">Conflict Policy</div>
            <div className="text-xs font-bold capitalize font-mono mt-1">{pol.replace('_', ' ')}</div>
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Sync Queue ({queue.length} items)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase">
                <th className="p-3">ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Operation</th>
                <th className="p-3">Status</th>
                <th className="p-3">Attempts</th>
                <th className="p-3">Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-slate-100">{item.id}</td>
                  <td className="p-3 text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</td>
                  <td className="p-3 text-purple-400">{item.entityName}</td>
                  <td className="p-3 font-bold text-slate-200">{item.operation}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'synced'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">{item.attempts}</td>
                  <td className="p-3 text-slate-500 truncate max-w-[120px]">{item.checksum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
