import React, { useState } from 'react';
import { 
  ShoppingBag, 
  RotateCcw,
  Scale,
  Receipt,
  Building2,
  FileText,
  BarChart3,
  LogOut,
  Layers,
  Sparkles
} from 'lucide-react';
import { PlatformSection } from '../../types';
import { VendorMasterView } from '../vendors/VendorMasterView';
import { PurchaseInvoiceView } from './PurchaseInvoiceView';
import { VendorStatementReportView } from '../vendors/VendorStatementReportView';

interface PurchasesModuleViewProps {
  onClose: () => void;
  onNavigateSection?: (section: PlatformSection) => void;
}

export const PurchasesModuleView: React.FC<PurchasesModuleViewProps> = ({
  onClose,
  onNavigateSection
}) => {
  const [activeSlot, setActiveSlot] = useState<number>(1);

  // Exact 7 named branches in order
  const purchaseBranches = [
    { id: 1, label: '1. فاتورة شراء', icon: ShoppingBag, isImplemented: true },
    { id: 2, label: '2. مرتجعات المشتريات', icon: RotateCcw, isImplemented: false },
    { id: 3, label: '3. أرصدة الموردين', icon: Scale, isImplemented: false },
    { id: 4, label: '4. كشف حساب مورد', icon: Receipt, isImplemented: true },
    { id: 5, label: '5. بيانات الموردين', icon: Building2, isImplemented: true },
    { id: 6, label: '6. تقارير المشتريات', icon: FileText, isImplemented: false },
    { id: 7, label: '7. إحصائيات المشتريات', icon: BarChart3, isImplemented: false },
  ];

  const currentBranch = purchaseBranches.find(b => b.id === activeSlot) || purchaseBranches[0];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h1 className="text-base font-black text-slate-100">نظام المشتريات</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                {currentBranch.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              قائمة المشتريات الجانبية المستقلة - جاهزة لربط وبناء الوظائف زرًا زرًا
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center space-x-2 space-x-reverse px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>العودة للرئيسية</span>
        </button>
      </div>

      {/* PURCHASES MODULE SHELL: PERSISTENT PURCHASES SIDEBAR ON RIGHT + MAIN CONTENT AREA ON LEFT */}
      <div className="flex flex-col lg:flex-row gap-4 items-start" dir="rtl">
        {/* Right: Persistent Purchases Sidebar (Identical size, shape, spacing, order & slot count to Sales Sidebar) */}
        <aside className="w-full lg:w-48 xl:w-52 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl shrink-0 space-y-2 sticky top-4 select-none" dir="rtl">
          {/* Sidebar Header */}
          <div className="px-2 py-2 border-b border-slate-800 flex items-center space-x-2 space-x-reverse">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-black text-slate-100">المشتريات</h2>
            </div>
          </div>

          {/* 7 Named Navigation Items in exact order */}
          <nav className="space-y-1 pt-0.5">
            {purchaseBranches.map((branch) => {
              const isActive = activeSlot === branch.id;
              const IconComponent = branch.icon;
              return (
                <button
                  key={branch.id}
                  id={`purchases-sidebar-nav-slot-${branch.id}`}
                  type="button"
                  onClick={() => setActiveSlot(branch.id)}
                  className={`w-full flex items-center space-x-2 space-x-reverse px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20 font-black border border-orange-400'
                      : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-orange-300 border border-slate-800/80'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-orange-400'}`} />
                  <span className="whitespace-nowrap">{branch.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Exit to Main Interface Button */}
          <div className="pt-2 border-t border-slate-800">
            <button
              id="purchases-sidebar-exit-btn"
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-2 py-2 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm whitespace-nowrap"
              title="الخروج من المشتريات والعودة للواجهة الرئيسية"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>الخروج للرئيسية</span>
            </button>
          </div>
        </aside>

        {/* Left: Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Branch 1: Purchase Invoice Screen */}
          {activeSlot === 1 && (
            <div className="animate-fade-in">
              <PurchaseInvoiceView
                onClose={onClose}
                onNavigateSection={onNavigateSection}
                onOpenVendorMaster={() => setActiveSlot(5)}
              />
            </div>
          )}

          {/* Branch 4: Vendor Statement of Account */}
          {activeSlot === 4 && (
            <div className="animate-fade-in">
              <VendorStatementReportView />
            </div>
          )}

          {/* Branch 5: Existing Active VendorMasterView directly linked without changes */}
          {activeSlot === 5 && (
            <div className="animate-fade-in">
              <VendorMasterView
                onClose={() => setActiveSlot(1)}
                onNavigateSection={onNavigateSection}
              />
            </div>
          )}

          {/* Placeholder state for remaining branches (2, 3, 6, 7) */}
          {activeSlot !== 1 && activeSlot !== 4 && activeSlot !== 5 && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[480px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4 shadow-inner">
                <Layers className="w-8 h-8 opacity-80" />
              </div>
              <h3 className="text-base font-black text-slate-100 mb-2">
                {currentBranch.label}
              </h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                هذا الفرع محجوز كـ Placeholder في شريط المشتريات وجاهز للتنفيذ والربط الوظيفي في المراحل القادمة زرًا زرًا.
              </p>
              <div className="flex items-center space-x-2 space-x-reverse text-[11px] font-mono text-slate-500 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>جاهز للبرمجة لاحقاً</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
