export type WorkflowNodeType =
  | 'start'
  | 'end'
  | 'task'
  | 'decision'
  | 'approval'
  | 'notification'
  | 'delay'
  | 'parallel_branch'
  | 'merge';

export type WorkflowNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_approval';

export type WorkflowInstanceStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type WorkflowCategory = 
  | 'FINANCE'
  | 'PROCUREMENT'
  | 'HR'
  | 'INVENTORY'
  | 'IT_OPS'
  | 'COMPLIANCE'
  | 'GENERAL';

export type WorkflowPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface WorkflowNodeConfig {
  // Task / Approval specific
  assigneeRole?: string;
  assigneeUser?: string;
  approvalType?: 'single' | 'multi_level' | 'parallel' | 'conditional';
  requiredApprovalsCount?: number;
  delegatedToUser?: string;
  escalateAfterHours?: number;
  escalationRole?: string;

  // Decision / Rule specific
  ruleConditionField?: 'amount' | 'branch' | 'department' | 'priority' | 'company' | 'docType';
  ruleOperator?: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  ruleValue?: any;
  trueNextNodeId?: string;
  falseNextNodeId?: string;

  // Notification / Automation specific
  notificationChannel?: 'email' | 'in_app' | 'sms' | 'webhook';
  notificationTemplate?: string;
  automationType?: 
    | 'create_document'
    | 'update_record'
    | 'send_notification'
    | 'generate_report'
    | 'call_api'
    | 'execute_integration'
    | 'schedule_task'
    | 'trigger_workflow';
  apiEndpointUrl?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT';

  // Delay specific
  delaySeconds?: number;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  description: string;
  config: WorkflowNodeConfig;
  position: { x: number; y: number };
  nextNodes?: string[]; // IDs of connected downstream nodes
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  conditionValue?: string;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  title: string;
  description: string;
  category: WorkflowCategory;
  version: string;
  isActive: boolean;
  priority: WorkflowPriority;
  triggerEvent: string; // e.g. 'PO_CREATED', 'EMPLOYEE_HIRED', 'MANUAL_TRIGGER'
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface ApprovalActionLog {
  id: string;
  nodeId: string;
  nodeTitle: string;
  approverUser: string;
  approverRole: string;
  action: 'approved' | 'rejected' | 'delegated' | 'escalated';
  comments?: string;
  timestamp: string;
}

export interface WorkflowExecutionLog {
  id: string;
  timestamp: string;
  nodeId?: string;
  nodeTitle?: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  workflowTitle: string;
  workflowCode: string;
  category: WorkflowCategory;
  status: WorkflowInstanceStatus;
  priority: WorkflowPriority;
  currentNodeId: string;
  completedNodeIds: string[];
  failedNodeIds: string[];
  contextData: Record<string, any>;
  initiatedBy: string;
  company: string;
  branch: string;
  department: string;
  startedAt: string;
  completedAt?: string;
  approvalHistory: ApprovalActionLog[];
  executionLogs: WorkflowExecutionLog[];
  nodeStatuses: Record<string, WorkflowNodeStatus>;
}

export interface BusinessRuleCondition {
  id: string;
  field: string; // 'company' | 'branch' | 'department' | 'user' | 'role' | 'docType' | 'amount' | 'priority' | 'status' | 'date'
  operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'in';
  value: any;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  conditions: BusinessRuleCondition[];
  logicOperator: 'AND' | 'OR';
  actionTargetWorkflowId?: string;
  isActive: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  iconName: string;
  definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface WorkflowAnalyticsMetrics {
  totalInstances: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  pausedCount: number;
  avgExecutionTimeSeconds: number;
  avgApprovalTimeHours: number;
  bottlenecks: Array<{
    nodeId: string;
    nodeTitle: string;
    avgTimeSpentSeconds: number;
    pendingTasksCount: number;
  }>;
  categoryDistribution: Record<WorkflowCategory, number>;
  instancesByBranch: Record<string, number>;
}
