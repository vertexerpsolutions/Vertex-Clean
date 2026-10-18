import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Layers, 
  Sliders, 
  HardDrive, 
  Terminal, 
  Copy, 
  Check 
} from 'lucide-react';
import { deploymentService } from '../../services/deploymentService';

export const DeploymentDocsView: React.FC = () => {
  const docs = deploymentService.generateDocs();
  const [activeDocTab, setActiveDocTab] = useState<'arch' | 'env' | 'diagram' | 'guide' | 'notes'>('arch');
  const [copied, setCopied] = useState(false);

  const getActiveContent = () => {
    switch (activeDocTab) {
      case 'arch': return docs.deploymentArchitecture;
      case 'env': return docs.environmentGuide;
      case 'diagram': return docs.infrastructureDiagram;
      case 'guide': return docs.deploymentGuide;
      case 'notes': return docs.developerNotes;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
            PHASE 07: DOCUMENTATION GENERATOR
          </span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
            VDP-01 PRODUCTION SPECIFICATIONS
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-100">Generated Deployment Specifications</h2>
        <p className="text-xs text-slate-400">
          Official production documentation generated dynamically based on active deployment profiles and architectural specs.
        </p>
      </div>

      {/* Document Selector & Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar">
            {[
              { id: 'arch', name: 'Deployment Architecture', icon: Layers },
              { id: 'env', name: 'Environment Guide', icon: Sliders },
              { id: 'diagram', name: 'Infrastructure Diagram', icon: HardDrive },
              { id: 'guide', name: 'Deployment Guide', icon: BookOpen },
              { id: 'notes', name: 'Developer Notes', icon: Terminal },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeDocTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDocTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700 transition-colors flex items-center space-x-1 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>
        </div>

        {/* Render Content */}
        <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] custom-scrollbar leading-relaxed whitespace-pre-wrap">
          {getActiveContent()}
        </pre>
      </div>
    </div>
  );
};
