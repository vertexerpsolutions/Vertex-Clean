import { 
  WorkflowDefinition, 
  WorkflowInstance, 
  WorkflowInstanceStatus, 
  WorkflowCategory, 
  WorkflowNode,
  WorkflowExecutionLog
} from './WorkflowTypes';
import { DEFAULT_WORKFLOW_TEMPLATES } from './WorkflowTemplates';
import { workflowRuleEngine } from './WorkflowRuleEngine';
import { workflowApprovalEngine } from './WorkflowApprovalEngine';
import { workflowAutomationEngine } from './WorkflowAutomationEngine';

export class WorkflowEngine {
  private static instance: WorkflowEngine;

  private definitions = new Map<string, WorkflowDefinition>();
  private instances = new Map<string, WorkflowInstance>();
  private listeners: Array<() => void> = [];

  private constructor() {
    this.initializeDefaultData();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }

  // --- DEFINITIONS & TEMPLATES ---

  public getDefinitions(): WorkflowDefinition[] {
    return Array.from(this.definitions.values());
  }

  public getDefinitionById(id: string): WorkflowDefinition | undefined {
    return this.definitions.get(id);
  }

  public saveDefinition(def: WorkflowDefinition): void {
    def.updatedAt = new Date().toISOString();
    this.definitions.set(def.id, def);
    this.notifyListeners();
  }

  public deleteDefinition(id: string): void {
    this.definitions.delete(id);
    this.notifyListeners();
  }

  public getTemplates() {
    return DEFAULT_WORKFLOW_TEMPLATES;
  }

  // --- INSTANCES & EXECUTION ---

  public getInstances(): WorkflowInstance[] {
    return Array.from(this.instances.values());
  }

  public getInstanceById(id: string): WorkflowInstance | undefined {
    return this.instances.get(id);
  }

  public createInstance(
    definitionId: string,
    contextData: Record<string, any> = {},
    initiatedBy: string = 'Alex Mercer (Finance Director)',
    company: string = 'Vertex Global Enterprises Corp',
    branch: string = 'HQ-NY',
    department: string = 'FINANCE'
  ): WorkflowInstance {
    const def = this.definitions.get(definitionId);
    if (!def) {
      throw new Error(`Workflow definition ${definitionId} not found.`);
    }

    const startNode = def.nodes.find(n => n.type === 'start') || def.nodes[0];
    const initialNodeStatuses: Record<string, any> = {};
    def.nodes.forEach(n => {
      initialNodeStatuses[n.id] = n.id === startNode.id ? 'completed' : 'pending';
    });

    const instanceId = `INST-${Math.floor(100000 + Math.random() * 900000)}`;
    const timestamp = new Date().toISOString();

    const instance: WorkflowInstance = {
      id: instanceId,
      workflowDefinitionId: def.id,
      workflowTitle: def.title,
      workflowCode: def.code,
      category: def.category,
      status: 'running',
      priority: def.priority,
      currentNodeId: startNode.id,
      completedNodeIds: [startNode.id],
      failedNodeIds: [],
      contextData: { ...contextData },
      initiatedBy,
      company,
      branch,
      department,
      startedAt: timestamp,
      approvalHistory: [],
      executionLogs: [
        {
          id: `EXEC-INIT-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp,
          nodeId: startNode.id,
          nodeTitle: startNode.title,
          level: 'info',
          message: `Workflow Instance ${instanceId} initiated by ${initiatedBy}. Code: ${def.code}`
        }
      ],
      nodeStatuses: initialNodeStatuses
    };

    // Auto-advance past start node to next node
    this.advanceWorkflow(instance, def, startNode.id);

    this.instances.set(instance.id, instance);
    this.notifyListeners();
    return instance;
  }

  public advanceWorkflow(instance: WorkflowInstance, def: WorkflowDefinition, currentNodeId: string): void {
    const currentNode = def.nodes.find(n => n.id === currentNodeId);
    if (!currentNode) return;

    // Find next connected node(s)
    const nextEdges = def.edges.filter(e => e.sourceNodeId === currentNodeId);
    if (nextEdges.length === 0) {
      if (currentNode.type === 'end') {
        instance.status = 'completed';
        instance.completedAt = new Date().toISOString();
        instance.executionLogs.unshift({
          id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString(),
          level: 'success',
          message: `Workflow Instance ${instance.id} successfully reached END state and COMPLETED.`
        });
      }
      return;
    }

    // Process next node
    let targetNodeId = nextEdges[0].targetNodeId;

    // Handle Decision node logic
    if (currentNode.type === 'decision') {
      const conditionField = currentNode.config.ruleConditionField || 'amount';
      const conditionOp = currentNode.config.ruleOperator || 'greater_than';
      const conditionVal = currentNode.config.ruleValue || 10000;

      const evalResult = workflowRuleEngine.evaluateInstance(instance, {
        field: conditionField,
        operator: conditionOp === 'greater_than' ? '>' : conditionOp === 'less_than' ? '<' : '==',
        value: conditionVal
      });

      instance.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        nodeId: currentNode.id,
        nodeTitle: currentNode.title,
        level: 'info',
        message: `Decision Node Evaluated (${conditionField} ${conditionOp} ${conditionVal}) -> ${evalResult ? 'TRUE' : 'FALSE'}`
      });

      if (evalResult && currentNode.config.trueNextNodeId) {
        targetNodeId = currentNode.config.trueNextNodeId;
      } else if (!evalResult && currentNode.config.falseNextNodeId) {
        targetNodeId = currentNode.config.falseNextNodeId;
      }
    }

    const nextNode = def.nodes.find(n => n.id === targetNodeId);
    if (!nextNode) return;

    instance.currentNodeId = nextNode.id;

    if (nextNode.type === 'approval') {
      instance.nodeStatuses[nextNode.id] = 'waiting_approval';
      instance.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        nodeId: nextNode.id,
        nodeTitle: nextNode.title,
        level: 'warn',
        message: `Awaiting Approval: Assigned to ${nextNode.config.assigneeRole || 'Approver'}`
      });
    } else if (nextNode.type === 'notification' || nextNode.type === 'task') {
      instance.nodeStatuses[nextNode.id] = 'running';
      workflowAutomationEngine.executeAutomationNode(instance, nextNode).then(res => {
        instance.nodeStatuses[nextNode.id] = 'completed';
        if (!instance.completedNodeIds.includes(nextNode.id)) {
          instance.completedNodeIds.push(nextNode.id);
        }
        instance.executionLogs.unshift({
          id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString(),
          nodeId: nextNode.id,
          nodeTitle: nextNode.title,
          level: 'success',
          message: res.logMessage
        });
        this.advanceWorkflow(instance, def, nextNode.id);
        this.notifyListeners();
      });
    } else if (nextNode.type === 'delay') {
      instance.nodeStatuses[nextNode.id] = 'running';
      instance.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        nodeId: nextNode.id,
        nodeTitle: nextNode.title,
        level: 'info',
        message: `Delay Node: Holding execution for ${nextNode.config.delaySeconds || 5}s`
      });
      setTimeout(() => {
        instance.nodeStatuses[nextNode.id] = 'completed';
        if (!instance.completedNodeIds.includes(nextNode.id)) {
          instance.completedNodeIds.push(nextNode.id);
        }
        this.advanceWorkflow(instance, def, nextNode.id);
        this.notifyListeners();
      }, (nextNode.config.delaySeconds || 3) * 1000);
    } else if (nextNode.type === 'end') {
      instance.nodeStatuses[nextNode.id] = 'completed';
      if (!instance.completedNodeIds.includes(nextNode.id)) {
        instance.completedNodeIds.push(nextNode.id);
      }
      instance.status = 'completed';
      instance.completedAt = new Date().toISOString();
      instance.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        nodeId: nextNode.id,
        nodeTitle: nextNode.title,
        level: 'success',
        message: `Workflow completed at node ${nextNode.title}`
      });
    } else {
      // Parallel / Merge / Standard
      instance.nodeStatuses[nextNode.id] = 'completed';
      if (!instance.completedNodeIds.includes(nextNode.id)) {
        instance.completedNodeIds.push(nextNode.id);
      }
      this.advanceWorkflow(instance, def, nextNode.id);
    }
  }

  // --- ACTIONS (Pause, Resume, Rollback, Retry, Cancel, Restart) ---

  public pauseInstance(instanceId: string): void {
    const inst = this.instances.get(instanceId);
    if (inst && inst.status === 'running') {
      inst.status = 'paused';
      inst.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: `Workflow instance paused manually by operator.`
      });
      this.notifyListeners();
    }
  }

  public resumeInstance(instanceId: string): void {
    const inst = this.instances.get(instanceId);
    if (inst && inst.status === 'paused') {
      inst.status = 'running';
      inst.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Workflow instance resumed.`
      });
      const def = this.definitions.get(inst.workflowDefinitionId);
      if (def) {
        this.advanceWorkflow(inst, def, inst.currentNodeId);
      }
      this.notifyListeners();
    }
  }

  public cancelInstance(instanceId: string, reason: string = 'User cancellation'): void {
    const inst = this.instances.get(instanceId);
    if (inst) {
      inst.status = 'cancelled';
      inst.completedAt = new Date().toISOString();
      inst.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Workflow cancelled: ${reason}`
      });
      this.notifyListeners();
    }
  }

  public retryStep(instanceId: string): void {
    const inst = this.instances.get(instanceId);
    if (inst) {
      inst.status = 'running';
      inst.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Retrying execution step at node ${inst.currentNodeId}`
      });
      const def = this.definitions.get(inst.workflowDefinitionId);
      if (def) {
        this.advanceWorkflow(inst, def, inst.currentNodeId);
      }
      this.notifyListeners();
    }
  }

  public rollbackInstance(instanceId: string): void {
    const inst = this.instances.get(instanceId);
    if (inst && inst.completedNodeIds.length > 1) {
      const previousNodeId = inst.completedNodeIds[inst.completedNodeIds.length - 2];
      inst.currentNodeId = previousNodeId;
      inst.status = 'running';
      inst.executionLogs.unshift({
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: `Rollback triggered: State reset to previous node ${previousNodeId}`
      });
      this.notifyListeners();
    }
  }

  public restartInstance(instanceId: string): void {
    const inst = this.instances.get(instanceId);
    if (inst) {
      const def = this.definitions.get(inst.workflowDefinitionId);
      if (def) {
        const startNode = def.nodes.find(n => n.type === 'start') || def.nodes[0];
        inst.status = 'running';
        inst.currentNodeId = startNode.id;
        inst.completedNodeIds = [startNode.id];
        inst.failedNodeIds = [];
        inst.completedAt = undefined;
        inst.executionLogs.unshift({
          id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Workflow restarted from Start node.`
        });
        this.advanceWorkflow(inst, def, startNode.id);
        this.notifyListeners();
      }
    }
  }

  // --- APPROVAL ACTIONS ---

  public submitApproval(
    instanceId: string,
    action: 'approved' | 'rejected' | 'delegated' | 'escalated',
    approverUser: string,
    approverRole: string,
    comments?: string,
    delegateUser?: string
  ): void {
    const inst = this.instances.get(instanceId);
    if (!inst) return;

    const def = this.definitions.get(inst.workflowDefinitionId);
    if (!def) return;

    const currentNode = def.nodes.find(n => n.id === inst.currentNodeId);
    if (!currentNode) return;

    const result = workflowApprovalEngine.processApprovalAction(
      inst,
      currentNode,
      action,
      approverUser,
      approverRole,
      comments,
      delegateUser
    );

    if (result.isNodeRejected) {
      inst.status = 'failed';
      inst.completedAt = new Date().toISOString();
    } else if (result.isNodeApproved) {
      inst.completedNodeIds.push(currentNode.id);
      this.advanceWorkflow(inst, def, currentNode.id);
    }

    this.notifyListeners();
  }

  // --- SEEDING DATA ---

  private initializeDefaultData(): void {
    // Seed default definitions from templates
    DEFAULT_WORKFLOW_TEMPLATES.forEach(tpl => {
      const def: WorkflowDefinition = {
        id: `DEF-${tpl.definition.code}`,
        ...tpl.definition,
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-05T14:30:00Z',
        createdBy: 'System Architect'
      };
      this.definitions.set(def.id, def);
    });

    // Seed active running and completed instances
    const sampleInstances: WorkflowInstance[] = [
      {
        id: 'INST-884102',
        workflowDefinitionId: 'DEF-WF-PO-APPROVE',
        workflowTitle: 'PO High Value Multi-Level Approval',
        workflowCode: 'WF-PO-APPROVE',
        category: 'PROCUREMENT',
        status: 'running',
        priority: 'HIGH',
        currentNodeId: 'node-app-vp',
        completedNodeIds: ['node-start', 'node-dec-amount', 'node-app-mgr'],
        failedNodeIds: [],
        contextData: {
          poNumber: 'PO-2026-0982',
          vendorName: 'Global Microchips Inc',
          amount: 24500.00,
          currency: 'USD',
          department: 'IT Infrastructure'
        },
        initiatedBy: 'Sarah Jenkins (Procurement Lead)',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'PROCUREMENT',
        startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        approvalHistory: [
          {
            id: 'LOG-1021',
            nodeId: 'node-app-mgr',
            nodeTitle: 'Department Manager Approval',
            approverUser: 'David Miller',
            approverRole: 'Department Manager',
            action: 'approved',
            comments: 'Approved PO for server rack hardware replacement.',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
          }
        ],
        executionLogs: [
          {
            id: 'LOG-EX-01',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            level: 'info',
            message: 'Instance initiated with PO amount $24,500.00'
          },
          {
            id: 'LOG-EX-02',
            timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
            level: 'info',
            message: 'Decision Node: Amount > $10,000 -> Routed to Manager Approval'
          },
          {
            id: 'LOG-EX-03',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            level: 'success',
            message: 'Manager David Miller approved PO request.'
          },
          {
            id: 'LOG-EX-04',
            timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
            level: 'warn',
            message: 'Awaiting Approval: Assigned to VP of Finance'
          }
        ],
        nodeStatuses: {
          'node-start': 'completed',
          'node-dec-amount': 'completed',
          'node-app-mgr': 'completed',
          'node-app-vp': 'waiting_approval',
          'node-auto-po': 'pending',
          'node-end': 'pending'
        }
      },
      {
        id: 'INST-902311',
        workflowDefinitionId: 'DEF-WF-HR-ONBOARDING',
        workflowTitle: 'Enterprise Employee Onboarding',
        workflowCode: 'WF-HR-ONBOARDING',
        category: 'HR',
        status: 'running',
        priority: 'MEDIUM',
        currentNodeId: 'node-task-it',
        completedNodeIds: ['node-start', 'node-parallel-split', 'node-task-hr'],
        failedNodeIds: [],
        contextData: {
          employeeName: 'Elena Rostova',
          role: 'Senior Financial Analyst',
          department: 'Corporate Finance',
          startDate: '2026-08-15'
        },
        initiatedBy: 'HR Onboarding Bot',
        company: 'Vertex Global Enterprises Corp',
        branch: 'LON-UK',
        department: 'HR',
        startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        approvalHistory: [],
        executionLogs: [
          {
            id: 'LOG-EX-10',
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            level: 'info',
            message: 'Onboarding initiated for Elena Rostova.'
          },
          {
            id: 'LOG-EX-11',
            timestamp: new Date(Date.now() - 3600000 * 4.8).toISOString(),
            level: 'info',
            message: 'Parallel branches split: IT Provisioning + HR Compliance'
          },
          {
            id: 'LOG-EX-12',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            level: 'success',
            message: 'HR Specialist completed tax form verification.'
          }
        ],
        nodeStatuses: {
          'node-start': 'completed',
          'node-parallel-split': 'completed',
          'node-task-it': 'running',
          'node-task-hr': 'completed',
          'node-merge-join': 'pending',
          'node-notify-welcome': 'pending',
          'node-end': 'pending'
        }
      },
      {
        id: 'INST-771029',
        workflowDefinitionId: 'DEF-WF-FIN-CAPEX',
        workflowTitle: 'CapEx Investment Request Workflow',
        workflowCode: 'WF-FIN-CAPEX',
        category: 'FINANCE',
        status: 'completed',
        priority: 'CRITICAL',
        currentNodeId: 'node-end',
        completedNodeIds: ['node-start', 'node-app-cfo', 'node-delay-buffer', 'node-auto-ledger', 'node-end'],
        failedNodeIds: [],
        contextData: {
          capexProject: 'Data Center Upgrade Phase 2',
          investmentAmount: 150000.00,
          glAccount: 'GL-1002-ASSETS'
        },
        initiatedBy: 'Marcus Vance (CTO)',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'FINANCE',
        startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        approvalHistory: [
          {
            id: 'LOG-992',
            nodeId: 'node-app-cfo',
            nodeTitle: 'CFO / Investment Committee Approval',
            approverUser: 'Victoria Sterling',
            approverRole: 'Chief Financial Officer',
            action: 'approved',
            comments: 'Approved under Q3 IT Infrastructure Modernization Budget.',
            timestamp: new Date(Date.now() - 86400000 * 1.8).toISOString()
          }
        ],
        executionLogs: [
          {
            id: 'LOG-EX-20',
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
            level: 'info',
            message: 'CapEx proposal initiated for Data Center Upgrade Phase 2 ($150,000)'
          },
          {
            id: 'LOG-EX-21',
            timestamp: new Date(Date.now() - 86400000 * 1.8).toISOString(),
            level: 'success',
            message: 'CFO Victoria Sterling approved investment proposal.'
          },
          {
            id: 'LOG-EX-22',
            timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
            level: 'success',
            message: 'GL Journal posted automatically & budget locked.'
          }
        ],
        nodeStatuses: {
          'node-start': 'completed',
          'node-app-cfo': 'completed',
          'node-delay-buffer': 'completed',
          'node-auto-ledger': 'completed',
          'node-end': 'completed'
        }
      }
    ];

    sampleInstances.forEach(inst => this.instances.set(inst.id, inst));
  }
}

export const workflowEngine = WorkflowEngine.getInstance();
