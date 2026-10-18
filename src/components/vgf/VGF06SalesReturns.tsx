import React, { useState, useMemo } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import {
  RotateCcw,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  DollarSign,
  CreditCard,
  Calendar,
  User,
  Tag,
  Save,
  Eye,
  Trash2,
  Receipt,
  Ban,
  Clock,
  Printer
} from 'lucide-react';
import { SalesInvoice, salesEntryService } from '../../services/salesEntryService';
import { StandardActionBar } from '../common/StandardActionBar';
import {
  salesReturnService,
  SalesReturn,
  ReturnReason,
  RefundMethod,
  ReturnFinancialSummary
} from '../../services/salesReturnService';

interface VGF06SalesReturnsProps {
  onBackToSales?: () => void;
  currentUser?: {
    username: string;
    fullName: string;
    role: string;
  };
}

export const VGF06SalesReturns: React.FC<VGF06SalesReturnsProps> = ({
  onBackToSales,
  currentUser = { username: 'alex.mercer', fullName: 'Alex Mercer', role: 'SUPER_ADMIN' }
}) => {
  // All invoices from salesEntryService
  const salesState = salesEntryService.getState();
  const allInvoices = useMemo(() => {
    const completed = salesState.completedInvoices || [];
    const open = salesState.openInvoices || [];
    return [...completed, ...open];
  }, [salesState]);

  // Returns history state
  const [returnRecords, setReturnRecords] = useState<SalesReturn[]>(salesReturnService.getAllReturns());

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  // Search Filters for Original Invoice
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState<string>('');
  const [searchCustomer, setSearchCustomer] = useState<string>('');
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('all');

  // Selected Original Invoice for Return Process
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  // Return Quantities: key = lineItem.id, value = returnQty
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  // Return Form Details
  const [selectedReason, setSelectedReason] = useState<ReturnReason>('العميل لا يريد المنتج');
  const [customReasonDetails, setCustomReasonDetails] = useState<string>('');
  const [selectedRefundMethod, setSelectedRefundMethod] = useState<RefundMethod>('original');
  const [notes, setNotes] = useState<string>('');

  // Selected Return Detail Modal (for viewing historical returns)
  const [viewingReturn, setViewingReturn] = useState<SalesReturn | null>(null);

  // Filter Invoices for Search Results
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      // Search Invoice Number
      if (searchInvoiceNumber.trim()) {
        const q = searchInvoiceNumber.trim().toLowerCase();
        if (!inv.invoiceNumber.toLowerCase().includes(q)) return false;
      }
      // Search Customer Name
      if (searchCustomer.trim()) {
        const q = searchCustomer.trim().toLowerCase();
        if (!inv.customerName.toLowerCase().includes(q)) return false;
      }
      // Search Date
      if (searchDate) {
        const invDate = new Date(inv.createdAt).toISOString().split('T')[0];
        if (invDate !== searchDate) return false;
      }
      // Search Status
      if (searchStatus !== 'all') {
        if (searchStatus === 'cancelled' && inv.status !== 'cancelled') return false;
        if (searchStatus === 'completed' && inv.status !== 'completed' && inv.status !== 'active') return false;
        if (searchStatus === 'deferred' && inv.paymentMethod !== 'deferred') return false;
      }
      return true;
    });
  }, [allInvoices, searchInvoiceNumber, searchCustomer, searchDate, searchStatus]);

  // Handle Select Original Invoice
  const handleSelectInvoice = (inv: SalesInvoice) => {
    setSelectedInvoice(inv);
    if (inv.status === 'cancelled') {
      setReturnQuantities({});
      showToast('هذه الفاتورة ملغاة، لذلك لا يمكن إنشاء مرتجع عليها. يمكنك مراجعة بياناتها فقط.');
      return;
    }
    // Initialize return quantities
    const initialQtys: Record<string, number> = {};
    inv.lineItems.forEach(item => {
      initialQtys[item.id] = 0;
    });
    setReturnQuantities(initialQtys);
  };

  // Handle Quantity Change for an Item
  const handleQuantityChange = (lineItemId: string, val: number, maxAvailable: number) => {
    if (selectedInvoice?.status === 'cancelled') {
      showToast('هذه الفاتورة ملغاة، لذلك لا يمكن تعديل كميات المرتجع.');
      return;
    }
    if (val < 0) {
      val = 0;
    }
    if (val > maxAvailable) {
      showToast(`الكمية المطلوبة (${val}) تتجاوز المتاح للمرتجع (${maxAvailable})`);
      val = maxAvailable;
    }
    setReturnQuantities(prev => ({
      ...prev,
      [lineItemId]: val
    }));
  };

  // Financial Calculations
  const returnSummary: ReturnFinancialSummary = useMemo(() => {
    if (!selectedInvoice) {
      return {
        subtotalReturn: 0,
        itemDiscountsReturn: 0,
        invoiceDiscountReturn: 0,
        totalDiscountReturn: 0,
        netBeforeTaxReturn: 0,
        vatReturn: 0,
        taxDiscountReturn: 0,
        netReturnTotal: 0
      };
    }
    return salesReturnService.calculateReturnTotals(selectedInvoice, returnQuantities);
  }, [selectedInvoice, returnQuantities]);

  // Check if any items are selected for return
  const totalReturnUnits = useMemo(() => {
    return (Object.values(returnQuantities) as number[]).reduce((sum: number, q: number) => sum + (q || 0), 0);
  }, [returnQuantities]);

  // Submit / Save Return Action
  const handleSaveReturn = (status: 'approved' | 'draft') => {
    if (!selectedInvoice) {
      showToast('الرجاء اختيار الفاتورة الأصلية أولاً');
      return;
    }
    if (selectedInvoice.status === 'cancelled') {
      showToast('لا يمكن إنشاء مرتجع لهذه الفاتورة لأنها ملغاة.');
      return;
    }
    if (totalReturnUnits <= 0) {
      showToast('برجاء تحديد كمية مرتجع صالحة لأصناف الفاتورة على الأقل صنف واحد');
      return;
    }

    // Build Return Line Items
    const lineItems = selectedInvoice.lineItems
      .filter(item => (returnQuantities[item.id] || 0) > 0)
      .map(item => {
        const retQty = returnQuantities[item.id];
        const prevRetQty = salesReturnService.getPreviouslyReturnedQuantity(selectedInvoice.id, item.id);
        const availQty = Math.max(0, item.quantity - prevRetQty);
        const perUnitDiscount = item.quantity > 0 ? (item.discountAmount || 0) / item.quantity : 0;
        const lineTotal = (item.unitPrice * retQty) - (perUnitDiscount * retQty);

        return {
          lineItemId: item.id,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          barcode: item.barcode,
          unitPrice: item.unitPrice,
          soldQuantity: item.quantity,
          previouslyReturnedQuantity: prevRetQty,
          availableReturnQuantity: availQty,
          returnQuantity: retQty,
          unit: item.unit,
          itemDiscountAmount: perUnitDiscount * retQty,
          lineTotal
        };
      });

    // Create Return Record
    const newReturn = salesReturnService.createReturn({
      originalInvoiceId: selectedInvoice.id,
      originalInvoiceNumber: selectedInvoice.invoiceNumber,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      status,
      reason: selectedReason,
      customReasonDetails: selectedReason === 'أخرى' ? customReasonDetails : undefined,
      lineItems,
      subtotalReturn: returnSummary.subtotalReturn,
      itemDiscountsReturn: returnSummary.itemDiscountsReturn,
      invoiceDiscountReturn: returnSummary.invoiceDiscountReturn,
      vatReturn: returnSummary.vatReturn,
      taxDiscountReturn: returnSummary.taxDiscountReturn,
      netReturnTotal: returnSummary.netReturnTotal,
      refundMethod: selectedRefundMethod,
      createdBy: currentUser.username,
      notes
    });

    setReturnRecords(salesReturnService.getAllReturns());
    showToast(
      status === 'approved'
        ? `تم اعتماد سند مرتجع مبيعات رقم (${newReturn.returnNumber}) بنجاح`
        : `تم حفظ مرتجع المبيعات كمسودة رقم (${newReturn.returnNumber})`
    );

    // Reset current active form safely
    handleClearForm();
  };

  // Clear / Reset Current Form
  const handleClearForm = () => {
    setSelectedInvoice(null);
    setReturnQuantities({});
    setSelectedReason('العميل لا يريد المنتج');
    setCustomReasonDetails('');
    setSelectedRefundMethod('original');
    setNotes('');
  };

  // Delete Draft Return
  const handleDeleteReturn = (id: string, num: string) => {
    salesReturnService.deleteReturn(id);
    setReturnRecords(salesReturnService.getAllReturns());
    showToast(`تم حذف مرتجع المبيعات (${num}) بنجاح`);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 border border-rose-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 p-8 opacity-10 pointer-events-none">
          <RotateCcw className="w-48 h-48 text-rose-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 space-x-reverse mb-2">
              <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-xs font-bold">
                مرتجعات المبيعات
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1 space-x-reverse border border-slate-700">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>إدارة المرتجعات المربوطة بالفواتير الأصلية</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              شاشة مرتجعات المبيعات المعتمدة
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              قم بالبحث عن الفاتورة الأصلية تحديد أصناف الكمية المرتجعة، احتساب الخصومات والضرائب بدقة تلقائياً، وإنشاء سند مرتجع منفصل مرتبط برقم الفاتورة دون التعديل على الفاتورة الأصلية.
            </p>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse shrink-0">
            {onBackToSales && (
              <button
                type="button"
                onClick={onBackToSales}
                className="flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 cursor-pointer shadow"
              >
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <span>العودة لشاشة المبيعات</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: SEARCH & SELECT ORIGINAL INVOICE */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Search className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-slate-100">1. البحث عن الفاتورة الأصلية</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            عدد الفواتير المتاحة: {filteredInvoices.length}
          </span>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">رقم الفاتورة</label>
            <div className="relative">
              <input
                type="text"
                placeholder="مثال: INV-2026-1001"
                value={searchInvoiceNumber}
                onChange={e => setSearchInvoiceNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
              {searchInvoiceNumber && (
                <button
                  onClick={() => setSearchInvoiceNumber('')}
                  className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">اسم العميل</label>
            <input
              type="text"
              placeholder="اسم العميل..."
              value={searchCustomer}
              onChange={e => setSearchCustomer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">تاريخ الفاتورة</label>
            <input
              type="date"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">حالة الفاتورة</label>
            <select
              value={searchStatus}
              onChange={e => setSearchStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="completed">مكتملة / مدفوعة</option>
              <option value="deferred">آجلة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        {/* Invoice Selector Table / Cards */}
        {!selectedInvoice && (
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-400 mb-2">اختر الفاتورة للبدء في إجراء المرتجع:</h3>
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 text-slate-400 text-xs">
                لا توجد فواتير تطابق معايير البحث المحددة.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto custom-scrollbar border border-slate-800 rounded-xl bg-slate-950 divide-y divide-slate-800/80">
                {filteredInvoices.map((inv, idx) => (
                  <div
                    key={inv.id ? `${inv.id}-${idx}` : `filtered-inv-${idx}`}
                    className="p-3 hover:bg-slate-900/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="font-mono font-black text-amber-400 text-xs">{inv.invoiceNumber}</span>
                        <span className="text-slate-200 text-xs font-bold">{inv.customerName}</span>
                        {inv.status === 'cancelled' && (
                          <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] rounded font-bold border border-rose-500/30">
                            ملغاة
                          </span>
                        )}
                        {inv.paymentMethod === 'deferred' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded font-bold border border-amber-500/30">
                            آجل
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-3 space-x-reverse">
                        <span>التاريخ: {new Date(inv.createdAt).toLocaleString('ar-EG')}</span>
                        <span>عدد الأصناف: {inv.lineItems.length}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 space-x-reverse">
                      <div className="text-left font-mono">
                        <span className="text-xs font-black text-emerald-400">${inv.grandTotal.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectInvoice(inv)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-colors shadow flex items-center space-x-1 space-x-reverse cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>اختيار للمرتجع</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SELECTED INVOICE BANNER */}
        {selectedInvoice && (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl bg-slate-950 border-2 ${selectedInvoice.status === 'cancelled' ? 'border-rose-500/80 bg-rose-950/20' : 'border-rose-500/50'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                  <span className={`px-2 py-0.5 rounded font-bold font-mono text-xs border ${selectedInvoice.status === 'cancelled' ? 'bg-rose-500/30 text-rose-300 border-rose-500/60' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
                    الفاتورة المختارة {selectedInvoice.status === 'cancelled' ? '(ملغاة)' : ''}
                  </span>
                  <strong className="text-amber-400 font-mono text-sm">{selectedInvoice.invoiceNumber}</strong>
                  <span className="text-slate-300 font-bold text-xs">| العميل: {selectedInvoice.customerName}</span>
                  {selectedInvoice.status === 'cancelled' && (
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-slate-100 font-bold text-[11px] shadow">
                      ملغاة / CANCELLED
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>تاريخ الفاتورة: {new Date(selectedInvoice.createdAt).toLocaleString('ar-EG')}</span>
                  <span>إجمالي الفاتورة الأصلي: <strong className="text-emerald-400 font-mono">${selectedInvoice.grandTotal.toFixed(2)}</strong></span>
                  <span>طريقة الدفع: <strong className="text-slate-200">{selectedInvoice.paymentMethod === 'deferred' ? 'آجل' : 'نقداً / بطاقة'}</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center space-x-1 space-x-reverse self-start md:self-auto cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>تغيير الفاتورة</span>
              </button>
            </div>

            {/* Cancelled invoice advisory notice */}
            {selectedInvoice.status === 'cancelled' && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/60 text-rose-200 text-xs flex items-start space-x-2.5 space-x-reverse leading-relaxed shadow-lg">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-300 ml-1">هذه الفاتورة ملغاة، لذلك لا يمكن إنشاء مرتجع عليها.</span>
                  <span className="text-slate-300">يمكنك مراجعة بيانات وأصناف الفاتورة الأصلية فقط، ولكن لا يمكن استخدامها لإنشاء أي حركة مرتجع أو تعديل المخزون.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2 & 3: RETURN ITEMS TABLE & REASON & FINANCIAL SUMMARY */}
      {selectedInvoice && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* RETURN ITEMS TABLE (8 cols) */}
          <div className="lg:col-span-8 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-bold text-slate-100">2. جدول أصناف الفاتورة والكميات المرتجعة</h2>
              </div>
              <span className="text-xs text-amber-400 font-bold">
                إجمالي قطع المرتجع: {totalReturnUnits}
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-bold">
                    <th className="py-2.5 px-2">الصنف</th>
                    <th className="py-2.5 px-2 text-center">السعر</th>
                    <th className="py-2.5 px-2 text-center">المباع</th>
                    <th className="py-2.5 px-2 text-center">مرتجع سابقاً</th>
                    <th className="py-2.5 px-2 text-center">المتاح</th>
                    <th className="py-2.5 px-2 text-center w-32">كمية المرتجع</th>
                    <th className="py-2.5 px-2 text-left">إجمالي المرتجع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {selectedInvoice.lineItems.map((item, idx) => {
                    const prevReturned = salesReturnService.getPreviouslyReturnedQuantity(selectedInvoice.id, item.id);
                    const availableQty = Math.max(0, item.quantity - prevReturned);
                    const currentRetQty = returnQuantities[item.id] || 0;
                    const perUnitDiscount = item.quantity > 0 ? (item.discountAmount || 0) / item.quantity : 0;
                    const lineReturnTotal = (item.unitPrice * currentRetQty) - (perUnitDiscount * currentRetQty);

                    return (
                      <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-100">{item.productName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.productCode}</div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-300">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-300">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-amber-400">
                          {prevReturned}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-400">
                          {availableQty}
                        </td>
                        <td className="py-3 px-2">
                          {selectedInvoice.status === 'cancelled' ? (
                            <div className="flex items-center justify-center">
                              <span className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-500 text-[11px] font-bold">
                                غير متاح (ملغاة)
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <div className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950 p-0.5 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.id, currentRetQty - 1, availableQty)}
                                  disabled={availableQty <= 0 || currentRetQty <= 0}
                                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={availableQty}
                                  value={currentRetQty === 0 ? '' : currentRetQty}
                                  onChange={e => handleQuantityChange(item.id, parseInt(e.target.value) || 0, availableQty)}
                                  disabled={availableQty <= 0}
                                  placeholder="0"
                                  className="w-10 bg-transparent text-center font-mono font-bold text-rose-400 focus:outline-none text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.id, currentRetQty + 1, availableQty)}
                                  disabled={availableQty <= 0 || currentRetQty >= availableQty}
                                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-left font-mono font-bold text-rose-400">
                          ${lineReturnTotal > 0 ? lineReturnTotal.toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* RETURN REASON SECTION */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                سبب المرتجع:
              </label>
              <div className="flex flex-wrap gap-2">
                {(['تالف', 'خطأ في البيع', 'العميل لا يريد المنتج', 'استبدال', 'أخرى'] as ReturnReason[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedReason === r
                        ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md shadow-rose-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {selectedReason === 'أخرى' && (
                <div>
                  <input
                    type="text"
                    placeholder="اكتب توضيح سبب المرتجع بالتفصيل..."
                    value={customReasonDetails}
                    onChange={e => setCustomReasonDetails(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* FINANCIAL SUMMARY & ACTIONS (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* FINANCIAL SUMMARY CARD */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">3. الملاخص المالي للمرتجع</h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>إجمالي الأصناف المرتجعة:</span>
                  <span className="text-slate-200">${returnSummary.subtotalReturn.toFixed(2)}</span>
                </div>

                {returnSummary.totalDiscountReturn > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>خصومات المرتجع المخصومة:</span>
                    <span>-${returnSummary.totalDiscountReturn.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300 font-bold border-t border-slate-800/80 pt-1.5">
                  <span>صافي المرتجع قبل الضريبة:</span>
                  <span>${returnSummary.netBeforeTaxReturn.toFixed(2)}</span>
                </div>

                {selectedInvoice.isTaxInvoice && returnSummary.vatReturn > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>ضريبة القيمة المضافة (14%):</span>
                    <span>+${returnSummary.vatReturn.toFixed(2)}</span>
                  </div>
                )}

                {returnSummary.taxDiscountReturn > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>الخصم الضريبي المرتجع:</span>
                    <span>-${returnSummary.taxDiscountReturn.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t-2 border-slate-800 pt-3 mt-2 flex justify-between items-center">
                  <span className="font-sans font-black text-sm text-slate-100">صافي مبلغ المرتجع:</span>
                  <span className="text-xl font-black text-rose-400">${returnSummary.netReturnTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* REFUND METHOD */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">طريقة رد المبلغ للعميل:</label>
                <select
                  value={selectedRefundMethod}
                  onChange={e => setSelectedRefundMethod(e.target.value as RefundMethod)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-bold"
                >
                  <option value="original">نفس طريقة الدفع الأصلية ({selectedInvoice.paymentMethod === 'deferred' ? 'آجل' : 'نقداً / بطاقة'})</option>
                  <option value="cash">نقداً (Cash)</option>
                  <option value="card">بطاقة / POS</option>
                  <option value="deferred">خصم من الرصيد / آجل</option>
                </select>
              </div>

              {/* NOTES */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">ملاحظات السند:</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات اختيارية..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* STANDARD ACTION BAR FOR SALES RETURNS (hasHold=false) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {selectedInvoice.status === 'cancelled' && (
                  <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
                    ⛔ زر الاعتماد والحفظ معطّل لأن الفاتورة المختارة ملغاة.
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>إجراءات مرتجع المبيعات</span>
                  <span>No Hold Support</span>
                </div>
                <StandardActionBar
                  hasHold={false}
                  onNew={handleClearForm}
                  onSave={() => handleSaveReturn('approved')}
                  onView={() => {
                    const historyElem = document.getElementById('return-history-table');
                    if (historyElem) historyElem.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onPrint={() => window.print()}
                  onCancel={handleClearForm}
                  onClose={handleClearForm}
                  newLabel="1. مرتجع جديد"
                  saveLabel="2. اعتماد وحفظ"
                  viewLabel="3. عرض السجل"
                  printLabel="4. طباعة"
                  cancelLabel="5. إلغاء"
                  closeLabel="6. إغلاق"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: RETURN HISTORY TABLE */}
      <div id="return-history-table" className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">سجل مرتجعات المبيعات</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            إجمالي السجلات: {returnRecords.length}
          </span>
        </div>

        {returnRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800/80">
            لا توجد سندات مرتجعات مبيعات مسجلة حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase font-bold">
                  <th className="py-2.5 px-3">رقم المرتجع</th>
                  <th className="py-2.5 px-3">الفاتورة الأصلية</th>
                  <th className="py-2.5 px-3">التاريخ والوقت</th>
                  <th className="py-2.5 px-3">العميل</th>
                  <th className="py-2.5 px-3 text-center">سبب المرتجع</th>
                  <th className="py-2.5 px-3 text-center">إجمالي المرتجع</th>
                  <th className="py-2.5 px-3 text-center">الحالة</th>
                  <th className="py-2.5 px-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {returnRecords.map((ret, idx) => (
                  <tr key={ret.id ? `${ret.id}-${idx}` : `ret-${idx}`} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-rose-400">
                      {ret.returnNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-400 font-bold">
                      {ret.originalInvoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(ret.createdAt).toLocaleString('ar-EG')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-200">
                      {ret.customerName}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">
                      {ret.reason}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-rose-400">
                      ${ret.netReturnTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {ret.status === 'approved' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30">
                          معتمد
                        </span>
                      ) : ret.status === 'draft' ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30">
                          مسودة
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded border border-rose-500/30">
                          ملغى
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                        <button
                          type="button"
                          onClick={() => setViewingReturn(ret)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {ret.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReturn(ret.id, ret.returnNumber)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="حذف المسودة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW RETURN DETAILS MODAL */}
      {viewingReturn && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Receipt className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-slate-100">تفاصيل سند مرتجع مبيعات</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingReturn(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <span className="font-bold text-rose-400 text-sm">{viewingReturn.returnNumber}</span>
                  <p className="text-[10px] text-slate-400">مرتبط بالفاتورة: {viewingReturn.originalInvoiceNumber}</p>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400">{new Date(viewingReturn.createdAt).toLocaleString('ar-EG')}</span>
                  <p className="text-[10px] text-amber-400 font-bold">العميل: {viewingReturn.customerName}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-300">
                <span>سبب المرتجع: </span>
                <strong className="text-amber-300">{viewingReturn.reason}</strong>
                {viewingReturn.customReasonDetails && <span> ({viewingReturn.customReasonDetails})</span>}
              </div>

              {/* Items Table */}
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-1">الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-left">السعر</th>
                    <th className="py-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {viewingReturn.lineItems.map(item => (
                    <tr key={item.lineItemId} className="text-slate-200">
                      <td className="py-1.5 font-sans font-semibold">{item.productName}</td>
                      <td className="py-1.5 text-center">{item.returnQuantity}</td>
                      <td className="py-1.5 text-left">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-1.5 text-left font-bold text-rose-400">${item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>إجمالي المرتجع:</span>
                  <span>${viewingReturn.subtotalReturn.toFixed(2)}</span>
                </div>
                {viewingReturn.vatReturn > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>الضريبة (14%):</span>
                    <span>+${viewingReturn.vatReturn.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-100 font-bold text-sm pt-1 border-t border-slate-800">
                  <span>صافي المرتجع:</span>
                  <span className="text-rose-400">${viewingReturn.netReturnTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingReturn(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
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
