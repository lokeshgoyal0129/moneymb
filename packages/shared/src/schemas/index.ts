import { z } from 'zod';
import {
  UserRole,
  ServiceType,
  DmtChannel,
  RechargeType,
  BbpsCategory,
  PayoutMode,
  CalculationType
} from '../enums';

// Indian Mobile number (10 digits starting with 6-9)
export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number');

// Indian PIN Code (6 digits)
export const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit PIN code');

// Indian PAN (5 letters, 4 digits, 1 letter)
export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Must be a valid PAN format (e.g. ABCDE1234F)');

// Indian Bank IFSC (4 letters, 0, 6 alphanumeric)
export const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Must be a valid 11-character IFSC code (e.g. SBIN0001234)');

// Indian Bank Account Number (9 to 18 digits)
export const bankAccountSchema = z
  .string()
  .regex(/^\d{9,18}$/, 'Bank account number must be 9 to 18 digits');

// Transaction PIN (4 to 6 digits)
export const transactionPinSchema = z
  .string()
  .regex(/^\d{4,6}$/, 'Transaction PIN must be 4 or 6 numeric digits');

// Positive Amount in Paise (e.g., Min ₹1.00 = 100 paise)
export const amountPaiseSchema = z
  .number()
  .int('Amount must be an integer in paise')
  .positive('Amount must be greater than 0');

// Auth Schemas
export const loginSchema = z.object({
  identifier: z.string().min(3, 'Mobile or Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  deviceId: z.string().optional()
});

export const verifyMfaSchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: z.string().length(6, 'MFA Code must be 6 digits')
});

export const registerUserSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  shopName: z.string().min(2, 'Shop name is required'),
  email: z.string().email('Invalid email address'),
  mobile: mobileSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  transactionPin: transactionPinSchema,
  role: z.nativeEnum(UserRole).default(UserRole.RETAILER),
  parentUserId: z.string().uuid().optional()
});

// DMT Schemas
export const remitterLookupSchema = z.object({
  mobile: mobileSchema
});

export const remitterRegisterSchema = z.object({
  mobile: mobileSchema,
  name: z.string().min(2, 'Remitter name is required'),
  pincode: pincodeSchema,
  address: z.string().optional(),
  otp: z.string().length(6, 'OTP must be 6 digits').optional()
});

export const beneficiaryAddSchema = z.object({
  remitterMobile: mobileSchema,
  beneficiaryName: z.string().min(2, 'Beneficiary name is required'),
  accountNumber: bankAccountSchema,
  ifscCode: ifscSchema,
  bankName: z.string().min(2, 'Bank name is required')
});

export const dmtTransferSchema = z.object({
  remitterMobile: mobileSchema,
  remitterName: z.string().min(2),
  beneficiaryId: z.string().uuid(),
  accountNumber: bankAccountSchema,
  ifscCode: ifscSchema,
  bankName: z.string().min(2),
  beneficiaryName: z.string().min(2),
  amount: amountPaiseSchema.max(5000000, 'Max transaction limit is ₹50,000 (5,000,000 paise)'),
  channel: z.nativeEnum(DmtChannel).default(DmtChannel.IMPS),
  transactionPin: transactionPinSchema
});

// Recharge Schemas
export const executeRechargeSchema = z.object({
  operatorCode: z.string().min(2, 'Operator code is required'),
  circleCode: z.string().min(2, 'Circle code is required'),
  consumerNumber: z.string().min(5, 'Consumer/Mobile number is required'),
  rechargeType: z.nativeEnum(RechargeType),
  amount: amountPaiseSchema,
  planId: z.string().optional(),
  transactionPin: transactionPinSchema
});

// BBPS Schemas
export const billFetchSchema = z.object({
  billerId: z.string().min(2, 'Biller ID is required'),
  category: z.nativeEnum(BbpsCategory),
  consumerIdentifier: z.string().min(3, 'Consumer number/ID is required'),
  additionalParams: z.record(z.string()).optional()
});

export const billPaySchema = z.object({
  billerId: z.string().min(2, 'Biller ID is required'),
  billerName: z.string().min(2, 'Biller Name is required'),
  category: z.nativeEnum(BbpsCategory),
  consumerIdentifier: z.string().min(3),
  customerName: z.string().min(2),
  billNumber: z.string().optional(),
  billDate: z.string().optional(),
  dueDate: z.string().optional(),
  amount: amountPaiseSchema,
  bbpsReferenceId: z.string().optional(),
  transactionPin: transactionPinSchema
});

// FASTag Schemas
export const fastagLookupSchema = z.object({
  vehicleNumber: z.string().regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/, 'Invalid Indian Vehicle Number (e.g. MH02CB1234)')
});

export const fastagRechargeSchema = z.object({
  vehicleNumber: z.string().min(6),
  operatorCode: z.string().min(2),
  amount: amountPaiseSchema,
  transactionPin: transactionPinSchema
});

// AePS Schemas
export const aepsAuthSchema = z.object({
  aadhaarLastFour: z.string().length(4, 'Must be the last 4 digits of Aadhaar'),
  bankIin: z.string().length(6, 'Bank IIN must be 6 digits'),
  bankName: z.string().min(2),
  transactionType: z.enum([ServiceType.AEPS_CW, ServiceType.AEPS_BE, ServiceType.AEPS_MS, ServiceType.AADHAAR_PAY]),
  amount: amountPaiseSchema.optional(),
  pidDataXml: z.string().min(10, 'Encrypted biometric PID block is required'),
  deviceMake: z.string().min(2),
  deviceModel: z.string().min(2),
  deviceSerial: z.string().min(2),
  lat: z.number().optional(),
  lon: z.number().optional()
});

// Settlement Schemas
export const addSettlementBankSchema = z.object({
  accountNumber: bankAccountSchema,
  ifscCode: ifscSchema,
  bankName: z.string().min(2),
  accountHolderName: z.string().min(2),
  isPrimary: z.boolean().default(false)
});

export const settlementRequestSchema = z.object({
  settlementAccountId: z.string().uuid(),
  amount: amountPaiseSchema,
  payoutMode: z.nativeEnum(PayoutMode).default(PayoutMode.IMPS),
  transactionPin: transactionPinSchema
});

// Commission Slab Schemas
export const commissionSlabSchema = z.object({
  packageId: z.string().uuid(),
  serviceType: z.nativeEnum(ServiceType),
  minAmount: amountPaiseSchema,
  maxAmount: amountPaiseSchema,
  calcType: z.nativeEnum(CalculationType),
  retailerVal: z.number().int().nonnegative(),
  distributorVal: z.number().int().nonnegative(),
  masterDistVal: z.number().int().nonnegative(),
  tdsPercentage: z.number().min(0).max(30).default(5.0),
  isActive: z.boolean().default(true)
});
