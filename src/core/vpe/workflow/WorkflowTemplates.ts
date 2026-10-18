import { WorkflowTemplate } from './WorkflowTypes';

export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'TPL-PROCURE-01',
    name: 'Purchase Order Approval (> $10k)',
    description: 'Multi-level approval process for capital purchases exceeding $10,000 with automated PO document creation and supplier notification.',
    category: 'PROCUREMENT',
    iconName: 'ShoppingCart',
    definition: {
      code: 'WF-PO-APPROVE',
      title: 'PO High Value Multi-Level Approval',
      description: 'Multi-level approval workflow with conditional routing based on purchase amount.',
      category: 'PROCUREMENT',
      version: '1.2.0',
      isActive: true,
      priority: 'HIGH',
      triggerEvent: 'PO_CREATED',
      tags: ['Procurement', 'Finance', 'Multi-Level', 'Auto-PO'],
      createdBy: 'System Template',
      nodes: [
        {
          id: 'node-start',
          type: 'start',
          title: 'Purchase Request Submitted',
          description: 'Triggered when a user creates a PO in Procurement module.',
          config: {},
          position: { x: 50, y: 150 },
          nextNodes: ['node-dec-amount']
        },
        {
          id: 'node-dec-amount',
          type: 'decision',
          title: 'Amount Check (> $10,000)',
          description: 'Evaluates if requested PO amount exceeds $10,000 limit.',
          config: {
            ruleConditionField: 'amount',
            ruleOperator: 'greater_than',
            ruleValue: 10000,
            trueNextNodeId: 'node-app-mgr',
            falseNextNodeId: 'node-auto-po'
          },
          position: { x: 250, y: 150 },
          nextNodes: ['node-app-mgr', 'node-auto-po']
        },
        {
          id: 'node-app-mgr',
          type: 'approval',
          title: 'Department Manager Approval',
          description: 'Requires primary manager approval.',
          config: {
            approvalType: 'single',
            assigneeRole: 'Department Manager',
            escalateAfterHours: 24,
            escalationRole: 'Division Director'
          },
          position: { x: 480, y: 80 },
          nextNodes: ['node-app-vp']
        },
        {
          id: 'node-app-vp',
          type: 'approval',
          title: 'VP Finance Final Approval',
          description: 'Secondary VP tier sign-off required for high value capital.',
          config: {
            approvalType: 'single',
            assigneeRole: 'VP of Finance'
          },
          position: { x: 700, y: 80 },
          nextNodes: ['node-auto-po']
        },
        {
          id: 'node-auto-po',
          type: 'notification',
          title: 'Generate PO & Notify Vendor',
          description: 'Automated document generation and ERP notification.',
          config: {
            automationType: 'create_document',
            notificationChannel: 'email',
            notificationTemplate: 'PO Approval Confirmed. PDF dispatched to vendor.'
          },
          position: { x: 920, y: 150 },
          nextNodes: ['node-end']
        },
        {
          id: 'node-end',
          type: 'end',
          title: 'PO Dispatched & Closed',
          description: 'Workflow execution completed.',
          config: {},
          position: { x: 1150, y: 150 }
        }
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-start', targetNodeId: 'node-dec-amount' },
        { id: 'e2', sourceNodeId: 'node-dec-amount', targetNodeId: 'node-app-mgr', label: 'Amount > 10k' },
        { id: 'e3', sourceNodeId: 'node-dec-amount', targetNodeId: 'node-auto-po', label: 'Amount <= 10k' },
        { id: 'e4', sourceNodeId: 'node-app-mgr', targetNodeId: 'node-app-vp' },
        { id: 'e5', sourceNodeId: 'node-app-vp', targetNodeId: 'node-auto-po' },
        { id: 'e6', sourceNodeId: 'node-auto-po', targetNodeId: 'node-end' }
      ]
    }
  },
  {
    id: 'TPL-HR-02',
    name: 'New Employee Onboarding & System Provisioning',
    description: 'Parallel branch onboarding workflow for IT access setup, HR paperwork verification, and welcome equipment dispatch.',
    category: 'HR',
    iconName: 'UserCheck',
    definition: {
      code: 'WF-HR-ONBOARDING',
      title: 'Enterprise Employee Onboarding',
      description: 'Parallel onboarding execution across HR, IT, and Facilities.',
      category: 'HR',
      version: '1.0.0',
      isActive: true,
      priority: 'MEDIUM',
      triggerEvent: 'EMPLOYEE_HIRED',
      tags: ['HR', 'IT Ops', 'Parallel', 'Onboarding'],
      createdBy: 'System Template',
      nodes: [
        {
          id: 'node-start',
          type: 'start',
          title: 'Candidate Offer Accepted',
          description: 'Initiated when offer letter status shifts to Accepted.',
          config: {},
          position: { x: 50, y: 150 },
          nextNodes: ['node-parallel-split']
        },
        {
          id: 'node-parallel-split',
          type: 'parallel_branch',
          title: 'Parallel Track Initialization',
          description: 'Splits execution into IT provisioning and HR Compliance.',
          config: {},
          position: { x: 250, y: 150 },
          nextNodes: ['node-task-it', 'node-task-hr']
        },
        {
          id: 'node-task-it',
          type: 'task',
          title: 'Provision Okta & ERP Credentials',
          description: 'IT Systems Admin sets up enterprise account.',
          config: {
            assigneeRole: 'IT Administrator',
            automationType: 'call_api'
          },
          position: { x: 500, y: 80 },
          nextNodes: ['node-merge-join']
        },
        {
          id: 'node-task-hr',
          type: 'task',
          title: 'Verify I-9 & Tax Documentation',
          description: 'HR Specialist reviews compliance forms.',
          config: {
            assigneeRole: 'HR Generalist'
          },
          position: { x: 500, y: 220 },
          nextNodes: ['node-merge-join']
        },
        {
          id: 'node-merge-join',
          type: 'merge',
          title: 'Synchronize Parallel Branches',
          description: 'Waits for both IT and HR setup completion.',
          config: {},
          position: { x: 750, y: 150 },
          nextNodes: ['node-notify-welcome']
        },
        {
          id: 'node-notify-welcome',
          type: 'notification',
          title: 'Dispatch Welcome Email & Kit',
          description: 'Sends automated login details and welcome schedule.',
          config: {
            automationType: 'send_notification',
            notificationChannel: 'email',
            notificationTemplate: 'Welcome to Vertex ERP! Your accounts are configured.'
          },
          position: { x: 950, y: 150 },
          nextNodes: ['node-end']
        },
        {
          id: 'node-end',
          type: 'end',
          title: 'Onboarding Completed',
          description: 'Employee active in system.',
          config: {},
          position: { x: 1150, y: 150 }
        }
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-start', targetNodeId: 'node-parallel-split' },
        { id: 'e2', sourceNodeId: 'node-parallel-split', targetNodeId: 'node-task-it' },
        { id: 'e3', sourceNodeId: 'node-parallel-split', targetNodeId: 'node-task-hr' },
        { id: 'e4', sourceNodeId: 'node-task-it', targetNodeId: 'node-merge-join' },
        { id: 'e5', sourceNodeId: 'node-task-hr', targetNodeId: 'node-merge-join' },
        { id: 'e6', sourceNodeId: 'node-merge-join', targetNodeId: 'node-notify-welcome' },
        { id: 'e7', sourceNodeId: 'node-notify-welcome', targetNodeId: 'node-end' }
      ]
    }
  },
  {
    id: 'TPL-FIN-03',
    name: 'Capital Expenditure (CapEx) Budget Approval',
    description: 'Executive CapEx review with branch escalation rules, delay buffer timer, and ERP ledger update.',
    category: 'FINANCE',
    iconName: 'DollarSign',
    definition: {
      code: 'WF-FIN-CAPEX',
      title: 'CapEx Investment Request Workflow',
      description: 'CapEx workflow featuring delay node buffer and automatic ledger sync.',
      category: 'FINANCE',
      version: '2.1.0',
      isActive: true,
      priority: 'CRITICAL',
      triggerEvent: 'CAPEX_REQUESTED',
      tags: ['Finance', 'CapEx', 'Executive', 'Ledger Sync'],
      createdBy: 'System Template',
      nodes: [
        {
          id: 'node-start',
          type: 'start',
          title: 'CapEx Proposal Initiated',
          description: 'Submitted via General Ledger or Capital Assets module.',
          config: {},
          position: { x: 50, y: 150 },
          nextNodes: ['node-app-cfo']
        },
        {
          id: 'node-app-cfo',
          type: 'approval',
          title: 'CFO / Investment Committee Approval',
          description: 'Executive sign-off required for capital expenditure.',
          config: {
            approvalType: 'single',
            assigneeRole: 'Chief Financial Officer'
          },
          position: { x: 280, y: 150 },
          nextNodes: ['node-delay-buffer']
        },
        {
          id: 'node-delay-buffer',
          type: 'delay',
          title: 'Holding Period Buffer (30s delay)',
          description: 'Execution buffer before auto ledger journal posting.',
          config: {
            delaySeconds: 30
          },
          position: { x: 520, y: 150 },
          nextNodes: ['node-auto-ledger']
        },
        {
          id: 'node-auto-ledger',
          type: 'notification',
          title: 'Post GL Journal & Lock Budget',
          description: 'Automatic API integration updating General Ledger balance.',
          config: {
            automationType: 'update_record',
            notificationChannel: 'in_app'
          },
          position: { x: 760, y: 150 },
          nextNodes: ['node-end']
        },
        {
          id: 'node-end',
          type: 'end',
          title: 'CapEx Budget Allocated',
          description: 'Funds committed and logged in GL audit trail.',
          config: {},
          position: { x: 1000, y: 150 }
        }
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-start', targetNodeId: 'node-app-cfo' },
        { id: 'e2', sourceNodeId: 'node-app-cfo', targetNodeId: 'node-delay-buffer' },
        { id: 'e3', sourceNodeId: 'node-delay-buffer', targetNodeId: 'node-auto-ledger' },
        { id: 'e4', sourceNodeId: 'node-auto-ledger', targetNodeId: 'node-end' }
      ]
    }
  }
];
