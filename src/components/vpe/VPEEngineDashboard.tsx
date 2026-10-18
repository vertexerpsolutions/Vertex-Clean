import { 
  Activity, 
  AlertTriangle, 
  Award, 
  BarChart3, 
  Box, 
  CheckCircle2, 
  Cpu, 
  Database, 
  FileText, 
  HardDrive, 
  Info, 
  Layers, 
  Lock, 
  Pause, 
  Play, 
  RefreshCw, 
  RotateCcw, 
  Send, 
  Server, 
  ShieldCheck, 
  Square, 
  Terminal, 
  Zap 
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  EngineContract, 
  engineContext, 
  EngineHealthState, 
  engineManager, 
  HealthCheckResult, 
  registerStandardPlatformEngines, 
  VPEOverallHealth 
} from '../../core/vpe';

export const VPEEngineDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lifecycle' | 'monitoring' | 'security' | 'eventbus' | 'documentation'>('dashboard');
  const [engines, setEngines] = useState<EngineContract[]>([]);
  const [healthInfo, setHealthInfo] = useState<VPEOverallHealth | null>(null);
  const [selectedEngineId, setSelectedEngineId] = useState<string | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, HealthCheckResult>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customEventPayload, setCustomEventPayload] = useState<string>('{"trigger": "manual_test", "priority": "high"}');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  const refreshAllData = async () => {
    registerStandardPlatformEngines();
    await engineManager.initializeAll();
    const all = engineManager.getAllEngines();
    setEngines([...all]);
    setHealthInfo(engineManager.getPlatformHealth());
    setAuditLogs(engineContext.getAuditLogs());

    if (!selectedEngineId && all.length > 0) {
      setSelectedEngineId(all[0].config.id);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(() => {
      setEngines([...engineManager.getAllEngines()]);
      setHealthInfo(engineManager.getPlatformHealth());
      setAuditLogs(engineContext.getAuditLogs());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const selectedEngine = engines.find(e => e.config.id === selectedEngineId) || engines[0];

  const handleStart = async (id: string) => {
    await engineManager.startEngine(id);
    showToast(`Engine ${id} successfully started.`);
    refreshAllData();
  };

  const handlePause = async (id: string) => {
    await engineManager.pauseEngine(id);
    showToast(`Engine ${id} paused.`);
    refreshAllData();
  };

  const handleResume = async (id: string) => {
    await engineManager.resumeEngine(id);
    showToast(`Engine ${id} resumed.`);
    refreshAllData();
  };

  const handleRestart = async (id: string) => {
    await engineManager.restartEngine(id);
    showToast(`Engine ${id} restarted successfully.`);
    refreshAllData();
  };

  const handleShutdown = async (id: string) => {
    await engineManager.shutdownEngine(id);
    showToast(`Engine ${id} safely shut down.`);
    refreshAllData();
  };

  const handleHealthCheck = async (id: string) => {
    const res = await engineManager.checkEngineHealth(id);
    if (res) {
      setHealthMap(prev => ({ ...prev, [id]: res }));
      showToast(`Health Check for ${id}: ${res.status.toUpperCase()} (${res.latencyMs}ms)`);
    }
  };

  const handlePublishEvent = () => {
    try {
      const parsed = JSON.parse(customEventPayload);
      engineContext.publishEvent('vpe:manual_test', parsed, selectedEngine ? selectedEngine.config.id : 'VPE-Dashboard');
      showToast('Custom Event published to VPE Event Bus.');
      setAuditLogs(engineContext.getAuditLogs());
    } catch (err) {
      showToast('Invalid JSON payload for event broadcast.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Cpu className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono text-xs font-bold">
                VPE CORE
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>FOUNDATION ACTIVE</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">v1.0.0-GOLD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Vertex Platform Engines (VPE) Framework
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Standardized infrastructure layer managing lifecycle, dependency resolution, security isolation, inter-engine event routing, and real-time telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={refreshAllData}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center space-x-1.5"
            >
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>Refresh Telemetry</span>
            </button>
            <button
              onClick={() => setActiveTab('documentation')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>VPE Docs & Spec</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: '1. Engine Overview', icon: BarChart3 },
            { id: 'lifecycle', label: '2. Lifecycle Control', icon: Play },
            { id: 'monitoring', label: '3. Performance & Telemetry', icon: Activity },
            { id: 'security', label: '4. Security & Permissions', icon: ShieldCheck },
            { id: 'eventbus', label: '5. Inter-Engine Event Bus', icon: Zap },
            { id: 'documentation', label: '6. Architecture Spec', icon: FileText }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Summary */}
      {healthInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
            <span className="text-[11px] text-slate-400 uppercase">Registered Engines</span>
            <p className="text-2xl font-black text-slate-100">{healthInfo.installedEngines}</p>
            <p className="text-[10px] text-emerald-400">{healthInfo.runningEngines} Active Running</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-1">
            <span className="text-[11px] text-emerald-400 uppercase">Platform Latency</span>
            <p className="text-2xl font-black text-emerald-400">{healthInfo.averageLatencyMs} ms</p>
            <p className="text-[10px] text-slate-400">Average IPC Health Latency</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-xl space-y-1">
            <span className="text-[11px] text-indigo-400 uppercase">Memory Footprint</span>
            <p className="text-2xl font-black text-indigo-400">{healthInfo.totalMemoryUsageMB} MB</p>
            <p className="text-[10px] text-slate-400">Avg CPU: {healthInfo.avgCpuUsagePct}%</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-1">
            <span className="text-[11px] text-amber-400 uppercase">Platform Status</span>
            <p className="text-2xl font-black text-amber-400 uppercase">{healthInfo.healthState}</p>
            <p className="text-[10px] text-slate-400">Zero Unhandled Failures</p>
          </div>
        </div>
      )}

      {/* TAB 01: ENGINE OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Box className="w-5 h-5 text-indigo-400" />
                  <span>Installed Platform Engines Registry</span>
                </h3>
                <p className="text-xs text-slate-400">All system engines automatically registered in VPE EngineRegistry with dependency graphs.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engines.map(eng => {
                const status = eng.getStatus();
                const metrics = eng.getMetrics();
                const isRunning = status === 'running';

                return (
                  <div
                    key={eng.config.id}
                    onClick={() => setSelectedEngineId(eng.config.id)}
                    className={`p-4 rounded-xl bg-slate-950 border transition-all cursor-pointer space-y-3 ${
                      selectedEngineId === eng.config.id
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-slate-900/90'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">{eng.config.id}</span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                        isRunning ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{eng.config.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{eng.config.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <div>Version: <strong className="text-slate-200">v{eng.config.version}</strong></div>
                      <div>RAM: <strong className="text-indigo-400">{metrics.memoryUsageMB}MB</strong></div>
                      <div>CPU: <strong className="text-amber-400">{metrics.cpuUsagePct}%</strong></div>
                      <div>Calls: <strong className="text-emerald-400">{metrics.totalCalls}</strong></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span>Category: {eng.config.category}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHealthCheck(eng.config.id);
                        }}
                        className="text-indigo-400 hover:underline flex items-center space-x-1"
                      >
                        <Activity className="w-3 h-3" />
                        <span>Ping Health</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 02: LIFECYCLE CONTROL */}
      {activeTab === 'lifecycle' && selectedEngine && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Play className="w-5 h-5 text-indigo-400" />
                  <span>Engine Lifecycle & Operations Control: <span className="text-indigo-400 font-mono">{selectedEngine.config.name}</span></span>
                </h3>
                <p className="text-xs text-slate-400">Direct state transitions obeying standard EngineContract specification.</p>
              </div>

              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="text-slate-400">Selected:</span>
                <select
                  value={selectedEngine.config.id}
                  onChange={e => setSelectedEngineId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100"
                >
                  {engines.map(e => (
                    <option key={e.config.id} value={e.config.id}>{e.config.id} - {e.config.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lifecycle Control Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                onClick={() => handleStart(selectedEngine.config.id)}
                disabled={selectedEngine.getStatus() === 'running'}
                className="p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all disabled:opacity-40"
              >
                <Play className="w-5 h-5 text-emerald-400" />
                <span>START</span>
              </button>

              <button
                onClick={() => handlePause(selectedEngine.config.id)}
                disabled={selectedEngine.getStatus() !== 'running'}
                className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all disabled:opacity-40"
              >
                <Pause className="w-5 h-5 text-amber-400" />
                <span>PAUSE</span>
              </button>

              <button
                onClick={() => handleResume(selectedEngine.config.id)}
                disabled={selectedEngine.getStatus() !== 'paused'}
                className="p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all disabled:opacity-40"
              >
                <Play className="w-5 h-5 text-blue-400" />
                <span>RESUME</span>
              </button>

              <button
                onClick={() => handleRestart(selectedEngine.config.id)}
                className="p-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all"
              >
                <RotateCcw className="w-5 h-5 text-indigo-400" />
                <span>RESTART</span>
              </button>

              <button
                onClick={() => handleShutdown(selectedEngine.config.id)}
                disabled={selectedEngine.getStatus() === 'stopped'}
                className="p-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all disabled:opacity-40"
              >
                <Square className="w-5 h-5 text-rose-400" />
                <span>SHUTDOWN</span>
              </button>
            </div>

            {/* Health Status Inspection */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold uppercase">Real-Time Health Inspection</span>
                <button
                  onClick={() => handleHealthCheck(selectedEngine.config.id)}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px]"
                >
                  Run Deep Diagnostics
                </button>
              </div>

              {healthMap[selectedEngine.config.id] ? (
                <div className="space-y-2 text-slate-300 pt-1">
                  <p>Health Status: <strong className="text-emerald-400 uppercase">{healthMap[selectedEngine.config.id].status}</strong></p>
                  <p>Roundtrip Latency: <strong className="text-amber-400">{healthMap[selectedEngine.config.id].latencyMs}ms</strong></p>
                  <p>Message: {healthMap[selectedEngine.config.id].message}</p>
                </div>
              ) : (
                <p className="text-slate-500 italic">Click "Run Deep Diagnostics" to ping engine subsystems.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 03: PERFORMANCE & TELEMETRY */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Real-Time Engine Telemetry & Resource Monitor</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3">Engine ID & Name</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">CPU Usage</th>
                    <th className="pb-3">RAM Memory</th>
                    <th className="pb-3">Execution Time</th>
                    <th className="pb-3">Total Operations</th>
                    <th className="pb-3 text-right">Errors / Warnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {engines.map(eng => {
                    const m = eng.getMetrics();
                    const st = eng.getStatus();
                    return (
                      <tr key={eng.config.id} className="hover:bg-slate-950/50">
                        <td className="py-3 text-slate-200">
                          <div className="font-bold">{eng.config.name}</div>
                          <div className="text-[10px] text-indigo-400">{eng.config.id}</div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            st === 'running' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {st}
                          </span>
                        </td>
                        <td className="py-3 text-amber-400 font-bold">{m.cpuUsagePct}%</td>
                        <td className="py-3 text-indigo-400 font-bold">{m.memoryUsageMB} MB</td>
                        <td className="py-3 text-slate-300">{m.executionTimeMs} ms</td>
                        <td className="py-3 text-emerald-400 font-bold">{m.totalCalls}</td>
                        <td className="py-3 text-right">
                          <span className="text-rose-400 font-bold">{m.errorCount}</span> / <span className="text-amber-400 font-bold">{m.warningCount}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 04: SECURITY & PERMISSIONS */}
      {activeTab === 'security' && selectedEngine && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Engine Security & Permissions Matrix: <span className="text-emerald-400 font-mono">{selectedEngine.config.name}</span></span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold uppercase block">Resource Access Permissions</span>
                <p>Database Access: <strong className={selectedEngine.config.permissions.allowDatabaseAccess ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedEngine.config.permissions.allowDatabaseAccess ? 'ALLOWED' : 'DENIED'}
                </strong></p>
                <p>Network Access: <strong className={selectedEngine.config.permissions.allowNetworkAccess ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedEngine.config.permissions.allowNetworkAccess ? 'ALLOWED' : 'DENIED'}
                </strong></p>
                <p>System Commands: <strong className={selectedEngine.config.permissions.allowSystemCommands ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedEngine.config.permissions.allowSystemCommands ? 'ALLOWED' : 'RESTRICTED'}
                </strong></p>
                <p>Max Memory Ceiling: <strong className="text-indigo-400">{selectedEngine.config.permissions.maxMemoryMB} MB</strong></p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-indigo-400 font-bold uppercase block">Isolation & Sandboxing Policy</span>
                <p className="text-slate-300 leading-relaxed">
                  Engine executes in an isolated sandbox with zero global variable pollution. Inter-engine calls strictly route through the VPE Event Bus and Service Context.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 05: INTER-ENGINE EVENT BUS */}
      {activeTab === 'eventbus' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Inter-Engine Event Bus Inspector</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono">
              <span className="text-amber-400 font-bold uppercase block">Publish Manual Inter-Engine Test Event</span>
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={customEventPayload}
                  onChange={e => setCustomEventPayload(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={handlePublishEvent}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Event to VPE Bus</span>
                </button>
              </div>
            </div>

            {/* Audit Logs Stream */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">Recent Inter-Engine Event Audit Logs</span>
              <div className="max-h-60 overflow-y-auto space-y-1.5 font-mono text-[11px] custom-scrollbar">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-slate-300">
                    <div>
                      <span className="text-indigo-400 font-bold">{log.engineId}:</span> <span className="text-slate-100 font-bold">{log.action}</span> - <span className="text-slate-400">{log.details}</span>
                    </div>
                    <span className="text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 06: DOCUMENTATION & SPEC SPECIFICATION */}
      {activeTab === 'documentation' && (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/60 border-2 border-indigo-500/50 shadow-2xl space-y-8 animate-fade-in">
          <div className="space-y-3 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>VERTEX PLATFORM ENGINES (VPE) FOUNDATION COMPLETED</span>
            </div>
            <h2 className="text-3xl font-black text-slate-100 tracking-tight">
              Vertex Platform Engines Architecture Specification
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Standardized infrastructure layer powering all background operations, system engines, and future AI capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-2">
                1. Framework Folder Structure
              </h4>
              <pre className="text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
{`src/core/vpe/
├── EngineTypes.ts         # Standard Engine contracts & types
├── EngineContext.ts       # Event bus, shared context & logger
├── EngineLifecycle.ts     # State transition validator
├── EngineBase.ts          # Abstract class contract
├── EngineRegistry.ts     # Engine discovery & registration
├── EngineConfiguration.ts# Security policies & permissions
├── EngineManager.ts       # Master orchestrator singleton
└── standardEngines.ts    # Standard VPE system engines`}
              </pre>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-2">
                2. Engine Development Guide
              </h4>
              <p className="text-slate-300 leading-relaxed">
                To create a new engine in Vertex Platform, extend <code className="text-amber-400">EngineBase</code> and override lifecycle hooks:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li><strong className="text-slate-200">onInitialize():</strong> Setup configuration and load assets.</li>
                <li><strong className="text-slate-200">onStart():</strong> Launch workers, timers, or event listeners.</li>
                <li><strong className="text-slate-200">onHealthCheck():</strong> Return status, latency, and subsystem checks.</li>
                <li><strong className="text-slate-200">onShutdown():</strong> Clean up resources safely.</li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 max-w-4xl mx-auto text-center space-y-2 font-mono">
            <span className="text-emerald-400 text-lg font-black block">✔ Vertex Platform Engines Foundation Completed</span>
            <p className="text-xs text-slate-400">Architecture Optimized • Production Ready • Scalable Infrastructure Layer</p>
          </div>
        </div>
      )}
    </div>
  );
};
