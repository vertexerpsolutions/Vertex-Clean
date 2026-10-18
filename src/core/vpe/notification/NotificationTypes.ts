export type NotificationChannel = 
  | 'in_app'
  | 'desktop'
  | 'email'
  | 'sms'
  | 'push'
  | 'whatsapp'
  | 'teams'
  | 'webhook';

export type NotificationType = 
  | 'information'
  | 'warning'
  | 'success'
  | 'error'
  | 'critical'
  | 'approval_request'
  | 'reminder'
  | 'task_assignment'
  | 'workflow_update'
  | 'system_alert'
  | 'security_alert';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

export type NotificationStatus = 'queued' | 'processing' | 'delivered' | 'failed' | 'read' | 'archived';

export interface NotificationRecipient {
  userId: string;
  userName: string;
  email?: string;
  phone?: string;
  role: string;
  department: string;
  company: string;
  branch: string;
}

export interface NotificationDeliveryLog {
  id: string;
  channel: NotificationChannel;
  status: 'sent' | 'failed' | 'skipped' | 'bounced';
  timestamp: string;
  errorMessage?: string;
  retryCount: number;
}

export interface NotificationRecord {
  id: string;
  templateId?: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel[];
  recipient: NotificationRecipient;
  sender: string;
  sourceEngine?: string; // e.g. 'VWE', 'FINANCE', 'PROCUREMENT'
  actionUrl?: string;
  metadata?: Record<string, any>;
  isPinned?: boolean;
  isRead?: boolean;
  readAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  createdAt: string;
  deliveredAt?: string;
  deliveryLogs: NotificationDeliveryLog[];
  company: string;
  branch: string;
  department: string;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  type: NotificationType;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  subjectTemplate: string;
  bodyTemplate: string;
  category: string;
  isActive: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  eventTrigger: string;
  companyRestriction?: string;
  branchRestriction?: string;
  departmentRestriction?: string;
  roleRestriction?: string;
  channels: NotificationChannel[];
  isEnabled: boolean;
}

export interface NotificationAnalyticsMetrics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  readRatePercentage: number;
  deliveryRatePercentage: number;
  channelUsage: Record<NotificationChannel, number>;
  typeDistribution: Record<NotificationType, number>;
  pendingQueueCount: number;
  avgLatencyMs: number;
}
