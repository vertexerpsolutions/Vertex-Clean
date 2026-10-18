import React from 'react';
import { Cloud, CheckCircle2, Server, Shield, Globe, Cpu } from 'lucide-react';
import { cloudService } from '../../../services/cloudService';

export const CloudAnalysisView: React.FC = () => {
  const analysis = cloudService.getAnalysis();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 01: Cloud Analysis</h2>
            <p className="text-xs text-slate-400">Enterprise SaaS Architecture, Multi-Tenant Isolation & Cloud Run Infrastructure Readiness</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Hosting Platform</div>
            <div className="text-sm font-bold text-blue-400 font-mono mt-1">{analysis.hostingPlatform}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Deployment Model</div>
            <div className="text-sm font-bold text-indigo-400 font-mono mt-1">{analysis.deploymentModel}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Scalability Tier</div>
            <div className="text-sm font-bold text-cyan-400 font-mono mt-1">{analysis.scalabilityTier}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">High Availability SLA</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-1">{analysis.highAvailabilitySla}</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono mb-4">Enterprise Cloud Compliance Attestations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analysis.compliance.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-200 font-mono">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
