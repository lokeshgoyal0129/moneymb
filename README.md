# Enterprise Indian Fintech & B2B Financial Inclusion Platform

A production-grade, multi-tenant Indian Fintech & Digital Financial Services Platform built on the **PERN stack (PostgreSQL, Express.js, React + Vite, Node.js + TypeScript)**.

Inspired by the comprehensive service categories of high-volume Indian retailer portals (like MoneyMB), this system provides an all-in-one ecosystem for domestic money transfers, biometric AePS banking, bill payments (BBPS), mobile/DTH recharges, FASTag toll top-ups, dynamic UPI QR collections, and multi-pocket hierarchical financial ledger accounting.

---

## 🚀 Key Features & Service Modules

### 1. Banking & Financial Inclusion Services
- **Domestic Money Transfer (DMT)**: Remitter KYC registration, beneficiary bank account management with penny-drop verification, instant IMPS & NEFT fund transfers with double-entry escrow locking.
- **Aadhaar Enabled Payment System (AePS)**: NPCI & UIDAI RD Service compliant biometric integration for Cash Withdrawal (CW), Balance Enquiry (BE), Mini-Statement (MS), and Aadhaar Pay.
- **Dynamic UPI QR & Collections**: On-the-fly UPI QR generation for counter collections with instant webhook reconciliation.
- **Settlement & Payouts**: Instant 24x7 IMPS payout from AePS settlement wallet to verified commercial bank accounts.

### 2. Utility & Recharge Services (BBPS)
- **Mobile & DTH Recharge**: Instant tariff plan browser, operator circle lookups (Jio, Airtel, Vi, BSNL, Tata Play, Dish TV), and automatic 2.5% margin credit.
- **Bharat BillPay (BBPS)**: Electricity, Piped Gas, Water, Broadband, and Municipal Tax bill lookups and instant payments.
- **NETC FASTag Recharge**: National highway toll tag lookup by vehicle number with instant wallet top-up.

### 3. Core Financial Ledger Architecture
- **Immutable Double-Entry Ledger**: Every balance mutation is backed by balanced debits and credits ($\sum \text{Debits} = \sum \text{Credits}$).
- **Multi-Pocket Wallet Management**:
  - **Main Balance**: Used for DMT, Recharges, BBPS, and utility bills.
  - **AePS Settlement Balance**: Isolated pocket for biometric cash withdrawals, settled directly to bank.
  - **Credit Balance**: Overdraft/credit line allocated by Distributors.
  - **Hold Balance**: Atomically holds funds during in-flight external provider transactions.
- **Idempotency Protection**: Enforced `X-Idempotency-Key` headers on all state-mutating financial endpoints.
- **Hierarchical Commission Engine**: Instant margin split across **Super Admin $\rightarrow$ Master Distributor $\rightarrow$ Distributor $\rightarrow$ Retailer** with automatic 5% TDS deduction (Section 194H).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Axios, Lucide Icons |
| **Backend** | Node.js 22 LTS, Express.js, TypeScript, Winston Structured Logger, Zod |
| **Database** | PostgreSQL 16 (ACID Relational Core with Row-Level Locking) |
| **Caching & Queues** | Redis 7 (Distributed Mutex Locks, Rate Limiting, Idempotency Store) |
| **Security** | Sliding JWT in HttpOnly Cookies, AES-256-GCM, Bcrypt, Helmet, CORS |
| **DevOps** | Docker Compose, Multi-stage Dockerfiles, Nginx Reverse Proxy, GitHub Actions |

---

## 📦 Monorepo Structure

```
d:\Clients\MoneyTransfer/
├── packages/
│   ├── shared/                # Shared TypeScript contracts, enums, DTOs, Zod schemas
│   ├── backend/               # Express.js REST API (/api/v1), Ledger Core, Provider Switch
│   └── frontend/              # React 18 + Vite + Tailwind CSS Retailer Portal
├── docker/                    # Docker Compose & Nginx production reverse proxy
├── .github/workflows/         # Automated CI/CD pipeline
└── package.json               # Root npm workspaces manifest
```

---

## 🔑 Pre-Seeded Demo Accounts

| Role | Email / Identifier | Password | Transaction PIN | Initial Main Balance |
| :--- | :--- | :--- | :--- | :--- |
| **Retailer (Shopkeeper)** | `retailer@moneymb.in` | `Retailer@123` | `1234` | **₹ 75,810.98** |
| **Distributor** | `dist@moneymb.in` | `Partner@123` | `1234` | **₹ 2,50,000.00** |
| **Master Distributor** | `md@moneymb.in` | `Partner@123` | `1234` | **₹ 10,00,000.00** |
| **Super Admin** | `admin@moneymb.in` | `Admin@12345` | `1234` | **Platform Master** |

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- npm `v10+`

### 2. Install Dependencies & Build Packages
```bash
# From workspace root
npm install
npm run build
```

### 3. Start Development Servers Concurrently
```bash
# Runs Backend on http://localhost:5000 and Frontend on http://localhost:5173
npm run dev
```

Visit **`http://localhost:5173`** in your browser to access the portal.

---

## 🐳 Docker Deployment

To launch the complete production stack (PostgreSQL 16, Redis 7, Backend API, Nginx Frontend):

```bash
cd docker
docker-compose up --build -d
```

- **Frontend Web Portal**: `http://localhost`
- **Backend API Engine**: `http://localhost:5000/api/v1`
- **Health Endpoint**: `http://localhost:5000/health`
