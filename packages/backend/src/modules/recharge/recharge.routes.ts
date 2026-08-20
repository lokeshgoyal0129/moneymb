import { Router } from 'express';
import { rechargeController } from './recharge.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkIdempotency } from '../../middlewares/idempotency.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { executeRechargeSchema } from '@fintech/shared';

const router = Router();

router.use(authenticate);

router.get('/plans', (req, res, next) => rechargeController.getPlans(req, res, next));
router.post('/execute', checkIdempotency, validate(executeRechargeSchema), (req, res, next) =>
  rechargeController.executeRecharge(req, res, next)
);

export const rechargeRoutes = router;
