import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, Server, Activity } from 'lucide-react';
import { cloudService } from '../../../services/cloudService';
import { FailoverNodeStatus } from '../../../core/cloud/CloudTypes';

export const HighAvailabilityView: React.FC = () => {
  const [nodes, setNodes] = useState<FailoverNodeStatus[]>(cloudService.getFailoverNodes());
  const [isFailingOver, setIsFailingOver] = useState(false);

  const handleSimulateFailover = () => {
    setIsFailingOver(true);
    setTimeout(() => {
      const updated = cloudService.triggerSimulatedFailover();
      setNodes([...updated]);
      setIsFailingOver(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 05: High Availability & Failover Engine</h2>
              <p className="text-xs text-slate-400">Multi-AZ PostgreSQL Replication, Active Health Check Probes & Automatic Recovery</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSimulateFailover}
          disabled={isFailingOver}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-mono text-xs font-bold transition-all shadow-lg shadow-amber-500/20 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isFailingOver ? 'animate-spin' : ''}`} />
          <span>{isFailingOver ? 'Failing over...' : 'Simulate Zone A Outage & Promote Standby'}</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Multi-AZ DB Topology & Replication Health</h3>
        
        <div className="space-y-3">
          {nodes.map(n => (
            <div key={n.nodeId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200 font-mono flex items-center space-x-2">
                  <span>{n.nodeId}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400">
                    Zone: {n.zone}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Replication Lag: {n.replicationLagMs} ms | State: {n.health}
                </div>
              </div>

              <span className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-mono text-xs font-bold shrink-0 ${
                n.role === 'Primary Master'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{n.role.toUpperCase()}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
