import React, { useState } from 'react';
import { Layers, CheckCircle2, ShieldCheck, Globe, Cloud, HardDrive, Cpu, Radio } from 'lucide-react';
import { configService } from '../../../services/configService';
import { EnvironmentProfile } from '../../../core/config/ConfigTypes';

export const EnvironmentProfilesView: React.FC = () => {
  const [activeProfile, setActiveProfile] = useState<EnvironmentProfile>(() => configService.getEnvironmentInfo().currentEnvironment);

  const profiles: { id: EnvironmentProfile; title: string; desc: string; badge: string; color: string }[] = [
    {
      id: 'development',
      title: 'Development Profile',
      desc: 'Local debugging with hot-reloading enabled, SQLite database, and mock third-party credentials.',
      badge: 'DEV',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    },
    {
      id: 'testing',
      title: 'Testing Profile',
      desc: 'Automated test suite environment with isolated in-memory DB instances and mock APIs.',
      badge: 'TEST',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    },
    {
      id: 'qa',
      title: 'QA Profile',
      desc: 'Quality assurance validation environment configured with synthetic customer workload generators.',
      badge: 'QA',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    },
    {
      id: 'staging',
      title: 'Staging Profile',
      desc: 'Production mirror environment running on Cloud Run with sanitized database snapshot.',
      badge: 'STAGING',
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
    },
    {
      id: 'production',
      title: 'Production Profile',
      desc: 'Hardened multi-region deployment with Cloud SQL PostgreSQL, KMS secret store, and strict TLS 1.3.',
      badge: 'PROD',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    },
    {
      id: 'local',
      title: 'Local Edge Profile',
      desc: 'On-premise standalone workstation node for VDP-02 Desktop runtime.',
      badge: 'DESKTOP LOCAL',
      color: 'text-slate-300 border-slate-700 bg-slate-800'
    },
    {
      id: 'cloud',
      title: 'Cloud Run Container Profile',
      desc: 'Fully managed serverless Cloud Run container profile for VDP-03 Cloud deployment.',
      badge: 'CLOUD RUN',
      color: 'text-sky-400 border-sky-500/30 bg-sky-500/10'
    },
    {
      id: 'hybrid',
      title: 'Hybrid Sync Profile',
      desc: 'Bi-directional cloud-to-edge synchronization profile for VDP-04 Hybrid deployment.',
      badge: 'HYBRID NODE',
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
    }
  ];

  const handleSwitchProfile = (p: EnvironmentProfile) => {
    setActiveProfile(p);
    configService.setEnvironmentProfile(p);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 02: Environment Profiles Switcher</h2>
            <p className="text-xs text-slate-400">Switch active environment configuration profiles (Dev, Test, QA, Staging, Prod, Local, Cloud, Hybrid)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {profiles.map((p) => {
            const isSelected = activeProfile === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSwitchProfile(p.id)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-slate-950 border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${p.color}`}>
                    {p.badge}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <h3 className="font-bold text-sm text-slate-100">{p.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
