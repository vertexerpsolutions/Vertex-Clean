import React, { useState } from 'react';
import { Sliders, Save, Database, Cloud, HardDrive, CheckCircle2 } from 'lucide-react';
import { installerService } from '../../../services/installerService';
import { SystemConfigProfile } from '../../../core/installer/InstallerTypes';

export const SystemConfigView: React.FC = () => {
  const [config, setConfig] = useState<SystemConfigProfile>(() => installerService.getSystemConfig());
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    installerService.updateSystemConfig(config);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 05: System Configuration Manager</h2>
            <p className="text-xs text-slate-400">Database Connection Pooling, Cloud Endpoints, Desktop Vault & Hybrid Sync Settings</p>
          </div>
        </div>

        {savedMessage && (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuration Saved</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Install Directory</label>
            <input
              type="text"
              value={config.installDirectory}
              onChange={(e) => setConfig({ ...config, installDirectory: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Database Connection String</label>
            <input
              type="text"
              value={config.dbConnectionString}
              onChange={(e) => setConfig({ ...config, dbConnectionString: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Cloud Endpoint URL</label>
            <input
              type="text"
              value={config.cloudEndpointUrl}
              onChange={(e) => setConfig({ ...config, cloudEndpointUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 text-[10px] uppercase font-bold">Desktop SQLite Vault Path</label>
            <input
              type="text"
              value={config.desktopVaultPath}
              onChange={(e) => setConfig({ ...config, desktopVaultPath: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hybridSyncEnabled}
              onChange={(e) => setConfig({ ...config, hybridSyncEnabled: e.target.checked })}
              className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Enable Background Hybrid Synchronization Pipeline</span>
          </label>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
