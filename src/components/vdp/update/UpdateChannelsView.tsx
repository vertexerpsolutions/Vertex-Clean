import React, { useState } from 'react';
import { Layers, CheckCircle2, ShieldCheck, Radio, Upload, HardDrive } from 'lucide-react';
import { updateService } from '../../../services/updateService';
import { UpdateChannel } from '../../../core/update/UpdateTypes';

export const UpdateChannelsView: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<UpdateChannel>(() => updateService.getVersionInfo().channel);
  const [offlineFileName, setOfflineFileName] = useState<string | null>(null);

  const channels: { id: UpdateChannel; title: string; desc: string; badge: string; color: string }[] = [
    {
      id: 'stable',
      title: 'Stable Channel (Production Approved)',
      desc: 'Tested and hardened production builds recommended for all mission-critical deployment environments.',
      badge: 'STABLE v1.1.0',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    },
    {
      id: 'enterprise',
      title: 'Enterprise Long-Term Support (LTS)',
      desc: 'Extended maintenance channel with quarterly patch updates, zero breaking changes, and critical security hotfixes.',
      badge: 'LTS v1.0.x',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    },
    {
      id: 'beta',
      title: 'Beta Channel (Preview Features)',
      desc: 'Early access builds containing preview features, upcoming ERP modules, and performance optimizations.',
      badge: 'BETA v1.2.0-beta.1',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    },
    {
      id: 'internal',
      title: 'Internal / Dev Nightly Builds',
      desc: 'Automated nightly developer builds. Intended strictly for staging, testing sandbox, and QA validation.',
      badge: 'INTERNAL v1.3.0-nightly',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    },
    {
      id: 'offline',
      title: 'Air-Gapped / Offline Package Mode',
      desc: 'Disconnected installation mode. Manual upload of signed .vpk enterprise update packages.',
      badge: 'AIR-GAPPED',
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
    }
  ];

  const handleSelectChannel = (ch: UpdateChannel) => {
    setActiveChannel(ch);
    updateService.setUpdateChannel(ch);
  };

  const handleSimulateOfflineUpload = () => {
    const fakeName = 'vertex-erp-patch-v1.1.0-build1105.vpk';
    setOfflineFileName(fakeName);
    updateService.loadOfflinePackage(fakeName);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 02: Distribution Channels & Offline Updates</h2>
            <p className="text-xs text-slate-400">Select distribution release channel or import signed offline air-gapped packages</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {channels.map((ch) => {
            const isSelected = activeChannel === ch.id;
            return (
              <div
                key={ch.id}
                onClick={() => handleSelectChannel(ch.id)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-slate-950 border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full border-2 ${isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'}`} />
                    <span className="font-bold text-sm text-slate-100">{ch.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${ch.color}`}>
                    {ch.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 pl-5">{ch.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Package Air-Gapped Uploader */}
      {activeChannel === 'offline' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
          <div className="flex items-center space-x-2 text-rose-400">
            <HardDrive className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase">Air-Gapped / Offline Package Import (.vpk)</h3>
          </div>
          <p className="text-slate-400">
            Select a signed Vertex ERP Update Package file (\`.vpk\` or \`.tar.gz\`) extracted from an air-gapped storage media.
          </p>

          <div className="p-6 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950 text-center space-y-3">
            <Upload className="w-8 h-8 text-rose-400 mx-auto" />
            <div className="text-slate-300 font-bold">
              {offlineFileName ? `Loaded: ${offlineFileName}` : 'Drag & Drop signed .vpk package here, or click to upload'}
            </div>
            <button
              onClick={handleSimulateOfflineUpload}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-lg shadow-rose-500/20 transition-all inline-flex items-center space-x-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Simulate Offline .vpk Package Import</span>
            </button>
          </div>

          {offlineFileName && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Package SHA-256 and RSA-4096 signature successfully verified! Package ready for patch installer.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
