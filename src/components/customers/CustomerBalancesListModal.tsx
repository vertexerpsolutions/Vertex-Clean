import React, { useState, useEffect } from 'react';
import { 
  customerService, 
  Customer 
} from '../../services/customerService';
import { priceTierService, PriceTier } from '../../services/priceTierService';
import { resolvePriceTierCode, getCategoryDisplayName } from './CustomerMasterView';
import { 
  X, 
  Search, 
  Wallet, 
  Users, 
  Printer, 
  Filter, 
  CreditCard, 
  Receipt, 
  ChevronLeft, 
  Scale, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { SalesNavButton } from '../sales/SalesNavigationModal';

export interface CustomerBalancesListModalProps {
  isOpen: boolean;
  onClose: () => void; // Returns to CustomerBalancesHubModal
  onSelectCustomerForStatement: (customerId: string) => void; // Opens statement for that customer
  onOpenSalesNav?: () => void;
}

export const CustomerBalancesListModal: React.FC<CustomerBalancesListModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomerForStatement,
  onOpenSalesNav
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');

  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(() => priceTierService.getAllTiers());

  const refreshList = () => {
    const list = customerService.getAllCustomers().filter(c => c.status !== 'محذوف' && c.status !== 'deleted');
    setCustomers(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setPriceTiers(priceTierService.getAllTiers());
      setSearchQuery('');
      setCategoryFilter('all');
      setBalanceFilter('all');
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = priceTierService.subscribe(() => {
      setPriceTiers(priceTierService.getAllTiers());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = c.code?.toLowerCase().includes(q);
      const matchName = c.name?.toLowerCase().includes(q);
      const matchMobile = c.mobile?.includes(q);
      if (!matchCode && !matchName && !matchMobile) return false;
    }

    if (categoryFilter !== 'all') {
      const resolved = resolvePriceTierCode(c.category, priceTiers);
      if (resolved !== categoryFilter && c.category !== categoryFilter) {
        return false;
      }
    }

    const calc = customerService.getCustomerActualBalance(c);
    if (balanceFilter === 'has_debt' && calc.actualBalance <= 0) return false;
    if (balanceFilter === 'zero_balance' && calc.actualBalance !== 0) return false;
    if (balanceFilter === 'credit_exceeded' && !calc.isLimitExceeded) return false;

    return true;
  });

  const totalOutstandingSum = customers.reduce((acc, c) => {
    const calc = customerService.getCustomerActualBalance(c);
    return acc + Math.max(0, calc.actualBalance);
  }, 0);

  const totalCreditLimitSum = customers.reduce((acc, c) => acc + (c.creditLimit || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-7xl shadow-2xl dir-rtl text-right flex flex-col max-h-[92vh] overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  أرصدة العملاء والمديونيات
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {filteredCustomers.length} عميل
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                عرض شامل لأرصدة العملاء، المدين والدائن، وسقوف الائتمان المتاحة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">طباعة الأرصدة</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ml-1"
            >
              <X className="w-4 h-4 text-slate-300" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-slate-100/50">
          
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">إجمالي المديونيات القائمة</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 mt-1">
                  ${totalOutstandingSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">إجمالي سقوف الائتمان الممنوحة</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-blue-600 mt-1">
                  ${totalCreditLimitSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">عدد العملاء النشطين</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 mt-1">
                  {customers.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث بالاسم، الكود، أو الهاتف..."
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-500 font-bold">الفئة:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">كل الفئات</option>
                  {priceTiers.map((tier) => (
                    <option key={tier.id} value={tier.code}>
                      {tier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-500 font-bold">حالة الرصيد:</span>
                <select
                  value={balanceFilter}
                  onChange={(e) => setBalanceFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">الكل</option>
                  <option value="has_debt">عليهم مديونية فقط</option>
                  <option value="zero_balance">رصيد صفري</option>
                  <option value="credit_exceeded">تجاوزوا حد الائتمان</option>
                </select>
              </div>
            </div>
          </div>

          {/* Balances Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right border-collapse text-xs table-auto">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="py-3 px-3.5 font-mono w-24">كود العميل</th>
                    <th className="py-3 px-3.5 min-w-[200px]">اسم العميل</th>
                    <th className="py-3 px-3 w-28">الفئة</th>
                    <th className="py-3 px-3 font-mono w-28">رصيد أول المدة</th>
                    <th className="py-3 px-3 font-mono text-blue-700 w-28">حركات الفترة</th>
                    <th className="py-3 px-3 font-mono text-rose-700 w-32">الرصيد الفعلي الحالي</th>
                    <th className="py-3 px-3 font-mono w-28">سقف الائتمان</th>
                    <th className="py-3 px-3.5 text-center w-32">الإجراء المباشر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-bold text-sm">
                        لا توجد سجلات عملاء تطابق معايير البحث الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const calc = customerService.getCustomerActualBalance(cust);
                      const isLimitOver = calc.isLimitExceeded;

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-600 whitespace-nowrap">
                            {cust.code}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 text-sm">
                              {cust.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {cust.mobile || 'بدون هاتف'}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {getCategoryDisplayName(cust.category, priceTiers)}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 font-semibold">
                            ${(cust.openingBalance || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-mono text-blue-600 font-semibold">
                            ${calc.statementDebt.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-sm">
                            <span className={calc.actualBalance > 0 ? 'text-rose-600' : 'text-slate-800'}>
                              ${calc.actualBalance.toFixed(2)}
                            </span>
                            {isLimitOver && (
                              <span className="mr-1.5 px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>تجاوز الحد</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 font-semibold">
                            {cust.creditLimit ? `$${cust.creditLimit.toLocaleString()}` : 'بدون سقف'}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => onSelectCustomerForStatement(cust.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                            >
                              <Receipt className="w-3.5 h-3.5 text-amber-600" />
                              <span>كشف الحساب</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>نظام فيرتكس لإدارة أرصدة العملاء وحسابات الذمم</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            الرجوع إلى الخيارات الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
