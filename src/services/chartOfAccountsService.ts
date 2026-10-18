import { 
  ChartAccountNode, 
  INITIAL_APPROVED_CHART_OF_ACCOUNTS 
} from '../data/defaultChartOfAccounts';

export type { ChartAccountNode };
export { INITIAL_APPROVED_CHART_OF_ACCOUNTS };

const STORAGE_KEY = 'VERTEX_CHART_OF_ACCOUNTS_REF_V1';

class ChartOfAccountsService {
  private accounts: ChartAccountNode[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadAccounts();
  }

  private loadAccounts(): void {
    try {
      // Clear legacy storage keys if present so the new reference is loaded as the sole source
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('VERTEX_CHART_OF_ACCOUNTS_V1');
        localStorage.removeItem('VERTEX_CHART_OF_ACCOUNTS_V2');
      }
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(
            (a: any) => !a.name?.includes('العجوزة') && !a.name?.includes('العجوزه') && !a.name?.includes('Agouza') && !a.notes?.includes('العجوز')
          );
          this.accounts = filtered;
          if (filtered.length !== parsed.length) {
            this.saveToStorage();
          }
          return;
        }
      }
      this.accounts = [...INITIAL_APPROVED_CHART_OF_ACCOUNTS];
      this.saveToStorage();
    } catch {
      this.accounts = [...INITIAL_APPROVED_CHART_OF_ACCOUNTS];
    }
  }

  public resetToDefault(): void {
    this.accounts = [...INITIAL_APPROVED_CHART_OF_ACCOUNTS];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.accounts));
      this.notifyListeners();
    } catch (err) {
      console.error('Failed to persist Chart of Accounts', err);
    }
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
        console.error('Error in ChartOfAccounts listener', err);
      }
    });
  }

  public getAllAccounts(): ChartAccountNode[] {
    return [...this.accounts];
  }

  /**
   * Only leaf accounts (حسابات فرعية تقبل الترحيل) that are active
   */
  public getPostingAccounts(): ChartAccountNode[] {
    return this.accounts.filter(a => a.isLeaf && a.status === 'active');
  }

  public getAccountById(id: string): ChartAccountNode | undefined {
    return this.accounts.find(a => a.id === id || a.code === id);
  }

  public getAccountByCode(code: string): ChartAccountNode | undefined {
    return this.accounts.find(a => a.code === code);
  }

  /**
   * Adds a new account into the approved Chart of Accounts
   */
  public addAccount(data: {
    code: string;
    name: string;
    nameEn?: string;
    category: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';
    categoryLabel?: string;
    parentCode?: string;
    nature?: 'debit' | 'credit';
    isLeaf?: boolean;
    notes?: string;
  }): { success: boolean; account?: ChartAccountNode; error?: string } {
    if (!data.code || !data.code.trim()) {
      return { success: false, error: 'كود الحساب مطلوب ولا يمكن تركه فارغاً.' };
    }
    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'اسم الحساب مطلوب ولا يمكن تركه فارغاً.' };
    }

    const cleanCode = data.code.trim();
    if (this.accounts.some(a => a.code === cleanCode)) {
      return { success: false, error: `كود الحساب [${cleanCode}] مسجل مسبقاً في شجرة الحسابات.` };
    }

    // Determine default nature
    const defaultNature: 'debit' | 'credit' = 
      (data.category === 'assets' || data.category === 'expenses') ? 'debit' : 'credit';

    const newAccount: ChartAccountNode = {
      id: `COA-${cleanCode}`,
      code: cleanCode,
      name: data.name.trim(),
      nameEn: data.nameEn?.trim(),
      category: data.category,
      categoryLabel: data.categoryLabel || this.getCategoryDefaultLabel(data.category),
      parentCode: data.parentCode,
      level: cleanCode.length > 2 ? 3 : 2,
      nature: data.nature || defaultNature,
      isLeaf: data.isLeaf !== undefined ? data.isLeaf : true,
      balance: 0,
      status: 'active',
      notes: data.notes?.trim()
    };

    this.accounts.push(newAccount);
    this.accounts.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    this.saveToStorage();

    return { success: true, account: newAccount };
  }

  /**
   * Updates balance of an account when an income transaction occurs
   */
  public updateAccountBalance(codeOrId: string, deltaAmount: number, direction: 'in' | 'out'): void {
    const acc = this.accounts.find(a => a.id === codeOrId || a.code === codeOrId);
    if (!acc) return;

    // For Debit accounts (Assets/Expenses): Inflow/Debit increases balance, Outflow/Credit decreases
    // For Credit accounts (Liabilities/Equity/Revenue): Outflow/Credit increases, Inflow/Debit decreases
    if (acc.nature === 'debit') {
      if (direction === 'in') {
        acc.balance += deltaAmount;
      } else {
        acc.balance -= deltaAmount;
      }
    } else {
      if (direction === 'out') {
        acc.balance += deltaAmount;
      } else {
        acc.balance -= deltaAmount;
      }
    }

    this.saveToStorage();
  }

  public updateAccount(id: string, updates: Partial<ChartAccountNode>): { success: boolean; error?: string } {
    const idx = this.accounts.findIndex(a => a.id === id || a.code === id);
    if (idx === -1) {
      return { success: false, error: 'الحساب غير موجود في دليل الحسابات.' };
    }
    this.accounts[idx] = { ...this.accounts[idx], ...updates };
    this.saveToStorage();
    return { success: true };
  }

  public toggleAccountStatus(id: string): { success: boolean; newStatus?: 'active' | 'inactive'; error?: string } {
    const acc = this.accounts.find(a => a.id === id || a.code === id);
    if (!acc) return { success: false, error: 'الحساب غير موجود.' };
    acc.status = acc.status === 'active' ? 'inactive' : 'active';
    this.saveToStorage();
    return { success: true, newStatus: acc.status };
  }

  public suggestNextCode(parentCode?: string): string {
    if (!parentCode) {
      return '';
    }
    const children = this.accounts.filter(a => a.parentCode === parentCode);
    if (children.length === 0) {
      return parentCode.length === 1 ? `${parentCode}1` : `${parentCode}01`;
    }
    const numericCodes = children
      .map(c => parseInt(c.code, 10))
      .filter(n => !isNaN(n));
    if (numericCodes.length === 0) {
      return `${parentCode}01`;
    }
    const max = Math.max(...numericCodes);
    return String(max + 1);
  }

  private getCategoryDefaultLabel(cat: string): string {
    switch (cat) {
      case 'assets': return 'الأصول';
      case 'liabilities': return 'الخصوم';
      case 'equity': return 'حقوق الملكية';
      case 'revenue': return 'الإيرادات';
      case 'expenses': return 'المصروفات';
      default: return 'حساب عام';
    }
  }

  /**
   * Deletes and cleans any test current account related to العجوزة from Chart of Accounts
   */
  public deleteAgouzaAccount(): { success: boolean; deletedCount: number } {
    const beforeCount = this.accounts.length;
    this.accounts = this.accounts.filter(
      a => !a.name?.includes('العجوزة') && !a.name?.includes('العجوزه') && !a.name?.includes('Agouza') && !a.notes?.includes('العجوز')
    );
    const deletedCount = beforeCount - this.accounts.length;
    if (deletedCount > 0) {
      this.saveToStorage();
    }
    return { success: true, deletedCount };
  }
}

export const chartOfAccountsService = new ChartOfAccountsService();
