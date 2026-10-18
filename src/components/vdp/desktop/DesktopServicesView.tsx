import React, { useState } from 'react';
import { Printer, FileSpreadsheet, FileText, FolderDown, Copy, CheckCircle2 } from 'lucide-react';
import { desktopService } from '../../../services/desktopService';
import { HardwarePrintJob } from '../../../core/desktop/DesktopTypes';

export const DesktopServicesView: React.FC = () => {
  const [printJobs, setPrintJobs] = useState<HardwarePrintJob[]>(desktopService.getPrintJobs());
  const [backupLog, setBackupLog] = useState<{ backupPath: string; bytesWritten: number; timestamp: string } | null>(null);
  const [copiedStatus, setCopiedStatus] = useState(false);

  const handleTriggerPrint = () => {
    const newJob = desktopService.triggerPrintJob(
      'Vertex_ERP_Sales_Journal_Q2.pdf',
      'HP LaserJet Enterprise M608 (Local USB)',
      8
    );
    setPrintJobs([...desktopService.getPrintJobs()]);
  };

  const handleLocalBackup = () => {
    const result = desktopService.exportLocalBackup();
    setBackupLog(result);
  };

  const handleCopyGrid = () => {
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 05: Hardware Integration Services</h2>
            <p className="text-xs text-slate-400">Raw Spooler Printing, Native PDF/Excel Direct Export & Local Encrypted Backup</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={handleTriggerPrint}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all"
          >
            <Printer className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-xs font-bold text-slate-200">Trigger Hardware Print Spooler</div>
            <div className="text-[10px] text-slate-500 mt-1">Send vector stream to local printer</div>
          </button>

          <button
            onClick={handleLocalBackup}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition-all"
          >
            <FolderDown className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="text-xs font-bold text-slate-200">Export Local Vault Backup</div>
            <div className="text-[10px] text-slate-500 mt-1">Create encrypted .BAK archive</div>
          </button>

          <button
            onClick={handleCopyGrid}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition-all"
          >
            <Copy className="w-5 h-5 text-indigo-400 mb-2" />
            <div className="text-xs font-bold text-slate-200">
              {copiedStatus ? 'Copied to Windows Clipboard!' : 'Copy Grid to Clipboard'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">TSV format for Excel / Word</div>
          </button>
        </div>

        {backupLog && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-300 font-mono">BACKUP COMPLETED</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{backupLog.backupPath}</div>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-200">
              {(backupLog.bytesWritten / (1024 * 1024)).toFixed(1)} MB Written
            </div>
          </div>
        )}
      </div>

      {/* Spooler Print Queue */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Native WinSpool Hardware Queue</h3>

        <div className="space-y-3">
          {printJobs.map(job => (
            <div key={job.jobId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200 font-mono">{job.documentTitle}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Job ID: {job.jobId} | Printer: {job.printerName} | {job.pages} Pages
                </div>
              </div>

              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{job.status.toUpperCase()}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
