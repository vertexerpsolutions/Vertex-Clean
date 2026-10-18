import React, { useState, useEffect } from 'react';
import { APPROVED_ERP_MODULES } from '../../data/mockData';
import { ERPModuleMeta, ERPModuleId } from '../../types';
import { setupWizardService } from '../../services/setupWizardService';
import { CustomerMasterView } from '../customers/CustomerMasterView';
import { VendorMasterView } from '../vendors/VendorMasterView';
import { 
  moduleIntegrationService, 
  CrossModuleWorkflow, 
  ModuleEvent 
} from '../../services/moduleIntegrationService';
import { 
  CheckCircle2, 
  Layers, 
  Database, 
  Filter, 
  Search, 
  ArrowUpRight,
  Building2,
  DollarSign,
  Share2,
  Zap,
  Activity,
  Play,
  RefreshCw,
  Workflow,
  Radio,
  FileCheck2,
  Link,
  ShieldCheck,
  Check,
  ChevronRight,
  Users
} from 'lucide-react';

interface ERPModulesViewProps {
  selectedModuleId?: string;
  onSelectModule: (id: string) => void;
}

export const ERPModulesView: React.FC<ERPModulesViewProps> = ({
  selectedModuleId,
  onSelectModule
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'grid' | 'customers' | 'vendors' | 'workflows' | 'eventbus' | 'masterdata'>(
    selectedModuleId === 'MOD-AR' || selectedModuleId === 'MOD-CUST' 
      ? 'customers' 
      : selectedModuleId === 'MOD-AP' || selectedModuleId === 'MOD-VEND'
      ? 'vendors'
      : 'grid'
  );

  useEffect(() => {
    if (selectedModuleId === 'MOD-AR' || selectedModuleId === 'MOD-CUST') {
      setActiveTab('customers');
    } else if (selectedModuleId === 'MOD-AP' || selectedModuleId === 'MOD-VEND') {
      setActiveTab('vendors');
    }
  }, [selectedModuleId]);
  const [eventHistory, setEventHistory] = useState<ModuleEvent[]>([]);
  const [workflows, setWorkflows] = useState<CrossModuleWorkflow[]>([]);
  const [executingWfId, setExecutingWfId] = useState<string | null>(null);

  const wizardConfig = setupWizardService.getConfig();
  const activeModule = APPROVED_ERP_MODULES.find(m => m.id === selectedModuleId) || APPROVED_ERP_MODULES[0];

  useEffect(() => {
    setEventHistory(moduleIntegrationService.getEventHistory());
    setWorkflows(moduleIntegrationService.getWorkflows());

    const unsubscribe = moduleIntegrationService.subscribe('*', (evt) => {
      setEventHistory([...moduleIntegrationService.getEventHistory()]);
      setWorkflows([...moduleIntegrationService.getWorkflows()]);
    });

    return () => unsubscribe();
  }, []);

  const filteredModules = APPROVED_ERP_MODULES.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const masterDataSummary = moduleIntegrationService.getSharedMasterDataSummary();
  const architectureHealth = moduleIntegrationService.validateArchitectureHealth();

  const handleRunWorkflow = (wfId: string) => {
    setExecutingWfId(wfId);
    setTimeout(() => {
      moduleIntegrationService.executeWorkflow(wfId);
      setExecutingWfId(null);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
              15 وحدة أعمال أساسية معتمدة
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>مكاملة VPI-02</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">سجل وحدات نظام Vertex ERP الأساسية</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            بنية موحدة عابرة للوحدات مع ناقل أحداث نشط (Event Bus)، سجلات بيانات أساسية مشتركة، وتنفيذ مسارات عمل متعددة الوحدات.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-slate-500">العملة الأساسية: </span>
            <span className="text-amber-400 font-bold">{wizardConfig.baseCurrency}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-slate-500">ناقل الأحداث: </span>
            <span className="text-emerald-400 font-bold">100% نشط</span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 space-x-reverse transition-colors ${
            activeTab === 'customers'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400 shrink-0" />
          <span>إدارة العملاء (MOD-AR)</span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 space-x-reverse transition-colors ${
            activeTab === 'vendors'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>إدارة الموردين (MOD-AP)</span>
        </button>

        <button
          onClick={() => setActiveTab('grid')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 space-x-reverse transition-colors ${
            activeTab === 'grid'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>شبكة الوحدات (15)</span>
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 space-x-reverse transition-colors ${
            activeTab === 'workflows'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Workflow className="w-4 h-4 text-amber-400" />
          <span>مسارات العمل المشتركة</span>
        </button>

        <button
          onClick={() => setActiveTab('eventbus')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 space-x-reverse transition-colors ${
            activeTab === 'eventbus'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>ناقل الأحداث والبث المباشر</span>
        </button>

        <button
          onClick={() => setActiveTab('masterdata')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 space-x-reverse transition-colors ${
            activeTab === 'masterdata'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-400" />
          <span>البيانات الأساسية المشتركة</span>
        </button>
      </div>

      {activeTab === 'customers' && (
        <CustomerMasterView />
      )}

      {activeTab === 'vendors' && (
        <VendorMasterView />
      )}

      {activeTab === 'grid' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث في الوحدات الأساسية..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
              {['all', 'Finance', 'Logistics', 'Operations', 'Commercial', 'HR', 'Analytics'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'جميع الفئات' : cat === 'Finance' ? 'المالية' : cat === 'Logistics' ? 'اللوجستيات' : cat === 'Operations' ? 'العمليات' : cat === 'Commercial' ? 'التجارية' : cat === 'HR' ? 'الموارد البشرية' : 'التحليلات'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map(mod => {
              const isSelected = activeModule.id === mod.id;
              const isEnabledByWizard = wizardConfig.activeModuleIds.includes(mod.id as ERPModuleId);

              return (
                <div
                  key={mod.id}
                  onClick={() => onSelectModule(mod.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-indigo-400 border border-slate-800">
                      {mod.code}
                    </span>
                    {isEnabledByWizard ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>نشط</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-500">
                        استعداد
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>السجلات: {mod.recordCount.toLocaleString()}</span>
                    <span className="text-indigo-400 flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                      <span>معاينة</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Module Inspector Detail */}
          {activeModule && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">معاين التفاصيل المتقدمة لـ {activeModule.code}</span>
                  <h2 className="text-lg font-bold text-slate-100">{activeModule.name}</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  متكامل ومعتمد
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">معامل العملة الأساسية</span>
                  <span className="text-amber-300 font-mono font-bold text-sm">{wizardConfig.baseCurrency}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">نطاق الكيان القانوني</span>
                  <span className="text-indigo-300 font-mono font-bold text-sm">{wizardConfig.companyName}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">تنسيق كود الحساب</span>
                  <span className="text-emerald-300 font-mono font-bold text-sm uppercase">{wizardConfig.accountCodeFormat.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 mb-1 flex items-center space-x-2">
              <Workflow className="w-4 h-4 text-amber-400" />
              <span>مسارات العمل المشتركة للمؤسسات</span>
            </h2>
            <p className="text-xs text-slate-400">
              تنفيذ معاملات حقيقية شاملة ومتعددة الوحدات تقوم بتمرير المعاملات، خصم المخزون، إنشاء الفواتير، وترحيل قيود القيد المزدوج عبر الوحدات المتكاملة.
            </p>
          </div>

          <div className="space-y-4">
            {workflows.map(wf => (
              <div key={wf.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {wf.id}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        عدد التنفيذ: <strong className="text-slate-200">{wf.executionCount}</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{wf.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{wf.description}</p>
                  </div>

                  <button
                    onClick={() => handleRunWorkflow(wf.id)}
                    disabled={executingWfId === wf.id}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shrink-0 self-start sm:self-center transition-all disabled:opacity-50"
                  >
                    {executingWfId === wf.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري معالجة مسار العمل...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>تنفيذ مسار العمل</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {wf.steps.map(step => (
                    <div key={step.stepNumber} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 font-bold">الخطوة 0{step.stepNumber}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {step.moduleId}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">{step.actionName}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'eventbus' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200 mb-1 flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>بث ناقل الأحداث في منصة Vertex</span>
              </h2>
              <p className="text-xs text-slate-400">
                أنبوب رسائل النشر والاشتراك المباشر لتنسيق تغييرات الحالة عبر جميع وحدات الأعمال الـ 15.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold shrink-0">
              المشتركون النشطون: 15 / 15
            </span>
          </div>

          <div className="space-y-2">
            {eventHistory.map(evt => (
              <div key={evt.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-indigo-400 border border-slate-800">
                      {evt.id}
                    </span>
                    <span className="text-slate-200 font-bold">{evt.type}</span>
                    <span className="text-slate-500">[{new Date(evt.timestamp).toLocaleTimeString()}]</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-sans">{evt.description}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0 text-[11px]">
                  <span className="text-slate-500">المصدر:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                    {evt.sourceModuleId}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="text-slate-500">الأهداف:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-bold">
                    {evt.targetModuleIds.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'masterdata' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 mb-1 flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>سجلات البيانات الأساسية المشتركة</span>
            </h2>
            <p className="text-xs text-slate-400">
              سجلات الكيانات الرئيسية المركزية المشتركة عبر الوحدات لضمان سلامة البيانات الأساسية وإزالة تكرار البيانات.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">كيانات العملاء</span>
              <div className="text-xl font-bold text-slate-100 font-mono">{masterDataSummary.customersCount.toLocaleString()}</div>
              <span className="text-[10px] text-indigo-400 font-mono">مشترك: AR, CRM, POS, BI</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">كيانات الموردين</span>
              <div className="text-xl font-bold text-slate-100 font-mono">{masterDataSummary.vendorsCount.toLocaleString()}</div>
              <span className="text-[10px] text-indigo-400 font-mono">مشترك: AP, SCM, FLEET, BI</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">أصناف المخزون</span>
              <div className="text-xl font-bold text-slate-100 font-mono">{masterDataSummary.inventoryItemsCount.toLocaleString()}</div>
              <span className="text-[10px] text-indigo-400 font-mono">مشترك: INV, POS, SCM, MFG, QM</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">دليل الحسابات</span>
              <div className="text-xl font-bold text-slate-100 font-mono">{masterDataSummary.chartOfAccountsCount}</div>
              <span className="text-[10px] text-indigo-400 font-mono">مشترك: GL, AR, AP, TR, FA, HR</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">التحقق من تكامل البنية التحتية</h3>
            <div className="space-y-1">
              {architectureHealth.recommendations.map((rec, i) => (
                <div key={i} className="flex items-center space-x-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
