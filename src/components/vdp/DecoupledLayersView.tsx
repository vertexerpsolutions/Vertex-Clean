import React from 'react';
import { 
  Layers, 
  HardDrive, 
  PackageCheck, 
  Server, 
  Sliders, 
  CheckCircle2,
  ArrowDown
} from 'lucide-react';
import { deploymentService } from '../../services/deploymentService';

export const DecoupledLayersView: React.FC = () => {
  const layers = deploymentService.getArchitecturalLayers();

  const getLayerIcon = (name: string) => {
    switch (name) {
      case 'Business Layer': return <Layers className="w-5 h-5 text-indigo-400" />;
      case 'Infrastructure Layer': return <HardDrive className="w-5 h-5 text-purple-400" />;
      case 'Deployment Layer': return <PackageCheck className="w-5 h-5 text-amber-400" />;
      case 'Hosting Layer': return <Server className="w-5 h-5 text-blue-400" />;
      case 'Configuration Layer': return <Sliders className="w-5 h-5 text-emerald-400" />;
      default: return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLayerBadgeColor = (name: string) => {
    switch (name) {
      case 'Business Layer': return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'Infrastructure Layer': return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Deployment Layer': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Hosting Layer': return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'Configuration Layer': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
            PHASE 02: DEDICATED DEPLOYMENT LAYER
          </span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
            5 DECOUPLED TIERS
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-100">Separation of Concerns Architecture</h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          The deployment layer cleanly decouples core enterprise business logic from physical hosting platforms, environment profiles, storage engines, and secret management.
        </p>
      </div>

      {/* Vertical Stack of Decoupled Layers */}
      <div className="space-y-4">
        {layers.map((layer, idx) => (
          <React.Fragment key={layer.layerName}>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {getLayerIcon(layer.layerName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                      <span>{layer.layerName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getLayerBadgeColor(layer.layerName)}`}>
                        Tier 0{idx + 1}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{layer.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-semibold text-emerald-400 uppercase">{layer.status}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  Key Architectural Components:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {layer.components.map((comp, cIdx) => (
                    <div key={cIdx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 font-mono text-slate-300 flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {idx < layers.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
