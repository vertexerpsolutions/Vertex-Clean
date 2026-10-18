import React, { useState } from 'react';
import { Cpu, Zap, Activity, Sliders, ArrowUpRight, RefreshCw } from 'lucide-react';
import { cloudService } from '../../../services/cloudService';
import { ScalabilityMetrics } from '../../../core/cloud/CloudTypes';

export const ScalabilityView: React.FC = () => {
  const [metrics, setMetrics] = useState<ScalabilityMetrics>(cloudService.getScalabilityMetrics());
  const [targetInstances, setTargetInstances] = useState(metrics.activeContainerInstances);

  const handleScaleChange = (val: number) => {
    setTargetInstances(val);
    const updated = cloudService.triggerAutoScaling(val);
    setMetrics({ ...updated });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 04: Elastic Scalability Engine</h2>
            <p className="text-xs text-slate-400">Stateless Container Scaling, Global Load Balancing & Distributed Session Cache</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Throughput RPS</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{metrics.currentRps.toLocaleString()} RPS</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">CPU Utilization</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{metrics.cpuUtilizationPct}%</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Memory Utilization</div>
            <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">{metrics.memoryUtilizationPct}%</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Active Container Nodes</div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{metrics.activeContainerInstances} / {metrics.maxInstances}</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Manual Auto-Scale Simulator</h3>
        
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">Set Container Replicas (Min: {metrics.minInstances}, Max: {metrics.maxInstances}):</span>
            <span className="text-sm font-mono font-bold text-cyan-400">{targetInstances} Instances</span>
          </div>

          <input
            type="range"
            min={metrics.minInstances}
            max={metrics.maxInstances}
            value={targetInstances}
            onChange={e => handleScaleChange(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>4 Replicas (Baseline Load)</span>
            <span>25 Replicas (Peak Spike)</span>
            <span>50 Replicas (Black Friday / Quarter End)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
