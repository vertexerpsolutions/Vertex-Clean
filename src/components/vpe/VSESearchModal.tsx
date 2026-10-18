import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, Sparkles, Filter, Pin, Clock, ArrowRight, CornerDownLeft, 
  Tag, Shield, ExternalLink, CheckCircle2, Zap, RefreshCw, Layers,
  FileText, User, ShoppingBag, Package, Building2, CreditCard, Landmark,
  Receipt, Car, ShieldCheck, Factory, Briefcase, Award, Cpu, BookOpen
} from 'lucide-react';
import { searchManager, SearchResult, SearchResultType } from '../../core/vpe/search';

interface VSESearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const VSESearchModal: React.FC<VSESearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [term, setTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [userRole, setUserRole] = useState<string>('Super Administrator');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger parent open if passed, or toggle
        }
      }
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filters = {
    docType: selectedType !== 'all' ? [selectedType] : undefined,
    branch: selectedBranch !== 'all' ? [selectedBranch] : undefined
  };

  const response = searchManager.search({
    term,
    filters,
    userRole,
    limit: 12
  });

  const recentTerms = searchManager.getSession().getRecentTerms();
  const quickActions = searchManager.getSession().getQuickActions();
  const pinnedRecordIds = searchManager.getSession().getPinnedRecordIds();
  const indexManagerInstance = searchManager.getIndexManager();

  const handleSelectRecord = (res: SearchResult) => {
    searchManager.getSession().addRecentTerm(res.record.title);
    if (onNavigate) {
      onNavigate(res.record.actionUrl);
    }
    onClose();
  };

  const getTypeIcon = (type: SearchResultType) => {
    switch (type) {
      case 'customer': return <User className="w-4 h-4 text-emerald-600" />;
      case 'supplier': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'item': return <Package className="w-4 h-4 text-amber-600" />;
      case 'warehouse': return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'account': return <BookOpen className="w-4 h-4 text-purple-600" />;
      case 'invoice': return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-cyan-600" />;
      case 'bank': return <Landmark className="w-4 h-4 text-indigo-600" />;
      case 'asset': return <Briefcase className="w-4 h-4 text-orange-600" />;
      case 'employee': return <User className="w-4 h-4 text-teal-600" />;
      case 'document': return <FileText className="w-4 h-4 text-rose-600" />;
      case 'gold_feature': return <Award className="w-4 h-4 text-amber-500" />;
      case 'platform_engine': return <Cpu className="w-4 h-4 text-indigo-500" />;
      case 'audit_log': return <ShieldCheck className="w-4 h-4 text-slate-600" />;
      default: return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-12 md:pt-20 px-4">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={e => { setTerm(e.target.value); setSelectedIndex(0); }}
            placeholder="البحث في كافة وحدات النظام، الأصناف، العملاء، الفواتير، والميزات الذهبية..."
            className="flex-1 bg-transparent text-lg font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {term && (
            <button 
              onClick={() => setTerm('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-200/60 dark:bg-slate-800/60 rounded-md border border-slate-300/50 dark:border-slate-700/50">
            <span>ESC</span>
          </kbd>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/50 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> التصفية:
          </span>
          {[
            { id: 'all', label: 'جميع النتائج' },
            { id: 'customer', label: 'العملاء' },
            { id: 'supplier', label: 'الموردون' },
            { id: 'item', label: 'الأصناف' },
            { id: 'invoice', label: 'الفواتير' },
            { id: 'account', label: 'الحسابات' },
            { id: 'bank', label: 'البنوك' },
            { id: 'gold_feature', label: 'الميزات الذهبية' },
            { id: 'platform_engine', label: 'محركات المنصة' },
            { id: 'audit_log', label: 'سجلات التدقيق' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedType(f.id)}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                selectedType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="mr-auto flex items-center gap-2 border-r border-slate-300 dark:border-slate-700 pr-3">
            <span className="text-slate-400">الفرع:</span>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-xs font-medium focus:outline-none"
            >
              <option value="all">جميع الفروع</option>
              <option value="HQ-NY">المركز الرئيسي - نيويورك</option>
              <option value="BR-LDN">فرع لندن</option>
              <option value="BR-DXB">فرع دبي</option>
            </select>
          </div>
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {term.trim() === '' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
              {/* Quick Actions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> إجراءات النظام السريعة
                </h4>
                <div className="space-y-2">
                  {quickActions.map(qa => (
                    <button
                      key={qa.id}
                      onClick={() => {
                        if (onNavigate) onNavigate(qa.target);
                        onClose();
                      }}
                      className="w-full text-right p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800 transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {qa.title}
                        </div>
                        <div className="text-[11px] text-slate-400">{qa.description}</div>
                      </div>
                      {qa.shortcut && (
                        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300/50 dark:border-slate-700">
                          {qa.shortcut}
                        </kbd>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Terms & Pinned */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> عمليات البحث الأخيرة
                    </h4>
                    {recentTerms.length > 0 && (
                      <button
                        onClick={() => searchManager.getSession().clearRecentTerms()}
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        مسح
                      </button>
                    )}
                  </div>
                  {recentTerms.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">لا توجد عمليات بحث أخيرًا</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {recentTerms.map((rt, i) => (
                        <button
                          key={i}
                          onClick={() => setTerm(rt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 text-xs transition"
                        >
                          {rt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-amber-500" /> السجلات المثبتة
                  </h4>
                  <div className="space-y-1.5">
                    {pinnedRecordIds.map(id => {
                      const rec = indexManagerInstance.getRecordById(id);
                      if (!rec) return null;
                      return (
                        <div
                          key={id}
                          onClick={() => handleSelectRecord({ record: rec, score: 100, matchedFields: [], highlights: {} })}
                          className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div className="flex items-center gap-2">
                            {getTypeIcon(rec.type)}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{rec.title}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            {rec.code}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Search Metadata Header */}
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <div>
                  تم العثور على <span className="font-semibold text-slate-700 dark:text-slate-200">{response.totalCount}</span> نتيجة لـ &quot;<span className="italic text-indigo-600 dark:text-indigo-400">{term}</span>&quot; في <span className="font-semibold text-slate-700 dark:text-slate-200">{response.executionTimeMs}ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>إستراتيجية المطابقة:</span>
                  <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded font-medium text-[11px]">
                    هجين (مباشر + جزئي + ضبابي)
                  </span>
                </div>
              </div>

              {response.results.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">لم يتم العثور على سجلات مطابقة</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    جرب تحسين مصطلح البحث، أو تعديل الفلاتر، أو إزالة قيود الفروع.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {response.results.map((res, idx) => (
                    <div
                      key={res.record.id}
                      onClick={() => handleSelectRecord(res)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        selectedIndex === idx
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-sm'
                          : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 mt-0.5">
                          {getTypeIcon(res.record.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {res.record.title}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
                              {res.record.code}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                              {res.record.module}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {res.record.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-slate-400">
                            {res.record.branch && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {res.record.branch}
                              </span>
                            )}
                            {res.record.phone && <span>• {res.record.phone}</span>}
                            {res.record.email && <span>• {res.record.email}</span>}
                            {res.matchedFields.length > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                • Matched: {res.matchedFields.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">الملائمة</div>
                          <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {res.score} نقطة
                          </div>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            searchManager.getSession().togglePinRecord(res.record.id);
                          }}
                          className={`p-1.5 rounded-lg border transition ${
                            searchManager.getSession().isRecordPinned(res.record.id)
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                          title="تثبيت السجل"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white opacity-0 group-hover:opacity-100 transition">
                          <CornerDownLeft className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> محرك VSE نشط
            </span>
            <span>حالة الفهرس: <span className="text-emerald-600 dark:text-emerald-400 font-medium">سليم ({indexManagerInstance.getAllRecords().length} سجلات)</span></span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span>اضغط <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">↑↓</kbd> للتنقل</span>
            <span><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Enter</kbd> للاختيار</span>
          </div>
        </div>
      </div>
    </div>
  );
};
