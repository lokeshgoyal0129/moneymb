import { Request, Response, NextFunction } from 'express';
import { ServiceType, TxStatus, BbpsCategory } from '@fintech/shared';
import { store, TransactionRecord } from '../../core/store';
import { walletService } from '../wallet/wallet.service';
import { commissionService } from '../commission/commission.service';
import { providerSwitch } from '../../providers/switch/provider.switch';
import { verifyPin, generateReferenceId } from '../../utils/crypto';
import { idempotencyManager } from '../../core/idempotency';

export class BbpsController {
  async getBillers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;

      const billers = [
        // Electricity
        { billerId: 'ELEC_BESCOM', billerName: 'Bangalore Electricity Supply (BESCOM)', category: BbpsCategory.ELECTRICITY, paramName: 'Consumer Account ID', paramPlaceholder: 'Enter 10-digit Account ID', fetchRequirement: 'MANDATORY', supportPartialPay: false },
        { billerId: 'ELEC_TATA_MUM', billerName: 'Tata Power - Mumbai', category: BbpsCategory.ELECTRICITY, paramName: 'Consumer Number', paramPlaceholder: 'Enter 12-digit Consumer Number', fetchRequirement: 'MANDATORY', supportPartialPay: true },
        { billerId: 'ELEC_UPPCL_RURAL', billerName: 'UPPCL (Rural) - Uttar Pradesh', category: BbpsCategory.ELECTRICITY, paramName: 'Account Number', paramPlaceholder: 'Enter 12-digit Account No', fetchRequirement: 'MANDATORY', supportPartialPay: true },
        { billerId: 'ELEC_BSES_RAJ', billerName: 'BSES Rajdhani Power Limited - Delhi', category: BbpsCategory.ELECTRICITY, paramName: 'CA Number', paramPlaceholder: 'Enter 9-digit CA Number', fetchRequirement: 'MANDATORY', supportPartialPay: false },
        // Water
        { billerId: 'WATER_DJB', billerName: 'Delhi Jal Board', category: BbpsCategory.WATER, paramName: 'K No / Connection No', paramPlaceholder: 'Enter 10-digit KNO', fetchRequirement: 'MANDATORY', supportPartialPay: false },
        { billerId: 'WATER_BWSSB', billerName: 'Bangalore Water Supply & Sewerage Board', category: BbpsCategory.WATER, paramName: 'RR Number', paramPlaceholder: 'Enter RR Number (e.g. W12345)', fetchRequirement: 'MANDATORY', supportPartialPay: false },
        // Piped Gas
        { billerId: 'GAS_IGL', billerName: 'Indraprastha Gas Limited (IGL)', category: BbpsCategory.GAS, paramName: 'BP Number', paramPlaceholder: 'Enter 10-digit BP Number', fetchRequirement: 'MANDATORY', supportPartialPay: false },
        { billerId: 'GAS_MGL', billerName: 'Mahanagar Gas Limited (MGL)', category: BbpsCategory.GAS, paramName: 'CAN Number', paramPlaceholder: 'Enter 12-digit CAN', fetchRequirement: 'MANDATORY', supportPartialPay: false },
        // Broadband
        { billerId: 'BB_ACT', billerName: 'ACT Fibernet', category: BbpsCategory.BROADBAND, paramName: 'User ID / Account No', paramPlaceholder: 'Enter Account Number', fetchRequirement: 'MANDATORY', supportPartialPay: false },
        { billerId: 'BB_AIRTEL', billerName: 'Airtel Broadband / Landline', category: BbpsCategory.BROADBAND, paramName: 'Landline No with STD Code', paramPlaceholder: 'e.g. 08012345678', fetchRequirement: 'MANDATORY', supportPartialPay: false }
      ];

      const filtered = category
        ? billers.filter((b) => b.category === (category as string).toUpperCase())
        : billers;

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: filtered,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async fetchBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { billerId, consumerIdentifier } = req.body;
      const activeProvider = await providerSwitch.getActiveProvider();
      const result = await activeProvider.fetchBill({ billerId, consumerIdentifier });

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
          errorCode: 'BILL_FETCH_FAILED',
          message: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      next(err);
    }
  }

  async payBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user!.userId;
    const { billerId, billerName, category, consumerIdentifier, customerName, billNumber, amount, transactionPin } = req.body;
    const amountPaise = parseInt(amount, 10);
    const referenceId = generateReferenceId('BBPS');

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

      // Calculate commission (Flat ₹0.50)
      const commission = commissionService.calculateCommission(ServiceType.BBPS, amountPaise);

      // 1. Hold Funds
      await walletService.holdFunds(userId, amountPaise);

      // 2. Invoke Provider
      const activeProvider = await providerSwitch.getActiveProvider();
      const result = await activeProvider.payBill({
        referenceId,
        billerId,
        consumerIdentifier,
        amountPaise
      });

      if (result.success) {
        // 3. Commit Ledger
        const { wallet } = await walletService.commitSuccessfulDebit({
          userId,
          grossAmount: amountPaise,
          feeAmount: 0,
          commissionNet: commission.retailerNet,
          serviceType: ServiceType.BBPS,
          referenceId,
          description: `BBPS Bill Payment for ${billerName} (Consumer: ${consumerIdentifier})`
        });

        const txnRecord: TransactionRecord = {
          id: `txn_${Date.now()}`,
          referenceId,
          userId,
          serviceType: ServiceType.BBPS,
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
            billerId,
            billerName,
            category,
            consumerIdentifier,
            customerName,
            billNumber
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
            bbpsReferenceId: result.bankRrn,
            billerName,
            customerName,
            consumerIdentifier,
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
          errorCode: 'BILL_PAY_FAILED',
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

export const bbpsController = new BbpsController();
