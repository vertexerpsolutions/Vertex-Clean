import React from 'react';
import { Database, FileCode, Settings, Key, Shield, Paperclip, User, HardDrive, CheckCircle2 } from 'lucide-react';
import { backupService } from '../../../services/backupService';

export const BackupAnalysisView: React.FC = () => {
  const assets = backupService.getBackupAssets();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'application_files': return <FileCode className="w-4 h-4 text-amber-400" />;
      case 'database': return <Database className="w-4 h-4 text-cyan-400" />;
      case 'configurations': return <Settings className="w-4 h-4 text-purple-400" />;
      case 'licenses': return <Key className="w-4 h-4 text-emerald-400" />;
      case 'system_logs': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'attachments': return <Paperclip className="w-4 h-4 text-rose-400" />;
      case 'user_settings': return <User className="w-4 h-4 text-teal-400" />;
      default: return <HardDrive className="w-4 h-4 text-slate-400" />;
    }
  };

  const totalSizeMb = assets.reduce((sum, a) => sum + a.sizeMb, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 01: Enterprise Backup Scope & Asset Analysis</h2>
            <p className="text-xs text-slate-400">Catalog of Enterprise Data Assets across Application Files, Databases, Configurations, Licenses, Logs, Attachments & Settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Monitored Assets</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{assets.length} Target Scopes</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Total Uncompressed Footprint</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">{(totalSizeMb / 1024).toFixed(2)} GB</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Supported Platforms</div>
            <div className="text-xs font-bold text-emerald-400 mt-1">Desktop, Cloud & Hybrid</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Compression Engine</div>
            <div className="text-xs font-bold text-purple-400 mt-1">LZ4 / Stream Tar.Gz (74% Ratio)</div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Analyzed Enterprise Backup Assets</h3>
        <div className="space-y-3 font-mono text-xs">
          {assets.map((asset) => (
            <div key={asset.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(asset.category)}
                  <span className="font-bold text-slate-100">{asset.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 uppercase">
                    {asset.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-cyan-400 font-bold">{asset.sizeMb >= 1024 ? `${(asset.sizeMb / 1024).toFixed(2)} GB` : `${asset.sizeMb} MB`}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      asset.criticality === 'critical'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : asset.criticality === 'high'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {asset.criticality}
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-xs">{asset.description}</p>

              <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[10px] text-slate-500">
                <span className="truncate max-w-[320px]">Path: {asset.sourcePath}</span>
                <div className="flex items-center space-x-2">
                  {asset.desktopSupported && <span className="text-emerald-400">Desktop ✓</span>}
                  {asset.cloudSupported && <span className="text-cyan-400">Cloud ✓</span>}
                  {asset.hybridSupported && <span className="text-purple-400">Hybrid ✓</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
