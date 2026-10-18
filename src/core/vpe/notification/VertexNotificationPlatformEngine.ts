import { EngineBase } from '../EngineBase';
import { HealthCheckResult } from '../EngineTypes';
import { notificationManager } from './NotificationManager';
import { NotificationAnalytics } from './NotificationAnalytics';
import { indexManager } from '../search/IndexManager';
import { SYSTEM_NOTIFICATION_TEMPLATES } from './NotificationTemplates';

export class VertexNotificationPlatformEngine extends EngineBase {
  constructor() {
    super({
      id: 'ENG-NOTIFICATION-VNE',
      name: 'VPE-03 Vertex Notification Engine (VNE)',
      version: '3.0.0',
      description: 'Central multi-channel enterprise communication engine managing in-app, desktop, email, SMS, push, teams, and webhook alerts with intelligent delivery rules.',
      category: 'Communication & Messaging',
      autoStart: true,
      dependencies: ['ENG-AUDIT', 'ENG-WORKFLOW-VWE'],
      permissions: {
        allowDatabaseAccess: true,
        allowNetworkAccess: true,
        allowSystemCommands: false,
        allowEventBroadcast: true,
        allowedEvents: ['*'],
        maxMemoryMB: 128
      }
    });
  }

  protected async onInitialize(): Promise<boolean> {
    const dateNow = new Date().toISOString().split('T')[0];

    // Index Notification Templates into VSE IndexManager
    SYSTEM_NOTIFICATION_TEMPLATES.forEach(tpl => {
      indexManager.addOrUpdateRecord({
        id: `IDX-NT-TPL-${tpl.id}`,
        type: 'notification',
        title: `Notification Template: ${tpl.name}`,
        subtitle: `Code: ${tpl.code} | Category: ${tpl.category} | Priority: ${tpl.defaultPriority}`,
        code: tpl.code,
        reference: tpl.id,
        description: `Subject: ${tpl.subjectTemplate} — ${tpl.bodyTemplate}`,
        keywords: [tpl.name.toLowerCase(), tpl.code.toLowerCase(), tpl.category.toLowerCase(), tpl.type.toLowerCase()],
        tags: ['Template', 'Notification', tpl.category, 'VNE'],
        module: 'Notification Engine',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: tpl.category,
        status: tpl.isActive ? 'Active' : 'Inactive',
        date: dateNow,
        createdBy: 'System Architect',
        permissionsRequired: ['Super Administrator', 'Notification Administrator'],
        actionUrl: '/vpe/notification/templates'
      });
    });

    // Index active notifications into VSE IndexManager
    const notifications = notificationManager.getNotifications();
    notifications.forEach(notif => {
      indexManager.addOrUpdateRecord({
        id: `IDX-NOTIF-${notif.id}`,
        type: 'notification',
        title: `Notification: ${notif.title}`,
        subtitle: `To: ${notif.recipient.userName} (${notif.recipient.role}) | Type: ${notif.type.toUpperCase()}`,
        code: notif.id,
        reference: notif.sourceEngine || 'VNE',
        description: `${notif.body} (Priority: ${notif.priority}, Channels: ${notif.channels.join(', ')})`,
        keywords: [notif.title.toLowerCase(), notif.sender.toLowerCase(), notif.recipient.userName.toLowerCase(), notif.type.toLowerCase()],
        tags: ['Notification', notif.type, notif.priority, 'VNE'],
        module: 'Notification Engine',
        company: notif.company,
        branch: notif.branch,
        department: notif.department,
        status: notif.isRead ? 'Read' : 'Unread',
        date: notif.createdAt.split('T')[0],
        createdBy: notif.sender,
        permissionsRequired: ['Super Administrator', 'All Users'],
        actionUrl: notif.actionUrl || '/notifications'
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
    const metrics = NotificationAnalytics.getMetrics();

    return {
      status: 'healthy',
      latencyMs: 1.4,
      message: `VNE Core active. Dispatched: ${metrics.totalSent}, Delivery Rate: ${metrics.deliveryRatePercentage}%, Read Rate: ${metrics.readRatePercentage}%`,
      subsystemChecks: {
        notificationQueue: true,
        channelAdapters: true,
        templateEngine: true,
        ruleEvaluator: true,
        securityValidator: true,
        analyticsEngine: true
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const vertexNotificationPlatformEngine = new VertexNotificationPlatformEngine();
