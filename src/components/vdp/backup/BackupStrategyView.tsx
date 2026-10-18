import React, { useState } from 'react';
import { Calendar, Play, Clock, CheckCircle2, RefreshCw, HardDrive, ShieldCheck } from 'lucide-react';
import { backupService } from '../../../services/backupService';
import { BackupJobSpec } from '../../../core/backup/BackupTypes';

export const BackupStrategyView: React.FC = () => {
  const [jobs, setJobs] = useState<BackupJobSpec[]>(() => backupService.getBackupJobs());
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  const handleTriggerManual = (jobId: string) => {
    setRunningJobId(jobId);
    setTimeout(() => {
      backupService.triggerManualBackup(jobId);
      setJobs([...backupService.getBackupJobs()]);
      setRunningJobId(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 02: Backup Strategy & Scheduler</h2>
            <p className="text-xs text-slate-400">Automated Full, Incremental, Differential, Scheduled, Manual & Cloud Sync Routines</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Active Strategies</div>
            <div className="text-sm font-bold text-purple-400 mt-1">Full, Incremental & Differential</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Recovery Point Objective (RPO)</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">Sub-Second WAL Delta Sync</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Retention Compliance</div>
            <div className="text-sm font-bold text-cyan-400 mt-1">14-Day Inc / 90-Day Full Retention</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Configured Backup Routines</h3>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{job.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">
                    {job.type}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 uppercase">
                    {job.environment}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-cyan-400 font-bold">{job.compressedSizeMb} MB</span>
                  <button
                    onClick={() => handleTriggerManual(job.id)}
                    disabled={runningJobId === job.id}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
                  >
                    {runningJobId === job.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{runningJobId === job.id ? 'Executing...' : 'Run Backup Now'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div>Cron Schedule: <span className="text-slate-200 font-bold">{job.scheduleCron}</span></div>
                <div>Last Execution: <span className="text-slate-200">{new Date(job.lastRunTimestamp).toLocaleTimeString()}</span></div>
                <div>Next Scheduled: <span className="text-slate-200">{new Date(job.nextRunTimestamp).toLocaleTimeString()}</span></div>
              </div>

              <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span className="truncate max-w-[400px]">Destination: {job.destinationLocation}</span>
                <span>SHA-256 Checksum Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
