import React, { useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { updateService } from '../../../services/updateService';

export const UpdateDocsView: React.FC = () => {
  const docs = updateService.generateDocs();
  const [activeTab, setActiveTab] = useState<'update' | 'patch' | 'rollback' | 'notes'>('update');

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 08: Update Engine Documentation & Signoff</h2>
            <p className="text-xs text-slate-400">Enterprise Update Guide, Patch Manual, Zero-Downtime Rollback Guide & Developer Architecture Specs</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>VDP-08 Status: COMPLETED</span>
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('update')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'update' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Update Guide
          </button>
          <button
            onClick={() => setActiveTab('patch')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'patch' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Patch Guide
          </button>
          <button
            onClick={() => setActiveTab('rollback')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'rollback' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Rollback Guide
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
            {activeTab === 'update' && docs.updateGuide}
            {activeTab === 'patch' && docs.patchGuide}
            {activeTab === 'rollback' && docs.rollbackGuide}
            {activeTab === 'notes' && docs.developerNotes}
          </pre>
        </div>
      </div>
    </div>
  );
};
