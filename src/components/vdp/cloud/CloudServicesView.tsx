import React from 'react';
import { Server, Database, Activity, Cpu, Layers, HardDrive, CheckCircle2 } from 'lucide-react';
import { cloudService } from '../../../services/cloudService';

export const CloudServicesView: React.FC = () => {
  const services = cloudService.getCloudServices();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 03: Cloud Services & Micro-Infrastructure</h2>
            <p className="text-xs text-slate-400">Managed Object Storage, Distributed Cache, Async Queue Workers & Structured Logging</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {services.map((svc, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200 font-mono flex items-center space-x-2">
                  <span>{svc.serviceName}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400">
                    {svc.clusterRegion}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Container Nodes: {svc.healthyCount} / {svc.instancesCount} Active | Latency p99: {svc.p99LatencyMs} ms
                </div>
              </div>

              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{svc.status.toUpperCase()}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
