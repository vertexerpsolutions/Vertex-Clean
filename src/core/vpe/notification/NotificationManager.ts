import { 
  NotificationRecord, 
  NotificationType, 
  NotificationPriority, 
  NotificationChannel,
  NotificationRecipient,
  NotificationRule 
} from './NotificationTypes';
import { SYSTEM_NOTIFICATION_TEMPLATES } from './NotificationTemplates';
import { notificationQueue } from './NotificationQueue';
import { auditEngine } from '../../../services/auditEngine';

export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Map<string, NotificationRecord> = new Map();
  private rules: NotificationRule[] = [];
  private listeners: Array<(record: NotificationRecord) => void> = [];

  private constructor() {
    this.seedDefaultRules();
    this.seedMockNotifications();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private seedDefaultRules(): void {
    this.rules = [
      {
        id: 'RULE-001',
        name: 'Executive CapEx & PO Escalation',
        eventTrigger: 'CAPEX_HIGH_VAL',
        companyRestriction: 'Vertex Global Enterprises Corp',
        roleRestriction: 'Chief Executive Officer',
        channels: ['in_app', 'email', 'teams', 'push'],
        isEnabled: true
      },
      {
        id: 'RULE-002',
        name: 'Critical Security Alert Broadcast',
        eventTrigger: 'SECURITY_BREACH_DETECTED',
        channels: ['in_app', 'email', 'sms', 'push', 'teams', 'webhook'],
        isEnabled: true
      },
      {
        id: 'RULE-003',
        name: 'Departmental HR Onboarding Alerts',
        eventTrigger: 'NEW_HIRE_WELCOME',
        departmentRestriction: 'Human Resources',
        channels: ['in_app', 'email'],
        isEnabled: true
      }
    ];
  }

  private seedMockNotifications(): void {
    const mockRecipients: NotificationRecipient[] = [
      {
        userId: 'USR-001',
        userName: 'Alexander Vance',
        email: 'a.vance@vertexglobal.com',
        phone: '+1 (555) 019-2834',
        role: 'Chief Executive Officer',
        department: 'Executive Board',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY'
      },
      {
        userId: 'USR-002',
        userName: 'Elena Rostova',
        email: 'e.rostova@vertexglobal.com',
        phone: '+1 (555) 839-1029',
        role: 'Chief Financial Officer',
        department: 'Finance & Treasury',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY'
      },
      {
        userId: 'USR-003',
        userName: 'Marcus Thorne',
        email: 'm.thorne@vertexglobal.com',
        phone: '+1 (555) 472-9911',
        role: 'VP of Procurement',
        department: 'Procurement',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY'
      }
    ];

    const initialItems: NotificationRecord[] = [
      {
        id: 'NOTIF-VNE-1001',
        templateId: 'TPL-VWE-APPROVAL',
        title: 'Approval Required: High-Value Equipment PO #PO-2026-8841',
        body: 'Purchase Order #PO-2026-8841 for $450,000 (Global Server Infrastructure) requires executive sign-off in VWE.',
        type: 'approval_request',
        priority: 'HIGH',
        status: 'delivered',
        channels: ['in_app', 'email', 'teams'],
        recipient: mockRecipients[0],
        sender: 'Workflow Engine (VWE)',
        sourceEngine: 'VWE',
        actionUrl: '/vpe/workflow/instances',
        isPinned: true,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
        deliveryLogs: [
          { id: 'LOG-101', channel: 'in_app', status: 'sent', timestamp: new Date().toISOString(), retryCount: 0 },
          { id: 'LOG-102', channel: 'email', status: 'sent', timestamp: new Date().toISOString(), retryCount: 0 }
        ],
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Executive Board'
      },
      {
        id: 'NOTIF-VNE-1002',
        templateId: 'TPL-SECURITY-ALERT',
        title: 'CRITICAL SECURITY ALERT: Anomalous API Request Pattern',
        body: 'Unusual rate of failed token validations observed from IP 192.168.4.120 targeting Treasury API endpoint.',
        type: 'security_alert',
        priority: 'EMERGENCY',
        status: 'delivered',
        channels: ['in_app', 'email', 'sms', 'teams'],
        recipient: mockRecipients[0],
        sender: 'Vertex Security Sentinel',
        sourceEngine: 'SECURITY',
        actionUrl: '/security/audit-logs',
        isPinned: true,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
        deliveryLogs: [
          { id: 'LOG-103', channel: 'in_app', status: 'sent', timestamp: new Date().toISOString(), retryCount: 0 },
          { id: 'LOG-104', channel: 'sms', status: 'sent', timestamp: new Date().toISOString(), retryCount: 0 }
        ],
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Executive Board'
      },
      {
        id: 'NOTIF-VNE-1003',
        templateId: 'TPL-CAPEX-SUBMITTED',
        title: 'CapEx Proposal CP-2026-004 Active Stage 2 Review',
        body: 'CapEx Proposal "AI Data Center Expansion" ($1,200,000) has passed automated risk compliance evaluation.',
        type: 'workflow_update',
        priority: 'CRITICAL',
        status: 'delivered',
        channels: ['in_app', 'email'],
        recipient: mockRecipients[1],
        sender: 'Financial Engine (VFE)',
        sourceEngine: 'FINANCE',
        actionUrl: '/financials/capex',
        isPinned: false,
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
        deliveryLogs: [
          { id: 'LOG-105', channel: 'in_app', status: 'sent', timestamp: new Date().toISOString(), retryCount: 0 }
        ],
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Finance & Treasury'
      },
      {
        id: 'NOTIF-VNE-1004',
        templateId: 'TPL-PO-CREATED',
        title: 'Task Assignment: Reconcile Procurement Invoice #INV-9921',
        body: 'Vendor TechCorp LLC submitted invoice #INV-9921 requiring 3-way matching check prior to payment batch run.',
        type: 'task_assignment',
        priority: 'NORMAL',
        status: 'delivered',
        channels: ['in_app', 'desktop'],
        recipient: mockRecipients[2],
        sender: 'Procurement Engine',
        sourceEngine: 'PROCUREMENT',
        actionUrl: '/procurement/invoices',
        isPinned: false,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 119).toISOString(),
        deliveryLogs: [
          { id: 'LOG-106', channel: 'in_app', status: 'sent', timestamp: new Date().toISOString(), retryCount: 0 }
        ],
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Procurement'
      }
    ];

    initialItems.forEach(item => this.notifications.set(item.id, item));
    notificationQueue.seedInitialHistory(initialItems);
  }

  public sendNotification(payload: {
    title: string;
    body: string;
    type: NotificationType;
    priority?: NotificationPriority;
    channels?: NotificationChannel[];
    recipient: NotificationRecipient;
    sender?: string;
    sourceEngine?: string;
    actionUrl?: string;
    scheduledAt?: string;
    expiresAt?: string;
    metadata?: Record<string, any>;
  }): NotificationRecord {
    const id = `NOTIF-VNE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record: NotificationRecord = {
      id,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      priority: payload.priority || 'NORMAL',
      status: payload.scheduledAt ? 'queued' : 'processing',
      channels: payload.channels || ['in_app', 'email'],
      recipient: payload.recipient,
      sender: payload.sender || 'Vertex Platform Engine',
      sourceEngine: payload.sourceEngine || 'PLATFORM',
      actionUrl: payload.actionUrl || '/notifications',
      metadata: payload.metadata,
      isPinned: false,
      isRead: false,
      scheduledAt: payload.scheduledAt,
      expiresAt: payload.expiresAt,
      createdAt: new Date().toISOString(),
      deliveryLogs: [],
      company: payload.recipient.company,
      branch: payload.recipient.branch,
      department: payload.recipient.department
    };

    this.notifications.set(id, record);
    notificationQueue.enqueue(record);
    const queueResult = notificationQueue.processQueue();

    // Audit log entry
    auditEngine.logAction(
      'NOTIFICATION_DISPATCH',
      'VNE Core',
      `Dispatched notification ${id} (${payload.type}) to ${payload.recipient.userName} via channels: ${record.channels.join(', ')}`,
      payload.priority === 'EMERGENCY' || payload.priority === 'CRITICAL' ? 'warning' : 'info',
      payload.sender || 'Vertex Platform Engine'
    );

    this.notifyListeners(record);
    return record;
  }

  public sendFromTemplate(
    templateId: string,
    recipient: NotificationRecipient,
    variables: Record<string, string>,
    overrides?: Partial<NotificationRecord>
  ): NotificationRecord | null {
    const template = SYSTEM_NOTIFICATION_TEMPLATES.find(t => t.id === templateId || t.code === templateId);
    if (!template) return null;

    let subject = template.subjectTemplate;
    let body = template.bodyTemplate;

    Object.entries(variables).forEach(([key, val]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), val);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });

    return this.sendNotification({
      title: subject,
      body,
      type: template.type,
      priority: overrides?.priority || template.defaultPriority,
      channels: overrides?.channels || template.defaultChannels,
      recipient,
      sender: `VNE Template (${template.code})`,
      sourceEngine: template.category,
      actionUrl: overrides?.actionUrl,
      metadata: { templateCode: template.code, variables }
    });
  }

  public getNotifications(filter?: {
    userId?: string;
    company?: string;
    branch?: string;
    department?: string;
    type?: NotificationType;
    channel?: NotificationChannel;
    status?: string;
    isRead?: boolean;
    searchTerm?: string;
  }): NotificationRecord[] {
    let list = Array.from(this.notifications.values());

    if (filter) {
      if (filter.userId) {
        list = list.filter(n => n.recipient.userId === filter.userId);
      }
      if (filter.company) {
        list = list.filter(n => n.company === filter.company);
      }
      if (filter.branch) {
        list = list.filter(n => n.branch === filter.branch);
      }
      if (filter.department) {
        list = list.filter(n => n.department === filter.department);
      }
      if (filter.type) {
        list = list.filter(n => n.type === filter.type);
      }
      if (filter.channel) {
        list = list.filter(n => n.channels.includes(filter.channel));
      }
      if (filter.isRead !== undefined) {
        list = list.filter(n => n.isRead === filter.isRead);
      }
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        list = list.filter(n => 
          n.title.toLowerCase().includes(term) ||
          n.body.toLowerCase().includes(term) ||
          n.sender.toLowerCase().includes(term) ||
          n.recipient.userName.toLowerCase().includes(term)
        );
      }
    }

    // Sort by pinned then date descending
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public markAsRead(id: string): boolean {
    const notif = this.notifications.get(id);
    if (!notif) return false;
    notif.isRead = true;
    notif.readAt = new Date().toISOString();
    return true;
  }

  public markAllAsRead(userId?: string): number {
    let count = 0;
    this.notifications.forEach(n => {
      if (!n.isRead && (!userId || n.recipient.userId === userId)) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
        count++;
      }
    });
    return count;
  }

  public togglePin(id: string): boolean {
    const notif = this.notifications.get(id);
    if (!notif) return false;
    notif.isPinned = !notif.isPinned;
    return notif.isPinned;
  }

  public archiveNotification(id: string): boolean {
    const notif = this.notifications.get(id);
    if (!notif) return false;
    notif.status = 'archived';
    return true;
  }

  public deleteNotification(id: string): boolean {
    return this.notifications.delete(id);
  }

  public getUnreadCount(userId?: string): number {
    let count = 0;
    this.notifications.forEach(n => {
      if (!n.isRead && n.status !== 'archived' && (!userId || n.recipient.userId === userId)) {
        count++;
      }
    });
    return count;
  }

  public getRules(): NotificationRule[] {
    return [...this.rules];
  }

  public addRule(rule: Omit<NotificationRule, 'id'>): NotificationRule {
    const newRule: NotificationRule = {
      ...rule,
      id: `RULE-${Date.now()}`
    };
    this.rules.push(newRule);
    return newRule;
  }

  public subscribe(listener: (record: NotificationRecord) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(record: NotificationRecord): void {
    this.listeners.forEach(l => l(record));
  }
}

export const notificationManager = NotificationManager.getInstance();
