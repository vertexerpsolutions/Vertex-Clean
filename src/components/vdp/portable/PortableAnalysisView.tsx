import React from 'react';
import { Activity, Cpu, HardDrive, Zap, BarChart3 } from 'lucide-react';

export const PortableAnalysisView: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Hardware Performance & I/O Telemetry Analysis</h2>
            <p className="text-xs text-slate-400">USB 3.2 Bus Bandwidth, SQLite Read/Write IOPS & Flash Wear Leveling Analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Read Speed</div>
            <div className="text-xl font-bold text-emerald-400">420 MB/s</div>
            <div className="text-[10px] text-slate-400">USB 3.2 Gen 2 Peak Burst</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Write Speed</div>
            <div className="text-xl font-bold text-cyan-400">380 MB/s</div>
            <div className="text-[10px] text-slate-400">SQLite WAL Continuous Write</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Flash Wear Health</div>
            <div className="text-xl font-bold text-amber-400">98% Remaining</div>
            <div className="text-[10px] text-slate-400">3D NAND Endurance SLA</div>
          </div>
        </div>
      </div>
    </div>
  );
};
