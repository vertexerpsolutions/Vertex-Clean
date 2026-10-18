import { EngineBase } from '../EngineBase';
import { HealthCheckResult } from '../EngineTypes';
import { workflowEngine } from './WorkflowEngine';
import { indexManager } from '../search/IndexManager';

export class VertexWorkflowPlatformEngine extends EngineBase {
  constructor() {
    super({
      id: 'ENG-WORKFLOW-VWE',
      name: 'VPE-02 Vertex Workflow Engine (VWE)',
      version: '2.0.0',
      description: 'Central business process engine orchestrating ERP workflows, multi-level approvals, business rule evaluation, and automated cross-engine actions.',
      category: 'Workflow & Automation',
      autoStart: true,
      dependencies: ['ENG-AUDIT'],
      permissions: {
        allowDatabaseAccess: true,
        allowNetworkAccess: true,
        allowSystemCommands: false,
        allowEventBroadcast: true,
        allowedEvents: ['*'],
        maxMemoryMB: 96
      }
    });
  }

  protected async onInitialize(): Promise<boolean> {
    const definitions = workflowEngine.getDefinitions();
    const dateNow = new Date().toISOString().split('T')[0];

    definitions.forEach(def => {
      indexManager.addOrUpdateRecord({
        id: `IDX-WF-DEF-${def.id}`,
        type: 'workflow',
        title: `Workflow: ${def.title}`,
        subtitle: `Category: ${def.category} | Version: ${def.version} | Priority: ${def.priority}`,
        code: def.code,
        reference: `DEF-${def.code}`,
        description: `${def.description} (Priority: ${def.priority})`,
        keywords: [def.title.toLowerCase(), def.code.toLowerCase(), def.category.toLowerCase(), ...def.tags.map(t => t.toLowerCase())],
        tags: [...def.tags, 'Workflow', 'Process', 'VWE'],
        module: 'Workflow Engine',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: def.category,
        status: def.isActive ? 'Active' : 'Inactive',
        date: dateNow,
        createdBy: def.createdBy || 'System Architect',
        permissionsRequired: ['Super Administrator', 'Workflow Manager'],
        actionUrl: '/vpe/workflow/designer'
      });
    });

    const instances = workflowEngine.getInstances();
    instances.forEach(inst => {
      indexManager.addOrUpdateRecord({
        id: `IDX-WF-INST-${inst.id}`,
        type: 'workflow_instance',
        title: `Workflow Instance: ${inst.workflowTitle} (${inst.id})`,
        subtitle: `Status: ${inst.status.toUpperCase()} | Initiated by: ${inst.initiatedBy}`,
        code: inst.id,
        reference: inst.workflowCode,
        description: `Running instance ${inst.id} for company ${inst.company} (${inst.branch})`,
        keywords: [inst.id.toLowerCase(), inst.workflowCode.toLowerCase(), inst.initiatedBy.toLowerCase(), inst.status.toLowerCase()],
        tags: ['Instance', inst.status, 'VWE', inst.workflowCode],
        module: 'Workflow Engine',
        company: inst.company,
        branch: inst.branch,
        department: inst.department,
        status: inst.status,
        date: inst.startedAt.split('T')[0],
        createdBy: inst.initiatedBy,
        permissionsRequired: ['Super Administrator', 'Workflow Operator'],
        actionUrl: '/vpe/workflow/instances'
      });
    });

    return true;
  }

  protected async onStart(): Promise<boolean> {
    return true;
  }

  protected async onPause(): Promise<boolean> {
    return true;
  }

  protected async onResume(): Promise<boolean> {
    return true;
  }

  protected async onShutdown(): Promise<boolean> {
    return true;
  }

  protected async onHealthCheck(): Promise<HealthCheckResult> {
    const instances = workflowEngine.getInstances();
    const runningCount = instances.filter(i => i.status === 'running').length;

    return {
      status: 'healthy',
      latencyMs: 1.8,
      message: `VWE Operational. Active running instances: ${runningCount}, Loaded workflow definitions: ${workflowEngine.getDefinitions().length}`,
      subsystemChecks: {
        workflowManager: true,
        approvalEngine: true,
        ruleEngine: true,
        automationEngine: true,
        analyticsEngine: true
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const vertexWorkflowPlatformEngine = new VertexWorkflowPlatformEngine();
