import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  PieChart, 
  Settings, 
  Plus, 
  Download, 
  Mail, 
  Search, 
  Clock, 
  Filter, 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  Database, 
  Layers, 
  Sliders, 
  Printer, 
  Eye, 
  Code, 
  BookOpen, 
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Zap
} from 'lucide-react';
import { 
  reportManager, 
  reportScheduleManager, 
  ReportDefinition, 
  ReportCategory, 
  ReportExecutionResult, 
  ExportFormat, 
  ScheduledReportConfig,
  SYSTEM_REPORT_TEMPLATES,
  DEFAULT_EXECUTIVE_DASHBOARDS
} from '../../../core/vpe/reporting';

interface VREWorkspaceProps {
  onOpenGlobalSearch?: () => void;
}

export const VREWorkspace: React.FC<VREWorkspaceProps> = ({ onOpenGlobalSearch }) => {
  const [activeTab, setActiveTab] = useState<'dashboards' | 'catalog' | 'designer' | 'schedules' | 'docs'>('dashboards');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'ALL'>('ALL');
  const [selectedReportId, setSelectedReportId] = useState<string>('RPT-FIN-001');
  const [activeReportResult, setActiveReportResult] = useState<ReportExecutionResult | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>('executive.board@vertexglobal.com');

  // Report Designer State
  const [designerTitle, setDesignerTitle] = useState<string>('Custom Operating Margin Audit');
  const [designerCategory, setDesignerCategory] = useState<ReportCategory>('FINANCIAL');
  const [designerType, setDesignerType] = useState<'TABLE' | 'CHART' | 'PIVOT'>('TABLE');
  const [designerDataSource, setDesignerDataSource] = useState<string>('VFE Ledger & Procurement Engine');
  const [designerSavedSuccess, setDesignerSavedSuccess] = useState<boolean>(false);

  // Scheduled Reports state
  const [schedules, setSchedules] = useState<ScheduledReportConfig[]>(reportScheduleManager.getSchedules());

  const reports = reportManager.getReports(selectedCategory === 'ALL' ? undefined : selectedCategory);
  const currentReport = reportManager.getReportById(selectedReportId) || reports[0];

  const handleRunReport = (reportId: string = selectedReportId) => {
    try {
      const result = reportManager.executeReport(reportId, parameters);
      setActiveReportResult(result);
    } catch (err: any) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (selectedReportId) {
      handleRunReport(selectedReportId);
    }
  }, [selectedReportId]);

  const handleExport = (format: ExportFormat) => {
    if (!currentReport) return;
    const bundle = reportManager.exportReport(currentReport.id, format, parameters);
    setExportMessage(`Successfully generated ${format} export: ${bundle.filename}`);
    setTimeout(() => setExportMessage(null), 4000);
  };

  const handleSaveCustomReport = () => {
    const newReport: ReportDefinition = {
      id: `RPT-CUST-${Date.now().toString().slice(-4)}`,
      code: `VR-CUST-${Math.floor(100 + Math.random() * 900)}`,
      title: designerTitle,
      description: `Custom report generated via VRE Report Designer targeting ${designerDataSource}.`,
      category: designerCategory,
      type: designerType,
      dataSource: designerDataSource,
      version: '1.0.0',
      isActive: true,
      parameters: [
        { id: 'p1', name: 'timeRange', type: 'SELECT', defaultValue: 'Current Month', options: ['Current Month', 'YTD', 'Q3-2026'], isRequired: true, label: 'Time Window' }
      ],
      columns: [
        { field: 'entity', header: 'Entity / Cost Center', dataType: 'STRING', isSortable: true },
        { field: 'budget', header: 'Allocated Budget ($)', dataType: 'CURRENCY', align: 'right' },
        { field: 'actual', header: 'Actual Spent ($)', dataType: 'CURRENCY', align: 'right' },
        { field: 'variance', header: 'Variance ($)', dataType: 'CURRENCY', align: 'right' }
      ],
      rolesPermitted: ['Super Administrator', 'Chief Financial Officer'],
      createdBy: 'Vertex Administrator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reportManager.saveReport(newReport);
    setDesignerSavedSuccess(true);
    setTimeout(() => setDesignerSavedSuccess(false), 3500);
    setSelectedReportId(newReport.id);
  };

  const handleTriggerScheduleNow = (id: string) => {
    reportScheduleManager.executeScheduleNow(id);
    setSchedules([...reportScheduleManager.getSchedules()]);
    setExportMessage('Automated schedule executed and dispatches logged to VNE Notification Engine.');
    setTimeout(() => setExportMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* VRE Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-600 rounded-lg shadow-md">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">VPE-04 Vertex Reporting Engine (VRE)</h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                    v4.0.0 Operational
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Centralized Enterprise Business Intelligence, Drag-and-Drop Report Designer, Dashboards & Automated Schedules
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenGlobalSearch && (
              <button
                onClick={onOpenGlobalSearch}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span>Search Reports (VSE)</span>
              </button>
            )}
            
            <button
              onClick={() => {
                reportManager.clearCache();
                handleRunReport();
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Purge Cache</span>
            </button>

            <button
              onClick={() => setActiveTab('designer')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Designer</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 mt-6 pt-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboards')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'dashboards'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Executive Dashboards</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Report Viewer & Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('designer')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'designer'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Report Designer</span>
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'schedules'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Scheduled Delivery</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'docs'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Developer API Docs</span>
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{exportMessage}</span>
          </div>
          <button onClick={() => setExportMessage(null)} className="text-emerald-600 hover:text-emerald-800 text-xs">Dismiss</button>
        </div>
      )}

      {/* TAB 1: EXECUTIVE DASHBOARDS */}
      {activeTab === 'dashboards' && (
        <div className="space-y-6">
          {/* Executive KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Q3 Consolidated Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">$14,280,000</div>
              <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% YoY Growth</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>EBITDA Margin Rate</span>
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">32.6%</div>
              <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+2.1% vs Annual Target</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Procurement Commitments</span>
                <ShoppingBag className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">$3,850,000</div>
              <div className="text-xs text-slate-500 font-medium">48 Approved PO Workflows</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Global Active Staff</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">1,420 FTE</div>
              <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>98.2% Retention Rate</span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EBITDA & Revenue Chart Widget */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Enterprise EBITDA & Revenue Trajectory</h3>
                  <p className="text-xs text-slate-500">Consolidated financial performance across fiscal quarters</p>
                </div>
                <span className="px-2 py-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  RPT-EXEC-002
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { q: 'Q1-2026', rev: '$11.2M', ebitda: '$3.58M', width: '70%', eWidth: '22%' },
                  { q: 'Q2-2026', rev: '$12.85M', ebitda: '$4.18M', width: '80%', eWidth: '26%' },
                  { q: 'Q3-2026', rev: '$14.28M', ebitda: '$4.65M', width: '90%', eWidth: '29%' },
                  { q: 'Q4-2026 (Est)', rev: '$16.1M', ebitda: '$5.31M', width: '100%', eWidth: '33%' }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{item.q}</span>
                      <span>Revenue: {item.rev} | EBITDA: {item.ebitda}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                      <div className="bg-indigo-600 h-full rounded-l-full" style={{ width: item.width }} />
                      <div className="bg-emerald-500 h-full rounded-r-full" style={{ width: item.eWidth }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-4 pt-2 text-xs text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 bg-indigo-600 rounded-sm" />
                  <span>Gross Revenue</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                  <span>EBITDA Margin</span>
                </div>
              </div>
            </div>

            {/* Department Headcount Donut Breakdown Widget */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Workforce Headcount Distribution</h3>
                  <p className="text-xs text-slate-500">Departmental breakdown and turnover ratios</p>
                </div>
                <span className="px-2 py-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  RPT-HR-004
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { dept: 'Engineering & Product', count: 640, pct: '45%', color: 'bg-indigo-600' },
                  { dept: 'Sales & Business Dev', count: 320, pct: '23%', color: 'bg-emerald-600' },
                  { dept: 'Procurement & Ops', count: 280, pct: '20%', color: 'bg-amber-500' },
                  { dept: 'Finance & Legal', count: 180, pct: '12%', color: 'bg-blue-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="font-semibold text-slate-800">{item.dept}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{item.count} Staff</span>
                      <span className="text-slate-400 ml-2">({item.pct})</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => {
                    setSelectedReportId('RPT-HR-004');
                    setActiveTab('catalog');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-1"
                >
                  <span>Open Full HR Audit Report</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORT VIEWER & CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Catalog Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Report Category</h2>
                <Filter className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="space-y-1">
                {(['ALL', 'EXECUTIVE', 'FINANCIAL', 'PROCUREMENT', 'HR', 'PLATFORM'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Reports */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-slate-50/80">
                <h3 className="text-xs font-bold text-slate-900">Available Reports ({reports.length})</h3>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {reports.map(rpt => (
                  <button
                    key={rpt.id}
                    onClick={() => setSelectedReportId(rpt.id)}
                    className={`w-full text-left p-3 text-xs transition ${
                      selectedReportId === rpt.id
                        ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 line-clamp-1">{rpt.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                      <span className="font-mono text-indigo-600">{rpt.code}</span>
                      <span>•</span>
                      <span>{rpt.type}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Report Viewer Panel */}
          <div className="lg:col-span-3 space-y-4">
            {currentReport && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded">
                        {currentReport.code}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded">
                        {currentReport.category}
                      </span>
                      <span className="text-xs text-slate-400">v{currentReport.version}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{currentReport.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{currentReport.description}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRunReport()}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Run Query</span>
                    </button>

                    <div className="relative group">
                      <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </button>

                      <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl hidden group-hover:block z-30 py-1">
                        {(['PDF', 'EXCEL', 'WORD', 'CSV', 'HTML'] as ExportFormat[]).map(fmt => (
                          <button
                            key={fmt}
                            onClick={() => handleExport(fmt)}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                          >
                            Export as {fmt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parameters Panel if any */}
                {currentReport.parameters.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Dynamic Query Parameters</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentReport.parameters.map(param => (
                        <div key={param.id} className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">{param.label}</label>
                          {param.type === 'SELECT' && param.options ? (
                            <select
                              value={parameters[param.name] || param.defaultValue}
                              onChange={e => setParameters({ ...parameters, [param.name]: e.target.value })}
                              className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500"
                            >
                              {param.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={parameters[param.name] || param.defaultValue || ''}
                              onChange={e => setParameters({ ...parameters, [param.name]: e.target.value })}
                              className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-indigo-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Execution Telemetry Badge */}
                {activeReportResult && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-3">
                      <span>Total Rows: <strong className="text-slate-800">{activeReportResult.totalRows}</strong></span>
                      <span>Execution SLA: <strong className="text-indigo-600">{activeReportResult.executionTimeMs} ms</strong></span>
                      <span>Cached: <strong className="text-slate-800">{activeReportResult.cached ? 'Yes' : 'No'}</strong></span>
                    </div>
                    <span>Data Source: <strong className="text-slate-800">{currentReport.dataSource}</strong></span>
                  </div>
                )}

                {/* Data Table */}
                {activeReportResult && (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-inner">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-slate-200 font-semibold border-b border-slate-700">
                        <tr>
                          {currentReport.columns.map(col => (
                            <th key={col.field} className={`p-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {activeReportResult.data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/40 transition">
                            {currentReport.columns.map(col => {
                              const val = row[col.field];
                              let formattedVal = val;
                              if (col.dataType === 'CURRENCY' && typeof val === 'number') {
                                formattedVal = `$${val.toLocaleString()}`;
                              } else if (col.dataType === 'PERCENTAGE' && typeof val === 'number') {
                                formattedVal = `${val}%`;
                              }

                              return (
                                <td key={col.field} className={`p-3 ${col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                                  {formattedVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>

                      {activeReportResult.summaryRow && (
                        <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                          <tr>
                            {currentReport.columns.map(col => {
                              const val = activeReportResult.summaryRow![col.field];
                              let formattedVal = val;
                              if (col.dataType === 'CURRENCY' && typeof val === 'number') {
                                formattedVal = `$${val.toLocaleString()}`;
                              } else if (col.dataType === 'PERCENTAGE' && typeof val === 'number') {
                                formattedVal = `${val}%`;
                              }

                              return (
                                <td key={col.field} className={`p-3 ${col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                                  {formattedVal}
                                </td>
                              );
                            })}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REPORT DESIGNER */}
      {activeTab === 'designer' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Interactive Report Designer</h2>
              <p className="text-xs text-slate-500">Create custom reports, select parameters, data sources, and permissions.</p>
            </div>
            {designerSavedSuccess && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-300 animate-pulse">
                Report Saved to Registry!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Report Title</label>
                <input
                  type="text"
                  value={designerTitle}
                  onChange={e => setDesignerTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={designerCategory}
                    onChange={e => setDesignerCategory(e.target.value as ReportCategory)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="EXECUTIVE">EXECUTIVE</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="PROCUREMENT">PROCUREMENT</option>
                    <option value="HR">HR</option>
                    <option value="OPERATIONS">OPERATIONS</option>
                    <option value="PLATFORM">PLATFORM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Display Type</label>
                  <select
                    value={designerType}
                    onChange={e => setDesignerType(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="TABLE">TABLE</option>
                    <option value="CHART">CHART</option>
                    <option value="PIVOT">PIVOT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Data Source</label>
                <input
                  type="text"
                  value={designerDataSource}
                  onChange={e => setDesignerDataSource(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveCustomReport}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register & Save Custom Report</span>
                </button>
              </div>
            </div>

            {/* Live Design Structure Preview */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Live Designer Schema Preview</span>
              </h3>

              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3 font-mono text-[11px] text-slate-700">
                <div><strong>Code:</strong> VR-CUST-99</div>
                <div><strong>Title:</strong> {designerTitle}</div>
                <div><strong>Category:</strong> {designerCategory}</div>
                <div><strong>Type:</strong> {designerType}</div>
                <div><strong>Data Source:</strong> {designerDataSource}</div>
                <div><strong>Roles Allowed:</strong> Super Administrator, CFO</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULED DELIVERY */}
      {activeTab === 'schedules' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Automated Report Scheduling & Dispatch</h2>
              <p className="text-xs text-slate-500">Configure background batch exports and automated VNE notification deliveries.</p>
            </div>
          </div>

          <div className="space-y-4">
            {schedules.map(sched => (
              <div key={sched.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded">
                      {sched.frequency}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{sched.reportTitle}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-3">
                    <span>Time: <strong>{sched.timeOfDay}</strong></span>
                    <span>Format: <strong>{sched.exportFormat}</strong></span>
                    <span>Recipients: <strong>{sched.recipients.join(', ')}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleTriggerScheduleNow(sched.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Batch Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DEVELOPER API DOCS */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Vertex Reporting Engine (VRE) Developer Guide</h2>
            <p className="text-xs text-slate-500">Architecture, API Interfaces, and Platform Engine Integration Rules.</p>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 bg-slate-900 text-slate-100 rounded-lg space-y-2 font-mono">
              <div className="text-indigo-400 font-bold">// Execute report programmatically</div>
              <div>import &#123; reportManager &#125; from './core/vpe/reporting';</div>
              <br />
              <div>const result = reportManager.executeReport('RPT-FIN-001', &#123; fiscalYear: 'FY-2026' &#125;);</div>
              <div>console.log(result.data, result.executionTimeMs);</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Engine Integration SLA</h4>
                <p className="text-slate-600">All reports undergo real-time validation via Audit Platform Engine (<code className="text-indigo-600">ENG-AUDIT</code>) and register searchable report definitions directly inside VSE Universal Search Engine (<code className="text-indigo-600">ENG-SEARCH-VSE</code>).</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">VNE Notification Dispatch</h4>
                <p className="text-slate-600">Automated recurring report schedules integrate directly with Vertex Notification Engine (<code className="text-indigo-600">ENG-NOTIFICATION-VNE</code>) to dispatch exported PDF/Excel attachments to users.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
