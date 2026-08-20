# Enterprise Indian Fintech Platform — Architectural Blueprint & Master Plan

## 1. Executive Summary & Vision

This blueprint outlines the complete design for a production-grade, multi-tenant Indian Fintech & Digital Financial Services Platform built on the **PERN stack (PostgreSQL, Express.js, React + Vite, Node.js + TypeScript)**.

Inspired by the comprehensive service categories of high-volume Indian B2B retailer portals (as exemplified in modern platforms like SekurePe), this system provides an all-in-one ecosystem for:
- **Banking Services**: Domestic Money Transfer (DMT), Aadhaar Enabled Payment System (AePS), Aadhaar Pay, UPI ATM, Micro-ATM.
- **Utility & Recharges**: Mobile (Prepaid/Postpaid), DTH, FASTag, Electricity, Water, Gas, Broadband, Landline, Municipal Tax (BBPS).
- **Payment Collections**: Dynamic & Static UPI QR, Cash Management Services (CMS), Credit Card Bill Payment, Digikhata Virtual Accounts.
- **Value Added Services**: Travel (Bus, Flight, Train, Hotel booking).
- **Core Financial Engine**: Double-entry accounting ledger, multi-pocket wallets, real-time hierarchical commission distribution (Super Admin $\rightarrow$ Master Distributor $\rightarrow$ Distributor $\rightarrow$ Retailer), automated bank payouts/settlements, two-way/three-way reconciliation, and fraud prevention.

```
+-------------------------------------------------------------------------------------------------------------+
|                                        ENTERPRISE FINTECH PLATFORM                                          |
+-------------------------------------------------------------------------------------------------------------+
|  [ Retailer Web Portal ]       [ Distributor Portal ]       [ Admin / Ops Console ]       [ Mobile App PWA ] |
+-------------------------------------------------------------------------------------------------------------+
                                                     | (HTTPS / TLS 1.3 / mTLS / WAF / Cloudflare)
                                                     v
+-------------------------------------------------------------------------------------------------------------+
|                             API GATEWAY & REVERSE PROXY (Nginx / Rate Limiter / WAF)                        |
|   - DDOS Protection | IP Whitelisting | SSL Termination | Request Fingerprinting | Strict CORS & Headers   |
+-------------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+-------------------------------------------------------------------------------------------------------------+
|                                    CORE BACKEND ENGINE (Node.js + TypeScript)                               |
|                                                                                                             |
|  +-------------------------------------------------------------------------------------------------------+  |
|  | Security & Auth: JWT (Sliding Session) | TOTP 2FA | RBAC Matrix | KMS Crypto | Request Idempotency     |  |
|  +-------------------------------------------------------------------------------------------------------+  |
|  | Business Modules: DMT Engine | BBPS/Recharge | AePS Switch | Commission Slabs | Settlement Engine     |  |
|  +-------------------------------------------------------------------------------------------------------+  |
|  | Financial Core: Double-Entry Immutable Ledger | ACID Wallet Locks | Multi-Pocket Balance Manager      |  |
|  +-------------------------------------------------------------------------------------------------------+  |
|  | Risk & Ops: Velocity Guard | Fraud Monitor | Auto-Reconciliation | Queue Worker (BullMQ) | Audit Trail|  |
|  +-------------------------------------------------------------------------------------------------------+  |
|  | Provider Abstraction Layer (Failover Routing | Circuit Breaker | Signature Engine | Mock Provider)   |  |
+-------------------------------------------------------------------------------------------------------------+
           |                                         |                                         |
           v                                         v                                         v
+-----------------------+                 +-----------------------+                 +---------------------+
|  PostgreSQL 16 (ACID) |                 |     Redis 7 (Cache)   |                 | External Providers  |
| - Row-Level Locks     |                 | - Distributed Locks   |                 | - Banking Partners  |
| - Immutable Ledger    |                 | - Rate Limiter Tokens |                 | - BBPS / Billers    |
| - Partitioned Audits  |                 | - Session Store       |                 | - DMT & AePS Switches|
| - Read/Write Replicas |                 | - BullMQ Job Queues   |                 | - SMS / WA Gateways |
+-----------------------+                 +-----------------------+                 +---------------------+
```

---

## 2. Requirements & Business Domain Analysis

### 2.1 Multi-Tier Distribution Hierarchy
Indian fintech distribution networks rely on a multi-tiered hierarchy where margins are split instantly on successful transactions:
1. **Platform Owner / Super Admin**: Manages master commission packages, provider routing, risk limits, liquidity/escrow pools, and dispute resolutions.
2. **Master Distributor (MD) / Super Distributor**: Manages a large geographic network of Distributors and Retailers, with custom markup/commission slabs.
3. **Distributor (Dist)**: Manages local Retailers/Agents, assists with KYC, credit management, and wallet top-ups.
4. **Retailer / Agent (BC - Business Correspondent)**: Frontline shopkeeper who conducts customer-facing transactions (DMT, AePS, Recharge, BBPS) using their pre-funded wallet or AePS cash limit.
5. **End Customer**: Citizen receiving remittances, paying utility bills, or withdrawing cash via AePS at the agent shop.

### 2.2 Core Financial Principles (Non-Negotiable)
1. **Never directly mutate balances**: All balance changes must be the result of balancing `Debit` and `Credit` entries in an immutable double-entry ledger within a single database transaction.
2. **Idempotency on all mutating endpoints**: Every transaction request requires an `X-Idempotency-Key` header with TTL tracking to prevent double charges on retries, network glitches, or user double-clicking.
3. **Race Condition Prevention**: Enforce pessimistic row-level locking (`SELECT ... FOR UPDATE`) in PostgreSQL combined with Redis-based distributed mutex locks (`Redlock`) on wallet IDs during financial operations.
4. **Three-State Transaction Lifecycle**:
   - `PENDING` $\rightarrow$ Funds held in escrow/hold pocket; Provider API invoked.
   - `SUCCESS` $\rightarrow$ Provider confirmed success; Funds permanently debited from hold; Commission journal lines posted to retailer, distributor, and platform accounts.
   - `FAILED` $\rightarrow$ Provider confirmed failure; Hold released immediately back to retailer's available balance; Audit trail logged.
   - `DEEMED / TIMEOUT (Processing)` $\rightarrow$ Provider response timed out or returned pending; Kept in `PROCESSING` state; Auto-reconciliation worker polls provider status; Dispute resolution enabled.

---

## 3. Complete Module Architecture

```
d:\Clients\MoneyTransfer/
├── packages/
│   ├── backend/               # Node.js + Express + TypeScript Core
│   │   ├── src/
│   │   │   ├── config/        # Environment, Database, Redis, KMS, Logger
│   │   │   ├── core/          # Ledger, Idempotency, Database Transaction wrapper, Crypto, Lock Manager
│   │   │   ├── middlewares/   # Auth, RBAC, RateLimit, Validate, SecurityHeaders, RequestLogger, Idempotency
│   │   │   ├── modules/
│   │   │   │   ├── auth/              # JWT, TOTP MFA, Password Hashing, Device Binding, Session Manager
│   │   │   │   ├── user/              # User Profile, Hierarchy Tree, Roles & Permissions
│   │   │   │   ├── kyc/               # Aadhaar OTP, PAN OCR, Bank Penny Drop, Video KYC, Document Vault
│   │   │   │   ├── wallet/            # Main Bal, AePS Bal, Credit Bal, Hold Bal, Fund Request
│   │   │   │   ├── ledger/            # Chart of Accounts, Journal Entries, Debit/Credit Engine, Balance Verification
│   │   │   │   ├── dmt/               # Remitter Reg, Beneficiary Mgmt, IMPS/NEFT Transaction Switch
│   │   │   │   ├── recharge/          # Mobile Prepaid/Postpaid, DTH, Operator/Plan Fetch, Instant Switch
│   │   │   │   ├── bbps/              # Bharat BillPay Engine, Biller Search, Bill Fetch, Bill Pay
│   │   │   │   ├── fastag/            # FASTag Vehicle Search, Operator Lookup, Instant Recharge
│   │   │   │   ├── aeps/              # AePS CW/BE/MS, Aadhaar Pay, RD Service PID Validator, Bio-security
│   │   │   │   ├── upi/               # Dynamic UPI QR, Static QR, Virtual Accounts, Webhook Collector
│   │   │   │   ├── cms/               # Cash Management Services, Partner Collection Points
│   │   │   │   ├── travel/            # Bus, Flight, Hotel Provider Engine & Booking Flow
│   │   │   │   ├── commission/        # Slab Matrices, Dynamic Calculation, Instant Multi-Level Split
│   │   │   │   ├── settlement/        # Payout to Agent Bank (IMPS/NEFT), 24x7 Settlement Switch
│   │   │   │   ├── reconciliation/    # 2-Way / 3-Way Auto-Recon, Bank Statement Parser, Dispute Queue
│   │   │   │   ├── fraud/             # Velocity Engine, Risk Rules, Geo-fencing, Device Fingerprinting
│   │   │   │   ├── notification/      # SMS (DLT compliant), WhatsApp, Email, In-App Notifications
│   │   │   │   ├── support/           # Helpdesk Tickets, Complaint Tracking, SLA Matrix
│   │   │   │   ├── reports/           # Account Statements, Daily Turnover, GSTR-1 Data, Download (PDF/Excel)
│   │   │   │   └── audit/             # Tamper-evident Audit Logs, Security Event Tracker
│   │   │   ├── providers/             # Provider Abstraction Layer
│   │   │   │   ├── base/              # IProviderAdapter, CircuitBreaker, ProviderRegistry
│   │   │   │   ├── dmt/               # DMT Providers (Provider A, Provider B, Mock Provider)
│   │   │   │   ├── recharge/          # Recharge Providers (Provider X, Provider Y, Mock Provider)
│   │   │   │   ├── bbps/              # BBPS Aggregators (Setu, PaySprint, Mock Provider)
│   │   │   │   ├── aeps/              # AePS Bank Switches (Fino, ICICI, Mock Switch)
│   │   │   │   └── payout/            # Bank Payout Adapters (Cashfree, RazorpayX, Decentro, Mock)
│   │   │   ├── jobs/                  # BullMQ Workers (Reconciliation, Webhook Retries, Settlement Cron)
│   │   │   └── server.ts              # Express App & Server Initialization
│   │   ├── tests/                     # Unit, Integration, and Financial Invariant Tests
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── frontend/              # React 18 + TypeScript + Vite + Tailwind CSS
│   │   ├── src/
│   │   │   ├── assets/        # SVGs, Logos, Illustrations
│   │   │   ├── components/    # Reusable UI library (Buttons, Modals, Tables, Forms, StatCards, Receipts)
│   │   │   ├── layouts/       # DashboardLayout (Sidebar, Sticky Header, Wallet Balances, Live Ticker)
│   │   │   ├── pages/         # Dashboard, DMT, AePS, Recharge, BBPS, FASTag, Settlement, Ledger, Reports
│   │   │   ├── hooks/         # useAuth, useWallet, useIdempotency, usePermission, useTransaction
│   │   │   ├── services/      # Axios API Client, Secure Interceptors, Error Parsers
│   │   │   ├── store/         # Zustand State Stores (Auth, Wallet, Notification, UI Theme)
│   │   │   ├── types/         # Strict TypeScript DTOs matching backend schema
│   │   │   └── utils/         # Currency formatters (INR ₹), Date helpers, Receipt Generator
│   │   ├── index.html
│   │   ├── tailwind.config.js
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── shared/                # Shared TypeScript contracts, DTOs, Enums, Error Codes
│       ├── src/
│       │   ├── enums/         # TxStatus, ServiceType, Role, LedgerAccountType, PocketType
│       │   ├── dto/           # Request/Response payloads
│       │   └── errors/        # Standardized Error codes
│       └── package.json
│
├── docker/                    # Docker Compose, Nginx Config, Postgres Init Scripts
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── postgres-init/
└── .github/workflows/         # CI/CD Pipelines (Lint, Test, Build, Trivy Security Scan)
```

---

## 4. Comprehensive PostgreSQL Database Schema

### 4.1 Schema Overview & Invariant Rules
- All primary keys use `UUIDv7` or indexed `UUIDv4`.
- All monetary amounts are stored in `BIGINT` representing **Paisa** (e.g., ₹100.50 = `10050`) to eliminate floating-point arithmetic errors.
- Ledger entries are strictly immutable (append-only, no `UPDATE` or `DELETE` allowed via database triggers).
- Check constraints ensure `debit_amount >= 0` and `credit_amount >= 0`.

### 4.2 Core Tables Architecture

```sql
-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MASTER_DISTRIBUTOR', 'DISTRIBUTOR', 'RETAILER', 'API_USER');
CREATE TYPE user_status AS ENUM ('PENDING_KYC', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'DORMANT');
CREATE TYPE kyc_status AS ENUM ('NOT_SUBMITTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');
CREATE TYPE pocket_type AS ENUM ('MAIN', 'AEPS', 'CREDIT', 'HOLD');
CREATE TYPE tx_status AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED', 'DISPUTED');
CREATE TYPE service_type AS ENUM ('DMT', 'RECHARGE', 'BBPS', 'FASTAG', 'AEPS_CW', 'AEPS_BE', 'AEPS_MS', 'AADHAAR_PAY', 'UPI_QR', 'CMS', 'TRAVEL', 'SETTLEMENT', 'WALLET_TRANSFER');
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- 2. USERS & HIERARCHY
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(32) UNIQUE NOT NULL, -- e.g., RET-100234, DIST-50012
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'PENDING_KYC',
    full_name VARCHAR(150) NOT NULL,
    shop_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL, -- 4/6 digit transaction PIN
    mfa_secret VARCHAR(128),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    parent_user_id UUID REFERENCES users(id), -- Hierarchy link (Retailer -> Dist -> MD -> Admin)
    commission_package_id UUID,
    kyc_status kyc_status DEFAULT 'NOT_SUBMITTED',
    failed_login_attempts INT DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_parent ON users(parent_user_id);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_role_status ON users(role, status);

-- 3. KYC DOCUMENTS & VERIFICATION
CREATE TABLE kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pan_number VARCHAR(10),
    pan_name VARCHAR(150),
    pan_verified BOOLEAN DEFAULT FALSE,
    aadhaar_reference VARCHAR(64), -- Masked/Tokenized; NO raw Aadhaar stored
    aadhaar_verified BOOLEAN DEFAULT FALSE,
    gst_number VARCHAR(20),
    bank_account_number VARCHAR(35),
    bank_ifsc VARCHAR(15),
    bank_beneficiary_name VARCHAR(150),
    bank_penny_drop_status VARCHAR(20),
    video_kyc_url VARCHAR(500),
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    rejection_reason TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WALLET & MULTI-POCKET MANAGEMENT
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    main_balance BIGINT NOT NULL DEFAULT 0 CHECK (main_balance >= 0),        -- In Paise (₹1 = 100)
    aeps_balance BIGINT NOT NULL DEFAULT 0 CHECK (aeps_balance >= 0),        -- Separate settlement pocket
    credit_balance BIGINT NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),    -- Credit line balance
    hold_balance BIGINT NOT NULL DEFAULT 0 CHECK (hold_balance >= 0),        -- In-flight transactions
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 1, -- Optimistic locking version
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallets_user ON wallets(user_id);

-- 5. DOUBLE-ENTRY FINANCIAL LEDGER (Immutable Core)
CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(64) UNIQUE NOT NULL, -- e.g., ACC_USER_{id}_MAIN, ACC_ESCROW_DMT, ACC_FEE_REVENUE
    name VARCHAR(150) NOT NULL,
    type account_type NOT NULL,
    user_id UUID REFERENCES users(id),
    pocket pocket_type,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(64) UNIQUE NOT NULL, -- Auto-sequenced financial reference
    transaction_id UUID,                      -- Linked core transaction
    idempotency_key VARCHAR(128) UNIQUE,
    service_type service_type NOT NULL,
    description TEXT NOT NULL,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_journal_tx ON journal_entries(transaction_id);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit_amount BIGINT NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
    credit_amount BIGINT NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
    balance_after BIGINT NOT NULL, -- Running balance snapshot
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0)
    )
);
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- 6. CORE TRANSACTIONS & SERVICE RECORDS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(64) UNIQUE NOT NULL, -- Public txn ID: TXN_20260817_93847291
    user_id UUID NOT NULL REFERENCES users(id),
    service_type service_type NOT NULL,
    status tx_status NOT NULL DEFAULT 'INITIATED',
    gross_amount BIGINT NOT NULL CHECK (gross_amount > 0), -- Total requested amount in Paise
    fee_amount BIGINT NOT NULL DEFAULT 0,                  -- Surcharge / Fee in Paise
    commission_amount BIGINT NOT NULL DEFAULT 0,           -- Total commission distributed
    net_amount BIGINT NOT NULL,                            -- gross + fee - commission
    provider_id VARCHAR(50),                               -- e.g., 'PAYSPRINT', 'SETU', 'FINO', 'MOCK'
    provider_reference_id VARCHAR(100),                    -- Provider RR Number / UTR
    provider_status VARCHAR(50),
    provider_response JSONB,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    client_ip VARCHAR(45),
    user_agent TEXT,
    device_id VARCHAR(100),
    lat NUMERIC(9,6),
    lon NUMERIC(9,6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_service ON transactions(service_type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_provider_ref ON transactions(provider_reference_id);

-- 7. SERVICE SPECIFIC DETAIL TABLES
CREATE TABLE dmt_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    remitter_mobile VARCHAR(15) NOT NULL,
    remitter_name VARCHAR(150) NOT NULL,
    beneficiary_name VARCHAR(150) NOT NULL,
    beneficiary_account VARCHAR(35) NOT NULL,
    beneficiary_ifsc VARCHAR(15) NOT NULL,
    bank_name VARCHAR(100),
    channel VARCHAR(10) NOT NULL DEFAULT 'IMPS', -- 'IMPS' or 'NEFT'
    bank_rrn VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recharge_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    operator_code VARCHAR(30) NOT NULL,
    circle_code VARCHAR(30) NOT NULL,
    consumer_number VARCHAR(50) NOT NULL, -- Mobile number or DTH VC Number
    recharge_type VARCHAR(20) NOT NULL,   -- PREPAID, POSTPAID, DTH
    operator_reference VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bbps_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    biller_id VARCHAR(50) NOT NULL,
    biller_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- ELECTRICITY, WATER, GAS, BROADBAND, FASTAG
    consumer_identifier VARCHAR(100) NOT NULL, -- Customer ID / Meter Number
    bill_number VARCHAR(100),
    bill_date DATE,
    due_date DATE,
    bbps_reference_id VARCHAR(100),
    payment_mode VARCHAR(20) DEFAULT 'WALLET',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE aeps_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    aadhaar_last_four VARCHAR(4) NOT NULL, -- Masked Aadhaar (ONLY last 4 digits allowed)
    bank_iin VARCHAR(10) NOT NULL,         -- Institution Identification Number
    bank_name VARCHAR(100) NOT NULL,
    device_make VARCHAR(50),
    device_model VARCHAR(50),
    device_serial_number VARCHAR(100),     -- Terminal identification
    stan VARCHAR(30),                      -- Systems Trace Audit Number
    rrn VARCHAR(50),                       -- Retrieval Reference Number
    auth_code VARCHAR(50),
    balance_amount BIGINT,                 -- Customer remaining balance (if returned)
    mini_statement JSONB,                  -- Mini statement rows (if applicable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. COMMISSION SLABS & REAL-TIME SPLIT
CREATE TABLE commission_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE commission_slabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES commission_packages(id) ON DELETE CASCADE,
    service_type service_type NOT NULL,
    min_amount BIGINT NOT NULL, -- In Paise
    max_amount BIGINT NOT NULL, -- In Paise
    calc_type VARCHAR(10) NOT NULL, -- 'FLAT' (Paise) or 'PERCENT' (Basis points, e.g. 15 = 0.15%)
    retailer_val BIGINT NOT NULL,
    distributor_val BIGINT NOT NULL,
    master_dist_val BIGINT NOT NULL,
    tds_percentage NUMERIC(5,2) DEFAULT 5.00, -- 5% TDS under Section 194H
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SETTLEMENT & PAYOUTS
CREATE TABLE settlement_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    account_number VARCHAR(35) NOT NULL,
    ifsc_code VARCHAR(15) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_holder_name VARCHAR(150) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    penny_drop_ref VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE settlement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    settlement_account_id UUID NOT NULL REFERENCES settlement_accounts(id),
    amount BIGINT NOT NULL CHECK (amount > 0),
    payout_mode VARCHAR(10) NOT NULL DEFAULT 'IMPS', -- 'IMPS', 'NEFT', 'RTGS'
    charge_amount BIGINT NOT NULL DEFAULT 0,
    status tx_status NOT NULL DEFAULT 'PENDING',
    bank_utr VARCHAR(64),
    failure_reason TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. RECONCILIATION & DISPUTES
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(32) UNIQUE NOT NULL,
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_REVIEW, RESOLVED_REFUNDED, REJECTED
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS & SECURITY AUDITING
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    old_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

---

## 5. API Architecture & Standardized Contract

### 5.1 Base URL & Headers
All requests are served under `/api/v1/...` with standard security and context headers:
```http
POST /api/v1/dmt/transfer HTTP/1.1
Host: api.fintechplatform.in
Authorization: Bearer <JWT_ACCESS_TOKEN>
X-Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
X-Device-ID: dev_93847291837
X-Client-Version: 1.0.0
X-Request-Signature: <HMAC_SHA256_PAYLOAD_SIGNATURE>
Content-Type: application/json
```

### 5.2 Standard Response Structure (RFC 7807 Compliant)
**Success Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2026-08-17T16:07:00.000Z",
  "data": {
    "referenceId": "TXN_20260817_83921",
    "status": "SUCCESS",
    "grossAmount": 500000,
    "fee": 1000,
    "commission": 1500,
    "netDebited": 500000,
    "closingBalance": 7081098,
    "bankRrn": "623019283749",
    "receiptUrl": "/api/v1/reports/receipt/TXN_20260817_83921"
  }
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "statusCode": 422,
  "errorCode": "INSUFFICIENT_WALLET_BALANCE",
  "message": "Wallet available balance (₹450.00) is insufficient for transaction amount (₹500.00) plus fee (₹5.00).",
  "details": {
    "requiredPaise": 50500,
    "availablePaise": 45000
  },
  "timestamp": "2026-08-17T16:07:00.000Z"
}
```

### 5.3 Complete API Endpoint Catalog

| Module | Method | Endpoint | Description & Security |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Email/Mobile + Password + Device Fingerprint |
| **Auth** | `POST` | `/api/v1/auth/verify-mfa` | TOTP / OTP verification $\rightarrow$ Issue Sliding JWT |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Rotate Refresh Token (HttpOnly Cookie) |
| **Auth** | `POST` | `/api/v1/auth/logout` | Revoke Token & Blacklist in Redis |
| **Wallet** | `GET` | `/api/v1/wallet/balance` | Fetch Main, AePS, Credit, and Hold balances |
| **Wallet** | `POST` | `/api/v1/wallet/fund-request` | Request top-up via Bank Deposit / Gateway |
| **Wallet** | `POST` | `/api/v1/wallet/internal-transfer` | Transfer funds to downline Retailer (Distributor action) |
| **DMT** | `POST` | `/api/v1/dmt/remitter/lookup` | Check Remitter status & monthly limit |
| **DMT** | `POST` | `/api/v1/dmt/remitter/register` | Register new Remitter + Aadhaar OTP verify |
| **DMT** | `POST` | `/api/v1/dmt/beneficiary/add` | Add & Penny-drop verify bank account |
| **DMT** | `POST` | `/api/v1/dmt/transfer` | Execute IMPS/NEFT with double-entry lock |
| **Recharge** | `GET` | `/api/v1/recharge/plans` | Fetch operator circle plans & tariff lookup |
| **Recharge** | `POST` | `/api/v1/recharge/execute` | Execute mobile/DTH recharge via switch |
| **BBPS** | `GET` | `/api/v1/bbps/billers` | Fetch billers by category (Electricity, Gas, etc.) |
| **BBPS** | `POST` | `/api/v1/bbps/fetch-bill` | Online bill fetch with consumer params |
| **BBPS** | `POST` | `/api/v1/bbps/pay-bill` | Execute BBPS payment & generate BBPS receipt |
| **FASTag** | `POST` | `/api/v1/fastag/lookup` | Fetch vehicle tag details by vehicle reg number |
| **FASTag** | `POST` | `/api/v1/fastag/recharge` | Instant FASTag wallet recharge |
| **AePS** | `POST` | `/api/v1/aeps/bio-auth` | Validate RD Service encrypted PID block (CW/BE/MS) |
| **AePS** | `POST` | `/api/v1/aeps/aadhaar-pay` | Aadhaar Pay merchant collection |
| **UPI / QR** | `POST` | `/api/v1/upi/dynamic-qr` | Generate Dynamic UPI QR with amount & order ID |
| **UPI / QR** | `POST` | `/api/v1/upi/webhook/collect` | Webhook receiver for UPI collections (HMAC verified) |
| **Settlement**| `POST` | `/api/v1/settlement/bank/add`| Add settlement bank + Penny drop verification |
| **Settlement**| `POST` | `/api/v1/settlement/payout` | Move AePS balance to bank account via IMPS |
| **Reports** | `GET` | `/api/v1/reports/passbook` | Detailed Double-Entry Passbook with Debit/Credit filter|
| **Reports** | `GET` | `/api/v1/reports/transactions`| Paginated transaction master list with export (CSV/PDF) |
| **Admin** | `POST` | `/api/v1/admin/commission/slab`| Create/Update Commission Slab Packages |
| **Admin** | `POST` | `/api/v1/admin/provider-switch`| Dynamic provider routing & failover config |

---

## 6. Financial Security & Ledger Engineering

### 6.1 Transaction State Machine
Every mutating transaction executes under strict database ACID encapsulation with pessimistic locking:

```
                      +-------------------+
                      |   Client Request  |
                      +-------------------+
                                |
                                v
                +-------------------------------+
                |  Verify Idempotency Key       |
                |  (In Redis & Database)        |
                +-------------------------------+
                                |
                                v
                +-------------------------------+
                |  Acquire Wallet Lock          |
                |  (SELECT FOR UPDATE)          |
                +-------------------------------+
                                |
                                v
                +-------------------------------+
                |  Validate Balances & Limits   |
                +-------------------------------+
                                |
                                v
                +-------------------------------+
                |  Create Transaction Record    |
                |  Status: INITIATED            |
                |  Hold Funds in Hold Pocket    |
                +-------------------------------+
                                |
                                v
                +-------------------------------+
                |  Invoke External Provider API |
                |  (via Provider Switch)        |
                +-------------------------------+
                                |
            +-------------------+-------------------+
            |                   |                   |
            v                   v                   v
      [ SUCCESS ]          [ FAILED ]          [ TIMEOUT / DEEMED ]
            |                   |                   |
            v                   v                   v
  +-------------------+  +-------------------+  +-------------------+
  | Commit Ledger     |  | Release Hold      |  | Set Status:       |
  | Post Journal      |  | Revert Pocket     |  | PENDING / DEEMED  |
  | Split Commission  |  | Mark Failed       |  | Queue for Auto-   |
  | Status = SUCCESS  |  | Status = FAILED   |  | Reconciliation    |
  +-------------------+  +-------------------+  +-------------------+
```

### 6.2 The Invariant Double-Entry Ledger Formula
For every financial transaction $T$, the sum of all debits must strictly equal the sum of all credits:
$$\sum \text{Debits} = \sum \text{Credits}$$

For instance, on a ₹1,000 DMT transaction with ₹10 Customer Surcharge and ₹2 Retailer Commission:
- **Debit**: Retailer Main Wallet (`₹1,008.00` - Net amount debited)
- **Credit**: DMT Escrow Pool (`₹1,000.00` - Transferred to beneficiary)
- **Credit**: Platform Revenue Account (`₹6.00` - Platform net margin)
- **Credit**: Distributor Commission Payable (`₹2.00`)
- **TDS Deduction**: 5% TDS applied on commissions and credited to Tax Payable.

---

## 7. Security Architecture & Threat Modeling

| Threat Vector | Potential Impact | Engineering Defense |
| :--- | :--- | :--- |
| **Race Condition / Double Spend** | Simultaneous wallet drain | `SELECT FOR UPDATE` pessimistic locks + Redis Redlock mutex per wallet ID. |
| **Replay Attacks & Webhook Forgery** | Fraudulent transaction credits | Timestamp tolerance check ($\le 300\text{s}$) + HMAC-SHA256 signature verification over raw request body. |
| **IDOR / BOLA** | Viewing or draining other agents' wallets | Strict tenant ownership check in service layer (`wallet.user_id === req.user.id`). |
| **Credential Stuffing / Brute Force**| Account takeover | IP & Account velocity limits (RateLimiterFlexible) + Progressive lockouts + Argon2id/Bcrypt. |
| **Malicious Biometric Exploitation** | AePS fraud / UIDAI violation | No biometric data stored; encrypted PID block passed directly to NPCI-certified RD Service switch. |
| **SQL / Command Injection** | Database breach | Strict parameterized queries via Knex/Kysely/Prisma + Zod input schema validation. |
| **Token Theft & XSS** | Session hijacking | Refresh tokens in `HttpOnly`, `SameSite=Strict`, `Secure` cookies with sliding session rotation. |

---

## 8. Provider Integration & Circuit Breaker Architecture

We implement an **Adapter Pattern** with dynamic failover routing:
```
                                +---------------------------+
                                |  Provider Router Switch   |
                                +---------------------------+
                                              |
                +-----------------------------+-----------------------------+
                |                             |                             |
                v                             v                             v
    +-----------------------+     +-----------------------+     +-----------------------+
    |  Primary Provider     |     |  Secondary Provider   |     |  Mock / Fallback Switch|
    |  (e.g., PaySprint)    |     |  (e.g., Eko / Fino)   |     |  (Local Dev & Testing)|
    +-----------------------+     +-----------------------+     +-----------------------+
                |                             |                             |
                +-----------------------------+-----------------------------+
                                              |
                                              v
                                +---------------------------+
                                |   Circuit Breaker Guard   |
                                |   (Cockatiel / Thresholds)|
                                +---------------------------+
```
If the Primary Provider experiences error rates $> 5\%$ or response times $> 5\text{s}$, the Circuit Breaker trips to `OPEN`, automatically routing subsequent traffic to the Secondary Provider while health probes run in the background.

---

## 9. UI/UX Architecture (SekurePe-Inspired, Original & Premium)

### 9.1 Design System & Aesthetic Foundation
- **Visual Identity**: Premium Indian Digital Banking aesthetic. Deep Midnight Navy (`#0B1120`, `#0F172A`) header and sidebar, warm crisp white card canvases (`#FFFFFF`), high-contrast dark text (`#0F172A`), and vibrant accents:
  - **Fintech Green (`#10B981` / `#059669`)**: Wallet Balance, Success badges, Growth indicators.
  - **Action Orange (`#FF5722` / `#EA580C`)**: Primary CTAs, Alert banners, Instant Recharge buttons.
  - **Royal Indigo (`#4F46E5` / `#3730A3`)**: Active navigation, Service category badges.
- **Top Sticky Command Bar**:
  - Live Date & Time ticker (`DATE: AUG 17, 2026`).
  - Real-time Balance Chips: **Main Wallet (₹75,810.98)**, **AePS Balance (₹0.00)**, **Credit Balance (₹0.00)**.
  - Dynamic News & Regulatory ticker (*"Effective 1 Nov 2025 - AEPS Pay & UPI rates revised. Travel, CMS now live!"*).
  - Quick Profile & Notification drawer with agent photo/initials and KYC badge.
- **Quick-Service Grid (Dashboard Home)**:
  - 4-column responsive grid featuring clean, elevated tiles with distinct colored service icons:
    1. **DMT (Money Transfer)**
    2. **AEPS (Cash & Balance)**
    3. **UPI ATM**
    4. **Aadhaar Pay**
    5. **Settlement / Payout**
    6. **PPI Wallet**
    7. **Digikhata Fund Transfer**
    8. **Mobile Recharge 1 & 2**
    9. **FASTag Recharge**
    10. **Offline Bill Pay & Part Bill Pay**
    11. **CMS 1 & CMS 2**
    12. **Credit Card Pay**
    13. **Wallet Pay & QR Pay (1, 2, 3)**
    14. **Travel Booking**
    15. **Add Online Fund & DTH**
- **Receipt Generator**: Thermal printer-ready (2-inch / 3-inch) & full A4 PDF invoice generator with Bharat Connect / BBPS branding, QR code verification, and transaction hashes.

---

## 10. Regulatory, Compliance & Legal Dependencies

| Regulatory Body | Key Guidelines | System Compliance Implementation |
| :--- | :--- | :--- |
| **Reserve Bank of India (RBI)** | PPI Master Directions & DMT limits | Remitter limit enforcement: Max ₹25,000 / ₹50,000 monthly cash-to-account with OTP. |
| **UIDAI / NPCI (AePS)** | Aadhaar Biometric Security Guidelines | Strict zero-storage policy for raw biometrics / PID data; RD Service device tokenization only. |
| **NPCI (Bharat BillPay / BBPS)** | Customer dispute & transaction turnaround times | BBPS compliant receipt formats, BBPS Reference Numbers, automated Complaint / Ticket registration. |
| **CERT-In (Cybersecurity)** | Log retention & incident reporting | 5-year immutable audit log retention with NTP-synchronized timestamps and Indian geo-residency. |
| **Income Tax Dept (TDS)** | Section 194H / 194O TDS Deductions | Automated 5% TDS calculation and deduction on all commission payouts with quarterly Form 26AS data export. |

---

## 11. Development Roadmap & Phased Execution

```
  Phase 1: Project Setup & Monorepo Foundation
  ├── Initialize PNPM / Turbo monorepo with backend, frontend, and shared packages
  ├── Configure TypeScript strict mode, ESLint, Prettier, Tailwind CSS, and Vite
  └── Setup Docker Compose (PostgreSQL 16, Redis 7, Express Backend, React Frontend)

  Phase 2: Database Schema & Core Financial Engine
  ├── Write and execute complete Knex/Prisma PostgreSQL migrations with constraints
  ├── Implement Double-Entry Immutable Ledger engine with ACID balance verification
  └── Build Redis-backed Idempotency and Distributed Locking (`Redlock`) service

  Phase 3: Security, Authentication & User Hierarchy
  ├── Implement Argon2id password hashing, PIN verification, and Sliding JWT with HttpOnly cookies
  ├── Build Multi-Tier Role-Based Access Control (Admin, MD, Dist, Retailer) & User Tree
  └── Create KYC verification module (Aadhaar OTP simulation, PAN verification, Bank Penny Drop)

  Phase 4: Provider Abstraction Layer & Mock Switch
  ├── Build `IProviderAdapter` unified interface with Circuit Breaker and fallback routing
  └── Implement Mock Providers for DMT, Recharge, BBPS, FASTag, AePS, and Bank Payouts

  Phase 5: Financial Services Implementation (APIs & Business Logic)
  ├── DMT Engine (Remitter, Beneficiary, IMPS/NEFT transfers)
  ├── Mobile & DTH Recharge Engine (Operator/Plan lookup, Instant execution)
  ├── BBPS Utility Engine (Biller search, Bill fetch, Bill payment)
  ├── FASTag Engine & UPI Dynamic QR Collection Engine
  └── AePS Engine (RD Service integration contract, Cash withdrawal, Aadhaar Pay)

  Phase 6: Commission & Settlement Engine
  ├── Real-time dynamic commission slab calculation & multi-tier distribution
  └── 24x7 Agent Bank Settlement (Payout) engine with charge management

  Phase 7: Frontend Portals & UI/UX (SekurePe-Inspired Premium Interface)
  ├── Build Top Sticky Header (Balances, Date, Notice Bar, Profile) and Navigation Sidebar
  ├── Build Quick-Action Service Grid with Modern Fintech Cards & Micro-interactions
  ├── Build Service Screens: DMT, Recharge, BBPS, FASTag, AePS, Settlement, Reports
  └── Build Double-Entry Passbook, Receipt Generator (A4 & Thermal), and Ticket Support Desk

  Phase 8: Reconciliation, Fraud Prevention & Auditing
  ├── Build 2-way/3-way automated reconciliation engine & Dispute resolution desk
  ├── Implement Velocity & Fraud detection rules (Max attempts, geo-fencing, sudden spikes)
  └── Complete comprehensive end-to-end testing, Docker build validation, and documentation
```

---

## 12. Questions & Assumptions for User Review

> [!IMPORTANT]
> ### Key Architectural Decisions & Confirmations
> 1. **Default Local Provider Mode**: We will build the platform with a high-fidelity **Mock Provider Switch** that realistically simulates real Indian banking APIs (IMPS, BBPS bill fetch, AePS biometric verification, Mobile recharge operator switches) out of the box, with clean pluggable adapters ready for live production credentials (e.g., PaySprint, Eko, Setu, Cashfree, RazorpayX).
> 2. **Monorepo Architecture**: We will organize the repository as a clean, production-grade monorepo containing `backend`, `frontend`, and `shared` packages for end-to-end type safety.
> 3. **Database Migration Tooling**: We will use Knex.js / Prisma for type-safe migrations and raw SQL speed where high-concurrency ledger operations demand atomic locks.
> 4. **UI Styling**: We will use React + Vite + Tailwind CSS + Lucide Icons to deliver the exact service grid layout, top balance header, and color harmony inspired by the reference screenshot with modern fintech visual polish.

---

## 13. Verification & Testing Plan

### Automated Tests
- **Ledger Invariant Tests**: Run concurrent transactions to verify that debits always equal credits ($\sum D = \sum C$) and that no race conditions cause negative balances.
- **Idempotency Tests**: Fire duplicate requests with identical `X-Idempotency-Key` headers concurrently to ensure exactly-once execution.
- **Commission Split Tests**: Verify exact fractional and TDS calculations across Admin $\rightarrow$ MD $\rightarrow$ Dist $\rightarrow$ Retailer.
- **Provider Failover Tests**: Trip the mock circuit breaker and ensure seamless automatic failover to the secondary provider adapter.

### Manual & Visual Verification
- Verify the responsive Retailer Portal, sticky header balances, service cards, receipt printing, and real-time passbook ledger updates in the browser.
