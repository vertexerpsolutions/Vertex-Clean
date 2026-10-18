import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  RefreshCw,
  FileText,
  Folder,
  ClipboardList,
  PieChart,
  Boxes,
  ChevronDown,
  ChevronUp,
  Home,
  LogOut,
  X,
  Minus,
  Square,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { themeService, ThemeMode } from '../../services/themeService';
import { ItemBalancesReportView } from './reports/ItemBalancesReportView';
import { ItemCardReportView } from './reports/ItemCardReportView';
import { OpeningBalancesReportView } from './reports/OpeningBalancesReportView';
import { InventoryValuationReportView } from './reports/InventoryValuationReportView';
import { StockTransferReportsView } from './reports/StockTransferReportsView';
import { StockTransferView } from './StockTransferView';

export type WarehouseMenuItemId =
  | 'home'
  | 'item_balance'
  | 'item_card'
  | 'opening_balance'
  | 'inventory_valuation'
  | 'stock_transfer'
  | 'transfer_reports'
  | 'transfer_issue'
  | 'transfer_receipt'
  | 'pending_transfers';

export interface WarehouseMainViewProps {
  onClose?: () => void;
  onNavigateSection?: (section: string) => void;
}

interface MenuItemDef {
  id: WarehouseMenuItemId;
  title: string;
  category: 'reports' | 'operations';
  icon: React.ReactNode;
  iconBg: string;
}

export const WarehouseMainView: React.FC<WarehouseMainViewProps> = ({
  onClose,
  onNavigateSection
}) => {
  const [activeItemId, setActiveItemId] = useState<WarehouseMenuItemId>('home');
  const [theme, setTheme] = useState<ThemeMode>(() => themeService.getTheme());

  useEffect(() => {
    const unsubscribeTheme = themeService.subscribe((currentTheme) => {
      setTheme(currentTheme);
    });
    return () => {
      unsubscribeTheme();
    };
  }, []);

  const isDark = theme === 'dark';

  // Menu items definitions matching the exact image specification
  const reportsList: MenuItemDef[] = [
    {
      id: 'item_balance',
      title: 'تقرير أرصدة الأصناف',
      category: 'reports',
      icon: <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />,
      iconBg: isDark ? 'bg-blue-950/60 border border-blue-800/50' : 'bg-blue-50 border border-blue-100'
    },
    {
      id: 'item_card',
      title: 'تقرير كارتة صنف',
      category: 'reports',
      icon: <Folder className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />,
      iconBg: isDark ? 'bg-emerald-950/60 border border-emerald-800/50' : 'bg-emerald-50 border border-emerald-100'
    },
    {
      id: 'opening_balance',
      title: 'تقرير رصيد أول المدة للأصناف',
      category: 'reports',
      icon: <ClipboardList className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />,
      iconBg: isDark ? 'bg-purple-950/60 border border-purple-800/50' : 'bg-purple-50 border border-purple-100'
    },
    {
      id: 'inventory_valuation',
      title: 'تقرير تقييم المخزون',
      category: 'reports',
      icon: <PieChart className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />,
      iconBg: isDark ? 'bg-amber-950/60 border border-amber-800/50' : 'bg-amber-50 border border-amber-100'
    }
  ];

  const allItemsMap: Record<WarehouseMenuItemId, { title: string; category: string }> = {
    home: { title: 'الرئيسية', category: '' },
    item_balance: { title: 'تقرير أرصدة الأصناف', category: 'التقارير' },
    item_card: { title: 'تقرير كارتة صنف', category: 'التقارير' },
    opening_balance: { title: 'تقرير رصيد أول المدة للأصناف', category: 'التقارير' },
    inventory_valuation: { title: 'تقرير تقييم المخزون', category: 'التقارير' },
    stock_transfer: { title: 'إجراء تحويل مخزني', category: 'العمليات المخزنية' },
    transfer_reports: { title: 'تقارير التحويلات المخزنية', category: 'العمليات المخزنية / تقارير التحويلات' },
    transfer_issue: { title: 'تقرير الصرف', category: 'العمليات المخزنية / تقارير التحويلات' },
    transfer_receipt: { title: 'تقرير الإضافة', category: 'العمليات المخزنية / تقارير التحويلات' },
    pending_transfers: { title: 'تقرير التحويلات المعلقة', category: 'العمليات المخزنية / تقارير التحويلات' }
  };

  const handleSelectMenuItem = (id: WarehouseMenuItemId) => {
    setActiveItemId(id);
  };

  const currentItem = allItemsMap[activeItemId];

  return (
    <div
      className={`w-full min-h-[920px] xl:min-h-[960px] flex flex-col rounded-2xl shadow-2xl overflow-hidden select-none font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-slate-950 border border-slate-800 text-slate-100'
          : 'bg-[#f0f4f9] border border-slate-300/80 text-slate-800'
      }`}
      dir="rtl"
    >
      {/* Top Blue Window Title Bar */}
      <div
        className={`h-14 px-5 flex items-center justify-between text-white shadow-md select-none shrink-0 ${
          isDark ? 'bg-[#0d47a1]' : 'bg-[#1565C0]'
        }`}
      >
        {/* Right side: Icon + Title */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <WarehouseIcon className="w-5 h-5 text-[#1565C0]" />
          </div>
          <span className="font-bold text-lg tracking-wide">المخازن</span>
        </div>

        {/* Left side: Standard Window Controls */}
        <div className="flex items-center space-x-1.5 space-x-reverse text-blue-100">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
            title="تصغير"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
            title="تكبير / استعادة"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
            title="إغلاق الشاشة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body: Two Columns */}
      <div className="flex-1 flex p-5 sm:p-6 gap-5 lg:gap-6 overflow-hidden">
        {/* RIGHT (MENU / SIDEBAR) - Fixed comfortable proportional width */}
        <aside className="w-80 sm:w-88 flex flex-col justify-between shrink-0 overflow-y-auto pr-0.5">
          <div className="space-y-5">
            {/* Section 1: التقارير */}
            <div>
              {/* Section Header */}
              <div className="flex items-center space-x-2.5 space-x-reverse mb-3 px-1">
                <BarChart2 className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-[#1565C0]'}`} />
                <h3 className={`font-bold text-base ${isDark ? 'text-blue-400' : 'text-[#1565C0]'}`}>التقارير</h3>
              </div>

              {/* Reports Buttons List */}
              <div className="space-y-2.5">
                {reportsList.map((item) => {
                  const isActive = activeItemId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectMenuItem(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-150 text-right ${
                        isActive
                          ? isDark
                            ? 'bg-slate-850 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                            : 'bg-white border-[#1565C0] shadow-md ring-2 ring-[#1565C0]/20'
                          : isDark
                            ? 'bg-slate-900 border-slate-800 shadow-sm hover:border-slate-700 hover:bg-slate-850'
                            : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <span
                        className={`text-sm sm:text-base font-bold ${
                          isActive
                            ? isDark ? 'text-blue-400' : 'text-[#1565C0]'
                            : isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      >
                        {item.title}
                      </span>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                        {item.icon}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            <div className={`border-b border-dashed my-4 ${isDark ? 'border-slate-800' : 'border-slate-300'}`} />

            {/* Section 2: العمليات المخزنية */}
            <div>
              {/* Section Header */}
              <div className="flex items-center space-x-2.5 space-x-reverse mb-3 px-1">
                <RefreshCw className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-[#1565C0]'}`} />
                <h3 className={`font-bold text-base ${isDark ? 'text-blue-400' : 'text-[#1565C0]'}`}>العمليات المخزنية</h3>
              </div>

              {/* Operations List */}
              <div className="space-y-2.5">
                {/* 1. إجراء تحويل مخزني */}
                <button
                  type="button"
                  onClick={() => handleSelectMenuItem('stock_transfer')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-150 text-right ${
                    activeItemId === 'stock_transfer'
                      ? isDark
                        ? 'bg-slate-850 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-[#1565C0] shadow-md ring-2 ring-[#1565C0]/20'
                      : isDark
                        ? 'bg-slate-900 border-slate-800 shadow-sm hover:border-slate-700 hover:bg-slate-850'
                        : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <span
                    className={`text-sm sm:text-base font-bold ${
                      activeItemId === 'stock_transfer'
                        ? isDark ? 'text-blue-400' : 'text-[#1565C0]'
                        : isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    إجراء تحويل مخزني
                  </span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-emerald-950/60 border border-emerald-800/50' : 'bg-emerald-50 border border-emerald-100'
                  }`}>
                    <Boxes className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                </button>

                {/* 2. تقارير التحويلات المخزنية */}
                <button
                  type="button"
                  onClick={() => handleSelectMenuItem('transfer_reports')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-150 text-right cursor-pointer ${
                    activeItemId === 'transfer_reports' || activeItemId === 'transfer_issue' || activeItemId === 'transfer_receipt' || activeItemId === 'pending_transfers'
                      ? isDark
                        ? 'bg-slate-850 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-[#1565C0] shadow-md ring-2 ring-[#1565C0]/20'
                      : isDark
                        ? 'bg-slate-900 border-slate-800 shadow-sm hover:border-slate-700 hover:bg-slate-850'
                        : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <span
                    className={`text-sm sm:text-base font-bold ${
                      activeItemId === 'transfer_reports' || activeItemId === 'transfer_issue' || activeItemId === 'transfer_receipt' || activeItemId === 'pending_transfers'
                        ? isDark ? 'text-blue-400' : 'text-[#1565C0]'
                        : isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    تقارير التحويلات المخزنية
                  </span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-blue-950/60 border border-blue-800/50' : 'bg-blue-50 border border-blue-100'
                  }`}>
                    <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Close Button */}
          <div className="pt-6 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className={`w-32 flex items-center justify-center space-x-2 space-x-reverse px-5 py-2.5 border rounded-xl shadow-sm text-sm font-bold transition-all active:scale-[0.98] ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>إغلاق</span>
            </button>
          </div>
        </aside>

        {/* LEFT (MAIN WORKSPACE AREA - DOMINANT EXPANDED AREA) */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
          {/* Workspace Tabs Header */}
          <div
            className={`flex items-center space-x-2.5 space-x-reverse border-b px-2 shrink-0 ${
              isDark ? 'border-slate-800' : 'border-slate-300/80'
            }`}
          >
            {/* Home Tab */}
            <button
              type="button"
              onClick={() => setActiveItemId('home')}
              className={`flex items-center space-x-2 space-x-reverse px-5 py-2.5 font-bold text-sm sm:text-base transition-all border-b-2 ${
                activeItemId === 'home'
                  ? isDark
                    ? 'border-blue-500 text-blue-400 bg-slate-900/90 rounded-t-xl'
                    : 'border-[#1565C0] text-[#1565C0] bg-white/60 rounded-t-xl'
                  : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/30 rounded-t-xl'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>

            {/* Active Item Tab (if not home) */}
            {activeItemId !== 'home' && (
              <div
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 font-bold text-sm sm:text-base border-b-2 shadow-sm rounded-t-xl ${
                  isDark
                    ? 'border-blue-500 text-blue-400 bg-slate-900'
                    : 'border-[#1565C0] text-[#1565C0] bg-white'
                }`}
              >
                <span>{currentItem.title}</span>
                <button
                  type="button"
                  onClick={() => setActiveItemId('home')}
                  className={`p-1 rounded-full ${
                    isDark
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                  }`}
                  title="إغلاق التقرير والعودة للرئيسية"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Workspace Body Container */}
          <div
            className={`flex-1 border rounded-2xl shadow-sm mt-3.5 relative overflow-y-auto transition-colors duration-200 ${
              activeItemId === 'home'
                ? 'p-8 lg:p-12 flex flex-col items-center justify-center'
                : 'p-4 sm:p-5 lg:p-6 flex flex-col items-stretch justify-start'
            } ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200'
            }`}
          >
            {activeItemId === 'home' ? (
              /* Home State: Matching Reference Image (Illustration + Message) with scaled proportions */
              <div className="flex flex-col items-center justify-center text-center max-w-xl py-12 select-none animate-fadeIn">
                {/* Clean Vector Illustration - Proportional & Scaled */}
                <div className="w-80 sm:w-96 h-60 sm:h-72 relative flex items-center justify-center mb-8">
                  <svg
                    viewBox="0 0 320 220"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-md"
                  >
                    {/* Background Floor Soft Shadow */}
                    <ellipse
                      cx="160"
                      cy="195"
                      rx="140"
                      ry="14"
                      fill={isDark ? '#020617' : '#E2E8F0'}
                      opacity={isDark ? '0.7' : '0.6'}
                    />

                    {/* Warehouse Building */}
                    {/* Main Building Body */}
                    <rect
                      x="70"
                      y="85"
                      width="160"
                      height="100"
                      rx="3"
                      fill={isDark ? '#1e293b' : '#DBEAFE'}
                      stroke={isDark ? '#334155' : '#BFDBFE'}
                      strokeWidth="1.5"
                    />
                    {/* Triangular Pediment Roof */}
                    <path
                      d="M60 85L150 40L240 85H60Z"
                      fill={isDark ? '#1e3a8a' : '#BFDBFE'}
                      stroke={isDark ? '#2563eb' : '#93C5FD'}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points="150,48 76,85 224,85"
                      fill={isDark ? '#3b82f6' : '#93C5FD'}
                      opacity={isDark ? '0.2' : '0.3'}
                    />

                    {/* Warehouse Front Large Shutter Doors */}
                    <rect
                      x="115"
                      y="115"
                      width="70"
                      height="70"
                      rx="2"
                      fill={isDark ? '#0f172a' : '#94A3B8'}
                      opacity={isDark ? '0.6' : '0.3'}
                    />
                    <line
                      x1="150"
                      y1="115"
                      x2="150"
                      y2="185"
                      stroke={isDark ? '#475569' : '#64748B'}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    <line x1="115" y1="135" x2="185" y2="135" stroke={isDark ? '#475569' : '#64748B'} strokeWidth="1" opacity="0.4" />
                    <line x1="115" y1="155" x2="185" y2="155" stroke={isDark ? '#475569' : '#64748B'} strokeWidth="1" opacity="0.4" />
                    <line x1="115" y1="175" x2="185" y2="175" stroke={isDark ? '#475569' : '#64748B'} strokeWidth="1" opacity="0.4" />

                    {/* Left Window */}
                    <rect
                      x="85"
                      y="105"
                      width="20"
                      height="24"
                      rx="2"
                      fill={isDark ? '#0f172a' : '#FFFFFF'}
                      stroke={isDark ? '#3b82f6' : '#93C5FD'}
                      strokeWidth="1.5"
                    />
                    <line x1="95" y1="105" x2="95" y2="129" stroke={isDark ? '#3b82f6' : '#93C5FD'} strokeWidth="1" />
                    <line x1="85" y1="117" x2="105" y2="117" stroke={isDark ? '#3b82f6' : '#93C5FD'} strokeWidth="1" />

                    {/* Right Window */}
                    <rect
                      x="195"
                      y="105"
                      width="20"
                      height="24"
                      rx="2"
                      fill={isDark ? '#0f172a' : '#FFFFFF'}
                      stroke={isDark ? '#3b82f6' : '#93C5FD'}
                      strokeWidth="1.5"
                    />
                    <line x1="205" y1="105" x2="205" y2="129" stroke={isDark ? '#3b82f6' : '#93C5FD'} strokeWidth="1" />
                    <line x1="195" y1="117" x2="215" y2="117" stroke={isDark ? '#3b82f6' : '#93C5FD'} strokeWidth="1" />

                    {/* Cardboard Boxes in front */}
                    {/* Box 1 (Bottom Left) */}
                    <rect
                      x="55"
                      y="148"
                      width="38"
                      height="36"
                      rx="2"
                      fill={isDark ? '#78350f' : '#E9D5B4'}
                      stroke={isDark ? '#92400e' : '#D1B280'}
                      strokeWidth="1.5"
                    />
                    <line x1="74" y1="148" x2="74" y2="184" stroke={isDark ? '#b45309' : '#C49B5B'} strokeWidth="1.5" strokeDasharray="3 2" />

                    {/* Box 2 (Bottom Middle-Left) */}
                    <rect
                      x="88"
                      y="142"
                      width="40"
                      height="42"
                      rx="2"
                      fill={isDark ? '#854d0e' : '#DFC39B'}
                      stroke={isDark ? '#a16207' : '#C49B5B'}
                      strokeWidth="1.5"
                    />
                    <line x1="108" y1="142" x2="108" y2="184" stroke={isDark ? '#ca8a04' : '#B0833F'} strokeWidth="1.5" strokeDasharray="3 2" />

                    {/* Box 3 (Stacked on Top of Box 1) */}
                    <rect
                      x="68"
                      y="120"
                      width="32"
                      height="30"
                      rx="2"
                      fill={isDark ? '#713f12' : '#E2C9A1'}
                      stroke={isDark ? '#854d0e' : '#C49B5B'}
                      strokeWidth="1.5"
                    />
                    <line x1="84" y1="120" x2="84" y2="150" stroke={isDark ? '#a16207' : '#B0833F'} strokeWidth="1.5" strokeDasharray="3 2" />

                    {/* Clipboard with Checklist (Front Right) */}
                    <g transform="translate(195, 115)">
                      {/* Clipboard Board */}
                      <rect
                        x="0"
                        y="8"
                        width="54"
                        height="74"
                        rx="4"
                        fill={isDark ? '#1e3a8a' : '#BFDBFE'}
                        stroke={isDark ? '#3b82f6' : '#93C5FD'}
                        strokeWidth="1.5"
                      />
                      {/* Clip */}
                      <rect x="18" y="3" width="18" height="10" rx="2" fill={isDark ? '#2563eb' : '#60A5FA'} />
                      <circle cx="27" cy="8" r="2" fill="#FFFFFF" />

                      {/* White / Dark Document Sheet */}
                      <rect x="5" y="15" width="44" height="61" rx="2" fill={isDark ? '#0f172a' : '#FFFFFF'} />

                      {/* Checklist items */}
                      {/* Item 1 */}
                      <rect
                        x="10"
                        y="24"
                        width="7"
                        height="7"
                        rx="1"
                        fill={isDark ? '#1e293b' : '#E2E8F0'}
                        stroke={isDark ? '#3b82f6' : '#93C5FD'}
                        strokeWidth="0.8"
                      />
                      <path d="M12 27.5L13.5 29L16 26" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="21" y1="27.5" x2="42" y2="27.5" stroke={isDark ? '#64748b' : '#94A3B8'} strokeWidth="1.5" strokeLinecap="round" />

                      {/* Item 2 */}
                      <rect
                        x="10"
                        y="38"
                        width="7"
                        height="7"
                        rx="1"
                        fill={isDark ? '#1e293b' : '#E2E8F0'}
                        stroke={isDark ? '#3b82f6' : '#93C5FD'}
                        strokeWidth="0.8"
                      />
                      <path d="M12 41.5L13.5 43L16 40" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="21" y1="41.5" x2="38" y2="41.5" stroke={isDark ? '#64748b' : '#94A3B8'} strokeWidth="1.5" strokeLinecap="round" />

                      {/* Item 3 */}
                      <rect
                        x="10"
                        y="52"
                        width="7"
                        height="7"
                        rx="1"
                        fill={isDark ? '#1e293b' : '#E2E8F0'}
                        stroke={isDark ? '#3b82f6' : '#93C5FD'}
                        strokeWidth="0.8"
                      />
                      <path d="M12 55.5L13.5 57L16 54" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="21" y1="55.5" x2="44" y2="55.5" stroke={isDark ? '#64748b' : '#94A3B8'} strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>

                {/* Subtitle Message */}
                <p
                  className={`font-medium text-lg sm:text-xl leading-relaxed tracking-wide ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  اختر تقريرًا من القائمة لعرض البيانات
                </p>
              </div>
            ) : activeItemId === 'item_balance' ? (
              <ItemBalancesReportView isDark={isDark} onClose={() => setActiveItemId('home')} />
            ) : activeItemId === 'item_card' ? (
              <ItemCardReportView isDark={isDark} onClose={() => setActiveItemId('home')} />
            ) : activeItemId === 'opening_balance' ? (
              <OpeningBalancesReportView isDark={isDark} onClose={() => setActiveItemId('home')} />
            ) : activeItemId === 'inventory_valuation' ? (
              <InventoryValuationReportView isDark={isDark} onClose={() => setActiveItemId('home')} />
            ) : activeItemId === 'stock_transfer' ? (
              <StockTransferView isDark={isDark} onClose={() => setActiveItemId('home')} />
            ) : activeItemId === 'transfer_reports' ? (
              <StockTransferReportsView isDark={isDark} onClose={() => setActiveItemId('home')} />
            ) : activeItemId === 'transfer_issue' ? (
              <StockTransferReportsView isDark={isDark} initialReportType="issue" onClose={() => setActiveItemId('home')} />
            ) : activeItemId === 'transfer_receipt' ? (
              <StockTransferReportsView isDark={isDark} initialReportType="receipt" onClose={() => setActiveItemId('home')} />
            ) : activeItemId === 'pending_transfers' ? (
              <StockTransferReportsView isDark={isDark} initialReportType="pending" onClose={() => setActiveItemId('home')} />
            ) : (
              /* Selected Report Shell View (Navigation Ready for Upcoming Phase) */
              <div className="w-full h-full flex flex-col">
                {/* Header of Active Screen */}
                <div
                  className={`flex items-center justify-between pb-4 mb-6 border-b shrink-0 ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-400 font-semibold mb-1">
                      <span>المخازن</span>
                      <span>/</span>
                      <span className={isDark ? 'text-blue-400' : 'text-[#1565C0]'}>{currentItem.category}</span>
                    </div>
                    <h2
                      className={`text-lg font-bold flex items-center space-x-2 space-x-reverse ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    >
                      <span>{currentItem.title}</span>
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveItemId('home')}
                    className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>العودة للرئيسية</span>
                  </button>
                </div>

                {/* Shell Body Ready for Reports/Operations */}
                <div
                  className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center ${
                    isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                      isDark ? 'bg-blue-950/60 border border-blue-800/60 text-blue-400' : 'bg-blue-50 border border-blue-100 text-[#1565C0]'
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {currentItem.title}
                  </h4>
                  <p className={`text-sm max-w-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    تم تجهيز مساحة العمل وحاوية التنقل بنجاح. سيتم عرض محتوى التقرير والبيانات هنا في المرحلة التالية.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveItemId('home')}
                    className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors shadow-sm ${
                      isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#1565C0] hover:bg-blue-700'
                    }`}
                  >
                    إغلاق التقرير والعودة للرئيسية
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
