import { Request, Response, NextFunction } from 'express';
import { ServiceType, TxStatus, PayoutMode } from '@fintech/shared';
import { store, TransactionRecord } from '../../core/store';
import { providerSwitch } from '../../providers/switch/provider.switch';
import { verifyPin, generateReferenceId } from '../../utils/crypto';
import { idempotencyManager } from '../../core/idempotency';

export class SettlementController {
  async getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accounts = store.settlementAccounts.get(req.user!.userId) || [];
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: accounts,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async addAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { accountNumber, ifscCode, bankName, accountHolderName, isPrimary } = req.body;

      let list = store.settlementAccounts.get(userId);
      if (!list) {
        list = [];
        store.settlementAccounts.set(userId, list);
      }

      const newAccount = {
        id: `set_acc_${Date.now()}`,
        userId,
        accountNumber,
        ifscCode,
        bankName,
        accountHolderName,
        isVerified: true,
        isPrimary: isPrimary || list.length === 0,
        createdAt: new Date().toISOString()
      };

      if (newAccount.isPrimary) {
        list.forEach((a) => (a.isPrimary = false));
      }

      list.push(newAccount);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Settlement bank account verified and linked successfully.',
        data: newAccount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async executePayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user!.userId;
    const { settlementAccountId, amount, payoutMode, transactionPin } = req.body;
    const amountPaise = parseInt(amount, 10);
    const referenceId = generateReferenceId('PAY');

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

      const accounts = store.settlementAccounts.get(userId) || [];
      const account = accounts.find((a) => a.id === settlementAccountId);
      if (!account) {
        res.status(404).json({
          success: false,
          statusCode: 404,
          errorCode: 'ACCOUNT_NOT_FOUND',
          message: 'Settlement bank account not found.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const wallet = store.wallets.get(userId);
      if (!wallet) {
        res.status(404).json({ success: false, statusCode: 404, message: 'Wallet not found' });
        return;
      }

      const feePaise = 500; // ₹5.00 IMPS Payout Charge
      const totalDebit = amountPaise + feePaise;

      if (wallet.aepsBalance < totalDebit) {
        res.status(422).json({
          success: false,
          statusCode: 422,
          errorCode: 'INSUFFICIENT_AEPS_BALANCE',
          message: `Insufficient AePS balance (₹${(wallet.aepsBalance / 100).toFixed(2)}) for payout + fee of ₹${(totalDebit / 100).toFixed(2)}.`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Debit AePS balance
      wallet.aepsBalance -= totalDebit;
      wallet.updatedAt = new Date().toISOString();
      wallet.version += 1;

      // Invoke Provider Payout
      const activeProvider = await providerSwitch.getActiveProvider();
      const result = await activeProvider.executePayout({
        referenceId,
        accountNumber: account.accountNumber,
        ifscCode: account.ifscCode,
        accountHolderName: account.accountHolderName,
        amountPaise,
        payoutMode: payoutMode || PayoutMode.IMPS
      });

      if (result.success) {
        const txnRecord: TransactionRecord = {
          id: `txn_${Date.now()}`,
          referenceId,
          userId,
          serviceType: ServiceType.SETTLEMENT,
          status: TxStatus.SUCCESS,
          grossAmount: amountPaise,
          feeAmount: feePaise,
          commissionAmount: 0,
          netAmount: totalDebit,
          providerId: result.providerId,
          providerReferenceId: result.providerReferenceId,
          providerStatus: 'SUCCESS',
          bankRrn: result.bankRrn,
          idempotencyKey: req.idempotencyKey || referenceId,
          details: {
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            ifscCode: account.ifscCode,
            accountHolderName: account.accountHolderName,
            payoutMode: payoutMode || 'IMPS'
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
            amountPaise,
            feePaise,
            bankUtr: result.bankRrn,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            remainingAepsBalance: wallet.aepsBalance,
            receiptUrl: `/api/v1/reports/receipt/${referenceId}`
          },
          timestamp: new Date().toISOString()
        };

        if (req.idempotencyKey) {
          await idempotencyManager.saveResponse(req.idempotencyKey, responsePayload);
        }

        res.status(200).json(responsePayload);
      } else {
        wallet.aepsBalance += totalDebit;
        res.status(400).json({
          success: false,
          statusCode: 400,
          errorCode: 'PAYOUT_FAILED',
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      next(err);
    }
  }
}

export const settlementController = new SettlementController();
