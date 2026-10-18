import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  X,
  Layers,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Table,
  Check,
  Building2,
  Lock,
  Sparkles
} from 'lucide-react';
import { chartOfAccountsService, ChartAccountNode } from '../../services/chartOfAccountsService';
import { themeService, ThemeMode } from '../../services/themeService';

export interface ChartOfAccountsViewProps {
  onClose?: (dirty?: boolean) => void;
  onNavigateSection?: (section: any) => void;
}

type ViewMode = 'tree' | 'table';
type CategoryFilter = 'all' | 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({
  onClose
}) => {
  const [theme, setTheme] = useState<ThemeMode>(() => themeService.getTheme());
  const [accounts, setAccounts] = useState<ChartAccountNode[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [filterPostingOnly, setFilterPostingOnly] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true,
    '11': true,
    '12': true,
    '2': true,
    '21': true,
    '3': true,
    '31': true,
    '4': true,
    '41': true,
    '5': true,
    '51': true,
    '52': true
  });

  // Modal State for Adding New Account
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNameEn, setNewAccountNameEn] = useState('');
  const [newAccountCategory, setNewAccountCategory] = useState<'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses'>('expenses');
  const [newAccountParentCode, setNewAccountParentCode] = useState('');
  const [newAccountNature, setNewAccountNature] = useState<'debit' | 'credit'>('debit');
  const [newAccountIsLeaf, setNewAccountIsLeaf] = useState(true);
  const [newAccountNotes, setNewAccountNotes] = useState('');
  const [modalError, setModalError] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync with theme
  useEffect(() => {
    const unsub = themeService.subscribe(t => setTheme(t));
    return () => unsub();
  }, []);

  const isDark = theme === 'dark';

  // Load accounts from central service
  const reloadAccounts = () => {
    setAccounts(chartOfAccountsService.getAllAccounts());
  };

  useEffect(() => {
    reloadAccounts();
    const unsub = chartOfAccountsService.subscribe(() => {
      reloadAccounts();
    });
    return () => unsub();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = accounts.length;
    const assets = accounts.filter(a => a.category === 'assets');
    const liabilities = accounts.filter(a => a.category === 'liabilities');
    const equity = accounts.filter(a => a.category === 'equity');
    const revenue = accounts.filter(a => a.category === 'revenue');
    const expenses = accounts.filter(a => a.category === 'expenses');

    const totalAssetsBalance = assets.filter(a => a.isLeaf).reduce((s, a) => s + (a.balance || 0), 0);
    const totalLiabilitiesBalance = liabilities.filter(a => a.isLeaf).reduce((s, a) => s + (a.balance || 0), 0);
    const totalEquityBalance = equity.filter(a => a.isLeaf).reduce((s, a) => s + (a.balance || 0), 0);
    const totalRevenueBalance = revenue.filter(a => a.isLeaf).reduce((s, a) => s + (a.balance || 0), 0);
    const totalExpensesBalance = expenses.filter(a => a.isLeaf).reduce((s, a) => s + (a.balance || 0), 0);

    return {
      total,
      assetsCount: assets.length,
      liabilitiesCount: liabilities.length,
      equityCount: equity.length,
      revenueCount: revenue.length,
      expensesCount: expenses.length,
      totalAssetsBalance,
      totalLiabilitiesBalance,
      totalEquityBalance,
      totalRevenueBalance,
      totalExpensesBalance
    };
  }, [accounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    let list = accounts;

    if (selectedCategory !== 'all') {
      list = list.filter(a => a.category === selectedCategory);
    }

    if (filterPostingOnly) {
      list = list.filter(a => a.isLeaf);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => 
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.nameEn && a.nameEn.toLowerCase().includes(q)) ||
        (a.categoryLabel && a.categoryLabel.toLowerCase().includes(q)) ||
        (a.notes && a.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [accounts, selectedCategory, filterPostingOnly, searchQuery]);

  // Toggle tree node expansion
  const toggleNode = (code: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    accounts.forEach(a => {
      next[a.code] = true;
    });
    setExpandedNodes(next);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Open add modal with optional parent pre-selection
  const handleOpenAddModal = (parentAccount?: ChartAccountNode) => {
    setModalError('');
    if (parentAccount) {
      setNewAccountParentCode(parentAccount.code);
      setNewAccountCategory(parentAccount.category);
      setNewAccountNature(parentAccount.nature);
      const suggested = chartOfAccountsService.suggestNextCode(parentAccount.code);
      setNewAccountCode(suggested);
    } else {
      setNewAccountParentCode('');
      setNewAccountCategory('expenses');
      setNewAccountNature('debit');
      setNewAccountCode('');
    }
    setNewAccountName('');
    setNewAccountNameEn('');
    setNewAccountIsLeaf(true);
    setNewAccountNotes('');
    setIsAddModalOpen(true);
  };

  // Handle changing parent in modal
  const handleParentChange = (parentCode: string) => {
    setNewAccountParentCode(parentCode);
    if (!parentCode) return;
    const parent = accounts.find(a => a.code === parentCode);
    if (parent) {
      setNewAccountCategory(parent.category);
      setNewAccountNature(parent.nature);
      const suggested = chartOfAccountsService.suggestNextCode(parentCode);
      setNewAccountCode(suggested);
    }
  };

  // Submit Add Account
  const handleSubmitAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!newAccountCode.trim()) {
      setModalError('يرجى كتابة كود الحساب.');
      return;
    }
    if (!newAccountName.trim()) {
      setModalError('يرجى إدخال اسم الحساب.');
      return;
    }

    const res = chartOfAccountsService.addAccount({
      code: newAccountCode.trim(),
      name: newAccountName.trim(),
      nameEn: newAccountNameEn.trim() || undefined,
      category: newAccountCategory,
      parentCode: newAccountParentCode || undefined,
      nature: newAccountNature,
      isLeaf: newAccountIsLeaf,
      notes: newAccountNotes.trim() || undefined
    });

    if (!res.success) {
      setModalError(res.error || 'فشل إضافة الحساب.');
      return;
    }

    // Auto expand parent
    if (newAccountParentCode) {
      setExpandedNodes(prev => ({ ...prev, [newAccountParentCode]: true }));
    }

    setIsAddModalOpen(false);
    showToast(`✓ تم إضافة الحساب [${newAccountCode}] - ${newAccountName} بنجاح إلى دليل الحسابات`);
  };

  // Format currency
  const formatEGP = (val: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val) + ' ج.م';
  };

  // Group accounts hierarchically for tree view
  const rootAccounts = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== 'all' || filterPostingOnly) {
      // In search or filter mode, return filtered list directly
      return filteredAccounts;
    }
    const codes = new Set(accounts.map(a => a.code));
    return accounts.filter(a => !a.parentCode || !codes.has(a.parentCode));
  }, [accounts, filteredAccounts, searchQuery, selectedCategory, filterPostingOnly]);

  const getChildAccounts = (parentCode: string) => {
    return accounts.filter(a => a.parentCode === parentCode);
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: ChartAccountNode, depth = 0) => {
    const children = getChildAccounts(node.code);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedNodes[node.code];

    const categoryBadgeColor = {
      assets: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      liabilities: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      equity: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      revenue: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      expenses: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    }[node.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

    return (
      <div key={node.id} className="flex flex-col select-none">
        <div 
          className={`flex items-center justify-between p-2.5 rounded-xl transition-all border my-0.5 ${
            isDark 
              ? 'hover:bg-slate-800/80 bg-slate-900/60 border-slate-800/80 hover:border-slate-700' 
              : 'hover:bg-slate-100/90 bg-white border-slate-200/80 hover:border-slate-300'
          } ${depth === 0 ? 'font-bold border-r-4 border-r-blue-500' : ''}`}
          style={{ marginRight: `${depth * 24}px` }}
        >
          {/* Right side: Code, expand arrow, icon, and Name */}
          <div className="flex items-center space-x-2.5 space-x-reverse min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.code)}
                className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-amber-400" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}

            {/* Folder / Document icon */}
            <div className="shrink-0">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-500/70" />
                )
              ) : (
                <FileText className="w-4 h-4 text-blue-400/80" />
              )}
            </div>

            {/* Code Badge */}
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700/80 shrink-0">
              {node.code}
            </span>

            {/* Account Name */}
            <span className={`text-[13px] sm:text-[14px] truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {node.name || 'حساب بدون اسم'}
            </span>

            {/* English Name (optional) */}
            {node.nameEn && (
              <span className="text-xs text-slate-500 font-mono hidden md:inline truncate">
                ({node.nameEn})
              </span>
            )}

            {/* Leaf indicator */}
            {node.isLeaf ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                حساب ترحيل
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                رئيسي تجميعي
              </span>
            )}
          </div>

          {/* Left side: Category badge, nature, balance, and quick actions */}
          <div className="flex items-center space-x-3 space-x-reverse shrink-0">
            {/* Category */}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border hidden sm:inline-block ${categoryBadgeColor}`}>
              {node.categoryLabel}
            </span>

            {/* Nature: Debit / Credit */}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
              node.nature === 'debit' 
                ? 'bg-blue-500/15 text-blue-400' 
                : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              {node.nature === 'debit' ? 'مدين' : 'دائن'}
            </span>

            {/* Balance */}
            <span className="font-mono text-xs font-bold text-slate-200 min-w-[100px] text-left">
              {formatEGP(node.balance || 0)}
            </span>

            {/* Add Sub-Account Button */}
            {!node.isLeaf && (
              <button
                type="button"
                onClick={() => handleOpenAddModal(node)}
                className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center space-x-1 space-x-reverse"
                title={`إضافة حساب فرعي تحت [${node.name}]`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden lg:inline">حساب فرعي</span>
              </button>
            )}
          </div>
        </div>

        {/* Render nested children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5 border-r border-slate-800/80 mr-3 pr-1">
            {children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      id="chart-of-accounts-main-workspace"
      className={`h-[calc(100vh-5.5rem)] flex flex-col rounded-2xl border shadow-2xl overflow-hidden select-none font-sans ${
        isDark 
          ? 'bg-slate-950 border-slate-800 text-slate-100' 
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`} 
      dir="rtl"
    >
      {/* 1. TOP HEADER BAR */}
      <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <FolderTree className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-100">
                دليل الحسابات (Chart of Accounts)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {accounts.length} حساب
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hidden sm:inline-block">
                الهيكل المالي المعتمد
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              الدليل المحاسبي المركزي الموحد لربط المعاملات اليومية والقيود والتقارير المالية
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center space-x-2.5 space-x-reverse">
          {/* Add Account Button */}
          <button
            type="button"
            id="btn-coa-add-account"
            onClick={() => handleOpenAddModal()}
            className="h-[40px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب جديد</span>
          </button>

          {/* View Mode Switcher: Tree vs Table */}
          <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-1 space-x-reverse">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`h-[32px] px-3 rounded-lg text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all ${
                viewMode === 'tree'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض الشجرة الهرمية"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">شجرة الحسابات</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-[32px] px-3 rounded-lg text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض جدول البيانات"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">جدول مفصل</span>
            </button>
          </div>

          {/* Close button if provided */}
          {onClose && (
            <button
              type="button"
              onClick={() => onClose()}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
              title="إغلاق والعودة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS & SUMMARY PILLS */}
      <div className={`px-5 py-2.5 border-b grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0 ${
        isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-100/70 border-slate-200'
      }`}>
        {/* Assets (1) */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setSelectedCategory(selectedCategory === 'assets' ? 'all' : 'assets')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            selectedCategory === 'assets'
              ? 'bg-blue-600/20 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-400 font-bold">1. الأصول (Assets)</span>
            <span className="font-mono text-slate-400 text-[11px]">{metrics.assetsCount}</span>
          </div>
          <div className="font-mono text-xs font-black text-slate-100 mt-1">
            {formatEGP(metrics.totalAssetsBalance)}
          </div>
        </div>

        {/* Liabilities (2) */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setSelectedCategory(selectedCategory === 'liabilities' ? 'all' : 'liabilities')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            selectedCategory === 'liabilities'
              ? 'bg-rose-600/20 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-400 font-bold">2. الخصوم (Liabilities)</span>
            <span className="font-mono text-slate-400 text-[11px]">{metrics.liabilitiesCount}</span>
          </div>
          <div className="font-mono text-xs font-black text-slate-100 mt-1">
            {formatEGP(metrics.totalLiabilitiesBalance)}
          </div>
        </div>

        {/* Equity (3) */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setSelectedCategory(selectedCategory === 'equity' ? 'all' : 'equity')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            selectedCategory === 'equity'
              ? 'bg-purple-600/20 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-400 font-bold">3. حقوق الملكية (Equity)</span>
            <span className="font-mono text-slate-400 text-[11px]">{metrics.equityCount}</span>
          </div>
          <div className="font-mono text-xs font-black text-slate-100 mt-1">
            {formatEGP(metrics.totalEquityBalance)}
          </div>
        </div>

        {/* Revenue (4) */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setSelectedCategory(selectedCategory === 'revenue' ? 'all' : 'revenue')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            selectedCategory === 'revenue'
              ? 'bg-emerald-600/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-bold">4. الإيرادات (Revenue)</span>
            <span className="font-mono text-slate-400 text-[11px]">{metrics.revenueCount}</span>
          </div>
          <div className="font-mono text-xs font-black text-slate-100 mt-1">
            {formatEGP(metrics.totalRevenueBalance)}
          </div>
        </div>

        {/* Expenses (5) */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setSelectedCategory(selectedCategory === 'expenses' ? 'all' : 'expenses')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedCategory === 'expenses'
              ? 'bg-amber-600/20 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-400 font-bold">5. المصروفات (Expenses)</span>
            <span className="font-mono text-slate-400 text-[11px]">{metrics.expensesCount}</span>
          </div>
          <div className="font-mono text-xs font-black text-slate-100 mt-1">
            {formatEGP(metrics.totalExpensesBalance)}
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR & FILTERS */}
      <div className={`px-5 py-3 border-b flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-3 space-x-reverse flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              id="input-coa-search"
              placeholder="البحث برقم الحساب أو الاسم أو التصنيف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-[38px] pr-9 pl-8 rounded-xl text-xs font-semibold border transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Select */}
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryFilter)}
              className={`h-[38px] px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-200' 
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">جميع الحسابات الرئيسية</option>
              <option value="assets">1. الأصول (Assets)</option>
              <option value="liabilities">2. الخصوم (Liabilities)</option>
              <option value="equity">3. حقوق الملكية (Equity)</option>
              <option value="revenue">4. الإيرادات (Revenue)</option>
              <option value="expenses">5. المصروفات (Expenses)</option>
            </select>
          </div>

          {/* Posting Only Checkbox */}
          <label className="flex items-center space-x-1.5 space-x-reverse cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={filterPostingOnly}
              onChange={(e) => setFilterPostingOnly(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
            />
            <span>حسابات الترحيل فقط</span>
          </label>
        </div>

        {/* Tree Expand / Collapse controls */}
        {viewMode === 'tree' && (
          <div className="flex items-center space-x-2 space-x-reverse text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold"
            >
              توسيع الكل
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold"
            >
              طي الكل
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN BODY (TREE VIEW OR TABLE VIEW) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
        {filteredAccounts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
            <FolderTree className="w-12 h-12 text-slate-600 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-400">
              لا توجد حسابات مطابقة لمعايير البحث والتصفية المحددة.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setFilterPostingOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : viewMode === 'tree' ? (
          /* Tree View */
          <div className="space-y-1 max-w-6xl mx-auto">
            {rootAccounts.map(account => renderTreeNode(account, 0))}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">كود الحساب</th>
                  <th className="p-3">اسم الحساب بالعربية</th>
                  <th className="p-3">الاسم بالإنجليزية</th>
                  <th className="p-3">التصنيف المحاسبي</th>
                  <th className="p-3">الحساب الأب</th>
                  <th className="p-3">الطبيعة</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3 text-left">الرصيد الدفتري</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredAccounts.map(acc => (
                  <tr 
                    key={acc.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-900/80 bg-slate-950/40' : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-amber-400">
                      {acc.code}
                    </td>
                    <td className="p-3 font-bold text-slate-100">
                      {acc.name}
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {acc.nameEn || '—'}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {acc.categoryLabel}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {acc.parentCode ? (
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {acc.parentCode}
                        </span>
                      ) : (
                        '— (جذر)'
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        acc.nature === 'debit' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {acc.nature === 'debit' ? 'مدين' : 'دائن'}
                      </span>
                    </td>
                    <td className="p-3">
                      {acc.isLeaf ? (
                        <span className="text-emerald-400 font-bold">ترحيل مباشر</span>
                      ) : (
                        <span className="text-slate-400">رئيسي</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-left text-slate-200">
                      {formatEGP(acc.balance || 0)}
                    </td>
                    <td className="p-3 text-center">
                      {!acc.isLeaf && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddModal(acc)}
                          className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold"
                          title="إضافة حساب فرعي"
                        >
                          + فرعي
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL: ADD NEW ACCOUNT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-right dir-rtl">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100">
                    إضافة حساب جديد لدليل الحسابات
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    سيتم حفظ الحساب فورياً ليكون متاحاً في معاملات الدخل والتقارير
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitAddAccount} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center space-x-2 space-x-reverse">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Parent Account Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الحساب الأب (مستوى أعلى)
                </label>
                <select
                  value={newAccountParentCode}
                  onChange={(e) => handleParentChange(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">بدون حساب أب (حساب رئيسي مستوى أول)</option>
                  {accounts.filter(a => !a.isLeaf).map(parent => (
                    <option key={parent.id} value={parent.code}>
                      [{parent.code}] {parent.name} ({parent.categoryLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Code & Nature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    كود الحساب <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 5210"
                    value={newAccountCode}
                    onChange={(e) => setNewAccountCode(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs font-bold focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    طبيعة الحساب
                  </label>
                  <select
                    value={newAccountNature}
                    onChange={(e) => setNewAccountNature(e.target.value as 'debit' | 'credit')}
                    className="w-full h-[42px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                  >
                    <option value="debit">مدين (Debit) - أصول ومصروفات</option>
                    <option value="credit">دائن (Credit) - خصوم وحقوق ملكية وإيرادات</option>
                  </select>
                </div>
              </div>

              {/* Account Name in Arabic */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم الحساب بالعربية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مصاريف شحن بري سريع"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* English Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الاسم بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Express Freight Expense"
                    value={newAccountNameEn}
                    onChange={(e) => setNewAccountNameEn(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    التصنيف الرئيسي
                  </label>
                  <select
                    value={newAccountCategory}
                    onChange={(e) => setNewAccountCategory(e.target.value as any)}
                    className="w-full h-[42px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none"
                  >
                    <option value="assets">1. الأصول (Assets)</option>
                    <option value="liabilities">2. الخصوم (Liabilities)</option>
                    <option value="equity">3. حقوق الملكية (Equity)</option>
                    <option value="revenue">4. الإيرادات (Revenue)</option>
                    <option value="expenses">5. المصروفات (Expenses)</option>
                  </select>
                </div>
              </div>

              {/* Is Leaf Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    قابل للترحيل المباشر (حساب تحليلي)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    يمكن استخدامه في سندات الصرف والقبض وفواتير النظام
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newAccountIsLeaf}
                  onChange={(e) => setNewAccountIsLeaf(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ملاحظات أو توصيف
                </label>
                <textarea
                  rows={2}
                  placeholder="وصف طبيعة الحساب أو ضوابط استخدامه..."
                  value={newAccountNotes}
                  onChange={(e) => setNewAccountNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  حفظ وإدراج في الدليل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-slate-700 text-slate-100 px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 space-x-reverse font-bold text-xs animate-in fade-in duration-200 pointer-events-none backdrop-blur-md">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
