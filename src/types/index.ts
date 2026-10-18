export type PlatformSection = 'main' | 'gold' | 'modules' | 'customers' | 'vendors' | 'purchases' | 'treasuries' | 'accounts' | 'warehouses' | 'sellers' | 'branches' | 'engines' | 'devtools' | 'deployment' | 'desktop_vdp' | 'cloud_vdp' | 'hybrid_vdp' | 'installer_vdp' | 'portable_vdp' | 'backup_vdp' | 'update_vdp' | 'config_vdp' | 'license_vdp' | 'settings';

export type SettingsCategoryId = 
  | 'wizard'
  | 'users_permissions'
  | 'master_data'
  | 'system_settings'
  | 'branch_settings'
  | 'sales_purchasing'
  | 'warehouses_inventory'
  | 'finance_accounts'
  | 'printing_invoices'
  | 'security_audit'
  | 'reports_settings'
  | 'system_admin';

export type MasterDataSubTab = 
  | 'customers'
  | 'suppliers'
  | 'products'
  | 'warehouses'
  | 'treasuries'
  | 'sales_reps'
  | 'regions'
  | 'item_tree';

export interface SettingsCategoryItem {
  id: SettingsCategoryId;
  order: number;
  title: string;
  subtitle: string;
  iconName: string;
  isWizard?: boolean;
  subItems?: { id: string; title: string; iconName: string }[];
}


export type GoldFeatureId = 
  | 'VGF-01'
  | 'VGF-02'
  | 'VGF-03'
  | 'VGF-04'
  | 'VGF-05'
  | 'VGF-06'
  | 'VGF-07'
  | 'VGF-08'
  | 'VGF-09'
  | 'VGF-10';

export type ERPModuleId = 
  | 'MOD-GL'
  | 'MOD-AR'
  | 'MOD-AP'
  | 'MOD-INV'
  | 'MOD-HR'
  | 'MOD-FA'
  | 'MOD-CRM'
  | 'MOD-MFG'
  | 'MOD-SCM'
  | 'MOD-PM'
  | 'MOD-POS'
  | 'MOD-QM'
  | 'MOD-TR'
  | 'MOD-FLEET'
  | 'MOD-BI';

export type EngineId = 
  | 'ENG-AUDIT'
  | 'ENG-NOTIF'
  | 'ENG-WORKFLOW'
  | 'ENG-PERM'
  | 'ENG-SEARCH'
  | 'ENG-VIS'
  | 'ENG-BIZDAY'
  | 'ENG-MERGE'
  | 'ENG-BACKUP'
  | 'ENG-IO'
  | 'ENG-REPORT'
  | 'ENG-DASH'
  | 'ENG-LICENSE'
  | 'ENG-UPDATE'
  | 'ENG-PLUGIN';

export type DevToolId = 
  | 'DEV-DIAG'
  | 'DEV-PERF'
  | 'DEV-DB'
  | 'DEV-LOGS'
  | 'DEV-ENV'
  | 'DEV-API'
  | 'DEV-MAINT'
  | 'DEV-CONSOLE';

export interface GoldFeatureMeta {
  id: GoldFeatureId;
  code: string;
  name: string;
  description: string;
  status: 'completed' | 'in_progress' | 'planned';
  category: string;
  version: string;
}

export interface ERPModuleMeta {
  id: ERPModuleId;
  code: string;
  name: string;
  category: string;
  status: 'approved';
  recordCount: number;
  description: string;
  iconName: string;
}

export interface SystemEngineMeta {
  id: EngineId;
  name: string;
  description: string;
  status: 'active' | 'standby' | 'initializing';
  latencyMs: number;
  subsystems: string[];
}

export interface BranchItem {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  city: string;
  isMain: boolean;
  status?: 'نشط' | 'غير نشط';
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  phones?: string[];
  address?: string;
  showOnMainScreen?: boolean;
}

export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  branchId: string;
}

export interface TreasuryItem {
  id: string;
  code: string;
  name: string;
  branchId: string;
  currency: string;
}

export interface BankAccountItem {
  id: string;
  code: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swift: string;
  currency: string;
  companyName: string;
  branchId?: string;
  branchName?: string;
  openingBalance?: number;
  openingBalanceDate?: string;
}

export interface SecurityPolicyConfig {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  maxFailedLogins: number;
  twoFactorMode: 'disabled' | 'totp_authenticator' | 'sms_otp' | 'future_ready_hardware';
}

export interface SetupWizardData {
  // Phase 01: Welcome & Company Information
  companyName: string;
  commercialName: string;
  businessActivity: string;
  legalEntity: string;
  taxRegistrationNumber: string;
  commercialRegistrationNumber: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;

  // Phase 02: Organization Structure
  branches: BranchItem[];
  warehouses: WarehouseItem[];
  treasuries: TreasuryItem[];
  bankAccounts: BankAccountItem[];

  // Phase 03: Financial & System Settings
  fiscalYear: string;
  accountingPeriod: 'monthly' | 'quarterly' | '13_period';
  baseCurrency: string;
  exchangeRatePolicy: 'manual' | 'daily_central_bank' | 'fixed_period';
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timeFormat: '12h' | '24h';
  language: string;
  timeZone: string;
  numberFormat: '1,234,567.89' | '1.234.567,89';
  taxCalculationMethod: 'inclusive' | 'exclusive' | 'compound' | 'exempt';
  costingMethod: 'fifo' | 'lifo' | 'wac' | 'standard_cost';
  defaultInventoryPolicy: 'negative_forbidden' | 'negative_allowed' | 'batch_mandatory';

  // Phase 04: Security & Administration
  superAdminName: string;
  adminUser: string;
  adminEmail: string;
  adminPassword: string;
  securityPolicy: SecurityPolicyConfig;
  defaultRoles: string[];
  ipWhitelist: string;
  licenseKey: string;

  // Phase 05: Data Initialization
  startMode: 'create_new' | 'import_existing';
  migrationSource?: string;
  chartOfAccountsTemplate: 'standard_corporate' | 'retail_commerce' | 'manufacturing_cost' | 'services_consulting';
  accountCodeFormat: '4_digit' | '6_digit_segmented' | '8_digit_hierarchical';
  activeModuleIds: ERPModuleId[];
  seedDemoData: boolean;

  // Phase 06: Validation & Completion
  completedAt?: string;
  isCompleted: boolean;
  version: string;
}

export interface PreFlightCheckResult {
  id: string;
  category: 'database' | 'memory' | 'license' | 'engine' | 'security';
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed' | 'running';
  message: string;
  durationMs: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  sourceEngine: string;
}
