export type ReportCategory = 
  | 'EXECUTIVE'
  | 'FINANCIAL'
  | 'SALES'
  | 'INVENTORY'
  | 'HR'
  | 'PROCUREMENT'
  | 'OPERATIONS'
  | 'PLATFORM';

export type ReportType = 'TABLE' | 'CHART' | 'PIVOT' | 'COMPOSITE_DASHBOARD';

export type ChartType = 'BAR' | 'LINE' | 'PIE' | 'DONUT' | 'AREA' | 'RADAR';

export type ExportFormat = 'PDF' | 'EXCEL' | 'WORD' | 'CSV' | 'HTML';

export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';

export interface ReportParameter {
  id: string;
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  defaultValue?: any;
  options?: string[];
  isRequired: boolean;
  label: string;
}

export interface ReportColumnDef {
  field: string;
  header: string;
  dataType: 'STRING' | 'CURRENCY' | 'NUMBER' | 'PERCENTAGE' | 'DATE';
  align?: 'left' | 'center' | 'right';
  isSortable?: boolean;
  isGroupable?: boolean;
}

export interface ReportDefinition {
  id: string;
  code: string;
  title: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  chartType?: ChartType;
  dataSource: string; // e.g., 'VFE Financial Ledger', 'Procurement Engine', 'Workflow Telemetry'
  version: string;
  isActive: boolean;
  parameters: ReportParameter[];
  columns: ReportColumnDef[];
  companyRestriction?: string;
  departmentRestriction?: string;
  rolesPermitted: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDataRow {
  [key: string]: any;
}

export interface ReportExecutionResult {
  reportId: string;
  reportTitle: string;
  executedAt: string;
  executionTimeMs: number;
  totalRows: number;
  parametersUsed: Record<string, any>;
  data: ReportDataRow[];
  summaryRow?: Record<string, any>;
  cached: boolean;
}

export interface ScheduledReportConfig {
  id: string;
  reportId: string;
  reportTitle: string;
  frequency: ScheduleFrequency;
  timeOfDay: string; // e.g. "08:00 AM"
  recipients: string[]; // Email addresses or User IDs
  channels: ('EMAIL' | 'IN_APP' | 'TEAMS')[];
  exportFormat: ExportFormat;
  isEnabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  reportId: string;
  widgetType: 'KPI' | 'CHART' | 'MINI_TABLE';
  gridSpan: number; // 1 to 4
  kpiValue?: string;
  kpiTrend?: string;
  kpiStatus?: 'positive' | 'negative' | 'neutral';
}

export interface ExecutiveDashboardConfig {
  id: string;
  title: string;
  category: ReportCategory;
  widgets: DashboardWidget[];
}
