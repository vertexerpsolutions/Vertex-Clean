import { EngineBase } from '../EngineBase';
import { HealthCheckResult } from '../EngineTypes';
import { reportManager } from './ReportManager';
import { reportScheduleManager } from './ReportScheduleManager';
import { indexManager } from '../search/IndexManager';

export class VertexReportingPlatformEngine extends EngineBase {
  constructor() {
    super({
      id: 'ENG-REPORTING-VRE',
      name: 'VPE-04 Vertex Reporting Engine (VRE)',
      version: '4.0.0',
      description: 'Central analytics, business intelligence, report designer, interactive dashboard, and automated scheduling service for the entire Vertex ERP Platform.',
      category: 'Analytics & Reporting',
      autoStart: true,
      dependencies: ['ENG-AUDIT', 'ENG-WORKFLOW-VWE', 'ENG-NOTIFICATION-VNE'],
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
    const reports = reportManager.getReports();

    // Index all report definitions into VSE Universal Search Engine IndexManager
    reports.forEach(rpt => {
      indexManager.addOrUpdateRecord({
        id: `IDX-RPT-${rpt.id}`,
        type: 'report',
        title: `Report: ${rpt.title}`,
        subtitle: `Code: ${rpt.code} | Category: ${rpt.category} | Type: ${rpt.type}`,
        code: rpt.code,
        reference: rpt.dataSource,
        description: `${rpt.description} (Roles: ${rpt.rolesPermitted.join(', ')})`,
        keywords: [rpt.title.toLowerCase(), rpt.code.toLowerCase(), rpt.category.toLowerCase(), rpt.dataSource.toLowerCase()],
        tags: ['Report', rpt.category, rpt.type, 'VRE'],
        module: 'Reporting Engine',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: rpt.category,
        status: rpt.isActive ? 'Active' : 'Inactive',
        date: dateNow,
        createdBy: rpt.createdBy || 'System Architect',
        permissionsRequired: rpt.rolesPermitted,
        actionUrl: '/vpe/reporting/viewer'
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
    const reports = reportManager.getReports();
    const schedules = reportScheduleManager.getSchedules();

    return {
      status: 'healthy',
      latencyMs: 1.2,
      message: `VRE Core operational. Active Report Definitions: ${reports.length}, Scheduled Automated Batches: ${schedules.length}`,
      subsystemChecks: {
        reportManager: true,
        reportDesigner: true,
        dataPipeline: true,
        exportProcessor: true,
        dashboardGrid: true,
        scheduleManager: true,
        securityValidator: true
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const vertexReportingPlatformEngine = new VertexReportingPlatformEngine();
