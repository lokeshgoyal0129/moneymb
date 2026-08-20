import {
  ServiceType,
  CalculationType,
  CommissionBreakdownDto
} from '@fintech/shared';
import { store } from '../../core/store';
import { logger } from '../../utils/logger';

export class CommissionService {
  /**
   * Calculate commission and TDS split for a given service and amount
   */
  calculateCommission(serviceType: ServiceType, amountPaise: number): CommissionBreakdownDto {
    const slab = store.commissionSlabs.find(
      (s) =>
        s.serviceType === serviceType &&
        s.isActive &&
        amountPaise >= s.minAmount &&
        amountPaise <= s.maxAmount
    );

    if (!slab) {
      logger.warn('No active commission slab found for transaction', { serviceType, amountPaise });
      return {
        retailerCommission: 0,
        retailerTds: 0,
        retailerNet: 0,
        distributorCommission: 0,
        distributorTds: 0,
        distributorNet: 0,
        masterDistCommission: 0,
        masterDistTds: 0,
        masterDistNet: 0,
        platformMargin: 0
      };
    }

    let retGross = 0;
    let distGross = 0;
    let mdGross = 0;

    if (slab.calcType === CalculationType.FLAT) {
      retGross = slab.retailerVal;
      distGross = slab.distributorVal;
      mdGross = slab.masterDistVal;
    } else {
      // Percentage in basis points (e.g. 250 = 2.50% = 0.025)
      retGross = Math.round((amountPaise * slab.retailerVal) / 10000);
      distGross = Math.round((amountPaise * slab.distributorVal) / 10000);
      mdGross = Math.round((amountPaise * slab.masterDistVal) / 10000);
    }

    const tdsRate = slab.tdsPercentage / 100;

    const retTds = Math.round(retGross * tdsRate);
    const retNet = retGross - retTds;

    const distTds = Math.round(distGross * tdsRate);
    const distNet = distGross - distTds;

    const mdTds = Math.round(mdGross * tdsRate);
    const mdNet = mdGross - mdTds;

    return {
      retailerCommission: retGross,
      retailerTds: retTds,
      retailerNet: retNet,
      distributorCommission: distGross,
      distributorTds: distTds,
      distributorNet: distNet,
      masterDistCommission: mdGross,
      masterDistTds: mdTds,
      masterDistNet: mdNet,
      platformMargin: Math.max(0, Math.round(amountPaise * 0.001)) // 0.10% platform fee
    };
  }
}

export const commissionService = new CommissionService();
