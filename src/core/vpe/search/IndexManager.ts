import { IndexRecord, SearchResultType } from './SearchTypes';

export class IndexManager {
  private static instance: IndexManager;
  private records = new Map<string, IndexRecord>();
  private lastRebuildTime: string = new Date().toISOString();
  private isIndexing: boolean = false;

  private constructor() {
    this.seedDefaultIndex();
  }

  public static getInstance(): IndexManager {
    if (!IndexManager.instance) {
      IndexManager.instance = new IndexManager();
    }
    return IndexManager.instance;
  }

  public getAllRecords(): IndexRecord[] {
    return Array.from(this.records.values());
  }

  public getRecordById(id: string): IndexRecord | undefined {
    return this.records.get(id);
  }

  public addOrUpdateRecord(record: IndexRecord): void {
    this.records.set(record.id, record);
  }

  public deleteRecord(id: string): boolean {
    return this.records.delete(id);
  }

  public async rebuildIndex(): Promise<{ recordCount: number; durationMs: number }> {
    this.isIndexing = true;
    const start = performance.now();
    this.records.clear();
    this.seedDefaultIndex();
    this.lastRebuildTime = new Date().toISOString();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    this.isIndexing = false;
    return { recordCount: this.records.size, durationMs };
  }

  public getIndexStats() {
    const records = this.getAllRecords();
    const countByType: Record<string, number> = {};
    const countByModule: Record<string, number> = {};
    const countByBranch: Record<string, number> = {};

    records.forEach(r => {
      countByType[r.type] = (countByType[r.type] || 0) + 1;
      countByModule[r.module] = (countByModule[r.module] || 0) + 1;
      countByBranch[r.branch] = (countByBranch[r.branch] || 0) + 1;
    });

    return {
      totalRecords: records.length,
      lastRebuildTime: this.lastRebuildTime,
      isIndexing: this.isIndexing,
      countByType,
      countByModule,
      countByBranch
    };
  }

  private seedDefaultIndex(): void {
    const dateNow = new Date().toISOString().split('T')[0];

    const defaultRecords: IndexRecord[] = [
      // CUSTOMERS
      {
        id: 'CUST-1001',
        type: 'customer',
        title: 'Acme International Corporation',
        subtitle: 'Enterprise Tier Customer • Active Account',
        code: 'CUST-1001',
        reference: 'REF-ACME-88',
        phone: '+1 (555) 019-2831',
        email: 'billing@acme-corp.com',
        taxNumber: 'TX-99201-881',
        description: 'Key enterprise client in New York branch with $500,000 credit limit and 30-day payment terms.',
        keywords: ['acme', 'international', 'enterprise', 'vip', 'wholesale', 'new york'],
        tags: ['VIP', 'Enterprise', 'Credit Tier A'],
        module: 'Accounts Receivable',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Sales',
        status: 'Active',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Sales Manager', 'Financial Controller'],
        actionUrl: '/ar/customers/CUST-1001'
      },
      {
        id: 'CUST-1002',
        type: 'customer',
        title: 'Global Dynamics Technologies LLC',
        subtitle: 'Commercial Partner • Active Account',
        code: 'CUST-1002',
        reference: 'REF-GDT-44',
        phone: '+44 20 7946 0912',
        email: 'accounts@globaldynamics.co.uk',
        taxNumber: 'GB-339102-01',
        description: 'London hub customer specializing in software hardware procurement.',
        keywords: ['global', 'dynamics', 'uk', 'london', 'commercial'],
        tags: ['UK Partner', 'Tech Hardware'],
        module: 'Accounts Receivable',
        company: 'Vertex Global Enterprises Corp',
        branch: 'BR-LDN',
        department: 'Sales',
        status: 'Active',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Sales Manager'],
        actionUrl: '/ar/customers/CUST-1002'
      },

      // SUPPLIERS
      {
        id: 'SUP-2001',
        type: 'supplier',
        title: 'Intel Electronics & Components Ltd',
        subtitle: 'Primary Semiconductor Supplier',
        code: 'SUP-2001',
        reference: 'PO-REF-INTEL-01',
        phone: '+1 (800) 628-8686',
        email: 'orders@intel-supply.com',
        taxNumber: 'TX-10029-INTEL',
        description: 'Strategic supplier of processors, motherboard chipsets, and industrial memory units.',
        keywords: ['intel', 'semiconductor', 'processors', 'chips', 'hardware', 'supplier'],
        tags: ['Key Supplier', 'Tier 1 Vendor'],
        module: 'Accounts Payable',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Procurement',
        status: 'Active',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Inventory Manager', 'Financial Controller'],
        actionUrl: '/ap/suppliers/SUP-2001'
      },
      {
        id: 'SUP-2002',
        type: 'supplier',
        title: 'Middle East Logistics Express',
        subtitle: 'Freight & Shipping Provider',
        code: 'SUP-2002',
        reference: 'VENDOR-DXB-99',
        phone: '+971 4 300 4000',
        email: 'freight@me-logistics.ae',
        taxNumber: 'AE-7718293-10',
        description: 'Dubai free zone logistics vendor providing air freight and customs clearance.',
        keywords: ['dubai', 'logistics', 'freight', 'shipping', 'customs', 'express'],
        tags: ['Logistics', 'Air Freight'],
        module: 'Accounts Payable',
        company: 'Vertex Global Enterprises Corp',
        branch: 'BR-DXB',
        department: 'Supply Chain',
        status: 'Active',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Inventory Manager'],
        actionUrl: '/ap/suppliers/SUP-2002'
      },

      // ITEMS / SKUS
      {
        id: 'ITEM-5001',
        type: 'item',
        title: 'Vertex Enterprise Server Blade R750',
        subtitle: 'Category: Hardware • Stock: 142 Units',
        code: 'ITEM-5001',
        reference: 'SKU-R750-BLADE',
        barcode: '8801928374612',
        qrCode: 'QR-VTX-R750-SER',
        serialNumber: 'SN-2026-R750-8801',
        description: 'Dual-socket 2U rack server with 128GB ECC RAM and dual 10GbE network interfaces.',
        keywords: ['server', 'blade', 'dell', 'r750', 'rack', 'hardware', 'vertex'],
        tags: ['Hardware', 'High Value', 'Serials Required'],
        module: 'Inventory & Warehouse',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Warehouse Operations',
        status: 'In Stock',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Inventory Manager'],
        actionUrl: '/inventory/items/ITEM-5001'
      },
      {
        id: 'ITEM-5002',
        type: 'item',
        title: 'POS High-Speed Thermal Receipt Printer',
        subtitle: 'Category: POS Peripherals • Stock: 89 Units',
        code: 'ITEM-5002',
        reference: 'SKU-POS-PRINT-80',
        barcode: '7102938475610',
        qrCode: 'QR-POS-PRINT-80',
        serialNumber: 'SN-2026-POS-7712',
        description: '80mm USB & Ethernet auto-cutter thermal receipt printer for retail POS terminals.',
        keywords: ['pos', 'printer', 'thermal', 'receipt', 'retail', 'barcode'],
        tags: ['POS Hardware', 'Fast Moving'],
        module: 'Inventory & Warehouse',
        company: 'Vertex Global Enterprises Corp',
        branch: 'BR-LDN',
        department: 'Retail POS',
        status: 'In Stock',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Inventory Manager'],
        actionUrl: '/inventory/items/ITEM-5002'
      },

      // WAREHOUSES
      {
        id: 'WH-01',
        type: 'warehouse',
        title: 'Main Distribution Hub NY',
        subtitle: 'Branch: HQ-NY • Capacity: 10,000 m3',
        code: 'WH-MAIN-NY',
        reference: 'WH-LOC-NY-01',
        phone: '+1 (555) 019-9001',
        email: 'warehouse-ny@vertex-platform.internal',
        description: 'Primary automated distribution center with multi-bin storage and temperature controls.',
        keywords: ['warehouse', 'hub', 'new york', 'ny', 'distribution', 'main'],
        tags: ['Primary Depot', 'Automated Bins'],
        module: 'Inventory & Warehouse',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Logistics',
        status: 'Operational',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Inventory Manager'],
        actionUrl: '/warehouse/WH-01'
      },

      // ACCOUNTS (CHART OF ACCOUNTS)
      {
        id: 'ACC-1010',
        type: 'account',
        title: '1010 - Cash on Hand & Petty Cash',
        subtitle: 'Asset Account • Balance: $148,250.00',
        code: '1010-CASH',
        reference: 'GL-1010',
        description: 'Main petty cash and register vault holding account.',
        keywords: ['cash', 'petty cash', 'vault', 'asset', 'liquid'],
        tags: ['Asset', 'Current Asset'],
        module: 'General Ledger & Accounting',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Finance',
        status: 'Active',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Financial Controller'],
        actionUrl: '/gl/accounts/ACC-1010'
      },

      // INVOICES
      {
        id: 'INV-2026-001',
        type: 'invoice',
        title: 'Tax Sales Invoice #INV-2026-001',
        subtitle: 'Customer: Acme Corp • Amount: $24,500.00',
        code: 'INV-2026-001',
        reference: 'SO-8821-NY',
        description: 'Invoice for 10x Enterprise Server Blade R750 delivered to Acme Corp NY HQ.',
        keywords: ['invoice', 'sales invoice', 'acme', '24500', 'tax invoice'],
        tags: ['Sales Invoice', 'Posted'],
        module: 'Accounts Receivable',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Sales',
        status: 'Paid',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Sales Manager', 'Financial Controller'],
        actionUrl: '/ar/invoices/INV-2026-001'
      },

      // PAYMENTS
      {
        id: 'PAY-8801',
        type: 'payment',
        title: 'Customer Receipt #PAY-8801',
        subtitle: 'Received from: Acme Corp • Amount: $24,500.00',
        code: 'PAY-8801',
        reference: 'BANK-TR-9981',
        description: 'Direct wire transfer payment received via JPMorgan Chase USD account.',
        keywords: ['payment', 'receipt', 'wire transfer', 'jpmorgan', 'acme'],
        tags: ['Bank Transfer', 'Verified'],
        module: 'Treasury & Cash Management',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Treasury',
        status: 'Cleared',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Financial Controller'],
        actionUrl: '/treasury/payments/PAY-8801'
      },

      // BANKS & TREASURIES
      {
        id: 'BK-01',
        type: 'bank',
        title: 'JPMorgan Chase & Co. - USD Operating Account',
        subtitle: 'Account #: 10098827361 • SWIFT: CHASUS33',
        code: 'JPM-USD-01',
        reference: 'IBAN-US39JPMC10098827361',
        phone: '+1 (800) 935-9935',
        email: 'commercial@jpmorgan.com',
        description: 'Primary corporate operating USD bank account for North America operations.',
        keywords: ['jpmorgan', 'chase', 'bank', 'usd', 'operating', 'swift'],
        tags: ['Main Bank', 'USD'],
        module: 'Treasury & Cash Management',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Treasury',
        status: 'Active',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Financial Controller'],
        actionUrl: '/treasury/banks/BK-01'
      },

      // ASSETS
      {
        id: 'ASSET-901',
        type: 'asset',
        title: 'Datacenter Server Rack Enclosure 42U',
        subtitle: 'Fixed Asset • Net Book Value: $8,400.00',
        code: 'ASSET-901',
        reference: 'FA-TAG-42U-01',
        serialNumber: 'SN-RACK-42U-9901',
        description: 'Heavy duty server rack enclosure with integrated cooling and PDU power strips.',
        keywords: ['asset', 'datacenter', 'rack', '42u', 'fixed asset', 'depreciation'],
        tags: ['IT Asset', 'Active Depreciation'],
        module: 'Fixed Assets Management',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'IT Infrastructure',
        status: 'In Service',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'Financial Controller'],
        actionUrl: '/fixed-assets/ASSET-901'
      },

      // EMPLOYEES
      {
        id: 'EMP-101',
        type: 'employee',
        title: 'Sarah Jenkins - VP of Finance & Treasury',
        subtitle: 'Dept: Finance • Location: New York HQ',
        code: 'EMP-101',
        reference: 'HR-REF-101',
        phone: '+1 (555) 019-1101',
        email: 'sarah.jenkins@vertex-platform.internal',
        nationalId: 'SSN-XXX-XX-8821',
        description: 'Executive director of financial operations, treasury management, and audit compliance.',
        keywords: ['sarah', 'jenkins', 'finance', 'vp', 'employee', 'hr', 'treasury'],
        tags: ['Executive', 'Approver Level 3'],
        module: 'Human Resources & Payroll',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Finance',
        status: 'Active Employment',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator', 'HR Administrator'],
        actionUrl: '/hr/employees/EMP-101'
      },

      // USERS
      {
        id: 'USR-88',
        type: 'user',
        title: 'System Super Administrator (vtx_sysadmin)',
        subtitle: 'Role: Super Administrator • Full Platform Privilege',
        code: 'vtx_sysadmin',
        reference: 'USER-SYS-01',
        email: 'admin@vertex-platform.internal',
        description: 'Root platform super administrator account with unrestricted engine and data access.',
        keywords: ['admin', 'sysadmin', 'root', 'super administrator', 'user'],
        tags: ['Root Privilege', 'Super Admin'],
        module: 'Security & Auth',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'System Administration',
        status: 'Active',
        date: dateNow,
        createdBy: 'system',
        permissionsRequired: ['Super Administrator'],
        actionUrl: '/security/users/USR-88'
      },

      // DOCUMENTS & ATTACHMENTS
      {
        id: 'DOC-401',
        type: 'document',
        title: 'Annual Fiscal Audit & Financial Compliance Report 2026',
        subtitle: 'Format: PDF • Size: 4.8 MB • Version v2.1',
        code: 'DOC-401',
        reference: 'AUDIT-REP-2026',
        description: 'Comprehensive financial audit report compiled by KPMG for fiscal year ending 2026.',
        keywords: ['audit', 'financial report', 'compliance', 'pdf', 'document'],
        tags: ['Confidential', 'Audit Verified'],
        module: 'General Ledger & Accounting',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Audit & Compliance',
        status: 'Published',
        date: dateNow,
        createdBy: 'sarah.jenkins',
        permissionsRequired: ['Super Administrator', 'Financial Controller'],
        actionUrl: '/documents/DOC-401'
      },

      // AUDIT LOGS
      {
        id: 'AUD-9001',
        type: 'audit_log',
        title: 'Audit Event: VGF-01 First Run Setup Wizard Executed',
        subtitle: 'Timestamp: Today • User: vtx_sysadmin • IP: 127.0.0.1',
        code: 'AUD-9001',
        reference: 'HMAC-SHA256-HASH-882193',
        description: 'Cryptographically signed audit log entry for initial setup wizard boot sequence.',
        keywords: ['audit log', 'vgf-01', 'setup wizard', 'boot', 'hmac'],
        tags: ['Tamper-Proof', 'Security Event'],
        module: 'Audit & Compliance',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'System Audit',
        status: 'Verified',
        date: dateNow,
        createdBy: 'vtx_sysadmin',
        permissionsRequired: ['Super Administrator'],
        actionUrl: '/audit/AUD-9001'
      },

      // GOLD FEATURES
      {
        id: 'VGF-01-IDX',
        type: 'gold_feature',
        title: 'VGF-01 First Run Setup Wizard',
        subtitle: 'Gold Feature • Onboarding & Deployment',
        code: 'VGF-01',
        reference: 'GOLD-FEATURE-01',
        description: 'Guided enterprise boot sequence, schema initialization, chart of accounts seed, and engine policy setup.',
        keywords: ['vgf-01', 'setup wizard', 'first run', 'boot', 'gold feature', 'onboarding'],
        tags: ['Gold Feature', 'Completed'],
        module: 'Platform Core',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Platform Architecture',
        status: 'Active',
        date: dateNow,
        createdBy: 'system',
        permissionsRequired: ['Super Administrator'],
        actionUrl: '/gold/VGF-01'
      },
      {
        id: 'VGF-02-IDX',
        type: 'gold_feature',
        title: 'VGF-02 Migration Center',
        subtitle: 'Gold Feature • Data Import & Pipeline',
        code: 'VGF-02',
        reference: 'GOLD-FEATURE-02',
        description: 'Legacy ERP data importer, validation pipeline, entity mapping, and automated delta sync.',
        keywords: ['vgf-02', 'migration center', 'data import', 'gold feature', 'excel', 'csv'],
        tags: ['Gold Feature', 'Completed'],
        module: 'Platform Core',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Platform Architecture',
        status: 'Active',
        date: dateNow,
        createdBy: 'system',
        permissionsRequired: ['Super Administrator'],
        actionUrl: '/gold/VGF-02'
      },

      // PLATFORM ENGINES
      {
        id: 'ENG-SEARCH-IDX',
        type: 'platform_engine',
        title: 'VPE-01 Vertex Universal Search Engine (VSE)',
        subtitle: 'Platform Engine • Universal Search Infrastructure',
        code: 'ENG-SEARCH',
        reference: 'VPE-01',
        description: 'Enterprise full-text search engine indexing all 15 ERP business modules, 10 Gold features, and platform records.',
        keywords: ['search', 'engine', 'vse', 'vpe-01', 'full-text', 'universal search', 'index'],
        tags: ['VPE Engine', 'Active Infrastructure'],
        module: 'Platform Infrastructure',
        company: 'Vertex Global Enterprises Corp',
        branch: 'HQ-NY',
        department: 'Platform Architecture',
        status: 'Active',
        date: dateNow,
        createdBy: 'system',
        permissionsRequired: ['Super Administrator'],
        actionUrl: '/vpe/ENG-SEARCH'
      }
    ];

    defaultRecords.forEach(rec => this.records.set(rec.id, rec));
  }
}

export const indexManager = IndexManager.getInstance();
