import { Request, Response, NextFunction } from 'express';
import { walletService } from './wallet.service';
import { store } from '../../core/store';
import { verifyPin } from '../../utils/crypto';

export class WalletController {
  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const balances = await walletService.getWallet(req.user!.userId);
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: balances,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async fundRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, paymentMode, bankRef } = req.body;
      const amountPaise = parseInt(amount, 10);

      if (!amountPaise || amountPaise <= 0) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          errorCode: 'INVALID_AMOUNT',
          message: 'Fund request amount must be greater than 0',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const wallet = store.wallets.get(req.user!.userId);
      if (!wallet) {
        res.status(404).json({
          success: false,
          statusCode: 404,
          errorCode: 'WALLET_NOT_FOUND',
          message: 'Wallet not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      wallet.mainBalance += amountPaise;
      wallet.updatedAt = new Date().toISOString();
      wallet.version += 1;

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Fund request of ₹${(amountPaise / 100).toFixed(2)} approved and credited to wallet.`,
        data: {
          creditedAmount: amountPaise,
          paymentMode: paymentMode || 'UPI_DIRECT',
          bankRef: bankRef || `REF_${Date.now()}`,
          closingBalance: wallet.mainBalance
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async internalTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recipientMobile, amount, transactionPin } = req.body;
      const amountPaise = parseInt(amount, 10);
      const sender = store.users.get(req.user!.userId);

      if (!sender) {
        res.status(404).json({ success: false, statusCode: 404, message: 'User not found' });
        return;
      }

      const isPinValid = await verifyPin(transactionPin, sender.pinHash);
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

      const recipient = Array.from(store.users.values()).find((u) => u.mobile === recipientMobile);
      if (!recipient) {
        res.status(404).json({
          success: false,
          statusCode: 404,
          errorCode: 'RECIPIENT_NOT_FOUND',
          message: `No agent found with mobile ${recipientMobile}`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const senderWallet = store.wallets.get(sender.id);
      const recipientWallet = store.wallets.get(recipient.id);

      if (!senderWallet || !recipientWallet) {
        res.status(404).json({ success: false, statusCode: 404, message: 'Wallet not found' });
        return;
      }

      if (senderWallet.mainBalance < amountPaise) {
        res.status(422).json({
          success: false,
          statusCode: 422,
          errorCode: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient balance for transfer',
          timestamp: new Date().toISOString()
        });
        return;
      }

      senderWallet.mainBalance -= amountPaise;
      recipientWallet.mainBalance += amountPaise;
      senderWallet.version += 1;
      recipientWallet.version += 1;

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Transferred ₹${(amountPaise / 100).toFixed(2)} to ${recipient.fullName} (${recipient.shopName})`,
        data: {
          amount: amountPaise,
          recipientName: recipient.fullName,
          recipientShop: recipient.shopName,
          senderClosingBalance: senderWallet.mainBalance
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}

export const walletController = new WalletController();
