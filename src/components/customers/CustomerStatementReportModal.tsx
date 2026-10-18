import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  customerService, 
  Customer 
} from '../../services/customerService';
import { salesReturnService } from '../../services/salesReturnService';
import { incomeTransactionService } from '../../services/incomeTransactionService';
import { 
  X, 
  Search, 
  Printer, 
  Download, 
  Calendar, 
  Building2, 
  Coins, 
  Users, 
  Receipt, 
  Filter, 
  RefreshCw, 
  ArrowUpDown, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Check, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { SalesNavButton } from '../sales/SalesNavigationModal';

export interface CustomerStatementReportModalProps {
  isOpen: boolean;
  onClose: () => void; // Returns to CustomerBalancesHubModal
  defaultCustomerId?: string;
  onOpenSalesNav?: () => void;
}

export interface StatementLedgerRow {
  id: string;
  index: number;
  date: string;
  docNumber: string;
  docType: string;
  narration: string;
  debit: number;
  credit: number;
  runningBalance: number;
  rawRef?: any;
}

export const CustomerStatementReportModal: React.FC<CustomerStatementReportModalProps> = ({
  isOpen,
  onClose,
  defaultCustomerId,
  onOpenSalesNav
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [branch, setBranch] = useState<string>('all');
  const [currency, setCurrency] = useState<string>('EGP');
  const [periodPreset, setPeriodPreset] = useState<string>('this_month');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Subscribe to income transactions and customer updates so statement refreshes immediately
  useEffect(() => {
    const unsubIncome = incomeTransactionService.subscribe(() => {
      setReloadTrigger(prev => prev + 1);
    });
    const unsubCust = customerService.subscribe(() => {
      setReloadTrigger(prev => prev + 1);
      const all = customerService.getAllCustomers().filter(c => c.status !== 'محذوف' && c.status !== 'deleted');
      setCustomers(all);
    });
    return () => {
      unsubIncome();
      unsubCust();
    };
  }, []);

  // Helper formatters
  const safeToFixed = (val: any): string => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return !isNaN(num) && isFinite(num) ? num.toFixed(2) : '0.00';
  };

  const safeFormatLocale = (val: any): string => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return !isNaN(num) && isFinite(num)
      ? num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';
  };

  // Set default dates on load
  const applyPresetDates = (preset: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    const formatDateStr = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const todayStr = formatDateStr(now);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'this_week') {
      const firstDay = new Date(y, m, d - now.getDay());
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(lastDay));
    } else if (preset === 'this_month') {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(lastDay));
    } else if (preset === 'last_month') {
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(lastDay));
    } else if (preset === 'this_quarter') {
      const quarterStartMonth = Math.floor(m / 3) * 3;
      const firstDay = new Date(y, quarterStartMonth, 1);
      const lastDay = new Date(y, quarterStartMonth + 3, 0);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(lastDay));
    } else if (preset === 'this_year') {
      setFromDate(`${y}-01-01`);
      setToDate(`${y}-12-31`);
    } else if (preset === 'all') {
      setFromDate('2020-01-01');
      setToDate(formatDateStr(now));
    }
  };

  useEffect(() => {
    if (isOpen) {
      const all = customerService.getAllCustomers().filter(c => c.status !== 'محذوف' && c.status !== 'deleted');
      setCustomers(all);
      
      if (defaultCustomerId && all.some(c => c.id === defaultCustomerId || c.code === defaultCustomerId)) {
        const found = all.find(c => c.id === defaultCustomerId || c.code === defaultCustomerId);
        setSelectedCustomerId(found ? found.id : defaultCustomerId);
      } else if (all.length > 0) {
        // Pick first non-cash customer if available, or cash customer
        const firstCreditCust = all.find(c => !c.isSystemCashCustomer) || all[0];
        setSelectedCustomerId(firstCreditCust.id);
      }

      applyPresetDates('this_month');
      setPeriodPreset('this_month');
    }
  }, [isOpen, defaultCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Handle Preset Change
  const handlePeriodPresetChange = (preset: string) => {
    setPeriodPreset(preset);
    if (preset !== 'custom') {
      applyPresetDates(preset);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setBranch('all');
    setCurrency('EGP');
    setPeriodPreset('this_month');
    applyPresetDates('this_month');
    if (customers.length > 0) {
      const first = customers.find(c => !c.isSystemCashCustomer) || customers[0];
      setSelectedCustomerId(first.id);
    }
  };

  // Build Real Customer Movements / Ledger Data
  const { ledgerRows, priorBalance, totalDebit, totalCredit, currentBalance, transactionCount } = useMemo(() => {
    if (!selectedCustomer) {
      return {
        ledgerRows: [],
        priorBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        currentBalance: 0,
        transactionCount: 0
      };
    }

    const allMovements: Array<{
      id: string;
      date: string;
      docNumber: string;
      docType: string;
      narration: string;
      debit: number;
      credit: number;
    }> = [];

    // 1. Opening balance record
    const hasOpeningBal = selectedCustomer.openingBalance && selectedCustomer.openingBalance > 0;
    const isDebitOpening = selectedCustomer.openingBalanceType !== 'دائن' && selectedCustomer.openingBalanceType !== 'credit';
    const opDate = selectedCustomer.openingBalanceDate || String(selectedCustomer.createdAt || '').slice(0, 10) || '2026-01-01';

    if (hasOpeningBal) {
      allMovements.push({
        id: `op-${selectedCustomer.id}`,
        date: opDate,
        docNumber: 'رصيد-01',
        docType: 'رصيد افتتاحي',
        narration: `رصيد أول المدة الافتتاحي المنقول (${isDebitOpening ? 'مدين' : 'دائن'})`,
        debit: isDebitOpening ? (selectedCustomer.openingBalance || 0) : 0,
        credit: !isDebitOpening ? (selectedCustomer.openingBalance || 0) : 0
      });
    }

    // 2. Completed Sales Invoices
    try {
      const rawSales = localStorage.getItem('VERTEX_VGF06_SALES_ENTRY');
      if (rawSales) {
        const parsed = JSON.parse(rawSales);
        const completed = (parsed.completedInvoices || []) as any[];
        
        for (const inv of completed) {
          if (
            inv.status !== 'cancelled' &&
            (
              inv.customerId === selectedCustomer.id ||
              (inv.customerName && inv.customerName === selectedCustomer.name) ||
              (selectedCustomer.code && inv.customerId === selectedCustomer.code)
            )
          ) {
            const invDate = inv.issueDate ? String(inv.issueDate).slice(0, 10) : (inv.createdAt ? String(inv.createdAt).slice(0, 10) : '2026-01-15');
            const gTotal = typeof inv.grandTotal === 'number' ? inv.grandTotal : parseFloat(inv.grandTotal) || 0;
            const cashPart = typeof inv.cashPaid === 'number' ? inv.cashPaid : parseFloat(inv.cashPaid) || 0;
            const cardPart = typeof inv.cardPaid === 'number' ? inv.cardPaid : parseFloat(inv.cardPaid) || 0;
            const deferredPart = inv.deferredPaid !== undefined 
              ? (typeof inv.deferredPaid === 'number' ? inv.deferredPaid : parseFloat(inv.deferredPaid) || 0)
              : (inv.paymentMethod === 'deferred' ? gTotal : 0);

            // In ERP accounting for customer statement:
            // The customer is Debited by the invoice value (Grand Total),
            // and Credited by any immediate payment (Cash / Card paid at pos).
            allMovements.push({
              id: `inv-${inv.id || inv.invoiceNumber || Math.random()}`,
              date: invDate,
              docNumber: inv.invoiceNumber || (inv.id ? `INV-${String(inv.id).slice(0, 6)}` : 'INV-000000'),
              docType: inv.paymentMethod === 'deferred' 
                ? 'فاتورة بيع آجل' 
                : inv.paymentMethod === 'cash' 
                ? 'فاتورة بيع نقدي' 
                : 'فاتورة مبيعات',
              narration: `مبيعات أصناف (${inv.lineItems?.length || 1} صنف)${inv.notes ? ' - ' + inv.notes : ''}`,
              debit: gTotal,
              credit: cashPart + cardPart
            });
          }
        }
      }
    } catch (e) {
      console.error('Error parsing sales invoices for customer statement:', e);
    }

    // 3. Sales Returns
    try {
      const returns = salesReturnService.getAllReturns();
      for (const ret of returns) {
        if (
          ret.status === 'approved' &&
          (
            ret.customerId === selectedCustomer.id ||
            ret.customerName === selectedCustomer.name ||
            (selectedCustomer.code && ret.customerId === selectedCustomer.code)
          )
        ) {
          const retDate = ret.createdAt ? String(ret.createdAt).slice(0, 10) : '2026-01-20';
          allMovements.push({
            id: `ret-${ret.id || ret.returnNumber || Math.random()}`,
            date: retDate,
            docNumber: ret.returnNumber || (ret.id ? `RET-${String(ret.id).slice(0, 6)}` : 'RET-000000'),
            docType: 'مرتجع مبيعات',
            narration: `مرتجع مبيعات عن فاتورة #${ret.originalInvoiceNumber || 'سابق'} (${ret.reason || ''})`,
            debit: 0,
            credit: typeof ret.netReturnTotal === 'number' ? ret.netReturnTotal : parseFloat(ret.netReturnTotal as any) || 0
          });
        }
      }
    } catch (e) {
      console.error('Error fetching sales returns for customer statement:', e);
    }

    // 4. Treasury Income / Disbursement Transactions (وارد وصادر الخزينة)
    try {
      const allTx = incomeTransactionService.getAllTransactions();
      for (const tx of allTx) {
        if (tx.status === 'ملغي') continue;

        const matchingLines: Array<{ amount: number; notes?: string }> = [];
        if (tx.lines && tx.lines.length > 0) {
          for (const l of tx.lines) {
            if (
              (l.accountType === 'customers' || tx.accountType === 'customers') &&
              (
                l.accountId === selectedCustomer.id ||
                (selectedCustomer.code && (l.accountCode === selectedCustomer.code || l.accountId === selectedCustomer.code))
              )
            ) {
              matchingLines.push({ amount: l.amount, notes: l.notes });
            }
          }
        } else if (
          tx.accountType === 'customers' &&
          (
            tx.accountId === selectedCustomer.id ||
            (selectedCustomer.code && (tx.accountCode === selectedCustomer.code || tx.accountId === selectedCustomer.code))
          )
        ) {
          matchingLines.push({ amount: tx.amount, notes: tx.notes });
        }

        for (const m of matchingLines) {
          const txDate = tx.date ? String(tx.date).slice(0, 10) : (tx.createdAt ? String(tx.createdAt).slice(0, 10) : '2026-01-20');
          const isReceipt = tx.type === 'inward'; // وارد خزينة = سند قبض نقدي
          allMovements.push({
            id: `tx-${tx.id}-${Math.random().toString(36).slice(2, 6)}`,
            date: txDate,
            docNumber: tx.documentNumber,
            docType: isReceipt ? 'سند قبض نقدي (وارد خزينة)' : 'سند صرف نقدي (صادر خزينة)',
            narration: m.notes || tx.notes || (isReceipt ? `سند قبض نقدي - توريد إلى خزينة [${tx.treasuryName}]` : `سند صرف نقدي - صرف من خزينة [${tx.treasuryName}]`),
            debit: isReceipt ? 0 : m.amount,
            credit: isReceipt ? m.amount : 0
          });
        }
      }
    } catch (e) {
      console.error('Error fetching income transactions for customer statement:', e);
    }

    // 5. If customer has a seed balanceDue but no other movements recorded yet, add seed movement
    if (allMovements.length === 0 && selectedCustomer.balanceDue && selectedCustomer.balanceDue > 0) {
      allMovements.push({
        id: `seed-${selectedCustomer.id}`,
        date: selectedCustomer.createdAt ? String(selectedCustomer.createdAt).slice(0, 10) : '2026-01-01',
        docNumber: 'OP-BAL-001',
        docType: 'رصيد دفتري سابق',
        narration: 'رصيد مديونية مستحق دفترياً على حساب العميل',
        debit: selectedCustomer.balanceDue,
        credit: 0
      });
    }

    // Sort movements chronologically using string comparison for YYYY-MM-DD
    allMovements.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Filter by Date Range and calculate Prior Balance
    let priorBal = 0;
    const periodMovements: typeof allMovements = [];

    for (const mov of allMovements) {
      const movDate = mov.date || '';
      if (fromDate && movDate < fromDate) {
        priorBal += (mov.debit - mov.credit);
      } else if (!toDate || movDate <= toDate) {
        periodMovements.push(mov);
      }
    }

    // Build rows with running cumulative balance
    let running = priorBal;
    let sumDebit = 0;
    let sumCredit = 0;

    const rows: StatementLedgerRow[] = periodMovements.map((mov, idx) => {
      running += (mov.debit - mov.credit);
      sumDebit += mov.debit;
      sumCredit += mov.credit;

      return {
        id: mov.id,
        index: idx + 1,
        date: mov.date,
        docNumber: mov.docNumber,
        docType: mov.docType,
        narration: mov.narration,
        debit: mov.debit,
        credit: mov.credit,
        runningBalance: running
      };
    });

    const finalBalance = priorBal + sumDebit - sumCredit;

    return {
      ledgerRows: rows,
      priorBalance: priorBal,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
      currentBalance: finalBalance,
      transactionCount: rows.length
    };
  }, [selectedCustomer, fromDate, toDate, reloadTrigger]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!selectedCustomer) return;
    
    let csv = `\uFEFFتقرير كشف حساب عميل\n`;
    csv += `اسم العميل:,${selectedCustomer.name},كود العميل:,${selectedCustomer.code}\n`;
    csv += `الفترة من:,${fromDate},إلى:,${toDate},العملة:,${currency}\n\n`;
    csv += `#,التاريخ,رقم المستند,نوع الحركة,البيان,مدين,دائن,الرصيد\n`;

    if (priorBalance !== 0) {
      csv += `-,${fromDate},-,رصيد ما قبل الفترة,الرصيد الافتتاحي السابق,${priorBalance > 0 ? priorBalance.toFixed(2) : '0.00'},${priorBalance < 0 ? Math.abs(priorBalance).toFixed(2) : '0.00'},${priorBalance.toFixed(2)}\n`;
    }

    ledgerRows.forEach((r) => {
      csv += `${r.index},${r.date},${r.docNumber},${r.docType},"${r.narration.replace(/"/g, '""')}",${r.debit.toFixed(2)},${r.credit.toFixed(2)},${r.runningBalance.toFixed(2)}\n`;
    });

    csv += `\n,,,,,إجمالي المدين:,${totalDebit.toFixed(2)},إجمالي الدائن:,${totalCredit.toFixed(2)},الرصيد النهائي:,${currentBalance.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_حساب_${selectedCustomer.name.replace(/\s+/g, '_')}_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print-bg animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-7xl shadow-2xl dir-rtl text-right flex flex-col max-h-[95vh] overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  كشف حساب عميل
                </h2>
                {selectedCustomer && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {selectedCustomer.code || selectedCustomer.id || ''} - {selectedCustomer.name || ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                تفاصيل حركة حساب العميل خلال الفترة المحددة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-sm"
              title="طباعة كشف الحساب"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">طباعة التقرير</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200 shadow-sm"
              title="تصدير ملف Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ml-1"
              title="إغلاق التقرير والعودة لنافذة أرصدة العملاء وكشف الحساب"
            >
              <X className="w-4 h-4 text-slate-300" />
              <span>إغلاق التقرير</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout: Right Filters Panel + Left Report Area */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-100/60">
          
          {/* RIGHT PANEL: Report Filters (بيانات التقرير) */}
          <div className="w-full lg:w-80 bg-white border-l border-slate-200 p-4 sm:p-5 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar shadow-sm">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-1.5 space-x-reverse text-slate-900 font-black text-sm">
                  <Filter className="w-4 h-4 text-amber-500" />
                  <span>بيانات التقرير</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-slate-400 hover:text-amber-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="إعادة تعيين كافة الفلاتر"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>مسح الفلاتر</span>
                </button>
              </div>

              {/* 1. الفرع */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>الفرع</span>
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">كل الفروع</option>
                  <option value="main">الفرع الرئيسي - الإدارة</option>
                  <option value="retail">فرع مبيعات التجزئة</option>
                  <option value="wholesale">فرع الجملة والتوزيع</option>
                </select>
              </div>

              {/* 2. العملة */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-slate-400" />
                  <span>العملة</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="EGP">جنيه مصري (EGP)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                </select>
              </div>

              {/* 3. العميل */}
              <div className="space-y-1 relative">
                <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>العميل</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">({customers.length} عميل)</span>
                </label>
                
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code || c.id} - {c.name || 'بدون اسم'} {c.isSystemCashCustomer ? '(نقدي)' : ''}
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>الفئة:</span>
                      <span className="font-bold text-slate-700">{selectedCustomer.category || 'Retail'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>سقف الائتمان:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {selectedCustomer.creditLimit ? `$${safeFormatLocale(selectedCustomer.creditLimit)}` : 'بدون سقف'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. الفترة */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>الفترة</span>
                </label>
                <select
                  value={periodPreset}
                  onChange={(e) => handlePeriodPresetChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="this_month">هذا الشهر</option>
                  <option value="today">اليوم</option>
                  <option value="this_week">هذا الأسبوع</option>
                  <option value="last_month">الشهر السابق</option>
                  <option value="this_quarter">الربع المالي الحالي</option>
                  <option value="this_year">منذ بداية العام الحالي</option>
                  <option value="all">كل الفترات التاريخية</option>
                  <option value="custom">فترة مخصصة</option>
                </select>
              </div>

              {/* 5. من تاريخ */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">من تاريخ</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>

              {/* 6. إلى تاريخ */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">إلى تاريخ</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Action Buttons in Filters Panel */}
            <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  // Re-evaluate query triggers automatically via reactive memo
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>عرض التقرير</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>مسح الفلاتر</span>
              </button>
            </div>
          </div>

          {/* LEFT MAIN AREA: Report Presentation */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
            
            {/* Customer Information Card */}
            {selectedCustomer ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0 font-bold font-mono text-base">
                    {String(selectedCustomer.code || selectedCustomer.id || '000').slice(-3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {selectedCustomer.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        كود: {selectedCustomer.code || selectedCustomer.id}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>رقم الهاتف: <strong className="font-mono text-slate-700">{selectedCustomer.mobile || 'غير مسجل'}</strong></span>
                      <span>المنطقة: <strong className="text-slate-700">{selectedCustomer.area || 'الفرع الرئيسي'}</strong></span>
                      <span>مندوب البيع: <strong className="text-slate-700">{selectedCustomer.assignedSeller || 'الكل'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status and Credit badge */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-400 font-medium">حالة الائتمان</span>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedCustomer.allowCreditSales ? 'مسموح بالبيع الآجل' : 'نقدي فقط'}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
                    currentBalance > 0 
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : currentBalance < 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {currentBalance > 0 ? 'رصيد مدين (مستحق)' : currentBalance < 0 ? 'رصيد دائن (له)' : 'متزن (0.00)'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-700">يرجى اختيار عميل من لوحة الفلاتر لعرض كشف الحساب</p>
              </div>
            )}

            {/* 4 SUMMARY CARDS AT TOP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. إجمالي المدين */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">إجمالي المدين (عليه)</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-blue-600">
                  ${safeFormatLocale(totalDebit)}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">مجموع الفواتير والحركات المدينة</p>
              </div>

              {/* 2. إجمالي الدائن */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">إجمالي الدائن (سدادات)</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
                  ${safeFormatLocale(totalCredit)}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">مجموع السدادات والمردودات</p>
              </div>

              {/* 3. الرصيد الحالي */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">الرصيد الحالي الصافي</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-xl sm:text-2xl font-black font-mono ${
                  currentBalance > 0 ? 'text-rose-600' : currentBalance < 0 ? 'text-emerald-600' : 'text-slate-800'
                }`}>
                  ${safeFormatLocale(Math.abs(currentBalance))}
                  <span className="text-xs font-sans font-bold mr-1.5">
                    {currentBalance > 0 ? '(مدين)' : currentBalance < 0 ? '(دائن)' : ''}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">الرصيد التراكمي المستحق حتى تاريخه</p>
              </div>

              {/* 4. عدد الحركات */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">عدد الحركات</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-purple-600">
                  {transactionCount}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">عمليات مالية خلال الفترة</p>
              </div>
            </div>

            {/* TRANSACTIONS TABLE (تفاصيل الحركات) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Receipt className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    تفاصيل الحركات
                  </h3>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {ledgerRows.length} حركة مسجلة
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  الفترة: من <strong className="font-mono text-slate-700">{fromDate || 'البداية'}</strong> إلى <strong className="font-mono text-slate-700">{toDate || 'النهاية'}</strong>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right border-collapse text-xs table-auto">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-3 font-mono w-24">التاريخ</th>
                      <th className="py-3 px-3 font-mono w-28">رقم المستند</th>
                      <th className="py-3 px-3 w-32">نوع الحركة</th>
                      <th className="py-3 px-4 min-w-[220px]">البيان</th>
                      <th className="py-3 px-3 font-mono text-blue-700 w-28">مدين (+)</th>
                      <th className="py-3 px-3 font-mono text-emerald-700 w-28">دائن (-)</th>
                      <th className="py-3 px-3 font-mono text-slate-900 w-32 text-left pl-4">الرصيد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {/* Prior Balance Row if exists */}
                    {priorBalance !== 0 && (
                      <tr className="bg-amber-50/40 text-slate-700 font-semibold italic">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">-</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{fromDate}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">رصيد سابق</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            رصيد ما قبل الفترة
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          الرصيد التراكمي المنقول من الفترات السابقة
                        </td>
                        <td className="py-2.5 px-3 font-mono text-blue-700">
                          {priorBalance > 0 ? `$${safeToFixed(priorBalance)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700">
                          {priorBalance < 0 ? `$${safeToFixed(Math.abs(priorBalance))}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-left pl-4">
                          ${safeToFixed(priorBalance)}
                        </td>
                      </tr>
                    )}

                    {/* Ledger Rows */}
                    {ledgerRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Receipt className="w-8 h-8 text-slate-300" />
                            <p className="text-sm font-bold text-slate-600">لا توجد حركات مالية مسجلة لهذا العميل خلال الفترة المحددة.</p>
                            <p className="text-xs text-slate-400">يمكنك تغيير الفترة الزمنية من لوحة الفلاتر لعرض فترات أوسع.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      ledgerRows.map((row) => (
                        <tr 
                          key={row.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">
                            {row.index}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-600 whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-700 whitespace-nowrap">
                            {row.docNumber}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.docType.includes('مرتجع')
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : row.docType.includes('آجل')
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : row.docType.includes('افتتاحي')
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {row.docType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {row.narration}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">
                            {row.debit > 0 ? `$${safeToFixed(row.debit)}` : '-'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                            {row.credit > 0 ? `$${safeToFixed(row.credit)}` : '-'}
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-slate-900 text-left pl-4">
                            ${safeToFixed(row.runningBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Table Footer Totals */}
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800 text-xs">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 text-right">
                        الإجمالي الصافي لحركات الفترة:
                      </td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-black">
                        ${safeToFixed(totalDebit)}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-700 font-black">
                        ${safeToFixed(totalCredit)}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-slate-950 text-left pl-4 text-sm">
                        ${safeToFixed(currentBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span>تقرير رسمي معتمد من منصة فيرتكس ERP</span>
            <span className="font-mono">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            الرجوع إلى أرصدة العملاء
          </button>
        </div>
      </div>
    </div>
  );
};
