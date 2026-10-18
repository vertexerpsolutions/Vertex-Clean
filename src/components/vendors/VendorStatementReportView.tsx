import React, { useState, useEffect, useMemo } from 'react';
import { 
  vendorService, 
  Vendor 
} from '../../services/vendorService';
import { incomeTransactionService } from '../../services/incomeTransactionService';
import { 
  X, 
  Search, 
  Printer, 
  Download, 
  Calendar, 
  Building2, 
  Coins, 
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
  AlertCircle,
  ChevronDown
} from 'lucide-react';

export interface VendorStatementReportViewProps {
  defaultVendorId?: string;
  onClose?: () => void;
  isModalMode?: boolean;
}

export interface VendorStatementLedgerRow {
  id: string;
  index: number;
  date: string;
  docNumber: string;
  docType: string;
  narration: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export const VendorStatementReportView: React.FC<VendorStatementReportViewProps> = ({
  defaultVendorId,
  onClose,
  isModalMode = false
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [currency, setCurrency] = useState<string>('EGP');
  const [periodPreset, setPeriodPreset] = useState<string>('this_month');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [vendorSearchQuery, setVendorSearchQuery] = useState<string>('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Subscribe to updates so statement refreshes immediately
  useEffect(() => {
    const unsubIncome = incomeTransactionService.subscribe(() => {
      setReloadTrigger(prev => prev + 1);
    });
    const unsubVend = vendorService.subscribe(() => {
      setReloadTrigger(prev => prev + 1);
      const all = vendorService.getAllVendors().filter(v => v.status !== 'محذوف' && v.status !== 'deleted');
      setVendors(all);
    });
    return () => {
      unsubIncome();
      unsubVend();
    };
  }, []);

  // Helper formatters
  const safeFormatLocale = (val: any): string => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return !isNaN(num) && isFinite(num)
      ? num.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';
  };

  // Preset Dates Helper
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
    } else if (preset === 'this_month') {
      setFromDate(`${y}-${String(m + 1).padStart(2, '0')}-01`);
      const lastDay = new Date(y, m + 1, 0).getDate();
      setToDate(`${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'prev_month') {
      const prevM = m === 0 ? 11 : m - 1;
      const prevY = m === 0 ? y - 1 : y;
      setFromDate(`${prevY}-${String(prevM + 1).padStart(2, '0')}-01`);
      const lastDay = new Date(prevY, prevM + 1, 0).getDate();
      setToDate(`${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'this_year') {
      setFromDate(`${y}-01-01`);
      setToDate(`${y}-12-31`);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  // Initialize Vendors
  useEffect(() => {
    const all = vendorService.getAllVendors().filter(v => v.status !== 'محذوف' && v.status !== 'deleted');
    setVendors(all);

    if (defaultVendorId && all.some(v => v.id === defaultVendorId || v.code === defaultVendorId)) {
      const found = all.find(v => v.id === defaultVendorId || v.code === defaultVendorId);
      setSelectedVendorId(found ? found.id : defaultVendorId);
    } else if (all.length > 0) {
      const firstNonCash = all.find(v => !v.isSystemCashVendor) || all[0];
      setSelectedVendorId(firstNonCash.id);
    }

    applyPresetDates('this_month');
    setPeriodPreset('this_month');
  }, [defaultVendorId]);

  const selectedVendor = useMemo(() => {
    return vendors.find(v => v.id === selectedVendorId);
  }, [vendors, selectedVendorId]);

  const handlePeriodPresetChange = (preset: string) => {
    setPeriodPreset(preset);
    if (preset !== 'custom') {
      applyPresetDates(preset);
    }
  };

  // Build Real Vendor Movements / Ledger Data
  const { ledgerRows, priorBalance, totalDebit, totalCredit, currentBalance, transactionCount } = useMemo(() => {
    if (!selectedVendor) {
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

    // 1. Opening Balance Record
    const rawOpening = selectedVendor.openingBalance || 0;
    const isCreditOpening = selectedVendor.openingBalanceType !== 'مدين';
    if (rawOpening > 0) {
      allMovements.push({
        id: `op-${selectedVendor.id}`,
        date: selectedVendor.openingBalanceDate || '2026-01-01',
        docNumber: 'OP-BAL-001',
        docType: 'رصيد أول المدة',
        narration: 'الرصيد الافتتاحي المنقول للمورد',
        debit: isCreditOpening ? 0 : rawOpening,
        credit: isCreditOpening ? rawOpening : 0
      });
    }

    // 2. Completed Purchase Invoices
    try {
      const rawPurchases = localStorage.getItem('VERTEX_PURCHASE_INVOICES_V1');
      if (rawPurchases) {
        const parsed = JSON.parse(rawPurchases);
        const completed = (Array.isArray(parsed) ? parsed : (parsed.completedInvoices || [])) as any[];
        for (const inv of completed) {
          if (
            inv.status !== 'cancelled' &&
            (
              inv.vendorId === selectedVendor.id ||
              inv.vendorName === selectedVendor.name ||
              (selectedVendor.code && inv.vendorId === selectedVendor.code)
            )
          ) {
            const invDate = inv.date ? String(inv.date).slice(0, 10) : '2026-01-15';
            const total = typeof inv.grandTotal === 'number' ? inv.grandTotal : parseFloat(inv.grandTotal) || 0;
            const paid = typeof inv.cashPaid === 'number' ? inv.cashPaid : (parseFloat(inv.cashPaid) || 0);

            // Invoice credit row
            allMovements.push({
              id: `inv-${inv.id || inv.invoiceNumber || Math.random()}`,
              date: invDate,
              docNumber: inv.invoiceNumber || (inv.id ? `PUR-${String(inv.id).slice(0, 6)}` : 'PUR-000000'),
              docType: inv.paymentMethod === 'deferred' || inv.paymentMethod === 'آجل' ? 'فاتورة مشتريات (آجل)' : 'فاتورة مشتريات',
              narration: `فاتورة مشتريات رقم [${inv.invoiceNumber || 'عام'}] - إجمالي: ${safeFormatLocale(total)} ج.م`,
              debit: 0,
              credit: total
            });

            // If cash paid at invoice time, add debit payment row
            if (paid > 0) {
              allMovements.push({
                id: `inv-pay-${inv.id || inv.invoiceNumber || Math.random()}`,
                date: invDate,
                docNumber: `PAY-${inv.invoiceNumber || 'DIR'}`,
                docType: 'سداد نقدي مع الفاتورة',
                narration: `سداد فوري مسجل مع فاتورة مشتريات #${inv.invoiceNumber || ''}`,
                debit: paid,
                credit: 0
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing purchase invoices for vendor statement:', e);
    }

    // 3. Treasury Income / Disbursement Transactions (سندات الصرف والقبض)
    try {
      const allTx = incomeTransactionService.getAllTransactions();
      for (const tx of allTx) {
        if (tx.status === 'ملغي') continue;

        const matchingLines: Array<{ amount: number; notes?: string }> = [];
        if (tx.lines && tx.lines.length > 0) {
          for (const l of tx.lines) {
            if (
              (l.accountType === 'vendors' || tx.accountType === 'vendors') &&
              (
                l.accountId === selectedVendor.id ||
                (selectedVendor.code && (l.accountCode === selectedVendor.code || l.accountId === selectedVendor.code))
              )
            ) {
              matchingLines.push({ amount: l.amount, notes: l.notes });
            }
          }
        } else if (
          tx.accountType === 'vendors' &&
          (
            tx.accountId === selectedVendor.id ||
            (selectedVendor.code && (tx.accountCode === selectedVendor.code || tx.accountId === selectedVendor.code))
          )
        ) {
          matchingLines.push({ amount: tx.amount, notes: tx.notes });
        }

        for (const m of matchingLines) {
          const txDate = tx.date ? String(tx.date).slice(0, 10) : (tx.createdAt ? String(tx.createdAt).slice(0, 10) : '2026-01-20');
          const isOutward = tx.type === 'outward'; // صادر خزينة = سداد نقدي للمورد (مدين)
          allMovements.push({
            id: `tx-${tx.id}-${Math.random().toString(36).slice(2, 6)}`,
            date: txDate,
            docNumber: tx.documentNumber,
            docType: isOutward ? 'سند صرف نقدي (صادر خزينة)' : 'سند قبض نقدي (وارد خزينة)',
            narration: m.notes || tx.notes || (isOutward ? `سداد نقدي للمورد من خزينة [${tx.treasuryName}]` : `توريد نقدي من المورد إلى خزينة [${tx.treasuryName}]`),
            debit: isOutward ? m.amount : 0, // سداد نقدي يقلل دائنية المورد (مدين)
            credit: isOutward ? 0 : m.amount // قبض نقدي يزيد دائنية المورد (دائن)
          });
        }
      }
    } catch (e) {
      console.error('Error fetching income transactions for vendor statement:', e);
    }

    // 4. If vendor has a seed balanceDue but no other movements recorded yet, add seed movement
    if (allMovements.length === 0 && selectedVendor.balanceDue && selectedVendor.balanceDue > 0) {
      allMovements.push({
        id: `seed-${selectedVendor.id}`,
        date: selectedVendor.createdAt ? String(selectedVendor.createdAt).slice(0, 10) : '2026-01-01',
        docNumber: 'OP-BAL-001',
        docType: 'رصيد دفتري سابق',
        narration: 'رصيد مستحق دفترياً للمورد',
        debit: 0,
        credit: selectedVendor.balanceDue
      });
    }

    // Sort movements chronologically
    allMovements.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Filter by Date Range and calculate Prior Balance
    // In Vendor Account (Liability): Balance = Credit - Debit
    let priorBal = 0;
    const periodMovements: typeof allMovements = [];

    for (const mov of allMovements) {
      const movDate = mov.date || '';
      if (fromDate && movDate < fromDate) {
        priorBal += (mov.credit - mov.debit);
      } else if (!toDate || movDate <= toDate) {
        periodMovements.push(mov);
      }
    }

    // Build rows with running cumulative balance
    let running = priorBal;
    let sumDebit = 0;
    let sumCredit = 0;

    const rows: VendorStatementLedgerRow[] = periodMovements.map((m, idx) => {
      sumDebit += m.debit;
      sumCredit += m.credit;
      running += (m.credit - m.debit);

      return {
        id: m.id,
        index: idx + 1,
        date: m.date,
        docNumber: m.docNumber,
        docType: m.docType,
        narration: m.narration,
        debit: m.debit,
        credit: m.credit,
        runningBalance: running
      };
    });

    const finalBalance = priorBal + sumCredit - sumDebit;

    return {
      ledgerRows: rows,
      priorBalance: priorBal,
      totalDebit: sumDebit,
      totalCredit: sumCredit,
      currentBalance: finalBalance,
      transactionCount: rows.length
    };
  }, [selectedVendor, fromDate, toDate, reloadTrigger]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!selectedVendor) return;
    
    let csv = `\uFEFFتقرير كشف حساب مورد\n`;
    csv += `اسم المورد:,${selectedVendor.name},كود المورد:,${selectedVendor.code}\n`;
    csv += `الفترة من:,${fromDate || 'البداية'},إلى:,${toDate || 'اليوم'},العملة:,${currency}\n\n`;
    csv += `#,التاريخ,رقم المستند,نوع الحركة,البيان,مدين (سداد),دائن (مشتريات),الرصيد المستحق\n`;

    if (priorBalance !== 0) {
      csv += `-,${fromDate || '-'},-,رصيد ما قبل الفترة,الرصيد السابق,0.00,0.00,${priorBalance.toFixed(2)}\n`;
    }

    ledgerRows.forEach(r => {
      csv += `${r.index},${r.date},${r.docNumber},"${r.docType}","${r.narration.replace(/"/g, '""')}",${r.debit.toFixed(2)},${r.credit.toFixed(2)},${r.runningBalance.toFixed(2)}\n`;
    });

    csv += `\n,,,,,${totalDebit.toFixed(2)},${totalCredit.toFixed(2)},${currentBalance.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_حساب_مورد_${selectedVendor.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVendorSearch = useMemo(() => {
    if (!vendorSearchQuery.trim()) return vendors;
    const q = vendorSearchQuery.toLowerCase();
    return vendors.filter(v => 
      v.name.toLowerCase().includes(q) ||
      v.code.toLowerCase().includes(q) ||
      (v.mobile && v.mobile.includes(q))
    );
  }, [vendors, vendorSearchQuery]);

  return (
    <div className="space-y-4 font-sans text-right" dir="rtl">
      {/* 1. Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-xs">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h1 className="text-lg font-black text-slate-100">كشف حساب مورد</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                Vendor Statement
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة حركات المشتريات وسندات الصرف والقبض النقدية والرصيد التراكمي الفعلي
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 space-x-reverse self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={() => setIsPrintPreviewOpen(true)}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>طباعة</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>تصدير Excel</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter & Selection Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Vendor Selector */}
          <div className="md:col-span-5 relative">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>المورد المطلوب <span className="text-rose-400">*</span></span>
              {selectedVendor && (
                <span className="text-[10px] font-mono text-cyan-400 font-normal">
                  الكود: {selectedVendor.code}
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type="text"
                value={isVendorDropdownOpen ? vendorSearchQuery : (selectedVendor ? `${selectedVendor.name} (${selectedVendor.code})` : '')}
                onChange={(e) => {
                  setVendorSearchQuery(e.target.value);
                  setIsVendorDropdownOpen(true);
                }}
                onFocus={() => {
                  setVendorSearchQuery('');
                  setIsVendorDropdownOpen(true);
                }}
                placeholder="ابحث بكود أو اسم المورد..."
                className="w-full h-10 pr-9 pl-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold focus:outline-none focus:border-cyan-500/50"
              />
              <Building2 className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Autocomplete List */}
              {isVendorDropdownOpen && (
                <div className="absolute top-11 right-0 left-0 max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/80">
                  {filteredVendorSearch.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      لا يوجد مورد مطابق لـ «{vendorSearchQuery}»
                    </div>
                  ) : (
                    filteredVendorSearch.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVendorId(v.id);
                          setIsVendorDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 text-right flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
                          v.id === selectedVendorId ? 'bg-cyan-950/40 text-cyan-300' : 'text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{v.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {v.code} {v.mobile ? `• ${v.mobile}` : ''}
                          </div>
                        </div>
                        <div className="text-left font-mono text-[11px] font-bold text-cyan-400">
                          {safeFormatLocale(v.balanceDue || 0)} ج.م
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Period Preset */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              الفترة الزمنية
            </label>
            <select
              value={periodPreset}
              onChange={(e) => handlePeriodPresetChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="this_month">الشهر الحالي</option>
              <option value="today">اليوم فقط</option>
              <option value="prev_month">الشهر السابق</option>
              <option value="this_year">السنة الحالية</option>
              <option value="all">كل الحركات التاريخية</option>
              <option value="custom">تحديد مخصص</option>
            </select>
          </div>

          {/* From Date */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              من تاريخ
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="w-full h-10 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono font-bold focus:outline-none"
            />
          </div>

          {/* To Date */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="w-full h-10 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Prior Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>رصيد ما قبل الفترة</span>
            <Scale className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-base font-black font-mono text-slate-200">
            {safeFormatLocale(priorBalance)} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Total Purchases (Credit) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إجمالي المشتريات (دائن)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-black font-mono text-emerald-400">
            {safeFormatLocale(totalCredit)} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Total Payments (Debit) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إجمالي السداد النقدي (مدين)</span>
            <TrendingDown className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-base font-black font-mono text-blue-400">
            {safeFormatLocale(totalDebit)} <span className="text-xs font-normal text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Net Current Balance */}
        <div className={`rounded-2xl p-3.5 shadow-lg border ${
          currentBalance > 0 
            ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
            : currentBalance < 0
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
            : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold">الرصيد المستحق النهائي</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black font-mono">
            {safeFormatLocale(currentBalance)} <span className="text-xs font-normal opacity-80">ج.م</span>
          </div>
        </div>
      </div>

      {/* 4. Movements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200">
              أسطر الحركات الدفترية والمستندية ({transactionCount})
            </h3>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {selectedVendor ? `المورد: ${selectedVendor.name}` : 'لم يتم اختيار مورد'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-3 w-28 text-center">التاريخ</th>
                <th className="py-3 px-3 w-32 text-center">رقم المستند</th>
                <th className="py-3 px-3 w-40">نوع الحركة</th>
                <th className="py-3 px-4 min-w-[240px]">البيان / تفاصيل الحركة</th>
                <th className="py-3 px-3 w-32 text-center text-blue-400">مدين (سداد)</th>
                <th className="py-3 px-3 w-32 text-center text-emerald-400">دائن (مشتريات)</th>
                <th className="py-3 px-3 w-32 text-center text-amber-300">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {priorBalance !== 0 && (
                <tr className="bg-slate-950/40 text-slate-400 font-medium italic">
                  <td className="py-2.5 px-3 text-center">-</td>
                  <td className="py-2.5 px-3 text-center font-mono">{fromDate || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">-</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-300">رصيد ما قبل الفترة</td>
                  <td className="py-2.5 px-4 text-slate-400">الرصيد الدفتري المنقول حتى بداية الفترة المحددة</td>
                  <td className="py-2.5 px-3 text-center font-mono">-</td>
                  <td className="py-2.5 px-3 text-center font-mono">-</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                    {safeFormatLocale(priorBalance)}
                  </td>
                </tr>
              )}

              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Receipt className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">لا توجد حركات مسجلة لهذا المورد في الفترة المحددة.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ledgerRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {row.index}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {row.date}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">
                      {row.docNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        row.docType.includes('صرف')
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : row.docType.includes('مشتريات')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {row.docType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {row.narration}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-400">
                      {row.debit > 0 ? safeFormatLocale(row.debit) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                      {row.credit > 0 ? safeFormatLocale(row.credit) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-300">
                      {safeFormatLocale(row.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-200">
              <tr>
                <td colSpan={5} className="py-3 px-4 text-left">
                  إجمالي الحركات والرصيد المستحق النهائي:
                </td>
                <td className="py-3 px-3 text-center font-mono text-blue-400">
                  {safeFormatLocale(totalDebit)}
                </td>
                <td className="py-3 px-3 text-center font-mono text-emerald-400">
                  {safeFormatLocale(totalCredit)}
                </td>
                <td className="py-3 px-3 text-center font-mono text-amber-300">
                  {safeFormatLocale(currentBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Print Preview Modal */}
      {isPrintPreviewOpen && selectedVendor && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsPrintPreviewOpen(false)}
        >
          <div 
            className="w-full max-w-4xl max-h-[92vh] bg-white text-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right font-sans"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Printer className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900">معاينة طباعة كشف حساب مورد</h3>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs"
                >
                  طباعة فورية
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-800">
              <div className="text-center border-b pb-4 space-y-1">
                <h2 className="text-lg font-black text-slate-900">كشف حساب مورد تفصيلي</h2>
                <p className="text-slate-600">المورد: <span className="font-bold text-slate-900">{selectedVendor.name}</span> (كود: {selectedVendor.code})</p>
                <p className="text-slate-500 text-[11px]">الفترة: من {fromDate || 'البداية'} إلى {toDate || 'اليوم'}</p>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 border rounded bg-slate-50">
                  <span className="block text-[10px] text-slate-500">رصيد أول</span>
                  <span className="font-mono font-bold">{safeFormatLocale(priorBalance)}</span>
                </div>
                <div className="p-2 border rounded bg-slate-50">
                  <span className="block text-[10px] text-slate-500">إجمالي المشتريات</span>
                  <span className="font-mono font-bold text-emerald-700">{safeFormatLocale(totalCredit)}</span>
                </div>
                <div className="p-2 border rounded bg-slate-50">
                  <span className="block text-[10px] text-slate-500">إجمالي السداد</span>
                  <span className="font-mono font-bold text-blue-700">{safeFormatLocale(totalDebit)}</span>
                </div>
                <div className="p-2 border rounded bg-slate-50">
                  <span className="block text-[10px] text-slate-500">الرصيد المستحق</span>
                  <span className="font-mono font-bold text-amber-700">{safeFormatLocale(currentBalance)}</span>
                </div>
              </div>

              <table className="w-full text-right border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                    <th className="p-2 border border-slate-300 text-center w-8">#</th>
                    <th className="p-2 border border-slate-300 text-center w-24">التاريخ</th>
                    <th className="p-2 border border-slate-300 text-center w-24">رقم المستند</th>
                    <th className="p-2 border border-slate-300 w-32">نوع الحركة</th>
                    <th className="p-2 border border-slate-300">البيان</th>
                    <th className="p-2 border border-slate-300 text-center w-24">مدين</th>
                    <th className="p-2 border border-slate-300 text-center w-24">دائن</th>
                    <th className="p-2 border border-slate-300 text-center w-24">الرصيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ledgerRows.map(r => (
                    <tr key={r.id}>
                      <td className="p-2 border border-slate-300 text-center font-mono">{r.index}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{r.date}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{r.docNumber}</td>
                      <td className="p-2 border border-slate-300">{r.docType}</td>
                      <td className="p-2 border border-slate-300">{r.narration}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{r.debit > 0 ? safeFormatLocale(r.debit) : '-'}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{r.credit > 0 ? safeFormatLocale(r.credit) : '-'}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{safeFormatLocale(r.runningBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
