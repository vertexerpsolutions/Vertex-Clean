import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  FolderTree,
  Users,
  Building2,
  Landmark,
  ArrowLeftRight,
  GitFork,
  CheckCircle2,
  Clock,
  Ban,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  Calculator,
  ArrowRight,
  Vault,
  Archive,
  FileCheck,
  PauseCircle,
  Play,
  Eye,
  Receipt,
  Filter
} from 'lucide-react';
import { 
  incomeTransactionService, 
  IncomeMovementType, 
  IncomeAccountType, 
  IncomeTransaction, 
  TransferPolicy 
} from '../../services/incomeTransactionService';
import { treasuryService, Treasury } from '../../services/treasuryService';
import { customerService, Customer } from '../../services/customerService';
import { vendorService, Vendor } from '../../services/vendorService';
import { chartOfAccountsService, ChartAccountNode } from '../../services/chartOfAccountsService';
import { setupWizardService } from '../../services/setupWizardService';
import { bankAccountService } from '../../services/bankAccountService';
import { BranchItem, BankAccountItem } from '../../types';
import { StandardActionBar } from '../common/StandardActionBar';
import { CustomerRecordsModal } from '../customers/CustomerRecordsModal';
import { VendorRecordsModal } from '../vendors/VendorRecordsModal';
import { TreasuryRecordsModal } from '../treasuries/TreasuryRecordsModal';
import { SalesInvoiceReceiptModal } from '../vgf/VGF06SalesEntryModes';
import { SalesInvoice, InvoiceLineItem } from '../../services/salesEntryService';
import { permissionIntegrationService } from '../../services/permissionIntegrationService';
import { UserRole } from '../../core/vpe/security/SecurityTypes';

const mapIncomeTxToSalesInvoice = (tx: IncomeTransaction): SalesInvoice => {
  const lineItems: InvoiceLineItem[] = (tx.lines && tx.lines.length > 0)
    ? tx.lines.map((line, idx) => ({
        id: line.id || `line-${idx}`,
        productId: line.accountId || `acc-${idx}`,
        productCode: line.accountCode || `ACC-${idx + 1}`,
        productName: line.accountName || tx.accountName,
        barcode: '',
        warehouse: tx.treasuryName || '',
        batchNumber: '',
        quantity: 1,
        unitPrice: line.amount,
        lineTotal: line.amount,
        discountAmount: 0,
        taxAmount: 0,
        notes: line.notes || (line.accountCode ? `كود الحساب: ${line.accountCode}` : undefined),
      }))
    : [{
        id: 'line-main',
        productId: tx.accountId || 'acc-main',
        productCode: tx.accountCode || 'ACC-MAIN',
        productName: tx.accountName,
        barcode: '',
        warehouse: tx.treasuryName || '',
        batchNumber: '',
        quantity: 1,
        unitPrice: tx.amount,
        lineTotal: tx.amount,
        discountAmount: 0,
        taxAmount: 0,
        notes: tx.notes || (tx.accountCode ? `كود الحساب: ${tx.accountCode}` : undefined),
      }];

  return {
    id: tx.id,
    invoiceNumber: tx.documentNumber,
    mode: 'standard',
    customerId: tx.accountId,
    customerName: `${tx.accountName} (${tx.accountTypeLabel || (tx.type === 'inward' ? 'وارد نقدي' : 'صادر نقدي')})`,
    treasuryId: tx.treasuryId,
    treasuryName: tx.treasuryName,
    sellerName: tx.performedBy,
    createdAt: tx.createdAt || tx.date,
    status: tx.status === 'ملغي' ? 'cancelled' : 'completed',
    lineItems,
    subtotal: tx.amount,
    totalDiscount: 0,
    netBeforeTax: tx.amount,
    taxDiscount: 0,
    isTaxInvoice: false,
    vatRate: 0,
    totalTax: 0,
    grandTotal: tx.amount,
    cashPaid: tx.amount,
    cardPaid: 0,
    changeDue: 0,
    paymentMethod: 'cash',
    scanCount: lineItems.length,
    cancelledBy: tx.cancelledBy,
    cancelledAt: tx.cancelledAt,
  };
};

export interface SelectableAccountEntity {
  id: string;
  code?: string;
  name: string;
  type: IncomeAccountType;
  categoryOrSubtitle?: string;
  balance?: number;
  balanceLabel?: string;
  extraInfo?: string;
  targetBranchId?: string;
  targetBranchName?: string;
  targetTreasuryOrBankId?: string;
  targetTreasuryOrBankName?: string;
  targetType?: 'treasury' | 'bank';
}

export interface IncomeMovementLineState {
  lineId: string;
  entityId: string;
  accountCode?: string;
  accountName: string;
  accountType: IncomeAccountType;
  amount: string;
  notes: string;
  categoryOrSubtitle?: string;
  balance?: number;
  balanceLabel?: string;
  extraInfo?: string;
  targetBranchId?: string;
  targetBranchName?: string;
  targetTreasuryOrBankId?: string;
  targetTreasuryOrBankName?: string;
  targetType?: 'treasury' | 'bank';
}

interface IncomeTransactionsViewProps {
  isDark: boolean;
  initialMovementType?: IncomeMovementType;
  onBackToHome?: () => void;
}

export const IncomeTransactionsView: React.FC<IncomeTransactionsViewProps> = ({
  isDark,
  initialMovementType = 'inward',
  onBackToHome
}) => {
  // 1. Transaction Type: 'inward' (وارد خزينة) or 'outward' (صادر خزينة)
  const [movementType, setMovementType] = useState<IncomeMovementType>(initialMovementType);

  // 2. Account Type (الخيارات الستة فقط)
  const [accountType, setAccountType] = useState<IncomeAccountType>('chart_of_accounts');

  // 3. Form States
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');

  // 4. Movement Lines State (Multi-line support according to Phase 2)
  const [movementLines, setMovementLines] = useState<IncomeMovementLineState[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [isBrowserModalOpen, setIsBrowserModalOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);
  const [isTreasuryModalOpen, setIsTreasuryModalOpen] = useState<boolean>(false);
  const [isMainTreasuryModalOpen, setIsMainTreasuryModalOpen] = useState<boolean>(false);
  const [browserModalSearch, setBrowserModalSearch] = useState<string>('');
  const [browserModalCategoryFilter, setBrowserModalCategoryFilter] = useState<string>('all');

  // Transfer policy state
  const [transferPolicy, setTransferPolicy] = useState<TransferPolicy>(() => incomeTransactionService.getTransferPolicy());
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);

  // Feedback, Errors, and Modals
  const [formError, setFormError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<IncomeTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Add COA Account Modal
  const [showAddCoaModal, setShowAddCoaModal] = useState<boolean>(false);
  const [newCoaCode, setNewCoaCode] = useState<string>('');
  const [newCoaName, setNewCoaName] = useState<string>('');
  const [newCoaCategory, setNewCoaCategory] = useState<'expenses' | 'revenue' | 'assets' | 'liabilities' | 'equity'>('expenses');
  const [coaModalError, setCoaModalError] = useState<string | null>(null);

  // User State & Permissions Context (matching Sales / Purchases pattern)
  const [currentUser] = useState<{
    id?: string;
    username: string;
    fullName: string;
    role: UserRole;
  }>({
    id: 'USR-001',
    username: 'alex.mercer',
    fullName: 'Alex Mercer',
    role: 'SUPER_ADMIN'
  });

  // Floating Toast Notification System (matching Sales / Purchases pattern)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Transactions Log & Archive View State (matching Sales / Purchases pattern)
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [historyMovementTypeFilter, setHistoryMovementTypeFilter] = useState<'all' | 'inward' | 'outward'>('all');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');
  const [appliedHistoryFilters, setAppliedHistoryFilters] = useState<{
    search: string;
    status: 'all' | 'completed' | 'cancelled';
    movementType: 'all' | 'inward' | 'outward';
    dateFrom: string;
    dateTo: string;
  }>({
    search: '',
    status: 'all',
    movementType: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [deleteHeldConfirmModal, setDeleteHeldConfirmModal] = useState<{
    isOpen: boolean;
    transactionId?: string;
    transactionNumber?: string;
    isAll?: boolean;
  }>({
    isOpen: false
  });
  const [transactionsList, setTransactionsList] = useState<IncomeTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<IncomeTransaction | null>(null);

  // Cancel Transaction Dialog
  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; tx: IncomeTransaction | null; reason: string }>({
    isOpen: false,
    tx: null,
    reason: ''
  });

  // Voucher Preview Dialog (A4 Receipt view pattern matching Sales / Purchases)
  const [viewVoucher, setViewVoucher] = useState<IncomeTransaction | null>(null);

  // Subscriptions & Initial Data
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<ChartAccountNode[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);

  const reloadData = () => {
    try {
      const trs = treasuryService.getActiveTreasuries();
      setTreasuries(trs);
      if (!selectedTreasuryId && trs.length > 0) {
        setSelectedTreasuryId(trs[0].id);
      }

      setCustomers(customerService.getAllCustomers().filter(c => c.status === 'نشط' || c.status === 'active'));
      setVendors(vendorService.getAllVendors().filter(v => v.status === 'نشط' || v.status === 'active'));
      setCoaAccounts(chartOfAccountsService.getPostingAccounts());
      setBankAccounts(bankAccountService.getBankAccounts());
      setBranches(treasuryService.getAvailableBranches());
      setTransactionsList(incomeTransactionService.getAllTransactions());
      setTransferPolicy(incomeTransactionService.getTransferPolicy());
    } catch (err) {
      console.error('Error reloading income transactions data', err);
    }
  };

  useEffect(() => {
    reloadData();

    const unsubTreasury = treasuryService.subscribe(() => reloadData());
    const unsubIncome = incomeTransactionService.subscribe(() => {
      setTransactionsList(incomeTransactionService.getAllTransactions());
      setTransferPolicy(incomeTransactionService.getTransferPolicy());
    });
    const unsubCoa = chartOfAccountsService.subscribe(() => {
      setCoaAccounts(chartOfAccountsService.getPostingAccounts());
    });
    const unsubCustomer = customerService.subscribe(() => {
      setCustomers(customerService.getAllCustomers().filter(c => c.status !== 'محذوف' && c.status !== 'deleted'));
    });
    const unsubVendor = vendorService.subscribe(() => {
      setVendors(vendorService.getAllVendors().filter(v => v.status !== 'محذوف' && v.status !== 'deleted'));
    });

    return () => {
      unsubTreasury();
      unsubIncome();
      unsubCoa();
      unsubCustomer();
      unsubVendor();
    };
  }, []);

  // When changing account type, reset search, lines, dropdown, and modal states immediately
  useEffect(() => {
    setMovementLines([]);
    setSearchQuery('');
    setIsSearchDropdownOpen(false);
    setIsBrowserModalOpen(false);
    setIsCustomerModalOpen(false);
    setIsVendorModalOpen(false);
    setIsTreasuryModalOpen(false);
    setFormError(null);
    setSuccessTx(null);
  }, [accountType]);

  // Label for the selected counter account type
  const accountTypeLabel = useMemo(() => {
    switch (accountType) {
      case 'chart_of_accounts': return 'دليل الحسابات';
      case 'vendors': return 'الموردين';
      case 'customers': return 'العملاء';
      case 'other_treasury': return 'الخزائن الأخرى';
      case 'bank': return 'الحسابات البنكية';
      case 'branch_transfer': return 'تحويلات الفروع';
      default: return 'الحسابات';
    }
  }, [accountType]);

  // Metadata for VERTEX Records Browser Modal
  const modalTypeMeta = useMemo(() => {
    switch (accountType) {
      case 'chart_of_accounts':
        return {
          title: 'سجلات دليل الحسابات (Chart of Accounts Records)',
          tableTitle: 'قائمة حسابات الشجرة',
          unit: 'حساب',
          subtitle: 'اختر أي حساب من الشجرة لتحديده وإضافته مباشرة للحركة المالية',
          searchPlaceholder: 'البحث في دليل الحسابات بالاسم أو الكود أو الفئة...',
          icon: FolderTree,
          codeCol: 'كود الحساب',
          nameCol: 'اسم الحساب',
          catCol: 'التصنيف والطبيعة',
          balCol: 'الرصيد الدفتري'
        };
      case 'bank':
        return {
          title: 'سجلات الحسابات البنكية (Bank Records)',
          tableTitle: 'قائمة الحسابات البنكية',
          unit: 'حساب بنكي',
          subtitle: 'اختر أي حساب بنكي لتحديده وإضافته مباشرة للحركة المالية',
          searchPlaceholder: 'البحث في الحسابات البنكية باسم البنك، رقم الحساب أو الفرع...',
          icon: Landmark,
          codeCol: 'رقم الحساب',
          nameCol: 'اسم البنك / الحساب',
          catCol: 'الفرع والعملة',
          balCol: 'الرصيد البنكي'
        };
      case 'branch_transfer':
        return {
          title: 'سجلات تحويلات الفروع (Branch Transfer Records)',
          tableTitle: 'قائمة وجهات تحويل الفروع',
          unit: 'جهة تحويل',
          subtitle: 'اختر الخزينة أو الحساب البنكي بالفرع الآخر للتحويل المالي المباشر',
          searchPlaceholder: 'البحث في وجهات التحويل باسم الفرع أو الخزينة أو الحساب...',
          icon: Building2,
          codeCol: 'الكود / المعرف',
          nameCol: 'الجهة / الخزينة المحول إليها',
          catCol: 'الفرع والنوع',
          balCol: 'رصيد الخزينة بالفرع'
        };
      case 'other_treasury':
        return {
          title: 'سجلات الخزائن النقدية (Treasury Records)',
          tableTitle: 'قائمة الخزائن المتاحة',
          unit: 'خزينة',
          subtitle: 'اختر أي خزينة من القائمة لتحديدها وإضافتها مباشرة للحركة المالية',
          searchPlaceholder: 'البحث في الخزائن بالاسم أو الكود أو الفرع...',
          icon: Vault,
          codeCol: 'كود الخزينة',
          nameCol: 'اسم الخزينة',
          catCol: 'الفرع',
          balCol: 'رصيد الخزينة الحالي'
        };
      case 'customers':
        return {
          title: 'سجلات العملاء (Customer Records)',
          tableTitle: 'قائمة العملاء',
          unit: 'عميل',
          subtitle: 'اختر أي عميل من السجل لتحديده وإضافته مباشرة للحركة المالية',
          searchPlaceholder: 'البحث بالاسم أو الكود أو الهاتف...',
          icon: Users,
          codeCol: 'كود العميل',
          nameCol: 'اسم العميل',
          catCol: 'التصنيف',
          balCol: 'الرصيد'
        };
      case 'vendors':
        return {
          title: 'سجلات الموردين (Vendor Records)',
          tableTitle: 'قائمة الموردين',
          unit: 'مورد',
          subtitle: 'اختر أي مورد من السجل لتحديده وإضافته مباشرة للحركة المالية',
          searchPlaceholder: 'البحث بالاسم أو الكود أو الهاتف...',
          icon: Building2,
          codeCol: 'كود المورد',
          nameCol: 'اسم المورد',
          catCol: 'التصنيف',
          balCol: 'الرصيد'
        };
      default:
        return {
          title: `سجلات ${accountTypeLabel}`,
          tableTitle: `قائمة ${accountTypeLabel}`,
          unit: 'سجل',
          subtitle: 'اختر أي عنصر من القائمة لتحديده وإضافته مباشرة للحركة المالية',
          searchPlaceholder: 'البحث بالاسم أو الكود أو التفاصيل...',
          icon: Search,
          codeCol: 'الكود',
          nameCol: 'الاسم',
          catCol: 'التصنيف',
          balCol: 'الرصيد'
        };
    }
  }, [accountType, accountTypeLabel]);

  // Selected treasury details
  const currentTreasury = useMemo(() => {
    return treasuries.find(t => t.id === selectedTreasuryId);
  }, [treasuries, selectedTreasuryId]);

  const currentTreasuryBalance = useMemo(() => {
    if (!selectedTreasuryId) return 0;
    return treasuryService.getTreasuryBalance(selectedTreasuryId);
  }, [selectedTreasuryId, treasuries, transactionsList]);

  // Other Treasuries (excluding current selected treasury)
  const otherTreasuries = useMemo(() => {
    return treasuries.filter(t => t.id !== selectedTreasuryId);
  }, [treasuries, selectedTreasuryId]);

  // Normalized list of available entities for the chosen accountType
  const availableEntities = useMemo<SelectableAccountEntity[]>(() => {
    if (accountType === 'chart_of_accounts') {
      return coaAccounts.map(acc => ({
        id: acc.id,
        code: acc.code,
        name: acc.name || `حساب ${acc.code}`,
        type: 'chart_of_accounts',
        categoryOrSubtitle: `${acc.categoryLabel} (${acc.nature === 'debit' ? 'مدين' : 'دائن'})`,
        balance: acc.balance || 0,
        balanceLabel: 'الرصيد الدفتري'
      }));
    }

    if (accountType === 'vendors') {
      return vendors
        .filter(v => vendorService.isVendorActive(v))
        .map(v => {
          const bal = v.balanceDue !== undefined ? v.balanceDue : (vendorService.getVendorActualBalance(v).actualBalance || 0);
          return {
            id: v.id,
            code: v.code,
            name: v.name,
            type: 'vendors',
            categoryOrSubtitle: v.type ? `${v.type} • مورد مسجل` : (v.category ? `${v.category} • مورد مسجل` : 'مورد مسجل'),
            balance: bal,
            balanceLabel: 'رصيد المورد المستحق',
            extraInfo: v.mobile || v.phone2
          };
        });
    }

    if (accountType === 'customers') {
      return customers
        .filter(c => customerService.isCustomerActive(c))
        .map(c => {
          const bal = c.balanceDue !== undefined ? c.balanceDue : (customerService.getCustomerActualBalance(c).actualBalance || 0);
          return {
            id: c.id,
            code: c.code,
            name: c.name,
            type: 'customers',
            categoryOrSubtitle: 'عميل مسجل',
            balance: bal,
            balanceLabel: 'مديونية العميل',
            extraInfo: c.mobile
          };
        });
    }

    if (accountType === 'other_treasury') {
      return otherTreasuries.map(tr => ({
        id: tr.id,
        code: tr.code,
        name: tr.name,
        type: 'other_treasury',
        categoryOrSubtitle: `فرع: ${tr.branchName}`,
        balance: treasuryService.getTreasuryBalance(tr.id),
        balanceLabel: 'رصيد الخزينة الحالي'
      }));
    }

    if (accountType === 'bank') {
      const activeBranchId = currentTreasury?.branchId || 'BR-01';
      const branchBanks = bankAccounts.filter(b => b.branchId === activeBranchId);
      return branchBanks.map(b => ({
        id: b.id,
        code: b.accountNumber,
        name: b.bankName,
        type: 'bank' as const,
        categoryOrSubtitle: `رقم الحساب: ${b.accountNumber} (${b.currency})`,
        balance: bankAccountService.getBankBalance(b.id, activeBranchId),
        balanceLabel: 'رصيد البنك الحالي',
        extraInfo: b.branchName
      }));
    }

    if (accountType === 'branch_transfer') {
      const list: SelectableAccountEntity[] = [];
      branches.forEach(b => {
        const bTreasuries = treasuries.filter(t => t.branchId === b.id && t.id !== selectedTreasuryId);
        bTreasuries.forEach(tr => {
          const bal = treasuryService.getTreasuryBalance(tr.id);
          list.push({
            id: `br-tr-${b.id}-${tr.id}`,
            code: tr.code,
            name: `${tr.name} (فرع ${b.name})`,
            type: 'branch_transfer',
            categoryOrSubtitle: `خزينة بفرع: ${b.name}`,
            balance: bal,
            balanceLabel: 'رصيد الخزينة بالفرع',
            targetBranchId: b.id,
            targetBranchName: b.name,
            targetTreasuryOrBankId: tr.id,
            targetTreasuryOrBankName: tr.name,
            targetType: 'treasury'
          });
        });

        // Filter bank accounts that belong to target branch b.id
        const targetBranchBanks = bankAccounts.filter(bnk => bnk.branchId === b.id);
        targetBranchBanks.forEach(bnk => {
          list.push({
            id: `br-bnk-${b.id}-${bnk.id}`,
            code: bnk.accountNumber,
            name: `${bnk.bankName} (فرع ${b.name})`,
            type: 'branch_transfer',
            categoryOrSubtitle: `حساب بنكي (${bnk.accountNumber})`,
            balance: bankAccountService.getBankBalance(bnk.id, b.id),
            balanceLabel: 'رصيد البنك بالفرع',
            targetBranchId: b.id,
            targetBranchName: b.name,
            targetTreasuryOrBankId: bnk.id,
            targetTreasuryOrBankName: bnk.bankName,
            targetType: 'bank'
          });
        });
      });
      return list;
    }

    return [];
  }, [accountType, coaAccounts, vendors, customers, otherTreasuries, bankAccounts, branches, treasuries, selectedTreasuryId]);

  // Autocomplete filtered list for search input
  const filteredSearchEntities = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableEntities.slice(0, 20);
    }
    const q = searchQuery.toLowerCase().trim();
    return availableEntities.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.code && e.code.toLowerCase().includes(q)) ||
      (e.categoryOrSubtitle && e.categoryOrSubtitle.toLowerCase().includes(q)) ||
      (e.extraInfo && e.extraInfo.toLowerCase().includes(q))
    );
  }, [availableEntities, searchQuery]);

  // Filtered list for the full browse modal
  const filteredModalEntities = useMemo(() => {
    let list = availableEntities;
    if (browserModalCategoryFilter !== 'all') {
      list = list.filter(e => {
        if (accountType === 'chart_of_accounts') {
          const filter = browserModalCategoryFilter.trim();
          const subtitle = (e.categoryOrSubtitle || '');
          if (filter === 'مصروفات') return subtitle.includes('مصروفات') || subtitle.includes('تكلفة');
          if (filter === 'إيرادات') return subtitle.includes('إيرادات') || subtitle.includes('ايرادات');
          if (filter === 'أصول') return subtitle.includes('أصول') || subtitle.includes('الأصول');
          if (filter === 'خصوم') return subtitle.includes('خصوم') || subtitle.includes('الخصوم') || subtitle.includes('التزامات');
          if (filter === 'حقوق ملكية') return subtitle.includes('حقوق') || subtitle.includes('ملكية');
          return subtitle.includes(filter);
        }
        if (accountType === 'bank') {
          return e.categoryOrSubtitle?.includes(browserModalCategoryFilter) || e.extraInfo?.includes(browserModalCategoryFilter);
        }
        if (accountType === 'branch_transfer') {
          return e.targetType === browserModalCategoryFilter || e.targetBranchName === browserModalCategoryFilter;
        }
        return true;
      });
    }
    if (!browserModalSearch.trim()) return list;
    const q = browserModalSearch.toLowerCase().trim();
    return list.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.code && e.code.toLowerCase().includes(q)) ||
      (e.categoryOrSubtitle && e.categoryOrSubtitle.toLowerCase().includes(q)) ||
      (e.extraInfo && e.extraInfo.toLowerCase().includes(q))
    );
  }, [availableEntities, browserModalSearch, browserModalCategoryFilter, accountType]);

  // Add selected entity as a line in the movement area
  const handleSelectEntity = (entity: SelectableAccountEntity) => {
    // Prevent selecting inactive vendor or customer
    if (entity.type === 'vendors') {
      const isVendActive = vendorService.isVendorActive(entity.id);
      if (!isVendActive) {
        setFormError('المورد المختار غير نشط ولا يمكن تنفيذ حركة جديدة عليه.');
        return;
      }
    } else if (entity.type === 'customers') {
      const isCustActive = customerService.isCustomerActive(entity.id);
      if (!isCustActive) {
        setFormError('العميل المختار غير نشط ولا يمكن تنفيذ حركة جديدة عليه.');
        return;
      }
    }

    const newLine: IncomeMovementLineState = {
      lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entityId: entity.id,
      accountCode: entity.code,
      accountName: entity.name,
      accountType: entity.type,
      amount: '',
      notes: '',
      categoryOrSubtitle: entity.categoryOrSubtitle,
      balance: entity.balance,
      balanceLabel: entity.balanceLabel,
      extraInfo: entity.extraInfo,
      targetBranchId: entity.targetBranchId,
      targetBranchName: entity.targetBranchName,
      targetTreasuryOrBankId: entity.targetTreasuryOrBankId,
      targetTreasuryOrBankName: entity.targetTreasuryOrBankName,
      targetType: entity.targetType
    };

    setMovementLines(prev => [...prev, newLine]);
    setSearchQuery('');
    setIsSearchDropdownOpen(false);
    setIsBrowserModalOpen(false);
    setIsCustomerModalOpen(false);
    setIsVendorModalOpen(false);
    setIsTreasuryModalOpen(false);
    setFormError(null);
  };

  // Selection from standard Customer Records Modal
  const handleSelectCustomerRecord = (cust: Customer) => {
    if (!customerService.isCustomerActive(cust)) {
      setFormError('العميل المختار غير نشط ولا يمكن تنفيذ حركة جديدة عليه.');
      return;
    }
    const actBal = cust.balanceDue !== undefined ? cust.balanceDue : (customerService.getCustomerActualBalance(cust).actualBalance || 0);
    handleSelectEntity({
      id: cust.id,
      code: cust.code,
      name: cust.name,
      type: 'customers',
      categoryOrSubtitle: 'عميل مسجل',
      balance: actBal,
      balanceLabel: 'مديونية العميل',
      extraInfo: cust.mobile
    });
    setIsCustomerModalOpen(false);
  };

  // Selection from standard Vendor Records Modal
  const handleSelectVendorRecord = (vend: Vendor) => {
    if (!vendorService.isVendorActive(vend)) {
      setFormError('المورد المختار غير نشط ولا يمكن تنفيذ حركة جديدة عليه.');
      return;
    }
    const actBal = vend.balanceDue !== undefined ? vend.balanceDue : (vendorService.getVendorActualBalance(vend).actualBalance || 0);
    handleSelectEntity({
      id: vend.id,
      code: vend.code,
      name: vend.name,
      type: 'vendors',
      categoryOrSubtitle: vend.type ? `${vend.type} • مورد مسجل` : (vend.category ? `${vend.category} • مورد مسجل` : 'مورد مسجل'),
      balance: actBal,
      balanceLabel: 'رصيد المورد المستحق',
      extraInfo: vend.mobile || vend.phone2
    });
    setIsVendorModalOpen(false);
  };

  // Selection from standard Treasury Records Modal
  const handleSelectTreasuryRecord = (tr: Treasury) => {
    if (tr.id === selectedTreasuryId) {
      setFormError('لا يمكن اختيار نفس الخزينة الحالية كطرف مقابل للحركة.');
      return;
    }
    const bal = treasuryService.getTreasuryBalance(tr.id);
    handleSelectEntity({
      id: tr.id,
      code: tr.code,
      name: tr.name,
      type: 'other_treasury',
      categoryOrSubtitle: `فرع: ${tr.branchName}`,
      balance: bal,
      balanceLabel: 'رصيد الخزينة الحالي'
    });
    setIsTreasuryModalOpen(false);
  };

  // Update specific line amount or notes
  const handleUpdateLine = (lineId: string, field: 'amount' | 'notes', value: string) => {
    setMovementLines(prev => prev.map(l => l.lineId === lineId ? { ...l, [field]: value } : l));
  };

  // Remove a line from movement
  const handleRemoveLine = (lineId: string) => {
    setMovementLines(prev => prev.filter(l => l.lineId !== lineId));
  };

  // Calculate total transaction amount
  const totalMovementAmount = useMemo(() => {
    return movementLines.reduce((sum, l) => {
      const val = parseFloat(l.amount);
      return sum + (!isNaN(val) && val > 0 ? val : 0);
    }, 0);
  }, [movementLines]);

  // Next suggested document number
  const nextDocNumber = useMemo(() => {
    return incomeTransactionService.getNextDocumentNumber(movementType, accountType);
  }, [movementType, accountType, transactionsList]);

  // Pending transactions count
  const pendingCount = useMemo(() => {
    return transactionsList.filter(t => t.status === 'معلق').length;
  }, [transactionsList]);

  // Handle Form Submission
  const handleExecuteTransaction = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setSuccessTx(null);

    if (!selectedTreasuryId) {
      setFormError('يرجى تحديد خزينة الحركة النقدية.');
      return;
    }

    if (movementLines.length === 0) {
      setFormError('يرجى إضافة سطر حساب/جهة واحدة على الأقل للحركة.');
      return;
    }

    // Validate each line's amount and active status
    for (let i = 0; i < movementLines.length; i++) {
      const l = movementLines[i];
      const lineAmt = parseFloat(l.amount);
      if (isNaN(lineAmt) || lineAmt <= 0) {
        setFormError(`يرجى إدخال مبلغ صحيح أكبر من الصفر للسطر رقم (${i + 1}): [${l.accountName}].`);
        return;
      }

      if (l.accountType === 'vendors') {
        const isVendActive = vendorService.isVendorActive(l.entityId);
        if (!isVendActive) {
          setFormError(`المورد [${l.accountName}] غير نشط، لا يمكن تنفيذ حركة مالية جديدة على مورد غير نشط.`);
          return;
        }
      } else if (l.accountType === 'customers') {
        const isCustActive = customerService.isCustomerActive(l.entityId);
        if (!isCustActive) {
          setFormError(`العميل [${l.accountName}] غير نشط، لا يمكن تنفيذ حركة مالية جديدة على عميل غير نشط.`);
          return;
        }
      }
    }

    if (totalMovementAmount <= 0) {
      setFormError('يرجى إدخال مبالغ صحيحة أكبر من الصفر لأسطر الحركة.');
      return;
    }

    // Check outward treasury balance
    if (movementType === 'outward' && currentTreasuryBalance < totalMovementAmount) {
      setFormError(`رصيد الخزينة الحالي (${currentTreasuryBalance.toLocaleString('ar-EG')} ج.م) لا يكفي لصرف إجمالي الحركة (${totalMovementAmount.toLocaleString('ar-EG')} ج.م).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const linesToSubmit = movementLines.map(l => ({
        accountId: l.entityId,
        accountCode: l.accountCode,
        accountName: l.accountName,
        accountType: l.accountType,
        amount: parseFloat(l.amount),
        notes: l.notes.trim() || undefined,
        targetBranchId: l.targetBranchId,
        targetBranchName: l.targetBranchName,
        targetTreasuryOrBankId: l.targetTreasuryOrBankId,
        targetTreasuryOrBankName: l.targetTreasuryOrBankName,
        targetType: l.targetType
      }));

      const res = incomeTransactionService.createTransaction({
        type: movementType,
        accountType,
        date: transactionDate,
        treasuryId: selectedTreasuryId,
        amount: totalMovementAmount,
        notes: notes.trim() || undefined,
        lines: linesToSubmit
      });

      if (!res.success) {
        setFormError(res.error || 'فشلت عملية حفظ الحركة المالية.');
        setIsSubmitting(false);
        return;
      }

      if (res.transaction) {
        setSuccessTx(res.transaction);
        // Reset inputs
        setMovementLines([]);
        setNotes('');
        setSearchQuery('');
        reloadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ غير متوقع أثناء المعالجة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Add to Chart of Accounts
  const handleCreateNewCoaAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setCoaModalError(null);

    const res = chartOfAccountsService.addAccount({
      code: newCoaCode.trim(),
      name: newCoaName.trim(),
      category: newCoaCategory
    });

    if (!res.success) {
      setCoaModalError(res.error || 'فشل إضافة الحساب.');
      return;
    }

    if (res.account) {
      handleSelectEntity({
        id: res.account.id,
        code: res.account.code,
        name: res.account.name,
        type: 'chart_of_accounts',
        categoryOrSubtitle: `${res.account.categoryLabel} (${res.account.nature === 'debit' ? 'مدين' : 'دائن'})`,
        balance: 0,
        balanceLabel: 'الرصيد الدفتري'
      });
      setShowAddCoaModal(false);
      setNewCoaCode('');
      setNewCoaName('');
    }
  };

  // Completed vs Held transactions matching Sales/Purchases pattern
  const completedTransactions = useMemo(() => {
    return transactionsList.filter(t => t.status !== 'معلق');
  }, [transactionsList]);

  const heldTransactions = useMemo(() => {
    return transactionsList.filter(t => t.status === 'معلق');
  }, [transactionsList]);

  const handleApplyHistoryFilters = () => {
    setAppliedHistoryFilters({
      search: historySearchQuery,
      status: historyStatusFilter,
      movementType: historyMovementTypeFilter,
      dateFrom: historyDateFrom,
      dateTo: historyDateTo,
    });
  };

  const handleResetHistoryFilters = () => {
    setHistorySearchQuery('');
    setHistoryStatusFilter('all');
    setHistoryMovementTypeFilter('all');
    setHistoryDateFrom('');
    setHistoryDateTo('');
    setAppliedHistoryFilters({
      search: '',
      status: 'all',
      movementType: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveHistoryFilters = Boolean(
    appliedHistoryFilters.search ||
    appliedHistoryFilters.status !== 'all' ||
    appliedHistoryFilters.movementType !== 'all' ||
    appliedHistoryFilters.dateFrom ||
    appliedHistoryFilters.dateTo
  );

  // Filtered completed transactions with 5-column filters matching Sales
  const filteredCompletedTransactions = useMemo(() => {
    return completedTransactions.filter(tx => {
      // Status filter
      if (appliedHistoryFilters.status === 'completed' && tx.status !== 'مكتمل') return false;
      if (appliedHistoryFilters.status === 'cancelled' && tx.status !== 'ملغي') return false;

      // Movement Type filter
      if (appliedHistoryFilters.movementType === 'inward' && tx.type !== 'inward') return false;
      if (appliedHistoryFilters.movementType === 'outward' && tx.type !== 'outward') return false;

      // Text search
      if (appliedHistoryFilters.search.trim()) {
        const q = appliedHistoryFilters.search.toLowerCase();
        const matchDoc = tx.documentNumber?.toLowerCase().includes(q);
        const matchAcc = tx.accountName?.toLowerCase().includes(q);
        const matchTreasury = tx.treasuryName?.toLowerCase().includes(q);
        const matchNotes = tx.notes?.toLowerCase().includes(q);
        const matchLines = tx.lines?.some(l => l.accountName?.toLowerCase().includes(q) || (l.notes && l.notes.toLowerCase().includes(q)));
        if (!matchDoc && !matchAcc && !matchTreasury && !matchNotes && !matchLines) return false;
      }

      // Date Range filter
      if (appliedHistoryFilters.dateFrom) {
        const txDate = tx.date || (tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : '');
        if (txDate && txDate < appliedHistoryFilters.dateFrom) return false;
      }
      if (appliedHistoryFilters.dateTo) {
        const txDate = tx.date || (tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : '');
        if (txDate && txDate > appliedHistoryFilters.dateTo) return false;
      }

      return true;
    });
  }, [completedTransactions, appliedHistoryFilters]);

  // Resume a held transaction back into the form
  const handleResumeHeldTransaction = (tx: IncomeTransaction) => {
    setMovementType(tx.type);
    setAccountType(tx.accountType);
    setSelectedTreasuryId(tx.treasuryId);
    setTransactionDate(tx.date);
    setNotes(tx.notes || '');

    if (tx.lines && tx.lines.length > 0) {
      setMovementLines(tx.lines.map((l, idx) => ({
        lineId: `${Date.now()}-${idx}-${Math.random()}`,
        entityId: l.accountId,
        accountCode: l.accountCode,
        accountName: l.accountName,
        accountType: l.accountType || tx.accountType,
        amount: l.amount && l.amount > 0 ? String(l.amount) : '',
        notes: l.notes || '',
        categoryOrSubtitle: tx.accountTypeLabel,
        targetBranchId: l.targetBranchId,
        targetBranchName: l.targetBranchName,
        targetTreasuryOrBankId: l.targetTreasuryOrBankId,
        targetTreasuryOrBankName: l.targetTreasuryOrBankName,
        targetType: l.targetType,
      })));
    } else {
      setMovementLines([{
        lineId: `${Date.now()}-0-${Math.random()}`,
        entityId: tx.accountId,
        accountCode: tx.accountCode,
        accountName: tx.accountName,
        accountType: tx.accountType,
        amount: tx.amount && tx.amount > 0 ? String(tx.amount) : '',
        notes: tx.notes || '',
        categoryOrSubtitle: tx.accountTypeLabel,
        targetBranchId: tx.targetBranchId,
        targetBranchName: tx.targetBranchName,
        targetTreasuryOrBankId: tx.targetTreasuryOrBankId,
        targetTreasuryOrBankName: tx.targetTreasuryOrBankName,
        targetType: tx.targetType,
      }]);
    }

    // Remove from held list
    incomeTransactionService.deleteTransaction(tx.id);
    reloadData();

    // Switch back to form view
    setActiveTab('form');
    setSuccessTx(null);
    setFormError(null);
    showToast(`تم استئناف المعاملة [${tx.documentNumber}] بنجاح. يمكنك استكمال إدخال المبالغ وحفظها.`);
  };

  // Delete individual held transaction
  const handleDeleteHeldTransaction = (txId: string) => {
    incomeTransactionService.deleteTransaction(txId);
    reloadData();
    setDeleteHeldConfirmModal({ isOpen: false });
  };

  // Delete all held transactions
  const handleDeleteAllHeldTransactions = () => {
    const held = transactionsList.filter(t => t.status === 'معلق');
    for (const h of held) {
      incomeTransactionService.deleteTransaction(h.id);
    }
    reloadData();
    setDeleteHeldConfirmModal({ isOpen: false });
  };

  // ==========================================
  // F-KEYS ACTIONS (مطابقة لشاشات المبيعات والمشتريات)
  // ==========================================

  // 1. New Transaction Action (F1)
  const handleNewAction = () => {
    setActiveTab('form');
    setMovementLines([]);
    setNotes('');
    setSearchQuery('');
    setFormError(null);
    setSuccessTx(null);
  };

  // 2. Save Transaction Action (F2)
  const handleSaveAction = () => {
    if (activeTab !== 'form') {
      setActiveTab('form');
      return;
    }
    handleExecuteTransaction();
  };

  // 3. Hold Transaction Action (F3) - تعليق الحركة فعلاً مع البقاء في نفس الشاشة دون فتح شاشة العرض
  // مطابق تماماً لمنطق وصلاحيات المبيعات والمشتريات:
  // - يمكن تعليق الحركة حتى لو لم يتم إدخال قيمة نقدية بعد (لأن الحركة المعلقة غير مكتملة).
  // - لا تجعل إدخال المبلغ شرطاً للتعليق.
  // - لا تطبق Validation الحفظ النهائي على الحركة المعلقة.
  // - تحفظ الحركة بحالة «معلق» مع البيانات المتاحة فقط، ويمكن استكمالها لاحقاً وإدخال المبلغ ثم حفظها.
  // - لا يتم تسجيل أثر مالي أو قيد محاسبي نهائي على الحساب/الخزينة إلا بعد إكمال الحركة وحفظها.
  const handleHoldAction = () => {
    if (movementLines.length === 0) {
      showToast('لا توجد أطراف أو بيانات للحركة لتعليقها (F3). يرجى اختيار حساب أولاً.');
      setFormError('لا توجد أطراف أو بيانات للحركة لتعليقها (F3). يرجى اختيار حساب أولاً.');
      return;
    }

    try {
      const linesToSubmit = movementLines.map(l => ({
        accountId: l.entityId,
        accountCode: l.accountCode,
        accountName: l.accountName,
        accountType: l.accountType,
        amount: parseFloat(l.amount) || 0,
        notes: l.notes.trim() || undefined,
        targetBranchId: l.targetBranchId,
        targetBranchName: l.targetBranchName,
        targetTreasuryOrBankId: l.targetTreasuryOrBankId,
        targetTreasuryOrBankName: l.targetTreasuryOrBankName,
        targetType: l.targetType
      }));

      const heldTotal = linesToSubmit.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      const res = incomeTransactionService.createTransaction({
        type: movementType,
        accountType,
        date: transactionDate,
        treasuryId: selectedTreasuryId,
        amount: heldTotal,
        notes: notes.trim() || undefined,
        lines: linesToSubmit,
        status: 'معلق'
      });

      if (!res.success) {
        showToast(res.error || 'فشلت عملية تعليق الحركة.');
        setFormError(res.error || 'فشلت عملية تعليق الحركة.');
        return;
      }

      if (res.transaction) {
        showToast(`تم تعليق الحركة [${res.transaction.documentNumber}] بنجاح (F3). يمكنك استكمالها لاحقاً من سجل المعاملات المعلقة.`);
        setMovementLines([]);
        setNotes('');
        setSearchQuery('');
        setFormError(null);
        setSuccessTx(null);
        setSelectedTx(null);
        reloadData();
      }
    } catch (err: any) {
      console.error('Error holding income transaction', err);
      showToast(err.message || 'حدث خطأ أثناء تعليق الحركة.');
      setFormError(err.message || 'حدث خطأ أثناء تعليق الحركة.');
    }
  };

  // 4. View Document Action (F4) - فتح سجل المستندات والمعاملات المعلقة (مطابقة للمبيعات)
  const handleViewAction = () => {
    if (activeTab === 'history') {
      setActiveTab('form');
    } else {
      setActiveTab('history');
    }
  };

  // 5. Print Voucher Action (F5)
  // يطابق تماماً منطق وصلاحيات الطباعة في المبيعات والمشتريات:
  // 1- لا يمكن طباعة أي حركة قبل حفظها.
  // 2- إذا لم يوجد مستند محفوظ ومحدد، لا تطبع أي مستند عشوائي.
  // 3- اعرض «لا يوجد مستند للطباعة» أو لا يحدث شيء.
  // 4- عند وجود مستند محفوظ ومحدد، اطبع نفس المستند فقط.
  // 5- استخدام نفس Component وLogic وPermissions للطباعة الموجودة في المبيعات والمشتريات.
  const handlePrintAction = () => {
    // 1. Permissions verification
    const permResult = permissionIntegrationService.checkPermission(currentUser.role, 'PERM_ACT_EXPORT_DATA');
    if (!permResult.granted) {
      showToast(`تم رفض الإجراء: المستخدم (${currentUser.fullName}) لا يملك صلاحية الطباعة والتصدير.`);
      return;
    }

    // 2. Identify target saved document
    let targetDoc: IncomeTransaction | null = null;
    if (viewVoucher && incomeTransactionService.isTransactionSaved(viewVoucher.id)) {
      targetDoc = viewVoucher;
    } else if (successTx && incomeTransactionService.isTransactionSaved(successTx.id)) {
      targetDoc = successTx;
    } else if (selectedTx && incomeTransactionService.isTransactionSaved(selectedTx.id)) {
      targetDoc = selectedTx;
    }

    // 3. Prevent printing if no document is saved and selected
    if (!targetDoc) {
      showToast('لا يوجد مستند للطباعة. يجب حفظ الحركة أولاً وتحديدها قبل طباعتها.');
      setFormError('لا يوجد مستند للطباعة. يجب حفظ الحركة أولاً وتحديدها قبل طباعتها.');
      return;
    }

    // 4. Prevent printing held / incomplete transactions
    if (targetDoc.status === 'معلق') {
      showToast('لا يمكن طباعة حركة معلقة قبل استكمالها وحفظها.');
      setFormError('لا يمكن طباعة حركة معلقة قبل استكمالها وحفظها.');
      return;
    }

    // 5. Trigger print on the exact saved document via SalesInvoiceReceiptModal
    setViewVoucher(targetDoc);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // 6. Cancel Draft Action (F6)
  const handleCancelAction = () => {
    if (movementLines.length > 0 || notes || searchQuery) {
      setMovementLines([]);
      setNotes('');
      setSearchQuery('');
      setFormError(null);
      setSuccessTx(null);
    } else if (activeTab === 'history') {
      setActiveTab('form');
    }
  };

  // 7. Close Screen Action (F7)
  const handleCloseAction = () => {
    if (onBackToHome) {
      onBackToHome();
    }
  };

  // Keyboard shortcut listener (F1 to F7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if modals are open
      if (
        isBrowserModalOpen ||
        isCustomerModalOpen ||
        isVendorModalOpen ||
        isTreasuryModalOpen ||
        showAddCoaModal ||
        showPolicyModal ||
        cancelDialog.isOpen
      ) {
        if (e.key === 'Escape') {
          setIsBrowserModalOpen(false);
          setIsCustomerModalOpen(false);
          setIsVendorModalOpen(false);
          setIsTreasuryModalOpen(false);
          setShowAddCoaModal(false);
          setShowPolicyModal(false);
          setCancelDialog({ isOpen: false, tx: null, reason: '' });
          setViewVoucher(null);
        }
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        handleNewAction();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleSaveAction();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleHoldAction();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleViewAction();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handlePrintAction();
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleCancelAction();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleCloseAction();
      } else if (e.key === 'Escape') {
        if (viewVoucher) {
          e.preventDefault();
          setViewVoucher(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isBrowserModalOpen,
    isCustomerModalOpen,
    isVendorModalOpen,
    isTreasuryModalOpen,
    showAddCoaModal,
    showPolicyModal,
    cancelDialog.isOpen,
    viewVoucher,
    movementLines,
    notes,
    searchQuery,
    activeTab,
    selectedTreasuryId,
    movementType,
    accountType,
    transactionDate,
    totalMovementAmount,
    currentTreasuryBalance,
    successTx,
    transactionsList,
    onBackToHome
  ]);

  return (
    <div className="w-full space-y-5 animate-fadeIn font-sans" dir="rtl">
      {/* 1. TOP BAR: الحسابات، معاملات الدخل، نوع الحركة، نوع الحساب المقابل */}
      <div 
        className={`rounded-3xl p-5 sm:p-6 border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 shadow-xl' 
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* 1. الجهة اليمنى: «الحسابات» عنوان القسم، وأسفله في أقصى اليمين «وارد خزينة / صادر خزينة» بحجم أصغر */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-3.5">
            {/* عنوان القسم «الحسابات» */}
            <div className="flex items-center space-x-3 space-x-reverse min-h-[44px]">
              <div 
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-transform ${
                  isDark
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Calculator className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-slate-800 dark:text-slate-200 leading-tight">
                الحسابات
              </h1>
            </div>

            {/* أسفل «الحسابات» في أقصى اليمين: «وارد خزينة / صادر خزينة» مصغران ومتناسقان */}
            <div className="inline-flex items-center self-start p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <button
                type="button"
                id="btn-select-inward"
                onClick={() => {
                  setMovementType('inward');
                  setSuccessTx(null);
                  setFormError(null);
                }}
                className={`h-[36px] sm:h-[38px] px-3 sm:px-3.5 rounded-lg text-[13px] font-bold flex items-center justify-center space-x-1.5 space-x-reverse transition-all text-center ${
                  movementType === 'inward'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>وارد خزينة</span>
              </button>

              <button
                type="button"
                id="btn-select-outward"
                onClick={() => {
                  setMovementType('outward');
                  setSuccessTx(null);
                  setFormError(null);
                }}
                className={`h-[36px] sm:h-[38px] px-3 sm:px-3.5 rounded-lg text-[13px] font-bold flex items-center justify-center space-x-1.5 space-x-reverse transition-all text-center ${
                  movementType === 'outward'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>صادر خزينة</span>
              </button>
            </div>
          </div>

          {/* 2. المنتصف: «معاملات الدخل» العنوان الرئيسي، وتحته مباشرة «نوع الحساب المقابل» و«خزينة الحركة» مع تكبير عرض خزينة الحركة */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-3.5">
            {/* «معاملات الدخل» العنوان الرئيسي في منتصف الـHeader */}
            <div className="flex items-center justify-center space-x-3 space-x-reverse min-h-[44px]">
              <div 
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-colors ${
                  movementType === 'inward'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                    : 'bg-blue-600 text-white shadow-blue-600/25'
                }`}
              >
                <Banknote className="w-6 h-6 stroke-[1.9]" />
              </div>
              <h2 className="text-[24px] sm:text-[26px] font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
                معاملات الدخل
              </h2>
            </div>

            {/* تحت «معاملات الدخل» مباشرة وفي المنتصف: نوع الحساب المقابل وخزينة الحركة مع عرض أكبر لخزينة الحركة */}
            <div className="grid grid-cols-12 gap-2.5 sm:gap-3 w-full">
              {/* نوع الحساب المقابل */}
              <div className="col-span-5 flex flex-col space-y-1.5 text-center">
                <label htmlFor="select-account-type" className="text-[13px] sm:text-[14px] font-bold text-center block text-slate-700 dark:text-slate-300">
                  نوع الحساب المقابل
                </label>
                <div className="relative">
                  <select
                    id="select-account-type"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as IncomeAccountType)}
                    className={`w-full h-[42px] pr-2 pl-7 rounded-xl text-[14px] sm:text-[15px] font-bold text-center [text-align-last:center] border transition-all appearance-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    <option value="chart_of_accounts">1. دليل الحسابات</option>
                    <option value="vendors">2. الموردين</option>
                    <option value="customers">3. العملاء</option>
                    <option value="other_treasury">4. الخزينة الأخرى</option>
                    <option value="bank">5. البنك</option>
                    <option value="branch_transfer">6. تحويل لفرع آخر</option>
                  </select>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* خزينة الحركة (عرض مكبّر ومريح لإظهار الاسم كاملاً بدون قص) */}
              <div className="col-span-7 flex flex-col space-y-1.5 text-center">
                <label htmlFor="select-treasury" className="text-[13px] sm:text-[14px] font-bold text-center block text-slate-700 dark:text-slate-300">
                  خزينة الحركة
                </label>
                <div className="relative w-full">
                  <select
                    id="select-treasury"
                    value={selectedTreasuryId}
                    onChange={(e) => setSelectedTreasuryId(e.target.value)}
                    className={`w-full h-[42px] pr-2 pl-7 rounded-xl text-[14px] sm:text-[15px] font-bold text-center [text-align-last:center] border transition-all appearance-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    {treasuries.map(tr => {
                      const bal = treasuryService.getTreasuryBalance(tr.id);
                      return (
                        <option key={tr.id} value={tr.id}>
                          {tr.name} ({tr.code}) - {bal.toLocaleString('ar-EG')} ج.م
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. الجهة المقابلة: زر العودة، ورقم المستند وتاريخ الحركة بنصوص في المنتصف وخط واضح */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-3.5 items-stretch">
            {/* زر العودة لرئيسية الحسابات */}
            <div className="flex items-center justify-start lg:justify-end min-h-[44px]">
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className={`h-[40px] px-3.5 flex items-center justify-center space-x-2 space-x-reverse rounded-xl text-[13px] sm:text-[14px] font-bold text-center border transition-all ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لرئيسية الحسابات</span>
                </button>
              )}
            </div>

            {/* في الجهة المقابلة: «رقم المستند» و«تاريخ الحركة» بنصوص Center أفقياً وعمودياً وبخط أوضح */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
              {/* رقم المستند */}
              <div className="flex flex-col space-y-1.5 text-center">
                <label className="text-[13px] sm:text-[14px] font-bold text-center block text-slate-700 dark:text-slate-300">
                  رقم المستند
                </label>
                <div 
                  className={`h-[42px] px-3 rounded-xl text-[14px] sm:text-[15px] font-mono font-bold flex items-center justify-center text-center border transition-all truncate ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-100' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 shadow-2xs'
                  }`}
                  title={nextDocNumber}
                >
                  {nextDocNumber}
                </div>
              </div>

              {/* تاريخ الحركة */}
              <div className="flex flex-col space-y-1.5 text-center">
                <label htmlFor="top-tx-date" className="text-[13px] sm:text-[14px] font-bold text-center block text-slate-700 dark:text-slate-300">
                  تاريخ الحركة
                </label>
                <input
                  type="date"
                  id="top-tx-date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className={`w-full h-[42px] px-2.5 rounded-xl text-[14px] sm:text-[15px] font-bold text-center border transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-100' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 shadow-2xs'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUCCESS CONFIRMATION BANNER IF A TRANSACTION WAS JUST EXECUTED */}
      {successTx && (
        <div 
          className={`rounded-2xl p-4 sm:p-5 border transition-all animate-fadeIn flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isDark 
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-100' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="font-bold text-[16px] sm:text-[17px]">
                  تم تسجيل العملية بنجاح!
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-600/20 font-bold border border-emerald-500/30">
                  {successTx.documentNumber}
                </span>
                <span className={`text-[12px] px-2 py-0.5 rounded-full font-bold ${
                  successTx.status === 'مكتمل'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-slate-950'
                }`}>
                  {successTx.status === 'مكتمل' ? 'مكتمل الترحيل' : 'معلق بانتظار القبول'}
                </span>
              </div>
              <p className="text-[13px] sm:text-[14px] opacity-90 mt-0.5">
                {successTx.typeLabel} بمبلغ ({successTx.amount.toLocaleString('ar-EG')} ج.م) لحساب [{successTx.accountName}] من خزينة [{successTx.treasuryName}].
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
            <button
              type="button"
              onClick={() => setViewVoucher(successTx)}
              className="h-[38px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] flex items-center space-x-1.5 space-x-reverse shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>عرض السند</span>
            </button>
            <button
              type="button"
              onClick={() => setSuccessTx(null)}
              className="p-2 rounded-xl text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN FORM TAB */}
      {activeTab === 'form' && (
        <div className="space-y-5 animate-fadeIn">
          {/* B. TRANSACTION DATA FORM (Dynamic Fields according to accountType) */}
          <form onSubmit={handleExecuteTransaction}>
            <div 
              className={`rounded-3xl p-5 sm:p-6 border transition-all ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 shadow-md' 
                  : 'bg-white border-slate-200/90 shadow-xs'
              }`}
            >
              {/* Form Error Banner */}
              {formError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[13px] sm:text-[14px] font-medium flex items-center space-x-2 space-x-reverse">
                  <Ban className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Phase 2: Selection of account/entity via Search & Browse, and adding to Movement Lines */}
              <div className="space-y-4">
                {/* Search Bar & Browse Button Row */}
                <div>
                  <label className="block text-[13px] sm:text-[14px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    البحث واختيار الحساب / الجهة من ({accountTypeLabel}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                    {/* Autocomplete Search Input */}
                    <div className="relative flex-1">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          id="input-account-search"
                          placeholder={`ابحث في ${accountTypeLabel} بالاسم أو الكود...`}
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchDropdownOpen(true);
                          }}
                          onFocus={() => {
                            setIsSearchDropdownOpen(true);
                          }}
                          className={`w-full h-[46px] pr-10 pl-3.5 rounded-2xl text-[14px] font-semibold border transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                            isDark 
                              ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400' 
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-2xs'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Search className="w-4 h-4" />
                        </div>
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setIsSearchDropdownOpen(false);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Autocomplete Dropdown */}
                      {isSearchDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-30" 
                            onClick={() => setIsSearchDropdownOpen(false)} 
                          />
                          <div 
                            className={`absolute right-0 left-0 top-[52px] rounded-2xl border shadow-2xl z-40 max-h-72 overflow-y-auto ${
                              isDark ? 'bg-slate-900 border-slate-700 divide-y divide-slate-800' : 'bg-white border-slate-200 divide-y divide-slate-100'
                            }`}
                          >
                            {filteredSearchEntities.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400">
                                {searchQuery.trim()
                                  ? `لا توجد نتائج مطابقة لـ «${searchQuery}» في ${accountTypeLabel}`
                                  : `لا توجد حسابات متاحة حالياً في ${accountTypeLabel}`}
                              </div>
                            ) : (
                              filteredSearchEntities.slice(0, 15).map(entity => (
                                <button
                                  key={entity.id}
                                  type="button"
                                  onClick={() => handleSelectEntity(entity)}
                                  className={`w-full p-3 text-right flex items-center justify-between transition-colors ${
                                    isDark ? 'hover:bg-slate-800/80 text-slate-200' : 'hover:bg-slate-50 text-slate-900'
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold text-[14px]">
                                      {entity.name}
                                      {entity.code && (
                                        <span className="mr-2 font-mono text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                          {entity.code}
                                        </span>
                                      )}
                                    </div>
                                    {entity.categoryOrSubtitle && (
                                      <p className="text-xs text-slate-400 mt-0.5">
                                        {entity.categoryOrSubtitle}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-left shrink-0 mr-3">
                                    {entity.balance !== undefined && (
                                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 block">
                                        {entity.balance.toLocaleString('ar-EG')} ج.م
                                      </span>
                                    )}
                                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1 space-x-reverse justify-end mt-0.5">
                                      <span>إضافة سطر</span>
                                      <Plus className="w-3 h-3" />
                                    </span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Browse Button */}
                    <button
                      type="button"
                      id="btn-browse-accounts"
                      onClick={() => {
                        if (accountType === 'customers') {
                          setIsCustomerModalOpen(true);
                        } else if (accountType === 'vendors') {
                          setIsVendorModalOpen(true);
                        } else if (accountType === 'other_treasury') {
                          setIsTreasuryModalOpen(true);
                        } else {
                          setBrowserModalSearch('');
                          setBrowserModalCategoryFilter('all');
                          setIsBrowserModalOpen(true);
                        }
                      }}
                      className={`h-[46px] px-4 sm:px-5 rounded-2xl text-[14px] font-bold flex items-center justify-center space-x-2 space-x-reverse shrink-0 border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs'
                      }`}
                    >
                      <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="whitespace-nowrap">استعراض {accountTypeLabel}</span>
                    </button>
                  </div>
                </div>

                {/* Table of Movement Lines */}
                {movementLines.length === 0 ? (
                  <div className={`p-8 rounded-2xl border border-dashed text-center ${
                    isDark ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50/70 text-slate-500'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1">
                      منطقة أسطر الحركة فارغة
                    </h4>
                    <p className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                      استخدم مربع البحث أعلاه للبحث بالاسم أو الكود، أو اضغط زر «استعراض {accountTypeLabel}» لاختيار الحسابات والجهات وإضافتها كأسطر للحركة.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-2xl overflow-hidden shadow-xs border-slate-200 dark:border-slate-800">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className={`font-bold border-b ${
                          isDark ? 'bg-slate-800/90 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <tr>
                            <th className="py-3 px-3 text-center w-10">#</th>
                            <th className="py-3 px-3.5 min-w-[200px] text-sm">اسم الحساب / الجهة</th>
                            <th className="py-3 px-3.5 w-[160px] text-center text-sm">المبلغ (ج.م) *</th>
                            <th className="py-3 px-3.5 min-w-[180px]">ملاحظات اختيارية</th>
                            <th className="py-3 px-3 text-center w-12">حذف</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                          {movementLines.map((line, index) => (
                            <tr 
                              key={line.lineId}
                              className={`transition-colors ${
                                isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                                {index + 1}
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-[14px] text-slate-900 dark:text-slate-100">
                                  {line.accountName}
                                  {line.accountCode && (
                                    <span className="mr-2 font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                      {line.accountCode}
                                    </span>
                                  )}
                                </div>
                                {line.categoryOrSubtitle && (
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {line.categoryOrSubtitle}
                                    {line.balance !== undefined && (
                                      <span className="mr-2 text-slate-500 font-mono">
                                        • {line.balanceLabel || 'الرصيد'}: {line.balance.toLocaleString('ar-EG')} ج.م
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder="0.00"
                                  value={line.amount}
                                  onChange={(e) => handleUpdateLine(line.lineId, 'amount', e.target.value)}
                                  className={`w-full h-[40px] px-3 rounded-xl text-center font-mono font-bold text-[15px] border transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                                    isDark 
                                      ? 'bg-slate-800 border-slate-700 text-slate-100' 
                                      : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                />
                              </td>
                              <td className="py-3 px-3.5">
                                <input
                                  type="text"
                                  placeholder="ملاحظات اختيارية لهذا السطر..."
                                  value={line.notes}
                                  onChange={(e) => handleUpdateLine(line.lineId, 'notes', e.target.value)}
                                  className={`w-full h-[40px] px-3 rounded-xl text-[13px] border transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                                    isDark 
                                      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                  }`}
                                />
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(line.lineId)}
                                  title="حذف هذا السطر"
                                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Movement Lines Summary Footer */}
                    <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-4 ${
                      isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center space-x-4 space-x-reverse text-xs sm:text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">عدد الأسطر:</span>
                          <span className="mr-1.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                            {movementLines.length}
                          </span>
                        </div>
                        <div className="border-r pr-4 border-slate-300 dark:border-slate-700">
                          <span className="text-slate-500 dark:text-slate-400">إجمالي مبلغ الحركة:</span>
                          <span className="mr-1.5 font-bold font-mono text-[16px] text-blue-600 dark:text-blue-400">
                            {totalMovementAmount.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMovementLines([]);
                          setFormError(null);
                        }}
                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                      >
                        تفريغ أسطر الحركة
                      </button>
                    </div>
                  </div>
                )}

                {/* Overall Movement Notes (Optional) */}
                <div>
                  <label className="block text-[13px] sm:text-[14px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ملاحظات عامة وبيان الحركة <span className="text-[11px] font-normal text-slate-400 mr-1">(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    id="input-notes"
                    placeholder="سجل أي بيان أو مرجع إضافي عام للحركة إن وجد..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full h-[44px] px-3.5 rounded-xl text-[14px] border transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* إجمالي الحركة وملاحظة الترحيل */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {movementType === 'inward' ? '• سيتم ترحيل المبلغ كإيداع بالخزينة عند الحفظ' : '• سيتم ترحيل المبلغ كصرف من رصيد الخزينة عند الحفظ'}
                </div>
                {totalMovementAmount > 0 && (
                  <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-sans ml-1">إجمالي الحركة:</span>
                    <span>{totalMovementAmount.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. TRANSACTIONS REGISTER & ARCHIVE VIEW (مطابقة لواجهة سجل المستندات في المبيعات) */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          {/* Section 1: Held Transactions (مدخل المعاملات المعلقة) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 space-x-reverse">
                  <PauseCircle className="w-5 h-5 text-amber-400" />
                  <span>مدخل المعاملات المعلقة (Held Transactions)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">استئناف المعاملات المعلقة أو إدارة الطلبات المفتوحة بأمان.</p>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  العودة لشاشة تسجيل الحركة
                </button>
                {heldTransactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDeleteHeldConfirmModal({ isOpen: true, isAll: true })}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف جميع المعاملات المعلقة</span>
                  </button>
                )}
              </div>
            </div>

            {heldTransactions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 italic bg-slate-950 rounded-xl border border-slate-800 text-xs">
                لا توجد معاملات معلقة حالياً.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">رقم الحركة</th>
                      <th className="py-2.5 px-3">الطرف المقابل / الحساب</th>
                      <th className="py-2.5 px-3">نوع الحركة</th>
                      <th className="py-2.5 px-3">الخزينة</th>
                      <th className="py-2.5 px-3 text-center">البنود</th>
                      <th className="py-2.5 px-3 text-right">المبلغ</th>
                      <th className="py-2.5 px-3 text-center">الحالة</th>
                      <th className="py-2.5 px-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {heldTransactions.map((tx, idx) => (
                      <tr key={tx.id ? `${tx.id}-${idx}` : `held-tx-${idx}`} className="hover:bg-slate-950/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-amber-400">{tx.documentNumber}</td>
                        <td className="py-3 px-3 text-slate-200 font-sans font-medium">
                          <div>{tx.accountName}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{tx.accountTypeLabel}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'inward'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}>
                            {tx.typeLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{tx.treasuryName}</td>
                        <td className="py-3 px-3 text-center text-slate-300">
                          {tx.lines && tx.lines.length > 0 ? `${tx.lines.length} بند` : '1 بند'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {tx.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">معلقة</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-2 space-x-reverse">
                            <button
                              type="button"
                              onClick={() => handleResumeHeldTransaction(tx)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow flex items-center space-x-1 space-x-reverse cursor-pointer transition-colors"
                            >
                              <Play className="w-3 h-3 fill-slate-950" />
                              <span>استئناف</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteHeldConfirmModal({
                                isOpen: true,
                                isAll: false,
                                transactionId: tx.id,
                                transactionNumber: tx.documentNumber
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

          {/* Section 2: Completed / Saved Transactions History (سجل جميع معاملات الدخل) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 space-x-reverse">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <span>سجل جميع معاملات الدخل (Saved Income Transactions History)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">عرض وتفريغ وطباعة وتعديل المعاملات السابقة المعالجة.</p>
              </div>
            </div>

            {/* Filter / Search Controls Area (نفس شريط الفلاتر والبحث الموجود في المبيعات) */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  <span>تصفية وبحث معاملات الدخل</span>
                </span>
                {hasActiveHistoryFilters && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    (تم تطبيق الفلاتر - إظهار {filteredCompletedTransactions.length} من أصل {completedTransactions.length})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Search (Document Number / Account Name) */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">البحث (رقم/حساب)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="رقم المستند أو الحساب..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 text-xs"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                  </div>
                </div>

                {/* 2. From Date */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 text-xs"
                  />
                </div>

                {/* 3. To Date */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 text-xs"
                  />
                </div>

                {/* 4. Transaction Status */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">حالة المعاملة</label>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 text-xs cursor-pointer"
                  >
                    <option value="all">الكل</option>
                    <option value="completed">مكتملة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>

                {/* 5. Movement Type */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">نوع الحركة</label>
                  <select
                    value={historyMovementTypeFilter}
                    onChange={(e) => setHistoryMovementTypeFilter(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 text-xs cursor-pointer"
                  >
                    <option value="all">الكل</option>
                    <option value="inward">وارد نقدي (قبض)</option>
                    <option value="outward">صادر نقدي (صرف)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={handleResetHistoryFilters}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1 space-x-reverse transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مسح الفلاتر</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyHistoryFilters}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 space-x-reverse shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-950" />
                  <span>تطبيق</span>
                </button>
              </div>
            </div>

            {completedTransactions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 italic bg-slate-950 rounded-xl border border-slate-800 text-xs">
                لا توجد معاملات مكتملة في السجل حالياً.
              </div>
            ) : filteredCompletedTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <p className="text-xs text-amber-400 font-bold">لا توجد معاملات تطابق معايير البحث والتصفية المحددة.</p>
                <button
                  type="button"
                  onClick={handleResetHistoryFilters}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1.5 space-x-reverse"
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
                      <th className="py-3 px-3 text-center font-bold">رقم المستند</th>
                      <th className="py-3 px-3 text-center font-bold">التاريخ والوقت</th>
                      <th className="py-3 px-3 text-center font-bold">الطرف المقابل / الحساب</th>
                      <th className="py-3 px-3 text-center font-bold">نوع الحركة / الخزينة</th>
                      <th className="py-3 px-3 text-center font-bold">الإجمالي</th>
                      <th className="py-3 px-3 text-center font-bold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredCompletedTransactions.map((tx, idx) => (
                      <tr key={tx.id ? `${tx.id}-${idx}` : `comp-tx-${idx}`} className="hover:bg-slate-800/40 transition-colors h-12">
                        {/* 1. رقم المستند */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                            <span className="font-mono font-bold text-slate-100 text-xs">{tx.documentNumber}</span>
                            {tx.status === 'ملغي' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                                ملغاة
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. التاريخ والوقت */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300 text-[11px] whitespace-nowrap">
                          {(() => {
                            const d = new Date(tx.createdAt || tx.date);
                            if (isNaN(d.getTime())) return <span>{tx.date}</span>;
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

                        {/* 3. الطرف المقابل / الحساب */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-slate-200 text-xs truncate block max-w-[200px] mx-auto" title={tx.accountName}>
                            {tx.accountName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal block">{tx.accountTypeLabel}</span>
                        </td>

                        {/* 4. نوع الحركة / الخزينة */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            {tx.status === 'ملغي' ? (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                ملغاة (Cancelled)
                              </span>
                            ) : (
                              <div className="flex flex-col items-center justify-center space-y-0.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  tx.type === 'inward'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {tx.type === 'inward' ? 'وارد نقدي (قبض)' : 'صادر نقدي (صرف)'}
                                </span>
                                <span className="text-[10px] text-slate-400">{tx.treasuryName}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. الإجمالي */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-mono font-bold text-xs ${
                            tx.status === 'ملغي' ? 'line-through text-slate-500' : 'text-emerald-400'
                          }`}>
                            {tx.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                          </span>
                        </td>

                        {/* 6. الإجراءات */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5 space-x-reverse flex-wrap gap-1">
                            {/* عرض (يفتح تفاصيل الحركة بنفس طريقة عرض مستند المبيعات عبر SalesInvoiceReceiptModal) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTx(tx);
                                setViewVoucher(tx);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-[11px] border border-slate-700 flex items-center space-x-1 space-x-reverse cursor-pointer transition-all shrink-0"
                              title="عرض تفاصيل المستند"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>عرض</span>
                            </button>

                            {/* طباعة */}
                            <button
                              type="button"
                              onClick={() => {
                                const permResult = permissionIntegrationService.checkPermission(currentUser.role, 'PERM_ACT_EXPORT_DATA');
                                if (!permResult.granted) {
                                  showToast(`تم رفض الإجراء: المستخدم (${currentUser.fullName}) لا يملك صلاحية الطباعة والتصدير.`);
                                  return;
                                }
                                if (!incomeTransactionService.isTransactionSaved(tx.id)) {
                                  showToast('لا يوجد مستند للطباعة. المستند غير مسجل في النظام.');
                                  return;
                                }
                                if (tx.status === 'معلق') {
                                  showToast('لا يمكن طباعة حركة معلقة قبل استكمالها وحفظها.');
                                  return;
                                }
                                setSelectedTx(tx);
                                setViewVoucher(tx);
                                setTimeout(() => window.print(), 150);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] border border-slate-700 flex items-center space-x-1 space-x-reverse cursor-pointer transition-all shrink-0"
                              title="طباعة السند"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>طباعة</span>
                            </button>

                            {/* إلغاء المعاملة */}
                            <button
                              type="button"
                              onClick={() => setCancelDialog({ isOpen: true, tx, reason: '' })}
                              disabled={tx.status === 'ملغي'}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border flex items-center space-x-1 space-x-reverse transition-all cursor-pointer shrink-0 ${
                                tx.status === 'ملغي'
                                  ? 'bg-slate-800 text-slate-500 border-slate-800 opacity-50 cursor-not-allowed'
                                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 shadow-xs'
                              }`}
                              title="إلغاء الحركة وعكس الأرصدة"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{tx.status === 'ملغي' ? 'ملغاة' : 'إلغاء'}</span>
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

      {/* BOTTOM ACTION BAR (F-KEYS) - المعتمد والمستخدم في شاشات المبيعات والمشتريات */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl" dir="rtl">
        <StandardActionBar
          hasHold={true}
          gridCols={7}
          onNew={handleNewAction}
          onSave={handleSaveAction}
          saveDisabled={isSubmitting || activeTab === 'history'}
          onHold={handleHoldAction}
          onView={handleViewAction}
          onPrint={handlePrintAction}
          onCancel={handleCancelAction}
          onClose={handleCloseAction}
          newLabel="حركة جديدة F1"
          saveLabel="حفظ الحركة F2"
          holdLabel="تعليق F3"
          viewLabel={activeTab === 'history' ? "العودة للتسجيل F4" : "عرض السجل F4"}
          printLabel="طباعة F5"
          cancelLabel="إلغاء F6"
          closeLabel="إغلاق F7"
        />
      </div>

      {/* 5. MODAL: TRANSFER POLICY SETTING */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2 space-x-reverse font-bold text-base">
                <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                <span>سياسة التحويلات النقدية والبنكية</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              حدد آلية تنفيذ التحويلات بين الخزائن والبنوك والفروع في إعدادات الحسابات:
            </p>

            <div className="space-y-3 mb-5">
              <label 
                className={`flex items-start space-x-3 space-x-reverse p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  transferPolicy === 'approval_workflow'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="transferPolicy"
                  value="approval_workflow"
                  checked={transferPolicy === 'approval_workflow'}
                  onChange={() => setTransferPolicy('approval_workflow')}
                  className="mt-1 text-blue-600"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    الخيار الأول: «صرف وقبول ومعلق» (موصى به)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    صرف → معلق → قبول واستلام → مكتمل. تتطلب استلام الطرف المستلم للتحويل للتأكيد.
                  </div>
                </div>
              </label>

              <label 
                className={`flex items-start space-x-3 space-x-reverse p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  transferPolicy === 'immediate'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="transferPolicy"
                  value="immediate"
                  checked={transferPolicy === 'immediate'}
                  onChange={() => setTransferPolicy('immediate')}
                  className="mt-1 text-blue-600"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    الخيار الثاني: «تنفيذ تلقائي مباشر»
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    يتم تنفيذ وإتمام التحويل وإيداعه بالجهة المستلمة فوراً دون مرحلة تعليق.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  incomeTransactionService.setTransferPolicy(transferPolicy);
                  setShowPolicyModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                حفظ السياسة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: QUICK ADD TO CHART OF ACCOUNTS */}
      {showAddCoaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2 space-x-reverse font-bold text-base">
                <FolderTree className="w-5 h-5 text-amber-500" />
                <span>إضافة حساب جديد لدليل الحسابات</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCoaModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {coaModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                {coaModalError}
              </div>
            )}

            <form onSubmit={handleCreateNewCoaAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">كود الحساب (مثال: 5210)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 5210"
                  value={newCoaCode}
                  onChange={(e) => setNewCoaCode(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl text-sm border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">اسم الحساب المالي</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مصاريف ضيافة وبوفيه..."
                  value={newCoaName}
                  onChange={(e) => setNewCoaName(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl text-sm border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">التصنيف المحاسبي</label>
                <select
                  value={newCoaCategory}
                  onChange={(e) => setNewCoaCategory(e.target.value as any)}
                  className={`w-full h-10 px-3 rounded-xl text-sm border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="expenses">مصروفات (Expenses)</option>
                  <option value="revenue">إيرادات (Revenue)</option>
                  <option value="assets">أصول (Assets)</option>
                  <option value="liabilities">خصوم والتزامات (Liabilities)</option>
                  <option value="equity">حقوق ملكية (Equity)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCoaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                >
                  حفظ الحساب بالدليل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: CANCEL / REVERSE TRANSACTION */}
      {cancelDialog.isOpen && cancelDialog.tx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center space-x-2.5 space-x-reverse text-rose-600 mb-3">
              <RotateCcw className="w-5 h-5" />
              <h3 className="font-bold text-base">تأكيد إلغاء الحركة وعكس القيد</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              أنت على وشك إلغاء المستند رقم <strong>[{cancelDialog.tx.documentNumber}]</strong> بمبلغ ({cancelDialog.tx.amount.toLocaleString('ar-EG')} ج.م). سيتم إنشاء قيد عكسي وإعادة الأرصدة المرتبطة بالخزينة والحساب إلى وضعها السابق.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                سبب الإلغاء (اختياري)
              </label>
              <input
                type="text"
                placeholder="سجل سبب إلغاء هذه الحركة..."
                value={cancelDialog.reason}
                onChange={(e) => setCancelDialog({ ...cancelDialog, reason: e.target.value })}
                className={`w-full h-10 px-3 rounded-xl text-xs border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={() => setCancelDialog({ isOpen: false, tx: null, reason: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  if (cancelDialog.tx) {
                    incomeTransactionService.cancelTransaction(cancelDialog.tx.id, cancelDialog.reason);
                    setCancelDialog({ isOpen: false, tx: null, reason: '' });
                    reloadData();
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                تأكيد الإلغاء وعكس الأثر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: REUSED SALES INVOICE PREVIEW MODAL (عرض حركة الوارد والصادر بنفس Component وتصميم وسلوك المبيعات) */}
      {viewVoucher && (
        <SalesInvoiceReceiptModal
          receipt={mapIncomeTxToSalesInvoice(viewVoucher)}
          onClose={() => setViewVoucher(null)}
          title={`معاينة وطباعة ${viewVoucher.type === 'inward' ? 'سند قبض / وارد خزينة' : 'سند صرف / صادر خزينة'}`}
          badgeText={viewVoucher.type === 'inward' ? 'سند قبض وارد' : 'سند صرف صادر'}
          customerLabel="الطرف المقابل / الحساب"
          sellerLabel="المسؤول المنفذ"
          itemColLabel="البيان / الحساب المقابل"
          qtyColLabel="العدد"
          priceColLabel="المبلغ"
          currencySymbol="ج.م "
          movementType={viewVoucher.type}
          printButtonLabel="طباعة السند"
          currentUserFallback={{ username: viewVoucher.performedBy, role: 'مسؤول الخزينة' }}
        />
      )}

      {/* CONFIRM DELETE HELD TRANSACTION MODAL (مطابقة لشاشات المشتريات) */}
      {deleteHeldConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">
                {deleteHeldConfirmModal.isAll ? 'حذف جميع المعاملات المعلقة' : 'حذف المعاملة المعلقة'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {deleteHeldConfirmModal.isAll
                ? 'هل أنت متأكد من حذف جميع معاملات الدخل المعلقة نهائياً؟'
                : 'هل أنت متأكد من حذف هذه المعاملة المعلقة نهائياً؟'}
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => {
                  if (deleteHeldConfirmModal.isAll) {
                    handleDeleteAllHeldTransactions();
                  } else if (deleteHeldConfirmModal.transactionId) {
                    handleDeleteHeldTransaction(deleteHeldConfirmModal.transactionId);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تأكيد الحذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteHeldConfirmModal({ isOpen: false })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: BROWSE AND SELECT ACCOUNT / ENTITY (VERTEX Standard Records Browser Modal UI) */}
      {isBrowserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl dir-rtl text-right flex flex-col max-h-[92vh] overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  {React.createElement(modalTypeMeta.icon, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-100">
                      {modalTypeMeta.title}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {filteredModalEntities.length} {modalTypeMeta.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {modalTypeMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBrowserModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {/* Search & Action Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={modalTypeMeta.searchPlaceholder}
                      value={browserModalSearch}
                      onChange={(e) => setBrowserModalSearch(e.target.value)}
                      autoFocus
                      className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
                    />
                    {browserModalSearch && (
                      <button
                        type="button"
                        onClick={() => setBrowserModalSearch('')}
                        className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Actions & Filters */}
                  <div className="flex items-center space-x-3 space-x-reverse w-full md:w-auto justify-end flex-wrap gap-2">
                    {/* Category Filter for COA */}
                    {accountType === 'chart_of_accounts' && (
                      <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500 font-medium text-[11px]">طبيعة الحساب:</span>
                        <select
                          value={browserModalCategoryFilter}
                          onChange={(e) => setBrowserModalCategoryFilter(e.target.value)}
                          className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="all" className="bg-slate-900">جميع التصنيفات</option>
                          <option value="مصروفات" className="bg-slate-900">مصروفات</option>
                          <option value="إيرادات" className="bg-slate-900">إيرادات</option>
                          <option value="أصول" className="bg-slate-900">أصول</option>
                          <option value="خصوم" className="bg-slate-900">خصوم</option>
                          <option value="حقوق ملكية" className="bg-slate-900">حقوق ملكية</option>
                        </select>
                      </div>
                    )}

                    {/* Filter for Banks */}
                    {accountType === 'bank' && (
                      <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500 font-medium text-[11px]">العملة / النوع:</span>
                        <select
                          value={browserModalCategoryFilter}
                          onChange={(e) => setBrowserModalCategoryFilter(e.target.value)}
                          className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="all" className="bg-slate-900">جميع الحسابات</option>
                          <option value="EGP" className="bg-slate-900">حسابات الجنيه (EGP)</option>
                          <option value="USD" className="bg-slate-900">حسابات الدولار (USD)</option>
                        </select>
                      </div>
                    )}

                    {/* Filter for Branch Transfers */}
                    {accountType === 'branch_transfer' && (
                      <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500 font-medium text-[11px]">نوع الوجهة:</span>
                        <select
                          value={browserModalCategoryFilter}
                          onChange={(e) => setBrowserModalCategoryFilter(e.target.value)}
                          className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="all" className="bg-slate-900">جميع الوجهات</option>
                          <option value="treasury" className="bg-slate-900">خزائن الفروع</option>
                          <option value="bank" className="bg-slate-900">بنوك الفروع</option>
                        </select>
                      </div>
                    )}

                    {accountType === 'chart_of_accounts' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsBrowserModalOpen(false);
                          setShowAddCoaModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة حساب جديد للشجرة</span>
                      </button>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      العناصر المتاحة: {filteredModalEntities.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Records Table Card */}
              <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2 space-x-reverse">
                    {React.createElement(modalTypeMeta.icon, { className: 'w-4 h-4 text-amber-400' })}
                    <span>{modalTypeMeta.tableTitle} ({filteredModalEntities.length})</span>
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    اضغط على أي صف لتحديد الحساب وإضافته مباشرة للحركة المالية
                  </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-right border-collapse text-xs table-auto">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                        <th className="py-2.5 px-3 font-mono w-[15%]">{modalTypeMeta.codeCol}</th>
                        <th className="py-2.5 px-3 w-[32%] text-slate-200">{modalTypeMeta.nameCol}</th>
                        <th className="py-2.5 px-3 w-[22%]">{modalTypeMeta.catCol}</th>
                        <th className="py-2.5 px-3 font-mono w-[15%] text-left">{modalTypeMeta.balCol}</th>
                        <th className="py-2.5 px-3 text-center w-[8%]">الحالة</th>
                        <th className="py-2.5 px-3 text-center w-[8%]">الاختيار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredModalEntities.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              {React.createElement(modalTypeMeta.icon, { className: 'w-8 h-8 text-slate-600' })}
                              <p className="text-sm font-medium text-slate-400">
                                لا توجد سجلات مطابقة لـ «{browserModalSearch}»
                              </p>
                              {browserModalSearch && (
                                <button
                                  type="button"
                                  onClick={() => setBrowserModalSearch('')}
                                  className="text-xs text-amber-400 hover:underline cursor-pointer"
                                >
                                  مسح معيار البحث
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredModalEntities.map((entity) => {
                          const isAlreadySelected = movementLines.some(l => l.entityId === entity.id);

                          return (
                            <tr
                              key={entity.id}
                              onClick={() => {
                                handleSelectEntity(entity);
                                setIsBrowserModalOpen(false);
                              }}
                              className={`cursor-pointer transition-all duration-150 group ${
                                isAlreadySelected
                                  ? 'bg-amber-500/10 border-r-4 border-r-amber-500 font-medium'
                                  : 'hover:bg-slate-800/80 text-slate-300'
                              }`}
                            >
                              {/* Code */}
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-400 whitespace-nowrap text-xs">
                                {entity.code || '-'}
                              </td>

                              {/* Name */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors text-sm">
                                    {entity.name}
                                  </span>
                                  {isAlreadySelected && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 shadow shrink-0">
                                      محدد بالحركة
                                    </span>
                                  )}
                                </div>
                                {entity.extraInfo && (
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {entity.extraInfo}
                                  </div>
                                )}
                              </td>

                              {/* Category / Subtitle */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                                  {entity.categoryOrSubtitle || 'عام'}
                                </span>
                              </td>

                              {/* Balance */}
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-200 whitespace-nowrap text-xs text-left dir-ltr">
                                {entity.balance !== undefined
                                  ? `${entity.balance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`
                                  : '-'}
                              </td>

                              {/* Status */}
                              <td className="py-2.5 px-3 whitespace-nowrap text-center">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center space-x-1 space-x-reverse w-fit mx-auto">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>نشط</span>
                                </span>
                              </td>

                              {/* Select Action */}
                              <td className="py-2.5 px-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectEntity(entity);
                                    setIsBrowserModalOpen(false);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg border transition-all text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0 mx-auto ${
                                    isAlreadySelected
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{isAlreadySelected ? 'محدد' : 'اختيار'}</span>
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
          </div>
        </div>
      )}

      {/* 10. REUSED SYSTEM MODAL: CUSTOMER RECORDS SELECTION */}
      <CustomerRecordsModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleSelectCustomerRecord}
        selectedCustomerId={movementLines[0]?.entityId}
        isSelectionOnlyMode={true}
        activeOnly={true}
      />

      {/* 11. REUSED SYSTEM MODAL: VENDOR RECORDS SELECTION */}
      <VendorRecordsModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSelectVendor={handleSelectVendorRecord}
        selectedVendorId={movementLines[0]?.entityId}
        isSelectionOnlyMode={true}
        activeOnly={true}
      />

      {/* 12. REUSED SYSTEM MODAL: COUNTERPART TREASURY RECORDS SELECTION */}
      <TreasuryRecordsModal
        isOpen={isTreasuryModalOpen}
        onClose={() => setIsTreasuryModalOpen(false)}
        onSelectTreasury={handleSelectTreasuryRecord}
        loadedTreasuryId={selectedTreasuryId}
      />

      {/* 13. REUSED SYSTEM MODAL: MAIN TRANSACTION TREASURY SELECTION */}
      <TreasuryRecordsModal
        isOpen={isMainTreasuryModalOpen}
        onClose={() => setIsMainTreasuryModalOpen(false)}
        onSelectTreasury={(tr) => {
          setSelectedTreasuryId(tr.id);
          setIsMainTreasuryModalOpen(false);
        }}
        loadedTreasuryId={selectedTreasuryId}
      />

      {/* FLOATING TOAST NOTIFICATION (مطابقة لرسائل المبيعات والمشتريات) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-slate-700 text-slate-100 px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 space-x-reverse font-bold text-xs animate-in fade-in duration-200 pointer-events-none backdrop-blur-md">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
