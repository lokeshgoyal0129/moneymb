export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MASTER_DISTRIBUTOR = 'MASTER_DISTRIBUTOR',
  DISTRIBUTOR = 'DISTRIBUTOR',
  RETAILER = 'RETAILER',
  API_USER = 'API_USER'
}

export enum UserStatus {
  PENDING_KYC = 'PENDING_KYC',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  DORMANT = 'DORMANT'
}

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum PocketType {
  MAIN = 'MAIN',
  AEPS = 'AEPS',
  CREDIT = 'CREDIT',
  HOLD = 'HOLD'
}

export enum TxStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED'
}

export enum ServiceType {
  DMT = 'DMT',
  RECHARGE = 'RECHARGE',
  BBPS = 'BBPS',
  FASTAG = 'FASTAG',
  AEPS_CW = 'AEPS_CW',         // Cash Withdrawal
  AEPS_BE = 'AEPS_BE',         // Balance Enquiry
  AEPS_MS = 'AEPS_MS',         // Mini Statement
  AADHAAR_PAY = 'AADHAAR_PAY', // Merchant Collection
  UPI_QR = 'UPI_QR',
  CMS = 'CMS',
  TRAVEL = 'TRAVEL',
  SETTLEMENT = 'SETTLEMENT',
  WALLET_TRANSFER = 'WALLET_TRANSFER'
}

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export enum DmtChannel {
  IMPS = 'IMPS',
  NEFT = 'NEFT'
}

export enum RechargeType {
  PREPAID = 'PREPAID',
  POSTPAID = 'POSTPAID',
  DTH = 'DTH'
}

export enum BbpsCategory {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  GAS = 'GAS',
  BROADBAND = 'BROADBAND',
  LANDLINE = 'LANDLINE',
  FASTAG = 'FASTAG',
  MUNICIPAL_TAX = 'MUNICIPAL_TAX',
  INSURANCE = 'INSURANCE',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  CABLE_TV = 'CABLE_TV'
}

export enum PayoutMode {
  IMPS = 'IMPS',
  NEFT = 'NEFT',
  RTGS = 'RTGS'
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED_REFUNDED = 'RESOLVED_REFUNDED',
  REJECTED = 'REJECTED'
}

export enum CalculationType {
  FLAT = 'FLAT',       // In Paise (e.g. 500 = ₹5.00)
  PERCENT = 'PERCENT'  // In Basis points (e.g. 15 = 0.15%, 100 = 1.00%)
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}
