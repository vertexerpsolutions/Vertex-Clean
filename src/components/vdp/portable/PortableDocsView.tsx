import React, { useState } from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';
import { portableService } from '../../../services/portableService';
import { PortableGeneratedDocs } from '../../../core/portable/PortableTypes';

export const PortableDocsView: React.FC = () => {
  const [docs] = useState<PortableGeneratedDocs>(() => portableService.generateDocs());
  const [activeDoc, setActiveDoc] = useState<keyof PortableGeneratedDocs>('portableGuide');
  const [copied, setCopied] = useState(false);

  const docTitles: Record<keyof PortableGeneratedDocs, string> = {
    portableGuide: 'Portable Deployment Guide',
    zeroInstallManual: 'Zero-Install Runtime Execution Manual',
    storageSpecs: 'Storage Volume & Filesystem Specs',
    syncArchitecture: 'Local-First Sync Architecture',
    administratorManual: 'Administrator Safety & Ejection Manual'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docs[activeDoc]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 08: Auto-Generated Portable Documentation</h2>
            <p className="text-xs text-slate-400">Deployment Guide, Zero-Install Manual, Storage Specs, Sync Architecture & Ejection Protocol</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 font-mono text-xs mt-6">
          {(Object.keys(docTitles) as (keyof PortableGeneratedDocs)[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveDoc(key)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeDoc === key ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {docTitles[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Doc Output View */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-amber-400 uppercase">{docTitles[activeDoc]}</h3>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white flex items-center space-x-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Document Markdown'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {docs[activeDoc]}
        </pre>
      </div>
    </div>
  );
};
