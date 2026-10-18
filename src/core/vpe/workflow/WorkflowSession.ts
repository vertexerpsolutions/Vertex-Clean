import { WorkflowInstance } from './WorkflowTypes';
import { workflowEngine } from './WorkflowEngine';

export interface WorkflowSessionState {
  currentUser: {
    id: string;
    name: string;
    role: string;
    department: string;
    branch: string;
    company: string;
  };
  activeTab: 'designer' | 'instances' | 'inbox' | 'rules' | 'automation' | 'analytics' | 'templates' | 'api_docs';
  selectedInstanceId?: string;
  selectedDefinitionId?: string;
}

export class WorkflowSession {
  private static instance: WorkflowSession;
  private state: WorkflowSessionState = {
    currentUser: {
      id: 'USR-FIN-001',
      name: 'Victoria Sterling',
      role: 'VP of Finance',
      department: 'FINANCE',
      branch: 'HQ-NY',
      company: 'Vertex Global Enterprises Corp'
    },
    activeTab: 'designer'
  };

  private listeners: Array<() => void> = [];

  private constructor() {}

  public static getInstance(): WorkflowSession {
    if (!WorkflowSession.instance) {
      WorkflowSession.instance = new WorkflowSession();
    }
    return WorkflowSession.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  public getState(): WorkflowSessionState {
    return { ...this.state };
  }

  public setActiveTab(tab: WorkflowSessionState['activeTab']): void {
    this.state.activeTab = tab;
    this.notify();
  }

  public setSelectedInstanceId(id?: string): void {
    this.state.selectedInstanceId = id;
    this.notify();
  }

  public setSelectedDefinitionId(id?: string): void {
    this.state.selectedDefinitionId = id;
    this.notify();
  }

  public getPendingInboxApprovals(): WorkflowInstance[] {
    const instances = workflowEngine.getInstances();
    const userRole = this.state.currentUser.role;

    return instances.filter(inst => {
      if (inst.status !== 'running') return false;
      const def = workflowEngine.getDefinitionById(inst.workflowDefinitionId);
      if (!def) return false;
      const currentNode = def.nodes.find(n => n.id === inst.currentNodeId);
      if (!currentNode || currentNode.type !== 'approval') return false;

      // Check role assignment or delegation
      const isAssigned = currentNode.config.assigneeRole === userRole || 
                         currentNode.config.delegatedToUser === this.state.currentUser.name ||
                         userRole.includes('VP') || userRole.includes('Chief') || userRole.includes('Admin');
      return isAssigned;
    });
  }
}

export const workflowSession = WorkflowSession.getInstance();
