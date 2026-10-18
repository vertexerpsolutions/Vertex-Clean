import { treasuryService } from './treasuryService';
import { customerService } from './customerService';
import { vendorService } from './vendorService';
import { chartOfAccountsService } from './chartOfAccountsService';
import { auditEngine } from './auditEngine';
import { notificationEngine } from './notificationEngine';

export type IncomeMovementType = 'inward' | 'outward';

export type IncomeAccountType = 
  | 'chart_of_accounts' 
  | 'vendors' 
  | 'customers' 
  | 'other_treasury' 
  | 'bank' 
  | 'branch_transfer';

export type TransferPolicy = 'approval_workflow' | 'immediate';

export type TransactionStatus = 'معلق' | 'مكتمل' | 'ملغي';

export interface IncomeTransactionLineItem {
  id: string;
  accountId: string;
  accountCode?: string;
  accountName: string;
  accountType: IncomeAccountType;
  amount: number;
  notes?: string;
  previousEntityBalance?: number;
  newEntityBalance?: number;
  targetBranchId?: string;
  targetBranchName?: string;
  targetTreasuryOrBankId?: string;
  targetTreasuryOrBankName?: string;
  targetType?: 'treasury' | 'bank';
}

export interface IncomeTransaction {
  id: string;
  documentNumber: string; // e.g. IN-2026-0001, OUT-2026-0001, TR-2026-0001
  type: IncomeMovementType;
  typeLabel: string; // 'وارد خزينة' | 'صادر خزينة'
  accountType: IncomeAccountType;
  accountTypeLabel: string;
  date: string; // YYYY-MM-DD
  treasuryId: string;
  treasuryName: string;
  
  // Primary account or counterparty
  accountId: string;
  accountCode?: string;
  accountName: string;

  // Inter-treasury or branch transfer specific fields
  targetBranchId?: string;
  targetBranchName?: string;
  targetTreasuryOrBankId?: string;
  targetTreasuryOrBankName?: string;
  targetType?: 'treasury' | 'bank';

  amount: number;
  notes?: string; // Optional notes
  status: TransactionStatus;
  
  // Balances snapshot for customer / vendor
  previousEntityBalance?: number;
  newEntityBalance?: number;

  // Multi-line entries support
  lines?: IncomeTransactionLineItem[];

  performedBy: string;
  createdAt: string;

  completedAt?: string;
  completedBy?: string;

  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

const STORAGE_KEY = 'VERTEX_INCOME_TRANSACTIONS_V1';
const POLICY_STORAGE_KEY = 'VERTEX_INCOME_TRANSFER_POLICY_V1';

class IncomeTransactionService {
  private transactions: IncomeTransaction[] = [];
  private transferPolicy: TransferPolicy = 'approval_workflow';
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.transactions = JSON.parse(stored);
      } else {
        this.transactions = [];
      }

      const policyStored = localStorage.getItem(POLICY_STORAGE_KEY);
      if (policyStored === 'immediate' || policyStored === 'approval_workflow') {
        this.transferPolicy = policyStored;
      }
    } catch {
      this.transactions = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transactions));
      localStorage.setItem(POLICY_STORAGE_KEY, this.transferPolicy);
      this.notifyListeners();
    } catch (err) {
      console.error('Failed to persist income transactions', err);
    }
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('IncomeTransactionService listener error', err);
      }
    });
  }

  public getTransferPolicy(): TransferPolicy {
    return this.transferPolicy;
  }

  public setTransferPolicy(policy: TransferPolicy): void {
    this.transferPolicy = policy;
    this.saveToStorage();
    auditEngine.logAction(
      'تعديل سياسة التحويلات النقدية',
      'إدارة الحسابات',
      `تم تغيير سياسة التحويلات النقدية إلى: (${policy === 'approval_workflow' ? 'صرف وقبول ومعلق' : 'تنفيذ تلقائي مباشر'})`,
      'info'
    );
  }

  public getAllTransactions(): IncomeTransaction[] {
    return [...this.transactions].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return timeB - timeA;
    });
  }

  public getPendingTransactions(): IncomeTransaction[] {
    return this.transactions.filter(t => t.status === 'معلق');
  }

  public getTransactionById(id: string): IncomeTransaction | undefined {
    return this.transactions.find(t => t.id === id || t.documentNumber === id);
  }

  /**
   * Checks if an income transaction document is saved in the system
   */
  public isTransactionSaved(id?: string): boolean {
    if (!id) return false;
    return this.transactions.some(t => (t.id === id || t.documentNumber === id) && t.status !== 'ملغي');
  }

  /**
   * Generates sequential document numbers per document type and year
   * Examples:
   * - Inward: IN-2026-0001, IN-2026-0002
   * - Outward: OUT-2026-0001, OUT-2026-0002
   * - Transfers: TR-2026-0001, TR-2026-0002
   */
  public getNextDocumentNumber(type: IncomeMovementType, accountType?: IncomeAccountType): string {
    const year = new Date().getFullYear();
    const isTransfer = accountType === 'other_treasury' || accountType === 'bank' || accountType === 'branch_transfer';
    const prefix = isTransfer ? 'TR' : (type === 'inward' ? 'IN' : 'OUT');

    const matching = this.transactions.filter(t => {
      if (isTransfer) {
        return t.documentNumber.startsWith(`TR-${year}`);
      }
      if (type === 'inward') {
        return t.documentNumber.startsWith(`IN-${year}`);
      }
      return t.documentNumber.startsWith(`OUT-${year}`);
    });

    let maxSeq = 0;
    matching.forEach(t => {
      const parts = t.documentNumber.split('-');
      if (parts.length >= 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}-${year}-${nextSeq.toString().padStart(4, '0')}`;
  }

  /**
   * Translates account type to Arabic label
   */
  public getAccountTypeLabel(accType: IncomeAccountType): string {
    switch (accType) {
      case 'chart_of_accounts': return 'دليل الحسابات';
      case 'vendors': return 'الموردين';
      case 'customers': return 'العملاء';
      case 'other_treasury': return 'الخزينة الأخرى';
      case 'bank': return 'البنك';
      case 'branch_transfer': return 'تحويل لفرع آخر';
      default: return accType;
    }
  }

  /**
   * Executes a new income transaction
   */
  public createTransaction(params: {
    type: IncomeMovementType;
    accountType: IncomeAccountType;
    date: string;
    treasuryId: string;
    accountId?: string;
    accountCode?: string;
    accountName?: string;
    targetBranchId?: string;
    targetBranchName?: string;
    targetTreasuryOrBankId?: string;
    targetTreasuryOrBankName?: string;
    targetType?: 'treasury' | 'bank';
    amount?: number;
    notes?: string;
    performedBy?: string;
    status?: TransactionStatus;
    lines?: Array<{
      accountId: string;
      accountCode?: string;
      accountName: string;
      accountType?: IncomeAccountType;
      amount: number;
      notes?: string;
      targetBranchId?: string;
      targetBranchName?: string;
      targetTreasuryOrBankId?: string;
      targetTreasuryOrBankName?: string;
      targetType?: 'treasury' | 'bank';
    }>;
  }): { success: boolean; transaction?: IncomeTransaction; error?: string } {
    const {
      type,
      accountType,
      date,
      treasuryId,
      accountId,
      accountCode,
      accountName,
      targetBranchId,
      targetBranchName,
      targetTreasuryOrBankId,
      targetTreasuryOrBankName,
      targetType,
      amount,
      notes,
      performedBy = 'مدير النظام',
      status: requestedStatus,
      lines
    } = params;

    if (!treasuryId) {
      return { success: false, error: 'يجب اختيار خزينة الحركة النقدية.' };
    }

    const treasury = treasuryService.getTreasuryById(treasuryId);
    if (!treasury) {
      return { success: false, error: 'الخزينة المحددة غير موجودة في النظام.' };
    }

    const isTransfer = accountType === 'other_treasury' || accountType === 'bank' || accountType === 'branch_transfer';
    const documentNumber = this.getNextDocumentNumber(type, accountType);
    const newId = `TX-INC-${Date.now().toString().slice(-6)}`;

    // Determine initial status based on explicit status or transfer policy
    let initialStatus: TransactionStatus = requestedStatus || 'مكتمل';
    if (!requestedStatus && isTransfer) {
      initialStatus = this.transferPolicy === 'approval_workflow' ? 'معلق' : 'مكتمل';
    }

    // MULTI-LINE TRANSACTION BRANCH
    if (lines && lines.length > 0) {
      // Validate all lines have valid accounts
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.accountId) {
          return { success: false, error: `السطر رقم (${i + 1}): يرجى تحديد الحساب أو الطرف المقابل.` };
        }
        // Strict positive amount validation ONLY applies to final completed transactions
        if (initialStatus === 'مكتمل') {
          if (isNaN(line.amount) || line.amount <= 0) {
            return { success: false, error: `السطر رقم (${i + 1}) [${line.accountName}]: يرجى إدخال مبلغ صحيح أكبر من الصفر.` };
          }
        }
      }

      const totalAmount = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      if (initialStatus === 'مكتمل' && totalAmount <= 0) {
        return { success: false, error: 'إجمالي مبالغ أسطر الحركة يجب أن يكون أكبر من الصفر.' };
      }

      // Check treasury balance if outward ONLY for completed transactions
      if (initialStatus === 'مكتمل' && type === 'outward') {
        const currentTreasuryBalance = treasuryService.getTreasuryBalance(treasuryId);
        if (currentTreasuryBalance < totalAmount) {
          return {
            success: false,
            error: `رصيد الخزينة الحالي (${currentTreasuryBalance.toLocaleString('ar-EG')} ج.م) لا يكفي لصرف إجمالي الحركة (${totalAmount.toLocaleString('ar-EG')} ج.م).`
          };
        }
      }

      // Process balances for each line
      const processedLines: IncomeTransactionLineItem[] = [];
      for (const l of lines) {
        const lineAccType = l.accountType || accountType;
        let prevBal: number | undefined;
        let newBal: number | undefined;

        if (initialStatus === 'مكتمل') {
          if (lineAccType === 'customers') {
            const cust = customerService.getCustomerById(l.accountId) || 
              customerService.getAllCustomers().find(c => c.id === l.accountId || (l.accountCode && c.code === l.accountCode));
            if (cust) {
              prevBal = cust.balanceDue !== undefined ? cust.balanceDue : (customerService.getCustomerActualBalance(cust).actualBalance || 0);
              newBal = type === 'inward' ? prevBal - l.amount : prevBal + l.amount;
              customerService.updateCustomer(cust.id, { balanceDue: newBal });
            }
          } else if (lineAccType === 'vendors') {
            const vend = vendorService.getVendorById(l.accountId) || 
              vendorService.getAllVendors().find(v => v.id === l.accountId || (l.accountCode && v.code === l.accountCode));
            if (vend) {
              prevBal = vend.balanceDue !== undefined ? vend.balanceDue : (vendorService.getVendorActualBalance(vend).actualBalance || 0);
              newBal = type === 'outward' ? prevBal - l.amount : prevBal + l.amount;
              vendorService.updateVendor(vend.id, { balanceDue: newBal });
            }
          } else if (lineAccType === 'chart_of_accounts') {
            chartOfAccountsService.updateAccountBalance(
              l.accountCode || l.accountId,
              l.amount,
              type === 'inward' ? 'in' : 'out'
            );
          }
        }

        processedLines.push({
          id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          accountId: l.accountId,
          accountCode: l.accountCode,
          accountName: l.accountName,
          accountType: lineAccType,
          amount: l.amount,
          notes: l.notes?.trim() || undefined,
          previousEntityBalance: prevBal,
          newEntityBalance: newBal,
          targetBranchId: l.targetBranchId,
          targetBranchName: l.targetBranchName,
          targetTreasuryOrBankId: l.targetTreasuryOrBankId,
          targetTreasuryOrBankName: l.targetTreasuryOrBankName,
          targetType: l.targetType
        });
      }

      const primaryLine = processedLines[0];
      const summaryAccountName = processedLines.length === 1 
        ? primaryLine.accountName 
        : `${primaryLine.accountName} (+${processedLines.length - 1} جهات أخرى)`;

      const record: IncomeTransaction = {
        id: newId,
        documentNumber,
        type,
        typeLabel: type === 'inward' ? 'وارد خزينة' : 'صادر خزينة',
        accountType,
        accountTypeLabel: this.getAccountTypeLabel(accountType),
        date: date || new Date().toISOString().slice(0, 10),
        treasuryId,
        treasuryName: treasury.name,
        accountId: primaryLine.accountId,
        accountCode: primaryLine.accountCode,
        accountName: summaryAccountName,
        targetBranchId: primaryLine.targetBranchId || targetBranchId,
        targetBranchName: primaryLine.targetBranchName || targetBranchName,
        targetTreasuryOrBankId: primaryLine.targetTreasuryOrBankId || targetTreasuryOrBankId,
        targetTreasuryOrBankName: primaryLine.targetTreasuryOrBankName || targetTreasuryOrBankName,
        targetType: primaryLine.targetType || targetType,
        amount: totalAmount,
        notes: notes?.trim() || undefined,
        status: initialStatus,
        previousEntityBalance: primaryLine.previousEntityBalance,
        newEntityBalance: primaryLine.newEntityBalance,
        lines: processedLines,
        performedBy,
        createdAt: new Date().toISOString(),
        completedAt: initialStatus === 'مكتمل' ? new Date().toISOString() : undefined,
        completedBy: initialStatus === 'مكتمل' ? performedBy : undefined
      };

      this.transactions.unshift(record);
      this.saveToStorage();

      const summaryDesc = `${record.typeLabel} بمبلغ إجمالي (${totalAmount.toLocaleString('ar-EG')}) لعدد (${processedLines.length}) حسابات/جهات. مستند رقم [${documentNumber}]. الحالة: (${initialStatus}).`;
      auditEngine.logAction(
        type === 'inward' ? 'تسجيل وارد خزينة' : 'تسجيل صادر خزينة',
        'معاملات الدخل',
        summaryDesc,
        'info'
      );

      notificationEngine.addNotification(
        `تم إصدار ${record.typeLabel} بنجاح`,
        summaryDesc,
        'info',
        'معاملات الدخل'
      );

      return { success: true, transaction: record };
    }

    // SINGLE ACCOUNT TRANSACTION (FALLBACK / LEGACY)
    if (!accountId) {
      return { success: false, error: 'يجب اختيار الحساب أو الطرف المقابل للحركة.' };
    }
    const numAmount = Number(amount) || 0;
    if (initialStatus === 'مكتمل') {
      if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
        return { success: false, error: 'يرجى إدخال مبلغ صحيح أكبر من الصفر.' };
      }

      const currentTreasuryBalance = treasuryService.getTreasuryBalance(treasuryId);
      if (type === 'outward' && currentTreasuryBalance < numAmount) {
        return {
          success: false,
          error: `رصيد الخزينة الحالي (${currentTreasuryBalance.toLocaleString('ar-EG')} ج.م) لا يكفي لصرف مبلغ (${numAmount.toLocaleString('ar-EG')} ج.م).`
        };
      }
    }

    let prevBal: number | undefined;
    let newBal: number | undefined;

    if (initialStatus === 'مكتمل') {
      // 1. If Account Type is CUSTOMER
      if (accountType === 'customers') {
        const cust = customerService.getCustomerById(accountId);
        if (cust) {
          prevBal = cust.balanceDue || 0;
          if (type === 'inward') {
            newBal = prevBal - numAmount;
          } else {
            newBal = prevBal + numAmount;
          }
          customerService.updateCustomer(cust.id, { balanceDue: newBal });
        }
      }

      // 2. If Account Type is VENDOR
      if (accountType === 'vendors') {
        const vend = vendorService.getVendorById(accountId);
        if (vend) {
          prevBal = vend.balanceDue || 0;
          if (type === 'outward') {
            newBal = prevBal - numAmount;
          } else {
            newBal = prevBal + numAmount;
          }
          vendorService.updateVendor(vend.id, { balanceDue: newBal });
        }
      }

      // 3. If Account Type is CHART OF ACCOUNTS
      if (accountType === 'chart_of_accounts') {
        chartOfAccountsService.updateAccountBalance(
          accountCode || accountId, 
          numAmount, 
          type === 'inward' ? 'in' : 'out'
        );
      }
    }

    // 4. Create record
    const singleLine: IncomeTransactionLineItem = {
      id: `line-${Date.now()}-1`,
      accountId,
      accountCode,
      accountName: accountName || '',
      accountType,
      amount: numAmount,
      notes: notes?.trim() || undefined,
      previousEntityBalance: prevBal,
      newEntityBalance: newBal,
      targetBranchId,
      targetBranchName,
      targetTreasuryOrBankId,
      targetTreasuryOrBankName,
      targetType
    };

    const record: IncomeTransaction = {
      id: newId,
      documentNumber,
      type,
      typeLabel: type === 'inward' ? 'وارد خزينة' : 'صادر خزينة',
      accountType,
      accountTypeLabel: this.getAccountTypeLabel(accountType),
      date: date || new Date().toISOString().slice(0, 10),
      treasuryId,
      treasuryName: treasury.name,
      accountId,
      accountCode,
      accountName: accountName || '',
      targetBranchId,
      targetBranchName,
      targetTreasuryOrBankId,
      targetTreasuryOrBankName,
      targetType,
      amount: numAmount,
      notes: notes?.trim() || undefined,
      status: initialStatus,
      previousEntityBalance: prevBal,
      newEntityBalance: newBal,
      lines: [singleLine],
      performedBy,
      createdAt: new Date().toISOString(),
      completedAt: initialStatus === 'مكتمل' ? new Date().toISOString() : undefined,
      completedBy: initialStatus === 'مكتمل' ? performedBy : undefined
    };

    this.transactions.unshift(record);
    this.saveToStorage();

    // Audit and Notification
    const summaryDesc = `${record.typeLabel} بمبلغ (${numAmount.toLocaleString('ar-EG')}) لحساب [${this.getAccountTypeLabel(accountType)} - ${accountName}]. مستند رقم [${documentNumber}]. الحالة: (${initialStatus}).`;
    auditEngine.logAction(
      type === 'inward' ? 'تسجيل وارد خزينة' : 'تسجيل صادر خزينة',
      'معاملات الدخل',
      summaryDesc,
      'info'
    );

    notificationEngine.addNotification(
      `تم إصدار ${record.typeLabel} بنجاح`,
      summaryDesc,
      'info',
      'معاملات الدخل'
    );

    return { success: true, transaction: record };
  }

  /**
   * Accepts a pending transfer (قبول التحويل المعلق)
   */
  public acceptPendingTransfer(transactionId: string, acceptedBy: string = 'أمين الخزينة المستلمة'): { success: boolean; error?: string } {
    const tx = this.transactions.find(t => t.id === transactionId);
    if (!tx) {
      return { success: false, error: 'الحركة المطلوبة غير موجودة.' };
    }
    if (tx.status !== 'معلق') {
      return { success: false, error: `الحركة ليست في حالة معلقة (الحالة الحالية: ${tx.status}).` };
    }

    tx.status = 'مكتمل';
    tx.completedAt = new Date().toISOString();
    tx.completedBy = acceptedBy;

    // If transaction had customer/vendor/CoA lines, update balances on approval
    if (tx.lines && tx.lines.length > 0) {
      for (const l of tx.lines) {
        if (l.accountType === 'customers') {
          const cust = customerService.getCustomerById(l.accountId);
          if (cust) {
            const prev = cust.balanceDue !== undefined ? cust.balanceDue : 0;
            const newBal = tx.type === 'inward' ? prev - l.amount : prev + l.amount;
            customerService.updateCustomer(cust.id, { balanceDue: newBal });
          }
        } else if (l.accountType === 'vendors') {
          const vend = vendorService.getVendorById(l.accountId);
          if (vend) {
            const prev = vend.balanceDue !== undefined ? vend.balanceDue : 0;
            const newBal = tx.type === 'outward' ? prev - l.amount : prev + l.amount;
            vendorService.updateVendor(vend.id, { balanceDue: newBal });
          }
        } else if (l.accountType === 'chart_of_accounts') {
          chartOfAccountsService.updateAccountBalance(
            l.accountCode || l.accountId,
            l.amount,
            tx.type === 'inward' ? 'in' : 'out'
          );
        }
      }
    }

    this.saveToStorage();

    auditEngine.logAction(
      'قبول تحويل نقدي معلق',
      'معاملات الدخل',
      `تم اعتماد وقبول استلام التحويل النقدي [${tx.documentNumber}] بمبلغ (${tx.amount.toLocaleString('ar-EG')}) من خزينة (${tx.treasuryName}) إلى (${tx.targetTreasuryOrBankName || tx.accountName}).`,
      'info'
    );

    notificationEngine.addNotification(
      'تم قبول التحويل النقدي',
      `تم استلام التحويل [${tx.documentNumber}] بنجاح وأصبح مكتمل الترحيل.`,
      'info',
      'معاملات الدخل'
    );

    return { success: true };
  }

  /**
   * Cancels/Reverses an income transaction (إلغاء وعكس الحركة)
   */
  public cancelTransaction(transactionId: string, reason: string, cancelledBy: string = 'مدير النظام'): { success: boolean; error?: string } {
    const tx = this.transactions.find(t => t.id === transactionId);
    if (!tx) {
      return { success: false, error: 'الحركة المطلوبة غير موجودة.' };
    }
    if (tx.status === 'ملغي') {
      return { success: false, error: 'هذه الحركة ملغية بالفعل مسبقاً.' };
    }

    const wasCompleted = tx.status === 'مكتمل';

    // If it was completed, reverse entity balances
    if (wasCompleted) {
      if (tx.lines && tx.lines.length > 0) {
        for (const line of tx.lines) {
          const lType = line.accountType || tx.accountType;
          if (lType === 'customers') {
            const cust = customerService.getCustomerById(line.accountId);
            if (cust) {
              const reversedBal = tx.type === 'inward' 
                ? (cust.balanceDue || 0) + line.amount
                : (cust.balanceDue || 0) - line.amount;
              customerService.updateCustomer(cust.id, { balanceDue: reversedBal });
            }
          } else if (lType === 'vendors') {
            const vend = vendorService.getVendorById(line.accountId);
            if (vend) {
              const reversedBal = tx.type === 'outward'
                ? (vend.balanceDue || 0) + line.amount
                : (vend.balanceDue || 0) - line.amount;
              vendorService.updateVendor(vend.id, { balanceDue: reversedBal });
            }
          } else if (lType === 'chart_of_accounts') {
            chartOfAccountsService.updateAccountBalance(
              line.accountCode || line.accountId,
              line.amount,
              tx.type === 'inward' ? 'out' : 'in'
            );
          }
        }
      } else {
        if (tx.accountType === 'customers') {
          const cust = customerService.getCustomerById(tx.accountId);
          if (cust) {
            // Reversal: if it was inward (reduced debt), adding it back
            const reversedBal = tx.type === 'inward' 
              ? (cust.balanceDue || 0) + tx.amount
              : (cust.balanceDue || 0) - tx.amount;
            customerService.updateCustomer(cust.id, { balanceDue: reversedBal });
          }
        } else if (tx.accountType === 'vendors') {
          const vend = vendorService.getVendorById(tx.accountId);
          if (vend) {
            // Reversal: if it was outward (reduced debt), adding it back
            const reversedBal = tx.type === 'outward'
              ? (vend.balanceDue || 0) + tx.amount
              : (vend.balanceDue || 0) - tx.amount;
            vendorService.updateVendor(vend.id, { balanceDue: reversedBal });
          }
        } else if (tx.accountType === 'chart_of_accounts') {
          // Reverse COA balance
          chartOfAccountsService.updateAccountBalance(
            tx.accountCode || tx.accountId,
            tx.amount,
            tx.type === 'inward' ? 'out' : 'in'
          );
        }
      }
    }

    tx.status = 'ملغي';
    tx.cancelledAt = new Date().toISOString();
    tx.cancelledBy = cancelledBy;
    tx.cancellationReason = reason.trim() || 'إلغاء الحركة وعكس الأثر المالي بطلب المستخدم';

    this.saveToStorage();

    auditEngine.logAction(
      'إلغاء حركة دخل وقيد عكسي',
      'معاملات الدخل',
      `تم إلغاء الحركة [${tx.documentNumber}] وإلغاء أثرها المالي. سبب الإلغاء: ${tx.cancellationReason}`,
      'warning'
    );

    notificationEngine.addNotification(
      'تم إلغاء الحركة المالية',
      `تم إلغاء المستند [${tx.documentNumber}] وعكس الأرصدة المرتبطة به.`,
      'warning',
      'معاملات الدخل'
    );

    return { success: true };
  }

  /**
   * Deletes a transaction completely (e.g. held/pending transaction)
   */
  public deleteTransaction(transactionId: string): { success: boolean; error?: string } {
    const idx = this.transactions.findIndex(t => t.id === transactionId);
    if (idx === -1) {
      return { success: false, error: 'الحركة غير موجودة.' };
    }
    this.transactions.splice(idx, 1);
    this.saveToStorage();
    return { success: true };
  }
}

export const incomeTransactionService = new IncomeTransactionService();
