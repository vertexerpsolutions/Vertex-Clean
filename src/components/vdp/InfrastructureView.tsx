import React, { useState } from 'react';
import { 
  HardDrive, 
  Laptop, 
  Cloud, 
  Network, 
  Server, 
  Terminal, 
  Copy, 
  Check, 
  Cpu, 
  FileCode,
  Zap
} from 'lucide-react';
import { infrastructureManager } from '../../core/deployment/InfrastructureManager';
import { deploymentService } from '../../services/deploymentService';

export const InfrastructureView: React.FC = () => {
  const activeProfile = deploymentService.getActiveProfile();
  const [activeTab, setActiveTab] = useState<'dockerfile' | 'compose' | 'desktop' | 'hybrid'>('dockerfile');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const dockerfileContent = infrastructureManager.generateDockerfile();
  const composeContent = infrastructureManager.generateDockerCompose();
  const desktopContent = infrastructureManager.generateDesktopPackageManifest();
  const hybridContent = infrastructureManager.generateHybridSyncManifest();

  const handleCopy = (tab: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const overview = infrastructureManager.getInfrastructureOverview(activeProfile.edition);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
            PHASE 05: INFRASTRUCTURE PREPARATION
          </span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">
            PACKAGING &amp; CONTAINERS
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-100">Infrastructure Specs &amp; Deployment Manifests</h2>
        <p className="text-xs text-slate-400">
          Generated production manifests for Desktop installation, Cloud hosting containers, Hybrid edge nodes, API ingress, and Background task workers.
        </p>
      </div>

      {/* Infrastructure Readiness Overview */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Active Edition Overview: <span className="text-amber-300 font-mono uppercase">{activeProfile.edition}</span>
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Readiness Score: {overview.readinessScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-bold text-slate-300 block mb-2 font-mono">Infrastructure Technical Specifications:</span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {overview.specs.map((spec, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-300 block mb-2 font-mono">Recommended Deployment Step Checklist:</span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {overview.recommendedActions.map((act, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Manifest Tabs & Code Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dockerfile')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeTab === 'dockerfile'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Dockerfile</span>
            </button>

            <button
              onClick={() => setActiveTab('compose')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeTab === 'compose'
                  ? 'bg-indigo-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>docker-compose.yml</span>
            </button>

            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeTab === 'desktop'
                  ? 'bg-purple-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Desktop Package Manifest</span>
            </button>

            <button
              onClick={() => setActiveTab('hybrid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                activeTab === 'hybrid'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Hybrid Sync Config</span>
            </button>
          </div>

          <button
            onClick={() => {
              const content =
                activeTab === 'dockerfile'
                  ? dockerfileContent
                  : activeTab === 'compose'
                  ? composeContent
                  : activeTab === 'desktop'
                  ? desktopContent
                  : hybridContent;
              handleCopy(activeTab, content);
            }}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700 transition-colors flex items-center space-x-1 shrink-0"
          >
            {copiedTab === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTab === activeTab ? 'Copied!' : 'Copy Spec'}</span>
          </button>
        </div>

        {/* Code Content */}
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 custom-scrollbar leading-relaxed">
          {activeTab === 'dockerfile' && dockerfileContent}
          {activeTab === 'compose' && composeContent}
          {activeTab === 'desktop' && desktopContent}
          {activeTab === 'hybrid' && hybridContent}
        </pre>
      </div>
    </div>
  );
};
