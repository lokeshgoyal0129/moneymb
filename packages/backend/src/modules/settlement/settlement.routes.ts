import { Router } from 'express';
import { settlementController } from './settlement.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkIdempotency } from '../../middlewares/idempotency.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { addSettlementBankSchema, settlementRequestSchema } from '@fintech/shared';

const router = Router();

router.use(authenticate);

router.get('/accounts', (req, res, next) => settlementController.getAccounts(req, res, next));
router.post('/bank/add', validate(addSettlementBankSchema), (req, res, next) =>
  settlementController.addAccount(req, res, next)
);
router.post('/payout', checkIdempotency, validate(settlementRequestSchema), (req, res, next) =>
  settlementController.executePayout(req, res, next)
);

export const settlementRoutes = router;
