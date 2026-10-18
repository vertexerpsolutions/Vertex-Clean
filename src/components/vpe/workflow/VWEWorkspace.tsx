import React, { useState, useEffect } from 'react';
import { 
  WorkflowDefinition, 
  WorkflowInstance, 
  WorkflowCategory, 
  WorkflowPriority, 
  BusinessRule,
  WorkflowAnalyticsMetrics
} from '../../../core/vpe/workflow/WorkflowTypes';
import { workflowEngine } from '../../../core/vpe/workflow/WorkflowEngine';
import { workflowSession } from '../../../core/vpe/workflow/WorkflowSession';
import { workflowRuleEngine } from '../../../core/vpe/workflow/WorkflowRuleEngine';
import { workflowAnalytics } from '../../../core/vpe/workflow/WorkflowAnalytics';
import { WorkflowDesignerCanvas } from './WorkflowDesignerCanvas';
import { 
  GitCommit, 
  Play, 
  Pause, 
  RotateCcw, 
  XCircle, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  BarChart3, 
  Layers, 
  Code, 
  FileText, 
  UserCheck, 
  Send, 
  Plus, 
  Filter, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  Check, 
  CornerUpLeft, 
  TrendingUp, 
  Cpu, 
  Building2, 
  ExternalLink,
  BookOpen,
  Boxes,
  Activity
} from 'lucide-react';

interface VWEWorkspaceProps {
  onOpenGlobalSearch?: () => void;
}

export const VWEWorkspace: React.FC<VWEWorkspaceProps> = ({ onOpenGlobalSearch }) => {
  const [sessionState, setSessionState] = useState(workflowSession.getState());
  const [instances, setInstances] = useState<WorkflowInstance[]>(workflowEngine.getInstances());
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>(workflowEngine.getDefinitions());
  const [rules, setRules] = useState<BusinessRule[]>(workflowRuleEngine.getRules());

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(
    instances.length > 0 ? instances[0] : null
  );

  // Approval Modal state
  const [approvalComment, setApprovalComment] = useState('');
  const [delegateUser, setDelegateUser] = useState('');

  // New Rule form state
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleField, setNewRuleField] = useState('amount');
  const [newRuleVal, setNewRuleVal] = useState('10000');

  useEffect(() => {
    const unsubEngine = workflowEngine.subscribe(() => {
      const updatedInstances = workflowEngine.getInstances();
      setInstances(updatedInstances);
      setDefinitions(workflowEngine.getDefinitions());
      if (selectedInstance) {
        const found = updatedInstances.find(i => i.id === selectedInstance.id);
        if (found) setSelectedInstance(found);
      }
    });

    const unsubSession = workflowSession.subscribe(() => {
      setSessionState(workflowSession.getState());
    });

    return () => {
      unsubEngine();
      unsubSession();
    };
  }, [selectedInstance]);

  const metrics: WorkflowAnalyticsMetrics = workflowAnalytics.computeMetrics(instances);
  const pendingApprovals = workflowSession.getPendingInboxApprovals();

  const handleSelectTab = (tab: any) => {
    workflowSession.setActiveTab(tab);
  };

  const handleApproveInstance = (inst: WorkflowInstance) => {
    workflowEngine.submitApproval(
      inst.id,
      'approved',
      sessionState.currentUser.name,
      sessionState.currentUser.role,
      approvalComment || 'Approved step in Workflow Workspace'
    );
    setApprovalComment('');
  };

  const handleRejectInstance = (inst: WorkflowInstance) => {
    workflowEngine.submitApproval(
      inst.id,
      'rejected',
      sessionState.currentUser.name,
      sessionState.currentUser.role,
      approvalComment || 'Rejected step due to compliance criteria'
    );
    setApprovalComment('');
  };

  const handleDelegateInstance = (inst: WorkflowInstance) => {
    if (!delegateUser) return;
    workflowEngine.submitApproval(
      inst.id,
      'delegated',
      sessionState.currentUser.name,
      sessionState.currentUser.role,
      `Delegated task to ${delegateUser}`,
      delegateUser
    );
    setDelegateUser('');
  };

  const handleEscalateInstance = (inst: WorkflowInstance) => {
    workflowEngine.submitApproval(
      inst.id,
      'escalated',
      sessionState.currentUser.name,
      sessionState.currentUser.role,
      'Escalated to Division Director / Super Administrator'
    );
  };

  const handleCreateRule = () => {
    if (!newRuleName) return;
    const rule: BusinessRule = {
      id: `BR-RULE-${Math.floor(100 + Math.random() * 900)}`,
      name: newRuleName,
      description: `Custom business rule evaluating ${newRuleField}`,
      category: 'FINANCE',
      logicOperator: 'AND',
      conditions: [
        { id: 'c-1', field: newRuleField, operator: '>=', value: Number(newRuleVal) || newRuleVal }
      ],
      isActive: true
    };
    workflowRuleEngine.registerRule(rule);
    setRules(workflowRuleEngine.getRules());
    setNewRuleName('');
  };

  const filteredInstances = instances.filter(i => {
    if (categoryFilter !== 'ALL' && i.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Banner & Core Metrics */}
      <div className="p-5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <GitCommit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-white">VPE-02 Vertex Workflow Engine</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-700/50 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ENGINE OPERATIONAL</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Central Process Engine orchestrating multi-step approvals, automated triggers, rules & ERP integrations.
            </p>
          </div>
        </div>

        {/* Status KPIs */}
        <div className="flex items-center space-x-4">
          <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 uppercase font-bold">Total Instances</div>
            <div className="text-lg font-black text-white">{metrics.totalInstances}</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-indigo-950/50 border border-indigo-800/50 text-center">
            <div className="text-xs text-indigo-300 uppercase font-bold">Running</div>
            <div className="text-lg font-black text-indigo-400">{metrics.runningCount}</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800/50 text-center">
            <div className="text-xs text-emerald-300 uppercase font-bold">Completed</div>
            <div className="text-lg font-black text-emerald-400">{metrics.completedCount}</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-amber-950/50 border border-amber-800/50 text-center">
            <div className="text-xs text-amber-300 uppercase font-bold">Pending Approval</div>
            <div className="text-lg font-black text-amber-400">{pendingApprovals.length}</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 bg-slate-900/80 border-b border-slate-800 flex items-center space-x-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => handleSelectTab('designer')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition-all ${
            sessionState.activeTab === 'designer'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Workflow Designer</span>
        </button>

        <button
          onClick={() => handleSelectTab('instances')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition-all ${
            sessionState.activeTab === 'instances'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Execution & Instances ({instances.length})</span>
        </button>

        <button
          onClick={() => handleSelectTab('inbox')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition-all relative ${
            sessionState.activeTab === 'inbox'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Approval Center</span>
          {pendingApprovals.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-amber-500 text-slate-950 font-black rounded-full">
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleSelectTab('rules')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition-all ${
            sessionState.activeTab === 'rules'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Business Rules</span>
        </button>

        <button
          onClick={() => handleSelectTab('automation')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition-all ${
            sessionState.activeTab === 'automation'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Automation Hub</span>
        </button>

        <button
          onClick={() => handleSelectTab('analytics')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition-all ${
            sessionState.activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Monitoring & Bottlenecks</span>
        </button>

        <button
          onClick={() => handleSelectTab('templates')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition-all ${
            sessionState.activeTab === 'templates'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Templates Library</span>
        </button>

        <button
          onClick={() => handleSelectTab('api_docs')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition-all ${
            sessionState.activeTab === 'api_docs'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Developer API & Docs</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-5">
        {/* TAB 1: DESIGNER */}
        {sessionState.activeTab === 'designer' && (
          <WorkflowDesignerCanvas 
            onLaunchInstance={(instId) => {
              const inst = workflowEngine.getInstanceById(instId);
              if (inst) setSelectedInstance(inst);
              workflowSession.setActiveTab('instances');
            }}
          />
        )}

        {/* TAB 2: EXECUTION & INSTANCES */}
        {sessionState.activeTab === 'instances' && (
          <div className="grid grid-cols-12 gap-5">
            {/* Instance List Filter Sidebar */}
            <div className="col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Workflow Instances</span>
                </h3>

                <button
                  onClick={() => {
                    const inst = workflowEngine.createInstance('DEF-WF-PO-APPROVE', {
                      amount: 32000,
                      poNumber: `PO-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`
                    });
                    setSelectedInstance(inst);
                  }}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Execution</span>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="FINANCE">Finance</option>
                    <option value="PROCUREMENT">Procurement</option>
                    <option value="HR">HR</option>
                    <option value="IT_OPS">IT Ops</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[580px] overflow-auto pr-1">
                {filteredInstances.map((inst) => {
                  const isSel = selectedInstance?.id === inst.id;
                  return (
                    <div
                      key={inst.id}
                      onClick={() => setSelectedInstance(inst)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSel 
                          ? 'border-indigo-500 bg-indigo-950/20' 
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-indigo-400">{inst.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          inst.status === 'running' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                          inst.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          inst.status === 'paused' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {inst.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 truncate">{inst.workflowTitle}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>{inst.company} ({inst.branch})</span>
                        <span>{new Date(inst.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Instance Inspector & Live Stepper */}
            <div className="col-span-8 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-5">
              {selectedInstance ? (
                <>
                  {/* Instance Header Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white">{selectedInstance.workflowTitle}</h3>
                        <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {selectedInstance.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Initiated by <strong className="text-slate-200">{selectedInstance.initiatedBy}</strong> | Branch: <strong className="text-slate-200">{selectedInstance.branch}</strong>
                      </p>
                    </div>

                    {/* Action Execution Controls (Pause, Resume, Rollback, Retry, Cancel, Restart) */}
                    <div className="flex items-center space-x-1.5">
                      {selectedInstance.status === 'running' && (
                        <button
                          onClick={() => workflowEngine.pauseInstance(selectedInstance.id)}
                          className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-semibold flex items-center space-x-1"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </button>
                      )}

                      {selectedInstance.status === 'paused' && (
                        <button
                          onClick={() => workflowEngine.resumeInstance(selectedInstance.id)}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Resume</span>
                        </button>
                      )}

                      <button
                        onClick={() => workflowEngine.retryStep(selectedInstance.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                        title="Retry Current Step"
                      >
                        <RefreshCw className="w-3 h-3 text-cyan-400" />
                        <span>Retry</span>
                      </button>

                      <button
                        onClick={() => workflowEngine.rollbackInstance(selectedInstance.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                        title="Rollback state to previous node"
                      >
                        <CornerUpLeft className="w-3 h-3 text-amber-400" />
                        <span>Rollback</span>
                      </button>

                      <button
                        onClick={() => workflowEngine.restartInstance(selectedInstance.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-400" />
                        <span>Restart</span>
                      </button>

                      <button
                        onClick={() => workflowEngine.cancelInstance(selectedInstance.id, 'User cancelled from UI')}
                        className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center space-x-1"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>

                  {/* Step-by-Step Visual Node Tracker */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step Execution Progress</h4>
                    
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(selectedInstance.nodeStatuses).map(([nodeId, status]) => {
                        return (
                          <div
                            key={nodeId}
                            className={`p-3 rounded-lg border text-xs space-y-1 ${
                              status === 'completed' ? 'border-emerald-800 bg-emerald-950/30 text-emerald-300' :
                              status === 'running' ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-1 ring-indigo-500/40' :
                              status === 'waiting_approval' ? 'border-amber-800 bg-amber-950/40 text-amber-300 animate-pulse' :
                              status === 'failed' ? 'border-rose-800 bg-rose-950/30 text-rose-300' :
                              'border-slate-800 bg-slate-900 text-slate-500'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span className="truncate">{nodeId}</span>
                              <span className="uppercase text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800">
                                {status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Context Data & Execution Logs Stream */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Context Data */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workflow Context Payload</h4>
                      <pre className="text-[11px] font-mono p-3 rounded bg-slate-900 text-indigo-300 border border-slate-800 overflow-x-auto max-h-48">
                        {JSON.stringify(selectedInstance.contextData, null, 2)}
                      </pre>
                    </div>

                    {/* Execution Stream Logs */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Execution Audit Logs</h4>
                      <div className="space-y-1.5 max-h-48 overflow-auto text-[11px] pr-1">
                        {selectedInstance.executionLogs.map((log) => (
                          <div key={log.id} className="p-2 rounded bg-slate-900 border border-slate-800/80">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <span className={`uppercase font-bold ${
                                log.level === 'success' ? 'text-emerald-400' :
                                log.level === 'warn' ? 'text-amber-400' :
                                log.level === 'error' ? 'text-rose-400' : 'text-indigo-400'
                              }`}>{log.level}</span>
                            </div>
                            <div className="text-slate-200 mt-0.5">{log.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-500 text-sm">
                  Select a workflow instance to view execution status and controls.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: APPROVAL CENTER */}
        {sessionState.activeTab === 'inbox' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Pending Approval Queue</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Logged in as <strong className="text-slate-200">{sessionState.currentUser.name}</strong> ({sessionState.currentUser.role}). Review pending items.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingApprovals.length} Tasks Require Sign-off
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-white">All approval tasks cleared!</p>
                <p className="text-xs text-slate-500 mt-1">There are no pending workflow approvals requiring your sign-off.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((inst) => (
                  <div key={inst.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-white">{inst.workflowTitle}</h4>
                          <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded text-indigo-400 border border-slate-800">
                            {inst.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Initiated by {inst.initiatedBy} | Department: {inst.department} | Priority: <strong className="text-amber-400">{inst.priority}</strong>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveInstance(inst)}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleRejectInstance(inst)}
                          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleEscalateInstance(inst)}
                          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700"
                        >
                          <span>Escalate</span>
                        </button>
                      </div>
                    </div>

                    {/* Delegation input & comment box */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Approval Comment</label>
                        <input
                          type="text"
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          placeholder="Enter audit sign-off memo..."
                          className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                        />
                      </div>

                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Delegate Approval To</label>
                          <input
                            type="text"
                            value={delegateUser}
                            onChange={(e) => setDelegateUser(e.target.value)}
                            placeholder="Target User Name / ID"
                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                          />
                        </div>
                        <button
                          onClick={() => handleDelegateInstance(inst)}
                          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs"
                        >
                          Delegate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BUSINESS RULES */}
        {sessionState.activeTab === 'rules' && (
          <div className="grid grid-cols-12 gap-5">
            {/* Create Rule Panel */}
            <div className="col-span-4 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Create Business Rule</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rule Name</label>
                  <input
                    type="text"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="e.g. High Value CapEx Routing"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Condition Target Field</label>
                  <select
                    value={newRuleField}
                    onChange={(e) => setNewRuleField(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="amount">Amount ($)</option>
                    <option value="branch">Branch Office</option>
                    <option value="department">Department</option>
                    <option value="company">Company Entity</option>
                    <option value="docType">Document Type</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Threshold Value</label>
                  <input
                    type="text"
                    value={newRuleVal}
                    onChange={(e) => setNewRuleVal(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>

                <button
                  onClick={handleCreateRule}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs shadow-md"
                >
                  Register Business Rule
                </button>
              </div>
            </div>

            {/* Active Rules List */}
            <div className="col-span-8 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Active Enterprise Business Rules ({rules.length})</span>
              </h3>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{rule.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                        {rule.id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{rule.description}</p>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                      <span className="font-bold text-indigo-300">Conditions ({rule.logicOperator}):</span>
                      {rule.conditions.map(c => (
                        <span key={c.id} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                          {c.field} {c.operator} {c.value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUTOMATION HUB */}
        {sessionState.activeTab === 'automation' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Automated Cross-Engine Triggers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure automated actions executed seamlessly without manual intervention during workflow transitions.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <FileText className="w-6 h-6 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">Create Document</h4>
                <p className="text-xs text-slate-400">Generates purchase orders, invoices, or onboarding packets.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <Code className="w-6 h-6 text-indigo-400" />
                <h4 className="text-xs font-bold text-white">Invoke Webhook API</h4>
                <p className="text-xs text-slate-400">Dispatches HTTP POST payloads to external microservices.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <Cpu className="w-6 h-6 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">ERP Integration Pipeline</h4>
                <p className="text-xs text-slate-400">Synchronizes General Ledger balances and stock levels.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MONITORING & BOTTLENECKS */}
        {sessionState.activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 font-bold uppercase">Avg Execution Duration</div>
                <div className="text-2xl font-black text-indigo-400">{metrics.avgExecutionTimeSeconds}s</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 font-bold uppercase">Avg Approval Turnaround</div>
                <div className="text-2xl font-black text-emerald-400">{metrics.avgApprovalTimeHours} hrs</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 font-bold uppercase">Bottleneck Nodes Identified</div>
                <div className="text-2xl font-black text-amber-400">{metrics.bottlenecks.length}</div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Identified Bottlenecks & Execution Delays</span>
              </h4>

              <div className="space-y-2">
                {metrics.bottlenecks.map(b => (
                  <div key={b.nodeId} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{b.nodeTitle}</span>
                      <span className="ml-2 font-mono text-[10px] text-indigo-400">({b.nodeId})</span>
                    </div>
                    <div className="text-amber-300 font-semibold">
                      Pending Tasks: {b.pendingTasksCount} | Avg Delay: {b.avgTimeSpentSeconds}s
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: TEMPLATES LIBRARY */}
        {sessionState.activeTab === 'templates' && (
          <div className="grid grid-cols-3 gap-4">
            {workflowEngine.getTemplates().map(tpl => (
              <div key={tpl.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-400">{tpl.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase font-bold">
                      {tpl.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">{tpl.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{tpl.description}</p>
                </div>

                <button
                  onClick={() => {
                    const inst = workflowEngine.createInstance(`DEF-${tpl.definition.code}`);
                    setSelectedInstance(inst);
                    workflowSession.setActiveTab('instances');
                  }}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs flex items-center justify-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Template Instance</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: DEVELOPER API & ARCHITECTURE SUMMARY */}
        {sessionState.activeTab === 'api_docs' && (
          <div className="space-y-5 text-xs text-slate-300">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>VPE-02 Vertex Workflow Engine Architecture & Developer Guide</span>
              </h3>
              <p>
                The Vertex Workflow Engine (VWE) is the central business process engine for the Vertex ERP Platform. It supports visual workflow designing, multi-level approvals, business rule evaluation, automated actions, and full execution management.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase font-mono">TypeScript SDK API Example</h4>
              <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[11px] overflow-x-auto">
{`import { workflowEngine } from '@/core/vpe/workflow';

// 1. Create instance from registered workflow definition
const instance = workflowEngine.createInstance('DEF-WF-PO-APPROVE', {
  poNumber: 'PO-2026-9901',
  amount: 45000.00
}, 'Alex Mercer (Finance Director)');

// 2. Submit multi-level approval action
workflowEngine.submitApproval(
  instance.id,
  'approved',
  'Victoria Sterling',
  'VP of Finance',
  'Approved under Q3 CapEx authorization'
);

// 3. Pause / Resume / Rollback / Retry
workflowEngine.pauseInstance(instance.id);
workflowEngine.resumeInstance(instance.id);
workflowEngine.rollbackInstance(instance.id);`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
