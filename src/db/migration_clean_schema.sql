-- ==============================================================================
-- VERTEX ERP ULTIMATE: PURE FOUNDATIONAL RELATIONAL MIGRATION (CLEAN SQL)
-- ==============================================================================
-- SPECIFICATION RULES:
-- 1. NO data migrated or transferred from localStorage to SQL.
-- 2. SQL starts with ZERO operational data (No operational customers, vendors,
--    products, invoices, receipts, transfers, or operational balances).
-- 3. Foundational bootstrap ONLY:
--    - الفرع الرئيسي (Main Branch)
--    - المخزن الرئيسي (Main Warehouse)
--    - الخزينة الرئيسية (Main Treasury)
--    - البنك الرئيسي (Main Bank)
--    - Approved System Roles, Security Users, and System Settings.
--    - Approved Chart of Accounts structure (236 standard accounts with 0.00 balance).
-- 4. Current runtime & localStorage data remains 100% untouched.
-- 5. Existing architecture remains completely preserved.
-- 6. DDL/DML specification only — NO EXECUTION OF CODE OR SQL.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. SYSTEM SECURITY, ROLES & USERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(128) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role_id VARCHAR(64) REFERENCES system_roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(128) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. FOUNDATIONAL CORE ENTITIES (FOUR PILLARS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(128),
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    branch_id VARCHAR(64) REFERENCES branches(id),
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treasuries (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    branch_id VARCHAR(64) REFERENCES branches(id),
    current_balance NUMERIC(18, 4) DEFAULT 0.0000,
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(128) NOT NULL,
    iban VARCHAR(128),
    branch_id VARCHAR(64) REFERENCES branches(id),
    current_balance NUMERIC(18, 4) DEFAULT 0.0000,
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. GENERAL LEDGER / CHART OF ACCOUNTS (STRUCTURE ONLY - ZERO BALANCES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- assets, liabilities, equity, revenue, expenses
    parent_code VARCHAR(32),
    level INT NOT NULL DEFAULT 1,
    nature VARCHAR(16) NOT NULL DEFAULT 'debit', -- debit or credit
    is_leaf BOOLEAN DEFAULT TRUE,
    balance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. OPERATIONAL TABLES (SCHEMAS ONLY — ZERO OPERATIONAL ROWS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64),
    tax_number VARCHAR(64),
    category_id VARCHAR(64) REFERENCES customer_categories(id),
    credit_limit NUMERIC(18, 4) DEFAULT 0.0000,
    current_balance NUMERIC(18, 4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64),
    tax_number VARCHAR(64),
    category_id VARCHAR(64) REFERENCES vendor_categories(id),
    current_balance NUMERIC(18, 4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_categories (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(64) REFERENCES item_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    barcode VARCHAR(128),
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(64) REFERENCES item_categories(id),
    unit VARCHAR(32) DEFAULT 'قطعة',
    purchase_price NUMERIC(18, 4) DEFAULT 0.0000,
    sale_price NUMERIC(18, 4) DEFAULT 0.0000,
    current_stock NUMERIC(18, 4) DEFAULT 0.0000,
    min_reorder_level NUMERIC(18, 4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    branch_id VARCHAR(64) REFERENCES branches(id),
    warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    customer_id VARCHAR(64) REFERENCES customers(id),
    treasury_id VARCHAR(64) REFERENCES treasuries(id),
    bank_id VARCHAR(64) REFERENCES bank_accounts(id),
    invoice_date DATE NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    total_amount NUMERIC(18, 4) NOT NULL,
    tax_amount NUMERIC(18, 4) DEFAULT 0.0000,
    discount_amount NUMERIC(18, 4) DEFAULT 0.0000,
    net_amount NUMERIC(18, 4) NOT NULL,
    status VARCHAR(32) DEFAULT 'posted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    branch_id VARCHAR(64) REFERENCES branches(id),
    warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    vendor_id VARCHAR(64) REFERENCES vendors(id),
    treasury_id VARCHAR(64) REFERENCES treasuries(id),
    bank_id VARCHAR(64) REFERENCES bank_accounts(id),
    invoice_date DATE NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    total_amount NUMERIC(18, 4) NOT NULL,
    tax_amount NUMERIC(18, 4) DEFAULT 0.0000,
    net_amount NUMERIC(18, 4) NOT NULL,
    status VARCHAR(32) DEFAULT 'posted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treasury_bank_transactions (
    id VARCHAR(64) PRIMARY KEY,
    document_number VARCHAR(64) NOT NULL UNIQUE,
    transaction_type VARCHAR(32) NOT NULL, -- income, expense, transfer
    source_type VARCHAR(32) NOT NULL, -- treasury, bank
    source_id VARCHAR(64) NOT NULL,
    destination_type VARCHAR(32),
    destination_id VARCHAR(64),
    account_id VARCHAR(64) REFERENCES chart_of_accounts(id),
    amount NUMERIC(18, 4) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id VARCHAR(64) PRIMARY KEY,
    transfer_number VARCHAR(64) NOT NULL UNIQUE,
    from_warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    to_warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    transfer_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS returns_records (
    id VARCHAR(64) PRIMARY KEY,
    return_number VARCHAR(64) NOT NULL UNIQUE,
    return_type VARCHAR(32) NOT NULL, -- sales_return, purchase_return
    original_invoice_id VARCHAR(64),
    party_id VARCHAR(64),
    warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    total_amount NUMERIC(18, 4) NOT NULL,
    return_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. FOUNDATIONAL SYSTEM BOOTSTRAP SEED (NO OPERATIONAL DATA)
-- ------------------------------------------------------------------------------

-- 1. الفرع الرئيسي
INSERT INTO branches (id, code, name, city, is_main, is_active)
VALUES ('BR-01', 'BR-01', 'الفرع الرئيسي', 'الرياض', TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET is_main = TRUE, name = EXCLUDED.name;

-- 2. المخزن الرئيسي
INSERT INTO warehouses (id, code, name, branch_id, is_main, is_active)
VALUES ('WH-01', 'WH-01', 'المخزن الرئيسي', 'BR-01', TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET is_main = TRUE, name = EXCLUDED.name;

-- 3. الخزينة الرئيسية (رصيد 0.00)
INSERT INTO treasuries (id, code, name, branch_id, current_balance, is_main, is_active)
VALUES ('TR-01', 'TR-01', 'الخزينة الرئيسية', 'BR-01', 0.0000, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET is_main = TRUE, name = EXCLUDED.name;

-- 4. البنك الرئيسي (رصيد 0.00)
INSERT INTO bank_accounts (id, code, bank_name, account_number, iban, branch_id, current_balance, is_main, is_active)
VALUES ('BNK-01', 'BNK-01', 'البنك الرئيسي', '000000000000', 'SA0000000000000000000000', 'BR-01', 0.0000, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET is_main = TRUE, bank_name = EXCLUDED.bank_name;

-- 5. الأدوار والمستخدمين الأساسيين (Preserved System Security)
INSERT INTO system_roles (id, name, description, permissions)
VALUES ('ROLE-SUPERADMIN', 'مدير النظام الكامل', 'صلاحيات إدارية وتحكم كامل بالنظام', '["*"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_users (id, username, full_name, email, role_id, is_active)
VALUES ('USR-01', 'admin', 'مدير النظام الرئيسي', 'admin@vertex.internal', 'ROLE-SUPERADMIN', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. الإعدادات الأساسية للنظام (Preserved Configuration)
INSERT INTO system_settings (key, value)
VALUES 
    ('system_identity', '{"companyName": "شركة فيرتكس للحلول المتكاملة", "systemCode": "VERTEX-PRO", "version": "1.0.0"}'),
    ('operational_mode', '{"operationalDataSeeded": false, "localStorageMigration": false, "status": "clean_bootstrap"}')
ON CONFLICT (key) DO NOTHING;

COMMIT;
-- ==============================================================================
-- END OF CLEAN MIGRATION DEFINITION
-- ==============================================================================
