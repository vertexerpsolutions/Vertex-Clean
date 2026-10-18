import React, { useState } from 'react';
import { 
  Network, 
  Server, 
  Globe, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  Plus, 
  Play, 
  Activity, 
  Search, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  FileSpreadsheet, 
  Mail, 
  Send, 
  Cloud, 
  CreditCard, 
  QrCode, 
  Building2, 
  ChevronRight, 
  Sliders, 
  BookOpen, 
  Code, 
  Layers, 
  Terminal, 
  Radio
} from 'lucide-react';
import { 
  integrationManager, 
  IntegrationConnection, 
  ConnectorDefinition, 
  WebhookEndpoint, 
  IntegrationSyncTask, 
  IntegrationErrorQueueItem, 
  ProtocolType, 
  AuthType 
} from '../../../core/vpe/integration';

interface VIEWorkspaceProps {
  onOpenGlobalSearch?: () => void;
}

export const VIEWorkspace: React.FC<VIEWorkspaceProps> = ({ onOpenGlobalSearch }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'connectors' | 'connections' | 'webhooks' | 'error_queue' | 'docs'>('overview');
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('CONN-LIVE-EXCEL-01');

  // New connection modal state
  const [isCreateConnOpen, setIsCreateConnOpen] = useState<boolean>(false);
  const [newConnName, setNewConnName] = useState<string>('Custom ERP API Gateway');
  const [newConnEndpoint, setNewConnEndpoint] = useState<string>('https://api.external-partner.com/v1/sync');
  const [newConnConnectorId, setNewConnConnectorId] = useState<string>('CONN-EXCEL-01');

  // Trigger state refresh
  const connectors = integrationManager.getConnectors();
  const connections = integrationManager.getConnections();
  const webhooks = integrationManager.getWebhooks();
  const syncTasks = integrationManager.getSyncTasks();
  const errorQueue = integrationManager.getErrorQueue();

  const handleTestConnection = (id: string) => {
    const res = integrationManager.testConnection(id);
    setTestResultMsg(res.message);
    setTimeout(() => setTestResultMsg(null), 4000);
  };

  const handleTriggerManualSync = (id: string) => {
    const task = integrationManager.triggerManualSync(id);
    setTestResultMsg(`Manual sync triggered: Task ${task.id} processed ${task.recordsProcessed} records in ${task.durationMs}ms.`);
    setTimeout(() => setTestResultMsg(null), 4000);
  };

  const handleRetryError = (errorId: string) => {
    integrationManager.retryErrorItem(errorId);
    setTestResultMsg(`Error item ${errorId} retried and resolved successfully.`);
    setTimeout(() => setTestResultMsg(null), 4000);
  };

  const handleCreateConnection = () => {
    const conn: IntegrationConnection = {
      id: `CONN-LIVE-${Date.now().toString().slice(-4)}`,
      connectorId: newConnConnectorId,
      name: newConnName,
      endpointUrl: newConnEndpoint,
      authType: 'OAUTH2',
      status: 'ONLINE',
      rateLimitPerMin: 120,
      currentRequestsThisMin: 0,
      lastSyncAt: new Date().toISOString(),
      nextSyncAt: 'REALTIME',
      syncMode: 'REALTIME',
      syncDirection: 'TWO_WAY',
      retryAttemptsRemaining: 3,
      encryptedCredentialsSet: true,
      companyId: 'Vertex Global Corp',
      branchId: 'HQ-NY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    integrationManager.saveConnection(conn);
    setIsCreateConnOpen(false);
    setTestResultMsg(`Successfully created new integration connection "${conn.name}".`);
    setTimeout(() => setTestResultMsg(null), 4000);
  };

  const getConnectorIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'Mail': return <Mail className="w-5 h-5 text-blue-600" />;
      case 'Globe': return <Globe className="w-5 h-5 text-amber-600" />;
      case 'Send': return <Send className="w-5 h-5 text-indigo-600" />;
      case 'Server': return <Server className="w-5 h-5 text-purple-600" />;
      case 'Cloud': return <Cloud className="w-5 h-5 text-sky-600" />;
      case 'CreditCard': return <CreditCard className="w-5 h-5 text-violet-600" />;
      case 'QrCode': return <QrCode className="w-5 h-5 text-teal-600" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-rose-600" />;
      default: return <Network className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* VIE Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-cyan-600 rounded-lg shadow-md">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">VPE-05 Vertex Integration Engine (VIE)</h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                    v5.0.0 Operational
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Central Integration Hub, REST/GraphQL Gateway, Built-in Cloud Connectors, Bi-Directional Sync & Error Recovery
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenGlobalSearch && (
              <button
                onClick={onOpenGlobalSearch}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Search Gateway (VSE)</span>
              </button>
            )}

            <button
              onClick={() => setIsCreateConnOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Integration Link</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 mt-6 pt-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Hub Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('connectors')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'connectors'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Built-in Connectors ({connectors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('connections')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'connections'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Active Connections ({connections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'webhooks'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Webhooks & APIs</span>
          </button>

          <button
            onClick={() => setActiveTab('error_queue')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'error_queue'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Error Recovery ({errorQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'docs'
                ? 'bg-cyan-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Developer Guide</span>
          </button>
        </div>
      </div>

      {testResultMsg && (
        <div className="bg-cyan-50 border border-cyan-200 text-cyan-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            <span className="font-semibold">{testResultMsg}</span>
          </div>
          <button onClick={() => setTestResultMsg(null)} className="text-cyan-700 hover:text-cyan-900 text-xs">Dismiss</button>
        </div>
      )}

      {/* TAB 1: HUB OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Active External Endpoints</span>
                <Server className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{connections.length} Online</div>
              <div className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Rate Limit Compliance</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Supported Data Connectors</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{connectors.length} Built-in</div>
              <div className="text-xs text-slate-500 font-medium">Excel, Workspace, Tax APIs, Hardware</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Registered Webhooks</span>
                <Radio className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{webhooks.length} Active</div>
              <div className="text-xs text-slate-500 font-medium">1,420 Events Delivered</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Error Queue Status</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{errorQueue.length} Pending</div>
              <div className="text-xs text-rose-600 font-medium">Auto-retry active (Max 5 attempts)</div>
            </div>
          </div>

          {/* Sync Tasks Activity Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Real-time Data Exchange Activity Log</h3>
                <p className="text-xs text-slate-500">Live sync task telemetry across all external integrations</p>
              </div>
              <button
                onClick={() => handleTriggerManualSync('CONN-LIVE-EXCEL-01')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Excel Ledger Now</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-200 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3">Task ID</th>
                    <th className="p-3">Connector / Endpoint</th>
                    <th className="p-3">Sync Type</th>
                    <th className="p-3">Direction</th>
                    <th className="p-3 text-right">Records</th>
                    <th className="p-3 text-right">Duration</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {syncTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-indigo-600">{task.id}</td>
                      <td className="p-3 font-medium text-slate-900">{task.connectorName}</td>
                      <td className="p-3 text-slate-600">{task.syncType}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded">
                          {task.direction}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">{task.recordsProcessed}</td>
                      <td className="p-3 text-right font-mono text-cyan-700">{task.durationMs} ms</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUILT-IN CONNECTORS */}
      {activeTab === 'connectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectors.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-cyan-400 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    {getConnectorIcon(c.iconName)}
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                    {c.protocol}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description}</p>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Authentication:</span>
                    <strong className="text-slate-800">{c.authType}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <strong className="text-slate-800">{c.category}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {c.supportedDataFormats.map(fmt => (
                    <span key={fmt} className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-50 text-cyan-800 rounded">
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">v{c.version}</span>
                <button
                  onClick={() => {
                    setNewConnConnectorId(c.id);
                    setIsCreateConnOpen(true);
                  }}
                  className="text-cyan-600 hover:text-cyan-800 font-bold inline-flex items-center space-x-1"
                >
                  <span>Configure Link</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ACTIVE CONNECTIONS */}
      {activeTab === 'connections' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active External Integration Links</h2>
              <p className="text-xs text-slate-500">Validate SSL endpoints, trigger manual syncs, and monitor rate limits.</p>
            </div>
            <button
              onClick={() => setIsCreateConnOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Connection</span>
            </button>
          </div>

          <div className="space-y-4">
            {connections.map(conn => (
              <div key={conn.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                        {conn.status}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{conn.name}</h3>
                    </div>
                    <div className="text-xs font-mono text-cyan-700">{conn.endpointUrl}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestConnection(conn.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Test Endpoint</span>
                    </button>

                    <button
                      onClick={() => handleTriggerManualSync(conn.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Sync Now</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
                  <div>Auth Method: <strong className="text-slate-800">{conn.authType}</strong></div>
                  <div>Sync Mode: <strong className="text-slate-800">{conn.syncMode}</strong></div>
                  <div>Direction: <strong className="text-slate-800">{conn.syncDirection}</strong></div>
                  <div>Rate Limit: <strong className="text-slate-800">{conn.currentRequestsThisMin} / {conn.rateLimitPerMin} req/min</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Registered Webhook Listener Endpoints</h2>
            <p className="text-xs text-slate-500">Outbound realtime webhook dispatchers signed with HMAC SHA-256 secrets.</p>
          </div>

          <div className="space-y-4">
            {webhooks.map(wh => (
              <div key={wh.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded">
                        {wh.id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{wh.name}</h3>
                    </div>
                    <div className="text-xs font-mono text-cyan-700">{wh.targetUrl}</div>
                  </div>

                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                    Active Listener
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Subscribed Platform Events:</span>
                  <div className="flex flex-wrap gap-1">
                    {wh.subscribedEvents.map(evt => (
                      <span key={evt} className="px-2 py-0.5 text-[10px] font-mono bg-slate-200 text-slate-800 rounded">
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ERROR QUEUE */}
      {activeTab === 'error_queue' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Integration Failure & Error Recovery Queue</h2>
            <p className="text-xs text-slate-500">Diagnostics and 1-click retry mechanisms for failed external API calls.</p>
          </div>

          <div className="space-y-4">
            {errorQueue.map(item => (
              <div key={item.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="font-mono font-bold text-xs text-rose-900">{item.id}</span>
                    <span className="font-bold text-xs text-slate-900">{item.connectorName}</span>
                  </div>

                  <button
                    onClick={() => handleRetryError(item.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry API Call</span>
                  </button>
                </div>

                <div className="text-xs font-semibold text-rose-800 bg-white p-3 rounded-lg border border-rose-200">
                  {item.errorReason}
                </div>

                <div className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(item.payload, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DEVELOPER GUIDE */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Vertex Integration Engine (VIE) Developer Guide</h2>
            <p className="text-xs text-slate-500">Connector Development Framework & API Gateway Reference.</p>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 bg-slate-900 text-slate-100 rounded-lg space-y-2 font-mono">
              <div className="text-cyan-400 font-bold">// Trigger external API integration programmatically</div>
              <div>import &#123; integrationManager &#125; from './core/vpe/integration';</div>
              <br />
              <div>const res = integrationManager.testConnection('CONN-LIVE-EXCEL-01');</div>
              <div>console.log(res.success, res.latencyMs);</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Security & Credential Vault</h4>
                <p className="text-slate-600">All OAuth tokens and private RSA certificates are encrypted using AES-256 before persistence. Unhandled API failures auto-route to the Error Recovery Queue.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">VSE Search Indexing</h4>
                <p className="text-slate-600">All connector definitions and live endpoints are dynamically indexed into VPE-01 Universal Search Engine for global platform discovery.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Connection Modal */}
      {isCreateConnOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Register New Integration Connection</h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Connection Name</label>
                <input
                  type="text"
                  value={newConnName}
                  onChange={e => setNewConnName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Endpoint URL</label>
                <input
                  type="text"
                  value={newConnEndpoint}
                  onChange={e => setNewConnEndpoint(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Target Connector</label>
                <select
                  value={newConnConnectorId}
                  onChange={e => setNewConnConnectorId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                >
                  {connectors.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.protocol})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsCreateConnOpen(false)}
                className="px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConnection}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs shadow-sm"
              >
                Save Integration Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
