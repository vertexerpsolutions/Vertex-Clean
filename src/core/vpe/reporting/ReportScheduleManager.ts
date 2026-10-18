import { ScheduledReportConfig, ScheduleFrequency, ExportFormat } from './ReportTypes';
import { reportManager } from './ReportManager';
import { notificationManager } from '../notification/NotificationManager';
import { auditEngine } from '../../../services/auditEngine';

export class ReportScheduleManager {
  private static instance: ReportScheduleManager;
  private schedules: Map<string, ScheduledReportConfig> = new Map();

  private constructor() {
    this.seedDefaultSchedules();
  }

  public static getInstance(): ReportScheduleManager {
    if (!ReportScheduleManager.instance) {
      ReportScheduleManager.instance = new ReportScheduleManager();
    }
    return ReportScheduleManager.instance;
  }

  private seedDefaultSchedules(): void {
    const initial: ScheduledReportConfig[] = [
      {
        id: 'SCHED-001',
        reportId: 'RPT-FIN-001',
        reportTitle: 'Executive Financial Trial Balance & P&L Analysis',
        frequency: 'DAILY',
        timeOfDay: '07:00 AM',
        recipients: ['a.vance@vertexglobal.com', 'e.rostova@vertexglobal.com'],
        channels: ['EMAIL', 'IN_APP'],
        exportFormat: 'PDF',
        isEnabled: true,
        lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString()
      },
      {
        id: 'SCHED-002',
        reportId: 'RPT-PROC-003',
        reportTitle: 'Procurement PO Spend & Vendor Performance Audit',
        frequency: 'WEEKLY',
        timeOfDay: '08:00 AM',
        recipients: ['m.thorne@vertexglobal.com'],
        channels: ['EMAIL', 'TEAMS'],
        exportFormat: 'EXCEL',
        isEnabled: true,
        lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString()
      }
    ];

    initial.forEach(s => this.schedules.set(s.id, s));
  }

  public getSchedules(): ScheduledReportConfig[] {
    return Array.from(this.schedules.values());
  }

  public addSchedule(config: Omit<ScheduledReportConfig, 'id'>): ScheduledReportConfig {
    const newConfig: ScheduledReportConfig = {
      ...config,
      id: `SCHED-${Date.now()}`
    };
    this.schedules.set(newConfig.id, newConfig);

    auditEngine.logAction(
      'REPORT_SCHEDULE_CREATE',
      'VRE Scheduler',
      `Created automated schedule ${newConfig.id} for report "${newConfig.reportTitle}" (${newConfig.frequency})`,
      'info',
      'VRE Scheduler'
    );

    return newConfig;
  }

  public toggleSchedule(id: string): boolean {
    const sched = this.schedules.get(id);
    if (!sched) return false;
    sched.isEnabled = !sched.isEnabled;
    return sched.isEnabled;
  }

  public executeScheduleNow(id: string): boolean {
    const sched = this.schedules.get(id);
    if (!sched) return false;

    // Execute report
    const exportBundle = reportManager.exportReport(sched.reportId, sched.exportFormat);

    // Send automated email/notification alert via VNE
    sched.recipients.forEach(email => {
      notificationManager.sendNotification({
        title: `Automated Scheduled Report: ${sched.reportTitle}`,
        body: `The automated ${sched.frequency} report "${sched.reportTitle}" has been generated and exported as ${sched.exportFormat} (${exportBundle.filename}).`,
        type: 'information',
        priority: 'NORMAL',
        channels: ['in_app', 'email'],
        recipient: {
          userId: `USR-${email}`,
          userName: email.split('@')[0].replace('.', ' ').toUpperCase(),
          email,
          role: 'Scheduled Report Subscriber',
          department: 'Executive Board',
          company: 'Vertex Global Enterprises Corp',
          branch: 'HQ-NY'
        },
        sender: 'VRE Scheduled Automation Processor',
        sourceEngine: 'VRE',
        actionUrl: '/vre/reports'
      });
    });

    sched.lastRunAt = new Date().toISOString();
    return true;
  }
}

export const reportScheduleManager = ReportScheduleManager.getInstance();
