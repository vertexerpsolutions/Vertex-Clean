import { BankAccountItem } from '../types';
import { setupWizardService } from './setupWizardService';

/**
 * Service to manage Bank Accounts with strict Branch-scoped isolation in VERTEX ERP.
 * 
 * Rules:
 * 1. Bank accounts belong to specific branches via branchId & branchName.
 * 2. Every branch only views, queries, and transacts with its own bank accounts.
 * 3. Bank balances are calculated dynamically from real transactions (Opening Balances, 
 *    Sales Card/Bank receipts, Purchase Bank payments, Income/Expense Vouchers, and Completed Transfers).
 * 4. Zero Hardcoded / Mock numbers.
 * 5. Pending cross-branch bank transfers block single branch reset.
 */

class BankAccountService {
  /**
   * Get all bank accounts, optionally filtered strictly by branchId.
   */
  public getBankAccounts(branchId?: string): BankAccountItem[] {
    const wizardConfig = setupWizardService.getConfig();
    let accounts: BankAccountItem[] = wizardConfig.bankAccounts || [];
    const configBranches = wizardConfig.branches || [];
    const inactiveBranchIds = new Set(
      configBranches.filter((b: any) => b.status === 'غير نشط').map((b: any) => b.id)
    );

    // Filter out accounts belonging to inactive branches
    accounts = accounts.filter(b => !b.branchId || !inactiveBranchIds.has(b.branchId));

    // Ensure every account has a valid branchId
    accounts = accounts.map(b => {
      if (!b.branchId) {
        const assignedBranch = b.id === 'BK-02' ? 'BR-02' : 'BR-01';
        const assignedBranchName = assignedBranch === 'BR-01' ? 'داتا اليكس للتوريدات العمومية' : 'المستودع الإقليمي لندن';
        return {
          ...b,
          branchId: assignedBranch,
          branchName: b.branchName || assignedBranchName,
          openingBalance: b.openingBalance || 0
        };
      }
      return b;
    });

    if (branchId) {
      return accounts.filter(b => b.branchId === branchId);
    }
    return accounts;
  }

  /**
   * Get a specific bank account by ID.
   */
  public getBankAccountById(bankId: string): BankAccountItem | undefined {
    const accounts = this.getBankAccounts();
    return accounts.find(b => b.id === bankId || b.code === bankId);
  }

  /**
   * Calculate the real live balance of a bank account dynamically from all actual transactions.
   */
  public getBankBalance(bankId: string, branchId?: string): number {
    const bank = this.getBankAccountById(bankId);
    if (!bank) return 0;

    let balance = (typeof bank.openingBalance === 'number' && !isNaN(bank.openingBalance)) 
      ? bank.openingBalance 
      : 0;

    if (typeof window === 'undefined' || !window.localStorage) {
      return balance;
    }

    // 1. Income Transactions (Vouchers & Transfers)
    try {
      const rawInc = localStorage.getItem('VERTEX_INCOME_TRANSACTIONS_V1');
      if (rawInc) {
        const incomeList: any[] = JSON.parse(rawInc);
        if (Array.isArray(incomeList)) {
          incomeList.forEach(tx => {
            if (tx.status === 'ملغي' || tx.status === 'cancelled') return;

            // Direct Bank Vouchers (Deposit / Withdrawal)
            if (tx.accountType === 'bank' && (tx.accountId === bankId || tx.accountId === bank.code)) {
              if (tx.type === 'outward') {
                // Outward from treasury into bank -> Bank INCREASES
                balance += (Number(tx.amount) || 0);
              } else if (tx.type === 'inward') {
                // Inward to treasury from bank -> Bank DECREASES
                balance -= (Number(tx.amount) || 0);
              }
            }

            // Cross-branch or Treasury-to-Bank transfers
            if (tx.targetType === 'bank' && (tx.targetTreasuryOrBankId === bankId || tx.targetTreasuryOrBankId === bank.code)) {
              if (tx.status === 'مكتمل' || tx.status === 'completed') {
                balance += (Number(tx.amount) || 0);
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse income transactions for bank balance', e);
    }

    // 2. Sales Invoices (Card & Bank payments)
    try {
      const rawSales = localStorage.getItem('VERTEX_VGF06_SALES_ENTRY');
      if (rawSales) {
        const salesList: any[] = JSON.parse(rawSales);
        if (Array.isArray(salesList)) {
          salesList.forEach(inv => {
            if (inv.status === 'cancelled') return;
            if (inv.bankId === bankId || inv.bankId === bank.code) {
              const cardAmt = Number(inv.cardPaid) || 0;
              if (cardAmt > 0) {
                balance += cardAmt;
              } else if (inv.paymentMethod === 'card' && Number(inv.grandTotal) > 0) {
                balance += Number(inv.grandTotal);
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse sales entries for bank balance', e);
    }

    // 3. Sales Returns (Refunds via card / bank)
    try {
      const rawReturns = localStorage.getItem('sales_returns_records_v1');
      if (rawReturns) {
        const returnsList: any[] = JSON.parse(rawReturns);
        if (Array.isArray(returnsList)) {
          // Pre-load sales for bank matching
          const rawSales = localStorage.getItem('VERTEX_VGF06_SALES_ENTRY');
          const salesMap = new Map<string, any>();
          if (rawSales) {
            try {
              const sList = JSON.parse(rawSales);
              if (Array.isArray(sList)) {
                sList.forEach(s => salesMap.set(s.id, s));
              }
            } catch {}
          }

          returnsList.forEach(ret => {
            if (ret.status === 'cancelled') return;
            if (ret.refundMethod === 'card') {
              const orig = salesMap.get(ret.originalInvoiceId);
              if (orig && (orig.bankId === bankId || orig.bankId === bank.code)) {
                balance -= (Number(ret.netReturnTotal) || 0);
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse sales returns for bank balance', e);
    }

    // 4. Purchase Invoices (Bank transfers & card payments)
    try {
      const rawPurchases = localStorage.getItem('VERTEX_PURCHASE_INVOICES_V1');
      if (rawPurchases) {
        const purchasesList: any[] = JSON.parse(rawPurchases);
        if (Array.isArray(purchasesList)) {
          purchasesList.forEach(inv => {
            if (inv.status === 'cancelled' || inv.status === 'draft') return;
            if (inv.bankId === bankId || inv.bankId === bank.code) {
              const paid = Number(inv.cardPaid) || Number(inv.paidAmount) || (inv.paymentMethod === 'تحويل بنكي' ? Number(inv.grandTotal) : 0);
              balance -= paid;
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse purchases for bank balance', e);
    }

    // 5. Purchase Returns
    try {
      const rawPReturns = localStorage.getItem('purchase_returns_records_v1');
      if (rawPReturns) {
        const pReturnsList: any[] = JSON.parse(rawPReturns);
        if (Array.isArray(pReturnsList)) {
          const rawPurchases = localStorage.getItem('VERTEX_PURCHASE_INVOICES_V1');
          const purchasesMap = new Map<string, any>();
          if (rawPurchases) {
            try {
              const pList = JSON.parse(rawPurchases);
              if (Array.isArray(pList)) {
                pList.forEach(p => purchasesMap.set(p.id, p));
              }
            } catch {}
          }

          pReturnsList.forEach(ret => {
            if (ret.status === 'cancelled') return;
            const orig = purchasesMap.get(ret.originalInvoiceId);
            if (orig && (orig.bankId === bankId || orig.bankId === bank.code)) {
              balance += (Number(ret.netReturnTotal) || 0);
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse purchase returns for bank balance', e);
    }

    return Math.round(balance * 100) / 100;
  }

  /**
   * Get total liquid balance across all bank accounts belonging to a specific branch.
   */
  public getTotalBankLiquidity(branchId: string): number {
    const branchAccounts = this.getBankAccounts(branchId);
    return branchAccounts.reduce((sum, b) => {
      return sum + this.getBankBalance(b.id, branchId);
    }, 0);
  }

  /**
   * Check for any pending cross-branch bank transfers.
   * If a pending bank transfer exists involving this branch, it must block the Reset.
   */
  public checkPendingBankTransfers(branchId: string): { hasPending: boolean; transfer?: any } {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { hasPending: false };
    }

    try {
      const rawInc = localStorage.getItem('VERTEX_INCOME_TRANSACTIONS_V1');
      if (!rawInc) return { hasPending: false };
      const incomeList: any[] = JSON.parse(rawInc);
      if (!Array.isArray(incomeList)) return { hasPending: false };

      // Map treasuries to branch
      const rawTreasuries = localStorage.getItem('VERTEX_TREASURY_MASTER_V1');
      const treasuryBranchMap = new Map<string, string>();
      if (rawTreasuries) {
        try {
          const tList = JSON.parse(rawTreasuries);
          if (Array.isArray(tList)) {
            tList.forEach(t => treasuryBranchMap.set(t.id, t.branchId));
          }
        } catch {}
      }

      for (const tx of incomeList) {
        const isPending = tx.status === 'معلق' || tx.status === 'pending';
        if (!isPending) continue;

        const involvesBank = tx.accountType === 'bank' || tx.targetType === 'bank';
        if (!involvesBank) continue;

        const sourceBranch = tx.branchId || (tx.treasuryId ? treasuryBranchMap.get(tx.treasuryId) : undefined);
        const targetBranch = tx.targetBranchId;

        const involvesThisBranch = sourceBranch === branchId || targetBranch === branchId;
        const isCrossBranch = targetBranch && sourceBranch && sourceBranch !== targetBranch;

        if (involvesThisBranch && isCrossBranch) {
          return { hasPending: true, transfer: tx };
        }
      }
    } catch (e) {
      console.error('Failed to check pending bank transfers', e);
    }

    return { hasPending: false };
  }
}

export const bankAccountService = new BankAccountService();
