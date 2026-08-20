import { Router } from 'express';
import { fastagController } from './fastag.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkIdempotency } from '../../middlewares/idempotency.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { fastagLookupSchema, fastagRechargeSchema } from '@fintech/shared';

const router = Router();

router.use(authenticate);

router.post('/lookup', validate(fastagLookupSchema), (req, res, next) =>
  fastagController.lookup(req, res, next)
);
router.post('/recharge', checkIdempotency, validate(fastagRechargeSchema), (req, res, next) =>
  fastagController.recharge(req, res, next)
);

export const fastagRoutes = router;
