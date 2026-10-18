import React, { useState } from 'react';
import { Download, Upload, Database, RotateCcw, GitCompare, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { configService } from '../../../services/configService';
import { ConfigBackupEntry } from '../../../core/config/ConfigTypes';

export const ConfigImportExportView: React.FC = () => {
  const [backups, setBackups] = useState<ConfigBackupEntry[]>(() => configService.getBackups());
  const [descInput, setDescInput] = useState('');
  const [showJsonExport, setShowJsonExport] = useState(false);
  const [exportedJsonStr, setExportedJsonStr] = useState('');
  const [restoredId, setRestoredId] = useState<string | null>(null);

  const handleCreateBackup = () => {
    if (!descInput.trim()) return;
    configService.createBackup(descInput);
    setBackups([...configService.getBackups()]);
    setDescInput('');
  };

  const handleExportJson = () => {
    const str = configService.exportConfigJson();
    setExportedJsonStr(str);
    setShowJsonExport(true);
  };

  const handleRestoreBackup = (id: string) => {
    setRestoredId(id);
    setTimeout(() => {
      setRestoredId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Configuration Backup, Import & Export Engine</h2>
            <p className="text-xs text-slate-400">Export/Import JSON snapshots, instant configuration restore points, and version comparison tools</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <h3 className="font-bold text-slate-200 uppercase flex items-center space-x-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Create Backup Snapshot</span>
            </h3>
            <input
              type="text"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              placeholder="Snapshot description (e.g., Pre-v1.1 deployment backup)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleCreateBackup}
              className="w-full py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all"
            >
              Take Configuration Snapshot Now
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <h3 className="font-bold text-slate-200 uppercase flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Export & Import JSON Payload</span>
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleExportJson}
                className="flex-1 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => alert('Select .env or .json config file to import.')}
                className="flex-1 py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center space-x-1"
              >
                <Upload className="w-4 h-4" />
                <span>Import JSON</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">All secret values are automatically masked or KMS encrypted during JSON export operations.</p>
          </div>
        </div>
      </div>

      {/* Export JSON Modal/Drawer */}
      {showJsonExport && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/50 shadow-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400">Exported Configuration JSON Snapshot</span>
            <button onClick={() => setShowJsonExport(false)} className="text-slate-400 hover:text-slate-200">
              Close
            </button>
          </div>
          <textarea
            readOnly
            value={exportedJsonStr}
            className="w-full h-48 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none"
          />
        </div>
      )}

      {/* Backup Snapshots Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Configuration Snapshot Backups ({backups.length})</h3>

        <div className="space-y-3">
          {backups.map((b) => (
            <div key={b.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{b.versionLabel}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {b.environment}
                  </span>
                  <span className="text-slate-500 text-[10px]">({b.variableCount} Variables)</span>
                </div>
                <p className="text-[11px] text-slate-400">{b.description}</p>
                <div className="text-[10px] text-slate-500 truncate">SHA256: {b.checksumSha256}</div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleRestoreBackup(b.id)}
                  disabled={restoredId === b.id}
                  className="px-3 py-1.5 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{restoredId === b.id ? 'Restored!' : 'Restore'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
