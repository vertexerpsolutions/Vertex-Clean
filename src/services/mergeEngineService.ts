export type MergeRecordType = 
  | 'customers'
  | 'suppliers'
  | 'items'
  | 'accounts'
  | 'warehouses'
  | 'branches'
  | 'employees'
  | 'assets'
  | 'banks'
  | 'treasuries';

export interface RecordAttribute {
  fieldKey: string;
  fieldLabel: string;
  primaryValue: string | number | boolean;
  secondaryValue: string | number | boolean;
  selectedValue: 'primary' | 'secondary' | 'custom';
  customValue?: string;
  category: 'general' | 'financial' | 'contact' | 'balance' | 'status';
}

export interface LinkedRelationship {
  id: string;
  entityType: string;
  documentNumber: string;
  date: string;
  amount: number;
  description: string;
  belongsTo: 'primary' | 'secondary';
  transferredToPrimary: boolean;
}

export interface MergeCandidatePair {
  id: string;
  recordType: MergeRecordType;
  primaryRecord: {
    id: string;
    code: string;
    name: string;
    status: string;
    balance: number;
    email?: string;
    phone?: string;
    address?: string;
    createdDate: string;
    taxId?: string;
  };
  secondaryRecord: {
    id: string;
    code: string;
    name: string;
    status: string;
    balance: number;
    email?: string;
    phone?: string;
    address?: string;
    createdDate: string;
    taxId?: string;
  };
  matchScorePercentage: number;
  matchReason: string;
  attributes: RecordAttribute[];
  linkedTransactions: LinkedRelationship[];
}

export interface MergeValidationWarning {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'balance_mismatch' | 'tax_id_conflict' | 'pending_workflow' | 'foreign_key' | 'historical_integrity';
  title: string;
  message: string;
  resolutionHint: string;
  isAcknowledged: boolean;
}

export interface MergeExecutionRecord {
  id: string;
  mergeCode: string;
  recordType: MergeRecordType;
  primaryId: string;
  primaryCode: string;
  primaryName: string;
  secondaryId: string;
  secondaryCode: string;
  secondaryName: string;
  executedBy: string;
  executedAt: string;
  transferredItemsCount: number;
  totalFinancialVolumeTransferred: number;
  status: 'completed' | 'rolled_back';
  snapshotData: {
    candidatePair: MergeCandidatePair;
    timestamp: string;
  };
}

export interface MergeAuditLog {
  id: string;
  timestamp: string;
  action: 'validation_run' | 'merge_executed' | 'merge_rolled_back' | 'template_applied' | 'conflict_resolved';
  executedBy: string;
  details: string;
  affectedRecords: string[];
}

export interface MergeEngineState {
  activeRecordType: MergeRecordType;
  candidates: MergeCandidatePair[];
  selectedCandidateId: string | null;
  validationWarnings: MergeValidationWarning[];
  executionHistory: MergeExecutionRecord[];
  auditLogs: MergeAuditLog[];
  stats: {
    totalMergesExecuted: number;
    recordsConsolidatedCount: number;
    financialTransactionsRelinked: number;
    rollbacksPerformed: number;
  };
  isVgf03Completed: boolean;
}

const STORAGE_KEY = 'VERTEX_VGF03_MERGE_ENGINE';

export const DEFAULT_RECORD_TYPE_LABELS: Record<MergeRecordType, { title: string; module: string; desc: string }> = {
  customers: { title: 'Customers & Accounts Receivable', module: 'MOD-AR / CRM', desc: 'Consolidate duplicate customer profiles, ledger entries, and pending invoices.' },
  suppliers: { title: 'Suppliers & Accounts Payable', module: 'MOD-AP / Procurement', desc: 'Merge vendor accounts, purchase orders, billings, and payment terms.' },
  items: { title: 'Items & Inventory Master', module: 'MOD-INV / Catalog', desc: 'Combine duplicate SKUs, stock ledger valuation, and warehouse location quantities.' },
  accounts: { title: 'Chart of Accounts (GL)', module: 'MOD-GL / General Ledger', desc: 'Merge sub-accounts, historical journal entries, and trial balance movement.' },
  warehouses: { title: 'Warehouses & Storage Facilities', module: 'MOD-INV / Logistics', desc: 'Merge storage depots, bin locations, and inventory transfers.' },
  branches: { title: 'Branches & Business Units', module: 'MOD-GL / Org Matrix', desc: 'Consolidate regional operating branches and cost centers.' },
  employees: { title: 'Employees & Payroll Accounts', module: 'MOD-HR / Payroll', desc: 'Unify duplicate employee records, timecards, and payroll histories.' },
  assets: { title: 'Fixed Assets Register', module: 'MOD-FA / Fixed Assets', desc: 'Merge duplicate asset tags, depreciation schedules, and maintenance logs.' },
  banks: { title: 'Bank Accounts & Liquidity', module: 'MOD-TR / Treasury', desc: 'Combine duplicate bank profiles, statement feeds, and checkbooks.' },
  treasuries: { title: 'Treasuries & Cash Boxes', module: 'MOD-TR / Cashier', desc: 'Consolidate petty cash drawers, treasuries, and cash receipt logs.' }
};

export const INITIAL_MOCK_CANDIDATES: MergeCandidatePair[] = [
  {
    id: 'PAIR-CUST-001',
    recordType: 'customers',
    matchScorePercentage: 96,
    matchReason: 'Identical Tax ID (TAX-88902-NY) & Similar Commercial Name match',
    primaryRecord: {
      id: 'CUST-1001',
      code: 'CUST-1001',
      name: 'Acme Global Logistics LLC',
      status: 'active',
      balance: 145200.00,
      email: 'accounts@acmeglobal.com',
      phone: '+1 (212) 555-0199',
      address: '350 Fifth Avenue, Floor 42, New York, NY 10118',
      createdDate: '2025-01-15',
      taxId: 'TAX-88902-NY'
    },
    secondaryRecord: {
      id: 'CUST-1099',
      code: 'CUST-1099',
      name: 'Acme Global Logistics Inc (Legacy)',
      status: 'active',
      balance: 38400.00,
      email: 'billing@acme-global.com',
      phone: '+1 (212) 555-0188',
      address: '350 Fifth Ave, Suite 4200, New York, NY 10118',
      createdDate: '2024-11-20',
      taxId: 'TAX-88902-NY'
    },
    attributes: [
      { fieldKey: 'name', fieldLabel: 'Customer Commercial Name', primaryValue: 'Acme Global Logistics LLC', secondaryValue: 'Acme Global Logistics Inc (Legacy)', selectedValue: 'primary', category: 'general' },
      { fieldKey: 'taxId', fieldLabel: 'VAT / Tax Registration Number', primaryValue: 'TAX-88902-NY', secondaryValue: 'TAX-88902-NY', selectedValue: 'primary', category: 'general' },
      { fieldKey: 'email', fieldLabel: 'Billing Email Address', primaryValue: 'accounts@acmeglobal.com', secondaryValue: 'billing@acme-global.com', selectedValue: 'primary', category: 'contact' },
      { fieldKey: 'phone', fieldLabel: 'Telephone Number', primaryValue: '+1 (212) 555-0199', secondaryValue: '+1 (212) 555-0188', selectedValue: 'primary', category: 'contact' },
      { fieldKey: 'address', fieldLabel: 'Corporate Office Address', primaryValue: '350 Fifth Avenue, Floor 42, NY', secondaryValue: '350 Fifth Ave, Suite 4200, NY', selectedValue: 'primary', category: 'contact' },
      { fieldKey: 'balance', fieldLabel: 'Current Outstanding AR Balance ($)', primaryValue: 145200.00, secondaryValue: 38400.00, selectedValue: 'primary', category: 'balance' },
      { fieldKey: 'creditLimit', fieldLabel: 'Credit Limit ($)', primaryValue: 250000.00, secondaryValue: 100000.00, selectedValue: 'primary', category: 'financial' }
    ],
    linkedTransactions: [
      { id: 'TX-INV-8821', entityType: 'Sales Invoice', documentNumber: 'INV-2026-0042', date: '2026-07-12', amount: 24500.00, description: 'Q2 Logistics Consulting Services', belongsTo: 'primary', transferredToPrimary: true },
      { id: 'TX-INV-9012', entityType: 'Sales Invoice', documentNumber: 'INV-2026-0188', date: '2026-07-28', amount: 13900.00, description: 'Freight Dispatch Retainer Fee', belongsTo: 'secondary', transferredToPrimary: false },
      { id: 'TX-PAY-4401', entityType: 'Customer Payment Receipt', documentNumber: 'RCT-2026-0099', date: '2026-08-01', amount: 15000.00, description: 'Wire Transfer Payment #8892', belongsTo: 'secondary', transferredToPrimary: false },
      { id: 'TX-JV-1022', entityType: 'Journal Entry', documentNumber: 'JV-2026-0412', date: '2026-06-30', amount: 4500.00, description: 'Bad Debt Provision Adjustment', belongsTo: 'secondary', transferredToPrimary: false }
    ]
  },
  {
    id: 'PAIR-SUPP-002',
    recordType: 'suppliers',
    matchScorePercentage: 92,
    matchReason: 'Matching Bank Account IBAN & Similar Supplier Name',
    primaryRecord: {
      id: 'SUPP-2005',
      code: 'SUPP-2005',
      name: 'Apex Industrial Components Corp',
      status: 'active',
      balance: 82100.00,
      email: 'ap@apexindustrial.com',
      phone: '+1 (312) 555-0811',
      address: '100 Industrial Parkway, Chicago, IL 60607',
      createdDate: '2025-02-10',
      taxId: 'TAX-11920-IL'
    },
    secondaryRecord: {
      id: 'SUPP-2098',
      code: 'SUPP-2098',
      name: 'Apex Industrial Components (Midwest Branch)',
      status: 'active',
      balance: 18500.00,
      email: 'vendor-ar@apexindustrial.com',
      phone: '+1 (312) 555-0822',
      address: '102 Industrial Pkwy, Chicago, IL 60607',
      createdDate: '2025-04-18',
      taxId: 'TAX-11920-IL'
    },
    attributes: [
      { fieldKey: 'name', fieldLabel: 'Supplier Corporate Name', primaryValue: 'Apex Industrial Components Corp', secondaryValue: 'Apex Industrial Components (Midwest)', selectedValue: 'primary', category: 'general' },
      { fieldKey: 'taxId', fieldLabel: 'Tax ID / EIN', primaryValue: 'TAX-11920-IL', secondaryValue: 'TAX-11920-IL', selectedValue: 'primary', category: 'general' },
      { fieldKey: 'email', fieldLabel: 'Accounts Payable Email', primaryValue: 'ap@apexindustrial.com', secondaryValue: 'vendor-ar@apexindustrial.com', selectedValue: 'primary', category: 'contact' },
      { fieldKey: 'balance', fieldLabel: 'AP Ledger Outstanding ($)', primaryValue: 82100.00, secondaryValue: 18500.00, selectedValue: 'primary', category: 'balance' }
    ],
    linkedTransactions: [
      { id: 'TX-PO-3301', entityType: 'Purchase Order', documentNumber: 'PO-2026-0811', date: '2026-07-05', amount: 52000.00, description: 'Raw Aluminum Extrusion Supplies', belongsTo: 'primary', transferredToPrimary: true },
      { id: 'TX-BILL-7721', entityType: 'Supplier Bill', documentNumber: 'BILL-2026-0210', date: '2026-07-22', amount: 18500.00, description: 'Machine Spare Parts Order', belongsTo: 'secondary', transferredToPrimary: false }
    ]
  },
  {
    id: 'PAIR-ITEM-003',
    recordType: 'items',
    matchScorePercentage: 98,
    matchReason: 'Exact SKU Match (SKU-PL-882) across duplicate catalog imports',
    primaryRecord: {
      id: 'ITEM-8821',
      code: 'SKU-PL-882',
      name: 'Polymer Shielding Enclosure 500mm',
      status: 'active',
      balance: 450, // stock qty
      createdDate: '2025-03-01'
    },
    secondaryRecord: {
      id: 'ITEM-8899',
      code: 'SKU-PL-882-OLD',
      name: 'Polymer Shielding Enclosure 500mm (Duplicate)',
      status: 'active',
      balance: 120, // stock qty
      createdDate: '2025-05-12'
    },
    attributes: [
      { fieldKey: 'name', fieldLabel: 'Item Description', primaryValue: 'Polymer Shielding Enclosure 500mm', secondaryValue: 'Polymer Shielding Enclosure 500mm (Duplicate)', selectedValue: 'primary', category: 'general' },
      { fieldKey: 'balance', fieldLabel: 'Total Warehouse Quantity (Units)', primaryValue: 450, secondaryValue: 120, selectedValue: 'primary', category: 'balance' },
      { fieldKey: 'unitPrice', fieldLabel: 'Selling Price ($)', primaryValue: 185.00, secondaryValue: 180.00, selectedValue: 'primary', category: 'financial' }
    ],
    linkedTransactions: [
      { id: 'TX-INV-MVE-10', entityType: 'Inventory Transfer Voucher', documentNumber: 'ITV-2026-0032', date: '2026-07-19', amount: 120, description: 'Stock Movement from WH-MAIN to WH-EAST', belongsTo: 'secondary', transferredToPrimary: false }
    ]
  }
];

export const INITIAL_VALIDATION_WARNINGS: MergeValidationWarning[] = [
  {
    id: 'VAL-WARN-01',
    severity: 'warning',
    category: 'balance_mismatch',
    title: 'Financial Balance Consolidation',
    message: 'Primary record balance ($145,200.00) will absorb secondary record balance ($38,400.00), creating a unified AR position of $183,600.00.',
    resolutionHint: 'General Ledger control account posting matrix will automatically reclassify open receivables.',
    isAcknowledged: true
  },
  {
    id: 'VAL-WARN-02',
    severity: 'info',
    category: 'historical_integrity',
    title: 'Relationship & Audit History Preservation',
    message: '4 linked transactions (Invoices, Receipts, Journal Entries) will be re-parented to CUST-1001 with audit log timestamp.',
    resolutionHint: 'Full rollback snapshot will be retained in VGF-03 audit vault.',
    isAcknowledged: true
  }
];

class MergeEngineService {
  private state: MergeEngineState;

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): MergeEngineState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          candidates: parsed.candidates || INITIAL_MOCK_CANDIDATES,
          validationWarnings: parsed.validationWarnings || INITIAL_VALIDATION_WARNINGS
        };
      }
    } catch (e) {
      console.warn('Failed to parse Merge Engine storage, using defaults:', e);
    }

    return {
      activeRecordType: 'customers',
      candidates: INITIAL_MOCK_CANDIDATES,
      selectedCandidateId: 'PAIR-CUST-001',
      validationWarnings: INITIAL_VALIDATION_WARNINGS,
      executionHistory: [
        {
          id: 'EXEC-2026-001',
          mergeCode: 'MRG-2026-0802-01',
          recordType: 'customers',
          primaryId: 'CUST-1001',
          primaryCode: 'CUST-1001',
          primaryName: 'Acme Global Logistics LLC',
          secondaryId: 'CUST-1099',
          secondaryCode: 'CUST-1099',
          secondaryName: 'Acme Global Logistics Inc (Legacy)',
          executedBy: 'vtx_sysadmin',
          executedAt: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
          transferredItemsCount: 4,
          totalFinancialVolumeTransferred: 57400.00,
          status: 'completed',
          snapshotData: {
            candidatePair: INITIAL_MOCK_CANDIDATES[0],
            timestamp: new Date().toISOString()
          }
        }
      ],
      auditLogs: [
        {
          id: 'LOG-MRG-101',
          timestamp: new Date().toISOString(),
          action: 'validation_run',
          executedBy: 'vtx_sysadmin',
          details: 'Validation checks executed cleanly for Customer candidate pair PAIR-CUST-001. 0 critical errors found.',
          affectedRecords: ['CUST-1001', 'CUST-1099']
        }
      ],
      stats: {
        totalMergesExecuted: 1,
        recordsConsolidatedCount: 2,
        financialTransactionsRelinked: 4,
        rollbacksPerformed: 0
      },
      isVgf03Completed: true
    };
  }

  public getState(): MergeEngineState {
    return this.state;
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save Merge Engine state:', e);
    }
  }

  public updateState(updates: Partial<MergeEngineState>): MergeEngineState {
    this.state = { ...this.state, ...updates };
    this.saveState();
    return this.state;
  }

  public updateCandidateAttribute(candidateId: string, fieldKey: string, selectedValue: 'primary' | 'secondary' | 'custom', customVal?: string): void {
    this.state.candidates = this.state.candidates.map(candidate => {
      if (candidate.id === candidateId) {
        const updatedAttributes = candidate.attributes.map(attr => {
          if (attr.fieldKey === fieldKey) {
            return {
              ...attr,
              selectedValue,
              customValue: customVal !== undefined ? customVal : attr.customValue
            };
          }
          return attr;
        });
        return { ...candidate, attributes: updatedAttributes };
      }
      return candidate;
    });
    this.saveState();
  }

  public executeMerge(candidateId: string): MergeExecutionRecord | null {
    const candidate = this.state.candidates.find(c => c.id === candidateId);
    if (!candidate) return null;

    // Calculate total volume transferred
    const totalVolume = candidate.linkedTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    const executionRecord: MergeExecutionRecord = {
      id: `EXEC-${Date.now().toString().slice(-6)}`,
      mergeCode: `MRG-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      recordType: candidate.recordType,
      primaryId: candidate.primaryRecord.id,
      primaryCode: candidate.primaryRecord.code,
      primaryName: candidate.primaryRecord.name,
      secondaryId: candidate.secondaryRecord.id,
      secondaryCode: candidate.secondaryRecord.code,
      secondaryName: candidate.secondaryRecord.name,
      executedBy: 'vtx_sysadmin',
      executedAt: new Date().toISOString(),
      transferredItemsCount: candidate.linkedTransactions.length,
      totalFinancialVolumeTransferred: totalVolume,
      status: 'completed',
      snapshotData: {
        candidatePair: candidate,
        timestamp: new Date().toISOString()
      }
    };

    // Update stats
    this.state.stats.totalMergesExecuted += 1;
    this.state.stats.recordsConsolidatedCount += 2;
    this.state.stats.financialTransactionsRelinked += candidate.linkedTransactions.length;

    // Add to execution history
    this.state.executionHistory = [executionRecord, ...this.state.executionHistory];

    // Add audit log
    this.addAuditLog('merge_executed', `Successfully merged ${candidate.secondaryRecord.code} into ${candidate.primaryRecord.code}. Transferred ${candidate.linkedTransactions.length} documents.`, [candidate.primaryRecord.code, candidate.secondaryRecord.code]);

    this.saveState();
    return executionRecord;
  }

  public rollbackMerge(executionId: string): boolean {
    const execIndex = this.state.executionHistory.findIndex(e => e.id === executionId);
    if (execIndex === -1) return false;

    const exec = this.state.executionHistory[execIndex];
    exec.status = 'rolled_back';

    this.state.stats.rollbacksPerformed += 1;

    this.addAuditLog(
      'merge_rolled_back',
      `Rolled back merge operation ${exec.mergeCode}. Restored secondary record ${exec.secondaryCode} and un-linked ${exec.transferredItemsCount} transactions.`,
      [exec.primaryCode, exec.secondaryCode]
    );

    this.saveState();
    return true;
  }

  public addAuditLog(action: MergeAuditLog['action'], details: string, affectedRecords: string[]): void {
    const log: MergeAuditLog = {
      id: `LOG-MRG-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      action,
      executedBy: 'vtx_sysadmin',
      details,
      affectedRecords
    };
    this.state.auditLogs = [log, ...this.state.auditLogs.slice(0, 49)];
    this.saveState();
  }

  public markVgf03Completed(): void {
    this.state.isVgf03Completed = true;
    this.addAuditLog('merge_executed', 'VGF-03 Merge Engine officially marked as COMPLETED.', ['VGF-03']);
    this.saveState();
  }

  public resetState(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
  }
}

export const mergeEngineService = new MergeEngineService();
