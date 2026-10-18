import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  FileSpreadsheet,
  Banknote,
  Landmark,
  Coins,
  ChevronLeft,
  BarChart3,
  ArrowRight,
  X,
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { themeService, ThemeMode } from '../../services/themeService';
import { treasuryService, Treasury } from '../../services/treasuryService';
import { setupWizardService } from '../../services/setupWizardService';
import { bankAccountService } from '../../services/bankAccountService';
import { PlatformSection, BankAccountItem } from '../../types';
import { IncomeTransactionsView } from './IncomeTransactionsView';
import { ChartOfAccountsView } from './ChartOfAccountsView';

export type AccountsActiveView = 
  | 'home'
  | 'income_transactions'
  | 'income_reports'
  | 'chart_of_accounts';

export type IncomeSubOption = 'inward' | 'outward';
export type ReportSubOption = 'inward_report' | 'outward_report';

export type FinancialReportType = 
  | 'treasury_cash'
  | 'bank_balances'
  | 'total_liquidity'
  | null;

export interface AccountsMainViewProps {
  onClose?: () => void;
  onNavigateSection?: (section: PlatformSection) => void;
}

export const AccountsMainView: React.FC<AccountsMainViewProps> = ({
  onClose,
  onNavigateSection
}) => {
  const [activeView, setActiveView] = useState<AccountsActiveView>('home');
  const [selectedIncomeOption, setSelectedIncomeOption] = useState<IncomeSubOption>('inward');
  const [selectedReportOption, setSelectedReportOption] = useState<ReportSubOption>('inward_report');
  const [selectedReportModal, setSelectedReportModal] = useState<FinancialReportType>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => themeService.getTheme());

  // Listen to system theme changes
  useEffect(() => {
    const unsubscribeTheme = themeService.subscribe((currentTheme) => {
      setTheme(currentTheme);
    });
    return () => {
      unsubscribeTheme();
    };
  }, []);

  const isDark = theme === 'dark';

  // Resolve current active branch
  const wizardConfig = setupWizardService.getConfig();
  const branches = wizardConfig?.branches || [];
  const currentBranch = branches.find((b: any) => b.isMain) || branches[0] || { id: 'BR-01', name: 'الفرع الرئيسي' };
  const currentBranchId = currentBranch.id;

  // Load real financial data scoped strictly to current branch
  const treasuries = useMemo<Treasury[]>(() => {
    try {
      const allActive = treasuryService.getActiveTreasuries();
      return allActive.filter(t => t.branchId === currentBranchId);
    } catch {
      return [];
    }
  }, [currentBranchId]);

  const bankAccounts = useMemo<BankAccountItem[]>(() => {
    try {
      return bankAccountService.getBankAccounts(currentBranchId);
    } catch {
      return [];
    }
  }, [currentBranchId]);

  // Calculate live balances from real movements
  const treasuryCashTotal = useMemo(() => {
    return treasuries.reduce((sum, tr) => {
      return sum + (treasuryService.getTreasuryBalance(tr.id) || 0);
    }, 0);
  }, [treasuries]);

  const bankBalancesTotal = useMemo(() => {
    return bankAccounts.reduce((sum, b) => {
      return sum + (bankAccountService.getBankBalance(b.id, currentBranchId) || 0);
    }, 0);
  }, [bankAccounts, currentBranchId]);

  const grandTotalLiquidity = treasuryCashTotal + bankBalancesTotal;

  // Format currency
  const formatCurrency = (val: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val) + ` ${currency}`;
  };

  const handleOpenIncomeTransactions = (option?: IncomeSubOption) => {
    if (option) {
      setSelectedIncomeOption(option);
    }
    setActiveView('income_transactions');
  };

  const handleOpenIncomeReports = (option?: ReportSubOption) => {
    if (option) {
      setSelectedReportOption(option);
    }
    setActiveView('income_reports');
  };

  return (
    <div
      className={`w-full flex flex-col rounded-3xl transition-all duration-200 select-none font-sans p-5 sm:p-6 ${
        isDark 
          ? 'bg-slate-950 text-slate-100' 
          : 'bg-[#f8fafc] text-slate-900'
      }`}
      dir="rtl"
    >
      {/* 1. TOP BREADCRUMB & HEADER SECTION */}
      <div className="w-full max-w-7xl mx-auto pb-4 sm:pb-5">
        {/* Breadcrumb Navigation - Small Text 12-13px */}
        <div className="flex items-center justify-between mb-3">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 space-x-reverse text-[12px] sm:text-[13px] font-medium">
            <button
              type="button"
              onClick={() => {
                if (activeView !== 'home') {
                  setActiveView('home');
                } else if (onNavigateSection) {
                  onNavigateSection('main');
                } else if (onClose) {
                  onClose();
                }
              }}
              className="flex items-center space-x-1 space-x-reverse text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <span>الرئيسية</span>
            </button>

            <span className="text-slate-300 dark:text-slate-600">›</span>

            <button
              type="button"
              onClick={() => setActiveView('home')}
              className={`transition-colors ${
                activeView === 'home'
                  ? isDark ? 'text-slate-200 font-semibold' : 'text-slate-800 font-semibold'
                  : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              الحسابات
            </button>

            {activeView === 'income_transactions' && (
              <>
                <span className="text-slate-300 dark:text-slate-600">›</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">معاملات الدخل</span>
              </>
            )}

            {activeView === 'income_reports' && (
              <>
                <span className="text-slate-300 dark:text-slate-600">›</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">تقارير معاملات الدخل</span>
              </>
            )}

            {activeView === 'chart_of_accounts' && (
              <>
                <span className="text-slate-300 dark:text-slate-600">›</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">دليل الحسابات</span>
              </>
            )}
          </nav>

          {/* Quick Return to Main Interface if in home view */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="إغلاق والعودة"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Page Title (28-32px Bold) & Subtitle (14-16px Regular) */}
        {activeView !== 'income_transactions' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5 space-x-reverse">
              {/* Dark Styled Calculator Icon Container */}
              <div 
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-transform ${
                  isDark
                    ? 'bg-[#1565C0] text-white shadow-blue-500/20'
                    : 'bg-[#0f172a] text-white shadow-slate-900/20'
                }`}
              >
                <Calculator className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.75]" />
              </div>

              <div>
                {/* Main Title: 28-32px Bold */}
                <h1 className="text-[28px] sm:text-[30px] lg:text-[32px] font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                  الحسابات
                </h1>
                {/* Subtitle Description: 14-16px Regular */}
                <p className={`text-[14px] sm:text-[15px] font-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  إدارة الحركات والحسابات المالية بسهولة ومرونة
                </p>
              </div>
            </div>

            {/* Secondary Return Button: Height 38-44px */}
            {activeView !== 'home' && (
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className={`h-[40px] sm:h-[42px] px-4 flex items-center space-x-2 space-x-reverse rounded-xl text-[13px] sm:text-[14px] font-semibold border transition-all ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لرئيسية الحسابات</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. MAIN BODY CONTENT */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-start">
        {activeView === 'home' && (
          <div className="space-y-4 sm:space-y-5 animate-fadeIn">
            {/* ROW 1: THE TWO HERO CARDS */}
            {/* Grid maintains exact layout and size */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              
              {/* FIRST (RIGHT IN RTL): قسم «معاملات الدخل» */}
              <div
                id="accounts-card-income-transactions"
                role="button"
                tabIndex={0}
                onClick={() => handleOpenIncomeTransactions()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleOpenIncomeTransactions();
                  }
                }}
                className={`relative group rounded-3xl p-5 sm:p-6 border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer select-none active:scale-[0.99] ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/25 border-slate-800 hover:border-blue-500/50 shadow-xl'
                    : 'bg-gradient-to-br from-[#f0f6ff] via-[#f7faff] to-[#eaf2fe] border-[#d3e4fe] shadow-xs hover:shadow-md hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5 space-x-reverse">
                      {/* Stylized Blue Icon */}
                      <div 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 duration-200 ${
                          isDark 
                            ? 'bg-blue-950/70 border-blue-800/60 text-blue-400' 
                            : 'bg-blue-500/10 border-blue-200 text-[#1565C0]'
                        }`}
                      >
                        <div className="relative">
                          <Banknote className="w-6 h-6 stroke-[1.8]" />
                          <ArrowLeftRight className="w-3 h-3 absolute -top-1.5 -right-1.5 text-blue-500" />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        {/* Card Title: 17-19px SemiBold */}
                        <h2 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold text-slate-900 dark:text-slate-100">
                          معاملات الدخل
                        </h2>
                        {/* Card Description/Subtitle: 14-16px Regular */}
                        <p className="text-[14px] sm:text-[15px] font-normal text-slate-500 dark:text-slate-400">
                          الصادر والوارد لحساب
                        </p>
                      </div>
                    </div>

                    {/* Circular Navigation Arrow */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isDark 
                          ? 'bg-blue-950/60 text-blue-400 group-hover:bg-blue-900/70' 
                          : 'bg-blue-100/70 text-blue-600 group-hover:bg-blue-200'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: Height 44-48px */}
                <div className="mt-5 sm:mt-6 pt-1 flex items-center">
                  <span
                    className="h-[44px] sm:h-[46px] lg:h-[48px] px-6 rounded-xl bg-[#1565C0] group-hover:bg-[#0d47a1] text-white font-bold text-[14px] sm:text-[15px] shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center space-x-2 space-x-reverse"
                  >
                    <span>دخول</span>
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* SECOND (LEFT IN RTL): قسم «تقارير معاملات الدخل» */}
              <div
                id="accounts-card-income-reports"
                role="button"
                tabIndex={0}
                onClick={() => handleOpenIncomeReports()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleOpenIncomeReports();
                  }
                }}
                className={`relative group rounded-3xl p-5 sm:p-6 border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer select-none active:scale-[0.99] ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/25 border-slate-800 hover:border-emerald-500/50 shadow-xl'
                    : 'bg-gradient-to-br from-[#f0f9f4] via-[#f7fbf8] to-[#e7f7ee] border-[#d2edd9] shadow-xs hover:shadow-md hover:border-emerald-300'
                }`}
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5 space-x-reverse">
                      {/* Stylized Green Icon */}
                      <div 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 duration-200 ${
                          isDark 
                            ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-400' 
                            : 'bg-emerald-500/10 border-emerald-200 text-[#0f7a3f]'
                        }`}
                      >
                        <div className="relative">
                          <FileSpreadsheet className="w-6 h-6 stroke-[1.8]" />
                          <BarChart3 className="w-3 h-3 absolute -bottom-1 -left-1 text-emerald-600" />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        {/* Card Title: 17-19px SemiBold */}
                        <h2 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold text-slate-900 dark:text-slate-100">
                          تقارير معاملات الدخل
                        </h2>
                        {/* Card Description/Subtitle: 14-16px Regular */}
                        <p className="text-[14px] sm:text-[15px] font-normal text-slate-500 dark:text-slate-400">
                          تقارير الصادر والوارد
                        </p>
                      </div>
                    </div>

                    {/* Circular Navigation Arrow */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isDark 
                          ? 'bg-emerald-950/60 text-emerald-400 group-hover:bg-emerald-900/70' 
                          : 'bg-emerald-100/70 text-emerald-700 group-hover:bg-emerald-200'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: Height 44-48px */}
                <div className="mt-5 sm:mt-6 pt-1 flex items-center">
                  <span
                    className="h-[44px] sm:h-[46px] lg:h-[48px] px-6 rounded-xl bg-[#0f7a3f] group-hover:bg-[#0b5c2f] text-white font-bold text-[14px] sm:text-[15px] shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all flex items-center space-x-2 space-x-reverse"
                  >
                    <span>دخول</span>
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 2: قسم «التقارير المالية» (Financial Reports Section) */}
            {/* Same layout and 3 cards preserved, updated with approved typography and spacing */}
            <div
              id="accounts-section-financial-reports"
              className={`rounded-3xl p-5 sm:p-6 border transition-all duration-200 ${
                isDark
                  ? 'bg-slate-900/80 border-slate-800 shadow-xl'
                  : 'bg-white border-slate-200/90 shadow-xs'
              }`}
            >
              {/* Section Header */}
              <div className="flex items-center space-x-3 space-x-reverse mb-4 sm:mb-5">
                <BarChart3 className="w-6 h-6 text-[#1565C0] shrink-0 stroke-[2.2]" />
                <div>
                  {/* Section Title: 21-24px Bold */}
                  <h3 className="text-[21px] sm:text-[23px] lg:text-[24px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                    التقارير المالية
                  </h3>
                  {/* Section Description: 14-16px Regular */}
                  <p className="text-[14px] sm:text-[15px] font-normal text-slate-500 dark:text-slate-400">
                    متابعة أرصدة الخزائن والبنوك بشكل لحظي
                  </p>
                </div>
              </div>

              {/* 3 Symmetrical Cards Grid - Internal Spacing: 12-16px (gap-3 to gap-4) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* 1. رصيد نقدي الخزينة (Right Card in RTL) */}
                <div
                  className={`rounded-2xl p-5 text-center flex flex-col items-center justify-between min-h-[200px] border transition-all duration-200 group ${
                    isDark
                      ? 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-500/40 shadow-xs'
                      : 'bg-[#edf8f1] border-[#d8f2e2] shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    {/* Centered Green Cash Icon */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 text-[#0f7a3f] dark:text-emerald-400">
                      <Banknote className="w-9 h-9 stroke-[1.8] group-hover:scale-110 transition-transform duration-200" />
                    </div>

                    {/* Card Title: 17-19px SemiBold */}
                    <h4 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      رصيد نقدي الخزينة
                    </h4>
                    {/* Small Caption: 12-13px */}
                    <p className="text-[12px] sm:text-[13px] font-normal text-slate-500 dark:text-slate-400">
                      أرصدة الخزائن وحركات اليوم
                    </p>
                  </div>

                  {/* Secondary Action Button: Height 38-44px */}
                  <div className="mt-4 w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedReportModal('treasury_cash')}
                      className={`w-full max-w-[170px] mx-auto h-[38px] sm:h-[40px] px-4 rounded-xl font-semibold text-[13px] sm:text-[14px] flex items-center justify-center space-x-1.5 space-x-reverse transition-all border shadow-xs ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-100 border-slate-700 hover:border-emerald-500/50'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <span>عرض التقرير</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. رصيد البنوك (Center Card in RTL) */}
                <div
                  className={`rounded-2xl p-5 text-center flex flex-col items-center justify-between min-h-[200px] border transition-all duration-200 group ${
                    isDark
                      ? 'bg-blue-950/20 border-blue-900/40 hover:border-blue-500/40 shadow-xs'
                      : 'bg-[#eff6ff] border-[#dbeafe] shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    {/* Centered Blue Bank Icon */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 text-[#1565C0] dark:text-blue-400">
                      <Landmark className="w-9 h-9 stroke-[1.8] group-hover:scale-110 transition-transform duration-200" />
                    </div>

                    {/* Card Title: 17-19px SemiBold */}
                    <h4 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      رصيد البنوك
                    </h4>
                    {/* Small Caption: 12-13px */}
                    <p className="text-[12px] sm:text-[13px] font-normal text-slate-500 dark:text-slate-400">
                      أرصدة الحسابات البنكية
                    </p>
                  </div>

                  {/* Secondary Action Button: Height 38-44px */}
                  <div className="mt-4 w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedReportModal('bank_balances')}
                      className={`w-full max-w-[170px] mx-auto h-[38px] sm:h-[40px] px-4 rounded-xl font-semibold text-[13px] sm:text-[14px] flex items-center justify-center space-x-1.5 space-x-reverse transition-all border shadow-xs ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-750 text-blue-400 border-slate-700 hover:border-blue-500/50'
                          : 'bg-white hover:bg-slate-50 text-blue-700 border-slate-200/90 hover:border-blue-200'
                      }`}
                    >
                      <span>عرض التقرير</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. رصيد إجمالي (Left Card in RTL) */}
                <div
                  className={`rounded-2xl p-5 text-center flex flex-col items-center justify-between min-h-[200px] border transition-all duration-200 group ${
                    isDark
                      ? 'bg-purple-950/20 border-purple-900/40 hover:border-purple-500/40 shadow-xs'
                      : 'bg-[#f5f3ff] border-[#ece7fe] shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    {/* Centered Purple Coins Icon */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 text-purple-600 dark:text-purple-400">
                      <Coins className="w-9 h-9 stroke-[1.8] group-hover:scale-110 transition-transform duration-200" />
                    </div>

                    {/* Card Title: 17-19px SemiBold */}
                    <h4 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      رصيد إجمالي
                    </h4>
                    {/* Small Caption: 12-13px */}
                    <p className="text-[12px] sm:text-[13px] font-normal text-slate-500 dark:text-slate-400">
                      إجمالي أرصدة الخزائن والبنوك
                    </p>
                  </div>

                  {/* Secondary Action Button: Height 38-44px */}
                  <div className="mt-4 w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedReportModal('total_liquidity')}
                      className={`w-full max-w-[170px] mx-auto h-[38px] sm:h-[40px] px-4 rounded-xl font-semibold text-[13px] sm:text-[14px] flex items-center justify-center space-x-1.5 space-x-reverse transition-all border shadow-xs ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-750 text-purple-400 border-slate-700 hover:border-purple-500/50'
                          : 'bg-white hover:bg-slate-50 text-purple-700 border-slate-200/90 hover:border-purple-200'
                      }`}
                    >
                      <span>عرض التقرير</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 1: معاملات الدخل */}
        {activeView === 'income_transactions' && (
          <IncomeTransactionsView
            isDark={isDark}
            initialMovementType={selectedIncomeOption}
            onBackToHome={() => setActiveView('home')}
          />
        )}

        {/* SUB-VIEW 2: تقارير معاملات الدخل */}
        {activeView === 'income_reports' && (
          <div className="animate-fadeIn space-y-4 sm:space-y-5">
            <div
              className={`rounded-3xl p-6 sm:p-7 border ${
                isDark
                  ? 'bg-slate-900 border-slate-800 shadow-xl'
                  : 'bg-white border-slate-200/90 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3.5 space-x-reverse">
                  <div className="w-12 h-12 rounded-2xl bg-[#0f7a3f] text-white flex items-center justify-center shadow-md">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    {/* Section Title: 21-24px Bold */}
                    <h2 className="text-[21px] sm:text-[23px] lg:text-[24px] font-bold text-slate-900 dark:text-slate-100">
                      شاشة تقارير معاملات الدخل
                    </h2>
                    {/* Description: 14-16px Regular */}
                    <p className="text-[14px] sm:text-[15px] font-normal text-slate-500 dark:text-slate-400">
                      استعراض وطباعة تقارير حركات الوارد والصادر
                    </p>
                  </div>
                </div>

                {/* Sub-Option Selector inside Reports Screen */}
                <div className="flex items-center space-x-2 space-x-reverse p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSelectedReportOption('inward_report')}
                    className={`px-4 py-2 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-all ${
                      selectedReportOption === 'inward_report'
                        ? 'bg-[#0f7a3f] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    تقرير الوارد
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReportOption('outward_report')}
                    className={`px-4 py-2 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-all ${
                      selectedReportOption === 'outward_report'
                        ? 'bg-[#0f7a3f] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    تقرير الصادر
                  </button>
                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="py-10 text-center max-w-xl mx-auto space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Info className="w-7 h-7" />
                </div>
                <h3 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold text-slate-900 dark:text-slate-100">
                  التقرير المحدد: {selectedReportOption === 'inward_report' ? 'تقرير الوارد' : 'تقرير الصادر'}
                </h3>
                <p className="text-[14px] sm:text-[15px] font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
                  سيتم تفعيل جداول التقارير التفصيلية والفلاتر المحاسبية المتقدمة والطباعة في المرحلة القادمة وفق توجيهاتكم المعتمدة.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveView('home')}
                    className="h-[44px] sm:h-[46px] px-6 rounded-xl bg-[#0f7a3f] hover:bg-[#0b5c2f] text-white font-bold text-[14px] sm:text-[15px] shadow-md transition-all inline-flex items-center space-x-2 space-x-reverse"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة لرئيسية الحسابات</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: دليل الحسابات (Chart of Accounts) */}
        {activeView === 'chart_of_accounts' && (
          <div className="animate-fadeIn">
            <ChartOfAccountsView
              onClose={() => setActiveView('home')}
              onNavigateSection={onNavigateSection}
            />
          </div>
        )}
      </div>

      {/* 3. FINANCIAL REPORTS DETAILS MODAL */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div
            className={`w-full max-w-2xl rounded-3xl p-5 sm:p-6 border shadow-2xl transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3 space-x-reverse">
                {selectedReportModal === 'treasury_cash' && (
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Banknote className="w-6 h-6" />
                  </div>
                )}
                {selectedReportModal === 'bank_balances' && (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Landmark className="w-6 h-6" />
                  </div>
                )}
                {selectedReportModal === 'total_liquidity' && (
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Coins className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <h3 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold">
                    {selectedReportModal === 'treasury_cash' && 'تقرير رصيد نقدي الخزينة'}
                    {selectedReportModal === 'bank_balances' && 'تقرير رصيد البنوك'}
                    {selectedReportModal === 'total_liquidity' && 'تقرير الرصيد المالي الإجمالي'}
                  </h3>
                  <p className="text-[12px] sm:text-[13px] font-normal text-slate-400">
                    بيانات أرصدة حية ومباشرة من النظام
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReportModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Report 1: Treasury Cash */}
              {selectedReportModal === 'treasury_cash' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[13px] text-emerald-800 dark:text-emerald-300 font-semibold block">إجمالي النقدية بالخزائن</span>
                      <span className="text-[21px] sm:text-[23px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        {formatCurrency(treasuryCashTotal)}
                      </span>
                    </div>
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-emerald-600 text-white font-semibold">
                      {treasuries.length} خزينة نشطة
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    <h5 className="text-[13px] font-semibold text-slate-400">تفاصيل الخزائن:</h5>
                    {treasuries.map((tr) => {
                      const balance = treasuryService.getTreasuryBalance(tr.id);
                      return (
                        <div
                          key={tr.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-[13px] ${
                            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <span className="font-semibold block text-slate-800 dark:text-slate-100">{tr.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{tr.code} • {tr.currency}</span>
                          </div>
                          <span className="font-mono font-bold text-[14px] text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(balance, tr.currency.includes('USD') ? 'USD' : 'EGP')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Report 2: Bank Balances */}
              {selectedReportModal === 'bank_balances' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[13px] text-blue-800 dark:text-blue-300 font-semibold block">إجمالي أرصدة الحسابات البنكية ({currentBranch.name})</span>
                      <span className="text-[21px] sm:text-[23px] font-bold text-blue-700 dark:text-blue-400 font-mono">
                        {formatCurrency(bankBalancesTotal)}
                      </span>
                    </div>
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-blue-600 text-white font-semibold">
                      {bankAccounts.length} حساب بنكي
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    <h5 className="text-[13px] font-semibold text-slate-400">تفاصيل الحسابات البنكية بالفرع:</h5>
                    {bankAccounts.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
                        لا توجد حسابات بنكية مخصصة لهذا الفرع حالياً.
                      </div>
                    ) : (
                      bankAccounts.map((b) => {
                        const balance = bankAccountService.getBankBalance(b.id, currentBranchId);
                        return (
                          <div
                            key={b.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-[13px] ${
                              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div>
                              <span className="font-semibold block text-slate-800 dark:text-slate-100">{b.bankName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">رقم الحساب: {b.accountNumber} • {b.currency}</span>
                            </div>
                            <span className="font-mono font-bold text-[14px] text-blue-600 dark:text-blue-400">
                              {formatCurrency(balance, b.currency.includes('USD') ? 'USD' : 'EGP')}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Report 3: Total Liquidity */}
              {selectedReportModal === 'total_liquidity' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[13px] text-purple-800 dark:text-purple-300 font-semibold block">السيولة الإجمالية المتاحة (خزائن + بنوك)</span>
                      <span className="text-[21px] sm:text-[23px] font-bold text-purple-700 dark:text-purple-400 font-mono">
                        {formatCurrency(grandTotalLiquidity)}
                      </span>
                    </div>
                    <span className="text-[12px] px-2.5 py-1 rounded-full bg-purple-600 text-white font-semibold">
                      إجمالي موحد
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[11px] text-slate-400 block mb-1">نقدية الخزائن:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[14px]">
                        {formatCurrency(treasuryCashTotal)}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[11px] text-slate-400 block mb-1">أرصدة البنوك:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[14px]">
                        {formatCurrency(bankBalancesTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReportModal(null)}
                className="h-[38px] px-5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold text-[13px] transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
