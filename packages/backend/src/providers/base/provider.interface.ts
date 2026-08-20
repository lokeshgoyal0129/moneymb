import { ServiceType } from '@fintech/shared';

export interface ProviderExecutionResult<T = any> {
  success: boolean;
  providerId: string;
  providerReferenceId: string;
  bankRrn?: string;
  statusCode: string;
  message: string;
  data?: T;
  rawResponse: any;
}

export interface IProviderAdapter {
  providerId: string;
  name: string;
  isAvailable(): Promise<boolean>;

  // DMT
  executeDmtTransfer(params: {
    referenceId: string;
    remitterMobile: string;
    beneficiaryAccount: string;
    beneficiaryIfsc: string;
    beneficiaryName: string;
    amountPaise: number;
    channel: string;
  }): Promise<ProviderExecutionResult>;

  // Recharge
  executeRecharge(params: {
    referenceId: string;
    operatorCode: string;
    circleCode: string;
    consumerNumber: string;
    amountPaise: number;
  }): Promise<ProviderExecutionResult>;

  // BBPS
  fetchBill(params: {
    billerId: string;
    consumerIdentifier: string;
  }): Promise<ProviderExecutionResult>;

  payBill(params: {
    referenceId: string;
    billerId: string;
    consumerIdentifier: string;
    amountPaise: number;
  }): Promise<ProviderExecutionResult>;

  // FASTag
  lookupFastag(params: { vehicleNumber: string }): Promise<ProviderExecutionResult>;
  rechargeFastag(params: { referenceId: string; vehicleNumber: string; amountPaise: number }): Promise<ProviderExecutionResult>;

  // AePS
  executeAepsAuth(params: {
    referenceId: string;
    transactionType: ServiceType;
    aadhaarLastFour: string;
    bankIin: string;
    amountPaise?: number;
    pidDataXml: string;
  }): Promise<ProviderExecutionResult>;

  // Payout / Settlement
  executePayout(params: {
    referenceId: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    amountPaise: number;
    payoutMode: string;
  }): Promise<ProviderExecutionResult>;
}
