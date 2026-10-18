import React from 'react';
import { HardDrive, Database, ShieldCheck, FileText, Cpu, Trash2 } from 'lucide-react';
import { desktopService } from '../../../services/desktopService';

export const LocalStorageView: React.FC = () => {
  const quota = desktopService.getLocalStorageQuota();

  const storageItems = [
    { name: 'Local ERP Config (JSON/WAL)', sizeKb: quota.configSizeKb, path: 'C:\\ProgramData\\VertexERP\\config.json', status: 'Encrypted' },
    { name: 'User Profile Settings', sizeKb: quota.userSettingsSizeKb, path: 'C:\\Users\\Current\\AppData\\Local\\Vertex\\settings.dat', status: 'Encrypted' },
    { name: 'Audit & Diagnostic Logs', sizeKb: quota.logsSizeKb, path: 'C:\\ProgramData\\VertexERP\\logs\\app.log', status: 'Active Stream' },
    { name: 'Temporary Render Files', sizeKb: quota.tempFilesSizeKb, path: 'C:\\ProgramData\\VertexERP\\temp\\', status: 'Auto-Purging' },
    { name: 'IndexDB Resource Cache', sizeKb: quota.cacheSizeKb, path: 'IndexedDB (Local Vault Cache)', status: 'Warm' },
    { name: 'Offline Ledger Datastore', sizeKb: quota.offlineDataSizeKb, path: 'C:\\ProgramData\\VertexERP\\db\\offline_ledger.db', status: 'AES-256 WAL' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 03: Local Storage Architecture</h2>
            <p className="text-xs text-slate-400">Isolated Workstation Directory Partitioning, DPAPI Vault & Local Cache</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Allocated Workstation Vault Disk Space</div>
            <div className="text-xl font-bold text-purple-400 font-mono mt-1">{quota.totalAllocatedMb} MB Total Allocated</div>
          </div>
          <span className="px-3 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono text-xs font-bold">
            HEALTHY DISK SPACE
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono mb-4">Partition Breakdown</h3>
        <div className="space-y-3">
          {storageItems.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200 font-mono">{item.name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.path}</div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs font-mono font-bold text-slate-300">
                  {(item.sizeKb / 1024).toFixed(2)} MB ({item.sizeKb} KB)
                </span>
                <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-slate-800 text-purple-300 border border-slate-700">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
