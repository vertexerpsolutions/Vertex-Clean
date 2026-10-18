import React, { useState } from 'react';
import { Sliders, Layers, Lock, ShieldCheck, Download, Radio, BookOpen, LayoutDashboard, Settings } from 'lucide-react';
import { EnvironmentDashboardView } from './EnvironmentDashboardView';
import { EnvironmentProfilesView } from './EnvironmentProfilesView';
import { ConfigurationManagerView } from './ConfigurationManagerView';
import { SecretsManagementView } from './SecretsManagementView';
import { ConfigValidationView } from './ConfigValidationView';
import { ConfigImportExportView } from './ConfigImportExportView';
import { RuntimeManagementView } from './RuntimeManagementView';
import { ConfigDocsView } from './ConfigDocsView';

export const VDP09ConfigDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'profiles' | 'manager' | 'secrets' | 'validation' | 'import_export' | 'runtime' | 'docs'
  >('dashboard');

  return (
    <div className="space-y-6 font-sans">
      {/* VDP-09 Engine Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              VDP-09 COMPLETED
            </span>
            <h1 className="text-xl font-black text-slate-100">Environment & Configuration Management Engine</h1>
          </div>
          <p className="text-xs text-slate-400">
            Vertex ERP Ultimate v1.0 • Enterprise KMS Vault, Profile Switcher, Validation & Runtime Hot Reload
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none font-mono text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>01. Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('profiles')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'profiles'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>02. Profiles</span>
        </button>

        <button
          onClick={() => setActiveTab('manager')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'manager'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>03. Config Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('secrets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'secrets'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>04. Secrets Vault</span>
        </button>

        <button
          onClick={() => setActiveTab('validation')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'validation'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>05. Validation</span>
        </button>

        <button
          onClick={() => setActiveTab('import_export')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'import_export'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>06. Import/Export</span>
        </button>

        <button
          onClick={() => setActiveTab('runtime')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'runtime'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>07. Runtime</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'docs'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>08. Documentation</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'dashboard' && <EnvironmentDashboardView />}
        {activeTab === 'profiles' && <EnvironmentProfilesView />}
        {activeTab === 'manager' && <ConfigurationManagerView />}
        {activeTab === 'secrets' && <SecretsManagementView />}
        {activeTab === 'validation' && <ConfigValidationView />}
        {activeTab === 'import_export' && <ConfigImportExportView />}
        {activeTab === 'runtime' && <RuntimeManagementView />}
        {activeTab === 'docs' && <ConfigDocsView />}
      </div>
    </div>
  );
};
