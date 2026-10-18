import React from 'react';
import { 
  X, 
  FileText, 
  BarChart3, 
  UserCheck, 
  Users, 
  ShoppingCart 
} from 'lucide-react';

export type SalesNavDestination = 'sales_terminal' | 'reports_integration' | 'balances' | 'customers';

export interface SalesNavigationModalProps {
  isOpen: boolean;
  onClose: (e?: React.MouseEvent) => void;
  onSelectOption: (option: SalesNavDestination) => void;
}

export const SalesNavigationModal: React.FC<SalesNavigationModalProps> = ({
  isOpen,
  onClose,
  onSelectOption
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="sales-navigation-modal-backdrop"
      onClick={(e) => onClose(e)}
      className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fadeIn select-none" 
      dir="rtl"
    >
      <div 
        id="sales-navigation-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-xl sm:max-w-2xl p-6 sm:p-8 shadow-2xl relative border border-slate-200 text-right animate-scaleIn"
      >
        {/* Close Button X (Top Right in RTL) */}
        <button
          id="sales-nav-modal-close-btn"
          type="button"
          onClick={(e) => onClose(e)}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="إغلاق والعودة للواجهة الرئيسية"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
        </button>

        {/* Centered Modal Title */}
        <div className="text-center mb-6 sm:mb-8 pt-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            المبيعات
          </h2>
        </div>

        {/* 4 Symmetrical Cards Grid (2x2 RTL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: البيع ومرتجعاته (Top-Right in RTL) */}
          <button
            id="sales-nav-card-invoicing"
            type="button"
            onClick={() => onSelectOption('sales_terminal')}
            className="w-full min-h-[175px] sm:min-h-[195px] bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group active:scale-[0.98]"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-10 h-10 text-blue-500 stroke-[2.2]" />
            </div>
            {/* Title */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-1.5">
              البيع ومرتجعاته
            </h3>
            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              إدخال فواتير البيع<br />وتسجيل مرتجعات البيع
            </p>
          </button>

          {/* Card 2: التقارير والإحصائيات (Top-Left in RTL) */}
          <button
            id="sales-nav-card-reports"
            type="button"
            onClick={() => onSelectOption('reports_integration')}
            className="w-full min-h-[175px] sm:min-h-[195px] bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group active:scale-[0.98]"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-10 h-10 text-emerald-500 stroke-[2.2]" />
            </div>
            {/* Title */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors mb-1.5">
              التقارير والإحصائيات
            </h3>
            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              تقارير المبيعات<br />والإحصائيات والتحليلات
            </p>
          </button>

          {/* Card 3: أرصدة العملاء وكشف الحساب (Bottom-Right in RTL) */}
          <button
            id="sales-nav-card-balances"
            type="button"
            onClick={() => onSelectOption('balances')}
            className="w-full min-h-[175px] sm:min-h-[195px] bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group active:scale-[0.98]"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UserCheck className="w-10 h-10 text-amber-500 stroke-[2.2]" />
            </div>
            {/* Title */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-1.5">
              أرصدة العملاء وكشف الحساب
            </h3>
            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              عرض أرصدة العملاء<br />وكشف حساب عميل
            </p>
          </button>

          {/* Card 4: بيانات العملاء (Bottom-Left in RTL) */}
          <button
            id="sales-nav-card-customers-master"
            type="button"
            onClick={() => onSelectOption('customers')}
            className="w-full min-h-[175px] sm:min-h-[195px] bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-400 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group active:scale-[0.98]"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10 text-purple-600 stroke-[2.2]" />
            </div>
            {/* Title */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors mb-1.5">
              بيانات العملاء
            </h3>
            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              إدارة بيانات العملاء<br />وتحديث المعلومات
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export interface SalesNavButtonProps {
  onClick: (e?: React.MouseEvent) => void;
  className?: string;
}

export const SalesNavButton: React.FC<SalesNavButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center space-x-2 space-x-reverse px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer ${className}`}
      title="فتح قائمة التنقل للمبيعات"
    >
      <ShoppingCart className="w-4 h-4 text-amber-400" />
      <span>قائمة المبيعات</span>
    </button>
  );
};
