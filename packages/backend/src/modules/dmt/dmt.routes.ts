import { Router } from 'express';
import { dmtController } from './dmt.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkIdempotency } from '../../middlewares/idempotency.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  remitterLookupSchema,
  remitterRegisterSchema,
  beneficiaryAddSchema,
  dmtTransferSchema
} from '@fintech/shared';

const router = Router();

router.use(authenticate);

router.post('/remitter/lookup', validate(remitterLookupSchema), (req, res, next) =>
  dmtController.lookupRemitter(req, res, next)
);

router.post('/remitter/register', validate(remitterRegisterSchema), (req, res, next) =>
  dmtController.registerRemitter(req, res, next)
);

router.post('/beneficiary/add', validate(beneficiaryAddSchema), (req, res, next) =>
  dmtController.addBeneficiary(req, res, next)
);

router.get('/beneficiaries/:mobile', (req, res, next) =>
  dmtController.getBeneficiaries(req, res, next)
);

router.post('/transfer', checkIdempotency, validate(dmtTransferSchema), (req, res, next) =>
  dmtController.executeTransfer(req, res, next)
);

export const dmtRoutes = router;
