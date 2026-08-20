import { Request, Response, NextFunction } from 'express';
import { ServiceType, TxStatus, DmtChannel } from '@fintech/shared';
import { store, TransactionRecord } from '../../core/store';
import { walletService } from '../wallet/wallet.service';
import { commissionService } from '../commission/commission.service';
import { providerSwitch } from '../../providers/switch/provider.switch';
import { verifyPin, generateReferenceId } from '../../utils/crypto';
import { idempotencyManager } from '../../core/idempotency';

export class DmtController {
  async lookupRemitter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mobile } = req.body;
      const remitter = store.remitters.get(mobile);

      if (!remitter) {
        res.status(200).json({
          success: true,
          statusCode: 200,
          data: {
            isRegistered: false,
            mobile
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const beneficiaries = store.beneficiaries.get(mobile) || [];

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          isRegistered: true,
          remitter,
          beneficiaries
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async registerRemitter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mobile, name } = req.body;

      const newRemitter = {
        mobile,
        name,
        monthlyLimit: 2500000, // ₹25,000.00
        remainingLimit: 2500000,
        isKycVerified: true,
        status: 'ACTIVE'
      };

      store.remitters.set(mobile, newRemitter);
      store.beneficiaries.set(mobile, []);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Remitter registered successfully',
        data: {
          remitter: newRemitter
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async addBeneficiary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { remitterMobile, beneficiaryName, accountNumber, ifscCode, bankName } = req.body;

      let benList = store.beneficiaries.get(remitterMobile);
      if (!benList) {
        benList = [];
        store.beneficiaries.set(remitterMobile, benList);
      }

      const newBen = {
        id: `ben_${Date.now()}`,
        remitterMobile,
        beneficiaryName,
        accountNumber,
        ifscCode,
        bankName,
        isVerified: true,
        createdAt: new Date().toISOString()
      };

      benList.push(newBen);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Beneficiary account added & penny-drop verified successfully.',
        data: {
          beneficiary: newBen
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async getBeneficiaries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mobile = String(req.params.mobile);
      const beneficiaries = store.beneficiaries.get(mobile) || [];
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: beneficiaries,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async executeTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user!.userId;
    const {
      remitterMobile,
      remitterName,
      accountNumber,
      ifscCode,
      bankName,
      beneficiaryName,
      amount,
      channel,
      transactionPin
    } = req.body;

    const amountPaise = parseInt(amount, 10);
    const referenceId = generateReferenceId('DMT');
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

    // Check Remitter Limit
    const remitter = store.remitters.get(remitterMobile);
    if (remitter && remitter.remainingLimit < amountPaise) {
      res.status(422).json({
        success: false,
        statusCode: 422,
        errorCode: 'LIMIT_EXCEEDED',
        message: `Remitter monthly limit of ₹${(remitter.remainingLimit / 100).toFixed(2)} exceeded.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calculate Commission
    const commission = commissionService.calculateCommission(ServiceType.DMT, amountPaise);
    const feeAmountPaise = 0;

    try {
      // 1. Hold Funds in Wallet
      await walletService.holdFunds(userId, amountPaise + feeAmountPaise);

      // 2. Invoke External Switch
      const activeProvider = await providerSwitch.getActiveProvider();
      const result = await activeProvider.executeDmtTransfer({
        referenceId,
        remitterMobile,
        beneficiaryAccount: accountNumber,
        beneficiaryIfsc: ifscCode,
        beneficiaryName,
        amountPaise,
        channel: channel || DmtChannel.IMPS
      });

      if (result.success) {
        // 3. Commit Double-Entry Ledger & Release Hold
        const { wallet } = await walletService.commitSuccessfulDebit({
          userId,
          grossAmount: amountPaise,
          feeAmount: feeAmountPaise,
          commissionNet: commission.retailerNet,
          serviceType: ServiceType.DMT,
          referenceId,
          description: `DMT ${channel || 'IMPS'} Transfer to ${beneficiaryName} (${accountNumber})`
        });

        // Deduct remitter limit
        if (remitter) {
          remitter.remainingLimit = Math.max(0, remitter.remainingLimit - amountPaise);
        }

        const txnRecord: TransactionRecord = {
          id: `txn_${Date.now()}`,
          referenceId,
          userId,
          serviceType: ServiceType.DMT,
          status: TxStatus.SUCCESS,
          grossAmount: amountPaise,
          feeAmount: feeAmountPaise,
          commissionAmount: commission.retailerNet,
          netAmount: amountPaise + feeAmountPaise - commission.retailerNet,
          providerId: result.providerId,
          providerReferenceId: result.providerReferenceId,
          providerStatus: 'SUCCESS',
          bankRrn: result.bankRrn,
          idempotencyKey: req.idempotencyKey || referenceId,
          details: {
            remitterMobile,
            remitterName,
            beneficiaryName,
            accountNumber,
            ifscCode,
            bankName,
            channel: channel || 'IMPS'
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
            beneficiaryName,
            accountNumber,
            ifscCode,
            bankName,
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
        await walletService.releaseHold(userId, amountPaise + feeAmountPaise);

        res.status(400).json({
          success: false,
          statusCode: 400,
          errorCode: 'PROVIDER_FAILURE',
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      await walletService.releaseHold(userId, amountPaise + feeAmountPaise).catch(() => {});
      next(err);
    }
  }
}

export const dmtController = new DmtController();
