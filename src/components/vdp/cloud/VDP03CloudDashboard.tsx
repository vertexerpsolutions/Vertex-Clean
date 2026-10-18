import React, { useState } from 'react';
import {
  Cloud,
  Users,
  Server,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { CloudAnalysisView } from './CloudAnalysisView';
import { MultiTenantView } from './MultiTenantView';
import { CloudServicesView } from './CloudServicesView';
import { ScalabilityView } from './ScalabilityView';
import { HighAvailabilityView } from './HighAvailabilityView';
import { CloudSecurityView } from './CloudSecurityView';
import { CloudValidationView } from './CloudValidationView';
import { CloudDocsView } from './CloudDocsView';

export const VDP03CloudDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'phase01' | 'phase02' | 'phase03' | 'phase04' | 'phase05' | 'phase06' | 'phase07' | 'phase08'
  >('phase01');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase">
              VDP-03 CLOUD EDITION
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              ENTERPRISE SAAS READY
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase">
              MULTI-TENANT PAAS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <Cloud className="w-7 h-7 text-blue-400 shrink-0" />
            <span>Vertex ERP Cloud Edition</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Enterprise Cloud SaaS platform featuring schema-level multi-tenant isolation, Cloud Run elastic auto-scaling, Multi-AZ PostgreSQL failover, and TLS 1.3 zero-trust security.
          </p>
        </div>

        {/* Status Pill */}
        <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3 shrink-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 font-semibold">CLOUD STATUS</div>
            <div className="text-xs font-bold text-slate-100 font-mono">Cloud Run SaaS</div>
            <div className="text-[10px] text-emerald-400 font-mono">VDP-03 Completed</div>
          </div>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto bg-slate-900 p-2 rounded-2xl border border-slate-800 custom-scrollbar">
        {[
          { id: 'phase01', label: '01: Analysis', icon: Cloud },
          { id: 'phase02', label: '02: Multi-Tenant', icon: Users },
          { id: 'phase03', label: '03: Cloud Services', icon: Server },
          { id: 'phase04', label: '04: Scalability', icon: Cpu },
          { id: 'phase05', label: '05: High Availability', icon: ShieldAlert },
          { id: 'phase06', label: '06: Cloud Security', icon: ShieldCheck },
          { id: 'phase07', label: '07: Validation', icon: CheckCircle2 },
          { id: 'phase08', label: '08: Documentation', icon: BookOpen },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-500 text-slate-950 font-bold shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active View */}
      <div className="pt-2">
        {activeTab === 'phase01' && <CloudAnalysisView />}
        {activeTab === 'phase02' && <MultiTenantView />}
        {activeTab === 'phase03' && <CloudServicesView />}
        {activeTab === 'phase04' && <ScalabilityView />}
        {activeTab === 'phase05' && <HighAvailabilityView />}
        {activeTab === 'phase06' && <CloudSecurityView />}
        {activeTab === 'phase07' && <CloudValidationView />}
        {activeTab === 'phase08' && <CloudDocsView />}
      </div>
    </div>
  );
};
