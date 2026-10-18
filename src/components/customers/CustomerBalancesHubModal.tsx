import React from 'react';
import { 
  FileSpreadsheet, 
  Wallet, 
  X, 
  UserCheck, 
  ChevronLeft,
  Receipt,
  Users
} from 'lucide-react';
import { SalesNavButton } from '../sales/SalesNavigationModal';

export interface CustomerBalancesHubModalProps {
  isOpen: boolean;
  onClose: () => void; // Returns to Sales 4-cards modal
  onOpenStatementReport: () => void; // Opens Customer Account Statement
  onOpenBalancesList: () => void; // Opens Customer Balances List
  onOpenSalesNav?: () => void; // Opens Sales Nav 4-cards modal directly
}

export const CustomerBalancesHubModal: React.FC<CustomerBalancesHubModalProps> = ({
  isOpen,
  onClose,
  onOpenStatementReport,
  onOpenBalancesList,
  onOpenSalesNav
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 no-print animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl dir-rtl text-right flex flex-col overflow-hidden font-sans transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <UserCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                أرصدة العملاء وكشف الحساب
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                اختر نوع التقرير المالي أو كشف الحساب المطلوب عرضه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer"
            title="إغلاق والعودة لقائمة المبيعات"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: The 2 Main Cards */}
        <div className="p-6 sm:p-8 bg-slate-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Card 1: كشف حساب عميل */}
            <button
              id="hub-card-customer-statement"
              type="button"
              onClick={onOpenStatementReport}
              className="w-full bg-white hover:bg-gradient-to-br hover:from-white hover:to-amber-50/40 border-2 border-slate-200 hover:border-amber-500/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all text-amber-600">
                <Receipt className="w-8 h-8 stroke-[2.2]" />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-1.5">
                كشف حساب عميل
              </h3>
              
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 min-h-[32px]">
                عرض حركة حساب العميل بالتفصيل مع الفترات والمدين والدائن
              </p>

              <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 group-hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60">
                <span>فتح كشف الحساب</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </div>
            </button>

            {/* Card 2: أرصدة العملاء */}
            <button
              id="hub-card-customer-balances"
              type="button"
              onClick={onOpenBalancesList}
              className="w-full bg-white hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/40 border-2 border-slate-200 hover:border-emerald-500/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all text-emerald-600">
                <Wallet className="w-8 h-8 stroke-[2.2]" />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors mb-1.5">
                أرصدة العملاء
              </h3>
              
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 min-h-[32px]">
                عرض أرصدة العملاء والمدين والدائن وحدود الائتمان
              </p>

              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60">
                <span>عرض قائمة الأرصدة</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>نظام فيرتكس لإدارة الحسابات والمبيعات</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            رجوع لقائمة المبيعات
          </button>
        </div>
      </div>
    </div>
  );
};
