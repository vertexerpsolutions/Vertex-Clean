import React, { useState } from 'react';
import { SYSTEM_ENGINES } from '../../data/mockData';
import { SystemEngineMeta } from '../../types';
import { Cpu, RefreshCw, CheckCircle2, Activity, ShieldCheck, Zap, Server, Layers } from 'lucide-react';
import { auditEngine } from '../../services/auditEngine';
import { VPEEngineDashboard } from '../vpe/VPEEngineDashboard';
import { VSEWorkspace } from '../vpe/VSEWorkspace';
import { VWEWorkspace } from '../vpe/workflow/VWEWorkspace';
import { VNEWorkspace } from '../vpe/notification/VNEWorkspace';
import { VREWorkspace } from '../vpe/reporting/VREWorkspace';
import { VIEWorkspace } from '../vpe/integration/VIEWorkspace';
import { VLEWorkspace } from '../vpe/license/VLEWorkspace';
import { VSECWorkspace } from '../vpe/security/VSECWorkspace';
import { VAIEWorkspace } from '../vpe/ai/VAIEWorkspace';
import { Search, GitCommit, Bell, BarChart3, Network, Key, Shield, Brain } from 'lucide-react';

interface SystemEnginesViewProps {
  selectedEngineId?: string;
  onSelectEngine: (id: string) => void;
  onOpenGlobalSearch?: () => void;
}

export const SystemEnginesView: React.FC<SystemEnginesViewProps> = ({
  selectedEngineId,
  onSelectEngine,
  onOpenGlobalSearch
}) => {
  const [viewMode, setViewMode] = useState<'vaie_workspace' | 'vsec_workspace' | 'vle_workspace' | 'vie_workspace' | 'vre_workspace' | 'vne_workspace' | 'vwe_workspace' | 'vse_workspace' | 'vpe_dashboard' | 'system_engines_grid'>('vaie_workspace');
  const [testingEngineId, setTestingEngineId] = useState<string | null>(null);
  const [engineLatencyMap, setEngineLatencyMap] = useState<Record<string, number>>(
    Object.fromEntries(SYSTEM_ENGINES.map(e => [e.id, e.latencyMs]))
  );

  const activeEngine = SYSTEM_ENGINES.find(e => e.id === selectedEngineId) || SYSTEM_ENGINES[0];

  const testEngineHealth = async (engine: SystemEngineMeta) => {
    setTestingEngineId(engine.id);
    await new Promise(res => setTimeout(res, 350));
    const newLatency = Math.floor(Math.random() * 8) + 1;
    setEngineLatencyMap(prev => ({ ...prev, [engine.id]: newLatency }));
    setTestingEngineId(null);

    auditEngine.logAction(
      `Engine Health Test: ${engine.name}`,
      engine.name,
      `Ping health check passed with latency ${newLatency}ms. All subsystems active.`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-200 font-bold">وضع محركات المنصة:</span>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <button
            onClick={() => setViewMode('vaie_workspace')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vaie_workspace'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>محرك الذكاء الاصطناعي (VAIE)</span>
          </button>

          <button
            onClick={() => setViewMode('vsec_workspace')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vsec_workspace'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>محرك الأمان (VSEC)</span>
          </button>

          <button
            onClick={() => setViewMode('vle_workspace')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vle_workspace'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>محرك التراخيص (VLE)</span>
          </button>

          <button
            onClick={() => setViewMode('vie_workspace')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vie_workspace'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>محرك التكامل (VIE)</span>
          </button>

          <button
            onClick={() => setViewMode('vre_workspace')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vre_workspace'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>محرك التقارير (VRE)</span>
          </button>

          <button
            onClick={() => setViewMode('vne_workspace')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vne_workspace'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>محرك الإشعارات (VNE)</span>
          </button>

          <button
            onClick={() => setViewMode('vwe_workspace')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vwe_workspace'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>محرك مسارات العمل (VWE)</span>
          </button>

          <button
            onClick={() => setViewMode('vse_workspace')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vse_workspace'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>محرك البحث (VSE)</span>
          </button>

          <button
            onClick={() => setViewMode('vpe_dashboard')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'vpe_dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>لوحة تحكم VPE الرئيسية</span>
          </button>

          <button
            onClick={() => setViewMode('system_engines_grid')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'system_engines_grid'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>سجل محركات النظام الـ 15</span>
          </button>
        </div>
      </div>

      {viewMode === 'vaie_workspace' ? (
        <VAIEWorkspace onOpenGlobalSearch={onOpenGlobalSearch} />
      ) : viewMode === 'vsec_workspace' ? (
        <VSECWorkspace onOpenGlobalSearch={onOpenGlobalSearch} />
      ) : viewMode === 'vle_workspace' ? (
        <VLEWorkspace onOpenGlobalSearch={onOpenGlobalSearch} />
      ) : viewMode === 'vie_workspace' ? (
        <VIEWorkspace onOpenGlobalSearch={onOpenGlobalSearch} />
      ) : viewMode === 'vre_workspace' ? (
        <VREWorkspace onOpenGlobalSearch={onOpenGlobalSearch} />
      ) : viewMode === 'vne_workspace' ? (
        <VNEWorkspace onOpenGlobalSearch={onOpenGlobalSearch} />
      ) : viewMode === 'vwe_workspace' ? (
        <VWEWorkspace onOpenGlobalSearch={onOpenGlobalSearch} />
      ) : viewMode === 'vse_workspace' ? (
        <VSEWorkspace onOpenGlobalSearch={onOpenGlobalSearch} />
      ) : viewMode === 'vpe_dashboard' ? (
        <VPEEngineDashboard />
      ) : (
        <>
          {/* Top Banner */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">
                  15 محرك نظام مشترك
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  سليم ومتصل
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-100">بنية محركات نظام المنصة</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                محركات قابلة لإعادة الاستخدام مشتركة عبر كامل منصة Vertex ERP. مستخدمة بواسطة الميزات الذهبية بما في ذلك معالج الإعداد لأول مرة VGF-01.
              </p>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>متوسط زمن الاستجابة: <strong className="text-emerald-400">3.4ms</strong></span>
            </div>
          </div>


      {/* Grid of 15 System Engines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SYSTEM_ENGINES.map(eng => {
          const isSelected = activeEngine.id === eng.id;
          const currentLatency = engineLatencyMap[eng.id] || eng.latencyMs;
          const isTesting = testingEngineId === eng.id;

          return (
            <div
              key={eng.id}
              onClick={() => onSelectEngine(eng.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'bg-blue-950/30 border-blue-500/50 shadow-lg shadow-blue-950/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-100">{eng.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{eng.status === 'active' ? 'نشط' : eng.status === 'standby' ? 'احتياطي' : eng.status}</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {eng.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">الاستجابة: {currentLatency}ms</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    testEngineHealth(eng);
                  }}
                  disabled={isTesting}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-bold border border-slate-700 transition-colors flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>فحص</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Engine Detail Inspector */}
      {activeEngine && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-blue-400 font-bold">محرك المنصة {activeEngine.id}</span>
              <h2 className="text-lg font-bold text-slate-100">الأنظمة الفرعية لـ {activeEngine.name}</h2>
            </div>
            <button
              onClick={() => testEngineHealth(activeEngine)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>فحص تشخيصي</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeEngine.subsystems.map((sub, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200">{sub}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
