import { NotificationTemplate } from './NotificationTypes';

export const SYSTEM_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'TPL-VWE-APPROVAL',
    code: 'NT-VWE-001',
    name: 'Workflow Approval Required',
    type: 'approval_request',
    defaultPriority: 'HIGH',
    defaultChannels: ['in_app', 'email', 'teams'],
    subjectTemplate: 'Approval Required: {{workflowTitle}} ({{instanceId}})',
    bodyTemplate: 'A new approval task has been assigned to you for workflow "{{workflowTitle}}". Requestor: {{initiatedBy}}. Amount/Detail: {{detail}}.',
    category: 'Workflow & ERP Engine',
    isActive: true
  },
  {
    id: 'TPL-PO-CREATED',
    code: 'NT-PROC-002',
    name: 'Purchase Order Approval Alert',
    type: 'task_assignment',
    defaultPriority: 'HIGH',
    defaultChannels: ['in_app', 'email', 'desktop'],
    subjectTemplate: 'Purchase Order {{poNumber}} Awaiting Authorization',
    bodyTemplate: 'PO {{poNumber}} created for vendor {{vendorName}} valued at ${{amount}} requires executive signature.',
    category: 'Procurement Engine',
    isActive: true
  },
  {
    id: 'TPL-SECURITY-ALERT',
    code: 'NT-SEC-003',
    name: 'Security Risk & Anomaly Detection',
    type: 'security_alert',
    defaultPriority: 'EMERGENCY',
    defaultChannels: ['in_app', 'email', 'sms', 'push', 'teams'],
    subjectTemplate: 'CRITICAL SECURITY ALERT: {{alertTitle}}',
    bodyTemplate: 'Anomalous activity detected on node {{nodeId}} by user {{user}}. Action taken: {{action}}. Details: {{details}}.',
    category: 'Security & Governance',
    isActive: true
  },
  {
    id: 'TPL-CAPEX-SUBMITTED',
    code: 'NT-FIN-004',
    name: 'Capital Expenditure Authorization',
    type: 'workflow_update',
    defaultPriority: 'CRITICAL',
    defaultChannels: ['in_app', 'email', 'teams'],
    subjectTemplate: 'CapEx Proposal {{capexId}} Submitted for Board Review',
    bodyTemplate: 'Proposal "{{title}}" for department {{department}} with estimated outlay of ${{budget}} has entered Stage 2 Evaluation.',
    category: 'Financial Engine',
    isActive: true
  },
  {
    id: 'TPL-SYSTEM-MAINTENANCE',
    code: 'NT-SYS-005',
    name: 'Scheduled Platform Maintenance Notice',
    type: 'system_alert',
    defaultPriority: 'NORMAL',
    defaultChannels: ['in_app', 'desktop', 'webhook'],
    subjectTemplate: 'Scheduled System Maintenance: {{windowTime}}',
    bodyTemplate: 'Vertex ERP will undergo routine engine optimization on {{windowTime}}. Services will remain in Read-Only high availability mode.',
    category: 'System Platform',
    isActive: true
  },
  {
    id: 'TPL-HR-ONBOARDING',
    code: 'NT-HR-006',
    name: 'New Employee Onboarding Milestone',
    type: 'reminder',
    defaultPriority: 'NORMAL',
    defaultChannels: ['in_app', 'email'],
    subjectTemplate: 'Onboarding Task Reminder: {{employeeName}}',
    bodyTemplate: 'IT provisioning and compliance sign-off for {{employeeName}} (Department: {{department}}) is scheduled for completion today.',
    category: 'Human Resources Engine',
    isActive: true
  }
];
