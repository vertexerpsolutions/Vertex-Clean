import { 
  ReportDefinition, 
  ReportExecutionResult, 
  ReportDataRow, 
  ReportCategory, 
  ExportFormat 
} from './ReportTypes';
import { SYSTEM_REPORT_TEMPLATES } from './ReportTemplates';
import { auditEngine } from '../../../services/auditEngine';

export class ReportManager {
  private static instance: ReportManager;
  private reports: Map<string, ReportDefinition> = new Map();
  private cache: Map<string, ReportExecutionResult> = new Map();

  private constructor() {
    this.seedDefaultReports();
  }

  public static getInstance(): ReportManager {
    if (!ReportManager.instance) {
      ReportManager.instance = new ReportManager();
    }
    return ReportManager.instance;
  }

  private seedDefaultReports(): void {
    SYSTEM_REPORT_TEMPLATES.forEach(rpt => this.reports.set(rpt.id, rpt));
  }

  public getReports(category?: ReportCategory): ReportDefinition[] {
    const list = Array.from(this.reports.values());
    if (category) {
      return list.filter(r => r.category === category);
    }
    return list;
  }

  public getReportById(id: string): ReportDefinition | undefined {
    return this.reports.get(id);
  }

  public saveReport(report: ReportDefinition): ReportDefinition {
    this.reports.set(report.id, report);
    auditEngine.logAction(
      'REPORT_SAVE',
      'VRE Designer',
      `Saved report definition ${report.code} (${report.title})`,
      'info',
      report.createdBy || 'Report Designer'
    );
    return report;
  }

  public executeReport(reportId: string, parameters: Record<string, any> = {}): ReportExecutionResult {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }

    const cacheKey = `${reportId}-${JSON.stringify(parameters)}`;
    if (this.cache.has(cacheKey)) {
      const cachedResult = this.cache.get(cacheKey)!;
      return { ...cachedResult, cached: true };
    }

    const startTime = performance.now();
    const data = this.generateMockReportData(report, parameters);
    const endTime = performance.now();

    const result: ReportExecutionResult = {
      reportId: report.id,
      reportTitle: report.title,
      executedAt: new Date().toISOString(),
      executionTimeMs: Math.round((endTime - startTime) * 10) / 10 || 1.2,
      totalRows: data.length,
      parametersUsed: parameters,
      data,
      summaryRow: this.calculateSummaryRow(data, report),
      cached: false
    };

    this.cache.set(cacheKey, result);

    auditEngine.logAction(
      'REPORT_EXECUTE',
      'VRE Core Engine',
      `Executed report ${report.code} (${report.title}) - ${data.length} rows returned in ${result.executionTimeMs}ms`,
      'info',
      'VRE Query Processor'
    );

    return result;
  }

  private generateMockReportData(report: ReportDefinition, parameters: Record<string, any>): ReportDataRow[] {
    switch (report.id) {
      case 'RPT-FIN-001':
        return [
          { accountCode: '4000-REV', accountName: 'Enterprise Software License Revenue', department: 'Sales', budgetAmount: 12000000, actualAmount: 13850000, variance: 1850000, variancePercent: 15.4 },
          { accountCode: '4100-SRV', accountName: 'Professional Services & Consulting', department: 'Services', budgetAmount: 4500000, actualAmount: 4920000, variance: 420000, variancePercent: 9.3 },
          { accountCode: '5000-COGS', accountName: 'Cloud Infrastructure & Hosting COGS', department: 'Operations', budgetAmount: 3200000, actualAmount: 3050000, variance: -150000, variancePercent: -4.7 },
          { accountCode: '6000-SAL', accountName: 'Engineering & Product Staff Salaries', department: 'Engineering', budgetAmount: 6800000, actualAmount: 6710000, variance: -90000, variancePercent: -1.3 },
          { accountCode: '6200-MKT', accountName: 'Global Enterprise Marketing Campaign', department: 'Marketing', budgetAmount: 1800000, actualAmount: 1940000, variance: 140000, variancePercent: 7.8 }
        ];

      case 'RPT-EXEC-002':
        return [
          { quarter: 'Q1-2026', revenue: 11200000, ebitda: 3580000, marginPercent: 32.0 },
          { quarter: 'Q2-2026', revenue: 12850000, ebitda: 4180000, marginPercent: 32.5 },
          { quarter: 'Q3-2026', revenue: 14280000, ebitda: 4655000, marginPercent: 32.6 },
          { quarter: 'Q4-2026 (Est)', revenue: 16100000, ebitda: 5313000, marginPercent: 33.0 }
        ];

      case 'RPT-PROC-003':
        return [
          { poNumber: 'PO-2026-8841', vendor: 'Global Server Infrastructure Inc', category: 'IT Hardware', amount: 450000, approvalDays: 1.2, status: 'APPROVED' },
          { poNumber: 'PO-2026-8842', vendor: 'TechCorp Software Licensing LLC', category: 'SaaS', amount: 185000, approvalDays: 0.8, status: 'APPROVED' },
          { poNumber: 'PO-2026-8843', vendor: 'Apex Office Facilities Corp', category: 'Facilities', amount: 62000, approvalDays: 2.1, status: 'PENDING' },
          { poNumber: 'PO-2026-8844', vendor: 'CyberShield Security Consulting', category: 'Security', amount: 290000, approvalDays: 1.5, status: 'APPROVED' }
        ];

      case 'RPT-HR-004':
        return [
          { department: 'Engineering & Product', activeHeadcount: 640, newHires: 48, turnoverRate: 2.1 },
          { department: 'Sales & Business Dev', activeHeadcount: 320, newHires: 28, turnoverRate: 3.4 },
          { department: 'Finance & Legal', activeHeadcount: 180, newHires: 12, turnoverRate: 1.2 },
          { department: 'Procurement & Ops', activeHeadcount: 280, newHires: 18, turnoverRate: 1.8 }
        ];

      case 'RPT-SYS-005':
        return [
          { engineId: 'ENG-SEARCH-VSE', engineName: 'VPE-01 Vertex Universal Search Engine', latencyMs: 2.1, healthStatus: 'HEALTHY', throughput: 1420 },
          { engineId: 'ENG-WORKFLOW-VWE', engineName: 'VPE-02 Vertex Workflow Engine', latencyMs: 1.8, healthStatus: 'HEALTHY', throughput: 890 },
          { engineId: 'ENG-NOTIFICATION-VNE', engineName: 'VPE-03 Vertex Notification Engine', latencyMs: 1.4, healthStatus: 'HEALTHY', throughput: 2300 },
          { engineId: 'ENG-REPORTING-VRE', engineName: 'VPE-04 Vertex Reporting Engine', latencyMs: 1.2, healthStatus: 'HEALTHY', throughput: 640 }
        ];

      default:
        return [
          { id: '1', item: 'Sample Data Record A', value: 100, category: 'General' },
          { id: '2', item: 'Sample Data Record B', value: 250, category: 'General' }
        ];
    }
  }

  private calculateSummaryRow(data: ReportDataRow[], report: ReportDefinition): Record<string, any> | undefined {
    if (data.length === 0) return undefined;

    const summary: Record<string, any> = {};
    let hasNumeric = false;

    report.columns.forEach(col => {
      if (col.dataType === 'CURRENCY' || col.dataType === 'NUMBER') {
        hasNumeric = true;
        const total = data.reduce((sum, row) => sum + (Number(row[col.field]) || 0), 0);
        summary[col.field] = total;
      } else if (col.dataType === 'PERCENTAGE') {
        const avg = data.reduce((sum, row) => sum + (Number(row[col.field]) || 0), 0) / data.length;
        summary[col.field] = Math.round(avg * 10) / 10;
      } else {
        summary[col.field] = '—';
      }
    });

    if (report.columns.length > 0) {
      summary[report.columns[0].field] = 'CONSOLIDATED TOTAL';
    }

    return hasNumeric ? summary : undefined;
  }

  public exportReport(reportId: string, format: ExportFormat, parameters: Record<string, any> = {}): { filename: string; mimeType: string; content: string } {
    const result = this.executeReport(reportId, parameters);
    const filename = `${result.reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;

    let content = '';
    let mimeType = 'text/plain';

    if (format === 'CSV') {
      mimeType = 'text/csv';
      const keys = Object.keys(result.data[0] || {});
      content = keys.join(',') + '\n';
      result.data.forEach(row => {
        content += keys.map(k => `"${row[k]}"`).join(',') + '\n';
      });
    } else if (format === 'HTML') {
      mimeType = 'text/html';
      content = `<html><head><title>${result.reportTitle}</title></head><body style="font-family:sans-serif;padding:20px;"><h1>${result.reportTitle}</h1><table border="1" cellpadding="8" style="border-collapse:collapse;">`;
      const keys = Object.keys(result.data[0] || {});
      content += '<tr>' + keys.map(k => `<th>${k}</th>`).join('') + '</tr>';
      result.data.forEach(row => {
        content += '<tr>' + keys.map(k => `<td>${row[k]}</td>`).join('') + '</tr>';
      });
      content += '</table></body></html>';
    } else {
      // PDF, EXCEL, WORD representation
      mimeType = 'application/octet-stream';
      content = `[VERTEX REPORTING ENGINE EXPORT BUNDLE - FORMAT: ${format}]\nTitle: ${result.reportTitle}\nExecuted At: ${result.executedAt}\nRows: ${result.totalRows}\n\n` + JSON.stringify(result.data, null, 2);
    }

    auditEngine.logAction(
      'REPORT_EXPORT',
      'VRE Export Manager',
      `Exported report ${result.reportTitle} in format ${format} (${filename})`,
      'info',
      'VRE Export Engine'
    );

    return { filename, mimeType, content };
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const reportManager = ReportManager.getInstance();
