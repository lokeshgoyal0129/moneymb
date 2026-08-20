import { Request, Response, NextFunction } from 'express';
import { ServiceType, TxStatus } from '@fintech/shared';
import { store, TransactionRecord } from '../../core/store';
import { walletService } from '../wallet/wallet.service';
import { commissionService } from '../commission/commission.service';
import { providerSwitch } from '../../providers/switch/provider.switch';
import { verifyPin, generateReferenceId } from '../../utils/crypto';
import { idempotencyManager } from '../../core/idempotency';

export class RechargeController {
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { operatorCode, circleCode } = req.query;

      const plans = [
        {
          id: 'plan_1',
          operatorCode: (operatorCode as string) || 'JIO',
          circleCode: (circleCode as string) || 'MH',
          amount: 29900, // ₹299.00
          validity: '28 Days',
          data: '1.5 GB/Day',
          talktime: 'Unlimited',
          description: 'Unlimited Voice Calls + 1.5 GB/Day Data + 100 SMS/Day + Jio Apps Subscription',
          planType: 'Popular'
        },
        {
          id: 'plan_2',
          operatorCode: (operatorCode as string) || 'JIO',
          circleCode: (circleCode as string) || 'MH',
          amount: 74900, // ₹749.00
          validity: '72 Days',
          data: '2.0 GB/Day',
          talktime: 'Unlimited',
          description: 'Unlimited Calls + 2 GB/Day High-Speed 5G Data + Unlimited 5G Data Pack',
          planType: 'Hero Unlimited'
        },
        {
          id: 'plan_3',
          operatorCode: (operatorCode as string) || 'JIO',
          circleCode: (circleCode as string) || 'MH',
          amount: 359900, // ₹3,599.00
          validity: '365 Days',
          data: '2.5 GB/Day',
          talktime: 'Unlimited',
          description: 'Annual Plan: Unlimited Voice + 2.5 GB/Day + 1 Year OTT Entertainment Pack',
          planType: 'Annual'
        },
        {
          id: 'plan_4',
          operatorCode: (operatorCode as string) || 'JIO',
          circleCode: (circleCode as string) || 'MH',
          amount: 1900, // ₹19.00
          validity: 'Active Plan',
          data: '1 GB',
          talktime: 'NA',
          description: 'Data Booster: 1 GB High-Speed Data Add-on',
          planType: 'Data Add-on'
        }
      ];

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: plans,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async executeRecharge(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user!.userId;
    const { operatorCode, circleCode, consumerNumber, rechargeType, amount, transactionPin } = req.body;
    const amountPaise = parseInt(amount, 10);
    const referenceId = generateReferenceId('REC');

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

      // Calculate commission (2.5% on recharge)
      const commission = commissionService.calculateCommission(ServiceType.RECHARGE, amountPaise);

      // 1. Hold Funds
      await walletService.holdFunds(userId, amountPaise);

      // 2. Invoke Provider
      const activeProvider = await providerSwitch.getActiveProvider();
      const result = await activeProvider.executeRecharge({
        referenceId,
        operatorCode,
        circleCode,
        consumerNumber,
        amountPaise
      });

      if (result.success) {
        // 3. Commit Double-Entry Ledger & Credit Net Commission
        const { wallet } = await walletService.commitSuccessfulDebit({
          userId,
          grossAmount: amountPaise,
          feeAmount: 0,
          commissionNet: commission.retailerNet,
          serviceType: ServiceType.RECHARGE,
          referenceId,
          description: `${rechargeType} Recharge for ${consumerNumber} (${operatorCode})`
        });

        const txnRecord: TransactionRecord = {
          id: `txn_${Date.now()}`,
          referenceId,
          userId,
          serviceType: ServiceType.RECHARGE,
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
            operatorCode,
            circleCode,
            consumerNumber,
            rechargeType
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
            operatorReference: result.bankRrn,
            consumerNumber,
            operatorCode,
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
          errorCode: 'RECHARGE_FAILED',
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

export const rechargeController = new RechargeController();
