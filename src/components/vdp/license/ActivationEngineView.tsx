import React, { useState } from 'react';
import { Key, Radio, ShieldCheck, Laptop, Cpu, CheckCircle2, RefreshCw, FileText, Lock } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { ActivationRecord } from '../../../core/license/LicenseTypes';

export const ActivationEngineView: React.FC = () => {
  const [history, setHistory] = useState<ActivationRecord[]>(() => licenseService.getActivationHistory());
  const [keyInput, setKeyInput] = useState('VTX-ULTIMATE-2026-99A8-77B2-C3D4');
  const [deviceNameInput, setDeviceNameInput] = useState('Vertex-Pod-Primary-Node');
  const [offlineBlobInput, setOfflineBlobInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');

  const handleOnlineActivate = () => {
    if (!keyInput.trim() || !deviceNameInput.trim()) return;
    setActivating(true);
    setTimeout(() => {
      licenseService.activateOnline(keyInput, deviceNameInput);
      setHistory([...licenseService.getActivationHistory()]);
      setActivating(false);
    }, 800);
  };

  const handleOfflineActivate = () => {
    if (!keyInput.trim() || !offlineBlobInput.trim()) return;
    setActivating(true);
    setTimeout(() => {
      licenseService.activateOffline(keyInput, offlineBlobInput);
      setHistory([...licenseService.getActivationHistory()]);
      setOfflineBlobInput('');
      setActivating(false);
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 03: Activation Engine & Hardware Machine Binding</h2>
            <p className="text-xs text-slate-400">Online & Offline Activation, HWID Machine Binding, License Key Validation & Activation History</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 font-mono text-xs mt-6">
          <button
            onClick={() => setActiveTab('online')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'online' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Online Direct Activation
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'offline' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Offline Challenge-Response Blob Activation
          </button>
        </div>

        {/* Form Controls */}
        {activeTab === 'online' ? (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 mt-4 space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">License Key Signature</label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1">Target Pod Machine Name</label>
                <input
                  type="text"
                  value={deviceNameInput}
                  onChange={(e) => setDeviceNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              onClick={handleOnlineActivate}
              disabled={activating}
              className="px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${activating ? 'animate-spin' : ''}`} />
              <span>{activating ? 'Binding HWID...' : 'Activate Pod Node Online'}</span>
            </button>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 mt-4 space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">License Key Signature</label>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Paste Air-Gapped Offline Challenge Blob (.vtxlic)</label>
              <textarea
                value={offlineBlobInput}
                onChange={(e) => setOfflineBlobInput(e.target.value)}
                placeholder="-----BEGIN OFFLINE LICENSE CHALLENGE-----\nVTX-HWID-AIRGAP-9988-7711-SIGNATURE-BLOB\n-----END OFFLINE LICENSE CHALLENGE-----"
                className="w-full h-24 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleOfflineActivate}
              disabled={activating}
              className="px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{activating ? 'Verifying Offline Signature...' : 'Submit Offline Activation Blob'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Activation History */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Activation Audit Log History ({history.length})</h3>

        <div className="space-y-3">
          {history.map((rec) => (
            <div key={rec.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{rec.deviceName}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {rec.method}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {rec.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">HWID: {rec.hardwareFingerprint} | IP: {rec.ipAddress}</div>
              </div>

              <div className="text-right text-[10px] text-slate-400">
                {new Date(rec.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
