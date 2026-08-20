import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { UserRole } from '@fintech/shared';

const router = Router();

router.use(authenticate);
router.use(requireRoles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MASTER_DISTRIBUTOR));

router.get('/overview', (req, res, next) => adminController.getOverview(req, res, next));
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.get('/slabs', (req, res, next) => adminController.getSlabs(req, res, next));

export const adminRoutes = router;
