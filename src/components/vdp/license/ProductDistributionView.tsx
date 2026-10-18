import React, { useState } from 'react';
import { Package, Download, HardDrive, ShieldCheck, CheckCircle2, FileText, Cpu, Laptop } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { ProductDistributionPackage } from '../../../core/license/LicenseTypes';

export const ProductDistributionView: React.FC = () => {
  const [pkgs, setPkgs] = useState<ProductDistributionPackage[]>(() => licenseService.getPackages());
  const [building, setBuilding] = useState(false);
  const [buildEdition, setBuildEdition] = useState<'Portable Edition' | 'Desktop Edition' | 'Enterprise Edition' | 'Cloud Edition'>('Enterprise Edition');

  const handleBuildPackage = () => {
    setBuilding(true);
    setTimeout(() => {
      setBuilding(false);
      alert(`Package build completed for ${buildEdition}! Ready for distribution.`);
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 05: Product Distribution & Installer Builder Engine</h2>
            <p className="text-xs text-slate-400">Generate Windows Setup (.exe/msi), Portable ZIP, Desktop, Enterprise & Cloud Run Container distribution builds</p>
          </div>
        </div>

        {/* Product Builder Form */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 mt-4 space-y-4 font-mono text-xs">
          <h3 className="font-bold text-slate-200 uppercase">Product Edition Package Builder</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Target Distribution Edition</label>
              <select
                value={buildEdition}
                onChange={(e) => setBuildEdition(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Enterprise Edition">Enterprise Edition (.exe Setup / .msi)</option>
                <option value="Portable Edition">Portable Edition (Standalone .zip)</option>
                <option value="Desktop Edition">Desktop Edition (VDP-02 Electron/Tauri)</option>
                <option value="Cloud Edition">Cloud Edition (Cloud Run Docker Container)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Target OS / Architecture</label>
              <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                x86_64 / ARM64 Universal Binary
              </div>
            </div>
          </div>

          <button
            onClick={handleBuildPackage}
            disabled={building}
            className="px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Package className="w-4 h-4" />
            <span>{building ? 'Building Distribution Package...' : 'Compile Distribution Installer'}</span>
          </button>
        </div>
      </div>

      {/* Distribution Packages Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Compiled Distribution Packages ({pkgs.length})</h3>

        <div className="space-y-3">
          {pkgs.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{p.packageName}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {p.edition}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {p.format}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Version: {p.version} | Target OS: {p.targetOs} | Size: {p.sizeMb} MB</p>
                <div className="text-[10px] text-slate-500 truncate">SHA256: {p.sha256Checksum}</div>
              </div>

              <a
                href={p.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center space-x-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Package</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
