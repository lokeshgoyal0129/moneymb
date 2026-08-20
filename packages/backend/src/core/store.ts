import {
  UserRole,
  UserStatus,
  KycStatus,
  PocketType,
  TxStatus,
  ServiceType,
  AccountType,
  CalculationType
} from '@fintech/shared';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  customId: string;
  role: UserRole;
  status: UserStatus;
  fullName: string;
  shopName: string;
  email: string;
  mobile: string;
  passwordHash: string;
  pinHash: string;
  mfaEnabled: boolean;
  parentUserId?: string;
  kycStatus: KycStatus;
  failedLoginAttempts: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface WalletRecord {
  id: string;
  userId: string;
  mainBalance: number;     // In Paise (₹100 = 10000)
  aepsBalance: number;     // In Paise
  creditBalance: number;   // In Paise
  holdBalance: number;     // In Paise
  currency: string;
  isLocked: boolean;
  version: number;
  updatedAt: string;
}

export interface LedgerAccountRecord {
  id: string;
  accountNumber: string;
  name: string;
  type: AccountType;
  userId?: string;
  pocket?: PocketType;
  balance: number;
}

export interface JournalLineRecord {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountNumber: string;
  debitAmount: number;
  creditAmount: number;
  balanceAfter: number;
  createdAt: string;
}

export interface JournalEntryRecord {
  id: string;
  entryNumber: string;
  transactionId?: string;
  referenceId?: string;
  serviceType: ServiceType;
  description: string;
  lines: JournalLineRecord[];
  postedAt: string;
}

export interface TransactionRecord {
  id: string;
  referenceId: string;
  userId: string;
  serviceType: ServiceType;
  status: TxStatus;
  grossAmount: number;       // in Paise
  feeAmount: number;         // in Paise
  commissionAmount: number;  // in Paise
  netAmount: number;         // in Paise
  providerId: string;
  providerReferenceId?: string;
  providerStatus?: string;
  bankRrn?: string;
  idempotencyKey: string;
  details: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RemitterRecord {
  mobile: string;
  name: string;
  monthlyLimit: number;      // 2500000 paise = ₹25,000
  remainingLimit: number;
  isKycVerified: boolean;
  status: string;
}

export interface BeneficiaryRecord {
  id: string;
  remitterMobile: string;
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  isVerified: boolean;
  createdAt: string;
}

export interface CommissionSlabRecord {
  id: string;
  packageId: string;
  serviceType: ServiceType;
  minAmount: number;
  maxAmount: number;
  calcType: CalculationType;
  retailerVal: number;
  distributorVal: number;
  masterDistVal: number;
  tdsPercentage: number;
  isActive: boolean;
}

export interface SettlementAccountRecord {
  id: string;
  userId: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  ticketNumber: string;
  transactionId: string;
  referenceId: string;
  userId: string;
  serviceType: ServiceType;
  reason: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

class FintechStateStore {
  public users: Map<string, UserRecord> = new Map();
  public wallets: Map<string, WalletRecord> = new Map(); // Keyed by userId
  public ledgerAccounts: Map<string, LedgerAccountRecord> = new Map();
  public journalEntries: JournalEntryRecord[] = [];
  public transactions: Map<string, TransactionRecord> = new Map(); // Keyed by referenceId
  public remitters: Map<string, RemitterRecord> = new Map(); // Keyed by mobile
  public beneficiaries: Map<string, BeneficiaryRecord[]> = new Map(); // Keyed by remitter mobile
  public commissionSlabs: CommissionSlabRecord[] = [];
  public settlementAccounts: Map<string, SettlementAccountRecord[]> = new Map(); // Keyed by userId
  public disputes: DisputeRecord[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Retailer@123', salt);
    const adminPasswordHash = bcrypt.hashSync('Admin@12345', salt);
    const partnerPasswordHash = bcrypt.hashSync('Partner@123', salt);
    const defaultPinHash = bcrypt.hashSync('1234', salt);

    // 1. Users Hierarchy
    const adminUser: UserRecord = {
      id: 'usr_admin_001',
      customId: 'ADM-10001',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      fullName: 'System Administrator',
      shopName: 'MoneyMB HQ Operations',
      email: 'admin@moneymb.in',
      mobile: '9999900001',
      passwordHash: adminPasswordHash,
      pinHash: defaultPinHash,
      mfaEnabled: false,
      kycStatus: KycStatus.VERIFIED,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString()
    };

    const masterDistributor: UserRecord = {
      id: 'usr_md_101',
      customId: 'MD-50001',
      role: UserRole.MASTER_DISTRIBUTOR,
      status: UserStatus.ACTIVE,
      fullName: 'Vikram Singh',
      shopName: 'Singh Enterprises & FinTech Hub',
      email: 'md@moneymb.in',
      mobile: '9811100002',
      passwordHash: partnerPasswordHash,
      pinHash: defaultPinHash,
      mfaEnabled: false,
      parentUserId: adminUser.id,
      kycStatus: KycStatus.VERIFIED,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString()
    };

    const distributor: UserRecord = {
      id: 'usr_dist_201',
      customId: 'DST-60001',
      role: UserRole.DISTRIBUTOR,
      status: UserStatus.ACTIVE,
      fullName: 'Rajesh Gupta',
      shopName: 'Gupta Telecom & Services',
      email: 'dist@moneymb.in',
      mobile: '9822200003',
      passwordHash: partnerPasswordHash,
      pinHash: defaultPinHash,
      mfaEnabled: false,
      parentUserId: masterDistributor.id,
      kycStatus: KycStatus.VERIFIED,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString()
    };

    // Retailer matching the reference dashboard balance ₹0
    const retailerUser: UserRecord = {
      id: 'usr_ret_301',
      customId: 'RET-882910',
      role: UserRole.RETAILER,
      status: UserStatus.ACTIVE,
      fullName: 'Amit Kumar Sharma',
      shopName: 'Sharma Digital Seva Kendra',
      email: 'retailer@moneymb.in',
      mobile: '9876543210',
      passwordHash: defaultPasswordHash,
      pinHash: defaultPinHash,
      mfaEnabled: false,
      parentUserId: distributor.id,
      kycStatus: KycStatus.VERIFIED,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString()
    };

    [adminUser, masterDistributor, distributor, retailerUser].forEach((u) => {
      this.users.set(u.id, u);
    });

    // 2. Wallets
    this.wallets.set(retailerUser.id, {
      id: 'wlt_ret_301',
      userId: retailerUser.id,
      mainBalance: 0, // 0
      aepsBalance: 0,
      creditBalance: 0,
      holdBalance: 0,
      currency: 'INR',
      isLocked: false,
      version: 1,
      updatedAt: new Date().toISOString()
    });

    this.wallets.set(distributor.id, {
      id: 'wlt_dist_201',
      userId: distributor.id,
      mainBalance: 25000000, // ₹2,50,000.00
      aepsBalance: 0,
      creditBalance: 0,
      holdBalance: 0,
      currency: 'INR',
      isLocked: false,
      version: 1,
      updatedAt: new Date().toISOString()
    });

    this.wallets.set(masterDistributor.id, {
      id: 'wlt_md_101',
      userId: masterDistributor.id,
      mainBalance: 100000000, // ₹10,00,000.00
      aepsBalance: 0,
      creditBalance: 0,
      holdBalance: 0,
      currency: 'INR',
      isLocked: false,
      version: 1,
      updatedAt: new Date().toISOString()
    });

    // 3. Chart of Accounts in Double-Entry Ledger
    const systemAccounts: LedgerAccountRecord[] = [
      { id: 'acc_escrow_dmt', accountNumber: 'ACC_ESCROW_DMT', name: 'DMT Clearing Escrow Account', type: AccountType.LIABILITY, balance: 1000000000 },
      { id: 'acc_escrow_bbps', accountNumber: 'ACC_ESCROW_BBPS', name: 'BBPS Utility Escrow Pool', type: AccountType.LIABILITY, balance: 1000000000 },
      { id: 'acc_escrow_recharge', accountNumber: 'ACC_ESCROW_RECHARGE', name: 'Telecom Operator Pool', type: AccountType.LIABILITY, balance: 1000000000 },
      { id: 'acc_fee_revenue', accountNumber: 'ACC_FEE_REVENUE', name: 'Platform Service Fee Revenue', type: AccountType.REVENUE, balance: 0 },
      { id: 'acc_commission_expense', accountNumber: 'ACC_COMMISSION_EXPENSE', name: 'Agent Commission Expense', type: AccountType.EXPENSE, balance: 0 },
      { id: 'acc_tds_payable', accountNumber: 'ACC_TDS_PAYABLE', name: 'TDS Section 194H Payable', type: AccountType.LIABILITY, balance: 0 },
      { id: 'acc_user_ret301_main', accountNumber: `ACC_USER_${retailerUser.id}_MAIN`, name: 'Retailer Main Wallet Ledger', type: AccountType.LIABILITY, userId: retailerUser.id, pocket: PocketType.MAIN, balance: 7581098 },
      { id: 'acc_user_ret301_aeps', accountNumber: `ACC_USER_${retailerUser.id}_AEPS`, name: 'Retailer AePS Settlement Ledger', type: AccountType.LIABILITY, userId: retailerUser.id, pocket: PocketType.AEPS, balance: 0 }
    ];

    systemAccounts.forEach((acc) => {
      this.ledgerAccounts.set(acc.id, acc);
    });

    // 4. Commission Slabs
    this.commissionSlabs = [
      { id: 'cs_dmt_1', packageId: 'pkg_default', serviceType: ServiceType.DMT, minAmount: 10000, maxAmount: 100000, calcType: CalculationType.FLAT, retailerVal: 350, distributorVal: 50, masterDistVal: 20, tdsPercentage: 5.0, isActive: true },
      { id: 'cs_dmt_2', packageId: 'pkg_default', serviceType: ServiceType.DMT, minAmount: 100001, maxAmount: 500000, calcType: CalculationType.FLAT, retailerVal: 1200, distributorVal: 150, masterDistVal: 50, tdsPercentage: 5.0, isActive: true },
      { id: 'cs_rec_1', packageId: 'pkg_default', serviceType: ServiceType.RECHARGE, minAmount: 1000, maxAmount: 1000000, calcType: CalculationType.PERCENT, retailerVal: 250, distributorVal: 30, masterDistVal: 10, tdsPercentage: 5.0, isActive: true },
      { id: 'cs_bbps_1', packageId: 'pkg_default', serviceType: ServiceType.BBPS, minAmount: 10000, maxAmount: 10000000, calcType: CalculationType.FLAT, retailerVal: 50, distributorVal: 10, masterDistVal: 5, tdsPercentage: 5.0, isActive: true },
      { id: 'cs_fastag_1', packageId: 'pkg_default', serviceType: ServiceType.FASTAG, minAmount: 10000, maxAmount: 5000000, calcType: CalculationType.PERCENT, retailerVal: 20, distributorVal: 5, masterDistVal: 2, tdsPercentage: 5.0, isActive: true },
      { id: 'cs_aeps_1', packageId: 'pkg_default', serviceType: ServiceType.AEPS_CW, minAmount: 10000, maxAmount: 99900, calcType: CalculationType.FLAT, retailerVal: 100, distributorVal: 20, masterDistVal: 10, tdsPercentage: 5.0, isActive: true },
      { id: 'cs_aeps_2', packageId: 'pkg_default', serviceType: ServiceType.AEPS_CW, minAmount: 100000, maxAmount: 299900, calcType: CalculationType.FLAT, retailerVal: 500, distributorVal: 75, masterDistVal: 25, tdsPercentage: 5.0, isActive: true },
      { id: 'cs_aeps_3', packageId: 'pkg_default', serviceType: ServiceType.AEPS_CW, minAmount: 300000, maxAmount: 1000000, calcType: CalculationType.FLAT, retailerVal: 1000, distributorVal: 150, masterDistVal: 50, tdsPercentage: 5.0, isActive: true }
    ];

    // 5. Pre-registered Remitter & Beneficiaries
    const defaultRemitter: RemitterRecord = {
      mobile: '9876543210',
      name: 'Amit Kumar Sharma',
      monthlyLimit: 2500000, // ₹25,000 monthly limit
      remainingLimit: 2500000,
      isKycVerified: true,
      status: 'ACTIVE'
    };
    this.remitters.set(defaultRemitter.mobile, defaultRemitter);

    this.beneficiaries.set(defaultRemitter.mobile, [
      {
        id: 'ben_001',
        remitterMobile: defaultRemitter.mobile,
        beneficiaryName: 'Ramesh Kumar Verma',
        accountNumber: '30291829103',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        isVerified: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ben_002',
        remitterMobile: defaultRemitter.mobile,
        beneficiaryName: 'Pooja Devi Sharma',
        accountNumber: '501002349182',
        ifscCode: 'HDFC0000456',
        bankName: 'HDFC Bank',
        isVerified: true,
        createdAt: new Date().toISOString()
      }
    ]);

    // 6. Settlement Account for Retailer
    this.settlementAccounts.set(retailerUser.id, [
      {
        id: 'set_acc_001',
        userId: retailerUser.id,
        accountNumber: '918273645102',
        ifscCode: 'ICIC0000001',
        bankName: 'ICICI Bank Ltd',
        accountHolderName: 'Amit Kumar Sharma',
        isVerified: true,
        isPrimary: true,
        createdAt: new Date().toISOString()
      }
    ]);
  }
}

export const store = new FintechStateStore();
