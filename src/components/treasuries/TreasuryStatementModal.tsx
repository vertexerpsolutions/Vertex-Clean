import React, { useState } from 'react';
import { 
  treasuryService, 
  Treasury, 
  TreasuryTransaction 
} from '../../services/treasuryService';
import { 
  Vault, 
  X, 
  Printer, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  Building2, 
  FileText, 
  DollarSign, 
  CreditCard,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export interface TreasuryStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasury: Treasury | null;
}

export const TreasuryStatementModal: React.FC<TreasuryStatementModalProps> = ({
  isOpen,
  onClose,
  treasury
}) => {
  const [filterDirection, setFilterDirection] = useState<'all' | 'in' | 'out'>('all');

  if (!isOpen || !treasury) return null;

  const transactions: TreasuryTransaction[] = treasuryService.getTreasuryTransactions(treasury.id);
  const currentBalance = treasuryService.getTreasuryBalance(treasury.id);

  const filteredTransactions = transactions.filter(tx => {
    if (filterDirection === 'all') return true;
    return tx.direction === filterDirection;
  });

  const totalIn = transactions.filter(t => t.direction === 'in').reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.direction === 'out').reduce((sum, t) => sum + t.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-['Cairo',sans-serif]" dir="rtl">
      <div className="bg-[#090d16] border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="text-base font-black text-slate-100">
                  كشف حركة الخزينة النقدية: {treasury.name}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  {treasury.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2 space-x-reverse mt-0.5">
                <span>الفرع: {treasury.branchName}</span>
                <span>•</span>
                <span>العملة: {treasury.currency}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الكشف</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SUMMARY STATS BAR */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[11px] mb-1">الرصيد الافتتاحي</span>
            <span className="text-slate-200 font-mono font-bold text-sm">
              {treasury.openingBalance.toLocaleString()} {treasury.currency.split(' ')[0]}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              تاريخ: {treasury.openingBalanceDate || 'غير محدد'}
            </span>
          </div>

          <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20 flex flex-col">
            <span className="text-emerald-400 text-[11px] mb-1 flex items-center space-x-1 space-x-reverse">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>إجمالي المقبوضات (وارد)</span>
            </span>
            <span className="text-emerald-400 font-mono font-bold text-sm">
              +{totalIn.toLocaleString()} {treasury.currency.split(' ')[0]}
            </span>
            <span className="text-[10px] text-emerald-400 mt-0.5">
              {transactions.filter(t => t.direction === 'in').length} عمليات واردة
            </span>
          </div>

          <div className="bg-rose-500/5 p-3 rounded-2xl border border-rose-500/20 flex flex-col">
            <span className="text-rose-400 text-[11px] mb-1 flex items-center space-x-1 space-x-reverse">
              <TrendingDown className="w-3 h-3 text-rose-400" />
              <span>إجمالي المدفوعات (منصرف)</span>
            </span>
            <span className="text-rose-400 font-mono font-bold text-sm">
              -{totalOut.toLocaleString()} {treasury.currency.split(' ')[0]}
            </span>
            <span className="text-[10px] text-rose-400 mt-0.5">
              {transactions.filter(t => t.direction === 'out').length} عمليات منصرفة
            </span>
          </div>

          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 flex flex-col">
            <span className="text-amber-300 text-[11px] mb-1 font-semibold">الرصيد الفعلي الحالي</span>
            <span className="text-amber-400 font-mono font-black text-base">
              {currentBalance.toLocaleString()} {treasury.currency.split(' ')[0]}
            </span>
            <span className="text-[10px] text-amber-400 mt-0.5">
              رصيد السيولة الجاهزة
            </span>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse text-xs">
            <span className="text-slate-400 font-semibold">تصفية الحركات:</span>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterDirection('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterDirection === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDirection('in')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterDirection === 'in'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                مقبوضات واردة
              </button>
              <button
                type="button"
                onClick={() => setFilterDirection('out')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterDirection === 'out'
                    ? 'bg-rose-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                مدفوعات صادرة
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredTransactions.length} حركة مطابقة
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">لا توجد حركات مسجلة لهذه الخزينة</p>
              <p className="text-xs text-slate-400">سيتم تسجيل الحركات تلقائياً عند إجراء مبيعات نقدية أو سندات قبض وسداد.</p>
            </div>
          ) : (
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/40">
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">رقم المستند / المرجع</th>
                  <th className="p-3">البيان والشرح</th>
                  <th className="p-3">القائم بالعملية</th>
                  <th className="p-3 text-left">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredTransactions.map(tx => {
                  const isIn = tx.direction === 'in';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-slate-300">{tx.date}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center space-x-1 space-x-reverse px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          isIn 
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}>
                          {isIn ? <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> : <ArrowUpRight className="w-3 h-3 text-rose-400" />}
                          <span>{tx.typeLabel}</span>
                        </span>
                      </td>
                      <td className="p-3 font-mono text-amber-300 font-bold">{tx.referenceNumber}</td>
                      <td className="p-3 text-slate-200">{tx.description}</td>
                      <td className="p-3 text-slate-400">{tx.performedBy}</td>
                      <td className={`p-3 text-left font-mono font-bold text-sm ${isIn ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIn ? '+' : '-'}{tx.amount.toLocaleString()} {treasury.currency.split(' ')[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            * يتم حساب الأرصدة والحركات بصورة فورية بناءً على قيود دفاتر الأستاذ العام وحركات المبيعات والتحصيل الفعلية.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-all"
          >
            إغلاق الكشف
          </button>
        </div>

      </div>
    </div>
  );
};
