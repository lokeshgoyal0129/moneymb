import { Request, Response, NextFunction } from 'express';
import { store } from '../../core/store';
import { DisputeStatus } from '@fintech/shared';

export class DisputesController {
  async getDisputes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      let list = store.disputes;
      if (user.role === 'RETAILER') {
        list = list.filter((d) => d.userId === user.userId);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: list,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }

  async createDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { transactionId, referenceId, serviceType, reason } = req.body;

      const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

      const newDispute = {
        id: `dsp_${Date.now()}`,
        ticketNumber,
        transactionId: transactionId || referenceId,
        referenceId,
        userId,
        serviceType,
        reason,
        status: DisputeStatus.OPEN,
        createdAt: new Date().toISOString()
      };

      store.disputes.unshift(newDispute);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: `Complaint registered successfully. Ticket ID: ${ticketNumber}`,
        data: newDispute,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  }
}

export const disputesController = new DisputesController();
