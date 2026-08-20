import { v4 as uuidv4 } from 'uuid';
import {
  ServiceType,
  AccountType,
  PocketType,
  PassbookEntryDto,
  TxStatus
} from '@fintech/shared';
import { store, JournalEntryRecord, JournalLineRecord } from '../../core/store';
import { logger } from '../../utils/logger';

export interface CreateJournalLineInput {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
}

export class LedgerService {
  /**
   * Post a balanced double-entry journal entry.
   * Invariant: Total Debits MUST strictly equal Total Credits.
   */
  async postEntry(params: {
    transactionId?: string;
    referenceId?: string;
    serviceType: ServiceType;
    description: string;
    lines: CreateJournalLineInput[];
  }): Promise<JournalEntryRecord> {
    let totalDebit = 0;
    let totalCredit = 0;

    params.lines.forEach((line) => {
      totalDebit += line.debitAmount;
      totalCredit += line.creditAmount;
    });

    if (totalDebit !== totalCredit) {
      logger.error('Double-entry invariant violation! Debits do not equal Credits', {
        totalDebit,
        totalCredit,
        lines: params.lines
      });
      throw new Error(`Ledger Invariant Violation: Total Debits (${totalDebit}) must equal Total Credits (${totalCredit}).`);
    }

    const entryId = `je_${uuidv4()}`;
    const entryNumber = `JE_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const journalLines: JournalLineRecord[] = [];

    // Apply line by line and calculate running balance
    for (const lineInput of params.lines) {
      const account = store.ledgerAccounts.get(lineInput.accountId);
      if (!account) {
        throw new Error(`Ledger account not found: ${lineInput.accountId}`);
      }

      // Update account balance based on account type
      // ASSET / EXPENSE: Increases with Debit, Decreases with Credit
      // LIABILITY / EQUITY / REVENUE: Increases with Credit, Decreases with Debit
      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
        account.balance += lineInput.debitAmount - lineInput.creditAmount;
      } else {
        account.balance += lineInput.creditAmount - lineInput.debitAmount;
      }

      const journalLine: JournalLineRecord = {
        id: `jl_${uuidv4()}`,
        journalEntryId: entryId,
        accountId: account.id,
        accountNumber: account.accountNumber,
        debitAmount: lineInput.debitAmount,
        creditAmount: lineInput.creditAmount,
        balanceAfter: account.balance,
        createdAt: new Date().toISOString()
      };

      journalLines.push(journalLine);
    }

    const journalEntry: JournalEntryRecord = {
      id: entryId,
      entryNumber,
      transactionId: params.transactionId,
      referenceId: params.referenceId,
      serviceType: params.serviceType,
      description: params.description,
      lines: journalLines,
      postedAt: new Date().toISOString()
    };

    store.journalEntries.push(journalEntry);
    logger.info('Journal entry successfully posted', { entryNumber, totalAmount: totalDebit });

    return journalEntry;
  }

  /**
   * Get user passbook history from ledger entries
   */
  async getUserPassbook(userId: string): Promise<PassbookEntryDto[]> {
    const userWalletAccount = Array.from(store.ledgerAccounts.values()).find(
      (a) => a.userId === userId && a.pocket === PocketType.MAIN
    );

    if (!userWalletAccount) {
      return [];
    }

    const passbookEntries: PassbookEntryDto[] = [];

    // Find all journal lines touching this user's account
    for (const entry of store.journalEntries) {
      const matchingLine = entry.lines.find((l) => l.accountId === userWalletAccount.id);
      if (matchingLine) {
        passbookEntries.push({
          id: matchingLine.id,
          transactionId: entry.transactionId,
          referenceId: entry.referenceId,
          serviceType: entry.serviceType,
          description: entry.description,
          pocket: PocketType.MAIN,
          debitAmount: matchingLine.debitAmount,
          creditAmount: matchingLine.creditAmount,
          closingBalance: matchingLine.balanceAfter,
          status: TxStatus.SUCCESS,
          postedAt: matchingLine.createdAt
        });
      }
    }

    return passbookEntries.reverse(); // Most recent first
  }
}

export const ledgerService = new LedgerService();
