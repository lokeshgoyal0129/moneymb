import { Request, Response, NextFunction } from 'express';
import { ServiceType, TxStatus } from '@fintech/shared';
import { store, TransactionRecord } from '../../core/store';
import { walletService } from '../wallet/wallet.service';
import { commissionService } from '../commission/commission.service';
import { providerSwitch } from '../../providers/switch/provider.switch';
import { verifyPin, generateReferenceId } from '../../utils/crypto';
import { idempotencyManager } from '../../core/idempotency';

export class FastagController {
  async lookup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vehicleNumber } = req.body;
      const activeProvider = await providerSwitch.getActiveProvider();
      const result = await activeProvider.lookupFastag({ vehicleNumber });

      if (result.success && result.data) {
        res.status(200).json({
          success: true,
          statusCode: 200,
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          statusCode: 400,
          errorCode: 'FASTAG_NOT_FOUND',
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      next(err);
    }
  }

  async recharge(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user!.userId;
    const { vehicleNumber, operatorCode, amount, transactionPin } = req.body;
    const amountPaise = parseInt(amount, 10);
    const referenceId = generateReferenceId('FTG');

    try {
      const user = store.users.get(userId);
      if (!user) {
        res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });
        return;
      }

      // Verify PIN
      const isPinValid = await verifyPin(transactionPin, user.pinHash);
      if (!isPinValid) {
        res.status(403).json({
          success: false,
          statusCode: 403,
          errorCode: 'INVALID_PIN',
          message: 'Invalid Transaction PIN.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const commission = commissionService.calculateCommission(ServiceType.FASTAG, amountPaise);

      // 1. Hold Funds
      await walletService.holdFunds(userId, amountPaise);

      // 2. Invoke Provider
      const activeProvider = await providerSwitch.getActiveProvider();
      const result = await activeProvider.rechargeFastag({
        referenceId,
        vehicleNumber,
        amountPaise
      });

      if (result.success) {
        // 3. Commit Ledger
        const { wallet } = await walletService.commitSuccessfulDebit({
          userId,
          grossAmount: amountPaise,
          feeAmount: 0,
          commissionNet: commission.retailerNet,
          serviceType: ServiceType.FASTAG,
          referenceId,
          description: `FASTag Recharge for Vehicle: ${vehicleNumber}`
        });

        const txnRecord: TransactionRecord = {
          id: `txn_${Date.now()}`,
          referenceId,
          userId,
          serviceType: ServiceType.FASTAG,
          status: TxStatus.SUCCESS,
          grossAmount: amountPaise,
          feeAmount: 0,
          commissionAmount: commission.retailerNet,
          netAmount: amountPaise - commission.retailerNet,
          providerId: result.providerId,
          providerReferenceId: result.providerReferenceId,
          providerStatus: 'SUCCESS',
          bankRrn: result.bankRrn,
          idempotencyKey: req.idempotencyKey || referenceId,
          details: {
            vehicleNumber,
            operatorCode
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
            grossAmount: amountPaise,
            commissionEarned: commission.retailerNet,
            bankRrn: result.bankRrn,
            vehicleNumber,
            closingBalance: wallet.mainBalance,
            receiptUrl: `/api/v1/reports/receipt/${referenceId}`
          },
          timestamp: new Date().toISOString()
        };

        if (req.idempotencyKey) {
          await idempotencyManager.saveResponse(req.idempotencyKey, responsePayload);
        }

        res.status(200).json(responsePayload);
      } else {
        await walletService.releaseHold(userId, amountPaise);
        res.status(400).json({
          success: false,
          statusCode: 400,
          errorCode: 'FASTAG_RECHARGE_FAILED',
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      await walletService.releaseHold(userId, amountPaise).catch(() => {});
      next(err);
    }
  }
}

export const fastagController = new FastagController();
