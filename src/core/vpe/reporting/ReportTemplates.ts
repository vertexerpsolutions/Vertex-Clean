import { ReportDefinition, ExecutiveDashboardConfig } from './ReportTypes';

export const SYSTEM_REPORT_TEMPLATES: ReportDefinition[] = [
  {
    id: 'RPT-FIN-001',
    code: 'VR-FIN-001',
    title: 'Executive Financial Trial Balance & P&L Analysis',
    description: 'Comprehensive general ledger summary featuring gross revenues, COGS, operational expenses, EBIT, and net income by cost center.',
    category: 'FINANCIAL',
    type: 'TABLE',
    dataSource: 'Vertex Financial Engine (VFE General Ledger)',
    version: '2.4.0',
    isActive: true,
    parameters: [
      { id: 'param-fiscal-year', name: 'fiscalYear', type: 'SELECT', defaultValue: 'FY-2026', options: ['FY-2024', 'FY-2025', 'FY-2026'], isRequired: true, label: 'Fiscal Year' },
      { id: 'param-branch', name: 'branch', type: 'SELECT', defaultValue: 'HQ-NY', options: ['ALL', 'HQ-NY', 'BR-LON', 'BR-SGP'], isRequired: false, label: 'Branch Location' }
    ],
    columns: [
      { field: 'accountCode', header: 'Account Code', dataType: 'STRING', isSortable: true },
      { field: 'accountName', header: 'Account Name', dataType: 'STRING', isSortable: true, isGroupable: true },
      { field: 'department', header: 'Department', dataType: 'STRING', isGroupable: true },
      { field: 'budgetAmount', header: 'Budget ($)', dataType: 'CURRENCY', align: 'right' },
      { field: 'actualAmount', header: 'Actual ($)', dataType: 'CURRENCY', align: 'right' },
      { field: 'variance', header: 'Variance ($)', dataType: 'CURRENCY', align: 'right' },
      { field: 'variancePercent', header: 'Variance (%)', dataType: 'PERCENTAGE', align: 'right' }
    ],
    rolesPermitted: ['Super Administrator', 'Chief Financial Officer', 'Finance Controller'],
    createdBy: 'Vertex Platform Architect',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-08-01T12:00:00Z'
  },
  {
    id: 'RPT-EXEC-002',
    code: 'VR-EXEC-002',
    title: 'Global Enterprise EBITDA & Revenue Breakdown',
    description: 'Executive quarterly revenue trajectories, consolidated gross margins, EBITDA, and subsidiary contribution comparison.',
    category: 'EXECUTIVE',
    type: 'CHART',
    chartType: 'BAR',
    dataSource: 'Consolidated ERP Data Lake',
    version: '1.8.0',
    isActive: true,
    parameters: [
      { id: 'param-period', name: 'period', type: 'SELECT', defaultValue: 'Q3-2026', options: ['Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026'], isRequired: true, label: 'Quarterly Period' }
    ],
    columns: [
      { field: 'quarter', header: 'Quarter', dataType: 'STRING' },
      { field: 'revenue', header: 'Gross Revenue ($)', dataType: 'CURRENCY', align: 'right' },
      { field: 'ebitda', header: 'EBITDA ($)', dataType: 'CURRENCY', align: 'right' },
      { field: 'marginPercent', header: 'EBITDA Margin', dataType: 'PERCENTAGE', align: 'right' }
    ],
    rolesPermitted: ['Super Administrator', 'Chief Executive Officer', 'Chief Financial Officer', 'Board Member'],
    createdBy: 'Vertex Platform Architect',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-08-01T12:00:00Z'
  },
  {
    id: 'RPT-PROC-003',
    code: 'VR-PROC-003',
    title: 'Procurement PO Spend & Vendor Performance Audit',
    description: 'Detailed analysis of purchase orders, vendor fulfillment speed, multi-level approval SLAs, and cost savings metrics.',
    category: 'PROCUREMENT',
    type: 'PIVOT',
    dataSource: 'Procurement Engine & VWE Workflow Log',
    version: '3.1.0',
    isActive: true,
    parameters: [
      { id: 'param-vendor', name: 'vendorName', type: 'STRING', defaultValue: 'All Vendors', isRequired: false, label: 'Vendor Filter' }
    ],
    columns: [
      { field: 'poNumber', header: 'PO Number', dataType: 'STRING', isSortable: true },
      { field: 'vendor', header: 'Vendor Name', dataType: 'STRING', isGroupable: true },
      { field: 'category', header: 'Category', dataType: 'STRING', isGroupable: true },
      { field: 'amount', header: 'Total Value ($)', dataType: 'CURRENCY', align: 'right' },
      { field: 'approvalDays', header: 'Approval SLA (Days)', dataType: 'NUMBER', align: 'center' },
      { field: 'status', header: 'Status', dataType: 'STRING' }
    ],
    rolesPermitted: ['Super Administrator', 'VP of Procurement', 'Procurement Officer'],
    createdBy: 'Procurement Domain Lead',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-08-02T10:00:00Z'
  },
  {
    id: 'RPT-HR-004',
    code: 'VR-HR-004',
    title: 'Human Capital Workforce Turnover & Headcount Metrics',
    description: 'Departmental headcount stats, employee retention rates, recruitment pipeline throughput, and payroll expense ratio.',
    category: 'HR',
    type: 'CHART',
    chartType: 'DONUT',
    dataSource: 'Human Resources Management Module',
    version: '2.0.0',
    isActive: true,
    parameters: [
      { id: 'param-dept', name: 'department', type: 'SELECT', defaultValue: 'ALL', options: ['ALL', 'Engineering', 'Finance', 'Procurement', 'Sales'], isRequired: false, label: 'Department' }
    ],
    columns: [
      { field: 'department', header: 'Department', dataType: 'STRING' },
      { field: 'activeHeadcount', header: 'Active Staff', dataType: 'NUMBER', align: 'right' },
      { field: 'newHires', header: 'New Hires (YTD)', dataType: 'NUMBER', align: 'right' },
      { field: 'turnoverRate', header: 'Turnover Rate', dataType: 'PERCENTAGE', align: 'right' }
    ],
    rolesPermitted: ['Super Administrator', 'Chief Human Resources Officer', 'HR Director'],
    createdBy: 'HR Systems Specialist',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-08-01T12:00:00Z'
  },
  {
    id: 'RPT-SYS-005',
    code: 'VR-SYS-005',
    title: 'Vertex Platform Engine Performance & Execution Telemetry',
    description: 'Platform subsystem health checks, VSE index query counts, VWE workflow execution durations, and VNE notification delivery SLAs.',
    category: 'PLATFORM',
    type: 'COMPOSITE_DASHBOARD',
    dataSource: 'Vertex Platform Engines (VSE, VWE, VNE, VFE)',
    version: '3.0.0',
    isActive: true,
    parameters: [],
    columns: [
      { field: 'engineId', header: 'Engine ID', dataType: 'STRING' },
      { field: 'engineName', header: 'Engine Name', dataType: 'STRING' },
      { field: 'latencyMs', header: 'Avg Latency (ms)', dataType: 'NUMBER', align: 'right' },
      { field: 'healthStatus', header: 'Health Status', dataType: 'STRING' },
      { field: 'throughput', header: 'Operations / min', dataType: 'NUMBER', align: 'right' }
    ],
    rolesPermitted: ['Super Administrator', 'Platform Systems Architect'],
    createdBy: 'Platform Core Architect',
    createdAt: '2026-05-15T08:00:00Z',
    updatedAt: '2026-08-05T12:00:00Z'
  }
];

export const DEFAULT_EXECUTIVE_DASHBOARDS: ExecutiveDashboardConfig[] = [
  {
    id: 'DASH-EXEC-MAIN',
    title: 'Executive Enterprise Operational Dashboard',
    category: 'EXECUTIVE',
    widgets: [
      { id: 'w-1', title: 'Q3 Enterprise Revenue', reportId: 'RPT-EXEC-002', widgetType: 'KPI', gridSpan: 1, kpiValue: '$14,280,000', kpiTrend: '+18.4% YoY', kpiStatus: 'positive' },
      { id: 'w-2', title: 'Consolidated EBITDA Margin', reportId: 'RPT-EXEC-002', widgetType: 'KPI', gridSpan: 1, kpiValue: '32.6%', kpiTrend: '+2.1% Target', kpiStatus: 'positive' },
      { id: 'w-3', title: 'Active PO Volume', reportId: 'RPT-PROC-003', widgetType: 'KPI', gridSpan: 1, kpiValue: '$3,850,000', kpiTrend: '48 Approved', kpiStatus: 'neutral' },
      { id: 'w-4', title: 'Total Enterprise Headcount', reportId: 'RPT-HR-004', widgetType: 'KPI', gridSpan: 1, kpiValue: '1,420 FTE', kpiTrend: '98.2% Retention', kpiStatus: 'positive' }
    ]
  }
];
