import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/transactions', (req, res, next) => reportsController.getTransactions(req, res, next));
router.get('/summary', (req, res, next) => reportsController.getSummary(req, res, next));
router.get('/passbook', (req, res, next) => reportsController.getPassbook(req, res, next));
router.get('/receipt/:referenceId', (req, res, next) => reportsController.getReceipt(req, res, next));

export const reportsRoutes = router;
