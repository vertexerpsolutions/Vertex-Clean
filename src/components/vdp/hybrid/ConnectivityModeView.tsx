import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Smartphone, Monitor, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { hybridService } from '../../../services/hybridService';
import { HybridConnectivityMode } from '../../../core/hybrid/HybridTypes';

export const ConnectivityModeView: React.FC = () => {
  const [mode, setMode] = useState<HybridConnectivityMode>(() => hybridService.getConnectivityMode());
  const [networkState, setNetworkState] = useState<'connected' | 'disconnected'>(() => hybridService.getNetworkState());
  const devices = hybridService.getRegisteredDevices();

  const handleModeChange = (newMode: HybridConnectivityMode) => {
    hybridService.setConnectivityMode(newMode);
    setMode(newMode);
  };

  const handleToggleNetwork = () => {
    const newState = hybridService.toggleNetworkState();
    setNetworkState(newState);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl border ${
                networkState === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {networkState === 'connected' ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 04: Offline / Online Mode Control</h2>
              <p className="text-xs text-slate-400">Automatic Network Sensing, Manual Overrides & Device Registration</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleNetwork}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono border flex items-center space-x-2 transition-all ${
                networkState === 'connected'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {networkState === 'connected' ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Simulate Disconnection</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Reconnect Cloud</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {(['auto_switch', 'online', 'offline'] as HybridConnectivityMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === m
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-500 uppercase">Operating Strategy</div>
              <div className="text-sm font-bold uppercase font-mono mt-1">{m.replace('_', ' ')}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Registered Hybrid Devices ({devices.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((dev) => (
            <div key={dev.deviceId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>{dev.deviceName}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {dev.status}
                </span>
              </div>
              <div className="text-slate-500 text-[10px]">GUID: {dev.machineGuid}</div>
              <div className="text-slate-400 text-[10px]">Tenant: {dev.tenantId}</div>
              <div className="text-purple-400 text-[10px] truncate">Key: {dev.encryptionKeyFingerprint}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
