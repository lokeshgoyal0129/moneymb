import { Request, Response, NextFunction } from 'express';
import { store } from '../../core/store';
import { UserRole } from '@fintech/shared';

export class AdminController {
  async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const txns = Array.from(store.transactions.values());
      const users = Array.from(store.users.values());

      let totalTurnoverPaise = 0;
      let totalCommissionPaise = 0;

      txns.forEach((t) => {
        if (t.status === 'SUCCESS') {
          totalTurnoverPaise += t.grossAmount;
          totalCommissionPaise += t.commissionAmount;
        }
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          totalTurnoverPaise,
          totalCommissionPaise,
          totalTransactions: txns.length,
          totalUsers: users.length,
          retailerCount: users.filter((u) => u.role === UserRole.RETAILER).length,
          distributorCount: users.filter((u) => u.role === UserRole.DISTRIBUTOR).length,
          masterDistributorCount: users.filter((u) => u.role === UserRole.MASTER_DISTRIBUTOR).length,
          openDisputes: store.disputes.filter((d) => d.status === 'OPEN').length
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = Array.from(store.users.values()).map((u) => {
        const wallet = store.wallets.get(u.id);
        return {
          id: u.id,
          customId: u.customId,
          fullName: u.fullName,
          shopName: u.shopName,
          email: u.email,
          mobile: u.mobile,
          role: u.role,
          status: u.status,
          kycStatus: u.kycStatus,
          wallet: wallet ? {
            mainBalance: wallet.mainBalance,
            aepsBalance: wallet.aepsBalance
          } : null,
          createdAt: u.createdAt
        };
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: users,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async getSlabs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: store.commissionSlabs,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
