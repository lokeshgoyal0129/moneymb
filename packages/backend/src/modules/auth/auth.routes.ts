import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { loginSchema, registerUserSchema } from '@fintech/shared';

const router = Router();

router.post('/login', validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/register', validate(registerUserSchema), (req, res, next) => authController.register(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));

export const authRoutes = router;
