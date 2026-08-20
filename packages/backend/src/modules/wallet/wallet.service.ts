import {
  PocketType,
  ServiceType,
  WalletBalancesDto
} from '@fintech/shared';
import { store, WalletRecord } from '../../core/store';
import { lockManager } from '../../core/lock';
import { ledgerService } from '../ledger/ledger.service';
import { logger } from '../../utils/logger';

export class WalletService {
  /**
   * Get user wallet balances across all pockets
   */
  async getWallet(userId: string): Promise<WalletBalancesDto> {
    const wallet = store.wallets.get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user: ${userId}`);
    }

    return {
      mainBalance: wallet.mainBalance,
      aepsBalance: wallet.aepsBalance,
      creditBalance: wallet.creditBalance,
      holdBalance: wallet.holdBalance,
      totalAvailable: wallet.mainBalance + wallet.creditBalance,
      currency: wallet.currency,
      isLocked: wallet.isLocked
    };
  }

  /**
   * Lock and move funds from mainBalance to holdBalance for in-flight transaction
   */
  async holdFunds(userId: string, totalDebitRequired: number): Promise<WalletRecord> {
    const releaseLock = await lockManager.acquire(`wallet:${userId}`);
    try {
      const wallet = store.wallets.get(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.isLocked) {
        throw new Error('Wallet is temporarily locked by administrator.');
      }

      const availableBalance = wallet.mainBalance + wallet.creditBalance;
      if (availableBalance < totalDebitRequired) {
        throw new Error(
          `Insufficient wallet balance. Required: ₹${(totalDebitRequired / 100).toFixed(2)}, Available: ₹${(availableBalance / 100).toFixed(2)}`
        );
      }

      // Debit from mainBalance, credit to holdBalance
      wallet.mainBalance -= totalDebitRequired;
      wallet.holdBalance += totalDebitRequired;
      wallet.updatedAt = new Date().toISOString();
      wallet.version += 1;

      logger.info('Funds held successfully for transaction', {
        userId,
        heldAmount: totalDebitRequired,
        remainingMainBalance: wallet.mainBalance
      });

      return wallet;
    } finally {
      releaseLock();
    }
  }

  /**
   * Release hold upon failed transaction
   */
  async releaseHold(userId: string, amountToRelease: number): Promise<WalletRecord> {
    const releaseLock = await lockManager.acquire(`wallet:${userId}`);
    try {
      const wallet = store.wallets.get(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      wallet.holdBalance = Math.max(0, wallet.holdBalance - amountToRelease);
      wallet.mainBalance += amountToRelease;
      wallet.updatedAt = new Date().toISOString();
      wallet.version += 1;

      logger.info('Held funds released back to wallet', {
        userId,
        amountToRelease,
        mainBalance: wallet.mainBalance
      });

      return wallet;
    } finally {
      releaseLock();
    }
  }

  /**
   * Finalize transaction success:
   * Deducts from holdBalance permanently, adds retailer commission to mainBalance, and writes double-entry ledger.
   */
  async commitSuccessfulDebit(params: {
    userId: string;
    grossAmount: number;
    feeAmount: number;
    commissionNet: number;
    serviceType: ServiceType;
    referenceId: string;
    description: string;
  }): Promise<{ wallet: WalletBalancesDto; journalEntry: any }> {
    const releaseLock = await lockManager.acquire(`wallet:${params.userId}`);
    try {
      const wallet = store.wallets.get(params.userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const totalHeld = params.grossAmount + params.feeAmount;
      wallet.holdBalance = Math.max(0, wallet.holdBalance - totalHeld);
      // Credit net commission directly to main wallet
      if (params.commissionNet > 0) {
        wallet.mainBalance += params.commissionNet;
      }
      wallet.updatedAt = new Date().toISOString();
      wallet.version += 1;

      // Double-Entry Ledger Posting
      const userMainAcc = Array.from(store.ledgerAccounts.values()).find(
        (a) => a.userId === params.userId && a.pocket === PocketType.MAIN
      );

      const escrowAcc =
        params.serviceType === ServiceType.DMT
          ? store.ledgerAccounts.get('acc_escrow_dmt')!
          : params.serviceType === ServiceType.BBPS
          ? store.ledgerAccounts.get('acc_escrow_bbps')!
          : store.ledgerAccounts.get('acc_escrow_recharge')!;

      const commissionExpenseAcc = store.ledgerAccounts.get('acc_commission_expense')!;
      const feeRevenueAcc = store.ledgerAccounts.get('acc_fee_revenue')!;

      // Balanced journal entry
      const journalLines = [
        {
          accountId: userMainAcc ? userMainAcc.id : 'acc_escrow_recharge',
          debitAmount: totalHeld,
          creditAmount: 0
        },
        {
          accountId: escrowAcc.id,
          debitAmount: 0,
          creditAmount: params.grossAmount
        }
      ];

      if (params.feeAmount > 0) {
        journalLines.push({
          accountId: feeRevenueAcc.id,
          debitAmount: 0,
          creditAmount: params.feeAmount
        });
      }

      if (params.commissionNet > 0 && userMainAcc) {
        journalLines.push(
          {
            accountId: commissionExpenseAcc.id,
            debitAmount: params.commissionNet,
            creditAmount: 0
          },
          {
            accountId: userMainAcc.id,
            debitAmount: 0,
            creditAmount: params.commissionNet
          }
        );
      }

      const journalEntry = await ledgerService.postEntry({
        transactionId: params.referenceId,
        referenceId: params.referenceId,
        serviceType: params.serviceType,
        description: params.description,
        lines: journalLines
      });

      return {
        wallet: {
          mainBalance: wallet.mainBalance,
          aepsBalance: wallet.aepsBalance,
          creditBalance: wallet.creditBalance,
          holdBalance: wallet.holdBalance,
          totalAvailable: wallet.mainBalance + wallet.creditBalance,
          currency: wallet.currency,
          isLocked: wallet.isLocked
        },
        journalEntry
      };
    } finally {
      releaseLock();
    }
  }

  /**
   * AePS Cash Withdrawal success: Credits AePS settlement pocket + Commission
   */
  async creditAepsSuccess(params: {
    userId: string;
    cashAmount: number;
    commissionNet: number;
    referenceId: string;
    description: string;
  }): Promise<WalletBalancesDto> {
    const releaseLock = await lockManager.acquire(`wallet:${params.userId}`);
    try {
      const wallet = store.wallets.get(params.userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Add cash withdrawn + commission to AePS settlement pocket
      wallet.aepsBalance += params.cashAmount + params.commissionNet;
      wallet.updatedAt = new Date().toISOString();
      wallet.version += 1;

      return {
        mainBalance: wallet.mainBalance,
        aepsBalance: wallet.aepsBalance,
        creditBalance: wallet.creditBalance,
        holdBalance: wallet.holdBalance,
        totalAvailable: wallet.mainBalance + wallet.creditBalance,
        currency: wallet.currency,
        isLocked: wallet.isLocked
      };
    } finally {
      releaseLock();
    }
  }
}

export const walletService = new WalletService();
