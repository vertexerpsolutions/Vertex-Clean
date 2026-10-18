-- ==============================================================================
-- VERTEX ERP ULTIMATE: SEPARATE SQL DATABASE ARCHITECTURE (APPROVED SPECIFICATION)
-- ==============================================================================
-- SCHEMAS:
--   1. Main : Master Data, Security, Configuration, Chart of Accounts & Entities
--   2. Trans: Operational Transactions, Journal Entries, Invoices, Transfers & Returns
--   3. Temp : Staging, POS Sessions, Draft Buffers & Temporary Audit Workspaces
-- 
-- CONSTRAINTS & SPECIFICATIONS:
--   - STRICTLY RELATIONAL: Complete Primary Keys, Foreign Keys, Indexes & Constraints
--   - ZERO OPERATIONAL DATA: No operational invoices, sales, purchases or balances
--   - FOUNDATIONAL BOOTSTRAP ONLY:
--       * الفرع الرئيسي (Main Branch)
--       * المخزن الرئيسي (Main Warehouse)
--       * الخزينة الرئيسية (Main Treasury - 0.00 Balance)
--       * البنك الرئيسي (Main Bank - 0.00 Balance)
--       * System Security Roles & Master Admin User
--       * 191 Approved Chart of Accounts Nodes (from VERTEX_ChartOfAccounts_NEW_REFERENCE.csv)
--   - DECOUPLED: Database is isolated and not bound to client runtime
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- DATABASE CREATION & CONTEXT
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'VERTEX_DB')
BEGIN
    CREATE DATABASE VERTEX_DB;
END;
GO

USE VERTEX_DB;
GO

-- ------------------------------------------------------------------------------
-- SCHEMAS INITIALIZATION: Main / Trans / Temp
-- ------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'Main')
    EXEC('CREATE SCHEMA Main');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'Trans')
    EXEC('CREATE SCHEMA Trans');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'Temp')
    EXEC('CREATE SCHEMA Temp');
GO

-- ==============================================================================
-- SECTION 1: [Main] SCHEMA - MASTER DATA & FOUNDATIONAL ENTITIES
-- ==============================================================================

-- 1.1 System Security Roles
IF OBJECT_ID(N'Main.system_roles', N'U') IS NULL
CREATE TABLE Main.system_roles (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name NVARCHAR(128) NOT NULL,
    description NVARCHAR(255),
    permissions NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.2 System Users
IF OBJECT_ID(N'Main.system_users', N'U') IS NULL
CREATE TABLE Main.system_users (
    id VARCHAR(64) PRIMARY KEY,
    username NVARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    full_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    role_id VARCHAR(64) NULL CONSTRAINT FK_system_users_role FOREIGN KEY REFERENCES Main.system_roles(id),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.3 System Global Configuration & Settings
IF OBJECT_ID(N'Main.system_settings', N'U') IS NULL
CREATE TABLE Main.system_settings (
    [key] VARCHAR(128) PRIMARY KEY,
    [value] NVARCHAR(MAX) NOT NULL,
    description NVARCHAR(255) NULL,
    updated_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.4 Fiscal Years & Accounting Periods
IF OBJECT_ID(N'Main.fiscal_years', N'U') IS NULL
CREATE TABLE Main.fiscal_years (
    id VARCHAR(64) PRIMARY KEY,
    year_code VARCHAR(32) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.5 Branches (الفرع الرئيسي والفروع)
IF OBJECT_ID(N'Main.branches', N'U') IS NULL
CREATE TABLE Main.branches (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    city NVARCHAR(128) NULL,
    address NVARCHAR(255) NULL,
    phone VARCHAR(64) NULL,
    is_main BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.6 Warehouses (المخزن الرئيسي والمخازن)
IF OBJECT_ID(N'Main.warehouses', N'U') IS NULL
CREATE TABLE Main.warehouses (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    branch_id VARCHAR(64) NOT NULL CONSTRAINT FK_warehouses_branch FOREIGN KEY REFERENCES Main.branches(id),
    is_main BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.7 Treasuries (الخزينة الرئيسية والخزائن)
IF OBJECT_ID(N'Main.treasuries', N'U') IS NULL
CREATE TABLE Main.treasuries (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    branch_id VARCHAR(64) NOT NULL CONSTRAINT FK_treasuries_branch FOREIGN KEY REFERENCES Main.branches(id),
    current_balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    is_main BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.8 Bank Accounts (البنك الرئيسي وحسابات البنوك)
IF OBJECT_ID(N'Main.bank_accounts', N'U') IS NULL
CREATE TABLE Main.bank_accounts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    bank_name NVARCHAR(255) NOT NULL,
    account_number VARCHAR(128) NOT NULL,
    iban VARCHAR(128) NULL,
    branch_id VARCHAR(64) NOT NULL CONSTRAINT FK_bank_accounts_branch FOREIGN KEY REFERENCES Main.branches(id),
    current_balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    is_main BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.9 Chart of Accounts (دليل الحسابات المعتمد)
IF OBJECT_ID(N'Main.chart_of_accounts', N'U') IS NULL
CREATE TABLE Main.chart_of_accounts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- assets, liabilities, equity, revenue, expenses
    category_label NVARCHAR(64) NOT NULL,
    parent_code VARCHAR(32) NULL,
    level INT NOT NULL DEFAULT 1,
    nature VARCHAR(16) NOT NULL DEFAULT 'debit', -- debit or credit
    is_leaf BIT NOT NULL DEFAULT 1,
    balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    notes NVARCHAR(255) NULL,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.10 Cost Centers (مراكز التكلفة)
IF OBJECT_ID(N'Main.cost_centers', N'U') IS NULL
CREATE TABLE Main.cost_centers (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    parent_id VARCHAR(64) NULL CONSTRAINT FK_cost_centers_parent FOREIGN KEY REFERENCES Main.cost_centers(id),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.11 Item Categories (مجموعات الأصناف)
IF OBJECT_ID(N'Main.item_categories', N'U') IS NULL
CREATE TABLE Main.item_categories (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    parent_id VARCHAR(64) NULL CONSTRAINT FK_item_categories_parent FOREIGN KEY REFERENCES Main.item_categories(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.12 Units of Measure (وحدات القياس)
IF OBJECT_ID(N'Main.units_of_measure', N'U') IS NULL
CREATE TABLE Main.units_of_measure (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name NVARCHAR(64) NOT NULL,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.13 Items & Products (دليل الأصناف والمنتجات)
IF OBJECT_ID(N'Main.items', N'U') IS NULL
CREATE TABLE Main.items (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    barcode VARCHAR(128) NULL,
    name NVARCHAR(255) NOT NULL,
    category_id VARCHAR(64) NULL CONSTRAINT FK_items_category FOREIGN KEY REFERENCES Main.item_categories(id),
    uom_id VARCHAR(64) NULL CONSTRAINT FK_items_uom FOREIGN KEY REFERENCES Main.units_of_measure(id),
    purchase_price DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    sale_price DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    min_reorder_level DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    current_stock DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    sales_account_id VARCHAR(64) NULL CONSTRAINT FK_items_sales_acc FOREIGN KEY REFERENCES Main.chart_of_accounts(id),
    inventory_account_id VARCHAR(64) NULL CONSTRAINT FK_items_inv_acc FOREIGN KEY REFERENCES Main.chart_of_accounts(id),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.14 Customer Categories (تصنيفات العملاء)
IF OBJECT_ID(N'Main.customer_categories', N'U') IS NULL
CREATE TABLE Main.customer_categories (
    id VARCHAR(64) PRIMARY KEY,
    name NVARCHAR(128) NOT NULL,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.15 Customers (دليل العملاء)
IF OBJECT_ID(N'Main.customers', N'U') IS NULL
CREATE TABLE Main.customers (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    phone VARCHAR(64) NULL,
    tax_number VARCHAR(64) NULL,
    category_id VARCHAR(64) NULL CONSTRAINT FK_customers_category FOREIGN KEY REFERENCES Main.customer_categories(id),
    account_id VARCHAR(64) NULL CONSTRAINT FK_customers_account FOREIGN KEY REFERENCES Main.chart_of_accounts(id),
    credit_limit DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    current_balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.16 Vendor Categories (تصنيفات الموردين)
IF OBJECT_ID(N'Main.vendor_categories', N'U') IS NULL
CREATE TABLE Main.vendor_categories (
    id VARCHAR(64) PRIMARY KEY,
    name NVARCHAR(128) NOT NULL,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 1.17 Vendors (دليل الموردين)
IF OBJECT_ID(N'Main.vendors', N'U') IS NULL
CREATE TABLE Main.vendors (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,
    phone VARCHAR(64) NULL,
    tax_number VARCHAR(64) NULL,
    category_id VARCHAR(64) NULL CONSTRAINT FK_vendors_category FOREIGN KEY REFERENCES Main.vendor_categories(id),
    account_id VARCHAR(64) NULL CONSTRAINT FK_vendors_account FOREIGN KEY REFERENCES Main.chart_of_accounts(id),
    current_balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- ==============================================================================
-- SECTION 2: [Trans] SCHEMA - TRANSACTIONS & OPERATIONAL DATA
-- ==============================================================================

-- 2.1 General Ledger Journal Entries (القيود اليومية العامة المركزية)
IF OBJECT_ID(N'Trans.journal_entries', N'U') IS NULL
CREATE TABLE Trans.journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    entry_number VARCHAR(64) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    fiscal_year_id VARCHAR(64) NULL CONSTRAINT FK_journal_fiscal_year FOREIGN KEY REFERENCES Main.fiscal_years(id),
    branch_id VARCHAR(64) NOT NULL CONSTRAINT FK_journal_branch FOREIGN KEY REFERENCES Main.branches(id),
    reference_doc_type VARCHAR(64) NULL, -- sales, purchase, receipt, payment, transfer
    reference_doc_id VARCHAR(64) NULL,
    narration NVARCHAR(500) NULL,
    total_debit DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    total_credit DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    is_posted BIT DEFAULT 1,
    created_by VARCHAR(64) NULL CONSTRAINT FK_journal_user FOREIGN KEY REFERENCES Main.system_users(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 2.2 Journal Entry Lines (تفاصيل بنود القيود)
IF OBJECT_ID(N'Trans.journal_entry_lines', N'U') IS NULL
CREATE TABLE Trans.journal_entry_lines (
    id VARCHAR(64) PRIMARY KEY,
    journal_entry_id VARCHAR(64) NOT NULL CONSTRAINT FK_entry_lines_parent FOREIGN KEY REFERENCES Trans.journal_entries(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    account_id VARCHAR(64) NOT NULL CONSTRAINT FK_entry_lines_account FOREIGN KEY REFERENCES Main.chart_of_accounts(id),
    cost_center_id VARCHAR(64) NULL CONSTRAINT FK_entry_lines_cost_center FOREIGN KEY REFERENCES Main.cost_centers(id),
    debit DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    credit DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    notes NVARCHAR(255) NULL
);
GO

-- 2.3 Sales Invoices Header (فواتير المبيعات)
IF OBJECT_ID(N'Trans.sales_invoices', N'U') IS NULL
CREATE TABLE Trans.sales_invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    branch_id VARCHAR(64) NOT NULL CONSTRAINT FK_sales_branch FOREIGN KEY REFERENCES Main.branches(id),
    warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_sales_warehouse FOREIGN KEY REFERENCES Main.warehouses(id),
    customer_id VARCHAR(64) NOT NULL CONSTRAINT FK_sales_customer FOREIGN KEY REFERENCES Main.customers(id),
    treasury_id VARCHAR(64) NULL CONSTRAINT FK_sales_treasury FOREIGN KEY REFERENCES Main.treasuries(id),
    bank_id VARCHAR(64) NULL CONSTRAINT FK_sales_bank FOREIGN KEY REFERENCES Main.bank_accounts(id),
    invoice_date DATE NOT NULL,
    payment_method VARCHAR(32) NOT NULL, -- cash, credit, bank
    subtotal DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    tax_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    discount_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    net_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    paid_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    remaining_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(32) NOT NULL DEFAULT 'posted',
    created_by VARCHAR(64) NULL CONSTRAINT FK_sales_user FOREIGN KEY REFERENCES Main.system_users(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 2.4 Sales Invoice Items Detail (بنود فواتير المبيعات)
IF OBJECT_ID(N'Trans.sales_invoice_items', N'U') IS NULL
CREATE TABLE Trans.sales_invoice_items (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL CONSTRAINT FK_sales_items_parent FOREIGN KEY REFERENCES Trans.sales_invoices(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL CONSTRAINT FK_sales_items_item FOREIGN KEY REFERENCES Main.items(id),
    warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_sales_items_warehouse FOREIGN KEY REFERENCES Main.warehouses(id),
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(18, 4) NOT NULL,
    discount_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    total_price DECIMAL(18, 4) NOT NULL
);
GO

-- 2.5 Purchase Invoices Header (فواتير المشتريات)
IF OBJECT_ID(N'Trans.purchase_invoices', N'U') IS NULL
CREATE TABLE Trans.purchase_invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    branch_id VARCHAR(64) NOT NULL CONSTRAINT FK_purchases_branch FOREIGN KEY REFERENCES Main.branches(id),
    warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_purchases_warehouse FOREIGN KEY REFERENCES Main.warehouses(id),
    vendor_id VARCHAR(64) NOT NULL CONSTRAINT FK_purchases_vendor FOREIGN KEY REFERENCES Main.vendors(id),
    treasury_id VARCHAR(64) NULL CONSTRAINT FK_purchases_treasury FOREIGN KEY REFERENCES Main.treasuries(id),
    bank_id VARCHAR(64) NULL CONSTRAINT FK_purchases_bank FOREIGN KEY REFERENCES Main.bank_accounts(id),
    invoice_date DATE NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    subtotal DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    tax_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    net_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    paid_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    remaining_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(32) NOT NULL DEFAULT 'posted',
    created_by VARCHAR(64) NULL CONSTRAINT FK_purchases_user FOREIGN KEY REFERENCES Main.system_users(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 2.6 Purchase Invoice Items Detail (بنود فواتير المشتريات)
IF OBJECT_ID(N'Trans.purchase_invoice_items', N'U') IS NULL
CREATE TABLE Trans.purchase_invoice_items (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL CONSTRAINT FK_purchase_items_parent FOREIGN KEY REFERENCES Trans.purchase_invoices(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL CONSTRAINT FK_purchase_items_item FOREIGN KEY REFERENCES Main.items(id),
    warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_purchase_items_warehouse FOREIGN KEY REFERENCES Main.warehouses(id),
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(18, 4) NOT NULL,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    total_price DECIMAL(18, 4) NOT NULL
);
GO

-- 2.7 Sales Returns Header & Items (مردودات المبيعات)
IF OBJECT_ID(N'Trans.sales_returns', N'U') IS NULL
CREATE TABLE Trans.sales_returns (
    id VARCHAR(64) PRIMARY KEY,
    return_number VARCHAR(64) NOT NULL UNIQUE,
    original_invoice_id VARCHAR(64) NULL CONSTRAINT FK_s_return_invoice FOREIGN KEY REFERENCES Trans.sales_invoices(id),
    customer_id VARCHAR(64) NOT NULL CONSTRAINT FK_s_return_customer FOREIGN KEY REFERENCES Main.customers(id),
    warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_s_return_warehouse FOREIGN KEY REFERENCES Main.warehouses(id),
    treasury_id VARCHAR(64) NULL CONSTRAINT FK_s_return_treasury FOREIGN KEY REFERENCES Main.treasuries(id),
    return_date DATE NOT NULL,
    total_amount DECIMAL(18, 4) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'posted',
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

IF OBJECT_ID(N'Trans.sales_return_items', N'U') IS NULL
CREATE TABLE Trans.sales_return_items (
    id VARCHAR(64) PRIMARY KEY,
    return_id VARCHAR(64) NOT NULL CONSTRAINT FK_s_return_items_parent FOREIGN KEY REFERENCES Trans.sales_returns(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL CONSTRAINT FK_s_return_items_item FOREIGN KEY REFERENCES Main.items(id),
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(18, 4) NOT NULL,
    total_price DECIMAL(18, 4) NOT NULL
);
GO

-- 2.8 Purchase Returns Header & Items (مردودات المشتريات)
IF OBJECT_ID(N'Trans.purchase_returns', N'U') IS NULL
CREATE TABLE Trans.purchase_returns (
    id VARCHAR(64) PRIMARY KEY,
    return_number VARCHAR(64) NOT NULL UNIQUE,
    original_invoice_id VARCHAR(64) NULL CONSTRAINT FK_p_return_invoice FOREIGN KEY REFERENCES Trans.purchase_invoices(id),
    vendor_id VARCHAR(64) NOT NULL CONSTRAINT FK_p_return_vendor FOREIGN KEY REFERENCES Main.vendors(id),
    warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_p_return_warehouse FOREIGN KEY REFERENCES Main.warehouses(id),
    treasury_id VARCHAR(64) NULL CONSTRAINT FK_p_return_treasury FOREIGN KEY REFERENCES Main.treasuries(id),
    return_date DATE NOT NULL,
    total_amount DECIMAL(18, 4) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'posted',
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

IF OBJECT_ID(N'Trans.purchase_return_items', N'U') IS NULL
CREATE TABLE Trans.purchase_return_items (
    id VARCHAR(64) PRIMARY KEY,
    return_id VARCHAR(64) NOT NULL CONSTRAINT FK_p_return_items_parent FOREIGN KEY REFERENCES Trans.purchase_returns(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL CONSTRAINT FK_p_return_items_item FOREIGN KEY REFERENCES Main.items(id),
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(18, 4) NOT NULL,
    total_price DECIMAL(18, 4) NOT NULL
);
GO

-- 2.9 Treasury & Bank Cash Flow Transactions (سندات الصرف والقبض والحركات النقدية)
IF OBJECT_ID(N'Trans.treasury_bank_transactions', N'U') IS NULL
CREATE TABLE Trans.treasury_bank_transactions (
    id VARCHAR(64) PRIMARY KEY,
    document_number VARCHAR(64) NOT NULL UNIQUE,
    transaction_type VARCHAR(32) NOT NULL, -- income, expense, transfer
    source_type VARCHAR(32) NOT NULL, -- treasury, bank
    source_id VARCHAR(64) NOT NULL,
    destination_type VARCHAR(32) NULL,
    destination_id VARCHAR(64) NULL,
    account_id VARCHAR(64) NULL CONSTRAINT FK_cashflow_account FOREIGN KEY REFERENCES Main.chart_of_accounts(id),
    amount DECIMAL(18, 4) NOT NULL,
    transaction_date DATE NOT NULL,
    notes NVARCHAR(500) NULL,
    created_by VARCHAR(64) NULL CONSTRAINT FK_cashflow_user FOREIGN KEY REFERENCES Main.system_users(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 2.10 Stock Transfers Header & Items (أوامر التحويل المخزني بين المخازن)
IF OBJECT_ID(N'Trans.stock_transfers', N'U') IS NULL
CREATE TABLE Trans.stock_transfers (
    id VARCHAR(64) PRIMARY KEY,
    transfer_number VARCHAR(64) NOT NULL UNIQUE,
    from_warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_transfer_from_wh FOREIGN KEY REFERENCES Main.warehouses(id),
    to_warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_transfer_to_wh FOREIGN KEY REFERENCES Main.warehouses(id),
    transfer_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'completed',
    notes NVARCHAR(500) NULL,
    created_by VARCHAR(64) NULL CONSTRAINT FK_transfer_user FOREIGN KEY REFERENCES Main.system_users(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

IF OBJECT_ID(N'Trans.stock_transfer_items', N'U') IS NULL
CREATE TABLE Trans.stock_transfer_items (
    id VARCHAR(64) PRIMARY KEY,
    transfer_id VARCHAR(64) NOT NULL CONSTRAINT FK_transfer_items_parent FOREIGN KEY REFERENCES Trans.stock_transfers(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL CONSTRAINT FK_transfer_items_item FOREIGN KEY REFERENCES Main.items(id),
    quantity DECIMAL(18, 4) NOT NULL
);
GO

-- 2.11 Inventory Adjustments (تسويات الجرد والعجز والزيادة)
IF OBJECT_ID(N'Trans.inventory_adjustments', N'U') IS NULL
CREATE TABLE Trans.inventory_adjustments (
    id VARCHAR(64) PRIMARY KEY,
    adjustment_number VARCHAR(64) NOT NULL UNIQUE,
    warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_adj_warehouse FOREIGN KEY REFERENCES Main.warehouses(id),
    adjustment_date DATE NOT NULL,
    reason NVARCHAR(255) NULL,
    total_cost_delta DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    created_by VARCHAR(64) NULL CONSTRAINT FK_adj_user FOREIGN KEY REFERENCES Main.system_users(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

IF OBJECT_ID(N'Trans.inventory_adjustment_items', N'U') IS NULL
CREATE TABLE Trans.inventory_adjustment_items (
    id VARCHAR(64) PRIMARY KEY,
    adjustment_id VARCHAR(64) NOT NULL CONSTRAINT FK_adj_items_parent FOREIGN KEY REFERENCES Trans.inventory_adjustments(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL CONSTRAINT FK_adj_items_item FOREIGN KEY REFERENCES Main.items(id),
    system_quantity DECIMAL(18, 4) NOT NULL,
    actual_quantity DECIMAL(18, 4) NOT NULL,
    difference_quantity DECIMAL(18, 4) NOT NULL,
    unit_cost DECIMAL(18, 4) NOT NULL DEFAULT 0.0000
);
GO

-- ==============================================================================
-- SECTION 3: [Temp] SCHEMA - STAGING, BUFFERS, DRAFTS & RECONCILIATION
-- ==============================================================================

-- 3.1 POS Active Sessions (جلسات نقاط البيع المؤقتة)
IF OBJECT_ID(N'Temp.pos_active_sessions', N'U') IS NULL
CREATE TABLE Temp.pos_active_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    terminal_code VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL CONSTRAINT FK_pos_sess_user FOREIGN KEY REFERENCES Main.system_users(id),
    branch_id VARCHAR(64) NOT NULL CONSTRAINT FK_pos_sess_branch FOREIGN KEY REFERENCES Main.branches(id),
    warehouse_id VARCHAR(64) NOT NULL CONSTRAINT FK_pos_sess_warehouse FOREIGN KEY REFERENCES Main.warehouses(id),
    treasury_id VARCHAR(64) NOT NULL CONSTRAINT FK_pos_sess_treasury FOREIGN KEY REFERENCES Main.treasuries(id),
    opening_balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    opened_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 3.2 POS Temporary Cart Items (سلات البيع السريعة غير المحفوظة)
IF OBJECT_ID(N'Temp.pos_cart_items', N'U') IS NULL
CREATE TABLE Temp.pos_cart_items (
    cart_item_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL CONSTRAINT FK_cart_items_session FOREIGN KEY REFERENCES Temp.pos_active_sessions(session_id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL CONSTRAINT FK_cart_items_item FOREIGN KEY REFERENCES Main.items(id),
    quantity DECIMAL(18, 4) NOT NULL,
    unit_price DECIMAL(18, 4) NOT NULL,
    discount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    added_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 3.3 Draft Invoices (مسودات الفواتير قيد الإعداد)
IF OBJECT_ID(N'Temp.draft_invoices', N'U') IS NULL
CREATE TABLE Temp.draft_invoices (
    draft_id VARCHAR(64) PRIMARY KEY,
    invoice_type VARCHAR(32) NOT NULL, -- sales, purchase
    draft_payload NVARCHAR(MAX) NOT NULL,
    created_by VARCHAR(64) NULL CONSTRAINT FK_draft_user FOREIGN KEY REFERENCES Main.system_users(id),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME2 NULL
);
GO

-- 3.4 Migration & Import Staging Buffers (وساطة استيراد وتهجير البيانات)
IF OBJECT_ID(N'Temp.migration_staging', N'U') IS NULL
CREATE TABLE Temp.migration_staging (
    staging_id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL, -- items, customers, vendors, accounts
    raw_payload NVARCHAR(MAX) NOT NULL,
    validation_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, valid, error
    validation_error NVARCHAR(500) NULL,
    staged_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- 3.5 Bank Reconciliation Temporary Matches (مطابقة كشوف الحسابات المؤقتة)
IF OBJECT_ID(N'Temp.bank_reconciliation_staging', N'U') IS NULL
CREATE TABLE Temp.bank_reconciliation_staging (
    reconciliation_id VARCHAR(64) PRIMARY KEY,
    bank_id VARCHAR(64) NOT NULL CONSTRAINT FK_recon_bank FOREIGN KEY REFERENCES Main.bank_accounts(id),
    transaction_date DATE NOT NULL,
    reference_number VARCHAR(128) NULL,
    statement_amount DECIMAL(18, 4) NOT NULL,
    matched_transaction_id VARCHAR(64) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'unmatched',
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO

-- ==============================================================================
-- SECTION 4: PERFORMANCE INDEXES ACROSS ALL SCHEMAS
-- ==============================================================================
CREATE NONCLUSTERED INDEX IX_journal_branch ON Trans.journal_entries (branch_id, entry_date);
CREATE NONCLUSTERED INDEX IX_journal_lines_account ON Trans.journal_entry_lines (account_id);
CREATE NONCLUSTERED INDEX IX_sales_customer_date ON Trans.sales_invoices (customer_id, invoice_date);
CREATE NONCLUSTERED INDEX IX_sales_items_item ON Trans.sales_invoice_items (item_id);
CREATE NONCLUSTERED INDEX IX_purchases_vendor_date ON Trans.purchase_invoices (vendor_id, invoice_date);
CREATE NONCLUSTERED INDEX IX_cashflow_source ON Trans.treasury_bank_transactions (source_id, transaction_date);
CREATE NONCLUSTERED INDEX IX_items_barcode ON Main.items (barcode);
CREATE NONCLUSTERED INDEX IX_coa_parent ON Main.chart_of_accounts (parent_code);
GO

-- ==============================================================================
-- SECTION 5: FOUNDATIONAL SYSTEM BOOTSTRAP ONLY (ZERO OPERATIONAL DATA)
-- ==============================================================================
-- 1. الفرع الرئيسي
IF NOT EXISTS (SELECT 1 FROM Main.branches WHERE id = 'BR-01')
INSERT INTO Main.branches (id, code, name, city, is_main, is_active)
VALUES ('BR-01', 'BR-01', N'الفرع الرئيسي', N'الرياض', 1, 1);

-- 2. المخزن الرئيسي
IF NOT EXISTS (SELECT 1 FROM Main.warehouses WHERE id = 'WH-01')
INSERT INTO Main.warehouses (id, code, name, branch_id, is_main, is_active)
VALUES ('WH-01', 'WH-01', N'المخزن الرئيسي', 'BR-01', 1, 1);

-- 3. الخزينة الرئيسية (رصيد 0.00)
IF NOT EXISTS (SELECT 1 FROM Main.treasuries WHERE id = 'TR-01')
INSERT INTO Main.treasuries (id, code, name, branch_id, current_balance, is_main, is_active)
VALUES ('TR-01', 'TR-01', N'الخزينة الرئيسية', 'BR-01', 0.0000, 1, 1);

-- 4. البنك الرئيسي (رصيد 0.00)
IF NOT EXISTS (SELECT 1 FROM Main.bank_accounts WHERE id = 'BNK-01')
INSERT INTO Main.bank_accounts (id, code, bank_name, account_number, iban, branch_id, current_balance, is_main, is_active)
VALUES ('BNK-01', 'BNK-01', N'البنك الرئيسي', '000000000000', 'SA0000000000000000000000', 'BR-01', 0.0000, 1, 1);

-- 5. الأدوار والمستخدمين الأساسيين
IF NOT EXISTS (SELECT 1 FROM Main.system_roles WHERE id = 'ROLE-SUPERADMIN')
INSERT INTO Main.system_roles (id, code, name, description, permissions)
VALUES ('ROLE-SUPERADMIN', 'SUPERADMIN', N'مدير النظام الكامل', N'تحكم كامل بالصلاحيات والإعدادات', '["*"]');

IF NOT EXISTS (SELECT 1 FROM Main.system_users WHERE id = 'USR-01')
INSERT INTO Main.system_users (id, username, full_name, email, role_id, is_active)
VALUES ('USR-01', N'admin', N'مدير النظام الرئيسي', 'admin@vertex.internal', 'ROLE-SUPERADMIN', 1);

-- 6. إعدادات النظام الأساسية
IF NOT EXISTS (SELECT 1 FROM Main.system_settings WHERE [key] = 'system_identity')
INSERT INTO Main.system_settings ([key], [value], description)
VALUES ('system_identity', '{"companyName": "VERTEX ERP", "version": "1.0.0"}', N'بيانات تعريف النظام');

IF NOT EXISTS (SELECT 1 FROM Main.system_settings WHERE [key] = 'architecture_mode')
INSERT INTO Main.system_settings ([key], [value], description)
VALUES ('architecture_mode', '{"schemas": ["Main", "Trans", "Temp"], "operationalData": false, "status": "initialized"}', N'حالة معمارية قاعدة البيانات المنفصلة');

-- 7. دليل الحسابات المعتمد (191 حساباً برصيد 0.00 مطابقاً للمرجع النهائي)
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1', '1', N'الاصول', 'assets', N'الأصول', NULL, 1, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-11')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-11', '11', N'الاصول الثابتة', 'assets', N'الأصول', '1', 2, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1101', '1101', N'اراضى', 'assets', N'الأصول', '11', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1102', '1102', N'مبانى', 'assets', N'الأصول', '11', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1103')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1103', '1103', N'الات و معدات', 'assets', N'الأصول', '11', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1104')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1104', '1104', N'سيارات', 'assets', N'الأصول', '11', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1105')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1105', '1105', N'معدات مكتبية', 'assets', N'الأصول', '11', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1106')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1106', '1106', N'اثاث وتجهيزات و ديكورات', 'assets', N'الأصول', '11', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1107')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1107', '1107', N'مصروفات تاسيس', 'assets', N'الأصول', '11', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12', '12', N'الاصول المتداولة', 'assets', N'الأصول', '1', 2, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1201', '1201', N'نقدية بالخزينة', 'assets', N'الأصول', '12', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1202')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1202', '1202', N'نقدية بالبنوك', 'assets', N'الأصول', '12', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1203')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1203', '1203', N'اوراق القبض بالخزينة', 'assets', N'الأصول', '12', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1204')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1204', '1204', N'اوراق قبض تحت التحصيل', 'assets', N'الأصول', '12', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1205')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1205', '1205', N'المخزون', 'assets', N'الأصول', '12', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1206')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1206', '1206', N'عملاء', 'assets', N'الأصول', '12', 3, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1207')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1207', '1207', N'حسابات مدينه اخرى', 'assets', N'الأصول', '12', 3, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120701')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120701', '120701', N'تامينات لدى الغير', 'assets', N'الأصول', '1207', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070101', '12070101', N'تامين ايجارات', 'assets', N'الأصول', '120701', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070102', '12070102', N'تامين ابتدائى', 'assets', N'الأصول', '120701', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070103')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070103', '12070103', N'تامين نهائى', 'assets', N'الأصول', '120701', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120702')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120702', '120702', N'سلف عاملين', 'assets', N'الأصول', '1207', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070201', '12070201', N'سلف عاملين - موظف 1', 'assets', N'الأصول', '120702', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120703')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120703', '120703', N'عهد', 'assets', N'الأصول', '1207', 4, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120704')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120704', '120704', N'مصروفات مقدمة', 'assets', N'الأصول', '1207', 4, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120705')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120705', '120705', N'حسابات مدينه لدى المصالح والهيئات', 'assets', N'الأصول', '1207', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070501')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070501', '12070501', N'ضرائب الخصم والاضافة (مبالغ مخصومة من الشركة بمعرفة الغير)', 'assets', N'الأصول', '120705', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120707')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120707', '120707', N'جارى الفروع', 'assets', N'الأصول', '1207', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070701')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070701', '12070701', N'جارى المركز الرئيسى', 'assets', N'الأصول', '120707', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070702')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070702', '12070702', N'جارى فرع 1', 'assets', N'الأصول', '120707', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070703')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070703', '12070703', N'جارى فرع 2', 'assets', N'الأصول', '120707', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070704')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070704', '12070704', N'جارى فرع 3', 'assets', N'الأصول', '120707', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070705')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070705', '12070705', N'جارى فرع 4', 'assets', N'الأصول', '120707', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120708')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120708', '120708', N'حسابات وسيطة', 'assets', N'الأصول', '1207', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070801')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070801', '12070801', N'شراء عمله اجنبية', 'assets', N'الأصول', '120708', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12070802')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12070802', '12070802', N'التحويلات البنكية', 'assets', N'الأصول', '120708', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1208')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1208', '1208', N'اعتمادات مستندية', 'assets', N'الأصول', '12', 3, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120801')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120801', '120801', N'اعتمادات مستندية - قيمه الاعتماد', 'assets', N'الأصول', '1208', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080101', '12080101', N'اعتمادات مستندية - نسبه تامين الاعتماد', 'assets', N'الأصول', '120801', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080102', '12080102', N'اعتمادات مستندية - دفعه من قيمه الاعتماد', 'assets', N'الأصول', '120801', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080103')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080103', '12080103', N'اعتمادات مستندية - باقى قيمه الاعتماد', 'assets', N'الأصول', '120801', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120802')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120802', '120802', N'اعتمادات مستندية - مصاريف بنكية على الاعتمادات', 'assets', N'الأصول', '1208', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080201', '12080201', N'اعتمادات مستندية - مصاريف فتح اعتماد', 'assets', N'الأصول', '120802', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080202')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080202', '12080202', N'اعتمادات مستندية - رسوم تعديل اعتمادات', 'assets', N'الأصول', '120802', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080203')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080203', '12080203', N'اعتمادات مستندية - رسوم تمديد اعتمادات', 'assets', N'الأصول', '120802', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120803')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120803', '120803', N'اعتمادات مستندية - مصاريف الاعتمادات', 'assets', N'الأصول', '1208', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080301')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080301', '12080301', N'اعتمادات مستندية - مصاريف تأمين على البضاعه', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080302')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080302', '12080302', N'اعتمادات مستندية - رسوم تخليص', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080303')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080303', '12080303', N'اعتمادات مستندية - رسوم الميناء', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080304')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080304', '12080304', N'اعتمادات مستندية - رسوم ارضيات', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080305')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080305', '12080305', N'اعتمادات مستندية - رسوم تفريغ', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080306')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080306', '12080306', N'اعتمادات مستندية - رسوم جمركيه', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080307')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080307', '12080307', N'اعتمادات مستندية  - اتعاب مخلص', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080308')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080308', '12080308', N'اعتمادات مستندية - رسوم نقل البضاعه من الميناء الى المحل', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12080309')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12080309', '12080309', N'اعتمادات مستندية - اتعاب تفريغ', 'assets', N'الأصول', '120803', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-1209')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-1209', '1209', N'خطابات الضمان', 'assets', N'الأصول', '12', 3, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120901')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120901', '120901', N'قيمه خطاب الضمان', 'assets', N'الأصول', '1209', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12090101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12090101', '12090101', N'تأمين خطاب الضمان', 'assets', N'الأصول', '120901', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12090102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12090102', '12090102', N'دفعه من خطاب الضمان', 'assets', N'الأصول', '120901', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12090103')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12090103', '12090103', N'باقى قيمة خطاب الضمان', 'assets', N'الأصول', '120901', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-120902')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-120902', '120902', N'المصاريف البنكية لخطابات الضمان', 'assets', N'الأصول', '1209', 4, 'debit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12090201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12090201', '12090201', N'مصاريف فتح خطاب ضمان', 'assets', N'الأصول', '120902', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-12090202')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-12090202', '12090202', N'مصاريف تمديد خطاب الضمان', 'assets', N'الأصول', '120902', 5, 'debit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2', '2', N'الخصوم', 'liabilities', N'الخصوم', NULL, 1, 'credit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-21')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-21', '21', N'حقوق الملكية', 'equity', N'حقوق الملكية', '2', 2, 'credit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2101', '2101', N'راس المال المدفوع', 'equity', N'حقوق الملكية', '21', 3, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2102', '2102', N'ارباح العام', 'equity', N'حقوق الملكية', '21', 3, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2103')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2103', '2103', N'ارباح محتجزة', 'equity', N'حقوق الملكية', '21', 3, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2104')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2104', '2104', N'جارى الشركاء', 'equity', N'حقوق الملكية', '21', 3, 'credit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-210401')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-210401', '210401', N'جارى الشركاء - الشريك1', 'equity', N'حقوق الملكية', '2104', 4, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-210402')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-210402', '210402', N'جارى الشركاء - الشريك2', 'equity', N'حقوق الملكية', '2104', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2201', '2201', N'الموردين', 'liabilities', N'الخصوم', '22', 3, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2202')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2202', '2202', N'اوراق دفع', 'liabilities', N'الخصوم', '22', 3, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2203')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2203', '2203', N'مجمع اهلاك اصول ثابتة', 'liabilities', N'الخصوم', '22', 3, 'credit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-220301')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-220301', '220301', N'مجمع اهلاك مبانى', 'liabilities', N'الخصوم', '2203', 4, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-220302')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-220302', '220302', N'مجمع اهلاك الات و معدات', 'liabilities', N'الخصوم', '2203', 4, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-220303')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-220303', '220303', N'مجمع اهلاك سيارات', 'liabilities', N'الخصوم', '2203', 4, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-220304')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-220304', '220304', N'مجمع اهلاك معدات مكتبية', 'liabilities', N'الخصوم', '2203', 4, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-220305')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-220305', '220305', N'مجمع اهلاك اثاث وتجهيزات وديكورات', 'liabilities', N'الخصوم', '2203', 4, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2205')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2205', '2205', N'احتياطيات', 'liabilities', N'الخصوم', '22', 3, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2206')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2206', '2206', N'مخصصات', 'liabilities', N'الخصوم', '22', 3, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2207')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2207', '2207', N'حسابات دائنه اخرى', 'liabilities', N'الخصوم', '22', 3, 'credit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-220701')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-220701', '220701', N'حسابات دائنة للمصالح والهيئات', 'liabilities', N'الخصوم', '2207', 4, 'credit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-22070101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-22070101', '22070101', N'مصلحة الضرائب على المبيعات', 'liabilities', N'الخصوم', '220701', 5, 'credit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2207010101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2207010101', '2207010101', N'مصلحة الضرائب على المبيعات - مشتريات', 'liabilities', N'الخصوم', '22070101', 6, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-2207010102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-2207010102', '2207010102', N'مصلحة الضرائب على المبيعات - مبيعات', 'liabilities', N'الخصوم', '22070101', 6, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-22070102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-22070102', '22070102', N'مصلحة الضرائب العامة', 'liabilities', N'الخصوم', '220701', 5, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-22070103')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-22070103', '22070103', N'ضرائب كسب العمل', 'liabilities', N'الخصوم', '220701', 5, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-22070104')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-22070104', '22070104', N'ضرائب الخصم والاضافة / مخصومة من الغير', 'liabilities', N'الخصوم', '220701', 5, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-22070105')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-22070105', '22070105', N'الهيئة القومية للتأمين الاجتماعى ( حصة العامل+ حصة الشركة)', 'liabilities', N'الخصوم', '220701', 5, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-220702')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-220702', '220702', N'دائنو التوزيعات', 'liabilities', N'الخصوم', '2207', 4, 'credit', 0, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-22070201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-22070201', '22070201', N'حصة العاميلن فى الارباح', 'liabilities', N'الخصوم', '220702', 5, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-22070202')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-22070202', '22070202', N'حصة المساهمين التى لم توزع', 'liabilities', N'الخصوم', '220702', 5, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-220703')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-220703', '220703', N'اجور مستحقه', 'liabilities', N'الخصوم', '2207', 4, 'credit', 1, 0.0000, 'active', N'ميزانية عمومية');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3', '3', N'المصروفات', 'expenses', N'المصروفات', NULL, 1, 'debit', 0, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31', '31', N'قيمة ومصاريف وتكاليف المشتريات', 'expenses', N'المصروفات', '3', 2, 'debit', 0, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-311')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-311', '311', N'المشتريات', 'expenses', N'المصروفات', '31', 3, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-312')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-312', '312', N'مردودات المشتريات', 'expenses', N'المصروفات', '31', 3, 'credit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-313')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-313', '313', N'تحويلات اضافة - مشتريات', 'expenses', N'المصروفات', '31', 3, 'debit', 0, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31301')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31301', '31301', N'تحويلات اضافة المركز الرئيسى - مشتريات', 'expenses', N'المصروفات', '313', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31302')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31302', '31302', N'تحويلات اضافة فرع 1 - مشتريات', 'expenses', N'المصروفات', '313', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31303')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31303', '31303', N'تحويلات اضافة فرع 2 - مشتريات', 'expenses', N'المصروفات', '313', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31304')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31304', '31304', N'تحويلات اضافة فرع 3 - مشتريات', 'expenses', N'المصروفات', '313', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31305')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31305', '31305', N'تحويلات اضافة فرع 4 - مشتريات', 'expenses', N'المصروفات', '313', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-314')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-314', '314', N'تحويلات صرف للفروع - مردودات مشتريات', 'expenses', N'المصروفات', '31', 3, 'credit', 0, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31401')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31401', '31401', N'تحويلات صرف المركز الرئيسى - مردودات مشتريات', 'expenses', N'المصروفات', '314', 4, 'credit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31402')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31402', '31402', N'تحويلات صرف فرع 1 - مردودات مشتريات', 'expenses', N'المصروفات', '314', 4, 'credit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31403')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31403', '31403', N'تحويلات صرف فرع 2 - مردودات مشتريات', 'expenses', N'المصروفات', '314', 4, 'credit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31404')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31404', '31404', N'تحويلات صرف فرع 3 - مردودات مشتريات', 'expenses', N'المصروفات', '314', 4, 'credit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31405')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31405', '31405', N'تحويلات صرف فرع 4 - مردودات مشتريات', 'expenses', N'المصروفات', '314', 4, 'credit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-315')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-315', '315', N'مصاريف وتكاليف المشتريات', 'expenses', N'المصروفات', '31', 3, 'debit', 0, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31501')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31501', '31501', N'مصاريف نقل المشتريات', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31502')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31502', '31502', N'مصاريف تأمين على البضاعه', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31503')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31503', '31503', N'رسوم تخليص', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31504')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31504', '31504', N'رسوم الميناء', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31505')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31505', '31505', N'رسوم ارضيات', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31506')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31506', '31506', N'رسوم تفريغ', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31507')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31507', '31507', N'رسوم جمركيه', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31508')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31508', '31508', N'اتعاب مخلص', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31509')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31509', '31509', N'رسوم نقل البضاعه من الميناء الى المحل', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-31510')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-31510', '31510', N'اتعاب تفريغ', 'expenses', N'المصروفات', '315', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32', '32', N'مصاريف غير مباشره', 'expenses', N'المصروفات', '3', 2, 'credit', 0, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3201', '3201', N'مصروفات عمومية وادارية', 'expenses', N'المصروفات', '32', 3, 'debit', 0, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320101', '320101', N'الأجور والمرتبات', 'expenses', N'المصروفات', '3201', 4, 'debit', 0, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32010101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32010101', '32010101', N'مرتب موظف 1', 'expenses', N'المصروفات', '320101', 5, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32010102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32010102', '32010102', N'مرتب موظف 2', 'expenses', N'المصروفات', '320101', 5, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320102', '320102', N'التامينات الاجتماعية', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320103')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320103', '320103', N'مصاريف تليفون', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320104')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320104', '320104', N'مصاريف موبايل', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320105')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320105', '320105', N'مصاريف كهرباء', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320106')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320106', '320106', N'مصاريف مياه', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320107')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320107', '320107', N'مصاريف غاز', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320108')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320108', '320108', N'انتقالات ومصاريف سفر', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320109')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320109', '320109', N'اشتراك انترنت', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320110')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320110', '320110', N'ادوات كتابيه', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320111')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320111', '320111', N'مطبوعات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320112')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320112', '320112', N'تصوير مستندات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320113')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320113', '320113', N'جرائد ومجلات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320114')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320114', '320114', N'مصروفات وادوات نظافة', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320115')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320115', '320115', N'مصاريف بوفيه', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320116')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320116', '320116', N'صيانه واصلاحات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320117')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320117', '320117', N'ايجارات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320118')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320118', '320118', N'مصروفات سيارات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320119')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320119', '320119', N'رسوم ودمغه واشتراكات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320120')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320120', '320120', N'مصاريف بريد وفاكس', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320121')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320121', '320121', N'تبرعات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320122')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320122', '320122', N'مصروفات طبيه وعلاج', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320123')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320123', '320123', N'اتعاب مراجعه حسابات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320124')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320124', '320124', N'اتعاب محاماه واستشارات قانونية', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320125')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320125', '320125', N'اتعاب ضرائب وتقييد دفاتر', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320126')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320126', '320126', N'مصاريف قضائية', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320127')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320127', '320127', N'عينات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320128')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320128', '320128', N'غرامات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320129')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320129', '320129', N'اكراميات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320130')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320130', '320130', N'متنوعات ونثريات', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320131')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320131', '320131', N'اقساط تأمين', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320132')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320132', '320132', N'مصاريف بنكية', 'expenses', N'المصروفات', '3201', 4, 'debit', 0, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32013201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32013201', '32013201', N'عموله تحصيل شيكات', 'expenses', N'المصروفات', '320132', 5, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32013202')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32013202', '32013202', N'مصاريف اصدار دفتر شيكات', 'expenses', N'المصروفات', '320132', 5, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32013203')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32013203', '32013203', N'عموله اعلى رصيد مدين', 'expenses', N'المصروفات', '320132', 5, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32013204')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32013204', '32013204', N'عموله 2.5 %', 'expenses', N'المصروفات', '320132', 5, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320133')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320133', '320133', N'برامج كمبيوتر', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320134')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320134', '320134', N'مصاريف كراسة شروط مناقصه', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320139')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320139', '320139', N'اشتراك الغرفة التجارية', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320144')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320144', '320144', N'تجديد السجل التجارى ( الاشتراك السنوى )', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320149')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320149', '320149', N'تسجيل بورصة الاوراق المالية', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320154')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320154', '320154', N'مصاريف حراسة', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320159')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320159', '320159', N'ادوات حريق', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320164')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320164', '320164', N'تسويات خزينه عجز أو زيادة', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320169')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320169', '320169', N'تسويات عجز وزياده مخزن', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320174')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320174', '320174', N'م ضيافه واستقبال', 'expenses', N'المصروفات', '3201', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3202')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3202', '3202', N'مصروفات بيع وتوزيع', 'expenses', N'المصروفات', '32', 4, 'debit', 0, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320201', '320201', N'دعاية واعلان', 'expenses', N'المصروفات', '3202', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320202')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320202', '320202', N'مصاريف معارض', 'expenses', N'المصروفات', '3202', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320203')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320203', '320203', N'عمولات  المبيعات والتحصيل', 'expenses', N'المصروفات', '3202', 4, 'debit', 0, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32020301')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32020301', '32020301', N'عموله مبيعات', 'expenses', N'المصروفات', '320203', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-32020302')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-32020302', '32020302', N'عموله تحصيل', 'expenses', N'المصروفات', '320203', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320204')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320204', '320204', N'خصم مسموح به', 'expenses', N'المصروفات', '3202', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320205')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320205', '320205', N'خصم تعجيل دفع', 'expenses', N'المصروفات', '3202', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-320206')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-320206', '320206', N'مصاريف نقل مبيعات - شحن', 'expenses', N'المصروفات', '3202', 4, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3203')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3203', '3203', N'مصروفات اهلاك', 'expenses', N'المصروفات', '32', 3, 'debit', 0, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3401')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3401', '3401', N'مصرةفات اهلاك مبانى', 'expenses', N'المصروفات', '3203', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3402')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3402', '3402', N'مصروفات اهلاك الات و معدات', 'expenses', N'المصروفات', '3203', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3403')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3403', '3403', N'مصروفات اهلاك سيارات', 'expenses', N'المصروفات', '3203', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3404')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3404', '3404', N'مصروفات اهلاك معدات مكتبية', 'expenses', N'المصروفات', '3203', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-3405')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-3405', '3405', N'مصروفات اهلاك اثاث وتجهيزات وديكورات', 'expenses', N'المصروفات', '3203', 4, 'debit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-4')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-4', '4', N'الايرادات', 'revenue', N'الإيرادات', NULL, 1, 'credit', 0, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-4101')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-4101', '4101', N'مبيعات', 'revenue', N'الإيرادات', '41', 3, 'credit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-4102')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-4102', '4102', N'مردودات مبيعات', 'revenue', N'الإيرادات', '41', 3, 'debit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-4103')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-4103', '4103', N'خصم مكتسب', 'revenue', N'الإيرادات', '41', 3, 'credit', 1, 0.0000, 'active', N'ح/متاجرة');
IF NOT EXISTS (SELECT 1 FROM Main.chart_of_accounts WHERE id = 'COA-4201')
INSERT INTO Main.chart_of_accounts (id, code, name, category, category_label, parent_code, level, nature, is_leaf, balance, status, notes)
VALUES ('COA-4201', '4201', N'ايرادات اخرى', 'revenue', N'الإيرادات', '42', 3, 'credit', 1, 0.0000, 'active', N'ح/ارباح وخسائر');

GO

-- ==============================================================================
-- END OF SEPARATE VERTEX SQL DATABASE ARCHITECTURE SPECIFICATION
-- ==============================================================================
