import { Router } from 'express';
import { walletController } from './wallet.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/balance', (req, res, next) => walletController.getBalance(req, res, next));
router.post('/fund-request', (req, res, next) => walletController.fundRequest(req, res, next));
router.post('/internal-transfer', (req, res, next) => walletController.internalTransfer(req, res, next));

export const walletRoutes = router;
