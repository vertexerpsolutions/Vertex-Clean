import React, { useState } from 'react';
import { BookOpen, FileText, Terminal, ShieldCheck } from 'lucide-react';
import { configService } from '../../../services/configService';

export const ConfigDocsView: React.FC = () => {
  const docs = configService.generateDocs();
  const [activeTab, setActiveTab] = useState<'env' | 'config' | 'dev' | 'prod'>('env');

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 08: Environment & Configuration Documentation</h2>
            <p className="text-xs text-slate-400">Automatically generated Enterprise Environment Guide, Configuration Guide, Developer Setup, and Production Deployment Guide</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 font-mono text-xs mt-6">
          <button
            onClick={() => setActiveTab('env')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'env' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Environment Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'config' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Configuration Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('dev')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'dev' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('prod')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'prod' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Production Deployment</span>
          </button>
        </div>
      </div>

      {/* Markdown Content Display */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl font-mono text-xs">
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
          {activeTab === 'env' && docs.environmentGuide}
          {activeTab === 'config' && docs.configurationGuide}
          {activeTab === 'dev' && docs.developerSetupGuide}
          {activeTab === 'prod' && docs.productionDeploymentGuide}
        </pre>
      </div>
    </div>
  );
};
