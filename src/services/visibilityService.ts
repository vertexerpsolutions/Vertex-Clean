export type EntityType = 
  | 'Items'
  | 'Item Categories'
  | 'Customers'
  | 'Suppliers'
  | 'Warehouses'
  | 'Branches'
  | 'Banks'
  | 'Treasuries'
  | 'Accounts'
  | 'Employees'
  | 'Assets'
  | 'Currencies'
  | 'Payment Methods'
  | 'Tax Codes';

export interface VisibilityRecord {
  id: string;
  entityType: EntityType;
  entityCode: string;
  entityName: string;
  category?: string;
  branch?: string;
  company?: string;
  isHidden: boolean;
  hiddenBy?: string;
  hiddenAt?: string;
  hiddenReason?: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  usageCountInTransactions: number;
}

export interface VisibilityAuditEntry {
  id: string;
  timestamp: string;
  entityType: EntityType;
  entityCode: string;
  entityName: string;
  action: 'hide' | 'restore' | 'bulk_hide' | 'bulk_restore';
  performedBy: string;
  reason: string;
  previousStatus: 'visible' | 'hidden';
  currentStatus: 'visible' | 'hidden';
}

export interface VisibilityStats {
  totalEntities: number;
  totalVisible: number;
  totalHidden: number;
  hiddenPercentage: number;
  byEntityType: { type: EntityType; total: number; hidden: number; visible: number }[];
}

export interface VisibilityState {
  records: VisibilityRecord[];
  auditLogs: VisibilityAuditEntry[];
  stats: VisibilityStats;
  isVgf07Completed: boolean;
}

const STORAGE_KEY = 'VERTEX_VGF07_VISIBILITY_MANAGER';

export const INITIAL_VISIBILITY_RECORDS: VisibilityRecord[] = [
  // Items
  {
    id: 'VIS-ITM-01',
    entityType: 'Items',
    entityCode: 'SKU-LEG-99',
    entityName: 'Legacy Server Rack v1 (Discontinued)',
    category: 'Hardware & IT',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_sysadmin',
    hiddenAt: '2026-08-01T10:15:00Z',
    hiddenReason: 'End of life product line replaced by X1 series',
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-08-01T10:15:00Z',
    usageCountInTransactions: 1420
  },
  {
    id: 'VIS-ITM-02',
    entityType: 'Items',
    entityCode: 'SKU-ENT-101',
    entityName: 'Enterprise Server Node X1',
    category: 'Hardware & IT',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: false,
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-08-05T08:00:00Z',
    usageCountInTransactions: 890
  },
  // Item Categories
  {
    id: 'VIS-CAT-01',
    entityType: 'Item Categories',
    entityCode: 'CAT-DISC-09',
    entityName: 'Obsolete Telecom Accessories',
    category: 'Hardware',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_sysadmin',
    hiddenAt: '2026-07-20T14:30:00Z',
    hiddenReason: 'Archived product category',
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-07-20T14:30:00Z',
    usageCountInTransactions: 310
  },
  // Customers
  {
    id: 'VIS-CUST-01',
    entityType: 'Customers',
    entityCode: 'CUST-OLD-44',
    entityName: 'AeroCorp Aviation (Insolvent)',
    category: 'Corporate',
    branch: 'BR-LON-02',
    company: 'Vertex Europe Ltd',
    isHidden: true,
    hiddenBy: 'vtx_sysadmin',
    hiddenAt: '2026-08-02T11:00:00Z',
    hiddenReason: 'Bankruptcy liquidation - block new orders',
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-08-02T11:00:00Z',
    usageCountInTransactions: 240
  },
  {
    id: 'VIS-CUST-02',
    entityType: 'Customers',
    entityCode: 'CUST-CORP-88',
    entityName: 'Global Tech Dynamics Corp',
    category: 'Corporate',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: false,
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-08-05T09:00:00Z',
    usageCountInTransactions: 512
  },
  // Suppliers
  {
    id: 'VIS-SUPP-01',
    entityType: 'Suppliers',
    entityCode: 'SUP-SUSP-12',
    entityName: 'Northeast Logistics Partners',
    category: 'Logistics',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_auditor',
    hiddenAt: '2026-07-28T16:20:00Z',
    hiddenReason: 'Compliance hold under investigation',
    lastUpdatedBy: 'vtx_auditor',
    lastUpdatedAt: '2026-07-28T16:20:00Z',
    usageCountInTransactions: 180
  },
  // Warehouses
  {
    id: 'VIS-WH-01',
    entityType: 'Warehouses',
    entityCode: 'WH-OLD-QUEENS',
    entityName: 'Old Queens Storage Facility (Closed)',
    category: 'Storage',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_sysadmin',
    hiddenAt: '2026-06-15T09:00:00Z',
    hiddenReason: 'Lease expired and stock transferred',
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-06-15T09:00:00Z',
    usageCountInTransactions: 4200
  },
  // Branches
  {
    id: 'VIS-BR-01',
    entityType: 'Branches',
    entityCode: 'BR-MIA-09',
    entityName: 'Miami Regional Branch (Merged)',
    category: 'Retail',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_sysadmin',
    hiddenAt: '2026-07-01T00:00:00Z',
    hiddenReason: 'Merged into New York HQ via VGF-03',
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-07-01T00:00:00Z',
    usageCountInTransactions: 9800
  },
  // Banks
  {
    id: 'VIS-BNK-01',
    entityType: 'Banks',
    entityCode: 'BNK-CLOSED-01',
    entityName: 'Old Horizon Commercial Bank',
    category: 'Banking',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_treasury',
    hiddenAt: '2026-05-10T12:00:00Z',
    hiddenReason: 'Account terminated & liquidity migrated',
    lastUpdatedBy: 'vtx_treasury',
    lastUpdatedAt: '2026-05-10T12:00:00Z',
    usageCountInTransactions: 620
  },
  // Accounts
  {
    id: 'VIS-ACC-01',
    entityType: 'Accounts',
    entityCode: 'GL-5099-DEPR',
    entityName: 'Depreciated Hardware Holding GL',
    category: 'GL Account',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_sysadmin',
    hiddenAt: '2026-07-15T08:00:00Z',
    hiddenReason: 'Superceded GL chart structure',
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-07-15T08:00:00Z',
    usageCountInTransactions: 3400
  },
  // Currencies
  {
    id: 'VIS-CURR-01',
    entityType: 'Currencies',
    entityCode: 'VEF',
    entityName: 'Venezuelan Bolívar (Deprecated)',
    category: 'FX',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_sysadmin',
    hiddenAt: '2026-04-01T00:00:00Z',
    hiddenReason: 'Replaced by VED redenominated currency code',
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-04-01T00:00:00Z',
    usageCountInTransactions: 120
  },
  // Payment Methods
  {
    id: 'VIS-PMT-01',
    entityType: 'Payment Methods',
    entityCode: 'PMT-LEG-CHECK',
    entityName: 'Paper Cheque Express Drop',
    category: 'Payment',
    branch: 'BR-NY-01',
    company: 'Vertex North America Inc',
    isHidden: true,
    hiddenBy: 'vtx_sysadmin',
    hiddenAt: '2026-06-01T00:00:00Z',
    hiddenReason: 'Phased out manual cheque dropboxes',
    lastUpdatedBy: 'vtx_sysadmin',
    lastUpdatedAt: '2026-06-01T00:00:00Z',
    usageCountInTransactions: 890
  }
];

export const INITIAL_VISIBILITY_AUDIT: VisibilityAuditEntry[] = [
  {
    id: 'AUD-VIS-01',
    timestamp: '2026-08-02T11:00:00Z',
    entityType: 'Customers',
    entityCode: 'CUST-OLD-44',
    entityName: 'AeroCorp Aviation (Insolvent)',
    action: 'hide',
    performedBy: 'vtx_sysadmin',
    reason: 'Bankruptcy liquidation - block new orders',
    previousStatus: 'visible',
    currentStatus: 'hidden'
  },
  {
    id: 'AUD-VIS-02',
    timestamp: '2026-08-01T10:15:00Z',
    entityType: 'Items',
    entityCode: 'SKU-LEG-99',
    entityName: 'Legacy Server Rack v1 (Discontinued)',
    action: 'hide',
    performedBy: 'vtx_sysadmin',
    reason: 'End of life product line replaced by X1 series',
    previousStatus: 'visible',
    currentStatus: 'hidden'
  }
];

class VisibilityService {
  private state: VisibilityState;

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): VisibilityState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const records = parsed.records || INITIAL_VISIBILITY_RECORDS;
        return {
          ...parsed,
          records,
          auditLogs: parsed.auditLogs || INITIAL_VISIBILITY_AUDIT,
          stats: this.calculateStats(records)
        };
      }
    } catch (e) {
      console.warn('Failed to parse Visibility Manager state:', e);
    }

    const records = INITIAL_VISIBILITY_RECORDS;
    return {
      records,
      auditLogs: INITIAL_VISIBILITY_AUDIT,
      stats: this.calculateStats(records),
      isVgf07Completed: true
    };
  }

  private calculateStats(records: VisibilityRecord[]): VisibilityStats {
    const totalEntities = records.length;
    const totalHidden = records.filter(r => r.isHidden).length;
    const totalVisible = totalEntities - totalHidden;
    const hiddenPercentage = totalEntities > 0 ? (totalHidden / totalEntities) * 100 : 0;

    const allTypes: EntityType[] = [
      'Items', 'Item Categories', 'Customers', 'Suppliers', 'Warehouses',
      'Branches', 'Banks', 'Treasuries', 'Accounts', 'Employees', 'Assets',
      'Currencies', 'Payment Methods', 'Tax Codes'
    ];

    const byEntityType = allTypes.map(type => {
      const typeRecords = records.filter(r => r.entityType === type);
      const hidden = typeRecords.filter(r => r.isHidden).length;
      return {
        type,
        total: typeRecords.length,
        hidden,
        visible: typeRecords.length - hidden
      };
    });

    return {
      totalEntities,
      totalVisible,
      totalHidden,
      hiddenPercentage,
      byEntityType
    };
  }

  public getState(): VisibilityState {
    return this.state;
  }

  public saveState(): void {
    try {
      this.state.stats = this.calculateStats(this.state.records);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save Visibility Manager state:', e);
    }
  }

  public hideRecord(recordId: string, reason: string, user: string = 'vtx_sysadmin'): void {
    const record = this.state.records.find(r => r.id === recordId);
    if (!record) return;

    record.isHidden = true;
    record.hiddenBy = user;
    record.hiddenAt = new Date().toISOString();
    record.hiddenReason = reason;
    record.lastUpdatedBy = user;
    record.lastUpdatedAt = new Date().toISOString();

    const audit: VisibilityAuditEntry = {
      id: `AUD-VIS-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      entityType: record.entityType,
      entityCode: record.entityCode,
      entityName: record.entityName,
      action: 'hide',
      performedBy: user,
      reason,
      previousStatus: 'visible',
      currentStatus: 'hidden'
    };

    this.state.auditLogs = [audit, ...this.state.auditLogs];
    this.saveState();
  }

  public restoreRecord(recordId: string, reason: string, user: string = 'vtx_sysadmin'): void {
    const record = this.state.records.find(r => r.id === recordId);
    if (!record) return;

    record.isHidden = false;
    record.lastUpdatedBy = user;
    record.lastUpdatedAt = new Date().toISOString();

    const audit: VisibilityAuditEntry = {
      id: `AUD-VIS-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      entityType: record.entityType,
      entityCode: record.entityCode,
      entityName: record.entityName,
      action: 'restore',
      performedBy: user,
      reason,
      previousStatus: 'hidden',
      currentStatus: 'visible'
    };

    this.state.auditLogs = [audit, ...this.state.auditLogs];
    this.saveState();
  }

  public bulkHide(recordIds: string[], reason: string, user: string = 'vtx_sysadmin'): void {
    recordIds.forEach(id => this.hideRecord(id, reason, user));
  }

  public bulkRestore(recordIds: string[], reason: string, user: string = 'vtx_sysadmin'): void {
    recordIds.forEach(id => this.restoreRecord(id, reason, user));
  }

  public getVisibleRecords(entityType?: EntityType): VisibilityRecord[] {
    return this.state.records.filter(r => !r.isHidden && (!entityType || r.entityType === entityType));
  }

  public markVgf07Completed(): void {
    this.state.isVgf07Completed = true;
    this.saveState();
  }

  public resetState(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
  }
}

export const visibilityService = new VisibilityService();
