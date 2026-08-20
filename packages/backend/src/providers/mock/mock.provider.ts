import { ServiceType } from '@fintech/shared';
import { IProviderAdapter, ProviderExecutionResult } from '../base/provider.interface';

export class MockFintechProvider implements IProviderAdapter {
  public providerId = 'MOCK_FINTECH_SWITCH';
  public name = 'Simulated National Payment Switch';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private generateRrn(): string {
    return `6${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
  }

  async executeDmtTransfer(params: {
    referenceId: string;
    remitterMobile: string;
    beneficiaryAccount: string;
    beneficiaryIfsc: string;
    beneficiaryName: string;
    amountPaise: number;
    channel: string;
  }): Promise<ProviderExecutionResult> {
    // Simulate provider latency
    await new Promise((res) => setTimeout(res, 600));

    const rrn = this.generateRrn();
    const isSuccess = true;

    return {
      success: isSuccess,
      providerId: this.providerId,
      providerReferenceId: `SW_${params.referenceId}`,
      bankRrn: rrn,
      statusCode: 'SUCCESS_00',
      message: `Transaction processed successfully via ${params.channel}. Bank Reference: ${rrn}`,
      data: {
        channel: params.channel,
        beneficiaryAccount: params.beneficiaryAccount,
        beneficiaryName: params.beneficiaryName,
        rrn
      },
      rawResponse: {
        status: 'SUCCESS',
        respCode: '00',
        rrn,
        utr: `UTR${rrn}`,
        txTime: new Date().toISOString()
      }
    };
  }

  async executeRecharge(params: {
    referenceId: string;
    operatorCode: string;
    circleCode: string;
    consumerNumber: string;
    amountPaise: number;
  }): Promise<ProviderExecutionResult> {
    await new Promise((res) => setTimeout(res, 500));
    const opRef = `OPR_${Date.now().toString().slice(-6)}`;

    return {
      success: true,
      providerId: this.providerId,
      providerReferenceId: `REC_${params.referenceId}`,
      bankRrn: opRef,
      statusCode: 'RECHARGE_SUCCESS',
      message: `Recharge of ₹${(params.amountPaise / 100).toFixed(2)} successful for ${params.consumerNumber}. Operator Ref: ${opRef}`,
      rawResponse: {
        operator: params.operatorCode,
        number: params.consumerNumber,
        operatorRef: opRef,
        status: 'SUCCESS'
      }
    };
  }

  async fetchBill(params: {
    billerId: string;
    consumerIdentifier: string;
  }): Promise<ProviderExecutionResult> {
    await new Promise((res) => setTimeout(res, 400));

    // Generate dynamic realistic bill details
    const amountPaise = 148500; // ₹1,485.00
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const billDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      success: true,
      providerId: this.providerId,
      providerReferenceId: `BBPS_FETCH_${Date.now()}`,
      statusCode: 'BILL_FETCHED',
      message: 'Bill fetched successfully from Bharat BillPay',
      data: {
        billerId: params.billerId,
        billerName: 'State Electricity Distribution Co. Ltd.',
        consumerIdentifier: params.consumerIdentifier,
        customerName: 'RAMESH CHANDRA PATEL',
        billNumber: `BILL-${params.consumerIdentifier.slice(-4)}-2026`,
        billDate,
        dueDate,
        billAmount: amountPaise,
        billPeriod: 'Monthly Regular'
      },
      rawResponse: {
        status: 'SUCCESS',
        complianceReason: 'BBPS_VALIDATED'
      }
    };
  }

  async payBill(params: {
    referenceId: string;
    billerId: string;
    consumerIdentifier: string;
    amountPaise: number;
  }): Promise<ProviderExecutionResult> {
    await new Promise((res) => setTimeout(res, 700));
    const bbpsRef = `BBPS${Date.now().toString().slice(-8)}`;

    return {
      success: true,
      providerId: this.providerId,
      providerReferenceId: bbpsRef,
      bankRrn: bbpsRef,
      statusCode: 'BILL_PAID_SUCCESS',
      message: `Bill paid successfully. Bharat Connect Ref: ${bbpsRef}`,
      data: {
        bbpsReferenceId: bbpsRef,
        billerId: params.billerId,
        amountPaise: params.amountPaise
      },
      rawResponse: {
        status: 'PAID',
        bbpsApprovalCode: `BBP${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString()
      }
    };
  }

  async lookupFastag(params: { vehicleNumber: string }): Promise<ProviderExecutionResult> {
    await new Promise((res) => setTimeout(res, 400));
    return {
      success: true,
      providerId: this.providerId,
      providerReferenceId: `FTG_${Date.now()}`,
      statusCode: 'FASTAG_ACTIVE',
      message: 'FASTag vehicle found active with NETC',
      data: {
        vehicleNumber: params.vehicleNumber,
        tagStatus: 'ACTIVE',
        customerName: 'SUNIL RAO',
        minRechargeAmount: 10000, // ₹100
        issuerBank: 'State Bank of India FASTag'
      },
      rawResponse: {
        netcTagId: `NETC_${params.vehicleNumber}`,
        status: 'ACTIVE'
      }
    };
  }

  async rechargeFastag(params: {
    referenceId: string;
    vehicleNumber: string;
    amountPaise: number;
  }): Promise<ProviderExecutionResult> {
    await new Promise((res) => setTimeout(res, 600));
    const rrn = this.generateRrn();
    return {
      success: true,
      providerId: this.providerId,
      providerReferenceId: `FT_REC_${params.referenceId}`,
      bankRrn: rrn,
      statusCode: 'FASTAG_RECHARGE_SUCCESS',
      message: `FASTag recharge of ₹${(params.amountPaise / 100).toFixed(2)} successful. NETC RRN: ${rrn}`,
      rawResponse: {
        status: 'SUCCESS',
        rrn,
        vehicle: params.vehicleNumber
      }
    };
  }

  async executeAepsAuth(params: {
    referenceId: string;
    transactionType: ServiceType;
    aadhaarLastFour: string;
    bankIin: string;
    amountPaise?: number;
    pidDataXml: string;
  }): Promise<ProviderExecutionResult> {
    await new Promise((res) => setTimeout(res, 800));
    const stan = Math.floor(100000 + Math.random() * 900000).toString();
    const rrn = this.generateRrn();

    return {
      success: true,
      providerId: this.providerId,
      providerReferenceId: `AEPS_${params.referenceId}`,
      bankRrn: rrn,
      statusCode: 'AEPS_00',
      message: `${params.transactionType} successful via NPCI AePS switch. RRN: ${rrn}`,
      data: {
        stan,
        rrn,
        authCode: `AUTH_${stan}`,
        balanceAmount: 1450000, // Remaining customer bank balance: ₹14,500.00
        miniStatement: [
          { date: '16/08', narration: 'UPI/P2A/CR/928371', amount: '+₹1,000.00', type: 'CR' },
          { date: '14/08', narration: 'ATM/WDL/019283', amount: '-₹2,000.00', type: 'DR' },
          { date: '12/08', narration: 'POS/PURCHASE/DMART', amount: '-₹1,450.00', type: 'DR' },
          { date: '10/08', narration: 'SALARY/CREDIT/AUG', amount: '+₹35,000.00', type: 'CR' }
        ]
      },
      rawResponse: {
        responseCode: '00',
        stan,
        rrn,
        authCode: `AUTH_${stan}`,
        timestamp: new Date().toISOString()
      }
    };
  }

  async executePayout(params: {
    referenceId: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    amountPaise: number;
    payoutMode: string;
  }): Promise<ProviderExecutionResult> {
    await new Promise((res) => setTimeout(res, 600));
    const utr = `UTR${this.generateRrn()}`;

    return {
      success: true,
      providerId: this.providerId,
      providerReferenceId: `PAY_${params.referenceId}`,
      bankRrn: utr,
      statusCode: 'PAYOUT_SUCCESS',
      message: `Settlement payout of ₹${(params.amountPaise / 100).toFixed(2)} completed to ${params.accountNumber}. Bank UTR: ${utr}`,
      data: {
        utr,
        accountNumber: params.accountNumber,
        payoutMode: params.payoutMode
      },
      rawResponse: {
        status: 'SUCCESS',
        utr,
        transferDate: new Date().toISOString()
      }
    };
  }
}

export const mockFintechProvider = new MockFintechProvider();
