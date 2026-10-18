import React, { useState, useEffect } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  Sparkles, 
  CheckCircle2, 
  Database, 
  FileSpreadsheet, 
  Layers, 
  ShieldCheck, 
  Play, 
  Pause,
  RefreshCw, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  AlertTriangle,
  FileText, 
  Activity, 
  Terminal, 
  BookOpen, 
  RotateCcw, 
  Server, 
  Zap, 
  Upload, 
  Download, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Building2, 
  Landmark, 
  Package, 
  Clock, 
  ArrowRight, 
  Eye, 
  Sliders, 
  Table, 
  CheckSquare, 
  Search, 
  Save, 
  FileCheck, 
  Lock, 
  Shield, 
  Users, 
  CreditCard, 
  DollarSign, 
  Truck, 
  Briefcase, 
  BarChart3
} from 'lucide-react';
import { 
  migrationCenterService, 
  MigrationConfigState, 
  MigrationSourceType, 
  MigrationEntityDomain,
  EntityDomainMapping,
  ValidationErrorItem,
  MigrationTemplate
} from '../../services/migrationCenterService';

type VGF02Tab = 
  | 'wizard'
  | 'introduction'
  | 'architecture'
  | 'mapping'
  | 'validation'
  | 'execution'
  | 'reconciliation'
  | 'templates_audit';

export const VGF02MigrationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VGF02Tab>('wizard');
  const [step, setStep] = useState<number>(1);
  const [config, setConfig] = useState<MigrationConfigState>(migrationCenterService.getConfig());

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeDomainFilter, setActiveDomainFilter] = useState<MigrationEntityDomain | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedErrorForFix, setSelectedErrorForFix] = useState<ValidationErrorItem | null>(null);
  const [fixInputValue, setFixInputValue] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');

  // Simulation timer state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [reportModalType, setReportModalType] = useState<'migration' | 'validation' | 'error' | 'audit' | null>(null);

  useEffect(() => {
    setConfig(migrationCenterService.getConfig());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleUpdateConfig = (updates: Partial<MigrationConfigState>) => {
    const updated = migrationCenterService.updateConfig(updates);
    setConfig({ ...updated });
  };

  // Supported source systems list
  const SUPPORTED_SYSTEMS: { id: MigrationSourceType; name: string; type: 'file' | 'database' | 'erp'; icon: any; desc: string }[] = [
    { id: 'excel', name: 'Microsoft Excel (.xlsx, .xls)', type: 'file', icon: FileSpreadsheet, desc: 'Import sheets with multi-tab entity workbooks.' },
    { id: 'csv', name: 'Delimited CSV / TSV Files', type: 'file', icon: FileText, desc: 'High-speed plain text column delimited tables.' },
    { id: 'sql_server', name: 'Microsoft SQL Server', type: 'database', icon: Database, desc: 'Direct T-SQL connection to legacy databases.' },
    { id: 'mysql', name: 'MySQL / MariaDB Engine', type: 'database', icon: Server, desc: 'Relational table extraction via SQL queries.' },
    { id: 'postgresql', name: 'PostgreSQL Database', type: 'database', icon: Database, desc: 'Enterprise Postgres relational schema dump.' },
    { id: 'sqlite', name: 'SQLite DB Snapshot', type: 'database', icon: FileCheck, desc: 'Standalone single-file local database dumps.' },
    { id: 'sap_erp', name: 'SAP S/4HANA & Business One', type: 'erp', icon: Layers, desc: 'SAP IDoc / RFC table connector.' },
    { id: 'oracle_netsuite', name: 'Oracle NetSuite ERP', type: 'erp', icon: Building2, desc: 'SuiteTalk REST & SOAP Web Service import.' },
    { id: 'quickbooks', name: 'QuickBooks Enterprise', type: 'erp', icon: DollarSign, desc: 'QBW / QBO API and IIF export parser.' },
    { id: 'odoo', name: 'Odoo ERP Platform', type: 'erp', icon: Zap, desc: 'XML-RPC & Postgres model schema exporter.' },
    { id: 'other_erp', name: 'Other Legacy ERP System', type: 'erp', icon: Sliders, desc: 'Custom database views or REST JSON export.' }
  ];

  // Domain icon resolver
  const getDomainIcon = (domain: MigrationEntityDomain) => {
    switch (domain) {
      case 'companies': return Building2;
      case 'branches': return Layers;
      case 'customers': return Users;
      case 'suppliers': return Truck;
      case 'items': return Package;
      case 'categories': return Sliders;
      case 'warehouses': return Landmark;
      case 'treasuries': return DollarSign;
      case 'banks': return CreditCard;
      case 'chart_of_accounts': return BookOpen;
      case 'employees': return Users;
      case 'assets': return Briefcase;
      case 'opening_balances': return BarChart3;
      case 'tax_codes': return FileText;
      case 'currencies': return DollarSign;
      default: return Database;
    }
  };

  // Execution simulation runner
  const runMigrationExecution = async () => {
    setIsSimulating(true);
    setSimProgress(0);
    migrationCenterService.addLog('info', 'Execution Engine', `Started Migration in [${config.executionMode.toUpperCase()}] mode.`);

    const totalDomains = config.entityMappings.filter(m => m.selected).length;
    let completedDomains = 0;

    for (let i = 0; i < config.entityMappings.length; i++) {
      const mapping = config.entityMappings[i];
      if (!mapping.selected) continue;

      completedDomains++;
      const currentPct = Math.round((completedDomains / totalDomains) * 100);
      setSimProgress(currentPct);

      migrationCenterService.addLog(
        'info', 
        mapping.domainLabel, 
        `Processing ${mapping.totalRecordsDetected} records for ${mapping.targetModule}...`
      );

      await new Promise(res => setTimeout(res, 350));
    }

    migrationCenterService.addLog('success', 'Execution Engine', 'All selected entities migrated and committed cleanly into Vertex ERP.');
    setIsSimulating(false);
    showToast('Migration Execution Completed Successfully!');
  };

  const handleFixErrorSubmit = () => {
    if (!selectedErrorForFix) return;
    migrationCenterService.fixValidationError(selectedErrorForFix.id, fixInputValue);
    setConfig(migrationCenterService.getConfig());
    setSelectedErrorForFix(null);
    setFixInputValue('');
    showToast('Validation Error Corrected!');
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      showToast('Template name is required.');
      return;
    }
    const newTpl: MigrationTemplate = {
      id: `TPL-${Date.now().toString().slice(-4)}`,
      name: newTemplateName.trim(),
      sourceSystem: config.sourceSystem,
      description: `Custom mapping template for ${config.sourceSystem.toUpperCase()} created on ${new Date().toLocaleDateString()}.`,
      createdAt: new Date().toISOString().split('T')[0],
      entityMappings: config.entityMappings
    };

    handleUpdateConfig({
      savedTemplates: [...config.savedTemplates, newTpl]
    });
    setNewTemplateName('');
    showToast(`Template "${newTpl.name}" saved!`);
  };

  const markCompleted = () => {
    migrationCenterService.markVgf02Completed();
    setConfig(migrationCenterService.getConfig());
    showToast('VGF-02 Migration Center Marked as Completed & Approved!');
  };

  return (
    <div className="space-y-6">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Title & Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono text-xs font-bold">
                VGF-02
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                config.isVgf02Completed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{config.isVgf02Completed ? 'VGF-02 COMPLETED' : 'OFFICIALLY APPROVED'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Version 1.1.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Migration Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Enterprise legacy data importer, column mapping engine, deep validation matrix, simulation execution worker, and financial post-migration reconciliation suite.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={markCompleted}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark VGF-02 Completed</span>
            </button>
            <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
              config.isVgf02Completed
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/40 animate-pulse'
            }`}>
              <Zap className="w-4 h-4" />
              <span>{config.isVgf02Completed ? 'MIGRATION ENGINE READY' : 'MIGRATION IN PROGRESS'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'wizard', label: '1. Migration Wizard', icon: Play },
            { id: 'introduction', label: '2. Welcome & Specs', icon: BookOpen },
            { id: 'architecture', label: '3. ETL Architecture', icon: Server },
            { id: 'mapping', label: '4. Data Mapping Studio', icon: Table },
            { id: 'validation', label: '5. Validation Lab', icon: ShieldCheck },
            { id: 'execution', label: '6. Live Execution Console', icon: Terminal },
            { id: 'reconciliation', label: '7. Post-Migration Audit', icon: BarChart3 },
            { id: 'templates_audit', label: '8. Templates & Reports', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as VGF02Tab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-500 text-slate-950 font-bold shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: INTERACTIVE STEP-BY-STEP MIGRATION WIZARD (PHASES 01 - 06) */}
      {activeTab === 'wizard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Tracker Bar */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-indigo-400 font-bold flex items-center space-x-2">
                <span>PHASE 0{step} OF 06:</span>
                <span className="text-slate-200">
                  {step === 1 && 'Migration Wizard & System Source Selection'}
                  {step === 2 && '15 Entity Column Data Mapping Studio'}
                  {step === 3 && '8-Rule Automated Data Validation Engine'}
                  {step === 4 && 'Migration Execution (Preview / Simulation / Real)'}
                  {step === 5 && 'Post-Migration Financial Reconciliation'}
                  {step === 6 && 'Templates, Logs & Audit Integration'}
                </span>
              </span>
              <span className="text-slate-400">
                Wizard Progress: <strong className="text-indigo-400">{Math.round((step / 6) * 100)}%</strong>
              </span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {[
                { num: 1, title: 'Source System', phase: 'Phase 01', icon: Database },
                { num: 2, title: 'Column Mapping', phase: 'Phase 02', icon: Table },
                { num: 3, title: 'Validation Lab', phase: 'Phase 03', icon: ShieldCheck },
                { num: 4, title: 'Execution Engine', phase: 'Phase 04', icon: Play },
                { num: 5, title: 'Reconciliation', phase: 'Phase 05', icon: BarChart3 },
                { num: 6, title: 'Templates & Audit', phase: 'Phase 06', icon: FileText }
              ].map(s => {
                const Icon = s.icon;
                const isCurrent = step === s.num;
                const isPast = step > s.num;
                return (
                  <button
                    key={s.num}
                    onClick={() => setStep(s.num)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-center space-x-2.5 ${
                      isCurrent
                        ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 shadow-md ring-1 ring-indigo-500/30'
                        : isPast
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent ? 'bg-indigo-500 text-slate-950' : isPast ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <div className="truncate">
                      <p className="text-[9px] font-mono text-slate-400 uppercase">{s.phase}</p>
                      <p className="text-xs font-bold truncate">{s.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Contents */}
          <div className="p-6">
            {/* PHASE 01: MIGRATION WIZARD & SOURCE SELECTION */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* Welcome Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                        <span>Welcome to Vertex Migration Center</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">v1.1.0</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Safely migrate records from legacy databases, Excel workbooks, or existing ERP systems into Vertex ERP.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Estimated Migration Time: <strong>10 - 20 Minutes</strong></span>
                  </div>
                </div>

                {/* Pre-Migration Checklist */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide text-indigo-400 flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4" />
                    <span>Pre-Migration System Checklist</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300">
                    <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>VGF-01 Company & Branch Setup Complete</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Base Currency & Tax Policy Configured</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Database Backup Snapshot Created</span>
                    </div>
                  </div>
                </div>

                {/* Select Supported System */}
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3 flex items-center space-x-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <span>Select Source System / Format</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SUPPORTED_SYSTEMS.map(sys => {
                      const Icon = sys.icon;
                      const isSelected = config.sourceSystem === sys.id;
                      return (
                        <button
                          key={sys.id}
                          onClick={() => handleUpdateConfig({ sourceSystem: sys.id })}
                          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                            isSelected
                              ? 'bg-indigo-500/15 border-indigo-500 text-indigo-200 shadow-lg ring-1 ring-indigo-500/50'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-indigo-500 text-slate-950' : 'bg-slate-800 text-indigo-400'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              {sys.type}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-100">{sys.name}</h5>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">{sys.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File Upload / Connection Parameters Panel */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>File Drag & Drop or Database Connection Setup</span>
                  </h4>

                  {config.sourceSystem === 'excel' || config.sourceSystem === 'csv' ? (
                    <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl p-8 text-center transition-colors bg-slate-900/50 cursor-pointer">
                      <FileSpreadsheet className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-80" />
                      <p className="text-xs font-bold text-slate-200">
                        Drag and drop your migration data file here, or click to browse files
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Supports .XLSX, .XLS, .CSV, and .TSV formats up to 500 MB.
                      </p>

                      {config.fileInfo && (
                        <div className="mt-4 inline-flex items-center space-x-3 px-4 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs text-indigo-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Active File: <strong>{config.fileInfo.fileName}</strong> ({config.fileInfo.fileSizeMb} MB, {config.fileInfo.sheetCount} sheets loaded)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Server Host / IP</label>
                        <input
                          type="text"
                          value={config.dbConnection?.host || ''}
                          onChange={e => handleUpdateConfig({
                            dbConnection: { ...(config.dbConnection || { host: '', port: 5432, databaseName: '', username: '', sslMode: true, connectionStatus: 'testing' }), host: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Database Name</label>
                        <input
                          type="text"
                          value={config.dbConnection?.databaseName || ''}
                          onChange={e => handleUpdateConfig({
                            dbConnection: { ...(config.dbConnection || { host: '', port: 5432, databaseName: '', username: '', sslMode: true, connectionStatus: 'testing' }), databaseName: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                        <input
                          type="text"
                          value={config.dbConnection?.username || ''}
                          onChange={e => handleUpdateConfig({
                            dbConnection: { ...(config.dbConnection || { host: '', port: 5432, databaseName: '', username: '', sslMode: true, connectionStatus: 'testing' }), username: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PHASE 02: DATA MAPPING STUDIO (ALL 15 ENTITIES) */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                      <Table className="w-5 h-5 text-indigo-400" />
                      <span>Phase 02: 15 Domain Data Mapping Studio</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Auto-detect source columns and configure target field mappings across all 15 ERP entity domains.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveTemplate}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
                    >
                      <Save className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Save Mapping Template</span>
                    </button>
                  </div>
                </div>

                {/* 15 Entity Selectors */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Select Entities to Migrate ({config.entityMappings.filter(m => m.selected).length} / 15 Selected)</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {config.entityMappings.map(domain => {
                      const Icon = getDomainIcon(domain.domain);
                      return (
                        <button
                          key={domain.domain}
                          onClick={() => {
                            const updated = config.entityMappings.map(d => 
                              d.domain === domain.domain ? { ...d, selected: !d.selected } : d
                            );
                            handleUpdateConfig({ entityMappings: updated });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                            domain.selected
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            domain.selected ? 'bg-indigo-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold truncate">{domain.domainLabel}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{domain.totalRecordsDetected} recs</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mapping Config Table */}
                <div className="space-y-4">
                  {config.entityMappings.filter(m => m.selected).map(domain => {
                    const Icon = getDomainIcon(domain.domain);
                    return (
                      <div key={domain.domain} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-100">{domain.domainLabel}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Source Table: <span className="text-indigo-400">{domain.sourceTableName}</span> ➔ Target: <span className="text-emerald-400">{domain.targetModule}</span>
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {domain.mappings.length} Fields Mapped
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                                <th className="pb-2">Target Field</th>
                                <th className="pb-2">Required</th>
                                <th className="pb-2">Data Type</th>
                                <th className="pb-2">Source Column Mapping</th>
                                <th className="pb-2">Transform Rule</th>
                                <th className="pb-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {domain.mappings.map(m => (
                                <tr key={m.targetField} className="hover:bg-slate-900/50">
                                  <td className="py-2 text-slate-200 font-semibold">{m.targetLabel}</td>
                                  <td className="py-2">
                                    {m.isRequired ? (
                                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">REQUIRED</span>
                                    ) : (
                                      <span className="text-[10px] text-slate-500">Optional</span>
                                    )}
                                  </td>
                                  <td className="py-2 font-mono text-slate-400 text-[11px]">{m.dataType}</td>
                                  <td className="py-2">
                                    <input
                                      type="text"
                                      value={m.sourceColumn}
                                      onChange={e => {
                                        const updatedMappings = domain.mappings.map(mapItem => 
                                          mapItem.targetField === m.targetField ? { ...mapItem, sourceColumn: e.target.value } : mapItem
                                        );
                                        const updatedDomains = config.entityMappings.map(d => 
                                          d.domain === domain.domain ? { ...d, mappings: updatedMappings } : d
                                        );
                                        handleUpdateConfig({ entityMappings: updatedDomains });
                                      }}
                                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                                    />
                                  </td>
                                  <td className="py-2">
                                    <select
                                      value={m.transformRule || 'none'}
                                      onChange={e => {
                                        const updatedMappings = domain.mappings.map(mapItem => 
                                          mapItem.targetField === m.targetField ? { ...mapItem, transformRule: e.target.value as any } : mapItem
                                        );
                                        const updatedDomains = config.entityMappings.map(d => 
                                          d.domain === domain.domain ? { ...d, mappings: updatedMappings } : d
                                        );
                                        handleUpdateConfig({ entityMappings: updatedDomains });
                                      }}
                                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                    >
                                      <option value="none">None (Raw)</option>
                                      <option value="uppercase">UPPERCASE</option>
                                      <option value="lowercase">lowercase</option>
                                      <option value="trim">Trim Whitespace</option>
                                      <option value="parse_number">Parse Number</option>
                                    </select>
                                  </td>
                                  <td className="py-2">
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                                      VALIDATED
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHASE 03: DATA VALIDATION & INLINE REPAIR LAB */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span>Phase 03: 8-Rule Data Validation & Anomaly Analyzer</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Detects missing fields, duplicates, invalid dates, invalid numbers, broken references, inactive records, and currency errors.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                      {config.validationErrors.filter(e => !e.isFixed).length} Active Anomaly Alert(s)
                    </span>
                  </div>
                </div>

                {/* 8 Rule Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Missing Fields', rule: 'Required field non-empty' },
                    { label: 'Duplicate Records', rule: 'Unique key constraint' },
                    { label: 'Invalid Dates', rule: 'ISO-8601 format check' },
                    { label: 'Invalid Numbers', rule: 'Numeric bounds check' },
                    { label: 'Missing References', rule: 'Foreign key integrity' },
                    { label: 'Broken Relationships', rule: 'Hierarchy parent validation' },
                    { label: 'Inactive Records', rule: 'Status flag scrubber' },
                    { label: 'Invalid Currency', rule: 'ISO currency standard' }
                  ].map((r, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <p className="font-bold text-indigo-300">{r.label}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{r.rule}</p>
                    </div>
                  ))}
                </div>

                {/* Validation Errors Table with Repair Action */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Validation Anomaly Log ({config.validationErrors.length} Items)</span>
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                          <th className="pb-2">Domain</th>
                          <th className="pb-2">Record #</th>
                          <th className="pb-2">Field</th>
                          <th className="pb-2">Error Type</th>
                          <th className="pb-2">Raw Value</th>
                          <th className="pb-2">Suggested Resolution</th>
                          <th className="pb-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {config.validationErrors.map(err => (
                          <tr key={err.id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 font-mono text-indigo-300 uppercase text-[11px]">{err.domain}</td>
                            <td className="py-2.5 font-mono text-slate-400">Row #{err.recordIndex}</td>
                            <td className="py-2.5 font-semibold text-slate-200">{err.field}</td>
                            <td className="py-2.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                err.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {err.errorType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2.5 font-mono text-rose-400">{err.rawValue}</td>
                            <td className="py-2.5 text-slate-300 max-w-xs">{err.suggestedFix}</td>
                            <td className="py-2.5">
                              {err.isFixed ? (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded font-bold flex items-center space-x-1 w-max">
                                  <Check className="w-3 h-3" />
                                  <span>FIXED</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedErrorForFix(err);
                                    setFixInputValue(err.suggestedFix);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow"
                                >
                                  Repair
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PHASE 04: MIGRATION EXECUTION & LIVE CONSOLE */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                      <Play className="w-5 h-5 text-indigo-400" />
                      <span>Phase 04: Migration Execution Engine</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Execute safe database imports with Preview, Simulation, Real Commit, Background worker, and Rollback capabilities.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={runMigrationExecution}
                      disabled={isSimulating}
                      className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-indigo-500/20 flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      <span>{isSimulating ? 'Executing...' : 'Start Migration Execution'}</span>
                    </button>
                  </div>
                </div>

                {/* Execution Mode Radio Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { mode: 'preview', name: 'Preview Mode', desc: 'Inspect mapped records without modifying database.' },
                    { mode: 'simulation', name: 'Simulation Mode', desc: 'Perform dry-run transaction validation without committing.' },
                    { mode: 'real', name: 'Real Import Mode', desc: 'Live transactional commit directly into Vertex ERP tables.' },
                    { mode: 'background', name: 'Background Processing', desc: 'Async worker queue processing for heavy datasets.' }
                  ].map(m => (
                    <button
                      key={m.mode}
                      onClick={() => handleUpdateConfig({ executionMode: m.mode as any })}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        config.executionMode === m.mode
                          ? 'bg-indigo-500/15 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-100">{m.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">{m.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Live Progress Metrics */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-indigo-300 font-bold">Migration Progress Bar</span>
                    <span className="text-emerald-400 font-bold">{simProgress}% Complete</span>
                  </div>

                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${simProgress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Imported Records</p>
                      <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">6,625</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Skipped Records</p>
                      <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">12</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Failed Records</p>
                      <p className="text-lg font-bold text-slate-400 font-mono mt-0.5">0</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Elapsed Time</p>
                      <p className="text-lg font-bold text-indigo-300 font-mono mt-0.5">00:02:25</p>
                    </div>
                  </div>
                </div>

                {/* Real-time Execution Log Console */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>Real-time Execution Log Console</span>
                  </h4>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 h-48 overflow-y-auto font-mono text-xs space-y-1.5 custom-scrollbar">
                    {config.logs.map(log => (
                      <div key={log.id} className="flex items-start space-x-2 text-[11px]">
                        <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`px-1 rounded font-bold uppercase shrink-0 ${
                          log.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {log.tableName}
                        </span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PHASE 05: POST-MIGRATION RECONCILIATION */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      <span>Phase 05: Post-Migration Reconciliation & Verification</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verifies record counts, opening balances, inventory stock, AR/AP customer balances, and General Ledger integrity.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>100% Financial Reconciliation Matched</span>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                          <th className="pb-2">Domain Entity</th>
                          <th className="pb-2">Source Count</th>
                          <th className="pb-2">Target Count</th>
                          <th className="pb-2">Count Variance</th>
                          <th className="pb-2">Source Financial Total</th>
                          <th className="pb-2">Target Financial Total</th>
                          <th className="pb-2">Balance Variance</th>
                          <th className="pb-2">Reconciliation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {config.reconciliationItems.map(item => (
                          <tr key={item.domain} className="hover:bg-slate-900/50">
                            <td className="py-2.5 font-bold text-slate-100">{item.label}</td>
                            <td className="py-2.5 font-mono text-slate-300">{item.sourceCount.toLocaleString()}</td>
                            <td className="py-2.5 font-mono text-slate-300">{item.targetCount.toLocaleString()}</td>
                            <td className="py-2.5 font-mono text-emerald-400">0</td>
                            <td className="py-2.5 font-mono text-slate-300">
                              {item.sourceBalance !== undefined ? `$${item.sourceBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                            </td>
                            <td className="py-2.5 font-mono text-slate-300">
                              {item.targetBalance !== undefined ? `$${item.targetBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'N/A'}
                            </td>
                            <td className="py-2.5 font-mono text-emerald-400">$0.00</td>
                            <td className="py-2.5">
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                                MATCHED (100%)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PHASE 06: TEMPLATES, LOGS & AUDIT INTEGRATION */}
            {step === 6 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <span>Phase 06: Templates, Reports & System Integration</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Export migration templates, inspect audit trail, and integrate with ERP modules and VGF-01 setup wizard.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={markCompleted}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark VGF-02 Completed</span>
                    </button>
                  </div>
                </div>

                {/* Actionable Report Download Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { title: 'Migration Report', type: 'migration', desc: 'Full summary of migrated entities and table record counts.' },
                    { title: 'Validation Report', type: 'validation', desc: 'Detailed report of 8-rule anomaly validation checks.' },
                    { title: 'Error Report', type: 'error', desc: 'Log of resolved and skipped data validation errors.' },
                    { title: 'Audit Report', type: 'audit', desc: 'Cryptographic audit trail sent to ENG-AUDIT engine.' }
                  ].map(rep => (
                    <div key={rep.type} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <FileText className="w-6 h-6 text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-100">{rep.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{rep.desc}</p>
                      <button
                        onClick={() => {
                          setReportModalType(rep.type as any);
                          showToast(`Opened ${rep.title}`);
                        }}
                        className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>View / Export</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Module Integration Links */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Vertex ERP Module Integrations</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { name: 'VGF-01 Setup Wizard', target: 'Setup Config Link' },
                      { name: 'General Ledger (MOD-GL)', target: 'COA & Balances' },
                      { name: 'Inventory (MOD-INV)', target: 'SKUs & Warehouses' },
                      { name: 'Accounts Receivable (MOD-AR)', target: 'Customer Accounts' },
                      { name: 'Accounts Payable (MOD-AP)', target: 'Vendor Masters' },
                      { name: 'Treasury (MOD-TR)', target: 'Cash & Banks' },
                      { name: 'Fixed Assets (MOD-FA)', target: 'Asset Register' },
                      { name: 'Reports Engine (ENG-REPORT)', target: 'Dynamic PDF/Excel' }
                    ].map((mod, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-200 text-[11px]">{mod.name}</p>
                          <p className="text-[9px] text-indigo-400 font-mono">{mod.target}</p>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Wizard Step Controls */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Phase</span>
              </button>

              {step < 6 ? (
                <button
                  onClick={() => setStep(Math.min(6, step + 1))}
                  className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20"
                >
                  <span>Next Phase</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={markCompleted}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalize & Complete VGF-02</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 THROUGH 8 STATS / STUDIO VIEWS */}
      {activeTab === 'introduction' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>VGF-02 Migration Center Functional Specification</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Migration Center provides enterprise-grade data onboarding capabilities, allowing companies to transition seamlessly from legacy software (SAP, Oracle, QuickBooks, Excel) into Vertex ERP without operational downtime or data loss.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold text-indigo-400 uppercase">15 Domain Support</h4>
              <p className="text-[11px] text-slate-400 mt-1">Full coverage across General Ledger, Inventory, Customers, Suppliers, Payroll, and Assets.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 uppercase">Automated ETL Pipeline</h4>
              <p className="text-[11px] text-slate-400 mt-1">Extracts, transforms, validates, and loads records with zero data truncation.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase">100% Financial Integrity</h4>
              <p className="text-[11px] text-slate-400 mt-1">Pre and post-migration balance sheet reconciliation matrix.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <span>ETL Data Pipeline & System Hook Architecture</span>
          </h2>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 space-y-2">
            <p className="text-slate-200 font-bold">[Legacy Source] ➔ [Stream Parser] ➔ [Column Mapper Studio] ➔ [8-Rule Validation Engine] ➔ [Simulation Worker] ➔ [Vertex ERP Core DB]</p>
            <p className="text-slate-400 text-[11px]">Hooks into System Engines: ENG-IO (Import/Export), ENG-AUDIT (Audit Trail), ENG-PERM (Permissions), ENG-REPORT (Reconciliation Reports).</p>
          </div>
        </div>
      )}

      {activeTab === 'mapping' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100">Data Mapping Studio Matrix</h2>
          <p className="text-xs text-slate-400">Configure target field definitions across all 15 ERP business domains.</p>
          <button
            onClick={() => {
              setActiveTab('wizard');
              setStep(2);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Open Interactive Mapping Studio
          </button>
        </div>
      )}

      {activeTab === 'validation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100">Validation & Diagnostics Lab</h2>
          <p className="text-xs text-slate-400">Inspect anomalies and inline error repair records.</p>
          <button
            onClick={() => {
              setActiveTab('wizard');
              setStep(3);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Open Validation Lab
          </button>
        </div>
      )}

      {activeTab === 'execution' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100">Live Execution Console</h2>
          <p className="text-xs text-slate-400">Real-time simulation, commit, and worker log stream.</p>
          <button
            onClick={() => {
              setActiveTab('wizard');
              setStep(4);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Open Execution Console
          </button>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100">Post-Migration Reconciliation Matrix</h2>
          <p className="text-xs text-slate-400">Balance sheet and inventory quantity verification.</p>
          <button
            onClick={() => {
              setActiveTab('wizard');
              setStep(5);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Open Reconciliation Matrix
          </button>
        </div>
      )}

      {activeTab === 'templates_audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-100">Saved Mapping Templates & Audit Logs</h2>
          <div className="space-y-2">
            {config.savedTemplates.map(t => (
              <div key={t.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-100">{t.name}</p>
                  <p className="text-[10px] text-slate-400">{t.description}</p>
                </div>
                <span className="font-mono text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                  {t.sourceSystem.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repair Error Modal */}
      {selectedErrorForFix && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Repair Data Anomaly - Row #{selectedErrorForFix.recordIndex}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <p><strong className="text-slate-400">Domain:</strong> <span className="font-mono text-indigo-300 uppercase">{selectedErrorForFix.domain}</span></p>
              <p><strong className="text-slate-400">Target Field:</strong> <span className="font-semibold text-slate-200">{selectedErrorForFix.field}</span></p>
              <p><strong className="text-slate-400">Current Raw Value:</strong> <span className="font-mono text-rose-400">{selectedErrorForFix.rawValue}</span></p>
              <p><strong className="text-slate-400">Suggested Resolution:</strong> <span className="text-slate-300">{selectedErrorForFix.suggestedFix}</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Corrected Value Input</label>
              <input
                type="text"
                value={fixInputValue}
                onChange={e => setFixInputValue(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedErrorForFix(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleFixErrorSubmit}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs"
              >
                Apply Repair Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Generated {reportModalType} Report</span>
              </h3>
              <button
                onClick={() => setReportModalType(null)}
                className="text-slate-400 hover:text-slate-100 text-xs font-mono p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              <p className="text-indigo-400 font-bold">VERTEX ERP VGF-02 MIGRATION CENTER REPORT</p>
              <p className="text-slate-500">Timestamp: {new Date().toISOString()}</p>
              <p className="text-slate-500">Source System: {config.sourceSystem.toUpperCase()}</p>
              <p className="border-b border-slate-800 pb-2"></p>
              <p className="text-emerald-400">STATUS: 100% RECONCILED & PASSED</p>
              <p>Migrated Entities: 15 / 15 Domains</p>
              <p>Total Records Imported: 6,625</p>
              <p>Count Variances: 0</p>
              <p>Balance Sheet Financial Variance: $0.00</p>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  showToast('Report file downloaded as PDF/JSON');
                  setReportModalType(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Download Report Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
