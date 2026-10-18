import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  ShoppingCart, 
  Barcode, 
  Grid, 
  List, 
  Keyboard, 
  Zap, 
  CheckCircle2, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  PauseCircle, 
  Play, 
  CreditCard, 
  DollarSign, 
  Banknote, 
  Users, 
  Star, 
  Clock, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  X, 
  Check, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  RefreshCw, 
  Percent, 
  Sliders, 
  Package, 
  Tag, 
  RotateCcw, 
  Receipt, 
  Printer,
  FilePlus,
  Save,
  Eye,
  Edit3,
  XCircle,
  LogOut,
  Filter,
  Ban,
  ShieldAlert,
  AlertTriangle,
  User,
  Building2,
  Boxes,
  UserCheck,
  UserPlus,
  Wallet,
  Landmark,
  Calendar,
  Copy,
  EyeOff,
  Calculator,
  Phone,
  Gift,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { 
  salesEntryService, 
  SalesEntryState, 
  SalesEntryMode, 
  ProductItem, 
  Customer, 
  InvoiceLineItem, 
  SalesInvoice,
  InvoiceProfitabilityResult
} from '../../services/salesEntryService';
import { customerService, SYSTEM_CASH_CUSTOMER, CustomerType, CustomerStatus } from '../../services/customerService';
import { treasuryService, Treasury } from '../../services/treasuryService';
import { warehouseService, Warehouse } from '../../services/warehouseService';
import { setupWizardService } from '../../services/setupWizardService';
import { branchService } from '../../services/branchService';
import { WarehouseItem, TreasuryItem, BankAccountItem } from '../../types';
import { StandardActionBar } from '../common/StandardActionBar';
import { permissionIntegrationService } from '../../services/permissionIntegrationService';
import { UserRole } from '../../core/vpe/security/SecurityTypes';
import { VGF06SalesReturns } from './VGF06SalesReturns';
import { CustomerMasterView } from '../customers/CustomerMasterView';
import { CustomerRecordsModal } from '../customers/CustomerRecordsModal';
import { CustomerBalancesHubModal } from '../customers/CustomerBalancesHubModal';
import { CustomerStatementReportModal } from '../customers/CustomerStatementReportModal';
import { CustomerBalancesListModal } from '../customers/CustomerBalancesListModal';
import { 
  SalesNavigationModal, 
  SalesNavButton, 
  SalesNavDestination 
} from '../sales/SalesNavigationModal';

interface LiveInputProps {
  value: number | string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  type?: string;
  min?: number;
  step?: string | number;
  placeholder?: string;
  className?: string;
}

const LiveInput: React.FC<LiveInputProps> = ({
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder = '',
  className = '',
  min,
  step
}) => {
  const [localValue, setLocalValue] = useState<string>(() =>
    value === undefined || value === null || value === 0 ? '' : String(value)
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value === undefined || value === null || value === 0 ? '' : String(value));
    }
  }, [value, isFocused]);

  return (
    <input
      type={type}
      value={localValue}
      onChange={e => {
        const val = e.target.value;
        setLocalValue(val);
        onChange(val);
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        if (onBlur) onBlur();
      }}
      min={min}
      step={step}
      placeholder={placeholder}
      className={className}
    />
  );
};

export interface SalesInvoiceReceiptModalProps {
  receipt: SalesInvoice | null;
  onClose: () => void;
  title?: string;
  printButtonLabel?: string;
  badgeText?: string;
  customerLabel?: string;
  sellerLabel?: string;
  itemColLabel?: string;
  qtyColLabel?: string;
  priceColLabel?: string;
  currencySymbol?: string;
  movementType?: 'inward' | 'outward';
  currentUserFallback?: { username?: string; role?: string };
}

export const SalesInvoiceReceiptModal: React.FC<SalesInvoiceReceiptModalProps> = ({
  receipt,
  onClose,
  title = 'معاينة وطباعة الفاتورة',
  printButtonLabel,
  badgeText,
  customerLabel = 'العميل',
  sellerLabel = 'البائع',
  itemColLabel = 'الصنف',
  qtyColLabel = 'الكمية',
  priceColLabel = 'السعر',
  currencySymbol = '$',
  movementType,
  currentUserFallback = { username: 'المسؤول', role: 'admin' },
}) => {
  if (!receipt) return null;

  const triggerPrintExecution = () => {
    try {
      if (typeof window !== 'undefined') {
        window.focus();
        setTimeout(() => {
          window.print();
        }, 50);
      }
    } catch (err) {
      console.error('Failed to trigger window.print():', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div id="printable-invoice" className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-3 text-right" dir="rtl">
          {/* Cancelled Invoice Banner */}
          {receipt.status === 'cancelled' && (
            <div className="p-3 bg-rose-500/10 border-2 border-rose-500/80 rounded-xl text-rose-300 mb-3 text-right space-y-1.5 print-cancelled-banner">
              <div className="flex items-center space-x-2 space-x-reverse font-black text-sm text-rose-400">
                <Ban className="w-5 h-5 text-rose-500 shrink-0" />
                <span>
                  {movementType
                    ? (movementType === 'inward' ? 'سند وارد ملغي (CANCELLED INWARD VOUCHER)' : 'سند صادر ملغي (CANCELLED OUTWARD VOUCHER)')
                    : 'فاتورة ملغاة (CANCELLED SALES INVOICE)'}
                </span>
              </div>
              <div className="text-[11px] grid grid-cols-2 gap-2 pt-2 border-t border-rose-500/30 text-slate-300">
                <div>
                  <span className="text-slate-400">رقم المستند الأصلي: </span>
                  <strong className="text-rose-300 font-mono">{receipt.invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400">ألغيت بواسطة: </span>
                  <strong className="text-rose-300">
                    {receipt.cancelledBy || currentUserFallback.username} ({receipt.cancelledByRole || currentUserFallback.role})
                  </strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">تاريخ وتوقيت الإلغاء: </span>
                  <strong className="text-rose-300 font-mono">
                    {receipt.cancelledAt ? new Date(receipt.cancelledAt).toLocaleString('ar-EG') : new Date().toLocaleString('ar-EG')}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-slate-100 text-sm">{receipt.invoiceNumber}</span>
              <p className="text-[10px] text-slate-400">{customerLabel}: {receipt.customerName}</p>
              {receipt.warehouseName && (
                <p className="text-[10px] text-slate-400">المخزن: {receipt.warehouseName}</p>
              )}
              {receipt.treasuryName && (
                <p className="text-[10px] text-slate-400">الخزينة: {receipt.treasuryName}</p>
              )}
              {receipt.sellerName && (
                <p className="text-[10px] text-slate-400">{sellerLabel}: {receipt.sellerName}</p>
              )}
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400">{new Date(receipt.createdAt).toLocaleString('ar-EG')}</span>
              <p className="text-[10px] text-amber-400 font-bold uppercase">
                {badgeText || (receipt.mode === 'standard' ? 'وضع قياسي' : receipt.mode === 'pos' ? 'POS' : 'أزرار')}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-1 text-right">{itemColLabel}</th>
                <th className="py-1 text-center">{qtyColLabel}</th>
                <th className="py-1 text-left">{priceColLabel}</th>
                <th className="py-1 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {receipt.lineItems.map(item => (
                <tr key={item.id} className="text-slate-200">
                  <td className="py-1.5 font-sans font-semibold text-right">
                    <div>{item.productName}</div>
                    {item.notes && (
                      <div className="text-[10px] text-slate-400 font-normal">{item.notes}</div>
                    )}
                    {item.bonusQuantity && item.bonusQuantity > 0 ? (
                      <div className="text-[10px] text-amber-400 font-mono font-normal">بونص: +{item.bonusQuantity}</div>
                    ) : null}
                  </td>
                  <td className="py-1.5 text-center">
                    <div>{item.quantity}</div>
                    {item.subUnit && (item.subQuantity || 0) > 0 ? (
                      <div className="text-[10px] text-cyan-400 font-mono">+{item.subQuantity} {item.subUnit}</div>
                    ) : null}
                  </td>
                  <td className="py-1.5 text-left">{currencySymbol}{item.unitPrice.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-1.5 text-left font-bold">{currencySymbol}{((item.quantity * item.unitPrice) - (item.discountAmount || 0)).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Breakdown - Only show fields actually used */}
          {(() => {
            const totalDiscountAmount = receipt.totalDiscount || 0;
            const isGeneralDiscount = (receipt.invoiceDiscountValue || 0) > 0;

            return (
              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>الإجمالي قبل الخصم:</span>
                  <span>{currencySymbol}{receipt.subtotal.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>
                      {isGeneralDiscount
                        ? `خصم الفاتورة${receipt.invoiceDiscountType === 'percent' && receipt.invoiceDiscountValue ? ` (${receipt.invoiceDiscountValue}%)` : ''}:`
                        : 'خصم الأصناف:'}
                    </span>
                    <span>-{currencySymbol}{totalDiscountAmount.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                {(totalDiscountAmount > 0 || (receipt.taxDiscount || 0) > 0) && (
                  <div className="flex justify-between text-amber-300 font-bold border-t border-b border-slate-800/80 py-1">
                    <span>صافي المبلغ بعد الخصم:</span>
                    <span>{currencySymbol}{receipt.netBeforeTax.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                {receipt.isTaxInvoice === true && receipt.totalTax > 0 && (
                  <div className="flex justify-between text-sky-400">
                    <span>ضريبة القيمة المضافة (14%):</span>
                    <span>+{currencySymbol}{receipt.totalTax.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                {receipt.taxDiscount > 0 && (receipt.taxDiscountRate || 0) > 0 && (
                  <div className="flex justify-between text-rose-300">
                    <span>الخصم الضريبي ({receipt.taxDiscountRate}%):</span>
                    <span>-{currencySymbol}{receipt.taxDiscount.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="h-px bg-slate-800 my-1" />

                <div className="flex justify-between text-slate-100 text-sm font-black pt-1">
                  <span>الإجمالي النهائي:</span>
                  <span className="text-emerald-400">{currencySymbol}{receipt.grandTotal.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Payment Info Breakdown */}
                {(receipt.paymentMethod || receipt.cashPaid > 0 || receipt.cardPaid > 0) && (
                  <div className="pt-2 mt-2 border-t border-slate-800 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>طريقة الدفع / المعاملة:</span>
                      <span className="font-bold">
                        {receipt.paymentMethod === 'cash' ? 'نقداً' :
                         receipt.paymentMethod === 'card' ? 'بطاقة / POS' :
                         receipt.paymentMethod === 'mixed' ? 'مزدوج (نقداً + بطاقة)' :
                         receipt.paymentMethod === 'deferred' ? 'آجل' : 'نقداً'}
                      </span>
                    </div>
                    {receipt.cashPaid > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>المبلغ المدفوع (نقداً):</span>
                        <span>{currencySymbol}{receipt.cashPaid.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {receipt.cardPaid > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>المبلغ المدفوع (بطاقة):</span>
                        <span>{currencySymbol}{receipt.cardPaid.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {receipt.changeDue > 0 && (
                      <div className="flex justify-between text-amber-300 font-bold">
                        <span>الباقي:</span>
                        <span>{currencySymbol}{receipt.changeDue.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="flex items-center justify-between pt-2 no-print">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1 space-x-reverse">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {receipt.status === 'cancelled'
                ? 'مستند ملغي محفوظ لأغراض التدقيق'
                : 'جاهز للطباعة أو التصدير'}
            </span>
          </span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={triggerPrintExecution}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 space-x-reverse cursor-pointer shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{printButtonLabel || 'طباعة الفاتورة'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VGF06SalesEntryModes: React.FC<{ 
  onClose?: () => void;
  onNavigateSection?: (section: any) => void;
}> = ({ onClose, onNavigateSection }) => {
  const [salesState, setSalesState] = useState<SalesEntryState>(salesEntryService.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab mode state
  const [activeTab, setActiveTab] = useState<'sales_terminal' | 'open_invoices' | 'reports_integration' | 'sales_returns'>('sales_terminal');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState<boolean>(false);
  const tabDropdownRef = useRef<HTMLDivElement>(null);

  // Entry mode dropdown state (Header)
  const [isEntryModeDropdownOpen, setIsEntryModeDropdownOpen] = useState<boolean>(false);
  const entryModeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tabDropdownRef.current && !tabDropdownRef.current.contains(e.target as Node)) {
        setIsTabDropdownOpen(false);
      }
      if (entryModeDropdownRef.current && !entryModeDropdownRef.current.contains(e.target as Node)) {
        setIsEntryModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync state whenever customer master changes
  useEffect(() => {
    const unsubscribe = customerService.subscribe(() => {
      setSalesState(salesEntryService.getState());
    });
    return () => unsubscribe();
  }, []);

  // Search & Filter state for Button Mode
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [buttonSearchQuery, setButtonSearchQuery] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // POS Scanner Input State
  const [posScanInput, setPosScanInput] = useState<string>('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Standard Mode Search Input State
  const [standardSearchQuery, setStandardSearchQuery] = useState<string>('');

  // Inventory Stock & Products Browser Modal State
  const [isInventoryBrowserOpen, setIsInventoryBrowserOpen] = useState<boolean>(false);
  const [inventoryModalSearch, setInventoryModalSearch] = useState<string>('');
  const [inventorySelectedCategory, setInventorySelectedCategory] = useState<string>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [focusedProductInBrowser, setFocusedProductInBrowser] = useState<ProductItem | null>(null);

  // All Warehouses Stock Balance Query Modal State
  const [isAllWarehousesStockModalOpen, setIsAllWarehousesStockModalOpen] = useState<boolean>(false);
  const [selectedProductForWarehouseQuery, setSelectedProductForWarehouseQuery] = useState<ProductItem | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed' | 'deferred'>('cash');
  const [cashAmountPaid, setCashAmountPaid] = useState<string>('');
  const [cardAmountPaid, setCardAmountPaid] = useState<string>('');
  const [creditAmountPaid, setCreditAmountPaid] = useState<string>('');
  const [calcReceivedAmount, setCalcReceivedAmount] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>('BK-01');
  const [completedReceipt, setCompletedReceipt] = useState<SalesInvoice | null>(null);

  // Customer Selector Modal & Search/Creation State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isAddCustomerFormOpen, setIsAddCustomerFormOpen] = useState<boolean>(false);
  const [editingCustomerIdForModal, setEditingCustomerIdForModal] = useState<string | null>(null);
  const [customCashName, setCustomCashName] = useState<string>('');
  const [selectedCustomerCategory, setSelectedCustomerCategory] = useState<'Retail' | 'Wholesale' | 'Corporate' | 'VIP'>('Retail');

  // Quick Customer Dropdown on Customer Rectangle
  const [isCustomerQuickDropdownOpen, setIsCustomerQuickDropdownOpen] = useState<boolean>(false);
  const [customerQuickSearchQuery, setCustomerQuickSearchQuery] = useState<string>('');
  const customerDropdownRef = useRef<HTMLDivElement | null>(null);
  const customerQuickSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Quick Invoice Search by Number Popover State
  const [isInvoiceSearchOpen, setIsInvoiceSearchOpen] = useState<boolean>(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  const [invoiceSearchError, setInvoiceSearchError] = useState<string | null>(null);
  const invoiceSearchRef = useRef<HTMLDivElement | null>(null);
  const invoiceSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Native Date Picker Input Ref
  const nativeDateInputRef = useRef<HTMLInputElement | null>(null);

  // Receipt Preview Visible / Hidden State (Show / Hide Toggle - Hidden by default)
  const [isReceiptVisible, setIsReceiptVisible] = useState<boolean>(false);

  // Global Bonus Mode State for Line Items Table
  const [isBonusMode, setIsBonusMode] = useState<boolean>(false);

  const handleUpdateBonus = (lineId: string, bonusQty: number) => {
    const res = salesEntryService.updateLineBonusQuantity(lineId, bonusQty);
    if (!res.success) {
      showToast(res.error || 'تعذر تعديل البونص', 1000);
    }
    setSalesState(salesEntryService.getState());
  };

  // Price Tier / Type State (Retail by default)
  const [priceType, setPriceType] = useState<string>('retail');

  // Customer Selection State for Sales Invoice Modal
  const [highlightedCustomerId, setHighlightedCustomerId] = useState<string | null>(null);

  // User Role Authorization Context State
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    username: string;
    fullName: string;
    role: UserRole;
    branchId?: string;
  }>({
    id: 'USR-001',
    username: 'alex.mercer',
    fullName: 'Alex Mercer',
    role: 'SUPER_ADMIN'
  });

  // Warehouses data sources - direct sync with unified warehouseService
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>(() => warehouseService.getAllWarehouses());

  useEffect(() => {
    const unsub = warehouseService.subscribe(() => {
      setAllWarehouses(warehouseService.getAllWarehouses());
    });
    return unsub;
  }, []);

  const availableWarehouses = useMemo<WarehouseItem[]>(() => {
    try {
      const currentBranchId = salesState.activeInvoice?.branchId || currentUser.branchId || branchService.getCurrentBranch()?.id;
      const list = warehouseService.getAvailableWarehousesForUser(
        currentUser.id || currentUser.username,
        currentUser.role,
        currentBranchId
      );
      return list.map(w => ({
        id: w.id,
        code: w.code,
        name: w.name,
        branch: w.branchName,
        manager: 'أمين المستودع',
        transactionCount: 0,
        internalId: w.id
      }));
    } catch {
      return [];
    }
  }, [allWarehouses, currentUser, salesState.activeInvoice?.branchId]);

  // Cash Treasury data sources - direct sync with unified treasuryService
  const [allTreasuries, setAllTreasuries] = useState<Treasury[]>(() => treasuryService.getAllTreasuries());

  useEffect(() => {
    const unsub = treasuryService.subscribe(() => {
      setAllTreasuries(treasuryService.getAllTreasuries());
    });
    return unsub;
  }, []);

  const availableTreasuries = useMemo<TreasuryItem[]>(() => {
    try {
      const list = treasuryService.getAvailableTreasuriesForUser(
        currentUser.id || currentUser.username,
        currentUser.role
      );
      return list.map(t => ({
        id: t.id,
        code: t.code,
        name: t.name,
        branchId: t.branchId,
        currency: t.currency
      }));
    } catch {
      return [];
    }
  }, [allTreasuries, currentUser]);

  // Bank Accounts data source from system bank module
  const availableBankAccounts = useMemo<BankAccountItem[]>(() => {
    try {
      return setupWizardService.getConfig().bankAccounts || [];
    } catch {
      return [];
    }
  }, []);

  const currentInvoiceTreasury = useMemo(() => {
    const tId = salesState.activeInvoice.treasuryId;
    const tName = salesState.activeInvoice.treasuryName;
    if (tId) {
      const found = allTreasuries.find(t => t.id === tId || t.code === tId);
      return {
        id: tId,
        code: found?.code || tId,
        name: tName || (found ? found.name : tId),
        currency: found?.currency || 'جنيه مصري (EGP)'
      };
    }
    if (tName) {
      const found = allTreasuries.find(t => t.name === tName);
      return {
        id: found?.id || 'TR-01',
        code: found?.code || 'TR-001',
        name: tName,
        currency: found?.currency || 'جنيه مصري (EGP)'
      };
    }
    if (availableTreasuries.length > 0) {
      return availableTreasuries[0];
    }
    return { id: 'TR-01', code: 'TR-001', name: 'الخزينة الرئيسية - الصندوق العام (HQ Vault)', currency: 'جنيه مصري (EGP)' };
  }, [salesState.activeInvoice.treasuryId, salesState.activeInvoice.treasuryName, availableTreasuries, allTreasuries]);

  const currentInvoiceWarehouse = useMemo(() => {
    const wId = salesState.activeInvoice.warehouseId;
    const wName = salesState.activeInvoice.warehouseName;
    if (wId) {
      const found = availableWarehouses.find(w => w.id === wId || w.code === wId);
      return {
        id: wId,
        code: found?.code || wId,
        name: wName || (found ? found.name : wId)
      };
    }
    if (wName) {
      const found = availableWarehouses.find(w => w.name === wName);
      return {
        id: found?.id || 'WH-01',
        code: found?.code || 'WH-MAIN-NY',
        name: wName
      };
    }
    if (availableWarehouses.length > 0) {
      return availableWarehouses[0];
    }
    return { id: 'WH-01', code: 'WH-MAIN-NY', name: 'المستودع الرئيسي' };
  }, [salesState.activeInvoice.warehouseId, salesState.activeInvoice.warehouseName, availableWarehouses]);

  const getProductStockInSpecificWarehouse = useCallback((p: ProductItem, targetWarehouse: WarehouseItem | { id?: string; code?: string; name?: string }) => {
    return salesEntryService.getProductStockInWarehouse(p, targetWarehouse);
  }, []);

  const getProductWarehouseStock = useCallback((p: ProductItem) => {
    return getProductStockInSpecificWarehouse(p, currentInvoiceWarehouse);
  }, [getProductStockInSpecificWarehouse, currentInvoiceWarehouse]);

  const handleOpenAllWarehousesStockModal = useCallback(() => {
    // Determine the product currently selected or focused
    let target: ProductItem | null = focusedProductInBrowser;
    if (!target && selectedProductIds.size > 0) {
      const firstId = Array.from(selectedProductIds)[0];
      target = (salesState.products || []).find(p => p.id === firstId) || null;
    }

    if (!target) {
      showToast('اختر صنفًا أولًا لعرض أرصدته في جميع المخازن.');
      return;
    }

    setSelectedProductForWarehouseQuery(target);
    setIsAllWarehousesStockModalOpen(true);
  }, [focusedProductInBrowser, selectedProductIds, salesState.products]);

  const isSellerMandatory = useMemo(() => {
    try {
      const config = setupWizardService.getConfig() as any;
      if (config?.requireSeller !== undefined) return Boolean(config.requireSeller);
      if (config?.isSellerMandatory !== undefined) return Boolean(config.isSellerMandatory);
      if (config?.salesSettings?.requireSeller !== undefined) return Boolean(config.salesSettings.requireSeller);
      const stored = localStorage.getItem('vertex_require_seller_setting');
      if (stored !== null) return stored === 'true';
      return false;
    } catch {
      return false;
    }
  }, []);

  const availableSellers = useMemo(() => {
    try {
      const list = customerService.getSellersList();
      return list.map((s, idx) => ({
        id: `SELLER-${idx + 1}`,
        name: s,
        code: `SLR-${String(idx + 1).padStart(3, '0')}`
      }));
    } catch {
      return [];
    }
  }, [salesState.customers]);

  const cashCustomer = useMemo(() => customerService.getSystemCashCustomer(), []);

  const isCashCustomer = useMemo(() => {
    const custId = salesState.activeInvoice.customerId;
    const custName = salesState.activeInvoice.customerName;
    if (custId === cashCustomer.id || custId === 'CUST-CASH-001' || custName === 'عميل نقدي') {
      return true;
    }
    const found = (salesState.customers || []).find(c => c.id === custId);
    if (found && (found.isSystemCashCustomer || found.type === 'عميل نقدي' || found.id === cashCustomer.id)) {
      return true;
    }
    return false;
  }, [salesState.activeInvoice.customerId, salesState.activeInvoice.customerName, salesState.customers, cashCustomer]);

  useEffect(() => {
    const activeCust = salesState.customers.find(c => c.id === salesState.activeInvoice.customerId);
    if (activeCust && activeCust.category) {
      setSelectedCustomerCategory(activeCust.category as any);
    }
  }, [salesState.activeInvoice.customerId, salesState.customers]);

  useEffect(() => {
    if (isCashCustomer) {
      if (salesState.activeInvoice.customerName !== 'عميل نقدي') {
        setCustomCashName(salesState.activeInvoice.customerName);
      }
    } else {
      setCustomCashName('');
    }
  }, [salesState.activeInvoice.customerId, salesState.activeInvoice.customerName, isCashCustomer]);

  const handleSelectCashCustomer = () => {
    const cashCust = customerService.getSystemCashCustomer();
    salesEntryService.setCustomer(cashCust);
    setSalesState(salesEntryService.getState());
    setIsCustomerModalOpen(false);
    setIsAddCustomerFormOpen(false);
  };

  // Reports Modal State
  const [activeReportModal, setActiveReportModal] = useState<'pos_perf' | 'button_usage' | 'speed_audit' | 'mode_stats' | 'module_integration' | null>(null);

  // Edit Invoice Confirmation Modal State
  const [editConfirmModal, setEditConfirmModal] = useState<{
    isOpen: boolean;
    invoice: SalesInvoice | null;
  }>({ isOpen: false, invoice: null });

  // Save Edited Invoice Confirmation Modal State
  const [saveEditConfirmModal, setSaveEditConfirmModal] = useState<{
    isOpen: boolean;
    actionType: 'save_only' | 'complete_and_print' | null;
  }>({ isOpen: false, actionType: null });

  // Delete Invoice Confirmation Modal State (Only for held/pending draft invoices)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    invoiceId?: string;
    invoiceNumber?: string;
    customerName?: string;
  }>({ isOpen: false, type: 'single' });

// User Presets for dynamic RBAC Authorization Testing
const AUTH_USERS_PRESETS: { username: string; fullName: string; role: UserRole; label: string }[] = [
  { username: 'alex.mercer', fullName: 'Alex Mercer', role: 'SUPER_ADMIN', label: 'Alex Mercer (Super Admin — All Warehouses)' },
  { username: 'elena.rodriguez', fullName: 'Elena Rodriguez', role: 'FINANCE_MANAGER', label: 'Elena Rodriguez (Finance Manager — NY Hub Only)' },
  { username: 'marcus.vance', fullName: 'Marcus Vance', role: 'INVENTORY_AUDITOR', label: 'Marcus Vance (Inventory Auditor — NY & London)' },
  { username: 'john.cashier', fullName: 'John Cashier', role: 'GENERAL_USER', label: 'John Cashier (POS Cashier — NY Hub Only)' },
  { username: 'sarah.jenkins', fullName: 'Sarah Jenkins', role: 'COMPLIANCE_OFFICER', label: 'Sarah Jenkins (Compliance — Audit Only)' },
  { username: 'guest.user', fullName: 'Guest User', role: 'READ_ONLY_GUEST', label: 'Guest User (Read-Only — Blocked)' }
];

  // Cancel Invoice Confirmation Modal State
  const [cancelConfirmModal, setCancelConfirmModal] = useState<{
    isOpen: boolean;
    invoice: SalesInvoice | null;
  }>({ isOpen: false, invoice: null });

  // Close Screen Unsaved Changes Confirmation Modal State
  const [isCloseConfirmModalOpen, setIsCloseConfirmModalOpen] = useState<boolean>(false);
  // Track whether close confirmation is for Level 1 or Level 2 (Exit to Main Interface)
  const [isPendingExitToMain, setIsPendingExitToMain] = useState<boolean>(false);

  // Sales Navigation Section State (Persistent Sales Sidebar on Right)
  // 1: فاتورة بيع | 2: مرتجعات البيع | 3: أرصدة العملاء | 4: كشف حساب عميل | 5: بيانات العملاء | 6: تقارير المبيعات | 7: إحصائيات المبيعات
  const [activeSalesSection, setActiveSalesSection] = useState<'sales_terminal' | 'sales_returns' | 'customer_balances' | 'customer_statement' | 'customer_records' | 'sales_reports' | 'sales_stats'>('sales_terminal');

  // Sales Navigation Modal State (Legacy modal kept false so screen opens directly into Sales Invoice)
  const [isSalesNavModalOpen, setIsSalesNavModalOpen] = useState<boolean>(false);

  // Customer Balances & Statements Hub Modal State
  const [isCustomerBalancesHubOpen, setIsCustomerBalancesHubOpen] = useState<boolean>(false);
  // Large Customer Statement Report Screen State
  const [isCustomerStatementReportOpen, setIsCustomerStatementReportOpen] = useState<boolean>(false);
  // Customer Balances List Modal State
  const [isCustomerBalancesListOpen, setIsCustomerBalancesListOpen] = useState<boolean>(false);
  // Target customer ID for statement report
  const [statementTargetCustomerId, setStatementTargetCustomerId] = useState<string>('');

  // Customer Records & Selection Modal State (Used for selecting customer in invoices)
  const [isCustomerRecordsModalOpen, setIsCustomerRecordsModalOpen] = useState<boolean>(false);

  // New Invoice Unsaved Changes Confirmation Modal State
  const [isNewInvoiceConfirmModalOpen, setIsNewInvoiceConfirmModalOpen] = useState<boolean>(false);

  // Profitability Popover / Modal State (Authorized users only)
  const [profitModal, setProfitModal] = useState<{
    isOpen: boolean;
    data: InvoiceProfitabilityResult | null;
    invoiceNumber: string;
  }>({
    isOpen: false,
    data: null,
    invoiceNumber: ''
  });

  const handleNetDoubleClick = (invoice: SalesInvoice) => {
    const perm = permissionIntegrationService.checkPermission(currentUser.role, 'PERM_ACT_VIEW_INVOICE_PROFIT');
    if (!perm.granted) {
      // Must do nothing at all for unauthorized users (no toast / no error)
      return;
    }
    const profitData = salesEntryService.calculateInvoiceProfitability(invoice, currentUser.role, currentUser.username);
    if (profitData.allowed) {
      setProfitModal({
        isOpen: true,
        data: profitData,
        invoiceNumber: invoice.invoiceNumber
      });
    }
  };

  // Saved Invoices History Filter States
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [historyPaymentStatus, setHistoryPaymentStatus] = useState<'all' | 'paid' | 'deferred' | 'cancelled'>('all');
  const [historyPaymentMethod, setHistoryPaymentMethod] = useState<'all' | 'cash' | 'card' | 'mixed' | 'deferred'>('all');

  const [appliedHistoryFilters, setAppliedHistoryFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    paymentStatus: 'all' as 'all' | 'paid' | 'deferred' | 'cancelled',
    paymentMethod: 'all' as 'all' | 'cash' | 'card' | 'mixed' | 'deferred'
  });

  const handleApplyHistoryFilters = () => {
    setAppliedHistoryFilters({
      search: historySearch,
      startDate: historyStartDate,
      endDate: historyEndDate,
      paymentStatus: historyPaymentStatus,
      paymentMethod: historyPaymentMethod
    });
  };

  const handleResetHistoryFilters = () => {
    setHistorySearch('');
    setHistoryStartDate('');
    setHistoryEndDate('');
    setHistoryPaymentStatus('all');
    setHistoryPaymentMethod('all');
    setAppliedHistoryFilters({
      search: '',
      startDate: '',
      endDate: '',
      paymentStatus: 'all',
      paymentMethod: 'all'
    });
  };

  const handleExecuteCancelInvoice = (inv: SalesInvoice) => {
    const result = salesEntryService.cancelCompletedInvoice(
      inv.id,
      currentUser.username,
      currentUser.role
    );

    if (result.success) {
      setSalesState(salesEntryService.getState());
      setCancelConfirmModal({ isOpen: false, invoice: null });
      showToast(result.message);
    } else {
      showToast(result.message);
    }
  };

  const filteredCompletedInvoices = useMemo(() => {
    const list = salesState.completedInvoices || [];
    if (list.length === 0) return [];

    const filtered = list.filter(inv => {
      // 1. Search by invoice number or customer name
      if (appliedHistoryFilters.search.trim() !== '') {
        const q = appliedHistoryFilters.search.trim().toLowerCase();
        const matchInvNumber = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchCustomer = inv.customerName?.toLowerCase().includes(q);
        if (!matchInvNumber && !matchCustomer) return false;
      }

      // 2. Start Date
      if (appliedHistoryFilters.startDate) {
        const invDate = new Date(inv.createdAt);
        const filterStart = new Date(appliedHistoryFilters.startDate);
        filterStart.setHours(0, 0, 0, 0);
        if (isNaN(invDate.getTime()) || invDate < filterStart) return false;
      }

      // 3. End Date
      if (appliedHistoryFilters.endDate) {
        const invDate = new Date(inv.createdAt);
        const filterEnd = new Date(appliedHistoryFilters.endDate);
        filterEnd.setHours(23, 59, 59, 999);
        if (isNaN(invDate.getTime()) || invDate > filterEnd) return false;
      }

      // 4. Payment / Invoice Status
      if (appliedHistoryFilters.paymentStatus === 'paid') {
        if (inv.status === 'cancelled' || inv.paymentMethod === 'deferred') return false;
      } else if (appliedHistoryFilters.paymentStatus === 'deferred') {
        if (inv.status === 'cancelled' || inv.paymentMethod !== 'deferred') return false;
      } else if (appliedHistoryFilters.paymentStatus === 'cancelled') {
        if (inv.status !== 'cancelled') return false;
      }

      // 5. Payment Method
      if (appliedHistoryFilters.paymentMethod !== 'all') {
        if (inv.paymentMethod !== appliedHistoryFilters.paymentMethod) return false;
      }

      return true;
    });

    // Default chronological sorting: Newest first (Descending by actual invoice date / timestamp)
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      const validA = !isNaN(timeA);
      const validB = !isNaN(timeB);

      if (validA && validB) {
        return timeB - timeA; // Descending (الأحدث أولاً)
      }
      if (validA) return -1;
      if (validB) return 1;
      return 0;
    });
  }, [salesState.completedInvoices, appliedHistoryFilters]);

  const hasActiveHistoryFilters =
    appliedHistoryFilters.search !== '' ||
    appliedHistoryFilters.startDate !== '' ||
    appliedHistoryFilters.endDate !== '' ||
    appliedHistoryFilters.paymentStatus !== 'all' ||
    appliedHistoryFilters.paymentMethod !== 'all';

  useEffect(() => {
    setSalesState(salesEntryService.getState());
  }, []);

  // Reset receipt preview and Bonus Mode to default (OFF) whenever active invoice ID changes
  useEffect(() => {
    setIsReceiptVisible(false);
    setIsBonusMode(false);
  }, [salesState.activeInvoice?.id]);

  // Click outside listener for quick customer dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerQuickDropdownOpen(false);
      }
      if (
        invoiceSearchRef.current &&
        !invoiceSearchRef.current.contains(event.target as Node)
      ) {
        setIsInvoiceSearchOpen(false);
      }
    };
    if (isCustomerQuickDropdownOpen || isInvoiceSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomerQuickDropdownOpen, isInvoiceSearchOpen]);

  useEffect(() => {
    // Keep focus on scan input in POS mode
    if (salesState.currentMode === 'pos' && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [salesState.currentMode]);

  const showToast = (msg: string, durationMs: number = 1000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), durationMs);
  };

  const handleModeSwitch = (mode: SalesEntryMode) => {
    salesEntryService.switchMode(mode);
    setSalesState(salesEntryService.getState());
  };

  // Continuous POS Barcode / Serial Scan handler
  const handlePosScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = posScanInput.trim();
      if (!query) return;
      
      const scanResult = salesEntryService.scanBarcodeOrSerial(query);
      if (!scanResult.success) {
        showToast(scanResult.error || `الرقم التسلسلي/الباركود '${query}' غير مسجل في النظام!`);
      } else {
        if (scanResult.matchedSerial) {
          showToast(`تم التعرف على الجهاز بالرقم التسلسلي (${scanResult.matchedSerial}): ${scanResult.product?.name}`);
        }
      }
      setPosScanInput('');
      setSalesState(salesEntryService.getState());
    }
  };

  const handleQuickAddProduct = (p: ProductItem, qty: number = 1) => {
    const result = salesEntryService.addProductToActiveInvoice(p, qty);
    if (!result.success) {
      showToast(result.error || 'تعذر إضافة الصنف');
      return;
    }
    setSalesState(salesEntryService.getState());
  };

  const handleAddSelectedProducts = () => {
    if (selectedProductIds.size === 0) return;
    const selectedList = products.filter(p => selectedProductIds.has(p.id));
    let addedCount = 0;
    let lastError = '';

    for (const p of selectedList) {
      const result = salesEntryService.addProductToActiveInvoice(p, 1);
      if (result.success) {
        addedCount++;
      } else {
        lastError = result.error || 'تعذر إضافة صنف';
      }
    }

    setSalesState(salesEntryService.getState());
    if (lastError && addedCount < selectedList.length) {
      setTimeout(() => showToast(lastError), 1000);
    }
    setSelectedProductIds(new Set());
    setIsInventoryBrowserOpen(false);
  };

  const handleUpdateQty = (lineId: string, delta: number) => {
    const line = salesState.activeInvoice.lineItems.find(l => l.id === lineId);
    if (line) {
      const newQty = line.quantity + delta;
      if (newQty < 0) {
        return;
      }
      if (newQty === 0 && (!line.bonusQuantity || line.bonusQuantity <= 0)) {
        salesEntryService.removeLineItem(lineId);
        setSalesState(salesEntryService.getState());
        return;
      }
      const result = salesEntryService.updateLineQuantity(lineId, newQty);
      if (!result.success) {
        showToast(result.error || 'تعذر تعديل الكمية');
        return;
      }
      setSalesState(salesEntryService.getState());
    }
  };

  const handleUpdateSubQty = (lineId: string, delta: number) => {
    const line = salesState.activeInvoice.lineItems.find(l => l.id === lineId);
    if (line) {
      const currentSub = line.subQuantity || 0;
      const newSubQty = Math.max(0, currentSub + delta);
      salesEntryService.updateLineSubQuantity(lineId, newSubQty);
      setSalesState(salesEntryService.getState());
    }
  };

  const handleApplyDiscount = (lineId: string, percentage: number) => {
    const line = salesState.activeInvoice.lineItems.find(l => l.id === lineId);
    if (line) {
      salesEntryService.updateLineDiscount(lineId, percentage, 'percent');
      setSalesState(salesEntryService.getState());
    }
  };

  const handleHoldInvoice = () => {
    if (salesState.activeInvoice.lineItems.length === 0 && !salesState.activeInvoice.wasHeld) {
      showToast('لا يمكن تعليق فاتورة جديدة فارغة.');
      return;
    }
    const held = salesEntryService.holdActiveInvoice();
    setSalesState(salesEntryService.getState());
    setIsReceiptVisible(false);
    showToast(`تم تعليق الفاتورة رقم ${held.invoiceNumber}`);
  };

  const handleResumeInvoice = (invId: string) => {
    salesEntryService.resumeHeldInvoice(invId);
    setSalesState(salesEntryService.getState());
    setIsReceiptVisible(false);
    setIsBonusMode(false);
    setActiveTab('sales_terminal');
  };

  const handleSelectCustomer = (c: Customer) => {
    if (!customerService.isCustomerActive(c)) {
      showToast('هذا العميل معطّل ولا يمكن إنشاء فاتورة بيع له.');
      return;
    }
    const res = salesEntryService.setCustomer(c);
    if (res && !res.success) {
      showToast(res.error || 'هذا العميل معطّل ولا يمكن إنشاء فاتورة بيع له.');
      return;
    }
    if (c.assignedSeller) {
      salesEntryService.setSeller(c.assignedSeller, c.assignedSeller);
    }
    setSalesState(salesEntryService.getState());
    setIsCustomerModalOpen(false);
  };

  const targetCustomer = useMemo(() => {
    return (
      salesState.customers?.find(c => c.id === salesState.activeInvoice.customerId) ||
      customerService.getCustomerById(salesState.activeInvoice.customerId)
    );
  }, [salesState.activeInvoice.customerId, salesState.customers]);

  const quickFilteredCustomers = useMemo(() => {
    const activePermanent = (salesState.customers || []).filter(
      c => !c.isSystemCashCustomer && c.id !== 'CUST-CASH-001' && c.type !== 'عميل نقدي' && customerService.isCustomerActive(c)
    );
    if (!customerQuickSearchQuery.trim()) {
      return activePermanent;
    }
    const q = customerQuickSearchQuery.toLowerCase().trim();
    return activePermanent.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.commercialRegister && c.commercialRegister.toLowerCase().includes(q)) ||
      (c.taxNumber && c.taxNumber.toLowerCase().includes(q))
    );
  }, [salesState.customers, customerQuickSearchQuery]);

  // Existing Invoices query for quick invoice number search
  const allAvailableInvoices = useMemo(() => {
    const completed = (salesState.completedInvoices || []).map(inv => ({ ...inv, source: 'completed' as const }));
    const open = (salesState.openInvoices || []).map(inv => ({ ...inv, source: 'held' as const }));
    return [...completed, ...open].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
      return 0;
    });
  }, [salesState.completedInvoices, salesState.openInvoices]);

  const filteredExistingInvoices = useMemo(() => {
    if (!invoiceSearchQuery.trim()) {
      return allAvailableInvoices;
    }
    const q = invoiceSearchQuery.trim().toLowerCase();
    return allAvailableInvoices.filter(inv =>
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customerName?.toLowerCase().includes(q) ||
      inv.id?.toLowerCase().includes(q)
    );
  }, [allAvailableInvoices, invoiceSearchQuery]);

  const handleLoadFoundInvoice = (inv: SalesInvoice, source: 'completed' | 'held') => {
    if (source === 'completed') {
      salesEntryService.loadCompletedInvoiceForEdit(inv.id);
    } else {
      salesEntryService.resumeHeldInvoice(inv.id);
    }
    setSalesState(salesEntryService.getState());
    setIsReceiptVisible(false);
    setIsBonusMode(false);
    setIsInvoiceSearchOpen(false);
    setInvoiceSearchQuery('');
    setInvoiceSearchError(null);
    showToast(`تم تحميل بيانات الفاتورة ${inv.invoiceNumber} بنجاح`);
  };

  const handleExecuteInvoiceSearch = () => {
    if (!invoiceSearchQuery.trim()) return;
    const q = invoiceSearchQuery.trim().toLowerCase();
    
    const exact = allAvailableInvoices.find(inv => 
      inv.invoiceNumber?.toLowerCase() === q || inv.id?.toLowerCase() === q
    );
    if (exact) {
      handleLoadFoundInvoice(exact, exact.source);
      return;
    }

    const partials = allAvailableInvoices.filter(inv =>
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customerName?.toLowerCase().includes(q)
    );
    if (partials.length === 1) {
      handleLoadFoundInvoice(partials[0], partials[0].source);
    } else if (partials.length === 0) {
      setInvoiceSearchError('لم يتم العثور على الفاتورة');
    }
  };

  const isCreditAllowed = targetCustomer?.allowCreditSales ?? false;

  // Permission Check for Invoice Date Modification (Can be set per user or branch)
  const canEditInvoiceDate = useMemo(() => {
    const permResult = permissionIntegrationService.checkPermission(currentUser.role, 'PERM_ACT_EDIT_INVOICE_DATE');
    return permResult.granted;
  }, [currentUser.role]);

  const handleInvoiceDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    if (!canEditInvoiceDate) {
      showToast('ليس لديك صلاحية لتعديل تاريخ الفاتورة');
      return;
    }
    // Keep existing time portion intact or construct valid ISO string
    try {
      const existingDate = new Date(activeInvoice.createdAt);
      const [year, month, day] = newDateStr.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        existingDate.setFullYear(year, month - 1, day);
        salesEntryService.setInvoiceDate(existingDate.toISOString());
        setSalesState(salesEntryService.getState());
        showToast(`تم تعيين تاريخ الفاتورة إلى ${newDateStr}`);
      }
    } catch (e) {
      console.error('Failed to parse selected date', e);
    }
  };

  const handleOpenCheckout = () => {
    // Check mandatory seller validation
    if (isSellerMandatory && !salesState.activeInvoice.sellerName && !salesState.activeInvoice.sellerId) {
      showToast('يرجى تحديد البائع أولاً قبل المتابعة للدفع (حقل إجباري حسب إعدادات النظام)', 1500);
      return;
    }

    const val = salesEntryService.validateInvoiceForSale(salesState.activeInvoice);
    if (!val.allowed) {
      showToast(val.error || 'لا يمكن المتابعة للدفع');
      return;
    }
    const inv = salesState.activeInvoice;
    const total = inv.grandTotal;

    // 1. Preserve bank selection if present on active invoice
    if (inv.bankId) {
      setSelectedBankId(inv.bankId);
    }

    // 2. Preserve payment method and breakdown if editing a saved invoice or if already configured
    const isEditingOrHasPayment = salesEntryService.isEditingSavedInvoice() || (inv.paymentMethod !== undefined);

    if (isEditingOrHasPayment && inv.paymentMethod) {
      if (inv.paymentMethod === 'deferred') {
        setCashAmountPaid('0.00');
        setCardAmountPaid('0.00');
        setCreditAmountPaid(total.toFixed(2));
      } else if (inv.paymentMethod === 'card') {
        setCashAmountPaid('0.00');
        setCardAmountPaid(total.toFixed(2));
        setCreditAmountPaid('0.00');
      } else if (inv.paymentMethod === 'cash') {
        setCashAmountPaid(total.toFixed(2));
        setCardAmountPaid('0.00');
        setCreditAmountPaid('0.00');
      } else if (inv.paymentMethod === 'mixed') {
        const cashP = inv.cashPaid || 0;
        const cardP = inv.cardPaid || 0;
        const credP = inv.deferredPaid || 0;
        const sumP = Math.round((cashP + cardP + credP) * 100) / 100;
        const currentTotal = Math.round(total * 100) / 100;

        if (sumP === currentTotal && sumP > 0) {
          setCashAmountPaid(cashP.toFixed(2));
          setCardAmountPaid(cardP.toFixed(2));
          setCreditAmountPaid(credP.toFixed(2));
        } else {
          // If total changed during editing line items
          if (credP > 0 && cashP === 0 && cardP === 0) {
            setCashAmountPaid('0.00');
            setCardAmountPaid('0.00');
            setCreditAmountPaid(total.toFixed(2));
          } else if (cardP > 0 && cashP === 0 && credP === 0) {
            setCashAmountPaid('0.00');
            setCardAmountPaid(total.toFixed(2));
            setCreditAmountPaid('0.00');
          } else if (cashP > 0 && cardP === 0 && credP === 0) {
            setCashAmountPaid(total.toFixed(2));
            setCardAmountPaid('0.00');
            setCreditAmountPaid('0.00');
          } else {
            const covered = Math.min(total, cashP + cardP);
            const rem = Math.max(0, total - covered);
            setCashAmountPaid(cashP.toFixed(2));
            setCardAmountPaid(cardP.toFixed(2));
            setCreditAmountPaid(rem.toFixed(2));
          }
        }
      }
    } else {
      // New blank invoice defaults to Cash
      setCashAmountPaid(total.toFixed(2));
      setCardAmountPaid('0.00');
      setCreditAmountPaid('0.00');
    }

    setCalcReceivedAmount('');
    setIsPaymentModalOpen(true);
  };

  const handleResetPaymentModal = () => {
    const inv = salesState.activeInvoice;
    const total = inv.grandTotal;
    if (inv.paymentMethod === 'deferred') {
      setCashAmountPaid('0.00');
      setCardAmountPaid('0.00');
      setCreditAmountPaid(total.toFixed(2));
    } else if (inv.paymentMethod === 'card') {
      setCashAmountPaid('0.00');
      setCardAmountPaid(total.toFixed(2));
      setCreditAmountPaid('0.00');
    } else if (inv.paymentMethod === 'mixed') {
      setCashAmountPaid((inv.cashPaid || 0).toFixed(2));
      setCardAmountPaid((inv.cardPaid || 0).toFixed(2));
      setCreditAmountPaid((inv.deferredPaid || 0).toFixed(2));
    } else {
      setCashAmountPaid(total.toFixed(2));
      setCardAmountPaid('0.00');
      setCreditAmountPaid('0.00');
    }
    setCalcReceivedAmount('');
  };

  const handleDoubleClickPayment = (targetMethod: 'cash' | 'card' | 'credit') => {
    const total = salesState.activeInvoice.grandTotal;
    const formattedTotal = total.toFixed(2);

    if (targetMethod === 'credit') {
      if (!isCreditAllowed) {
        showToast('البيع الآجل غير مسموح لهذا العميل');
        return;
      }
    }

    // Set the clicked payment field to the full invoice total and zero out all other methods
    setCashAmountPaid(targetMethod === 'cash' ? formattedTotal : '0.00');
    setCardAmountPaid(targetMethod === 'card' ? formattedTotal : '0.00');
    setCreditAmountPaid(targetMethod === 'credit' ? formattedTotal : '0.00');
  };

  const handleCashChange = (valStr: string) => {
    setCashAmountPaid(valStr);
    const newCash = parseFloat(valStr) || 0;
    const cardVal = parseFloat(cardAmountPaid) || 0;
    const creditVal = parseFloat(creditAmountPaid) || 0;
    const total = salesState.activeInvoice.grandTotal;

    if (cardVal > 0 || creditVal > 0) {
      const remainingSpaceForCredit = Math.max(0, total - newCash - cardVal);
      if (creditVal > remainingSpaceForCredit) {
        setCreditAmountPaid(remainingSpaceForCredit > 0 ? remainingSpaceForCredit.toFixed(2) : '0.00');
      }
    }
  };

  const handleCardChange = (valStr: string) => {
    setCardAmountPaid(valStr);
    const newCard = parseFloat(valStr) || 0;
    const cashVal = parseFloat(cashAmountPaid) || 0;
    const creditVal = parseFloat(creditAmountPaid) || 0;
    const total = salesState.activeInvoice.grandTotal;

    const maxSpace = Math.max(0, total - cashVal);
    let effectiveCard = newCard;
    if (effectiveCard > maxSpace) {
      effectiveCard = maxSpace;
      setCardAmountPaid(effectiveCard.toFixed(2));
    }

    const remainingSpaceForCredit = Math.max(0, total - cashVal - effectiveCard);
    if (creditVal > remainingSpaceForCredit) {
      setCreditAmountPaid(remainingSpaceForCredit > 0 ? remainingSpaceForCredit.toFixed(2) : '0.00');
    }
  };

  const handleCreditChange = (valStr: string) => {
    if (!isCreditAllowed) return;
    const newCredit = parseFloat(valStr) || 0;
    const cashVal = parseFloat(cashAmountPaid) || 0;
    const cardVal = parseFloat(cardAmountPaid) || 0;
    const total = salesState.activeInvoice.grandTotal;

    const maxAllowedCredit = Math.max(0, total - cashVal - cardVal);
    let effectiveCredit = newCredit;
    if (effectiveCredit > maxAllowedCredit) {
      effectiveCredit = maxAllowedCredit;
      setCreditAmountPaid(effectiveCredit > 0 ? effectiveCredit.toFixed(2) : '0.00');
    } else {
      setCreditAmountPaid(valStr);
    }
  };

  const handleEnterOnPaymentInput = (source: 'cash' | 'card') => {
    if (!isCreditAllowed) return;
    const cashVal = parseFloat(cashAmountPaid) || 0;
    const cardVal = parseFloat(cardAmountPaid) || 0;
    const total = salesState.activeInvoice.grandTotal;

    const remaining = Math.max(0, total - cashVal - cardVal);
    if (remaining > 0) {
      setCreditAmountPaid(remaining.toFixed(2));
    }
  };

  const triggerPrintExecution = () => {
    try {
      if (typeof window !== 'undefined') {
        window.focus();
        setTimeout(() => {
          window.print();
        }, 50);
      }
    } catch (err) {
      console.error('Failed to trigger window.print():', err);
    }
  };

  const derivePaymentMethod = (cash: number, card: number, credit: number): 'cash' | 'card' | 'mixed' | 'deferred' => {
    if (credit > 0 && cash === 0 && card === 0) return 'deferred';
    if (card > 0 && cash === 0 && credit === 0) return 'card';
    if (cash > 0 && card === 0 && credit === 0) return 'cash';
    return 'mixed';
  };

  const executeSaveInvoiceOnly = () => {
    const cash = parseFloat(cashAmountPaid) || 0;
    const card = parseFloat(cardAmountPaid) || 0;
    const credit = parseFloat(creditAmountPaid) || 0;

    // 1. Warehouse Permission Guard
    const currentWId = salesState.activeInvoice.warehouseId || 'WH-01';
    const whCheck = permissionIntegrationService.canUserAccessWarehouse(currentUser.role, currentWId, currentUser.username);
    if (!whCheck.allowed) {
      showToast(`تم رفض العملية: ${whCheck.reason}`, 1000);
      return;
    }

    // Branch Status & Isolation Guard: Ensure warehouse belongs to active invoice branch
    const allWhs = warehouseService.getAllWarehouses();
    const targetWh = allWhs.find(w => w.id === currentWId);
    const invoiceBranchId = salesState.activeInvoice.branchId || currentUser.branchId || branchService.getCurrentBranch()?.id;
    if (targetWh && targetWh.branchId && invoiceBranchId && targetWh.branchId !== invoiceBranchId) {
      const br = branchService.getBranchById(targetWh.branchId);
      const invBr = branchService.getBranchById(invoiceBranchId);
      showToast(`لا يمكن حفظ فاتورة مبيعات على مخزن تابع لفرع آخر [${br?.name || targetWh.branchId}]. الفاتورة مخصصة لفرع [${invBr?.name || invoiceBranchId}].`, 2000);
      return;
    }
    if (targetWh && targetWh.branchId) {
      const br = branchService.getBranchById(targetWh.branchId);
      if (br && br.status === 'غير نشط') {
        showToast(`لا يمكن حفظ فاتورة مبيعات على مخزن تابع لفرع موقوف/غير نشط [${br.name}].`, 2000);
        return;
      }
    }

    // 2. Treasury Permission Guard
    const currentTId = salesState.activeInvoice.treasuryId || (availableTreasuries[0]?.id || 'TR-01');
    const trCheck = permissionIntegrationService.canUserAccessTreasury(currentUser.role, currentTId, currentUser.username);
    if (!trCheck.allowed) {
      showToast(`تم رفض العملية: ${trCheck.reason}`, 1000);
      return;
    }

    const pMethod = derivePaymentMethod(cash, card, credit);

    const selectedBank = availableBankAccounts.find(b => b.id === selectedBankId);
    if (selectedBank) {
      salesEntryService.setBank(selectedBank.id, selectedBank.bankName);
    }

    const result = salesEntryService.saveInvoiceWithoutPayment(
      pMethod,
      cash,
      card,
      credit,
      currentUser.role,
      currentUser.username
    );
    if (!result.success) {
      showToast(result.error || 'تعذر حفظ الفاتورة', 1000);
      return;
    }
    setSalesState(salesEntryService.getState());
    setIsReceiptVisible(false);
    setIsBonusMode(false);
    setIsPaymentModalOpen(false);
    showToast(`تم حفظ الفاتورة رقم ${result.invoice!.invoiceNumber} بنجاح`, 1000);
  };

  const handleSaveInvoiceOnly = () => {
    const cash = parseFloat(cashAmountPaid) || 0;
    const card = parseFloat(cardAmountPaid) || 0;
    const credit = parseFloat(creditAmountPaid) || 0;

    const totalNeeded = Math.round(salesState.activeInvoice.grandTotal * 100) / 100;
    const totalPaid = Math.round((cash + card + credit) * 100) / 100;
    const remainingAmount = Math.round((totalNeeded - totalPaid) * 100) / 100;

    // 0. Payment completeness guard - BEFORE ANY SAVE/MUTATION/API/STATE CHANGE
    if (remainingAmount > 0 || remainingAmount < 0) {
      showToast('المبلغ المسدد غير مكتمل', 1000);
      return;
    }

    // If editing a saved invoice and changes are detected, require confirmation before saving
    if (salesEntryService.isEditingSavedInvoice() && salesEntryService.isSavedInvoiceDirty()) {
      setSaveEditConfirmModal({ isOpen: true, actionType: 'save_only' });
      return;
    }

    executeSaveInvoiceOnly();
  };

  const executeCompletePaymentAndPrint = () => {
    const cash = parseFloat(cashAmountPaid) || 0;
    const card = parseFloat(cardAmountPaid) || 0;
    const credit = parseFloat(creditAmountPaid) || 0;

    // 1. Warehouse Permission Guard
    const currentWId = salesState.activeInvoice.warehouseId || 'WH-01';
    const whCheck = permissionIntegrationService.canUserAccessWarehouse(currentUser.role, currentWId, currentUser.username);
    if (!whCheck.allowed) {
      showToast(`تم رفض العملية: ${whCheck.reason}`, 1000);
      return;
    }

    // Branch Status & Isolation Guard: Ensure warehouse belongs to active invoice branch
    const allWhs = warehouseService.getAllWarehouses();
    const targetWh = allWhs.find(w => w.id === currentWId);
    const invoiceBranchId = salesState.activeInvoice.branchId || currentUser.branchId || branchService.getCurrentBranch()?.id;
    if (targetWh && targetWh.branchId && invoiceBranchId && targetWh.branchId !== invoiceBranchId) {
      const br = branchService.getBranchById(targetWh.branchId);
      const invBr = branchService.getBranchById(invoiceBranchId);
      showToast(`لا يمكن حفظ فاتورة مبيعات على مخزن تابع لفرع آخر [${br?.name || targetWh.branchId}]. الفاتورة مخصصة لفرع [${invBr?.name || invoiceBranchId}].`, 2000);
      return;
    }
    if (targetWh && targetWh.branchId) {
      const br = branchService.getBranchById(targetWh.branchId);
      if (br && br.status === 'غير نشط') {
        showToast(`لا يمكن حفظ فاتورة مبيعات على مخزن تابع لفرع موقوف/غير نشط [${br.name}].`, 2000);
        return;
      }
    }

    // 2. Treasury Permission Guard
    const currentTId = salesState.activeInvoice.treasuryId || (availableTreasuries[0]?.id || 'TR-01');
    const trCheck = permissionIntegrationService.canUserAccessTreasury(currentUser.role, currentTId, currentUser.username);
    if (!trCheck.allowed) {
      showToast(`تم رفض العملية: ${trCheck.reason}`, 1000);
      return;
    }

    const pMethod = derivePaymentMethod(cash, card, credit);

    const selectedBank = availableBankAccounts.find(b => b.id === selectedBankId);
    if (selectedBank) {
      salesEntryService.setBank(selectedBank.id, selectedBank.bankName);
    }

    const result = salesEntryService.completePayment(
      pMethod,
      cash,
      card,
      credit,
      currentUser.role,
      currentUser.username
    );
    if (!result.success) {
      showToast(result.error || 'تعذر إتمام الدفع', 1000);
      return;
    }
    setCompletedReceipt(result.invoice!);
    setSalesState(salesEntryService.getState());
    setIsReceiptVisible(false);
    setIsBonusMode(false);
    setIsPaymentModalOpen(false);
    showToast(`تم إتمام الدفع للفاتورة رقم ${result.invoice!.invoiceNumber} بنجاح`, 1000);
    setTimeout(() => {
      triggerPrintExecution();
    }, 150);
  };

  const handleCompletePaymentAndPrint = () => {
    const cash = parseFloat(cashAmountPaid) || 0;
    const card = parseFloat(cardAmountPaid) || 0;
    const credit = parseFloat(creditAmountPaid) || 0;

    const totalNeeded = Math.round(salesState.activeInvoice.grandTotal * 100) / 100;
    const totalPaid = Math.round((cash + card + credit) * 100) / 100;
    const remainingAmount = Math.round((totalNeeded - totalPaid) * 100) / 100;

    // 0. Payment completeness guard - BEFORE ANY SAVE/MUTATION/API/STATE CHANGE
    if (remainingAmount > 0 || remainingAmount < 0) {
      showToast('المبلغ المسدد غير مكتمل', 1000);
      return;
    }

    // If editing a saved invoice and changes are detected, require confirmation before saving
    if (salesEntryService.isEditingSavedInvoice() && salesEntryService.isSavedInvoiceDirty()) {
      setSaveEditConfirmModal({ isOpen: true, actionType: 'complete_and_print' });
      return;
    }

    executeCompletePaymentAndPrint();
  };

  const handleConfirmPayment = () => {
    handleCompletePaymentAndPrint();
  };

  const markCompleted = () => {
    salesEntryService.markVgf06Completed();
    setSalesState(salesEntryService.getState());
    showToast('VGF-06 Sales Entry Modes Marked as Completed!');
  };

  // Action Handlers for Finalized Sales Invoice Buttons
  const executeNewInvoice = () => {
    const newInv = salesEntryService.createNewInvoice();
    setSalesState(salesEntryService.getState());
    setCustomCashName('');
    setPosScanInput('');
    setStandardSearchQuery('');
    setCashAmountPaid('');
    setCardAmountPaid('');
    setCreditAmountPaid('');
    setIsReceiptVisible(false);
    setIsBonusMode(false);
    setIsPaymentModalOpen(false);
    setIsNewInvoiceConfirmModalOpen(false);
    showToast(`تم إنشاء فاتورة جديدة رقم ${newInv.invoiceNumber}`);
  };

  const handleNewInvoiceAction = () => {
    const active = salesState.activeInvoice;
    const cashCust = customerService.getSystemCashCustomer();

    const hasUnsavedData = Boolean(
      active && (
        (active.lineItems && active.lineItems.length > 0) ||
        (active.invoiceDiscountValue && active.invoiceDiscountValue > 0) ||
        (active.taxDiscountRate && active.taxDiscountRate > 0) ||
        (active.isTaxInvoice) ||
        (active.vatRate && active.vatRate > 0) ||
        (active.customerId && active.customerId !== cashCust.id && active.customerId !== 'CUST-CASH-001' && active.customerId !== 'CUST-001') ||
        (active.customerName && active.customerName !== 'عميل نقدي' && active.customerName !== cashCust.name) ||
        (active.cashPaid && active.cashPaid > 0) ||
        (active.cardPaid && active.cardPaid > 0) ||
        (active.creditPaid && active.creditPaid > 0) ||
        (active.notes && active.notes.trim() !== '')
      )
    );

    if (hasUnsavedData) {
      setIsNewInvoiceConfirmModalOpen(true);
    } else {
      executeNewInvoice();
    }
  };

  const handleSaveAndPayAction = () => {
    if (salesState.activeInvoice.lineItems.length === 0) {
      showToast('يرجى إضافة أصناف إلى الفاتورة أولاً قبل الحفظ والدفع.');
      return;
    }
    handleOpenCheckout();
  };

  const handleHoldAction = () => {
    if (salesState.activeInvoice.lineItems.length === 0 && !salesState.activeInvoice.wasHeld) {
      showToast('لا يمكن تعليق فاتورة جديدة فارغة.');
      return;
    }
    handleHoldInvoice();
  };

  const handleViewHistoryAction = () => {
    setActiveTab('open_invoices');
  };

  const handlePrintInvoiceAction = () => {
    // 1) قاعدة طباعة فاتورة البيع:
    // لا تسمح بطباعة أي فاتورة بيع غير محفوظة.
    // إذا كانت الفاتورة جديدة ولم يتم حفظها مرة واحدة على الأقل، عند الضغط على "طباعة" لا تفتح شاشة الـPrint Preview، وتظهر رسالة واضحة:
    // "يجب حفظ الفاتورة أولًا قبل طباعتها."
    const isSaved = salesEntryService.isInvoiceSaved(salesState.activeInvoice?.id);
    if (!isSaved) {
      showToast('يجب حفظ الفاتورة أولًا قبل طباعتها.');
      return;
    }

    if (salesState.activeInvoice && salesState.activeInvoice.lineItems.length > 0) {
      setCompletedReceipt(salesState.activeInvoice);
      setTimeout(() => triggerPrintExecution(), 150);
    } else {
      showToast('لا توجد عناصر بالفاتورة الحالية للطباعة');
    }
  };

  const handleCancelInvoiceAction = () => {
    // 1. Permission Check
    const permResult = permissionIntegrationService.checkPermission(currentUser.role, 'PERM_ACT_CANCEL_SALES_INVOICE');
    if (!permResult.granted) {
      permissionIntegrationService.logSecurityEvent(
        currentUser.username,
        currentUser.role,
        'CANCEL_SALES_INVOICE_DENIED',
        salesState.activeInvoice?.invoiceNumber || 'NEW_INVOICE',
        'DENIED',
        `User ${currentUser.username} (${currentUser.role}) attempted to cancel sales invoice without required permission PERM_ACT_CANCEL_SALES_INVOICE.`
      );
      showToast(`تم رفض الإجراء: المستخدم (${currentUser.fullName} - ${currentUser.role}) لا يملك الصلاحية المطلوبة (إلغاء فاتورة مبيعات).`);
      return;
    }

    // 2. Open Confirmation Modal
    if (!salesState.activeInvoice) return;
    setCancelConfirmModal({
      isOpen: true,
      invoice: salesState.activeInvoice
    });
  };

  const checkHasUnsavedData = () => {
    const active = salesState.activeInvoice;
    const cashCust = customerService.getSystemCashCustomer();
    return Boolean(
      active && (
        (active.lineItems && active.lineItems.length > 0) ||
        (active.invoiceDiscountValue && active.invoiceDiscountValue > 0) ||
        (active.taxDiscountRate && active.taxDiscountRate > 0) ||
        (active.isTaxInvoice) ||
        (active.vatRate && active.vatRate > 0) ||
        (active.customerId && active.customerId !== cashCust.id && active.customerId !== 'CUST-CASH-001' && active.customerId !== 'CUST-001') ||
        (active.customerName && active.customerName !== 'عميل نقدي' && active.customerName !== cashCust.name) ||
        (active.cashPaid && active.cashPaid > 0) ||
        (active.cardPaid && active.cardPaid > 0) ||
        (active.creditPaid && active.creditPaid > 0) ||
        (active.notes && active.notes.trim() !== '')
      )
    );
  };

  // Navigate within Sales Module persistent Sidebar sections
  const handleNavigateSalesSection = (section: 'sales_terminal' | 'sales_returns' | 'customer_balances' | 'customer_statement' | 'customer_records' | 'sales_reports' | 'sales_stats') => {
    setActiveSalesSection(section);
    if (section === 'sales_terminal') {
      setActiveTab('sales_terminal');
    } else if (section === 'sales_returns') {
      setActiveTab('sales_returns');
    } else if (section === 'sales_reports' || section === 'sales_stats') {
      setActiveTab('reports_integration');
    }
  };

  // Safe exit from Sales Module to Main Interface (6 Cards)
  const executeExitSalesModuleToMain = () => {
    setIsCloseConfirmModalOpen(false);
    setIsPendingExitToMain(false);
    salesEntryService.createNewInvoice();
    setSalesState(salesEntryService.getState());
    setCustomCashName('');
    setPosScanInput('');
    setStandardSearchQuery('');
    setCashAmountPaid('');
    setCardAmountPaid('');
    setCreditAmountPaid('');
    setIsPaymentModalOpen(false);
    setIsSalesNavModalOpen(false);
    setIsCustomerRecordsModalOpen(false);
    setIsCustomerBalancesHubOpen(false);
    setIsCustomerStatementReportOpen(false);
    setIsCustomerBalancesListOpen(false);
    if (onClose) {
      onClose();
    } else if (onNavigateSection) {
      onNavigateSection('main');
    }
  };

  // Close / Exit Handler: Closing the Sales Terminal or clicking Exit to Main
  const handleCloseScreenAction = () => {
    if (checkHasUnsavedData()) {
      setIsPendingExitToMain(true);
      setIsCloseConfirmModalOpen(true);
    } else {
      executeExitSalesModuleToMain();
    }
  };

  // Close Screen to Sales Terminal or Main
  const executeCloseScreenToSalesModal = () => {
    executeExitSalesModuleToMain();
  };

  // Dismiss Modal Handler
  const handleDismissSalesNavModal = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (checkHasUnsavedData()) {
      setIsSalesNavModalOpen(false);
      setIsPendingExitToMain(true);
      setIsCloseConfirmModalOpen(true);
    } else {
      executeExitSalesModuleToMain();
    }
  };

  // Keyboard Shortcuts for Sales Actions: F1 to F7
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if a modal is currently open
      if (
        isCloseConfirmModalOpen ||
        cancelConfirmModal.isOpen ||
        isPaymentModalOpen ||
        isCustomerModalOpen ||
        isNewInvoiceConfirmModalOpen
      ) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        handleNewInvoiceAction();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleSaveAndPayAction();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleHoldAction();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleViewHistoryAction();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handlePrintInvoiceAction();
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleCancelInvoiceAction();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleCloseScreenAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isCloseConfirmModalOpen,
    cancelConfirmModal.isOpen,
    isPaymentModalOpen,
    isCustomerModalOpen,
    isNewInvoiceConfirmModalOpen,
    salesState.activeInvoice,
    completedReceipt,
    currentUser
  ]);

  const { activeInvoice, products, customers, currentMode, openInvoices, completedInvoices, recentlySoldProducts, metrics } = salesState;

  // Filter products for Button Mode
  const filteredProducts = products.filter(p => {
    if (showFavoritesOnly && !p.isFavorite) return false;
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedSubCategory !== 'All' && p.subCategory !== selectedSubCategory) return false;
    if (buttonSearchQuery.trim()) {
      const q = buttonSearchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.serialNumber && p.serialNumber.toLowerCase().includes(q)) ||
        (Array.isArray(p.serialNumbers) && p.serialNumbers.some(s => s.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const subCategories = ['All', ...Array.from(new Set(products.filter(p => selectedCategory === 'All' || p.category === selectedCategory).map(p => p.subCategory)))];

  return (
    <div className="space-y-6">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShoppingCart className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                VGF-06
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                salesState.isVgf06Completed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{salesState.isVgf06Completed ? 'مكتمل VGF-06' : 'معتمد رسمياً'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">الإصدار 1.2.0</span>
            </div>
            <h1 className="erp-screen-title text-slate-100">
              نظام إدخال المبيعات متعدد الأنماط
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              محرك مبيعات موحد للمؤسسات يدعم التحويل الفوري بين إدخال الفاتورة الجدولي القياسي، وماسح الباركود السريع لنقاط البيع POS، ووضع الأزرار الملموسة المخصص للشاشات باللمس.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* User & Role Switcher */}
            <div className="flex items-center space-x-2 space-x-reverse bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold">المستخدم الحالي:</span>
                <select
                  id="vgf06-current-user-role-select"
                  value={currentUser.username}
                  onChange={(e) => {
                    const selected = AUTH_USERS_PRESETS.find(u => u.username === e.target.value);
                    if (selected) {
                      setCurrentUser({
                        username: selected.username,
                        fullName: selected.fullName,
                        role: selected.role
                      });
                    }
                  }}
                  className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {AUTH_USERS_PRESETS.map(u => (
                    <option key={u.username} value={u.username} className="bg-slate-900 text-slate-100">
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={markCompleted}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تحديد VGF-06 كمكتمل</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>محرك المبيعات الموحد نشط</span>
            </div>
          </div>
        </div>

        {/* Centered Sales Screen Main Title with Round Eye Receipt Preview Toggle */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center">
          <div className="flex items-center justify-center space-x-2.5 space-x-reverse">
            <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-wide text-center drop-shadow-sm">
              المبيعات
            </h2>
            <button
              id="sales-toggle-receipt-preview-eye-btn"
              type="button"
              onClick={() => setIsReceiptVisible(prev => !prev)}
              title={isReceiptVisible ? "إخفاء معاينة الإيصال" : "إظهار معاينة الإيصال"}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                isReceiptVisible
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border-slate-700/80 hover:border-amber-500/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation & Mode Bar (Visually Hidden as per request to maintain all handlers, logic, refs, and accessibility) */}
        <div className="hidden" aria-hidden="true">
          {/* SCREEN TOOLS / OPTIONS DROPDOWN */}
          <div className="relative" ref={tabDropdownRef}>
            {(() => {
              const tabOptions = [
                { id: 'sales_terminal', label: '1. شاشة إدخال المبيعات', icon: ShoppingCart },
                { id: 'open_invoices', label: `2. الفواتير المعلقة (${openInvoices.length})`, icon: PauseCircle },
                { id: 'reports_integration', label: '3. التقارير والتحليلات', icon: BarChart3 },
                { id: 'sales_returns', label: '4. مرتجعات المبيعات', icon: RotateCcw }
              ];
              const currentTabObj = tabOptions.find(t => t.id === activeTab) || tabOptions[0];
              const CurrentIcon = currentTabObj.icon;

              return (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsTabDropdownOpen(prev => !prev)}
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>خيارات الشاشة</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-amber-300 font-semibold flex items-center space-x-1.5 space-x-reverse">
                      <CurrentIcon className="w-3.5 h-3.5" />
                      <span>{currentTabObj.label}</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTabDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 divide-y divide-slate-800" dir="rtl">
                      {tabOptions.map(t => {
                        const Icon = t.icon;
                        const isActive = activeTab === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(t.id as any);
                              setIsTabDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-right transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-amber-500/15 text-amber-300 font-bold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                          >
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                              <span>{t.label}</span>
                            </div>
                            {isActive && (
                              <Check className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* MODE SELECTOR (Phase 01) */}
          <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
            <span className="text-[10px] font-mono text-slate-400 px-2 uppercase font-bold">وضع الإدخال:</span>
            <button
              onClick={() => {
                setActiveTab('sales_terminal');
                handleModeSwitch('standard');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sales_terminal' && currentMode === 'standard'
                  ? 'bg-indigo-600 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>قياسي</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sales_terminal');
                handleModeSwitch('pos');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sales_terminal' && currentMode === 'pos'
                  ? 'bg-emerald-600 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>ماسح POS</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sales_terminal');
                handleModeSwitch('button');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sales_terminal' && currentMode === 'button'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>وضع الأزرار</span>
            </button>

            <button
              onClick={() => setActiveTab('sales_returns')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sales_returns'
                  ? 'bg-rose-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>المرتجعات</span>
            </button>
          </div>
        </div>
      </div>

      {/* SALES MODULE SHELL: PERSISTENT SALES SIDEBAR ON RIGHT + MAIN CONTENT AREA ON LEFT */}
      <div className="flex flex-col lg:flex-row gap-4 items-start" dir="rtl">
        {/* Right: Persistent Sales Sidebar (Balanced Compact Width) */}
        <aside className="w-full lg:w-48 xl:w-52 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl shrink-0 space-y-2 sticky top-4 select-none" dir="rtl">
          {/* Sidebar Header */}
          <div className="px-2 py-2 border-b border-slate-800 flex items-center space-x-2 space-x-reverse">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-black text-slate-100">المبيعات</h2>
            </div>
          </div>

          {/* 7 Core Navigation Items */}
          <nav className="space-y-1 pt-0.5">
            {/* 1. فاتورة بيع */}
            <button
              id="sales-sidebar-nav-invoice"
              type="button"
              onClick={() => handleNavigateSalesSection('sales_terminal')}
              className={`w-full flex items-center space-x-2 space-x-reverse px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer whitespace-nowrap ${
                activeSalesSection === 'sales_terminal'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black border border-amber-400'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-amber-300 border border-slate-800/80'
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 ${activeSalesSection === 'sales_terminal' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="whitespace-nowrap">1. فاتورة بيع</span>
            </button>

            {/* 2. مرتجعات البيع */}
            <button
              id="sales-sidebar-nav-returns"
              type="button"
              onClick={() => handleNavigateSalesSection('sales_returns')}
              className={`w-full flex items-center space-x-2 space-x-reverse px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer whitespace-nowrap ${
                activeSalesSection === 'sales_returns'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black border border-amber-400'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-amber-300 border border-slate-800/80'
              }`}
            >
              <RotateCcw className={`w-4 h-4 shrink-0 ${activeSalesSection === 'sales_returns' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="whitespace-nowrap">2. مرتجعات البيع</span>
            </button>

            {/* 3. أرصدة العملاء */}
            <button
              id="sales-sidebar-nav-balances"
              type="button"
              onClick={() => handleNavigateSalesSection('customer_balances')}
              className={`w-full flex items-center space-x-2 space-x-reverse px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer whitespace-nowrap ${
                activeSalesSection === 'customer_balances'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black border border-amber-400'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-amber-300 border border-slate-800/80'
              }`}
            >
              <UserCheck className={`w-4 h-4 shrink-0 ${activeSalesSection === 'customer_balances' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="whitespace-nowrap">3. أرصدة العملاء</span>
            </button>

            {/* 4. كشف حساب عميل */}
            <button
              id="sales-sidebar-nav-statement"
              type="button"
              onClick={() => handleNavigateSalesSection('customer_statement')}
              className={`w-full flex items-center space-x-2 space-x-reverse px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer whitespace-nowrap ${
                activeSalesSection === 'customer_statement'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black border border-amber-400'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-amber-300 border border-slate-800/80'
              }`}
            >
              <Receipt className={`w-4 h-4 shrink-0 ${activeSalesSection === 'customer_statement' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="whitespace-nowrap">4. كشف حساب عميل</span>
            </button>

            {/* 5. بيانات العملاء */}
            <button
              id="sales-sidebar-nav-customers"
              type="button"
              onClick={() => handleNavigateSalesSection('customer_records')}
              className={`w-full flex items-center space-x-2 space-x-reverse px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer whitespace-nowrap ${
                activeSalesSection === 'customer_records'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black border border-amber-400'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-amber-300 border border-slate-800/80'
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 ${activeSalesSection === 'customer_records' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="whitespace-nowrap">5. بيانات العملاء</span>
            </button>

            {/* 6. تقارير المبيعات */}
            <button
              id="sales-sidebar-nav-reports"
              type="button"
              onClick={() => handleNavigateSalesSection('sales_reports')}
              className={`w-full flex items-center space-x-2 space-x-reverse px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer whitespace-nowrap ${
                activeSalesSection === 'sales_reports'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black border border-amber-400'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-amber-300 border border-slate-800/80'
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 ${activeSalesSection === 'sales_reports' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="whitespace-nowrap">6. تقارير المبيعات</span>
            </button>

            {/* 7. إحصائيات المبيعات */}
            <button
              id="sales-sidebar-nav-stats"
              type="button"
              onClick={() => handleNavigateSalesSection('sales_stats')}
              className={`w-full flex items-center space-x-2 space-x-reverse px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer whitespace-nowrap ${
                activeSalesSection === 'sales_stats'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black border border-amber-400'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-amber-300 border border-slate-800/80'
              }`}
            >
              <BarChart3 className={`w-4 h-4 shrink-0 ${activeSalesSection === 'sales_stats' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="whitespace-nowrap">7. إحصائيات المبيعات</span>
            </button>
          </nav>

          {/* Exit to Main Interface Button */}
          <div className="pt-2 border-t border-slate-800">
            <button
              id="sales-sidebar-exit-btn"
              type="button"
              onClick={handleCloseScreenAction}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-2 py-2 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm whitespace-nowrap"
              title="الخروج من المبيعات والعودة للواجهة الرئيسية"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>الخروج للرئيسية</span>
            </button>
          </div>
        </aside>

        {/* Left: Main Content Area */}
        <div className="flex-1 min-w-0 w-full">
          {/* TAB 1: SALES TERMINAL */}
          {activeSalesSection === 'sales_terminal' && activeTab === 'sales_terminal' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT / MAIN ENTRY AREA (8 cols when receipt is visible, 12 cols when hidden) */}
            <div className={`space-y-4 ${isReceiptVisible ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            {/* Edit Mode Indication Banner */}
            {salesEntryService.isEditingSavedInvoice() && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 shadow-lg flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>تعديل فاتورة محفوظة — {activeInvoice.invoiceNumber}</span>
                </div>
                <span className="text-[11px] text-slate-300 font-mono">
                  العميل: {activeInvoice.customerName}
                </span>
              </div>
            )}

            {/* Customer & Invoice Quick Header */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3" dir="rtl">
              {/* الصف الأول: [ نوع الإدخال ] [ رقم الفاتورة ] [ التاريخ ] [ الوقت ] (4 مستطيلات متساوية تمامًا) */}
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-center">
                  {/* 1. نوع الإدخال */}
                  <div className="flex flex-col space-y-1 relative" ref={entryModeDropdownRef}>
                    <label className="text-[11px] font-bold text-slate-400 text-center">نوع الإدخال</label>
                    {(() => {
                      const entryModes = [
                        { id: 'standard', label: 'قياسي', icon: Keyboard, color: 'text-indigo-400', isReturn: false },
                        { id: 'pos', label: 'ماسح POS', icon: Barcode, color: 'text-emerald-400', isReturn: false },
                        { id: 'button', label: 'وضع الأزرار', icon: Grid, color: 'text-amber-400', isReturn: false },
                        { id: 'returns', label: 'المرتجعات', icon: RotateCcw, color: 'text-rose-400', isReturn: true }
                      ];

                      const activeModeObj = activeTab === 'sales_returns'
                        ? entryModes.find(m => m.id === 'returns')!
                        : (entryModes.find(m => m.id === currentMode) || entryModes[0]);

                      const ActiveIcon = activeModeObj.icon;

                      return (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsEntryModeDropdownOpen(prev => !prev)}
                            className="relative w-full h-9 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-center space-x-1.5 space-x-reverse truncate font-bold text-center">
                              <ActiveIcon className={`w-3.5 h-3.5 shrink-0 ${activeModeObj.color}`} />
                              <span className="truncate font-bold">{activeModeObj.label}</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 absolute left-2.5 top-2.5 pointer-events-none ${isEntryModeDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isEntryModeDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 divide-y divide-slate-800" dir="rtl">
                              {entryModes.map(m => {
                                const Icon = m.icon;
                                const isSelected = m.isReturn
                                  ? activeTab === 'sales_returns'
                                  : (activeTab === 'sales_terminal' && currentMode === m.id);

                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      if (m.isReturn) {
                                        setActiveTab('sales_returns');
                                      } else {
                                        setActiveTab('sales_terminal');
                                        handleModeSwitch(m.id as SalesEntryMode);
                                      }
                                      setIsEntryModeDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-right transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-amber-500/15 text-amber-300 font-bold'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                      <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                                      <span>{m.label}</span>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-3.5 h-3.5 text-amber-400" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 2. رقم الفاتورة */}
                  <div className="flex flex-col space-y-1 relative" ref={invoiceSearchRef}>
                    <label className="text-[11px] font-bold text-slate-400 text-center">رقم الفاتورة</label>
                    <div className={`relative h-9 px-2.5 bg-slate-950 border ${
                      isInvoiceSearchOpen ? 'border-blue-500 ring-1 ring-blue-500/40' : 'border-slate-800'
                    } rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all`}>
                      <span className="text-slate-100 truncate text-center font-mono font-bold">{activeInvoice.invoiceNumber}</span>
                      <button
                        type="button"
                        id="sales-invoice-search-trigger-btn"
                        onClick={() => {
                          setIsInvoiceSearchOpen(prev => !prev);
                          setInvoiceSearchQuery('');
                          setInvoiceSearchError(null);
                        }}
                        title="بحث برقم الفاتورة"
                        className={`absolute left-1.5 top-1.5 p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                          isInvoiceSearchOpen 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'text-slate-400 hover:text-blue-300 hover:bg-slate-900'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Invoice Search Popover */}
                    {isInvoiceSearchOpen && (
                      <div 
                        className="absolute top-full right-0 mt-1 w-80 sm:w-96 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md"
                        dir="rtl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header & Search Input */}
                        <div className="p-3 border-b border-slate-800/80 bg-slate-950/80">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-200">
                              <Search className="w-4 h-4 text-blue-400" />
                              <span>بحث برقم الفاتورة</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsInvoiceSearchOpen(false)}
                              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleExecuteInvoiceSearch();
                            }}
                            className="flex items-center space-x-1.5 space-x-reverse"
                          >
                            <div className="relative flex-1">
                              <input
                                ref={invoiceSearchInputRef}
                                type="text"
                                autoFocus
                                placeholder="أدخل رقم الفاتورة للبحث..."
                                value={invoiceSearchQuery}
                                onChange={(e) => {
                                  setInvoiceSearchQuery(e.target.value);
                                  if (invoiceSearchError) setInvoiceSearchError(null);
                                }}
                                className="w-full h-8.5 pr-3 pl-7 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono font-medium"
                              />
                              {invoiceSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInvoiceSearchQuery('');
                                    setInvoiceSearchError(null);
                                  }}
                                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <button
                              type="submit"
                              className="h-8.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1 space-x-reverse shrink-0 transition-colors shadow cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>بحث</span>
                            </button>
                          </form>
                        </div>

                        {/* Search Error if not found */}
                        {invoiceSearchError && (
                          <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2 space-x-reverse">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span className="font-bold">{invoiceSearchError}</span>
                          </div>
                        )}

                        {/* Results List */}
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50">
                          {filteredExistingInvoices.length === 0 ? (
                            <div className="py-6 px-4 text-center">
                              <FileText className="w-7 h-7 text-slate-600 mx-auto mb-1.5 opacity-60" />
                              <p className="text-xs font-bold text-slate-300">لم يتم العثور على الفاتورة</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">تأكد من كتابة رقم الفاتورة بشكل صحيح</p>
                            </div>
                          ) : (
                            filteredExistingInvoices.map((inv) => {
                              const isCompleted = inv.source === 'completed';
                              const isCurrent = inv.id === activeInvoice.id;
                              return (
                                <button
                                  key={inv.id}
                                  type="button"
                                  onClick={() => handleLoadFoundInvoice(inv, inv.source)}
                                  className={`w-full p-2.5 text-right flex items-center justify-between transition-colors text-xs cursor-pointer ${
                                    isCurrent 
                                      ? 'bg-blue-600/15 border-r-2 border-blue-500 text-blue-200'
                                      : 'hover:bg-slate-800/70 text-slate-200'
                                  }`}
                                >
                                  <div className="min-w-0 pr-1 space-y-1">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                      <span className="font-mono font-bold text-slate-100 text-xs">{inv.invoiceNumber}</span>
                                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                        isCompleted 
                                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                      }`}>
                                        {isCompleted ? 'محفوظة' : 'معلقة'}
                                      </span>
                                      {isCurrent && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                                          الحالية
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse text-[11px] text-slate-400">
                                      <span className="truncate max-w-[120px] font-medium text-slate-300">
                                        {inv.customerName || 'عميل نقدي'}
                                      </span>
                                      <span>•</span>
                                      <span>{new Date(inv.createdAt).toISOString().split('T')[0]}</span>
                                      <span>•</span>
                                      <span>{inv.lineItems?.length || 0} أصناف</span>
                                    </div>
                                  </div>

                                  <div className="text-left shrink-0 pl-1">
                                    <div className="font-mono font-bold text-emerald-400 text-xs" dir="ltr">
                                      {(inv.total || 0).toLocaleString()} SAR
                                    </div>
                                    <div className="text-[10px] text-blue-400 font-bold mt-0.5">
                                      تحميل الفاتورة ←
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 px-3">
                          <span>الفواتير المسجلة: {allAvailableInvoices.length}</span>
                          <span className="text-slate-500">اختر أي فاتورة لتحميل بياناتها</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. التاريخ */}
                  <div className="flex flex-col space-y-1 relative">
                    <label className="text-[11px] font-bold text-slate-400 text-center flex items-center justify-center relative">
                      <span>التاريخ</span>
                      {!canEditInvoiceDate && (
                        <span className="text-[9px] text-slate-500 font-normal absolute left-1">للقراءة فقط</span>
                      )}
                    </label>
                    <div 
                      id="sales-invoice-date-container"
                      className="relative h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-mono text-xs text-slate-200 font-bold transition-all"
                    >
                      <span className="truncate select-none cursor-default text-center font-mono font-bold">{new Date(activeInvoice.createdAt).toISOString().split('T')[0]}</span>
                      {canEditInvoiceDate ? (
                        <div className="absolute left-1.5 top-1.5 flex items-center justify-center group p-1 rounded-lg hover:bg-slate-900 transition-colors shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300 transition-colors pointer-events-none" />
                          {/* Native HTML Date Picker Input strictly anchored to this icon button */}
                          <input
                            ref={nativeDateInputRef}
                            type="date"
                            aria-label="تاريخ الفاتورة"
                            title="تعديل تاريخ الفاتورة"
                            value={new Date(activeInvoice.createdAt).toISOString().split('T')[0]}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleInvoiceDateChange(e.target.value);
                              }
                            }}
                            onClick={(e) => {
                              try {
                                if (typeof (e.currentTarget as any).showPicker === 'function') {
                                  (e.currentTarget as any).showPicker();
                                }
                              } catch {
                                // browser native click handles it
                              }
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 [color-scheme:dark]"
                          />
                        </div>
                      ) : (
                        <div className="absolute left-2.5 top-2.5 text-slate-600 shrink-0" title="تعديل التاريخ غير مسموح (غير مصرح)">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. الوقت */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 text-center">الوقت</label>
                    <div className="relative h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-mono text-xs text-slate-200 font-bold">
                      <span className="truncate text-center font-mono font-bold">{new Date(activeInvoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* الصف السفلي: الحقول التشغيلية (العميل والمخزن) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                {/* 1. نوع العميل + نوع السعر / العميل المسجل / النقدي */}
                <div className="flex flex-col space-y-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 justify-between">
                  {/* الصف العلوي للعميل: يمين: نوع العميل | يسار: نوع السعر */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* يمين في RTL: نوع العميل */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 text-center">نوع العميل</label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                        <select
                          id="sales-customer-type-select"
                          value={isCashCustomer ? 'cash' : 'permanent'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'cash') {
                              handleSelectCashCustomer();
                            } else {
                              const permanentCusts = salesState.customers.filter(
                                c => !c.isSystemCashCustomer && c.id !== 'CUST-CASH-001' && c.type !== 'عميل نقدي' && customerService.isCustomerActive(c)
                              );
                              if (permanentCusts.length > 0) {
                                handleSelectCustomer(permanentCusts[0]);
                              } else {
                                setIsCustomerModalOpen(true);
                              }
                            }
                          }}
                          className="w-full h-9 pr-8 pl-7 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none text-center"
                        >
                          <option value="cash" className="bg-slate-900 text-slate-100 font-bold">
                            عميل نقدي (Cash Customer)
                          </option>
                          <option value="permanent" className="bg-slate-900 text-slate-100 font-bold">
                            عميل دائم
                          </option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* يسار في RTL: نوع السعر */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 text-center">نوع السعر</label>
                      <div className="relative">
                        <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                        <select
                          id="sales-price-type-select"
                          value={priceType}
                          onChange={(e) => setPriceType(e.target.value)}
                          className="w-full h-9 pr-7 pl-6 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none text-center"
                        >
                          <option value="retail" className="bg-slate-900 text-slate-100 font-bold">
                            تجزئة
                          </option>
                          <option value="wholesale" className="bg-slate-900 text-slate-100 font-bold">
                            جملة
                          </option>
                          <option value="semi_wholesale" className="bg-slate-900 text-slate-100 font-bold">
                            نصف جملة
                          </option>
                          <option value="special" className="bg-slate-900 text-slate-100 font-bold">
                            سعر خاص
                          </option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* العميل المسجل أو اسم العميل — يمتد بالعرض الكامل للصف */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 text-center">
                      {isCashCustomer ? 'اسم العميل' : 'العميل المسجل'}
                    </label>
                    {isCashCustomer ? (
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="عميل نقدي (Cash Customer)"
                          value={
                            salesState.activeInvoice.customerName === 'عميل نقدي'
                              ? (customCashName ? `عميل نقدي (${customCashName})` : 'عميل نقدي (Cash Customer)')
                              : (customCashName || (salesState.activeInvoice.customerName !== 'عميل نقدي' ? salesState.activeInvoice.customerName : 'عميل نقدي (Cash Customer)'))
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomCashName(val);
                            const nameToSave = val.trim() ? val.trim() : 'عميل نقدي';
                            salesEntryService.setCustomerName(nameToSave);
                            setSalesState(salesEntryService.getState());
                          }}
                          className="w-full h-9 pr-8 pl-7 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 text-center"
                        />
                      </div>
                    ) : (
                      <div className="relative" ref={customerDropdownRef}>
                        <div className="flex items-center space-x-1.5 space-x-reverse">
                          <div
                            id="sales-permanent-customer-select-box"
                            onClick={() => {
                              setIsCustomerQuickDropdownOpen(prev => !prev);
                              setCustomerQuickSearchQuery('');
                            }}
                            className={`relative flex-1 h-9 px-3 bg-slate-950 border ${
                              isCustomerQuickDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-blue-900/60 hover:border-blue-500'
                            } rounded-xl text-xs text-blue-300 font-bold flex items-center justify-center transition-all cursor-pointer group shadow-sm select-none`}
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:scale-110 transition-transform absolute right-2.5 top-2.5 pointer-events-none" />
                            <div className="flex items-center justify-center truncate max-w-[calc(100%-140px)] text-center">
                              <span className="truncate text-slate-100 font-bold text-center">
                                {(() => {
                                  const selected = salesState.customers.find(c => c.id === salesState.activeInvoice.customerId);
                                  if (selected) {
                                    return `${selected.name} (${selected.code})`;
                                  }
                                  return salesState.activeInvoice.customerName || 'اختر العميل المسجل...';
                                })()}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1.5 space-x-reverse shrink-0 absolute left-2 top-1.5">
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300 transition-transform duration-200 ${isCustomerQuickDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
                              <button
                                type="button"
                                id="sales-change-customer-records-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsCustomerQuickDropdownOpen(false);
                                  setIsCustomerModalOpen(true);
                                }}
                                title="فتح سجلات العملاء الكاملة"
                                className="text-[10px] text-blue-300 bg-blue-950/90 hover:bg-blue-800 hover:text-white px-2 py-0.5 rounded border border-blue-700/50 font-bold transition-colors cursor-pointer"
                              >
                                تغيير العميل
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCustomerQuickDropdownOpen(false);
                              setEditingCustomerIdForModal(null);
                              setIsAddCustomerFormOpen(true);
                            }}
                            title="إضافة عميل جديد"
                            className="h-9 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick Customer Dropdown Popover */}
                        {isCustomerQuickDropdownOpen && (
                          <div 
                            className="absolute top-full right-0 left-0 mt-1 z-50 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md"
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                          >
                            {/* Search Input Box */}
                            <div className="p-2 border-b border-slate-800/80 bg-slate-950/60">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                <input
                                  ref={customerQuickSearchInputRef}
                                  type="text"
                                  autoFocus
                                  placeholder="ابحث بالاسم، الكود، أو الهاتف..."
                                  value={customerQuickSearchQuery}
                                  onChange={(e) => setCustomerQuickSearchQuery(e.target.value)}
                                  className="w-full h-8 pr-8 pl-7 bg-slate-900 border border-slate-700/70 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                                />
                                {customerQuickSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setCustomerQuickSearchQuery('')}
                                    className="absolute left-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Customer List */}
                            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/40">
                              {quickFilteredCustomers.length === 0 ? (
                                <div className="py-6 px-3 text-center text-xs text-slate-500">
                                  لا يوجد عملاء مطابقون للبحث
                                </div>
                              ) : (
                                quickFilteredCustomers.map((cust) => {
                                  const isSelected = cust.id === salesState.activeInvoice.customerId;
                                  return (
                                    <button
                                      key={cust.id}
                                      type="button"
                                      onClick={() => {
                                        handleSelectCustomer(cust);
                                        setIsCustomerQuickDropdownOpen(false);
                                        setCustomerQuickSearchQuery('');
                                      }}
                                      className={`w-full px-3 py-2 text-right flex items-center justify-between transition-colors text-xs cursor-pointer ${
                                        isSelected
                                          ? 'bg-blue-600/20 text-blue-200 font-bold border-r-2 border-blue-500'
                                          : 'text-slate-200 hover:bg-slate-800/70'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                          isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                          <UserCheck className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="truncate text-right">
                                          <div className="font-bold text-slate-100 truncate flex items-center gap-1.5">
                                            <span>{cust.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                                              {cust.code}
                                            </span>
                                          </div>
                                          {cust.phone && (
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5" dir="ltr">
                                              <Phone className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                              <span>{cust.phone}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {isSelected && (
                                        <span className="text-blue-400 text-xs shrink-0 mr-2">
                                          <Check className="w-3.5 h-3.5" />
                                        </span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>

                            {/* Dropdown Footer */}
                            <div className="p-1.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 px-3">
                              <span>عدد النتائج: {quickFilteredCustomers.length}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsCustomerQuickDropdownOpen(false);
                                  setIsCustomerModalOpen(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <span>سجلات العملاء الكاملة</span>
                                <ChevronRight className="w-3 h-3 rotate-180" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. المخزن + البائع */}
                <div className="flex flex-col space-y-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 justify-between">
                  {/* المخزن */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 text-center">المخزن</label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                      <select
                        id="sales-invoice-warehouse-select"
                        value={salesState.activeInvoice.warehouseId || ''}
                        onChange={(e) => {
                          const wId = e.target.value;
                          if (!wId) return;
                          const permCheck = permissionIntegrationService.canUserAccessWarehouse(currentUser.role, wId, currentUser.username);
                          if (!permCheck.allowed) {
                            showToast(`لا يمكن اختيار هذا المخزن. ${permCheck.reason}`);
                            return;
                          }
                          const selectedW = availableWarehouses.find(w => w.id === wId || w.code === wId);
                          salesEntryService.setWarehouse(wId, selectedW ? selectedW.name : undefined);
                          setSalesState(salesEntryService.getState());
                        }}
                        className="w-full h-9 pr-8 pl-7 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none text-center"
                      >
                        <option value="" className="bg-slate-900 text-slate-400 font-bold">
                          {availableWarehouses.length > 0 ? '-- اختر المخزن --' : 'المخزن الرئيسي'}
                        </option>
                        {availableWarehouses.map(w => {
                          const isAllowed = permissionIntegrationService.canUserAccessWarehouse(currentUser.role, w.id, currentUser.username).allowed;
                          return (
                            <option
                              key={w.id}
                              value={w.id}
                              disabled={!isAllowed}
                              className={isAllowed ? 'bg-slate-900 text-slate-100 font-bold' : 'bg-slate-950 text-slate-500 font-normal'}
                            >
                              {w.name} ({w.code}) {!isAllowed ? '— [غير مسموح]' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* البائع */}
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-center relative pr-1">
                      <label className="text-[11px] font-bold text-slate-400 text-center">
                        البائع
                      </label>
                      {isSellerMandatory ? (
                        <span className="text-[10px] text-rose-400 font-bold bg-rose-950/50 px-1.5 py-0.2 rounded border border-rose-800/40 absolute left-1">
                          إجباري
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-normal absolute left-1">
                          اختياري
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                      <select
                        id="sales-invoice-seller-select"
                        value={salesState.activeInvoice.sellerName || salesState.activeInvoice.sellerId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            salesEntryService.setSeller('', '');
                          } else {
                            const found = availableSellers.find(s => s.name === val || s.id === val || s.code === val);
                            salesEntryService.setSeller(found ? found.id : val, found ? found.name : val);
                          }
                          setSalesState(salesEntryService.getState());
                        }}
                        className="w-full h-9 pr-8 pl-7 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none text-center"
                      >
                        <option value="" className="bg-slate-900 text-slate-400 font-bold">
                          {availableSellers.length > 0 ? '-- اختر البائع --' : 'بدون بائع محدد'}
                        </option>
                        {availableSellers.map(seller => (
                          <option
                            key={seller.id}
                            value={seller.name}
                            className="bg-slate-900 text-slate-100 font-bold"
                          >
                            {seller.name} ({seller.code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PHASE 02: STANDARD MODE UI */}
            {currentMode === 'standard' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 space-x-reverse">
                      <Keyboard className="w-4 h-4 text-blue-400" />
                      <span>إدخال الفاتورة الجدولي القياسي</span>
                    </h3>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => setIsBonusMode(prev => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 space-x-reverse border ${
                        isBonusMode
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                      title={isBonusMode ? 'العودة لعرض الخصم والإجمالي القياسي' : 'تفعيل وضع البونص وإدخال كميات البونص'}
                    >
                      <Gift className={`w-3.5 h-3.5 ${isBonusMode ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>{isBonusMode ? 'وضع البونص نشط' : 'وضع البونص (Bonus Mode)'}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">التنقل بلوحة المفاتيح نشط (Tab/Enter)</span>
                  </div>
                </div>

                {/* Search / Add Item Bar */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setInventoryModalSearch('');
                        setIsInventoryBrowserOpen(true);
                      }}
                      title="استعراض الأصناف ورصيد المخزون"
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer z-10 flex items-center space-x-1.5 space-x-reverse text-xs"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-[11px] font-bold text-blue-300 hidden sm:inline">استعراض الأصناف</span>
                    </button>
                    <input
                      type="text"
                      placeholder="ابحث عن صنف بالاسم أو الكود (F2)..."
                      value={standardSearchQuery}
                      onChange={e => setStandardSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-36 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-slate-500"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {standardSearchQuery.trim() && (
                    <div className="absolute left-0 right-0 top-12 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                      {products
                        .filter(p => {
                          const q = standardSearchQuery.toLowerCase();
                          return (
                            p.name.toLowerCase().includes(q) ||
                            p.code.toLowerCase().includes(q) ||
                            p.barcode.includes(q) ||
                            (p.serialNumber && p.serialNumber.toLowerCase().includes(q)) ||
                            (Array.isArray(p.serialNumbers) && p.serialNumbers.some(s => s.toLowerCase().includes(q)))
                          );
                        })
                        .slice(0, 5)
                        .map((p, idx) => (
                          <button
                            key={p.id ? `${p.id}-${idx}` : `auto-p-${idx}`}
                            onClick={() => {
                              handleQuickAddProduct(p);
                              setStandardSearchQuery('');
                            }}
                            className="w-full p-2.5 text-right hover:bg-slate-900 flex items-center justify-between text-xs cursor-pointer transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-100">{p.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">{p.code} • باركود: {p.barcode} • الشحنة: {p.batchNumber} • المخزون: {p.stockQty}</div>
                            </div>
                            <span className="font-mono text-emerald-400 font-bold">${p.unitPrice.toFixed(2)}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Line Items Table (Clean, balanced layout matching reference) */}
                <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                  <table className="w-full text-right text-xs table-fixed min-w-[780px]" dir="rtl">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-bold text-xs">
                        <th className="w-[4%] py-3 px-2 text-center text-slate-500 font-mono">#</th>
                        <th className="w-[32%] py-3 px-3 text-right text-slate-200">الصنف</th>
                        <th className="w-[18%] py-3 px-2 text-center text-slate-300">الكمية</th>
                        <th className="w-[11%] py-3 px-2 text-center text-slate-300">سعر البيع</th>
                        {isBonusMode ? (
                          <th className="w-[31%] py-3 px-3 text-center text-amber-300 bg-amber-500/10 border-x border-amber-500/20">
                            <div className="flex items-center justify-center space-x-1.5 space-x-reverse font-bold">
                              <Gift className="w-3.5 h-3.5 text-amber-400" />
                              <span>البونص (Bonus)</span>
                            </div>
                          </th>
                        ) : (
                          <>
                            <th className="w-[11%] py-3 px-2 text-center text-slate-300">الخصم %</th>
                            <th className="w-[10%] py-3 px-2 text-center text-slate-300">الخصم</th>
                            <th className="w-[10%] py-3 px-2 text-center text-slate-200 font-bold">الإجمالي</th>
                          </>
                        )}
                        <th className="w-[4%] py-3 px-2 text-center text-slate-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeInvoice.lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={isBonusMode ? 6 : 8} className="py-12 text-center text-slate-500 italic text-sm">
                            لم يتم إضافة أصناف إلى الفاتورة بعد. ابحث أعلاه أو استعرض الأصناف لإضافتها.
                          </td>
                        </tr>
                      ) : (
                        activeInvoice.lineItems.map((line, idx) => {
                          return (
                            <tr key={line.id} className="hover:bg-slate-900/50 transition-colors group">
                              {/* 1. ROW NUMBER # */}
                              <td className="py-3 px-2 text-center text-slate-500 font-mono text-xs">
                                {idx + 1}
                              </td>

                              {/* 2. PRODUCT NAME & SKU */}
                              <td className="py-3 px-3 text-right">
                                <div className="space-y-0.5">
                                  <div className="text-sm font-bold text-slate-100 leading-snug tracking-tight group-hover:text-amber-300 transition-colors">
                                    {line.productName}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono tracking-wider">
                                    {line.productCode}
                                  </div>
                                </div>
                              </td>

                              {/* 3. QUANTITY WITH CLEAN (-) [NUM] (+) BUTTONS & SUB-QUANTITY IF AVAILABLE */}
                              <td className="py-3 px-2 text-center">
                                <div className="flex items-center justify-center space-x-1.5 space-x-reverse flex-wrap gap-y-1">
                                  {/* Basic Quantity Control */}
                                  <div
                                    className="inline-flex items-center justify-center space-x-1.5 space-x-reverse bg-slate-900/90 border border-slate-800 rounded-lg p-1"
                                    title={line.basicUnit ? `الكمية الأساسية (${line.basicUnit})` : 'الكمية الأساسية'}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(line.id, -1)}
                                      className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer shrink-0 transition-all"
                                      title="إنقاص الكمية الأساسية"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <LiveInput
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={line.quantity !== undefined && line.quantity !== null ? line.quantity : ''}
                                      onChange={val => {
                                        const parsed = parseInt(val, 10);
                                        const newQty = isNaN(parsed) ? 0 : Math.max(0, parsed);
                                        const res = salesEntryService.updateLineQuantity(line.id, newQty);
                                        if (!res.success) {
                                          showToast(res.error || 'الكمية غير متاحة');
                                        }
                                        setSalesState(salesEntryService.getState());
                                      }}
                                      onBlur={() => {
                                        if ((line.quantity === undefined || line.quantity === null || isNaN(line.quantity)) && (!line.bonusQuantity || line.bonusQuantity <= 0)) {
                                          salesEntryService.updateLineQuantity(line.id, 1);
                                          setSalesState(salesEntryService.getState());
                                        }
                                      }}
                                      className="w-10 text-center bg-transparent border-0 text-slate-100 font-mono text-xs font-bold focus:outline-none focus:ring-0 p-0"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(line.id, 1)}
                                      className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer shrink-0 transition-all"
                                      title="زيادة الكمية الأساسية"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Sub-Quantity Control: Shown ONLY for items with a registered subUnit, identical size and styling */}
                                  {line.subUnit ? (
                                    <div
                                      className="inline-flex items-center justify-center space-x-1.5 space-x-reverse bg-slate-900/90 border border-slate-800 rounded-lg p-1"
                                      title={`الكمية الفرعية (${line.subUnit})`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateSubQty(line.id, -1)}
                                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer shrink-0 transition-all"
                                        title={`إنقاص الكمية الفرعية (${line.subUnit})`}
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <LiveInput
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={line.subQuantity !== undefined && line.subQuantity !== null && line.subQuantity !== 0 ? line.subQuantity : ''}
                                        placeholder="0"
                                        onChange={val => {
                                          const parsed = parseInt(val, 10);
                                          const newSubQty = isNaN(parsed) ? 0 : Math.max(0, parsed);
                                          salesEntryService.updateLineSubQuantity(line.id, newSubQty);
                                          setSalesState(salesEntryService.getState());
                                        }}
                                        className="w-10 text-center bg-transparent border-0 text-slate-100 font-mono text-xs font-bold focus:outline-none focus:ring-0 p-0 placeholder-slate-600"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateSubQty(line.id, 1)}
                                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer shrink-0 transition-all"
                                        title={`زيادة الكمية الفرعية (${line.subUnit})`}
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </td>

                              {/* 4. SELLING PRICE */}
                              <td className="py-3 px-2 font-mono text-slate-100 text-center font-bold text-xs">
                                <div className="inline-flex items-center justify-center">
                                  <span>${line.unitPrice.toFixed(2)}</span>
                                </div>
                              </td>

                              {isBonusMode ? (
                                /* GLOBAL BONUS MODE: BONUS QUANTITY COLUMN */
                                <td className="py-3 px-3 text-center bg-amber-500/5 border-x border-amber-500/10">
                                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                                    <div className="inline-flex items-center space-x-1.5 space-x-reverse bg-slate-900 border border-amber-500/30 rounded-lg p-1">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateBonus(line.id, (line.bonusQuantity || 0) - 1)}
                                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer shrink-0 transition-all"
                                        title="إنقاص البونص"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <LiveInput
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={line.bonusQuantity !== undefined && line.bonusQuantity !== 0 ? line.bonusQuantity : ''}
                                        placeholder="0"
                                        onChange={val => {
                                          const parsed = parseInt(val, 10);
                                          const newBonus = isNaN(parsed) ? 0 : Math.max(0, parsed);
                                          const res = salesEntryService.updateLineBonusQuantity(line.id, newBonus);
                                          if (!res.success) {
                                            showToast(res.error || 'كمية البونص غير متاحة');
                                          }
                                          setSalesState(salesEntryService.getState());
                                        }}
                                        className="w-12 text-center bg-transparent border-0 text-amber-400 font-mono text-xs font-bold focus:outline-none focus:ring-0 p-0"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateBonus(line.id, (line.bonusQuantity || 0) + 1)}
                                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer shrink-0 transition-all"
                                        title="زيادة البونص"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {line.bonusQuantity && line.bonusQuantity > 0 ? (
                                      <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 whitespace-nowrap">
                                        إجمالي المنصرف: {(line.quantity || 0) + line.bonusQuantity}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>
                              ) : (
                                <>
                                  {/* 5. DISCOUNT % (WITH SELECT/TOGGLE) */}
                                  <td className="py-3 px-2 text-center">
                                    <div className="inline-flex items-center justify-center space-x-1 space-x-reverse bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                                      <LiveInput
                                        type="text"
                                        placeholder="0"
                                        value={
                                          line.discountValue !== undefined && line.discountValue !== 0
                                            ? line.discountValue
                                            : ''
                                        }
                                        onChange={val => {
                                          salesEntryService.updateLineDiscount(line.id, val, line.discountType);
                                          setSalesState(salesEntryService.getState());
                                        }}
                                        className="w-7 text-center bg-transparent border-0 text-rose-400 font-mono text-xs font-bold focus:outline-none p-0"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newType = line.discountType === 'percent' ? 'fixed' : 'percent';
                                          salesEntryService.updateLineDiscount(line.id, line.discountValue || 0, newType);
                                          setSalesState(salesEntryService.getState());
                                        }}
                                        className="text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer font-bold select-none"
                                        title="تبديل نوع الخصم ($ أو %)"
                                      >
                                        {line.discountType === 'percent' ? '%' : '$'} ▾
                                      </button>
                                    </div>
                                  </td>

                                  {/* 6. DISCOUNT AMOUNT */}
                                  <td className="py-3 px-2 font-mono text-center text-xs font-bold">
                                    {line.discountAmount > 0 ? (
                                      <span className="text-rose-400">-${line.discountAmount.toFixed(2)}</span>
                                    ) : (
                                      <span className="text-slate-400">$0.00</span>
                                    )}
                                  </td>

                                  {/* 7. FINAL LINE TOTAL */}
                                  <td className="py-3 px-2 font-mono text-slate-100 font-bold text-xs text-center">
                                    ${line.lineTotal.toFixed(2)}
                                  </td>
                                </>
                              )}

                              {/* 8. ROW ACTION: DELETE */}
                              <td className="py-3 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    salesEntryService.removeLineItem(line.id);
                                    setSalesState(salesEntryService.getState());
                                  }}
                                  className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="حذف الصنف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4 SUMMARY CARDS BELOW ITEMS TABLE - ORDERED RTL: [1. إجمالي الأصناف (ضيق)] -> [2. إجمالي المبلغ] -> [3. قيمة الخصم] -> [4. القيمة المضافة / الضريبة] */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-800 text-right items-stretch" dir="rtl">
                  {/* CARD 1 — إجمالي الأصناف + إجمالي عدد القطع */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-1 text-center">
                    {/* القسم العلوي: إجمالي الأصناف */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي الأصناف</span>
                      </div>
                      <span className="text-base font-black font-mono text-slate-100 leading-none">
                        {activeInvoice.lineItems.length}
                      </span>
                    </div>

                    {/* خط أفقي فاصل */}
                    <div className="border-t border-slate-800/80 w-full" />

                    {/* القسم السفلي: إجمالي عدد القطع */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <Boxes className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي عدد القطع</span>
                      </div>
                      <div className="inline-flex items-center justify-center space-x-1.5 space-x-reverse leading-none">
                        <span className="text-base font-black font-mono text-slate-100">
                          {activeInvoice.lineItems.reduce((acc, l) => acc + (l.quantity || 0) + (l.bonusQuantity || 0), 0)}
                        </span>
                        {activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0) > 0 && (
                          <span
                            className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded leading-none"
                            title={`إجمالي البونص: ${activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0)}`}
                          >
                            {activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CARD 2 — إجمالي المبلغ + الصافي (تمركز متناظر مطابق) */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
                    {/* القسم العلوي: إجمالي المبلغ */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <DollarSign className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي المبلغ</span>
                      </div>
                      <span className="text-base font-black font-mono text-blue-400 leading-none">
                        ${activeInvoice.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* خط أفقي فاصل */}
                    <div className="border-t border-slate-800/80 w-full" />

                    {/* القسم السفلي: الصافي */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">الصافي</span>
                      </div>
                      <span 
                        onDoubleClick={() => handleNetDoubleClick(activeInvoice)}
                        className="text-base font-black font-mono text-emerald-400 leading-none cursor-default select-none transition-transform hover:scale-105"
                        title="الصافي"
                      >
                        ${Math.max(0, activeInvoice.subtotal - activeInvoice.totalDiscount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* CARD 3 — قيمة الخصم */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
                    {/* القسم العلوي: إعدادات الخصم (العنوان + نوع الخصم + زر بدون + الإدخال) */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1.5 pb-1.5">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-1.5 space-x-reverse text-slate-400">
                          <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-300 whitespace-nowrap">قيمة الخصم</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              salesEntryService.setInvoiceDiscount(activeInvoice.invoiceDiscountValue || 0, 'fixed');
                              setSalesState(salesEntryService.getState());
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                              (activeInvoice.invoiceDiscountType || 'fixed') === 'fixed'
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            مبلغ ($)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              salesEntryService.setInvoiceDiscount(activeInvoice.invoiceDiscountValue || 0, 'percent');
                              setSalesState(salesEntryService.getState());
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                              activeInvoice.invoiceDiscountType === 'percent'
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            نسبة (%)
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 space-x-reverse w-full">
                        <button
                          type="button"
                          onClick={() => {
                            salesEntryService.setInvoiceDiscount(0, activeInvoice.invoiceDiscountType || 'percent');
                            setSalesState(salesEntryService.getState());
                          }}
                          className={`py-0.5 px-2 rounded text-[10px] font-bold cursor-pointer transition-all text-center whitespace-nowrap ${
                            !activeInvoice.invoiceDiscountValue || activeInvoice.invoiceDiscountValue === 0
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          بدون
                        </button>

                        <LiveInput
                          type="text"
                          placeholder={activeInvoice.invoiceDiscountType === 'fixed' ? 'أدخل المبلغ ($)' : 'أدخل النسبة (%)'}
                          value={
                            activeInvoice.invoiceDiscountValue !== undefined &&
                            activeInvoice.invoiceDiscountValue !== 0
                              ? activeInvoice.invoiceDiscountValue
                              : ''
                          }
                          onChange={val => {
                            salesEntryService.setInvoiceDiscount(val, activeInvoice.invoiceDiscountType || 'percent');
                            setSalesState(salesEntryService.getState());
                          }}
                          className="flex-1 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-center text-rose-400 font-mono text-xs font-bold focus:outline-none focus:border-blue-500 placeholder-slate-600"
                        />
                      </div>
                    </div>

                    {/* خط أفقي فاصل */}
                    <div className="border-t border-slate-800/80 w-full" />

                    {/* القسم السفلي: قيمة الخصم الناتجة */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي قيمة الخصم</span>
                      </div>
                      <span className="text-base font-black font-mono text-rose-400 leading-none">
                        -${activeInvoice.totalDiscount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* CARD 4 — القيمة المضافة / الضريبة */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
                    {/* القسم العلوي: ضريبة القيمة المضافة + القيمة الناتجة */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                      <label className="flex items-center justify-center space-x-2 space-x-reverse text-xs font-bold text-slate-200 cursor-pointer select-none w-full">
                        <input
                          type="checkbox"
                          checked={activeInvoice.isTaxInvoice === true}
                          onChange={e => {
                            salesEntryService.setTaxInvoice(e.target.checked);
                            setSalesState(salesEntryService.getState());
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                          القيمة المضافة (ضريبة 14%)
                        </span>
                      </label>
                      <span className="text-base font-black font-mono text-blue-400 leading-none">
                        +${(activeInvoice.totalTax || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* خط أفقي فاصل */}
                    <div className="border-t border-slate-800/80 w-full" />

                    {/* القسم السفلي: خصم ضريبي + القيمة الناتجة */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">خصم ضريبي:</span>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          {[0, 1, 3].map(rate => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => {
                                salesEntryService.setTaxDiscountRate(rate);
                                setSalesState(salesEntryService.getState());
                              }}
                              className={`py-0.5 px-1.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                                (activeInvoice.taxDiscountRate || 0) === rate
                                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {rate === 0 ? 'بدون' : `${rate}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className={`text-base font-black font-mono leading-none ${
                        (activeInvoice.taxDiscount || 0) > 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {(activeInvoice.taxDiscount || 0) > 0
                          ? `-$${(activeInvoice.taxDiscount || 0).toFixed(2)}`
                          : '$0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PHASE 03: POS MODE UI */}
            {currentMode === 'pos' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                      <Barcode className="w-4 h-4" />
                      <span>ماسح الباركود المستمر السريع لنقاط البيع</span>
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      الماسح جاهز
                    </span>
                    <span>المسح في المستند الحالي: {activeInvoice.scanCount}</span>
                  </div>
                </div>

                {/* Auto-focused barcode input */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
                  <label className="block text-xs font-mono text-slate-300 font-bold flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>وجه ماسح الباركود أو اكتب الرقم التسلسلي واضغط Enter (إضافة تلقائية مستمرة)</span>
                  </label>
                  <input
                    ref={scanInputRef}
                    type="text"
                    placeholder="مثال: 880912345601 أو SN-X1-99410..."
                    value={posScanInput}
                    onChange={e => setPosScanInput(e.target.value)}
                    onKeyDown={handlePosScanKeyDown}
                    className="w-full px-4 py-3 bg-slate-900 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    يدعم مئات المسحات دون الحاجة للماوس. يحدد الصنف تلقائياً، يضيف البند، يملأ السعر/الضريبة/الشحنة، ويعيد التركيز.
                  </p>
                </div>

                {/* Stream of scanned lines */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                        <th className="pb-2">اسم الصنف</th>
                        <th className="pb-2">الباركود / التسلسلي</th>
                        <th className="pb-2">الكمية</th>
                        <th className="pb-2">السعر ($)</th>
                        <th className="pb-2">الإجمالي الأساسي ($)</th>
                        <th className="pb-2">الخصم ($)</th>
                        <th className="pb-2">بعد الخصم ($)</th>
                        <th className="pb-2">الضريبة ($)</th>
                        <th className="pb-2 text-right">إجمالي البند ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeInvoice.lineItems.map(line => {
                        const baseTotal = line.quantity * line.unitPrice;
                        const totalAfterDiscount = Math.max(0, baseTotal - line.discountAmount);
                        return (
                          <tr key={line.id} className="hover:bg-slate-950/50">
                            <td className="py-2 font-bold text-slate-100">{line.productName}</td>
                            <td className="py-2 font-mono text-emerald-400 text-[10px]">{line.barcode} {line.serialNumber ? `(${line.serialNumber})` : ''}</td>
                            <td className="py-2 font-mono font-bold text-slate-100">
                              <div className="flex items-center space-x-1 space-x-reverse flex-wrap gap-1">
                                <div className="flex items-center space-x-1 space-x-reverse" title={line.basicUnit ? `الكمية الأساسية (${line.basicUnit})` : 'الكمية الأساسية'}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(line.id, -1)}
                                    className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
                                    title="إنقاص الكمية الأساسية"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <LiveInput
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={line.quantity || ''}
                                    onChange={val => {
                                      const parsed = parseInt(val, 10);
                                      const newQty = isNaN(parsed) ? 0 : parsed;
                                      if (newQty > 0) {
                                        const res = salesEntryService.updateLineQuantity(line.id, newQty);
                                        if (!res.success) {
                                          showToast(res.error || 'الكمية غير متاحة');
                                        }
                                        setSalesState(salesEntryService.getState());
                                      }
                                    }}
                                    onBlur={() => {
                                      if (!line.quantity || line.quantity < 1) {
                                        salesEntryService.updateLineQuantity(line.id, 1);
                                        setSalesState(salesEntryService.getState());
                                      }
                                    }}
                                    className="w-12 px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-center text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(line.id, 1)}
                                    className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
                                    title="زيادة الكمية الأساسية"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>

                                {line.subUnit ? (
                                  <div className="flex items-center space-x-1 space-x-reverse" title={`الكمية الفرعية (${line.subUnit})`}>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSubQty(line.id, -1)}
                                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
                                      title={`إنقاص الكمية الفرعية (${line.subUnit})`}
                                    >
                                      <Minus className="w-2.5 h-2.5" />
                                    </button>
                                    <LiveInput
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={line.subQuantity !== undefined && line.subQuantity !== null && line.subQuantity !== 0 ? line.subQuantity : ''}
                                      placeholder="0"
                                      onChange={val => {
                                        const parsed = parseInt(val, 10);
                                        const newSubQty = isNaN(parsed) ? 0 : Math.max(0, parsed);
                                        salesEntryService.updateLineSubQuantity(line.id, newSubQty);
                                        setSalesState(salesEntryService.getState());
                                      }}
                                      className="w-12 px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-center text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSubQty(line.id, 1)}
                                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
                                      title={`زيادة الكمية الفرعية (${line.subUnit})`}
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-2 font-mono text-slate-300">
                              <div className="flex items-center space-x-0.5">
                                <span className="text-slate-500 text-[10px]">$</span>
                                <LiveInput
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={line.unitPrice === 0 ? '' : line.unitPrice}
                                  onChange={val => {
                                    const parsed = parseFloat(val);
                                    const newPrice = isNaN(parsed) ? 0 : Math.max(0, parsed);
                                    salesEntryService.updateLineUnitPrice(line.id, newPrice);
                                    setSalesState(salesEntryService.getState());
                                  }}
                                  className="w-16 px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </td>
                            <td className="py-2 font-mono text-slate-300">${baseTotal.toFixed(2)}</td>
                            <td className="py-2 font-mono text-rose-400">-${line.discountAmount.toFixed(2)}</td>
                            <td className="py-2 font-mono text-amber-300 font-semibold">${totalAfterDiscount.toFixed(2)}</td>
                            <td className="py-2 font-mono text-sky-400">${line.taxAmount.toFixed(2)}</td>
                            <td className="py-2 font-mono text-emerald-400 font-bold text-right">${line.lineTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4 SUMMARY CARDS BELOW ITEMS TABLE - ORDERED RTL: [1. إجمالي الأصناف (ضيق)] -> [2. إجمالي المبلغ] -> [3. قيمة الخصم] -> [4. القيمة المضافة / الضريبة] */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-800 text-right items-stretch" dir="rtl">
                  {/* CARD 1 — إجمالي الأصناف + إجمالي عدد القطع */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-1 text-center">
                    {/* القسم العلوي: إجمالي الأصناف */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي الأصناف</span>
                      </div>
                      <span className="text-base font-black font-mono text-slate-100 leading-none">
                        {activeInvoice.lineItems.length}
                      </span>
                    </div>

                    {/* خط أفقي فاصل */}
                    <div className="border-t border-slate-800/80 w-full" />

                    {/* القسم السفلي: إجمالي عدد القطع */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <Boxes className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي عدد القطع</span>
                      </div>
                      <div className="inline-flex items-center justify-center space-x-1.5 space-x-reverse leading-none">
                        <span className="text-base font-black font-mono text-slate-100">
                          {activeInvoice.lineItems.reduce((acc, l) => acc + (l.quantity || 0) + (l.bonusQuantity || 0), 0)}
                        </span>
                        {activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0) > 0 && (
                          <span
                            className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded leading-none"
                            title={`إجمالي البونص: ${activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0)}`}
                          >
                            {activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CARD 2 — إجمالي المبلغ + الصافي (تمركز متناظر مطابق) */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
                    {/* القسم العلوي: إجمالي المبلغ */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <DollarSign className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي المبلغ</span>
                      </div>
                      <span className="text-base font-black font-mono text-blue-400 leading-none">
                        ${activeInvoice.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* خط أفقي فاصل */}
                    <div className="border-t border-slate-800/80 w-full" />

                    {/* القسم السفلي: الصافي */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">الصافي</span>
                      </div>
                      <span 
                        onDoubleClick={() => handleNetDoubleClick(activeInvoice)}
                        className="text-base font-black font-mono text-emerald-400 leading-none cursor-default select-none transition-transform hover:scale-105"
                        title="الصافي"
                      >
                        ${Math.max(0, activeInvoice.subtotal - activeInvoice.totalDiscount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* CARD 3 — قيمة الخصم */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
                    {/* القسم العلوي: إعدادات الخصم (العنوان + نوع الخصم + زر بدون + الإدخال) */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1.5 pb-1.5">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-1.5 space-x-reverse text-slate-400">
                          <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-300 whitespace-nowrap">قيمة الخصم</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              salesEntryService.setInvoiceDiscount(activeInvoice.invoiceDiscountValue || 0, 'fixed');
                              setSalesState(salesEntryService.getState());
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                              (activeInvoice.invoiceDiscountType || 'fixed') === 'fixed'
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            مبلغ ($)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              salesEntryService.setInvoiceDiscount(activeInvoice.invoiceDiscountValue || 0, 'percent');
                              setSalesState(salesEntryService.getState());
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                              activeInvoice.invoiceDiscountType === 'percent'
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            نسبة (%)
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 space-x-reverse w-full">
                        <button
                          type="button"
                          onClick={() => {
                            salesEntryService.setInvoiceDiscount(0, activeInvoice.invoiceDiscountType || 'percent');
                            setSalesState(salesEntryService.getState());
                          }}
                          className={`py-0.5 px-2 rounded text-[10px] font-bold cursor-pointer transition-all text-center whitespace-nowrap ${
                            !activeInvoice.invoiceDiscountValue || activeInvoice.invoiceDiscountValue === 0
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          بدون
                        </button>

                        <LiveInput
                          type="text"
                          placeholder={activeInvoice.invoiceDiscountType === 'fixed' ? 'أدخل المبلغ ($)' : 'أدخل النسبة (%)'}
                          value={
                            activeInvoice.invoiceDiscountValue !== undefined &&
                            activeInvoice.invoiceDiscountValue !== 0
                              ? activeInvoice.invoiceDiscountValue
                              : ''
                          }
                          onChange={val => {
                            salesEntryService.setInvoiceDiscount(val, activeInvoice.invoiceDiscountType || 'percent');
                            setSalesState(salesEntryService.getState());
                          }}
                          className="flex-1 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-center text-rose-400 font-mono text-xs font-bold focus:outline-none focus:border-blue-500 placeholder-slate-600"
                        />
                      </div>
                    </div>

                    {/* خط أفقي فاصل */}
                    <div className="border-t border-slate-800/80 w-full" />

                    {/* القسم السفلي: قيمة الخصم الناتجة */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                        <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي قيمة الخصم</span>
                      </div>
                      <span className="text-base font-black font-mono text-rose-400 leading-none">
                        -${activeInvoice.totalDiscount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* CARD 4 — القيمة المضافة / الضريبة */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
                    {/* القسم العلوي: ضريبة القيمة المضافة + القيمة الناتجة */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                      <label className="flex items-center justify-center space-x-2 space-x-reverse text-xs font-bold text-slate-200 cursor-pointer select-none w-full">
                        <input
                          type="checkbox"
                          checked={activeInvoice.isTaxInvoice === true}
                          onChange={e => {
                            salesEntryService.setTaxInvoice(e.target.checked);
                            setSalesState(salesEntryService.getState());
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                          القيمة المضافة (ضريبة 14%)
                        </span>
                      </label>
                      <span className="text-base font-black font-mono text-blue-400 leading-none">
                        +${(activeInvoice.totalTax || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* خط أفقي فاصل */}
                    <div className="border-t border-slate-800/80 w-full" />

                    {/* القسم السفلي: خصم ضريبي + القيمة الناتجة */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">خصم ضريبي:</span>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          {[0, 1, 3].map(rate => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => {
                                salesEntryService.setTaxDiscountRate(rate);
                                setSalesState(salesEntryService.getState());
                              }}
                              className={`py-0.5 px-1.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                                (activeInvoice.taxDiscountRate || 0) === rate
                                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {rate === 0 ? 'بدون' : `${rate}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className={`text-base font-black font-mono leading-none ${
                        (activeInvoice.taxDiscount || 0) > 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {(activeInvoice.taxDiscount || 0) > 0
                          ? `-$${(activeInvoice.taxDiscount || 0).toFixed(2)}`
                          : '$0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PHASE 04: BUTTON MODE UI */}
            {currentMode === 'button' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                      <Grid className="w-4 h-4" />
                      <span>وضع الأزرار الملموسة للشاشات باللمس</span>
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors ${
                        showFavoritesOnly
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>المفضلة فقط</span>
                    </button>
                  </div>
                </div>

                {/* Categories Bar */}
                <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedSubCategory('All');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat === 'All' ? 'الكل' : cat}
                    </button>
                  ))}
                </div>

                {/* Grid of Compact Touch Product Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleQuickAddProduct(p, 1)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleQuickAddProduct(p, 1);
                        }
                      }}
                      className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-amber-500/60 transition-all text-right flex flex-col justify-between relative group hover:scale-[1.01] shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    >
                      {/* Top Header: SubCategory + Favorite */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[80%]">
                          {p.subCategory || p.category}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            salesEntryService.toggleFavoriteProduct(p.id);
                            setSalesState(salesEntryService.getState());
                          }}
                          className="text-slate-600 hover:text-amber-400 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                        >
                          <Star className={`w-3 h-3 ${p.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </div>

                      {/* Product Name */}
                      <div className="font-bold text-slate-100 text-xs leading-snug line-clamp-2 min-h-[2rem] mb-1.5" title={p.name}>
                        {p.name}
                      </div>

                      {/* Bottom Footer: Price + Stock Info */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-900/90 font-mono text-xs">
                        <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                          ${p.unitPrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          المخزون: <span className="font-mono font-medium text-slate-300">{p.stockQty}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>

          {/* RIGHT / INVOICE SUMMARY PANEL (4 cols) - Left column in RTL - Only rendered when visible */}
          {isReceiptVisible && (
            <div className="lg:col-span-4 flex flex-col space-y-3" dir="rtl">
              {/* 1. Main Receipt Card - Natural flowing receipt */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                {/* Header with show/hide toggle */}
                <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="text-xs font-bold text-slate-100 font-mono uppercase">معاينة الإيصال</h3>
                    <button
                      type="button"
                      onClick={() => setIsReceiptVisible(false)}
                      title="إخفاء معاينة الإيصال"
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors flex items-center justify-center cursor-pointer border border-slate-700/60"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400 font-bold px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                    {activeInvoice.lineItems.length} بنود
                  </span>
                </div>

                {/* Line items list */}
                <div className="max-h-72 lg:max-h-96 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                {activeInvoice.lineItems.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs italic">
                    لا توجد أصناف في الفاتورة بعد.
                  </div>
                ) : (
                  activeInvoice.lineItems.map(line => (
                    <div
                      key={line.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between font-sans">
                        <span className="font-bold text-slate-200 text-xs truncate max-w-[170px]" title={line.productName}>
                          {line.productName}
                        </span>
                        <span className="text-emerald-400 font-mono font-bold text-xs">
                          ${line.lineTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span>الكمية: <strong className="text-slate-200 font-mono">{line.quantity}</strong></span>
                          {line.subUnit && (line.subQuantity || 0) > 0 ? (
                            <>
                              <span className="text-slate-700">|</span>
                              <span className="text-cyan-400 font-mono">فرعية: {line.subQuantity} {line.subUnit}</span>
                            </>
                          ) : null}
                          {line.bonusQuantity && line.bonusQuantity > 0 ? (
                            <>
                              <span className="text-slate-700">|</span>
                              <span className="text-amber-400 font-bold font-mono">بونص: +{line.bonusQuantity}</span>
                            </>
                          ) : null}
                          <span className="text-slate-700">|</span>
                          <span>السعر: <strong className="text-slate-200 font-mono">${line.unitPrice.toFixed(2)}</strong></span>
                        </div>
                        {line.discountAmount > 0 && (
                          <span className="text-rose-400 font-bold font-mono">
                            خصم: -${line.discountAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Calculation Summary Breakdown - Positioned directly below items in the same receipt */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2 font-mono text-xs">
                {/* 1. Subtotal Before Discount (Only shown when there is an actual discount > 0) */}
                {activeInvoice.totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-slate-300 text-[11px]">
                    <span>الإجمالي قبل الخصم:</span>
                    <span className="font-bold">${activeInvoice.subtotal.toFixed(2)}</span>
                  </div>
                )}

                {/* 2. Invoice Discount (Only shown when discount > 0) */}
                {activeInvoice.totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-rose-400 text-[11px]">
                    <span>قيمة الخصم:</span>
                    <span className="font-bold">
                      -${activeInvoice.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* 3. VAT (Only shown when VAT is enabled and totalTax > 0) */}
                {activeInvoice.isTaxInvoice === true && activeInvoice.totalTax > 0 && (
                  <div className="flex justify-between items-center text-sky-400 text-[11px]">
                    <span>ضريبة القيمة المضافة (14%):</span>
                    <span className="font-bold">
                      +${activeInvoice.totalTax.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* 4. Tax Discount (Only shown when tax discount is active and > 0) */}
                {(activeInvoice.taxDiscountRate || 0) > 0 && (activeInvoice.taxDiscount || 0) > 0 && (
                  <div className="flex justify-between items-center text-rose-400 text-[11px]">
                    <span>الخصم الضريبي ({activeInvoice.taxDiscountRate}%):</span>
                    <span className="font-bold">
                      -${(activeInvoice.taxDiscount || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {(activeInvoice.totalDiscount > 0 || (activeInvoice.isTaxInvoice === true && activeInvoice.totalTax > 0) || ((activeInvoice.taxDiscountRate || 0) > 0 && (activeInvoice.taxDiscount || 0) > 0)) && (
                  <div className="h-px bg-slate-800/80 my-1" />
                )}

                {/* 5. Final Grand Total (Always visible, clean and directly attached to the receipt) */}
                <div className="flex justify-between items-center text-slate-100 font-bold text-xs pt-0.5">
                  <span className="text-xs">الإجمالي النهائي:</span>
                  <span className="text-emerald-400 text-sm font-black font-mono">
                    ${activeInvoice.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* FINAL ACTIONS - SINGLE ROW AT THE BOTTOM OF THE SALES SCREEN */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl" dir="rtl">
          <StandardActionBar
            hasHold={true}
            gridCols={7}
            onNew={handleNewInvoiceAction}
            onSave={handleSaveAndPayAction}
            onHold={handleHoldAction}
            onView={handleViewHistoryAction}
            onPrint={handlePrintInvoiceAction}
            onCancel={handleCancelInvoiceAction}
            onClose={handleCloseScreenAction}
            newLabel="فاتورة جديدة F1"
            saveLabel="حفظ ودفع F2"
            holdLabel="تعليق F3"
            viewLabel="عرض F4"
            printLabel="طباعة F5"
            cancelLabel="إلغاء F6"
            closeLabel="إغلاق F7"
          />
        </div>
      </div>
    )}

      {/* TAB 2: OPEN / HELD INVOICES & HISTORY */}
      {activeTab === 'open_invoices' && (
        <div className="space-y-6 animate-fade-in">
          {/* Section 1: Held Invoices */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <PauseCircle className="w-5 h-5 text-amber-400" />
                  <span>مدير الفواتير المعلقة (Held Invoices)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">استئناف الفواتير المعلقة أو إدارة الطلبات المفتوحة بأمان.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('sales_terminal')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  العودة لشاشة المبيعات
                </button>
                {openInvoices.length > 0 && (
                  <button
                    onClick={() => setDeleteConfirmModal({ isOpen: true, type: 'all' })}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف جميع الفواتير المعلقة</span>
                  </button>
                )}
              </div>
            </div>

            {openInvoices.length === 0 ? (
              <div className="p-6 text-center text-slate-500 italic bg-slate-950 rounded-xl border border-slate-800 text-xs">
                لا توجد فواتير معلقة حالياً.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">رقم الفاتورة</th>
                      <th className="py-2.5 px-3">العميل</th>
                      <th className="py-2.5 px-3">نمط الإدخال</th>
                      <th className="py-2.5 px-3 text-center">الأصناف</th>
                      <th className="py-2.5 px-3 text-right">الإجمالي</th>
                      <th className="py-2.5 px-3 text-center">الحالة</th>
                      <th className="py-2.5 px-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {openInvoices.map((inv, idx) => (
                      <tr key={inv.id ? `${inv.id}-${idx}` : `open-inv-${idx}`} className="hover:bg-slate-950/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-amber-400">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 text-slate-200 font-sans font-medium">{inv.customerName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">
                            {inv.mode === 'standard' ? 'قياسي' : inv.mode === 'pos' ? 'POS' : 'أزرار'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300">{inv.lineItems.length}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">${inv.grandTotal.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">معلقة</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleResumeInvoice(inv.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              <Play className="w-3 h-3 fill-slate-950" />
                              <span>استئناف</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmModal({
                                isOpen: true,
                                type: 'single',
                                invoiceId: inv.id,
                                invoiceNumber: inv.invoiceNumber
                              })}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Completed / Saved Invoices History */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <span>سجل الفواتير المحفوظة والمكتملة (Saved Invoices History)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">عرض وتفريغ وطباعة وتعديل الفواتير السابقة المعالجة.</p>
              </div>
            </div>


            {/* Filter / Search Controls Area */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  <span>تصفية وبحث الفواتير</span>
                </span>
                {hasActiveHistoryFilters && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    (تم تطبيق الفلاتر - إظهار {filteredCompletedInvoices.length} من أصل {completedInvoices?.length || 0})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Search (Invoice Number / Customer Name) */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">البحث (رقم/عميل)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="رقم الفاتورة أو العميل..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                  </div>
                </div>

                {/* 2. From Date */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                {/* 3. To Date */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                {/* 4. Payment Status */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">حالة الفاتورة / الدفع</label>
                  <select
                    value={historyPaymentStatus}
                    onChange={(e) => setHistoryPaymentStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                  >
                    <option value="all">الكل</option>
                    <option value="paid">مدفوعة</option>
                    <option value="deferred">آجلة / غير مدفوعة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>

                {/* 5. Payment Method */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">طريقة الدفع</label>
                  <select
                    value={historyPaymentMethod}
                    onChange={(e) => setHistoryPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                  >
                    <option value="all">الكل</option>
                    <option value="cash">نقداً</option>
                    <option value="card">بطاقة</option>
                    <option value="mixed">مختلط</option>
                    <option value="deferred">آجل / على الحساب</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={handleResetHistoryFilters}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مسح الفلاتر</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyHistoryFilters}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-950" />
                  <span>تطبيق</span>
                </button>
              </div>
            </div>

            {(!completedInvoices || completedInvoices.length === 0) ? (
              <div className="p-6 text-center text-slate-500 italic bg-slate-950 rounded-xl border border-slate-800 text-xs">
                لا توجد فواتير مكتملة في السجل حالياً.
              </div>
            ) : filteredCompletedInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <p className="text-xs text-amber-400 font-bold">لا توجد فواتير تطابق معايير البحث والتصفية المحددة.</p>
                <button
                  type="button"
                  onClick={handleResetHistoryFilters}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط ومسح الفلاتر</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-center border-collapse table-fixed min-w-[850px] text-xs">
                  <colgroup>
                    <col className="w-[15%]" />
                    <col className="w-[17%]" />
                    <col className="w-[20%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-950/90 border-b-2 border-slate-800 text-slate-200 font-bold text-xs h-11">
                      <th className="py-3 px-3 text-center font-bold">رقم الفاتورة</th>
                      <th className="py-3 px-3 text-center font-bold">التاريخ والوقت</th>
                      <th className="py-3 px-3 text-center font-bold">العميل</th>
                      <th className="py-3 px-3 text-center font-bold">طريقة الدفع / الحالة</th>
                      <th className="py-3 px-3 text-center font-bold">الإجمالي</th>
                      <th className="py-3 px-3 text-center font-bold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredCompletedInvoices.map((inv, idx) => (
                      <tr key={inv.id ? `${inv.id}-${idx}` : `comp-inv-${idx}`} className="hover:bg-slate-800/40 transition-colors h-12">
                        {/* 1. رقم الفاتورة */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                            <span className="font-mono font-bold text-slate-100 text-xs">{inv.invoiceNumber}</span>
                            {inv.status === 'cancelled' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                                ملغاة
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. التاريخ والوقت */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300 text-[11px] whitespace-nowrap">
                          {(() => {
                            const d = new Date(inv.createdAt);
                            if (isNaN(d.getTime())) return <span>{inv.createdAt}</span>;
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            const formattedDate = `${day}/${month}/${year}`;
                            const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            return (
                              <div className="flex flex-col items-center justify-center space-y-0.5">
                                <span className="font-semibold text-slate-200">{formattedDate}</span>
                                <span className="text-[10px] text-slate-400">{formattedTime}</span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* 3. العميل */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-slate-200 text-xs truncate block max-w-[200px] mx-auto" title={inv.customerName}>
                            {inv.customerName}
                          </span>
                        </td>

                        {/* 4. طريقة الدفع / الحالة */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            {inv.status === 'cancelled' ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                ملغاة (Cancelled)
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                inv.paymentMethod === 'deferred'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : inv.paymentMethod === 'card'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : inv.paymentMethod === 'mixed'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {inv.paymentMethod === 'deferred'
                                  ? 'آجل / على الحساب'
                                  : inv.paymentMethod === 'card'
                                  ? 'بطاقة'
                                  : inv.paymentMethod === 'mixed'
                                  ? 'مختلط'
                                  : 'نقداً'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. الإجمالي */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-mono font-bold text-xs ${
                            inv.status === 'cancelled' ? 'line-through text-slate-500' : 'text-emerald-400'
                          }`}>
                            ${inv.grandTotal.toFixed(2)}
                          </span>
                        </td>

                        {/* 6. الإجراءات */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5 space-x-reverse flex-wrap gap-1">
                            {/* معاينة */}
                            <button
                              type="button"
                              onClick={() => setCompletedReceipt(inv)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-[11px] border border-slate-700 flex items-center space-x-1 space-x-reverse cursor-pointer transition-all shrink-0"
                              title="معاينة الفاتورة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>معاينة</span>
                            </button>

                            {/* طباعة */}
                            <button
                              type="button"
                              onClick={() => {
                                setCompletedReceipt(inv);
                                setTimeout(() => triggerPrintExecution(), 150);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] border border-slate-700 flex items-center space-x-1 space-x-reverse cursor-pointer transition-all shrink-0"
                              title="طباعة الفاتورة"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>طباعة</span>
                            </button>

                            {/* تعديل */}
                            <button
                              type="button"
                              onClick={() => setEditConfirmModal({ isOpen: true, invoice: inv })}
                              disabled={inv.status === 'cancelled'}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border flex items-center space-x-1 space-x-reverse cursor-pointer transition-all shrink-0 ${
                                inv.status === 'cancelled'
                                  ? 'bg-slate-800 text-slate-500 border-slate-800 opacity-50 cursor-not-allowed'
                                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                              }`}
                              title="تعديل الفاتورة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            {/* إلغاء الفاتورة (مع فحص الصلاحيات) */}
                            <button
                              type="button"
                              onClick={() => setCancelConfirmModal({ isOpen: true, invoice: inv })}
                              disabled={inv.status === 'cancelled'}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border flex items-center space-x-1 space-x-reverse transition-all cursor-pointer shrink-0 ${
                                inv.status === 'cancelled'
                                  ? 'bg-slate-800 text-slate-500 border-slate-800 opacity-50 cursor-not-allowed'
                                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 shadow-sm'
                              }`}
                              title="إلغاء فاتورة مبيعات (Cancel Sales Invoice)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{inv.status === 'cancelled' ? 'ملغاة' : 'إلغاء'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SALES RETURNS */}
      {activeSalesSection === 'sales_returns' && (
        <div className="animate-fade-in">
          <VGF06SalesReturns
            onBackToSales={() => handleNavigateSalesSection('sales_terminal')}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* TAB 3: CUSTOMER BALANCES */}
      {activeSalesSection === 'customer_balances' && (
        <CustomerBalancesListModal
          isOpen={true}
          onClose={() => handleNavigateSalesSection('sales_terminal')}
          onSelectCustomerForStatement={(cId) => {
            setStatementTargetCustomerId(cId);
            handleNavigateSalesSection('customer_statement');
          }}
        />
      )}

      {/* TAB 4: CUSTOMER STATEMENT */}
      {activeSalesSection === 'customer_statement' && (
        <CustomerStatementReportModal
          isOpen={true}
          defaultCustomerId={statementTargetCustomerId}
          onClose={() => handleNavigateSalesSection('sales_terminal')}
        />
      )}

      {/* TAB 5: CUSTOMER RECORDS / MASTER VIEW */}
      {activeSalesSection === 'customer_records' && (
        <div className="animate-fade-in">
          <CustomerMasterView
            onClose={() => handleNavigateSalesSection('sales_terminal')}
            onNavigateSection={onNavigateSection}
          />
        </div>
      )}

      {/* TAB 6: SALES REPORTS */}
      {activeSalesSection === 'sales_reports' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 space-x-reverse">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>تقارير المبيعات وحزمة التكامل المنظومي</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { type: 'pos_perf', title: 'أداء ماسح الباركود POS', desc: 'مؤشرات سرعة المسح، إحصائيات القراءة، ومعدل الإنجاز.' },
                { type: 'button_usage', title: 'تحليلات وضع الأزرار اللمسية', desc: 'أكثر الفئات نقراً، وتكرار استخدام المنتجات المفضلة.' },
                { type: 'speed_audit', title: 'سرعة المبيعات وإنتاجية أمين الصندوق', desc: 'مدة إنجاز الفاتورة ومعدل معالجة العمليات.' },
                { type: 'mode_stats', title: 'مصفوفة توزيع أنماط المبيعات', desc: 'مقارنة إحصائية بين الوضع القياسي وPOS ووضع الأزرار.' },
                { type: 'module_integration', title: 'سجل تكامل نظام ERP', desc: 'ترحيل الأستاذ العام، حجز المخزون، وسجلات إيصالات الخزينة.' }
              ].map(rpt => (
                <button
                  key={rpt.type}
                  onClick={() => setActiveReportModal(rpt.type as any)}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-right transition-all space-y-2 cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-100">{rpt.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{rpt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SALES STATS & METRICS */}
      {activeSalesSection === 'sales_stats' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-[11px] font-mono text-slate-400">إجمالي الإيرادات</span>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-2">${metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-1">{metrics.totalInvoicesCompleted} فواتير مكتملة</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-[11px] font-mono text-slate-400">سرعة مسح POS</span>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">{metrics.averageScansPerMin} مسحة/دقيقة</p>
              <p className="text-[10px] text-emerald-400 mt-1">الماسح المستمر نشط</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-[11px] font-mono text-slate-400">متوسط وقت الفاتورة</span>
              <p className="text-2xl font-black text-amber-400 font-mono mt-2">{metrics.averageInvoiceTimeSeconds} ثانية</p>
              <p className="text-[10px] text-slate-400 mt-1">إنهاء مبيعات سريع</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-[11px] font-mono text-slate-400">توزيع أنماط الإدخال</span>
              <p className="text-xs font-black text-indigo-300 font-mono mt-2">
                قياسي: {metrics.standardModeCount} | POS: {metrics.posModeCount} | أزرار: {metrics.buttonModeCount}
              </p>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (() => {
        const cashVal = parseFloat(cashAmountPaid) || 0;
        const cardVal = parseFloat(cardAmountPaid) || 0;
        const creditVal = parseFloat(creditAmountPaid) || 0;
        const totalNeeded = activeInvoice.grandTotal;
        const totalAllocated = cashVal + cardVal + creditVal;
        const remainingUnallocated = Math.max(0, totalNeeded - totalAllocated);
        const changeDue = (cardVal === 0 && creditVal === 0 && cashVal > totalNeeded) ? (cashVal - totalNeeded) : 0;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-3xl w-full space-y-3.5 shadow-2xl my-auto">
              <div className="relative flex items-center justify-center border-b border-slate-800 pb-2.5">
                <h3 className="text-lg sm:text-xl font-black text-slate-100 text-center tracking-wide">
                  إنهاء الفاتورة ومعالجة الدفع
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="absolute left-0 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. أعلى النافذة: بطاقة المبلغ المستحق للدفع في المنتصف */}
              <div className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-0.5 font-mono shadow-inner flex flex-col items-center justify-center">
                <span className="text-slate-400 text-xs sm:text-sm font-semibold">المبلغ المستحق للدفع</span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-400 leading-none tracking-tight py-1">
                  ${totalNeeded.toFixed(2)}
                </div>
              </div>

              {/* 2. أسفل Card المبلغ المستحق: عمودان متساويان ومتناظران تماماً (3 خانات في كل عمود) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
                {/* العمود الأيمن: 3 خانات لطرق الدفع */}
                <div className="space-y-2.5">
                  {/* الخانة الأولى: 1. النقدي */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold font-mono text-xs sm:text-sm flex items-center space-x-1.5 space-x-reverse">
                        <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>1. النقدي ($)</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Double Click للتعيين</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={cashAmountPaid}
                      onChange={e => handleCashChange(e.target.value)}
                      onDoubleClick={() => handleDoubleClickPayment('cash')}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEnterOnPaymentInput('cash');
                        }
                      }}
                      className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-mono font-bold text-base sm:text-lg text-center focus:border-amber-500 focus:outline-none cursor-pointer"
                      placeholder="0.00"
                      title="نقر مزدوج (Double Click) لنقل كامل المبلغ إلى النقدي وتصفير باقي الطرق"
                    />
                  </div>

                  {/* الخانة الثانية: 2. البطاقة */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold font-mono text-xs sm:text-sm flex items-center space-x-1.5 space-x-reverse">
                        <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>2. البطاقة ($)</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Double Click للتعيين</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={cardAmountPaid}
                      onChange={e => handleCardChange(e.target.value)}
                      onDoubleClick={() => handleDoubleClickPayment('card')}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEnterOnPaymentInput('card');
                        }
                      }}
                      className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-mono font-bold text-base sm:text-lg text-center focus:border-amber-500 focus:outline-none cursor-pointer"
                      placeholder="0.00"
                      title="نقر مزدوج (Double Click) لنقل كامل المبلغ إلى البطاقة وتصفير باقي الطرق"
                    />
                  </div>

                  {/* الخانة الثالثة: 3. الآجل */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold font-mono text-xs sm:text-sm flex items-center space-x-1.5 space-x-reverse">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>3. الآجل ($)</span>
                      </label>
                      {!isCreditAllowed ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                          غير مسموح
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Double Click للتعيين</span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      disabled={!isCreditAllowed}
                      value={creditAmountPaid}
                      onChange={e => handleCreditChange(e.target.value)}
                      onDoubleClick={() => handleDoubleClickPayment('credit')}
                      className={`w-full h-10 px-3 py-1.5 bg-slate-900 border rounded-lg font-mono font-bold text-base sm:text-lg text-center focus:outline-none ${
                        !isCreditAllowed
                          ? 'border-slate-800 text-slate-600 bg-slate-950/50 cursor-not-allowed'
                          : 'border-slate-700/80 text-slate-100 focus:border-amber-500 cursor-pointer'
                      }`}
                      placeholder="0.00"
                      title={isCreditAllowed ? "نقر مزدوج (Double Click) لنقل كامل المبلغ إلى الآجل وتصفير باقي الطرق" : "البيع الآجل غير مسموح لهذا العميل"}
                    />
                  </div>
                </div>

                {/* العمود الأيسر */}
                <div className="space-y-2.5">
                  {/* الخانة الأولى: الخزينة */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="payment-modal-treasury-select" className="text-xs sm:text-sm font-bold text-slate-200 flex items-center space-x-1.5 space-x-reverse">
                        <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>الخزينة</span>
                      </label>
                      {(() => {
                        const curTId = salesState.activeInvoice.treasuryId || (availableTreasuries[0]?.id || 'TR-01');
                        const perm = permissionIntegrationService.canUserAccessTreasury(currentUser.role, curTId, currentUser.username);
                        return (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            perm.allowed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}>
                            {perm.allowed ? 'مسموح' : 'غير مسموح'}
                          </span>
                        );
                      })()}
                    </div>

                    <select
                      id="payment-modal-treasury-select"
                      value={salesState.activeInvoice.treasuryId || (availableTreasuries[0]?.id || 'TR-01')}
                      onChange={(e) => {
                        const newTId = e.target.value;
                        const permCheck = permissionIntegrationService.canUserAccessTreasury(currentUser.role, newTId, currentUser.username);
                        if (!permCheck.allowed) {
                          showToast(`لا يمكن اختيار هذه الخزينة. ليس لديك صلاحية لاستخدام هذه الخزينة.`);
                          return;
                        }
                        const selectedT = availableTreasuries.find(t => t.id === newTId || t.code === newTId);
                        salesEntryService.setTreasury(newTId, selectedT ? selectedT.name : undefined);
                        setSalesState(salesEntryService.getState());
                      }}
                      className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none cursor-pointer leading-tight"
                    >
                      {availableTreasuries.map(t => {
                        const perm = permissionIntegrationService.canUserAccessTreasury(currentUser.role, t.id, currentUser.username);
                        const isAllowed = perm.allowed;
                        return (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={!isAllowed}
                            className={isAllowed ? 'bg-slate-900 text-slate-100 font-bold' : 'bg-slate-950 text-slate-500 font-normal'}
                          >
                            {t.name} ({t.code}) [{t.currency}] {!isAllowed ? '— [غير مسموح]' : ''}
                          </option>
                        );
                      })}
                    </select>

                    {(() => {
                      const curTId = salesState.activeInvoice.treasuryId || (availableTreasuries[0]?.id || 'TR-01');
                      const perm = permissionIntegrationService.canUserAccessTreasury(currentUser.role, curTId, currentUser.username);
                      if (!perm.allowed) {
                        return (
                          <p className="text-xs text-rose-400 font-medium leading-tight pt-0.5">
                            ⚠️ {perm.reason}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* الخانة الثانية: البنك */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="payment-modal-bank-select" className="text-xs sm:text-sm font-bold text-slate-200 flex items-center space-x-1.5 space-x-reverse">
                        <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>البنك</span>
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        متاح
                      </span>
                    </div>

                    <select
                      id="payment-modal-bank-select"
                      value={selectedBankId}
                      onChange={(e) => {
                        setSelectedBankId(e.target.value);
                      }}
                      className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none cursor-pointer leading-tight"
                    >
                      {availableBankAccounts.map(b => (
                        <option
                          key={b.id}
                          value={b.id}
                          className="bg-slate-900 text-slate-100 font-bold"
                        >
                          {b.bankName} ({b.accountNumber}) [{b.currency}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* مستطيلان متجاوران أسفل حقل البنك: أداة حسابية مستقلة */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* المربع الأيمن: حقل إدخال رقمي قابل للكتابة */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-center">
                        <label htmlFor="calc-custom-input" className="block text-slate-300 font-bold font-mono text-[11px] sm:text-xs text-center">
                          المدفوع المستلم
                        </label>
                      </div>
                      <input
                        id="calc-custom-input"
                        type="number"
                        step="any"
                        value={calcReceivedAmount}
                        onChange={e => setCalcReceivedAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-mono font-bold text-base sm:text-lg text-center focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* المربع الأيسر: عرض النتيجة فقط غير قابل للكتابة (currentTotalPaid - inputValue) */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-center">
                        <span className="block text-slate-300 font-bold font-mono text-[11px] sm:text-xs text-center">
                          الفرق / الناتج
                        </span>
                      </div>
                      {(() => {
                        const rawInput = calcReceivedAmount.trim();
                        const inputVal = parseFloat(rawInput);
                        const hasInput = rawInput !== '' && !isNaN(inputVal);

                        if (!hasInput) {
                          return (
                            <div className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 font-mono font-bold text-base sm:text-lg flex items-center justify-center text-center">
                              <span>-</span>
                            </div>
                          );
                        }

                        const currentTotalPaid = totalAllocated;
                        const result = Math.round((currentTotalPaid - inputVal) * 100) / 100;

                        return (
                          <div className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-amber-400 font-mono font-black text-base sm:text-lg flex items-center justify-center text-center">
                            <span>{result >= 0 ? `$${result.toFixed(2)}` : `-$${Math.abs(result).toFixed(2)}`}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Validation Details Box - مساحة محجوزة ثابتة بعرض نافذة الدفع بالكامل لمنع Layout Shift */}
              <div className="min-h-[108px] flex items-center">
                {(() => {
                  const valResult = salesEntryService.validateCustomerCredit(
                    activeInvoice.customerId,
                    creditVal,
                    'deferred',
                    activeInvoice.id
                  );

                  const allowCredit = valResult.allowCreditSales ?? false;
                  const creditLimit = valResult.creditLimit ?? 0;
                  const currentOutstanding = valResult.currentOutstanding ?? 0;
                  const invoiceCreditAmount = valResult.invoiceAmount ?? creditVal;
                  const projectedTotal = valResult.projectedOutstanding ?? (currentOutstanding + invoiceCreditAmount);
                  const isBlocked = (creditVal > 0 || !allowCredit) && !valResult.allowed;

                  if (creditVal === 0 && allowCredit && !isBlocked) {
                    return null;
                  }

                  return (
                    <div className={`w-full p-2.5 rounded-xl border text-xs font-mono space-y-2 ${
                      isBlocked 
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-200' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}>
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className={`font-bold ${isBlocked ? 'text-rose-300 font-sans' : 'text-amber-300 font-sans'}`}>
                          {isBlocked ? 'لا يمكن إتمام البيع الآجل' : 'تسجيل المبلغ كـ آجل (على الحساب)'}
                        </span>
                        <p className="text-xs text-slate-300 font-sans font-bold">
                          العميل: <span className="font-black text-amber-400">{activeInvoice.customerName}</span>
                        </p>
                        {isBlocked && (
                          <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-sans font-bold">
                            مرفوض
                          </span>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                        <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                          <span className="text-slate-300 font-bold text-[11px]">السماح بالبيع الآجل:</span>
                          <strong className={`pt-0.5 font-bold ${allowCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {allowCredit ? 'مسموح' : 'غير مسموح'}
                          </strong>
                        </div>
                        <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                          <span className="text-slate-300 font-bold text-[11px]">حد الائتمان:</span>
                          <strong className="text-slate-200 font-bold pt-0.5">
                            {creditLimit > 0 ? `$${creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'بلا سقف'}
                          </strong>
                        </div>
                        <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                          <span className="text-slate-300 font-bold text-[11px]">الرصيد الآجل الحالي:</span>
                          <strong className="text-amber-300 font-bold pt-0.5">${currentOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                          <span className="text-slate-300 font-bold text-[11px]">قيمة الفاتورة (أو الآجل):</span>
                          <strong className="text-sky-300 font-bold pt-0.5">${invoiceCreditAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                          <span className="text-slate-300 font-bold text-[11px]">الرصيد بعد العملية:</span>
                          <strong className={`pt-0.5 font-black ${creditLimit > 0 && projectedTotal > creditLimit ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'}`}>
                            ${projectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>

                      {isBlocked && (
                        <div className="pt-1.5 border-t border-rose-500/30 text-rose-300 font-bold text-xs font-sans text-center">
                          {valResult.message}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {changeDue > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center font-mono">
                    <span className="text-slate-300 text-xs font-bold font-sans">الباقي للعميل (النقدي):</span>
                    <span className="text-emerald-400 text-sm font-black">${changeDue.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* 4. أسفل ذلك: شريط الأزرار الأربعة الأساسية */}
              <div className="grid grid-cols-4 gap-2.5 pt-3 border-t border-slate-800" dir="rtl">
                {/* 1. حفظ */}
                <button
                  type="button"
                  onClick={handleSaveInvoiceOnly}
                  className="h-11 px-2.5 sm:px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span className="truncate">حفظ</span>
                </button>

                {/* 2. حفظ وطباعة A4 */}
                <button
                  type="button"
                  onClick={handleCompletePaymentAndPrint}
                  className="h-11 px-2.5 sm:px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span className="truncate">حفظ وطباعة A4</span>
                </button>

                {/* 3. حفظ وطباعة ريسيت */}
                <button
                  type="button"
                  onClick={handleResetPaymentModal}
                  className="h-11 px-2.5 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/80 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span className="truncate">حفظ وطباعة ريسيت</span>
                </button>

                {/* 4. إغلاق */}
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="h-11 px-2.5 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span className="truncate">إغلاق</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Customer-Facing Invoice / Printed Receipt Modal */}
      {completedReceipt && (
        <SalesInvoiceReceiptModal
          receipt={completedReceipt}
          onClose={() => setCompletedReceipt(null)}
          currentUserFallback={currentUser}
        />
      )}

      {/* Customer Selection Modal for Sales Invoice (Customer Records Screen) */}
      <CustomerRecordsModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={(cust) => handleSelectCustomer(cust)}
        selectedCustomerId={salesState.activeInvoice.customerId}
        isSelectionOnlyMode={true}
      />

      {/* Customer Master / Creation & Editing Modal */}
      {isAddCustomerFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-right" dir="rtl">
            <CustomerMasterView
              initialCustomerId={editingCustomerIdForModal || undefined}
              onClose={() => {
                setIsAddCustomerFormOpen(false);
                setEditingCustomerIdForModal(null);
                setSalesState(salesEntryService.getState());
              }}
            />
          </div>
        </div>
      )}

      {/* Report Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 uppercase">تقرير {activeReportModal.replace('_', ' ')}</h3>
              <button onClick={() => setActiveReportModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
              <p className="text-amber-400 font-bold">تقرير أداء إدخال المبيعات VERTEX ERP</p>
              <p className="text-slate-500">الطابع الزمني: {new Date().toLocaleString()}</p>
              <div className="h-px bg-slate-800 my-2" />
              <p>إجمالي الإيرادات المعالجة: ${metrics.totalRevenue.toLocaleString()}</p>
              <p>الفواتير المكتملة: {metrics.totalInvoicesCompleted}</p>
              <p>سرعة ماسح POS: {metrics.averageScansPerMin} مسحة/دقيقة</p>
              <p>التكامل النشط: الأستاذ العام، حجز المخزون، دفتر أستاذ ائتمان العملاء، صندوق الخزينة</p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setActiveReportModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs">
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Modal */}
      {editConfirmModal.isOpen && editConfirmModal.invoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">تعديل فاتورة محفوظة</h3>
                <p className="text-xs text-amber-400 font-mono font-bold">{editConfirmModal.invoice.invoiceNumber} - {editConfirmModal.invoice.customerName}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-200 leading-relaxed space-y-2">
              <p className="font-semibold text-amber-300">
                أنت على وشك تعديل فاتورة محفوظة. أي تعديل وحفظ سيؤثر على بيانات الفاتورة الحالية.
              </p>
              <p className="text-[11px] text-slate-400">
                سيتم فتح الفاتورة برقمها الأصلي (<span className="font-mono text-slate-200 font-bold">{editConfirmModal.invoice.invoiceNumber}</span>) لإجراء التعديلات المطلوبة وتحديث السجل.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditConfirmModal({ isOpen: false, invoice: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editConfirmModal.invoice) {
                    salesEntryService.loadCompletedInvoiceForEdit(editConfirmModal.invoice.id);
                    setSalesState(salesEntryService.getState());
                    setIsBonusMode(false);
                    setActiveTab('sales_terminal');
                    showToast(`جاري تعديل الفاتورة المحفوظة رقم ${editConfirmModal.invoice.invoiceNumber}`);
                  }
                  setEditConfirmModal({ isOpen: false, invoice: null });
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
              >
                متابعة التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Edited Invoice Confirmation Modal */}
      {saveEditConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">تأكيد حفظ تعديلات الفاتورة</h3>
                <p className="text-xs text-amber-400 font-mono font-bold">
                  {activeInvoice.invoiceNumber} — {activeInvoice.customerName}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-200 leading-relaxed space-y-2.5">
              <p className="font-semibold text-amber-300">
                لقد قمت بإجراء تعديلات على بيانات هذه الفاتورة المحفوظة. هل تريد تأكيد حفظ التغييرات وتحديث السجل؟
              </p>
              {(() => {
                const diffs = salesEntryService.getSavedInvoiceDifferences();
                if (diffs.length === 0) return null;
                return (
                  <div className="space-y-1.5 pt-1 border-t border-amber-500/20">
                    <span className="text-[11px] font-bold text-slate-400">التغييرات التي تم إجراؤها:</span>
                    <div className="space-y-1">
                      {diffs.map((d, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-amber-400 font-bold">{d.label}:</span>
                          <div className="flex items-center space-x-1.5 space-x-reverse font-mono text-[10px]">
                            <span className="text-slate-400 line-through">{d.from}</span>
                            <span className="text-slate-500">←</span>
                            <span className="text-emerald-400 font-bold">{d.to}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setSaveEditConfirmModal({ isOpen: false, actionType: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const type = saveEditConfirmModal.actionType;
                  setSaveEditConfirmModal({ isOpen: false, actionType: null });
                  if (type === 'save_only') {
                    executeSaveInvoiceOnly();
                  } else if (type === 'complete_and_print') {
                    executeCompletePaymentAndPrint();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
              >
                موافق، حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Draft / Held Invoices Only) */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-3" dir="rtl">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className="text-base font-bold text-slate-100">
                  {deleteConfirmModal.type === 'all'
                    ? 'حذف جميع الفواتير المعلقة؟'
                    : 'حذف الفاتورة المعلقة؟'}
                </h3>
                <p className="text-xs text-slate-400">لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1 text-right" dir="rtl">
              {deleteConfirmModal.type === 'all' ? (
                <p>أنت على وشك حذف جميع الفواتير المعلقة وعددها <span className="font-bold text-rose-400">{openInvoices.length}</span> بشكل نهائي من قائمة الانتظار.</p>
              ) : (
                <p>أنت على وشك حذف الفاتورة المعلقة رقم <span className="font-mono font-bold text-amber-400">{deleteConfirmModal.invoiceNumber}</span> بشكل نهائي.</p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2" dir="rtl">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: 'single' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmModal.type === 'all') {
                    salesEntryService.deleteAllHeldInvoices();
                    setSalesState(salesEntryService.getState());
                    showToast('تم حذف جميع الفواتير المعلقة بنجاح');
                  } else if (deleteConfirmModal.invoiceId) {
                    salesEntryService.deleteHeldInvoice(deleteConfirmModal.invoiceId);
                    setSalesState(salesEntryService.getState());
                    showToast(`تم حذف الفاتورة ${deleteConfirmModal.invoiceNumber}`);
                  }
                  setDeleteConfirmModal({ isOpen: false, type: 'single' });
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 transition-colors cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Profitability Popover / Modal (Available strictly for authorized users) */}
      {profitModal.isOpen && profitModal.data && (
        <div id="invoice-profitability-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in">
          <div id="invoice-profitability-modal-container" className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-5 shadow-2xl relative text-right flex flex-col max-h-[90vh]" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5 space-x-reverse text-emerald-400 font-bold text-base">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span>ربحية الفاتورة</span>
                    {profitModal.invoiceNumber && (
                      <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                        {profitModal.invoiceNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-normal text-slate-400 mt-0.5">
                    تحليل هوامش الربح وتكلفة المخزون المعتمدة
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-invoice-profit-modal"
                onClick={() => setProfitModal({ isOpen: false, data: null, invoiceNumber: '' })}
                className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer p-2 rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Prominent Profitability Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Card 1: الربح حسب متوسط التكلفة */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-950 to-slate-950 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold pb-2 border-b border-slate-800/80">
                  <span className="text-indigo-300 text-sm">الربح حسب متوسط التكلفة</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    التكلفة: ${profitModal.data.totalAverageCost.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${profitModal.data.profitByAverageCost >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${profitModal.data.profitByAverageCost.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    الصافي: ${profitModal.data.netSales.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Card 2: الربح حسب آخر سعر شراء */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold pb-2 border-b border-slate-800/80">
                  <span className="text-amber-300 text-sm">الربح حسب آخر سعر شراء</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    التكلفة: ${profitModal.data.totalLastPurchaseCost.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${profitModal.data.profitByLastPurchasePrice >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${profitModal.data.profitByLastPurchasePrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    الصافي: ${profitModal.data.netSales.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Metrics Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">الصافي</span>
                <span className="text-base font-black font-mono text-slate-100 mt-1">
                  ${profitModal.data.netSales.toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">تكلفة الأصناف</span>
                <span className="text-base font-black font-mono text-amber-400 mt-1">
                  ${profitModal.data.itemsCost.toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">الربح المعتمد</span>
                <span className={`text-base font-black font-mono mt-1 ${profitModal.data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${profitModal.data.profit.toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-medium">هامش الربح</span>
                <span className={`text-base font-black font-mono mt-1 ${profitModal.data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profitModal.data.profitMargin.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Section: تفاصيل ربحية الأصناف */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                  تفاصيل ربحية الأصناف
                </h4>
                {profitModal.data.itemsBreakdown && (
                  <span className="text-xs text-slate-400 font-mono">
                    ({profitModal.data.itemsBreakdown.length} صنف)
                  </span>
                )}
              </div>

              {/* Exact 7 Columns Table */}
              <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-72">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10 text-slate-300 font-bold">
                    <tr>
                      <th className="p-3 whitespace-nowrap text-right">الصنف</th>
                      <th className="p-3 whitespace-nowrap text-center">الكمية</th>
                      <th className="p-3 whitespace-nowrap text-left">سعر البيع</th>
                      <th className="p-3 whitespace-nowrap text-left">صافي البيع</th>
                      <th className="p-3 whitespace-nowrap text-left">متوسط التكلفة</th>
                      <th className="p-3 whitespace-nowrap text-left">آخر سعر شراء</th>
                      <th className="p-3 whitespace-nowrap text-left">الربح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {profitModal.data.itemsBreakdown && profitModal.data.itemsBreakdown.length > 0 ? (
                      profitModal.data.itemsBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          {/* 1. الصنف */}
                          <td className="p-3 text-slate-200 font-semibold max-w-[200px]">
                            <div className="truncate" title={item.productName}>
                              {item.productName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {item.productCode}
                            </div>
                          </td>

                          {/* 2. الكمية */}
                          <td className="p-3 text-center font-mono text-slate-300 font-bold">
                            {item.quantity}
                            {item.bonusQuantity > 0 && (
                              <span className="mr-1 text-[10px] text-emerald-400 font-normal">
                                (+{item.bonusQuantity} بونص)
                              </span>
                            )}
                          </td>

                          {/* 3. سعر البيع */}
                          <td className="p-3 text-left font-mono text-slate-300 font-semibold">
                            ${item.unitPrice.toFixed(2)}
                          </td>

                          {/* 4. صافي البيع */}
                          <td className="p-3 text-left font-mono text-blue-400 font-bold">
                            ${item.netSales.toFixed(2)}
                          </td>

                          {/* 5. متوسط التكلفة */}
                          <td className="p-3 text-left font-mono text-slate-400 font-medium">
                            ${item.averageCost.toFixed(2)}
                          </td>

                          {/* 6. آخر سعر شراء */}
                          <td className="p-3 text-left font-mono text-amber-400/90 font-medium">
                            ${item.lastPurchasePrice.toFixed(2)}
                          </td>

                          {/* 7. الربح */}
                          <td className="p-3 text-left font-mono font-black">
                            <span className={item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              ${item.profit.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          لا توجد أصناف في هذه الفاتورة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-[11px] text-slate-500">
                * يتم حساب الربح بالاعتماد على تكلفة المخزون المعتمدة حاليًا في النظام.
              </div>
              <button
                type="button"
                id="btn-close-profit-modal-footer"
                onClick={() => setProfitModal({ isOpen: false, data: null, invoiceNumber: '' })}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invoice Confirmation & Authorization Modal */}
      {cancelConfirmModal.isOpen && cancelConfirmModal.invoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-rose-400 font-bold text-sm">
                <Ban className="w-5 h-5" />
                <span>هل أنت متأكد من إلغاء هذه الفاتورة؟</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelConfirmModal({ isOpen: false, invoice: null })}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>رقم الفاتورة:</span>
                  <span className="font-bold text-slate-100">{cancelConfirmModal.invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>العميل:</span>
                  <span className="font-bold text-slate-100">{cancelConfirmModal.invoice.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>الإجمالي:</span>
                  <span className="font-bold text-emerald-400">${cancelConfirmModal.invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>تاريخ الإصدار:</span>
                  <span className="text-slate-400">{new Date(cancelConfirmModal.invoice.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-[11px] leading-relaxed">
                <p className="font-bold mb-1">تنبيه هام:</p>
                عند إلغاء الفاتورة، سيتم تعديل حالتها رسمياً إلى <strong>(ملغاة)</strong> مع حجز رقم الفاتورة permanently في السجل، وتسجيل عمليـة الإلغـاء في سجلات التدقيق الأمني.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCancelConfirmModal({ isOpen: false, invoice: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleExecuteCancelInvoice(cancelConfirmModal.invoice!)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition-all flex items-center space-x-1.5 space-x-reverse"
              >
                <Ban className="w-4 h-4" />
                <span>تأكيد الإلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Screen Unsaved Changes Confirmation Modal */}
      {isCloseConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>تأكيد إغلاق الفاتورة</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCloseConfirmModalOpen(false);
                  if (isPendingExitToMain) {
                    setIsSalesNavModalOpen(true);
                  }
                  setIsPendingExitToMain(false);
                }}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-200 text-sm font-semibold leading-relaxed">
                إغلاق هذه الفاتورة سيؤدي إلى عدم حفظ أي محتويات أو عمل أي تعديلات، هل تريد المتابعة؟
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-[11px] leading-relaxed">
                سيؤدي التوكيد إلى إغلاق الفاتورة وتجاهل كافة التعديلات والمحتويات غير المحفوظة.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCloseConfirmModalOpen(false);
                  if (isPendingExitToMain) {
                    setIsSalesNavModalOpen(true);
                  }
                  setIsPendingExitToMain(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                لا / إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isPendingExitToMain) {
                    executeExitSalesModuleToMain();
                  } else {
                    executeCloseScreenToSalesModal();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center space-x-1.5 space-x-reverse font-bold"
              >
                <Check className="w-4 h-4" />
                <span>موافق</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Unsaved Changes Confirmation Modal */}
      {isNewInvoiceConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>تأكيد بدء فاتورة جديدة</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewInvoiceConfirmModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-200 text-sm font-semibold leading-relaxed">
                توجد فاتورة مفتوحة حاليًا. بدء فاتورة جديدة سيغلق الفاتورة الحالية، ولن يتم حفظ أي من التعديلات أو البيانات غير المحفوظة.
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-[11px] leading-relaxed">
                سيؤدي التوكيد إلى التخلص من كافة البيانات غير المحفوظة في الفاتورة الحالية وفتح فاتورة جديدة بحالة فارغة ونظيفة.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewInvoiceConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executeNewInvoice}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center space-x-1.5 space-x-reverse font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>بدء فاتورة جديدة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY / PRODUCTS STOCK BROWSER MODAL */}
      {isInventoryBrowserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-7xl h-[92vh] max-h-[960px] flex flex-col shadow-2xl overflow-hidden text-right">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="erp-modal-title text-slate-100 flex items-center space-x-2 space-x-reverse">
                    <span>دليل استعراض الأصناف ورصيد المخزون</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                      {products.length} صنف مسجل
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    اختر صنفاً لإضافته مباشرة إلى الفاتورة الحالية مع عرض تفاصيل الأرصدة والكميات بالمستودع المحدد
                  </p>
                </div>
              </div>

              {/* READ-ONLY WAREHOUSE DISPLAY IN HEADER + QUERY BUTTON */}
              <div className="flex items-center space-x-3 space-x-reverse flex-wrap gap-2.5">
                <div 
                  id="inventory-modal-warehouse-readonly-badge"
                  className="flex items-center space-x-3 space-x-reverse px-5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner select-none pointer-events-none"
                  title="المخزن المرتبط بالفاتورة الحالية (للقراءة فقط)"
                >
                  <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-400 font-semibold leading-tight">المخزن الحالي:</span>
                    <span className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                      {currentInvoiceWarehouse.name} {currentInvoiceWarehouse.code ? `(${currentInvoiceWarehouse.code})` : ''}
                    </span>
                  </div>
                </div>

                {/* NEW BUTTON: عرض رصيد الصنف في جميع المخازن */}
                <button
                  type="button"
                  id="btn-view-all-warehouses-stock"
                  onClick={handleOpenAllWarehousesStockModal}
                  className="flex items-center space-x-2 space-x-reverse px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 border border-amber-500/35 text-sm font-bold transition-all shadow-sm cursor-pointer"
                  title="استعلام عن رصيد الصنف المحدد في جميع مستودعات النظام"
                >
                  <Boxes className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>عرض الرصيد بجميع المخازن</span>
                </button>
              </div>
            </div>

            {/* Controls & Filter Bar */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 space-y-2.5 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Bar within Modal */}
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="تصفية بالاسم، الكود SKU، الباركود، أو المستودع..."
                    value={inventoryModalSearch}
                    onChange={(e) => setInventoryModalSearch(e.target.value)}
                    className="w-full pr-9 pl-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {inventoryModalSearch && (
                    <button
                      type="button"
                      onClick={() => setInventoryModalSearch('')}
                      className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter Dropdown */}
                <div>
                  <select
                    value={inventorySelectedCategory}
                    onChange={(e) => setInventorySelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="All">جميع الفئات والتصنيفات</option>
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categories Quick Filter Pills */}
              <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto custom-scrollbar pb-1 text-xs">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setInventorySelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                      inventorySelectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {cat === 'All' ? 'جميع الأصناف' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid / Table Body */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {(() => {
                const filtered = products.filter(p => {
                  const matchesCategory = inventorySelectedCategory === 'All' || p.category === inventorySelectedCategory || p.subCategory === inventorySelectedCategory;
                  if (!matchesCategory) return false;

                  if (!inventoryModalSearch.trim()) return true;
                  const q = inventoryModalSearch.trim().toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.code.toLowerCase().includes(q) ||
                    p.barcode.includes(q) ||
                    (p.warehouse && p.warehouse.toLowerCase().includes(q)) ||
                    (p.batchNumber && p.batchNumber.toLowerCase().includes(q))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80 my-auto">
                      <Package className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-slate-400 font-bold text-xs">لم يتم العثور على أصناف تطابق شروط البحث أو الفئة المحددة.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setInventoryModalSearch('');
                          setInventorySelectedCategory('All');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        إعادة ضبط الفلاتر
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner flex-1 flex flex-col">
                    <div className="w-full flex-1 overflow-y-auto custom-scrollbar">
                      <table className="w-full table-fixed text-right text-xs">
                        <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                          <tr>
                            <th className="py-3 px-3.5 text-center w-[4%]">
                              <input
                                type="checkbox"
                                checked={filtered.length > 0 && filtered.every(p => selectedProductIds.has(p.id))}
                                onChange={() => {
                                  const allSelected = filtered.length > 0 && filtered.every(p => selectedProductIds.has(p.id));
                                  setSelectedProductIds(prev => {
                                    const next = new Set(prev);
                                    if (allSelected) {
                                      filtered.forEach(p => next.delete(p.id));
                                    } else {
                                      filtered.forEach(p => next.add(p.id));
                                    }
                                    return next;
                                  });
                                }}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer accent-amber-500"
                                title="تحديد الكل / إلغاء تحديد الكل"
                              />
                            </th>
                            <th className="py-3 px-4 w-[46%] text-right font-bold text-slate-200 text-sm">اسم الصنف</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">الرصيد المتاح</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">السعر</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">التصنيف</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">كود / SKU</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filtered.map((p, idx) => {
                            const warehouseStock = getProductWarehouseStock(p);
                            const isOutOfStock = warehouseStock <= 0;
                            const isLowStock = warehouseStock > 0 && warehouseStock <= (p.reorderPoint || 10);
                            const isSelected = selectedProductIds.has(p.id);
                            const isFocused = focusedProductInBrowser?.id === p.id;

                            return (
                              <tr
                                key={p.id ? `${p.id}-${idx}` : `inv-modal-p-${idx}`}
                                className={`transition-colors group cursor-pointer ${
                                  isSelected 
                                    ? 'bg-amber-500/15' 
                                    : isFocused 
                                    ? 'bg-slate-800/90 ring-1 ring-amber-500/40' 
                                    : 'hover:bg-slate-900/80'
                                }`}
                                onClick={() => {
                                  setFocusedProductInBrowser(p);
                                  setSelectedProductIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(p.id)) next.delete(p.id);
                                    else next.add(p.id);
                                    return next;
                                  });
                                }}
                              >
                                <td className="py-3 px-3.5 text-center w-[4%]" onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      setFocusedProductInBrowser(p);
                                      setSelectedProductIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(p.id)) next.delete(p.id);
                                        else next.add(p.id);
                                        return next;
                                      });
                                    }}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer accent-amber-500"
                                  />
                                </td>
                                <td className="py-3 px-4 w-[46%] font-bold text-slate-100 text-base break-words leading-relaxed text-right">
                                  <span className="font-bold text-slate-100 text-base">{p.name}</span>
                                </td>
                                <td className="py-3 px-3 text-center w-[10%] whitespace-nowrap">
                                  <span className={`inline-block text-base font-black px-3 py-1.5 rounded-full leading-tight ${
                                    isOutOfStock
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : isLowStock
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}>
                                    {isOutOfStock ? 'نفد (0)' : `${warehouseStock} متاح`}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center w-[10%] whitespace-nowrap">
                                  <span className="inline-block text-base font-black font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-full leading-tight">
                                    ${p.unitPrice.toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center text-slate-300 whitespace-nowrap w-[10%]">
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium inline-block max-w-full truncate">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap w-[10%]">
                                  <div className="flex flex-col items-center">
                                    <span className="font-medium text-slate-300">{p.code}</span>
                                    {p.barcode && <span className="text-[10px] text-slate-500">{p.barcode}</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap w-[10%]" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleQuickAddProduct(p, 1);
                                      setIsInventoryBrowserOpen(false);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center space-x-1 space-x-reverse transition-all cursor-pointer shadow-sm shadow-amber-500/10 active:scale-95 w-full max-w-[110px]"
                                  >
                                    <Plus className="w-3.5 h-3.5 shrink-0" />
                                    <span>إضافة +</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse flex-wrap gap-2">
                {selectedProductIds.size > 0 ? (
                  <span className="text-amber-300 font-black text-sm bg-amber-500/15 border border-amber-500/30 px-5 py-2.5 rounded-xl shadow-sm">
                    تم تحديد {selectedProductIds.size} {selectedProductIds.size === 1 ? 'صنف' : selectedProductIds.size === 2 ? 'صنفين' : 'أصناف'}
                  </span>
                ) : (
                  <span className="text-sm">استخدم Checkbox لتحديد أصناف متعددة، أو زر "إضافة للفاتورة +" للإضافة المباشرة.</span>
                )}

                {selectedProductIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProductIds(new Set())}
                    className="text-slate-300 hover:text-rose-400 font-bold underline cursor-pointer text-sm px-3 py-2 transition-colors"
                  >
                    إلغاء التحديد
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3 space-x-reverse w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={selectedProductIds.size === 0}
                  onClick={handleAddSelectedProducts}
                  className={`px-6 py-3 rounded-xl font-black text-sm flex items-center space-x-2 space-x-reverse transition-all shadow-md ${
                    selectedProductIds.size > 0
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>
                    {selectedProductIds.size > 0
                      ? `إضافة المحدد (${selectedProductIds.size})`
                      : 'إضافة المحدد'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInventoryBrowserOpen(false)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition-colors text-sm shadow-sm active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ALL WAREHOUSES STOCK QUERY MODAL */}
      {isAllWarehousesStockModalOpen && selectedProductForWarehouseQuery && (
        <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[88vh] max-h-[860px] shadow-2xl overflow-hidden text-right flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/70 shrink-0">
              <div className="flex items-center space-x-3.5 space-x-reverse w-[80%] min-w-0">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                  <Boxes className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-100 whitespace-nowrap truncate tracking-tight">
                    رصيد الصنف في جميع المخازن
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap truncate">
                    استعلام تفصيلي فوري عن كميات الصنف المتاحة بكل مستودع (للقراءة فقط)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAllWarehousesStockModalOpen(false)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer shrink-0"
                title="إغلاق نافذة الأرصدة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Header Card */}
            <div className="px-6 py-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-6 shrink-0">
              <div className="w-[60%] space-y-1.5 text-right">
                <h4 className="text-xl font-black text-amber-300 break-words leading-relaxed">
                  {selectedProductForWarehouseQuery.name}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono">
                  <span>كود: <strong className="text-slate-300 font-semibold">{selectedProductForWarehouseQuery.code}</strong></span>
                  {selectedProductForWarehouseQuery.barcode && (
                    <span>• باركود: <strong className="text-slate-300 font-semibold">{selectedProductForWarehouseQuery.barcode}</strong></span>
                  )}
                  <span>• <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-sans">{selectedProductForWarehouseQuery.category}</span></span>
                </div>
              </div>
              <div className="w-[33%] flex flex-col items-end justify-center text-left">
                <span className="text-xs font-semibold text-slate-400 block mb-1">السعر:</span>
                <span className="inline-block text-lg font-black font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 rounded-full leading-tight shadow-sm shadow-emerald-500/10">
                  ${selectedProductForWarehouseQuery.unitPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Warehouses Stock Table */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner flex-1 flex flex-col">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-900/90 text-slate-300 font-bold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-4 px-6 text-sm font-bold text-slate-200">المخزن</th>
                      <th className="py-4 px-6 text-center text-sm font-bold text-slate-200 w-48">رصيد الصنف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {availableWarehouses.map((w, idx) => {
                      const stock = getProductStockInSpecificWarehouse(selectedProductForWarehouseQuery, w);
                      const isCurrentInvoiceWarehouse = w.id === currentInvoiceWarehouse.id || w.code === currentInvoiceWarehouse.code || w.name === currentInvoiceWarehouse.name;

                      return (
                        <tr key={w.id || `wh-${idx}`} className={`hover:bg-slate-900/50 transition-colors ${isCurrentInvoiceWarehouse ? 'bg-amber-500/5' : ''}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <Building2 className={`w-5 h-5 shrink-0 ${isCurrentInvoiceWarehouse ? 'text-amber-400' : 'text-slate-500'}`} />
                              <div>
                                <span className="text-slate-100 font-bold text-base block">{w.name}</span>
                                <span className="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-1.5 space-x-reverse">
                                  <span>{w.code || w.id}</span>
                                  {isCurrentInvoiceWarehouse && (
                                    <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px]">
                                      (المخزن الحالي للفاتورة)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-mono">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-base font-black leading-tight ${
                              stock > 0
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                            }`}>
                              {stock}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Table Total Row */}
                  <tfoot className="bg-slate-900/95 border-t-2 border-slate-700 font-bold sticky bottom-0">
                    <tr>
                      <td className="py-4 px-6 text-slate-100 text-base">إجمالي كميات الصنف</td>
                      <td className="py-4 px-6 text-center font-mono text-amber-400 text-lg font-black">
                        {availableWarehouses.reduce((sum, w) => sum + getProductStockInSpecificWarehouse(selectedProductForWarehouseQuery, w), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bottom Total Highlight & Close Action */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse text-sm font-bold text-slate-200">
                <span className="text-slate-400 text-sm">إجمالي الرصيد في جميع المخازن:</span>
                <span className="px-4 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-mono text-base font-black">
                  {availableWarehouses.reduce((sum, w) => sum + getProductStockInSpecificWarehouse(selectedProductForWarehouseQuery, w), 0)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAllWarehousesStockModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors cursor-pointer shadow-sm active:scale-95 w-full sm:w-auto"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALES NAVIGATION OVERLAY MODAL (Matching Reference Design) */}
      <SalesNavigationModal
        isOpen={isSalesNavModalOpen}
        onClose={handleDismissSalesNavModal}
        onSelectOption={(option: SalesNavDestination) => {
          setIsSalesNavModalOpen(false);
          if (option === 'sales_terminal') {
            setActiveTab('sales_terminal');
          } else if (option === 'reports_integration') {
            setActiveTab('reports_integration');
          } else if (option === 'balances') {
            setIsCustomerBalancesHubOpen(true);
          } else if (option === 'customers') {
            if (onNavigateSection) {
              onNavigateSection('customers');
            }
          }
        }}
      />

      {/* CUSTOMER BALANCES & STATEMENT HUB MODAL (Central 2-Card Modal) */}
      <CustomerBalancesHubModal
        isOpen={isCustomerBalancesHubOpen}
        onClose={() => {
          setIsCustomerBalancesHubOpen(false);
          setIsSalesNavModalOpen(true);
        }}
        onOpenStatementReport={() => {
          setIsCustomerBalancesHubOpen(false);
          setStatementTargetCustomerId('');
          setIsCustomerStatementReportOpen(true);
        }}
        onOpenBalancesList={() => {
          setIsCustomerBalancesHubOpen(false);
          setIsCustomerBalancesListOpen(true);
        }}
        onOpenSalesNav={() => {
          setIsCustomerBalancesHubOpen(false);
          setIsSalesNavModalOpen(true);
        }}
      />

      {/* LARGE CUSTOMER ACCOUNT STATEMENT REPORT SCREEN */}
      <CustomerStatementReportModal
        isOpen={isCustomerStatementReportOpen}
        defaultCustomerId={statementTargetCustomerId}
        onClose={() => {
          setIsCustomerStatementReportOpen(false);
          setIsCustomerBalancesHubOpen(true);
        }}
        onOpenSalesNav={() => {
          setIsCustomerStatementReportOpen(false);
          setIsSalesNavModalOpen(true);
        }}
      />

      {/* CUSTOMER BALANCES LIST MODAL */}
      <CustomerBalancesListModal
        isOpen={isCustomerBalancesListOpen}
        onClose={() => {
          setIsCustomerBalancesListOpen(false);
          setIsCustomerBalancesHubOpen(true);
        }}
        onSelectCustomerForStatement={(custCodeOrId) => {
          setStatementTargetCustomerId(custCodeOrId);
          setIsCustomerBalancesListOpen(false);
          setIsCustomerStatementReportOpen(true);
        }}
        onOpenSalesNav={() => {
          setIsCustomerBalancesListOpen(false);
          setIsSalesNavModalOpen(true);
        }}
      />

      {/* CUSTOMER RECORDS & SELECTION MODAL (For Invoice Customer Selection) */}
      <CustomerRecordsModal
        isOpen={isCustomerRecordsModalOpen}
        onClose={() => {
          setIsCustomerRecordsModalOpen(false);
        }}
        onRequestSafeExitSales={() => {
          setIsCustomerRecordsModalOpen(false);
          handleDismissSalesNavModal();
        }}
        onNavigateSalesTab={(tab) => {
          setIsCustomerRecordsModalOpen(false);
          setActiveTab(tab);
        }}
        onNavigateSection={(sec) => {
          setIsCustomerRecordsModalOpen(false);
          if (onNavigateSection) {
            onNavigateSection(sec);
          }
        }}
      />
    </div>
  );
};
