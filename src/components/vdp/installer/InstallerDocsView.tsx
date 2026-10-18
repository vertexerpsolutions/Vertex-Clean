import React, { useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { installerService } from '../../../services/installerService';

export const InstallerDocsView: React.FC = () => {
  const docs = installerService.generateDocs();
  const [activeTab, setActiveTab] = useState<'installer' | 'update' | 'recovery' | 'deploy' | 'notes'>('installer');

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 08: Installer Documentation & Milestone Signoff</h2>
            <p className="text-xs text-slate-400">Enterprise Installer Guide, Auto-Update Manual, Recovery Playbook & Deployment Notes</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>VDP-05 Completed</span>
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto font-mono text-xs">
          <button
            onClick={() => setActiveTab('installer')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'installer' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Installer Guide
          </button>
          <button
            onClick={() => setActiveTab('update')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'update' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Auto-Update Manual
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'recovery' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Recovery Guide
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'deploy' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Deployment Notes
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'notes' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Developer Notes
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {activeTab === 'installer' && docs.installerGuide}
            {activeTab === 'update' && docs.updateGuide}
            {activeTab === 'recovery' && docs.recoveryGuide}
            {activeTab === 'deploy' && docs.deploymentNotes}
            {activeTab === 'notes' && docs.developerNotes}
          </pre>
        </div>
      </div>
    </div>
  );
};
