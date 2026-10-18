import { AuditLog } from '../types';

export type MigrationSourceType = 
  | 'excel'
  | 'csv'
  | 'sql_server'
  | 'mysql'
  | 'postgresql'
  | 'sqlite'
  | 'sap_erp'
  | 'oracle_netsuite'
  | 'quickbooks'
  | 'odoo'
  | 'other_erp';

export type MigrationEntityDomain = 
  | 'companies'
  | 'branches'
  | 'customers'
  | 'suppliers'
  | 'items'
  | 'categories'
  | 'warehouses'
  | 'treasuries'
  | 'banks'
  | 'chart_of_accounts'
  | 'employees'
  | 'assets'
  | 'opening_balances'
  | 'tax_codes'
  | 'currencies';

export interface FieldMappingRule {
  targetField: string;
  targetLabel: string;
  isRequired: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'currency';
  sourceColumn: string;
  defaultValue?: string;
  transformRule?: 'none' | 'uppercase' | 'lowercase' | 'trim' | 'parse_number' | 'format_date';
  validationStatus: 'valid' | 'missing_required' | 'type_mismatch' | 'unmapped';
}

export interface EntityDomainMapping {
  domain: MigrationEntityDomain;
  domainLabel: string;
  targetModule: string;
  selected: boolean;
  sourceTableName: string;
  totalRecordsDetected: number;
  mappings: FieldMappingRule[];
}

export interface ValidationErrorItem {
  id: string;
  domain: MigrationEntityDomain;
  recordIndex: number;
  field: string;
  errorType: 
    | 'missing_field' 
    | 'duplicate_record' 
    | 'invalid_date' 
    | 'invalid_number' 
    | 'missing_reference' 
    | 'broken_relationship' 
    | 'inactive_record' 
    | 'invalid_currency';
  severity: 'critical' | 'warning';
  rawValue: string;
  suggestedFix: string;
  isFixed: boolean;
  fixedValue?: string;
}

export interface MigrationExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  tableName: string;
  message: string;
}

export interface MigrationReconciliationItem {
  domain: MigrationEntityDomain;
  label: string;
  sourceCount: number;
  targetCount: number;
  varianceCount: number;
  sourceBalance?: number;
  targetBalance?: number;
  varianceBalance?: number;
  status: 'matched' | 'discrepancy' | 'pending';
}

export interface MigrationTemplate {
  id: string;
  name: string;
  sourceSystem: MigrationSourceType;
  description: string;
  createdAt: string;
  entityMappings: EntityDomainMapping[];
}

export interface MigrationHistoryRecord {
  id: string;
  migrationCode: string;
  sourceSystem: MigrationSourceType;
  executedAt: string;
  executedBy: string;
  totalEntities: number;
  importedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  status: 'completed' | 'completed_with_warnings' | 'failed' | 'rolled_back';
  durationSeconds: number;
}

export interface MigrationConfigState {
  currentStep: number;
  sourceSystem: MigrationSourceType;
  fileInfo?: {
    fileName: string;
    fileSizeMb: number;
    sheetCount: number;
    uploadTimestamp: string;
  };
  dbConnection?: {
    host: string;
    port: number;
    databaseName: string;
    username: string;
    sslMode: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'testing';
  };
  entityMappings: EntityDomainMapping[];
  validationErrors: ValidationErrorItem[];
  executionMode: 'preview' | 'simulation' | 'real' | 'background';
  executionProgress: {
    isRunning: boolean;
    isPaused: boolean;
    isCompleted: boolean;
    isRolledBack: boolean;
    currentDomainIndex: number;
    currentDomainName: string;
    percentComplete: number;
    importedRecords: number;
    skippedRecords: number;
    failedRecords: number;
    elapsedSeconds: number;
  };
  reconciliationItems: MigrationReconciliationItem[];
  savedTemplates: MigrationTemplate[];
  history: MigrationHistoryRecord[];
  logs: MigrationExecutionLog[];
  isVgf02Completed: boolean;
}

const STORAGE_KEY = 'VERTEX_VGF02_MIGRATION_CENTER';

export const DEFAULT_ENTITY_DOMAINS: EntityDomainMapping[] = [
  {
    domain: 'companies',
    domainLabel: 'Companies & Entities',
    targetModule: 'MOD-GL (General Ledger)',
    selected: true,
    sourceTableName: 'tbl_companies_import',
    totalRecordsDetected: 3,
    mappings: [
      { targetField: 'code', targetLabel: 'Company Code', isRequired: true, dataType: 'string', sourceColumn: 'COMP_CODE', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'name', targetLabel: 'Legal Company Name', isRequired: true, dataType: 'string', sourceColumn: 'COMPANY_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'taxId', targetLabel: 'Tax Registration ID', isRequired: true, dataType: 'string', sourceColumn: 'TAX_NO', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'currency', targetLabel: 'Functional Currency', isRequired: true, dataType: 'currency', sourceColumn: 'CURRENCY_ISO', transformRule: 'uppercase', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'branches',
    domainLabel: 'Branches & Facilities',
    targetModule: 'MOD-GL (General Ledger)',
    selected: true,
    sourceTableName: 'tbl_branches_import',
    totalRecordsDetected: 5,
    mappings: [
      { targetField: 'branchCode', targetLabel: 'Branch Code', isRequired: true, dataType: 'string', sourceColumn: 'BRANCH_ID', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'branchName', targetLabel: 'Branch Name', isRequired: true, dataType: 'string', sourceColumn: 'BRANCH_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'city', targetLabel: 'City Location', isRequired: false, dataType: 'string', sourceColumn: 'CITY_NAME', transformRule: 'trim', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'customers',
    domainLabel: 'Customers & Accounts Receivable',
    targetModule: 'MOD-AR & MOD-CRM',
    selected: true,
    sourceTableName: 'tbl_customers_master',
    totalRecordsDetected: 1240,
    mappings: [
      { targetField: 'custCode', targetLabel: 'Customer Code', isRequired: true, dataType: 'string', sourceColumn: 'CUST_ID', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'custName', targetLabel: 'Customer Full Name', isRequired: true, dataType: 'string', sourceColumn: 'CUSTOMER_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'taxNumber', targetLabel: 'VAT / Tax Registration', isRequired: false, dataType: 'string', sourceColumn: 'VAT_NUMBER', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'creditLimit', targetLabel: 'Credit Limit Amount', isRequired: false, dataType: 'number', sourceColumn: 'CREDIT_LIMIT', transformRule: 'parse_number', validationStatus: 'valid' },
      { targetField: 'email', targetLabel: 'Billing Email', isRequired: false, dataType: 'string', sourceColumn: 'EMAIL_ADDR', transformRule: 'lowercase', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'suppliers',
    domainLabel: 'Suppliers & Vendors (AP)',
    targetModule: 'MOD-AP (Accounts Payable)',
    selected: true,
    sourceTableName: 'tbl_vendors_master',
    totalRecordsDetected: 480,
    mappings: [
      { targetField: 'vendorCode', targetLabel: 'Vendor Code', isRequired: true, dataType: 'string', sourceColumn: 'VENDOR_NO', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'vendorName', targetLabel: 'Vendor Name', isRequired: true, dataType: 'string', sourceColumn: 'VENDOR_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'taxId', targetLabel: 'Tax ID / EIN', isRequired: true, dataType: 'string', sourceColumn: 'TAX_REG_ID', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'paymentTerms', targetLabel: 'Payment Terms Code', isRequired: false, dataType: 'string', sourceColumn: 'TERMS_CODE', transformRule: 'uppercase', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'items',
    domainLabel: 'Items & Inventory Stock',
    targetModule: 'MOD-INV (Inventory)',
    selected: true,
    sourceTableName: 'tbl_items_master',
    totalRecordsDetected: 3500,
    mappings: [
      { targetField: 'itemCode', targetLabel: 'Item SKU / Code', isRequired: true, dataType: 'string', sourceColumn: 'SKU_NO', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'itemName', targetLabel: 'Item Description', isRequired: true, dataType: 'string', sourceColumn: 'ITEM_DESC', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'categoryCode', targetLabel: 'Category Code', isRequired: true, dataType: 'string', sourceColumn: 'CAT_CODE', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'unitPrice', targetLabel: 'Standard Selling Price', isRequired: true, dataType: 'number', sourceColumn: 'SELL_PRICE', transformRule: 'parse_number', validationStatus: 'valid' },
      { targetField: 'costPrice', targetLabel: 'Standard Cost Price', isRequired: true, dataType: 'number', sourceColumn: 'COST_PRICE', transformRule: 'parse_number', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'categories',
    domainLabel: 'Item & Account Categories',
    targetModule: 'MOD-INV & MOD-GL',
    selected: true,
    sourceTableName: 'tbl_categories',
    totalRecordsDetected: 85,
    mappings: [
      { targetField: 'catCode', targetLabel: 'Category Code', isRequired: true, dataType: 'string', sourceColumn: 'CATEGORY_ID', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'catName', targetLabel: 'Category Name', isRequired: true, dataType: 'string', sourceColumn: 'CATEGORY_NAME', transformRule: 'trim', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'warehouses',
    domainLabel: 'Warehouses & Locations',
    targetModule: 'MOD-INV (Inventory)',
    selected: true,
    sourceTableName: 'tbl_warehouses',
    totalRecordsDetected: 8,
    mappings: [
      { targetField: 'whCode', targetLabel: 'Warehouse Code', isRequired: true, dataType: 'string', sourceColumn: 'WH_CODE', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'whName', targetLabel: 'Warehouse Name', isRequired: true, dataType: 'string', sourceColumn: 'WH_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'branchCode', targetLabel: 'Assigned Branch Code', isRequired: true, dataType: 'string', sourceColumn: 'BRANCH_CODE', transformRule: 'uppercase', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'treasuries',
    domainLabel: 'Treasuries & Cash Boxes',
    targetModule: 'MOD-TR (Treasury)',
    selected: true,
    sourceTableName: 'tbl_cash_boxes',
    totalRecordsDetected: 6,
    mappings: [
      { targetField: 'trCode', targetLabel: 'Treasury Code', isRequired: true, dataType: 'string', sourceColumn: 'CASH_BOX_ID', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'trName', targetLabel: 'Treasury Name', isRequired: true, dataType: 'string', sourceColumn: 'BOX_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'currency', targetLabel: 'Currency Code', isRequired: true, dataType: 'currency', sourceColumn: 'CURRENCY', transformRule: 'uppercase', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'banks',
    domainLabel: 'Bank Accounts & Liquidity',
    targetModule: 'MOD-TR (Treasury)',
    selected: true,
    sourceTableName: 'tbl_bank_accounts',
    totalRecordsDetected: 12,
    mappings: [
      { targetField: 'bankCode', targetLabel: 'Bank Code', isRequired: true, dataType: 'string', sourceColumn: 'BANK_CODE', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'bankName', targetLabel: 'Bank Name', isRequired: true, dataType: 'string', sourceColumn: 'BANK_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'accountNumber', targetLabel: 'Account Number', isRequired: true, dataType: 'string', sourceColumn: 'ACC_NO', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'iban', targetLabel: 'IBAN Code', isRequired: false, dataType: 'string', sourceColumn: 'IBAN_CODE', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'swift', targetLabel: 'SWIFT / BIC Code', isRequired: false, dataType: 'string', sourceColumn: 'SWIFT_CODE', transformRule: 'uppercase', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'chart_of_accounts',
    domainLabel: 'Chart of Accounts (COA)',
    targetModule: 'MOD-GL (General Ledger)',
    selected: true,
    sourceTableName: 'tbl_chart_of_accounts',
    totalRecordsDetected: 240,
    mappings: [
      { targetField: 'accCode', targetLabel: 'Account Code', isRequired: true, dataType: 'string', sourceColumn: 'ACC_NUMBER', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'accName', targetLabel: 'Account Title', isRequired: true, dataType: 'string', sourceColumn: 'ACC_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'accType', targetLabel: 'Account Type (Asset/Liab/Eq/Rev/Exp)', isRequired: true, dataType: 'enum', sourceColumn: 'ACC_TYPE', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'parentCode', targetLabel: 'Parent Account Code', isRequired: false, dataType: 'string', sourceColumn: 'PARENT_ACC', transformRule: 'trim', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'employees',
    domainLabel: 'Employees & Payroll Roster',
    targetModule: 'MOD-HR (Human Resources)',
    selected: true,
    sourceTableName: 'tbl_employees_master',
    totalRecordsDetected: 210,
    mappings: [
      { targetField: 'empCode', targetLabel: 'Employee Code / ID', isRequired: true, dataType: 'string', sourceColumn: 'EMP_ID', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'fullName', targetLabel: 'Full Name', isRequired: true, dataType: 'string', sourceColumn: 'FULL_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'department', targetLabel: 'Department Name', isRequired: true, dataType: 'string', sourceColumn: 'DEPT_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'basicSalary', targetLabel: 'Basic Monthly Salary', isRequired: true, dataType: 'number', sourceColumn: 'SALARY_AMT', transformRule: 'parse_number', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'assets',
    domainLabel: 'Fixed Assets Register',
    targetModule: 'MOD-FA (Fixed Assets)',
    selected: true,
    sourceTableName: 'tbl_fixed_assets',
    totalRecordsDetected: 140,
    mappings: [
      { targetField: 'assetCode', targetLabel: 'Asset Tag Code', isRequired: true, dataType: 'string', sourceColumn: 'ASSET_TAG', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'assetName', targetLabel: 'Asset Description', isRequired: true, dataType: 'string', sourceColumn: 'ASSET_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'purchaseCost', targetLabel: 'Original Purchase Cost', isRequired: true, dataType: 'number', sourceColumn: 'ACQ_COST', transformRule: 'parse_number', validationStatus: 'valid' },
      { targetField: 'accumDepr', targetLabel: 'Accumulated Depreciation', isRequired: true, dataType: 'number', sourceColumn: 'ACCUM_DEPR', transformRule: 'parse_number', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'opening_balances',
    domainLabel: 'Opening Balances Ledger',
    targetModule: 'MOD-GL & MOD-TR',
    selected: true,
    sourceTableName: 'tbl_opening_trial_balance',
    totalRecordsDetected: 240,
    mappings: [
      { targetField: 'accCode', targetLabel: 'Account Code', isRequired: true, dataType: 'string', sourceColumn: 'ACCOUNT_ID', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'debitAmount', targetLabel: 'Debit Amount', isRequired: true, dataType: 'number', sourceColumn: 'DEBIT_BAL', transformRule: 'parse_number', validationStatus: 'valid' },
      { targetField: 'creditAmount', targetLabel: 'Credit Amount', isRequired: true, dataType: 'number', sourceColumn: 'CREDIT_BAL', transformRule: 'parse_number', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'tax_codes',
    domainLabel: 'Tax Codes & VAT Rates',
    targetModule: 'MOD-GL & MOD-AR',
    selected: true,
    sourceTableName: 'tbl_tax_codes',
    totalRecordsDetected: 12,
    mappings: [
      { targetField: 'taxCode', targetLabel: 'Tax Code ID', isRequired: true, dataType: 'string', sourceColumn: 'TAX_CODE', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'taxRate', targetLabel: 'Tax Rate Percentage', isRequired: true, dataType: 'number', sourceColumn: 'TAX_RATE_PCT', transformRule: 'parse_number', validationStatus: 'valid' },
      { targetField: 'taxName', targetLabel: 'Tax Description', isRequired: true, dataType: 'string', sourceColumn: 'TAX_LABEL', transformRule: 'trim', validationStatus: 'valid' }
    ]
  },
  {
    domain: 'currencies',
    domainLabel: 'Currencies & Exchange Rates',
    targetModule: 'MOD-GL & MOD-TR',
    selected: true,
    sourceTableName: 'tbl_currency_rates',
    totalRecordsDetected: 18,
    mappings: [
      { targetField: 'currCode', targetLabel: 'Currency ISO Code', isRequired: true, dataType: 'currency', sourceColumn: 'CURR_ISO', transformRule: 'uppercase', validationStatus: 'valid' },
      { targetField: 'currName', targetLabel: 'Currency Name', isRequired: true, dataType: 'string', sourceColumn: 'CURR_NAME', transformRule: 'trim', validationStatus: 'valid' },
      { targetField: 'exchangeRate', targetLabel: 'Base Exchange Rate', isRequired: true, dataType: 'number', sourceColumn: 'EXCH_RATE', transformRule: 'parse_number', validationStatus: 'valid' }
    ]
  }
];

export const MOCK_VALIDATION_ERRORS: ValidationErrorItem[] = [
  {
    id: 'ERR-101',
    domain: 'customers',
    recordIndex: 42,
    field: 'taxNumber',
    errorType: 'duplicate_record',
    severity: 'warning',
    rawValue: 'TAX-9981-DUP',
    suggestedFix: 'Append unique branch suffix TAX-9981-DUP-01 or merge duplicate record.',
    isFixed: false
  },
  {
    id: 'ERR-102',
    domain: 'items',
    recordIndex: 118,
    field: 'unitPrice',
    errorType: 'invalid_number',
    severity: 'critical',
    rawValue: '-45.00',
    suggestedFix: 'Unit price cannot be negative. Override with standard list price 45.00.',
    isFixed: false
  },
  {
    id: 'ERR-103',
    domain: 'warehouses',
    recordIndex: 4,
    field: 'branchCode',
    errorType: 'missing_reference',
    severity: 'critical',
    rawValue: 'BR-UNKNOWN-99',
    suggestedFix: 'Branch code BR-UNKNOWN-99 does not exist in Phase 02 org setup. Remap to HQ-NY.',
    isFixed: false
  },
  {
    id: 'ERR-104',
    domain: 'employees',
    recordIndex: 88,
    field: 'basicSalary',
    errorType: 'missing_field',
    severity: 'critical',
    rawValue: 'NULL',
    suggestedFix: 'Basic salary field empty. Insert default minimum grade salary $3,500.00.',
    isFixed: false
  },
  {
    id: 'ERR-105',
    domain: 'currencies',
    recordIndex: 14,
    field: 'currCode',
    errorType: 'invalid_currency',
    severity: 'warning',
    rawValue: 'USDOLLARS',
    suggestedFix: 'Non-standard ISO currency string. Auto-convert to standard "USD".',
    isFixed: false
  }
];

class MigrationCenterService {
  private config: MigrationConfigState;

  constructor() {
    this.config = this.loadInitialConfig();
  }

  private loadInitialConfig(): MigrationConfigState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          entityMappings: parsed.entityMappings || DEFAULT_ENTITY_DOMAINS,
          validationErrors: parsed.validationErrors || MOCK_VALIDATION_ERRORS,
          reconciliationItems: parsed.reconciliationItems || this.generateDefaultReconciliation()
        };
      }
    } catch (e) {
      console.warn('Failed to parse Migration Center storage, using defaults:', e);
    }

    return {
      currentStep: 1,
      sourceSystem: 'excel',
      fileInfo: {
        fileName: 'Vertex_Enterprise_Migration_Package_2026.xlsx',
        fileSizeMb: 14.8,
        sheetCount: 15,
        uploadTimestamp: new Date().toISOString()
      },
      dbConnection: {
        host: 'migration-db.internal.vertex.io',
        port: 5432,
        databaseName: 'legacy_erp_db',
        username: 'migration_readonly_user',
        sslMode: true,
        connectionStatus: 'connected'
      },
      entityMappings: DEFAULT_ENTITY_DOMAINS,
      validationErrors: MOCK_VALIDATION_ERRORS,
      executionMode: 'simulation',
      executionProgress: {
        isRunning: false,
        isPaused: false,
        isCompleted: false,
        isRolledBack: false,
        currentDomainIndex: 0,
        currentDomainName: 'Companies & Entities',
        percentComplete: 0,
        importedRecords: 0,
        skippedRecords: 0,
        failedRecords: 0,
        elapsedSeconds: 0
      },
      reconciliationItems: this.generateDefaultReconciliation(),
      savedTemplates: [
        {
          id: 'TPL-SAP-01',
          name: 'SAP S/4HANA Standard ERP Migration Template',
          sourceSystem: 'sap_erp',
          description: 'Includes COA, Item Master, Vendor/Customer AP/AR, and Asset tables.',
          createdAt: '2026-08-01',
          entityMappings: DEFAULT_ENTITY_DOMAINS
        },
        {
          id: 'TPL-QB-02',
          name: 'QuickBooks Enterprise Multi-Currency Import Template',
          sourceSystem: 'quickbooks',
          description: 'Pre-configured column mappings for QuickBooks Desktop / Online files.',
          createdAt: '2026-08-03',
          entityMappings: DEFAULT_ENTITY_DOMAINS
        }
      ],
      history: [
        {
          id: 'MIG-LOG-2026-01',
          migrationCode: 'MIG-2026-0801',
          sourceSystem: 'excel',
          executedAt: new Date(Date.now() - 1000 * 3600 * 24 * 2).toISOString(),
          executedBy: 'vtx_sysadmin',
          totalEntities: 15,
          importedRecords: 6625,
          skippedRecords: 12,
          failedRecords: 0,
          status: 'completed',
          durationSeconds: 145
        }
      ],
      logs: [
        {
          id: 'LOG-001',
          timestamp: new Date().toISOString(),
          level: 'info',
          tableName: 'System Core',
          message: 'VGF-02 Migration Center service initialized with 15 entity mapping schemas.'
        }
      ],
      isVgf02Completed: true
    };
  }

  private generateDefaultReconciliation(): MigrationReconciliationItem[] {
    return [
      { domain: 'companies', label: 'Companies & Entities', sourceCount: 3, targetCount: 3, varianceCount: 0, status: 'matched' },
      { domain: 'branches', label: 'Branches & Facilities', sourceCount: 5, targetCount: 5, varianceCount: 0, status: 'matched' },
      { domain: 'customers', label: 'Customers (AR)', sourceCount: 1240, targetCount: 1240, varianceCount: 0, sourceBalance: 4250000.00, targetBalance: 4250000.00, varianceBalance: 0, status: 'matched' },
      { domain: 'suppliers', label: 'Suppliers / Vendors (AP)', sourceCount: 480, targetCount: 480, varianceCount: 0, sourceBalance: 2180000.00, targetBalance: 2180000.00, varianceBalance: 0, status: 'matched' },
      { domain: 'items', label: 'Items & Stock SKU Register', sourceCount: 3500, targetCount: 3500, varianceCount: 0, status: 'matched' },
      { domain: 'warehouses', label: 'Warehouses & Depots', sourceCount: 8, targetCount: 8, varianceCount: 0, status: 'matched' },
      { domain: 'chart_of_accounts', label: 'Chart of Accounts (COA)', sourceCount: 240, targetCount: 240, varianceCount: 0, status: 'matched' },
      { domain: 'opening_balances', label: 'General Ledger Opening Balance', sourceCount: 240, targetCount: 240, varianceCount: 0, sourceBalance: 18500000.00, targetBalance: 18500000.00, varianceBalance: 0, status: 'matched' },
      { domain: 'banks', label: 'Bank Liquidity & Accounts', sourceCount: 12, targetCount: 12, varianceCount: 0, sourceBalance: 6400000.00, targetBalance: 6400000.00, varianceBalance: 0, status: 'matched' }
    ];
  }

  public getConfig(): MigrationConfigState {
    return this.config;
  }

  public saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save Migration Center state:', e);
    }
  }

  public updateConfig(updates: Partial<MigrationConfigState>): MigrationConfigState {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    return this.config;
  }

  public fixValidationError(errorId: string, customValue?: string): void {
    this.config.validationErrors = this.config.validationErrors.map(err => {
      if (err.id === errorId) {
        return {
          ...err,
          isFixed: true,
          fixedValue: customValue || err.suggestedFix
        };
      }
      return err;
    });

    this.addLog('info', 'Validation Engine', `User corrected validation error ${errorId}. Fixed value applied.`);
    this.saveConfig();
  }

  public addLog(level: 'info' | 'success' | 'warning' | 'error', tableName: string, message: string): void {
    const log: MigrationExecutionLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      level,
      tableName,
      message
    };
    this.config.logs = [log, ...this.config.logs.slice(0, 99)];
  }

  public resetConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.config = this.loadInitialConfig();
  }

  public markVgf02Completed(): void {
    this.config.isVgf02Completed = true;
    this.addLog('success', 'Migration Center', 'VGF-02 Migration Center officially marked as COMPLETED.');
    this.saveConfig();
  }
}

export const migrationCenterService = new MigrationCenterService();
