import { Router } from 'express';
import { aepsController } from './aeps.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkIdempotency } from '../../middlewares/idempotency.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { aepsAuthSchema } from '@fintech/shared';

const router = Router();

router.use(authenticate);

router.post('/auth', checkIdempotency, validate(aepsAuthSchema), (req, res, next) =>
  aepsController.executeAepsAuth(req, res, next)
);

export const aepsRoutes = router;
