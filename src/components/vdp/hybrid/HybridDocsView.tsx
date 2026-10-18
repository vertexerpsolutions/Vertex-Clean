import React, { useState } from 'react';
import { FileText, CheckCircle2, Download, Copy, Code } from 'lucide-react';
import { hybridService } from '../../../services/hybridService';

export const HybridDocsView: React.FC = () => {
  const docs = hybridService.generateDocs();
  const [activeTab, setActiveTab] = useState<'guide' | 'diagram' | 'offline' | 'notes'>('guide');

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 08: Hybrid Documentation & Milestone Signoff</h2>
            <p className="text-xs text-slate-400">Hybrid Architecture Guide, Synchronization Diagram & Developer Notes</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>VDP-04 Completed</span>
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'guide' ? 'bg-purple-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Hybrid Architecture Guide
          </button>
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'diagram' ? 'bg-purple-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Sync Topology Diagram
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'offline' ? 'bg-purple-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Offline Operating Guide
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'notes' ? 'bg-purple-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Developer Notes
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {activeTab === 'guide' && docs.hybridGuide}
            {activeTab === 'diagram' && docs.syncDiagram}
            {activeTab === 'offline' && docs.offlineGuide}
            {activeTab === 'notes' && docs.developerNotes}
          </pre>
        </div>
      </div>
    </div>
  );
};
