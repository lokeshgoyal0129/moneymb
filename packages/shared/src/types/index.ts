import {
  UserRole,
  UserStatus,
  KycStatus,
  PocketType,
  TxStatus,
  ServiceType,
  AccountType,
  DmtChannel,
  RechargeType,
  BbpsCategory,
  PayoutMode,
  DisputeStatus,
  CalculationType
} from '../enums';

// Generic API standard response
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// User & Auth Types
export interface UserJwtPayload {
  userId: string;
  customId: string;
  role: UserRole;
  email: string;
  mobile: string;
  shopName: string;
  kycStatus: KycStatus;
}

export interface UserProfileDto {
  id: string;
  customId: string;
  role: UserRole;
  status: UserStatus;
  fullName: string;
  shopName: string;
  email: string;
  mobile: string;
  mfaEnabled: boolean;
  parentUserId?: string;
  kycStatus: KycStatus;
  lastLoginAt?: string;
  createdAt: string;
}

// Wallet & Ledger Types
export interface WalletBalancesDto {
  mainBalance: number;     // in Paise
  aepsBalance: number;     // in Paise
  creditBalance: number;   // in Paise
  holdBalance: number;     // in Paise
  totalAvailable: number;  // in Paise
  currency: string;
  isLocked: boolean;
}

export interface JournalLineDto {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  debitAmount: number;     // in Paise
  creditAmount: number;    // in Paise
  balanceAfter: number;    // in Paise
  createdAt: string;
}

export interface PassbookEntryDto {
  id: string;
  transactionId?: string;
  referenceId?: string;
  serviceType: ServiceType;
  description: string;
  pocket: PocketType;
  debitAmount: number;
  creditAmount: number;
  closingBalance: number;
  status: TxStatus;
  postedAt: string;
}

// Transaction Types
export interface TransactionDto {
  id: string;
  referenceId: string;
  userId: string;
  userCustomId?: string;
  userShopName?: string;
  serviceType: ServiceType;
  status: TxStatus;
  grossAmount: number;       // in Paise
  feeAmount: number;         // in Paise
  commissionAmount: number;  // in Paise
  netAmount: number;         // in Paise
  providerId?: string;
  providerReferenceId?: string;
  providerStatus?: string;
  bankRrn?: string;
  createdAt: string;
  updatedAt: string;
}

// DMT Types
export interface RemitterDto {
  mobile: string;
  name: string;
  monthlyLimit: number;      // in Paise
  remainingLimit: number;    // in Paise
  isKycVerified: boolean;
  status: string;
}

export interface BeneficiaryDto {
  id: string;
  remitterMobile: string;
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  isVerified: boolean;
  createdAt: string;
}

export interface DmtTransferRequestDto {
  remitterMobile: string;
  remitterName: string;
  beneficiaryId: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  beneficiaryName: string;
  amount: number;            // in Paise
  channel: DmtChannel;
  transactionPin: string;
}

// Recharge & Utility Types
export interface RechargePlanDto {
  id: string;
  operatorCode: string;
  circleCode: string;
  amount: number;            // in Paise
  validity: string;
  talktime?: string;
  data?: string;
  description: string;
  planType: string;
}

export interface ExecuteRechargeDto {
  operatorCode: string;
  circleCode: string;
  consumerNumber: string;
  rechargeType: RechargeType;
  amount: number;            // in Paise
  planId?: string;
  transactionPin: string;
}

export interface BbpsBillerDto {
  billerId: string;
  billerName: string;
  category: BbpsCategory;
  paramName: string;
  paramRegex?: string;
  paramPlaceholder: string;
  fetchRequirement: 'MANDATORY' | 'OPTIONAL' | 'NOT_SUPPORTED';
  supportPartialPay: boolean;
}

export interface BillFetchResultDto {
  billerId: string;
  billerName: string;
  consumerIdentifier: string;
  customerName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  billAmount: number;        // in Paise
  billPeriod?: string;
  additionalParams?: Record<string, any>;
}

export interface BillPayDto {
  billerId: string;
  category: BbpsCategory;
  consumerIdentifier: string;
  customerName: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  amount: number;            // in Paise
  bbpsReferenceId?: string;
  transactionPin: string;
}

export interface FastagLookupDto {
  vehicleNumber: string;
  operatorCode?: string;
  customerName?: string;
  tagStatus?: string;
  minRechargeAmount?: number;
}

// AePS Types
export interface AepsAuthDto {
  aadhaarLastFour: string;
  bankIin: string;
  bankName: string;
  transactionType: ServiceType; // AEPS_CW, AEPS_BE, AEPS_MS, AADHAAR_PAY
  amount?: number;               // in Paise (for CW or Aadhaar Pay)
  pidDataXml: string;            // Encrypted PID block from RD Service
  deviceMake: string;
  deviceModel: string;
  deviceSerial: string;
  lat?: number;
  lon?: number;
}

// Settlement & Bank Types
export interface SettlementAccountDto {
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

export interface SettlementRequestDto {
  settlementAccountId: string;
  amount: number;            // in Paise
  payoutMode: PayoutMode;
  transactionPin: string;
}

// Commission & Slab Types
export interface CommissionSlabDto {
  id: string;
  packageId: string;
  serviceType: ServiceType;
  minAmount: number;         // in Paise
  maxAmount: number;         // in Paise
  calcType: CalculationType;
  retailerVal: number;
  distributorVal: number;
  masterDistVal: number;
  tdsPercentage: number;
  isActive: boolean;
}

export interface CommissionBreakdownDto {
  retailerCommission: number;
  retailerTds: number;
  retailerNet: number;
  distributorCommission: number;
  distributorTds: number;
  distributorNet: number;
  masterDistCommission: number;
  masterDistTds: number;
  masterDistNet: number;
  platformMargin: number;
}

// Support & Dispute Types
export interface DisputeDto {
  id: string;
  ticketNumber: string;
  transactionId: string;
  referenceId: string;
  serviceType: ServiceType;
  reason: string;
  status: DisputeStatus;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}
