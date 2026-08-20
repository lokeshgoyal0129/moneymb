import { Router } from 'express';
import { disputesController } from './disputes.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => disputesController.getDisputes(req, res, next));
router.post('/create', (req, res, next) => disputesController.createDispute(req, res, next));

export const disputesRoutes = router;
