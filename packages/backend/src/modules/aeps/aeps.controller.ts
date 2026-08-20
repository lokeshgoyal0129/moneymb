import { Request, Response, NextFunction } from 'express';
import { ServiceType, TxStatus } from '@fintech/shared';
import { store, TransactionRecord } from '../../core/store';
import { walletService } from '../wallet/wallet.service';
import { commissionService } from '../commission/commission.service';
import { providerSwitch } from '../../providers/switch/provider.switch';
import { generateReferenceId } from '../../utils/crypto';
import { idempotencyManager } from '../../core/idempotency';

export class AepsController {
  async executeAepsAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user!.userId;
    const {
      aadhaarLastFour,
      bankIin,
      bankName,
      transactionType,
      amount,
      pidDataXml,
      deviceMake,
      deviceModel,
      deviceSerial
    } = req.body;

    const amountPaise = amount ? parseInt(amount, 10) : 0;
    const referenceId = generateReferenceId('AEPS');

    try {
      const activeProvider = await providerSwitch.getActiveProvider();
      const result = await activeProvider.executeAepsAuth({
        referenceId,
        transactionType: transactionType as ServiceType,
        aadhaarLastFour,
        bankIin,
        amountPaise,
        pidDataXml
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          errorCode: 'AEPS_AUTH_FAILED',
          message: result.message,
          timestamp: new Date().toISOString()
        });
        return;
      }

      let commissionEarned = 0;
      let updatedWallet = null;

      // For Cash Withdrawal: credit agent's AePS settlement balance
      if (transactionType === ServiceType.AEPS_CW && amountPaise > 0) {
        const commission = commissionService.calculateCommission(ServiceType.AEPS_CW, amountPaise);
        commissionEarned = commission.retailerNet;

        updatedWallet = await walletService.creditAepsSuccess({
          userId,
          cashAmount: amountPaise,
          commissionNet: commissionEarned,
          referenceId,
          description: `AePS Cash Withdrawal of ₹${(amountPaise / 100).toFixed(2)} (Aadhaar: XXXX-XXXX-${aadhaarLastFour})`
        });
      } else {
        const currentWallet = await walletService.getWallet(userId);
        updatedWallet = currentWallet;
      }

      const txnRecord: TransactionRecord = {
        id: `txn_${Date.now()}`,
        referenceId,
        userId,
        serviceType: transactionType as ServiceType,
        status: TxStatus.SUCCESS,
        grossAmount: amountPaise,
        feeAmount: 0,
        commissionAmount: commissionEarned,
        netAmount: amountPaise + commissionEarned,
        providerId: result.providerId,
        providerReferenceId: result.providerReferenceId,
        providerStatus: 'SUCCESS',
        bankRrn: result.bankRrn,
        idempotencyKey: req.idempotencyKey || referenceId,
        details: {
          aadhaarLastFour,
          bankIin,
          bankName,
          deviceMake,
          deviceModel,
          deviceSerial,
          stan: result.data?.stan
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      store.transactions.set(referenceId, txnRecord);

      const responsePayload = {
        success: true,
        statusCode: 200,
        message: result.message,
        data: {
          referenceId,
          status: TxStatus.SUCCESS,
          transactionType,
          aadhaarMasked: `XXXX-XXXX-${aadhaarLastFour}`,
          bankName,
          bankRrn: result.bankRrn,
          stan: result.data?.stan,
          amountPaise,
          commissionEarned,
          customerBalancePaise: result.data?.balanceAmount,
          miniStatement: result.data?.miniStatement,
          aepsBalance: updatedWallet.aepsBalance,
          mainBalance: updatedWallet.mainBalance,
          receiptUrl: `/api/v1/reports/receipt/${referenceId}`
        },
        timestamp: new Date().toISOString()
      };

      if (req.idempotencyKey) {
        await idempotencyManager.saveResponse(req.idempotencyKey, responsePayload);
      }

      res.status(200).json(responsePayload);
    } catch (err) {
      next(err);
    }
  }
}

export const aepsController = new AepsController();
