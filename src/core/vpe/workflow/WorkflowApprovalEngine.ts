import { ApprovalActionLog, WorkflowInstance, WorkflowNode } from './WorkflowTypes';

export class WorkflowApprovalEngine {
  private static instance: WorkflowApprovalEngine;

  private constructor() {}

  public static getInstance(): WorkflowApprovalEngine {
    if (!WorkflowApprovalEngine.instance) {
      WorkflowApprovalEngine.instance = new WorkflowApprovalEngine();
    }
    return WorkflowApprovalEngine.instance;
  }

  public processApprovalAction(
    instance: WorkflowInstance,
    node: WorkflowNode,
    action: 'approved' | 'rejected' | 'delegated' | 'escalated',
    approverUser: string,
    approverRole: string,
    comments?: string,
    delegateTargetUser?: string
  ): {
    instance: WorkflowInstance;
    isNodeApproved: boolean;
    isNodeRejected: boolean;
  } {
    const timestamp = new Date().toISOString();

    const logEntry: ApprovalActionLog = {
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      nodeId: node.id,
      nodeTitle: node.title,
      approverUser,
      approverRole,
      action,
      comments: comments || (action === 'approved' ? 'Approved step' : action === 'rejected' ? 'Rejected step' : `${action} action`),
      timestamp
    };

    instance.approvalHistory.unshift(logEntry);

    instance.executionLogs.unshift({
      id: `EXEC-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp,
      nodeId: node.id,
      nodeTitle: node.title,
      level: action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'info',
      message: `Approval Node "${node.title}": Action ${action.toUpperCase()} by ${approverUser} (${approverRole}).`
    });

    let isNodeApproved = false;
    let isNodeRejected = false;

    if (action === 'rejected') {
      isNodeRejected = true;
      instance.nodeStatuses[node.id] = 'failed';
    } else if (action === 'approved') {
      const approvalType = node.config.approvalType || 'single';

      if (approvalType === 'single' || approvalType === 'conditional') {
        isNodeApproved = true;
        instance.nodeStatuses[node.id] = 'completed';
      } else if (approvalType === 'multi_level' || approvalType === 'parallel') {
        const requiredCount = node.config.requiredApprovalsCount || 2;
        const approvedCount = instance.approvalHistory.filter(
          h => h.nodeId === node.id && h.action === 'approved'
        ).length;

        if (approvedCount >= requiredCount) {
          isNodeApproved = true;
          instance.nodeStatuses[node.id] = 'completed';
        } else {
          instance.nodeStatuses[node.id] = 'waiting_approval';
        }
      }
    } else if (action === 'delegated') {
      if (delegateTargetUser) {
        node.config.delegatedToUser = delegateTargetUser;
        instance.nodeStatuses[node.id] = 'waiting_approval';
        instance.executionLogs.unshift({
          id: `EXEC-${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp,
          nodeId: node.id,
          nodeTitle: node.title,
          level: 'warn',
          message: `Approval delegated to user ${delegateTargetUser}`
        });
      }
    } else if (action === 'escalated') {
      const escalationRole = node.config.escalationRole || 'Super Administrator';
      node.config.assigneeRole = escalationRole;
      instance.nodeStatuses[node.id] = 'waiting_approval';
      instance.executionLogs.unshift({
        id: `EXEC-${Math.floor(10000 + Math.random() * 90000)}`,
        timestamp,
        nodeId: node.id,
        nodeTitle: node.title,
        level: 'warn',
        message: `Approval escalated to higher authority role: ${escalationRole}`
      });
    }

    return { instance, isNodeApproved, isNodeRejected };
  }
}

export const workflowApprovalEngine = WorkflowApprovalEngine.getInstance();
