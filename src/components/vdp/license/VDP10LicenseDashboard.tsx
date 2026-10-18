import React, { useState } from 'react';
import { Key, ShieldCheck, Award, Radio, Server, Package, RefreshCw, Users, BarChart3, Lock, BookOpen } from 'lucide-react';
import { LicenseDashboardView } from './LicenseDashboardView';
import { LicenseTypesView } from './LicenseTypesView';
import { ActivationEngineView } from './ActivationEngineView';
import { LicenseServerView } from './LicenseServerView';
import { ProductDistributionView } from './ProductDistributionView';
import { UpdateDistributionView } from './UpdateDistributionView';
import { CustomerPortalView } from './CustomerPortalView';
import { DistributionAnalyticsView } from './DistributionAnalyticsView';
import { LicenseSecurityView } from './LicenseSecurityView';
import { LicenseDocsView } from './LicenseDocsView';

export const VDP10LicenseDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'types' | 'activation' | 'server' | 'distribution' | 'updates' | 'portal' | 'analytics' | 'security' | 'docs'
  >('dashboard');

  const tabs: { id: typeof activeTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Phase 01: License Dashboard', icon: Key },
    { id: 'types', label: 'Phase 02: License Types Catalog', icon: Award },
    { id: 'activation', label: 'Phase 03: Activation Engine', icon: Radio },
    { id: 'server', label: 'Phase 04: License Verification Server', icon: Server },
    { id: 'distribution', label: 'Phase 05: Product Distribution', icon: Package },
    { id: 'updates', label: 'Phase 06: Update Release Channels', icon: RefreshCw },
    { id: 'portal', label: 'Phase 07: Customer Self-Service Portal', icon: Users },
    { id: 'analytics', label: 'Phase 08: Distribution Analytics', icon: BarChart3 },
    { id: 'security', label: 'Phase 09: License Security & RSA', icon: Lock },
    { id: 'docs', label: 'Phase 10: Enterprise Documentation', icon: BookOpen },
  ];

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Engine Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 uppercase tracking-tight">
                VDP-10: Enterprise License & Product Distribution Engine
              </h1>
              <p className="text-xs text-slate-400">
                Vertex ERP Ultimate v1.0 – License Management, Hardware Fingerprinting, Key Activation, Distribution & RSA Security
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>KMS RSA-4096 VALIDATED</span>
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs shadow-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Phase Component View */}
      <div className="transition-all">
        {activeTab === 'dashboard' && <LicenseDashboardView />}
        {activeTab === 'types' && <LicenseTypesView />}
        {activeTab === 'activation' && <ActivationEngineView />}
        {activeTab === 'server' && <LicenseServerView />}
        {activeTab === 'distribution' && <ProductDistributionView />}
        {activeTab === 'updates' && <UpdateDistributionView />}
        {activeTab === 'portal' && <CustomerPortalView />}
        {activeTab === 'analytics' && <DistributionAnalyticsView />}
        {activeTab === 'security' && <LicenseSecurityView />}
        {activeTab === 'docs' && <LicenseDocsView />}
      </div>
    </div>
  );
};
