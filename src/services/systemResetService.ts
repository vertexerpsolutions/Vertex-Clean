import { setupWizardService } from './setupWizardService';
import { 
  DEFAULT_MAIN_WAREHOUSE, 
  Warehouse, 
  warehouseService 
} from './warehouseService';
import { 
  DEFAULT_MAIN_TREASURY, 
  Treasury, 
  treasuryService 
} from './treasuryService';
import { 
  SYSTEM_CASH_CUSTOMER, 
  DEFAULT_CUSTOMER_AREAS, 
  DEFAULT_CUSTOMER_CLASSIFICATIONS, 
  customerService 
} from './customerService';
import { 
  SYSTEM_CASH_VENDOR, 
  DEFAULT_VENDOR_AREAS, 
  DEFAULT_VENDOR_CLASSIFICATIONS, 
  vendorService 
} from './vendorService';
import { 
  INITIAL_APPROVED_CHART_OF_ACCOUNTS, 
  chartOfAccountsService 
} from './chartOfAccountsService';
import { categoryService } from './categoryService';
import { sellerService } from './sellerService';
import { regionService } from './regionService';
import { purchaseService } from './purchaseService';
import { salesEntryService } from './salesEntryService';
import { incomeTransactionService } from './incomeTransactionService';
import { stockTransferService } from './stockTransferService';
import { salesReturnService } from './salesReturnService';
import { 
  businessDayService, 
  INITIAL_CLOSING_VERIFICATIONS 
} from './businessDayService';

/**
 * Service to handle Comprehensive Operational Data Reset across all modules
 * (تهيئة البرنامج — حذف كافة بيانات التشغيل والاختبار في VERTEX ERP).
 *
 * Rules:
 * 1. Resets all operational and testing data across all implemented modules.
 * 2. Strictly preserves core foundational system entities:
 *    - System Cash Customer: CUST-CASH-00
 *    - System Cash Vendor: VEND-CASH-00
 *    - Main Branch: BR-01 (الفرع الرئيسي)
 *    - Main Warehouse: WH-01 (مخزن الفرع الرئيسي)
 *    - Main Treasury: TR-01 (خزينة الفرع الرئيسي) with 0 initial balance
 *    - Standard Approved Chart of Accounts (236 accounts)
 *    - System Users, Credentials, Roles, and Application Configurations
 * 3. Clears all operational transactions:
 *    - Sales invoices, held invoices, returns, and POS registers
 *    - Purchase invoices, held invoices, sequence counters, and returns
 *    - Income/expense vouchers and cash/bank transactions
 *    - Stock transfers and warehouse opening balances
 *    - Business day logs, shifts, closing batches
 *    - Custom items/products, categories, sellers, regions
 *    - Audit logs, document histories, and merge states
 */

export interface PurgeResult {
  success: boolean;
  clearedKeysCount: number;
  blocked?: boolean;
  reason?: string;
  branchId?: string;
  details?: string[];
}

export function purgeOperationalData(targetBranchId?: string): PurgeResult {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { success: false, clearedKeysCount: 0, details: [] };
  }

  const details: string[] = [];
  let clearedCount = 0;

  try {
    // -------------------------------------------------------------
    // 1. CUSTOMERS: Preserve ONLY CUST-CASH-00
    // -------------------------------------------------------------
    const cleanCustomers = [
      {
        ...SYSTEM_CASH_CUSTOMER,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('VERTEX_CUSTOMER_MASTER_V1', JSON.stringify(cleanCustomers));
    localStorage.setItem('VERTEX_CUSTOMER_CLASSIFICATIONS_V1', JSON.stringify(DEFAULT_CUSTOMER_CLASSIFICATIONS));
    localStorage.setItem('VERTEX_CUSTOMER_AREAS_V1', JSON.stringify(DEFAULT_CUSTOMER_AREAS));
    clearedCount++;
    details.push('تصفير سجلات العملاء التجريبية والإبقاء على العميل النقدي النظامي (CUST-CASH-00)');

    // -------------------------------------------------------------
    // 2. VENDORS: Preserve ONLY VEND-CASH-00
    // -------------------------------------------------------------
    const cleanVendors = [
      {
        ...SYSTEM_CASH_VENDOR,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('VERTEX_VENDOR_MASTER_V1', JSON.stringify(cleanVendors));
    localStorage.setItem('VERTEX_VENDOR_CLASSIFICATIONS_V1', JSON.stringify(DEFAULT_VENDOR_CLASSIFICATIONS));
    localStorage.setItem('VERTEX_VENDOR_AREAS_V1', JSON.stringify(DEFAULT_VENDOR_AREAS));
    clearedCount++;
    details.push('تصفير سجلات الموردين التجريبية والإبقاء على المورد النقدي النظامي (VEND-CASH-00)');

    // -------------------------------------------------------------
    // 3. PRODUCTS & CATEGORIES
    // -------------------------------------------------------------
    localStorage.setItem('VERTEX_CATEGORY_TREE_MASTER_V1', JSON.stringify([]));
    localStorage.setItem('VERTEX_PRODUCTS_MASTER_V1', JSON.stringify([]));
    localStorage.removeItem('vertex_category_structure_levels');
    localStorage.removeItem('vertex_category_hierarchy_levels');
    localStorage.removeItem('vertex_category_structure_configured');
    clearedCount += 2;
    details.push('حذف جميع الأصناف ومجموعاتها ووحداتها وإعادة ضبط دليل الأصناف');

    // -------------------------------------------------------------
    // 4. SELLERS & REGIONS
    // -------------------------------------------------------------
    localStorage.setItem('VERTEX_SELLER_MASTER_V1', JSON.stringify([]));
    localStorage.setItem('vertex_master_regions_v1', JSON.stringify([]));
    clearedCount += 2;
    details.push('حذف سجلات المناديب والمناطق التجريبية');

    // -------------------------------------------------------------
    // 5. BRANCHES, WAREHOUSES & TREASURIES
    // -------------------------------------------------------------
    // Update Wizard Setup Config to keep only BR-01, WH-01, TR-01
    try {
      const wizardConfig = setupWizardService.getConfig();
      const updatedConfig = {
        ...wizardConfig,
        branches: [
          {
            id: 'BR-01',
            code: 'BR-01',
            name: 'الفرع الرئيسي',
            city: 'الإسكندرية / القاهرة',
            isMain: true
          }
        ],
        warehouses: [
          {
            id: 'WH-01',
            code: '1',
            name: 'مخزن الفرع الرئيسي',
            branchId: 'BR-01'
          }
        ],
        treasuries: [
          {
            id: 'TR-01',
            code: 'TR-001',
            name: 'خزينة الفرع الرئيسي',
            branchId: 'BR-01',
            currency: 'EGP (ج.م)'
          }
        ],
        bankAccounts: [
          {
            id: 'BK-01',
            code: 'JPM-EGP-01',
            bankName: 'البنك التجاري / الحساب الجاري',
            accountNumber: '10098827361',
            iban: 'EG39JPMC10098827361',
            swift: 'CHASUS33',
            currency: 'EGP (ج.م)',
            companyName: wizardConfig.companyName || 'Vertex ERP',
            branchId: 'BR-01',
            branchName: 'الفرع الرئيسي',
            openingBalance: 0,
            openingBalanceDate: new Date().toISOString().slice(0, 10)
          }
        ]
      };
      localStorage.setItem('vertex_vgf01_setup_wizard_v1', JSON.stringify(updatedConfig));
    } catch {}

    // Warehouses: Keep ONLY WH-01
    const cleanWarehouses: Warehouse[] = [
      {
        ...DEFAULT_MAIN_WAREHOUSE,
        branchId: 'BR-01',
        branchName: 'الفرع الرئيسي',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('VERTEX_WAREHOUSE_MASTER_V1', JSON.stringify(cleanWarehouses));

    // Treasuries: Keep ONLY TR-01
    const cleanTreasuries: Treasury[] = [
      {
        ...DEFAULT_MAIN_TREASURY,
        branchId: 'BR-01',
        branchName: 'الفرع الرئيسي',
        openingBalance: 0,
        openingBalanceDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('VERTEX_TREASURY_MASTER_V1', JSON.stringify(cleanTreasuries));

    // Active Branch selection
    localStorage.setItem('VERTEX_CURRENT_BRANCH_ID', 'BR-01');
    localStorage.setItem('VERTEX_LAST_SELECTED_BRANCH_ID', 'BR-01');
    clearedCount += 3;
    details.push('إعادة تعيين الفروع والمخازن والخزن وحصرها في النواة التأسيسية للفرع الرئيسي (BR-01, WH-01, TR-01)');

    // -------------------------------------------------------------
    // 6. SALES INVOICES & POS
    // -------------------------------------------------------------
    const blankActiveSaleInvoice = {
      id: `INV-${Date.now()}-001`,
      invoiceNumber: 'INV-2026-1001',
      mode: 'standard',
      customerId: SYSTEM_CASH_CUSTOMER.id,
      customerName: SYSTEM_CASH_CUSTOMER.name,
      branchId: 'BR-01',
      branchName: 'الفرع الرئيسي',
      warehouseId: 'WH-01',
      warehouseName: 'مخزن الفرع الرئيسي',
      treasuryId: 'TR-01',
      treasuryName: 'خزينة الفرع الرئيسي',
      invoiceDate: new Date().toISOString().slice(0, 10),
      lineItems: [],
      subtotal: 0,
      taxTotal: 0,
      discountTotal: 0,
      netTotal: 0,
      cashPaid: 0,
      cardPaid: 0,
      bankPaid: 0,
      remainingDue: 0,
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    const cleanSalesState = {
      currentMode: 'standard',
      activeInvoice: blankActiveSaleInvoice,
      openInvoices: [],
      completedInvoices: [],
      products: [],
      customers: cleanCustomers,
      recentlySoldProducts: [],
      highestSequenceGenerated: 1000,
      metrics: {
        totalInvoicesCompleted: 0,
        totalRevenue: 0,
        standardModeCount: 0,
        posModeCount: 0,
        buttonModeCount: 0,
        averageScansPerMin: 0,
        averageInvoiceTimeSeconds: 0,
        topCategories: []
      },
      isVgf06Completed: true
    };
    localStorage.setItem('VERTEX_VGF06_SALES_ENTRY', JSON.stringify(cleanSalesState));
    localStorage.setItem('sales_returns_records_v1', JSON.stringify([]));
    clearedCount += 2;
    details.push('حذف كافة فواتير المبيعات ونقاط البيع والمعلقات والمرتجعات وتصفير عدادات الإيراد');

    // -------------------------------------------------------------
    // 7. PURCHASE INVOICES & SUPPLIERS
    // -------------------------------------------------------------
    localStorage.setItem('VERTEX_PURCHASE_INVOICES_V1', JSON.stringify([]));
    localStorage.setItem('VERTEX_PURCHASE_HELD_INVOICES_V1', JSON.stringify([]));
    localStorage.setItem('VERTEX_PURCHASE_SEQUENCE_COUNTER_V1', '1000');
    localStorage.setItem('purchase_returns_records_v1', JSON.stringify([]));
    clearedCount += 4;
    details.push('حذف كافة فواتير المشتريات المكتملة والمعلقة ومرتجعات الموردين وتصفير التسلسل إلى 1000');

    // -------------------------------------------------------------
    // 8. TREASURY & BANK MOVEMENTS (سندات القبض والصرف والتحويل)
    // -------------------------------------------------------------
    localStorage.setItem('VERTEX_INCOME_TRANSACTIONS_V1', JSON.stringify([]));
    clearedCount++;
    details.push('حذف كافة سندات القبض والصرف والحركات المالية والتحويلات النقدية والبنكية');

    // -------------------------------------------------------------
    // 9. INVENTORY TRANSFERS & OPENING BALANCES
    // -------------------------------------------------------------
    localStorage.setItem('VERTEX_STOCK_TRANSFERS_V1', JSON.stringify([]));
    localStorage.setItem('VERTEX_OPENING_BALANCES_V1', JSON.stringify([]));
    clearedCount += 2;
    details.push('حذف التحويلات المخزنية وأرصدة المخزون الافتتاحية');

    // -------------------------------------------------------------
    // 10. BUSINESS DAY & SHIFTS
    // -------------------------------------------------------------
    const cleanBusinessDayState = {
      currentGlobalDate: new Date().toISOString().slice(0, 10),
      isCentralizedControl: true,
      branches: [
        {
          branchId: 'BR-01',
          branchCode: 'BR-01',
          branchName: 'الفرع الرئيسي',
          region: 'الإسكندرية / القاهرة',
          currentBusinessDate: new Date().toISOString().slice(0, 10),
          status: 'closed',
          openedAt: new Date().toISOString(),
          openedBy: 'vtx_sysadmin',
          treasuryBalance: 0,
          bankBalance: 0,
          openInvoicesCount: 0,
          pendingPaymentsCount: 0,
          pendingReceiptsCount: 0,
          inventoryTxCount: 0,
          journalEntriesCount: 0,
          discrepancyCount: 0
        }
      ],
      shifts: [],
      closingVerifications: INITIAL_CLOSING_VERIFICATIONS,
      reconciliationItems: [],
      history: [],
      isVgf04Completed: true
    };
    localStorage.setItem('VERTEX_VGF04_BUSINESS_DAY', JSON.stringify(cleanBusinessDayState));
    clearedCount++;
    details.push('إعادة ضبط يومية الأعمال والورديات وإغلاق الفترات التشغيلية برصيد صفري');

    // -------------------------------------------------------------
    // 11. CHART OF ACCOUNTS (دليل الحسابات المعتمد)
    // -------------------------------------------------------------
    const cleanAccounts = INITIAL_APPROVED_CHART_OF_ACCOUNTS.filter(
      (a: any) => !a.name?.includes('العجوزة') && !a.name?.includes('العجوزه') && !a.name?.includes('Agouza') && !a.notes?.includes('العجوز')
    );
    localStorage.setItem('VERTEX_CHART_OF_ACCOUNTS_REF_V1', JSON.stringify(cleanAccounts));
    clearedCount++;
    details.push('إعادة تعيين شجرة الحسابات المعتمدة (236 حساباً) بأرصدة افتتاحية صفرية نقية');

    // -------------------------------------------------------------
    // 12. AUDIT LOGS, HISTORY & AUXILIARY ENGINES
    // -------------------------------------------------------------
    localStorage.setItem('vertex_audit_logs_v1', JSON.stringify([]));
    localStorage.removeItem('VERTEX_VGF09_DOCUMENT_HISTORY');
    localStorage.removeItem('VERTEX_VGF10_ADVANCED_AUDIT');
    localStorage.removeItem('VERTEX_VGF08_SMART_REORDER');
    localStorage.removeItem('VERTEX_VGF03_MERGE_ENGINE');
    localStorage.removeItem('VERTEX_VGF07_VISIBILITY_MANAGER');
    clearedCount += 6;
    details.push('تطهير سجلات التدقيق والتاريخ ومسارات الرؤية والدمج التشغيلي');

    // -------------------------------------------------------------
    // 13. RELOAD IN-MEMORY SINGLETONS
    // -------------------------------------------------------------
    try {
      if (typeof customerService?.reloadFromStorage === 'function') {
        customerService.reloadFromStorage();
      }
      if (typeof vendorService?.reloadFromStorage === 'function') {
        vendorService.reloadFromStorage();
      }
      if (typeof warehouseService?.reloadFromStorage === 'function') {
        warehouseService.reloadFromStorage();
      }
      if (typeof treasuryService?.reloadFromStorage === 'function') {
        treasuryService.reloadFromStorage();
      }
      if (typeof categoryService?.reloadFromStorage === 'function') {
        categoryService.reloadFromStorage();
      }
      if (typeof sellerService?.reloadFromStorage === 'function') {
        sellerService.reloadFromStorage();
      }
      if (typeof regionService?.reloadFromStorage === 'function') {
        regionService.reloadFromStorage();
      }
      if (typeof purchaseService?.reloadFromStorage === 'function') {
        purchaseService.reloadFromStorage();
      }
      if (typeof incomeTransactionService?.reloadFromStorage === 'function') {
        incomeTransactionService.reloadFromStorage();
      }
      if (typeof stockTransferService?.reloadFromStorage === 'function') {
        stockTransferService.reloadFromStorage();
      }
      if (typeof salesReturnService?.reloadFromStorage === 'function') {
        salesReturnService.reloadFromStorage();
      }
      if (typeof salesEntryService?.resetState === 'function') {
        salesEntryService.resetState();
      }
      if (typeof businessDayService?.resetState === 'function') {
        businessDayService.resetState();
      }
      if (typeof chartOfAccountsService?.resetToDefault === 'function') {
        chartOfAccountsService.resetToDefault();
      }
    } catch (e) {
      console.warn('In-memory cache reload warning:', e);
    }

    return {
      success: true,
      clearedKeysCount: clearedCount,
      branchId: 'BR-01',
      details
    };
  } catch (err: any) {
    console.error('Error during operational data reset', err);
    return {
      success: false,
      clearedKeysCount: clearedCount,
      reason: err?.message || 'فشل تنفيذ تهيئة بيانات البرنامج.',
      details
    };
  }
}
