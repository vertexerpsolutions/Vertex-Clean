import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, Clock, Activity, AlertTriangle } from 'lucide-react';
import { backupService } from '../../../services/backupService';
import { BackupValidationReport } from '../../../core/backup/BackupTypes';

export const BackupValidationView: React.FC = () => {
  const [report, setReport] = useState<BackupValidationReport>(() => backupService.runValidationSuite());

  const handleRunValidation = () => {
    setReport(backupService.runValidationSuite());
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 07: Backup & Recovery Validation Suite</h2>
              <p className="text-xs text-slate-400">Integrity Checks, Restore Verification, RTO/RPO Benchmarking & Disaster Readiness Score</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunValidation}
          className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Backup Test Suite</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Backup Integrity</div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1">{report.backupIntegrityScore}%</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Measured RTO</div>
          <div className="text-xl font-extrabold text-cyan-400 mt-1">{report.measuredRTOSeconds} Seconds</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Measured RPO</div>
          <div className="text-xl font-extrabold text-purple-400 mt-1">{report.measuredRPOSeconds} Seconds (Zero Data Loss)</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Overall Readiness</div>
          <div className="text-xs font-extrabold text-emerald-400 mt-2.5 uppercase">{report.overallReadiness}</div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Validation Suite Checks</h3>
        <div className="space-y-3">
          {report.checkItems.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-100">{item.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 uppercase">
                    {item.category}
                  </span>
                </div>
                <p className="text-slate-400 text-xs pl-6">{item.details}</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
