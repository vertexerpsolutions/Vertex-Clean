import React, { useState } from 'react';
import { BookOpen, FileText, Download, CheckCircle2 } from 'lucide-react';
import { cloudService } from '../../../services/cloudService';

export const CloudDocsView: React.FC = () => {
  const docs = cloudService.generateDocs();
  const [activeDoc, setActiveDoc] = useState<'guide' | 'saas' | 'tenant' | 'infra' | 'dev'>('guide');

  const docMap = {
    guide: { title: 'Cloud Deployment Guide', content: docs.cloudGuide },
    saas: { title: 'SaaS Architecture Specification', content: docs.saasArchitecture },
    tenant: { title: 'Multi-Tenant Architecture', content: docs.tenantArchitecture },
    infra: { title: 'Infrastructure Topology Diagram', content: docs.infrastructureDiagram },
    dev: { title: 'Developer Notes (VDP-03)', content: docs.developerNotes },
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 08: Cloud SaaS Documentation</h2>
            <p className="text-xs text-slate-400">SaaS Deployment Specs, Multi-Tenant Database Topology & Developer Manuals</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {[
            { id: 'guide', label: 'Cloud Deployment Guide' },
            { id: 'saas', label: 'SaaS Architecture' },
            { id: 'tenant', label: 'Tenant Architecture' },
            { id: 'infra', label: 'Infrastructure Diagram' },
            { id: 'dev', label: 'Developer Notes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveDoc(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeDoc === tab.id
                  ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>{docMap[activeDoc].title}</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            VDP-03 COMPLETED
          </span>
        </div>

        <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap overflow-x-auto custom-scrollbar">
          {docMap[activeDoc].content}
        </pre>
      </div>
    </div>
  );
};
