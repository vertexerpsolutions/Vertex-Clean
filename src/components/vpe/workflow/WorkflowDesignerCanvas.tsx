import React, { useState } from 'react';
import { 
  WorkflowDefinition, 
  WorkflowNode, 
  WorkflowNodeType, 
  WorkflowPriority, 
  WorkflowCategory 
} from '../../../core/vpe/workflow/WorkflowTypes';
import { workflowEngine } from '../../../core/vpe/workflow/WorkflowEngine';
import { 
  Play, 
  Square, 
  CheckSquare, 
  GitCompare, 
  ShieldCheck, 
  Bell, 
  Clock, 
  GitBranch, 
  GitMerge, 
  Plus, 
  Trash2, 
  Settings, 
  Save, 
  Zap,
  ArrowRight,
  HelpCircle,
  FileCode,
  Sparkles
} from 'lucide-react';

interface WorkflowDesignerCanvasProps {
  definition?: WorkflowDefinition;
  onSave?: (def: WorkflowDefinition) => void;
  onLaunchInstance?: (defId: string) => void;
}

const NODE_TYPES: Array<{ type: WorkflowNodeType; label: string; icon: any; color: string; desc: string }> = [
  { type: 'start', label: 'Start Node', icon: Play, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50', desc: 'Entry trigger event' },
  { type: 'task', label: 'Manual Task', icon: CheckSquare, color: 'text-blue-400 bg-blue-950/60 border-blue-700/50', desc: 'Human task assignment' },
  { type: 'decision', label: 'Decision Node', icon: GitCompare, color: 'text-amber-400 bg-amber-950/60 border-amber-700/50', desc: 'Conditional routing rule' },
  { type: 'approval', label: 'Approval Gate', icon: ShieldCheck, color: 'text-indigo-400 bg-indigo-950/60 border-indigo-700/50', desc: 'Single/Multi-level sign-off' },
  { type: 'notification', label: 'Auto Action', icon: Bell, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50', desc: 'Send alert or create record' },
  { type: 'delay', label: 'Delay Timer', icon: Clock, color: 'text-purple-400 bg-purple-950/60 border-purple-700/50', desc: 'Execution delay buffer' },
  { type: 'parallel_branch', label: 'Parallel Split', icon: GitBranch, color: 'text-fuchsia-400 bg-fuchsia-950/60 border-fuchsia-700/50', desc: 'Concurrent sub-tracks' },
  { type: 'merge', label: 'Merge Join', icon: GitMerge, color: 'text-rose-400 bg-rose-950/60 border-rose-700/50', desc: 'Synchronize branches' },
  { type: 'end', label: 'End Node', icon: Square, color: 'text-slate-400 bg-slate-900 border-slate-700', desc: 'Workflow completion' }
];

export const WorkflowDesignerCanvas: React.FC<WorkflowDesignerCanvasProps> = ({
  definition: initialDefinition,
  onSave,
  onLaunchInstance
}) => {
  const defaultDef: WorkflowDefinition = initialDefinition || {
    id: `DEF-CUSTOM-${Date.now()}`,
    code: 'WF-CUSTOM-01',
    title: 'Custom Enterprise Approval Workflow',
    description: 'Visual drag-and-drop workflow constructed in Vertex Workflow Designer.',
    category: 'FINANCE',
    version: '1.0.0',
    isActive: true,
    priority: 'HIGH',
    triggerEvent: 'MANUAL_TRIGGER',
    tags: ['Custom', 'VWE', 'Enterprise'],
    nodes: [
      {
        id: 'n-start',
        type: 'start',
        title: 'Workflow Triggered',
        description: 'Initiated from system event or UI',
        config: {},
        position: { x: 40, y: 150 },
        nextNodes: ['n-approval']
      },
      {
        id: 'n-approval',
        type: 'approval',
        title: 'Manager Approval Gate',
        description: 'Assigned to Finance Manager',
        config: { assigneeRole: 'Finance Manager', approvalType: 'single' },
        position: { x: 300, y: 150 },
        nextNodes: ['n-auto']
      },
      {
        id: 'n-auto',
        type: 'notification',
        title: 'Auto Record Sync',
        description: 'Dispatches notification & updates ledger',
        config: { automationType: 'update_record', notificationChannel: 'in_app' },
        position: { x: 560, y: 150 },
        nextNodes: ['n-end']
      },
      {
        id: 'n-end',
        type: 'end',
        title: 'Process Completed',
        description: 'Final execution state',
        config: {},
        position: { x: 820, y: 150 }
      }
    ],
    edges: [
      { id: 'e1', sourceNodeId: 'n-start', targetNodeId: 'n-approval' },
      { id: 'e2', sourceNodeId: 'n-approval', targetNodeId: 'n-auto' },
      { id: 'e3', sourceNodeId: 'n-auto', targetNodeId: 'n-end' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System Architect'
  };

  const [workflow, setWorkflow] = useState<WorkflowDefinition>(defaultDef);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('n-approval');
  const [isSaved, setIsSaved] = useState(false);

  const selectedNode = workflow.nodes.find(n => n.id === selectedNodeId);

  const handleAddNode = (type: WorkflowNodeType) => {
    const typeMeta = NODE_TYPES.find(t => t.type === type);
    const newId = `n-${type}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newNode: WorkflowNode = {
      id: newId,
      type,
      title: typeMeta?.label || 'New Step',
      description: typeMeta?.desc || 'Configured node step',
      config: {
        assigneeRole: type === 'approval' || type === 'task' ? 'Department Head' : undefined,
        automationType: type === 'notification' ? 'send_notification' : undefined,
        ruleConditionField: type === 'decision' ? 'amount' : undefined,
        ruleOperator: type === 'decision' ? 'greater_than' : undefined,
        ruleValue: type === 'decision' ? 5000 : undefined
      },
      position: { x: 350 + Math.random() * 100, y: 120 + Math.random() * 100 }
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setSelectedNodeId(newId);
  };

  const handleUpdateNodeConfig = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === nodeId ? { ...n, ...updates } : n))
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
    }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleSaveWorkflow = () => {
    workflowEngine.saveDefinition(workflow);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    if (onSave) onSave(workflow);
  };

  const handleLaunch = () => {
    handleSaveWorkflow();
    const inst = workflowEngine.createInstance(workflow.id, {
      amount: 15400,
      docType: 'CAPITAL_PO',
      customMemo: 'Launched from Visual Workflow Designer'
    });
    if (onLaunchInstance) onLaunchInstance(inst.id);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Designer Header Toolbar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                value={workflow.title}
                onChange={(e) => setWorkflow({ ...workflow, title: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 w-72"
              />
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono border border-indigo-800">
                {workflow.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Category: <strong className="text-slate-300">{workflow.category}</strong> | Nodes: <strong className="text-slate-300">{workflow.nodes.length}</strong> | Priority: <strong className="text-amber-400">{workflow.priority}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isSaved && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded">
              <span>Saved to Registry</span>
            </span>
          )}

          <button
            onClick={handleSaveWorkflow}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>Save Definition</span>
          </button>

          <button
            onClick={handleLaunch}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Execute & Test Instance</span>
          </button>
        </div>
      </div>

      {/* Main Designer Grid */}
      <div className="grid grid-cols-12 flex-1 min-h-[520px]">
        {/* Left Toolbar / Node Palette */}
        <div className="col-span-3 bg-slate-900/60 border-r border-slate-800 p-3.5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Node Palette</span>
            </h4>
            <div className="space-y-2">
              {NODE_TYPES.map((nt) => {
                const Icon = nt.icon;
                return (
                  <button
                    key={nt.type}
                    onClick={() => handleAddNode(nt.type)}
                    className="w-full p-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800/80 hover:border-slate-700 text-left transition-all flex items-center space-x-2.5 group"
                  >
                    <div className={`p-1.5 rounded border ${nt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                        <span>{nt.label}</span>
                        <Plus className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                      </div>
                      <div className="text-[10px] text-slate-500">{nt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Canvas Controls</span>
            </div>
            <p>Click any node to configure parameters, approvers, conditions, or automation triggers.</p>
          </div>
        </div>

        {/* Center Visual Canvas Area */}
        <div className="col-span-6 bg-slate-950 p-6 relative overflow-auto border-r border-slate-800 flex flex-col justify-center items-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="w-full max-w-xl space-y-6">
            {workflow.nodes.map((node, idx) => {
              const meta = NODE_TYPES.find(t => t.type === node.type) || NODE_TYPES[1];
              const Icon = meta.icon;
              const isSelected = selectedNodeId === node.id;

              return (
                <div key={node.id} className="relative flex flex-col items-center">
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full max-w-md p-4 rounded-xl border transition-all cursor-pointer shadow-lg ${
                      isSelected 
                        ? 'border-indigo-500 bg-slate-900 ring-2 ring-indigo-500/30' 
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg border ${meta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-white flex items-center space-x-2">
                            <span>{node.title}</span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {node.type.toUpperCase()}
                            </span>
                          </h5>
                          <p className="text-xs text-slate-400">{node.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Node Config Summary */}
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      {node.config.assigneeRole && (
                        <span>Assigned: <strong className="text-indigo-300">{node.config.assigneeRole}</strong></span>
                      )}
                      {node.config.ruleConditionField && (
                        <span>Rule: <strong className="text-amber-300">{node.config.ruleConditionField} {node.config.ruleOperator} {node.config.ruleValue}</strong></span>
                      )}
                      {node.config.automationType && (
                        <span>Auto Action: <strong className="text-cyan-300">{node.config.automationType}</strong></span>
                      )}
                      {node.type === 'start' && <span className="text-emerald-400 font-semibold">System Trigger</span>}
                      {node.type === 'end' && <span className="text-slate-400">Process Termination</span>}
                    </div>
                  </div>

                  {/* Connecting Arrow */}
                  {idx < workflow.nodes.length - 1 && (
                    <div className="my-2 flex flex-col items-center">
                      <div className="w-0.5 h-6 bg-indigo-500/50"></div>
                      <ArrowRight className="w-4 h-4 text-indigo-400 rotate-90 -mt-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Property Inspector Panel */}
        <div className="col-span-3 bg-slate-900/60 p-4 overflow-auto">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Node Inspector</span>
          </h4>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Step Title</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { title: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={selectedNode.description}
                    onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { description: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Node-specific configuration */}
              {(selectedNode.type === 'approval' || selectedNode.type === 'task') && (
                <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/50 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-300">Approval & Task Configuration</h5>

                  <div>
                    <label className="text-[11px] text-slate-400">Approval Pattern</label>
                    <select
                      value={selectedNode.config.approvalType || 'single'}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                        config: { ...selectedNode.config, approvalType: e.target.value as any }
                      })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="single">Single Approver</option>
                      <option value="multi_level">Multi-Level Approval</option>
                      <option value="parallel">Parallel Consensus Approval</option>
                      <option value="conditional">Conditional Amount Sign-off</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400">Assigned Role</label>
                    <input
                      type="text"
                      value={selectedNode.config.assigneeRole || ''}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                        config: { ...selectedNode.config, assigneeRole: e.target.value }
                      })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                      placeholder="e.g. VP of Finance, Department Manager"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400">Escalation Timer (Hours)</label>
                    <input
                      type="number"
                      value={selectedNode.config.escalateAfterHours || 24}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                        config: { ...selectedNode.config, escalateAfterHours: Number(e.target.value) }
                      })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'decision' && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 space-y-3">
                  <h5 className="text-xs font-bold text-amber-300">Decision Condition Rule</h5>

                  <div>
                    <label className="text-[11px] text-slate-400">Condition Field</label>
                    <select
                      value={selectedNode.config.ruleConditionField || 'amount'}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                        config: { ...selectedNode.config, ruleConditionField: e.target.value as any }
                      })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="amount">Document Amount ($)</option>
                      <option value="branch">Branch Office</option>
                      <option value="department">Department</option>
                      <option value="priority">Priority Level</option>
                      <option value="company">Company Entity</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400">Operator & Value</label>
                    <div className="flex space-x-2 mt-1">
                      <select
                        value={selectedNode.config.ruleOperator || 'greater_than'}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                          config: { ...selectedNode.config, ruleOperator: e.target.value as any }
                        })}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white w-1/2"
                      >
                        <option value="greater_than">&gt; Greater Than</option>
                        <option value="less_than">&lt; Less Than</option>
                        <option value="equals">= Equals</option>
                      </select>
                      <input
                        type="text"
                        value={selectedNode.config.ruleValue || ''}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                          config: { ...selectedNode.config, ruleValue: e.target.value }
                        })}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white w-1/2"
                        placeholder="e.g. 10000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type === 'notification' && (
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 space-y-3">
                  <h5 className="text-xs font-bold text-cyan-300">Automation Trigger Config</h5>

                  <div>
                    <label className="text-[11px] text-slate-400">Automation Action Type</label>
                    <select
                      value={selectedNode.config.automationType || 'send_notification'}
                      onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                        config: { ...selectedNode.config, automationType: e.target.value as any }
                      })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="create_document">Create ERP Document</option>
                      <option value="update_record">Update Record Status</option>
                      <option value="send_notification">Send Notification Alert</option>
                      <option value="generate_report">Generate Audit PDF Report</option>
                      <option value="call_api">Invoke Webhook REST API</option>
                      <option value="execute_integration">Execute ERP Integration</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
              Select any step node in the canvas to edit properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
