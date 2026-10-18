import React from 'react';
import { Cpu, Cloud, Database, Lock, ShieldCheck, HardDrive, RefreshCw } from 'lucide-react';

export const HybridArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 02: Hybrid Architecture Matrix</h2>
            <p className="text-xs text-slate-400">Unified Execution Model across Local Hardware and Cloud Run Infrastructure</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold font-mono text-xs">
              <HardDrive className="w-4 h-4" />
              <span>LOCAL PROCESSING</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-center justify-between">
                <span>Engine:</span>
                <span className="text-slate-100">SQLite WAL / C++ N-API</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Latency:</span>
                <span className="text-emerald-400 font-bold">&lt; 0.5 ms</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Hardware Vault:</span>
                <span className="text-cyan-400">TPM 2.0 Enabled</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Spooler:</span>
                <span className="text-slate-100">Win32 Print Driver</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-purple-400 font-bold font-mono text-xs">
              <RefreshCw className="w-4 h-4" />
              <span>SHARED CORE LOGIC</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-center justify-between">
                <span>VGF Engine:</span>
                <span className="text-slate-100">Double-Entry Rules</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Auth Model:</span>
                <span className="text-purple-400 font-bold">OAuth2 / mTLS</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Tax Calculation:</span>
                <span className="text-slate-100">Multi-Jurisdiction</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Configuration:</span>
                <span className="text-slate-100">JSON Policy Matrix</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-blue-400 font-bold font-mono text-xs">
              <Cloud className="w-4 h-4" />
              <span>CLOUD PROCESSING</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-center justify-between">
                <span>Hosting:</span>
                <span className="text-slate-100">GCP Cloud Run</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Master DB:</span>
                <span className="text-blue-400 font-bold">PostgreSQL Multi-AZ</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Consolidated Analytics:</span>
                <span className="text-slate-100">BigQuery Export</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Scale:</span>
                <span className="text-emerald-400">100k Active Tenants</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
