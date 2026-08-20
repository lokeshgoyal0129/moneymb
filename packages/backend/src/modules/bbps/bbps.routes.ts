import { Router } from 'express';
import { bbpsController } from './bbps.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkIdempotency } from '../../middlewares/idempotency.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { billFetchSchema, billPaySchema } from '@fintech/shared';

const router = Router();

router.use(authenticate);

router.get('/billers', (req, res, next) => bbpsController.getBillers(req, res, next));
router.post('/fetch-bill', validate(billFetchSchema), (req, res, next) =>
  bbpsController.fetchBill(req, res, next)
);
router.post('/pay-bill', checkIdempotency, validate(billPaySchema), (req, res, next) =>
  bbpsController.payBill(req, res, next)
);

export const bbpsRoutes = router;
