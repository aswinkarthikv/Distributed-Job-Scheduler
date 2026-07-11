import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { RegisterSchema, LoginSchema, validateBody } from '../validators';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateBody(RegisterSchema), authController.register.bind(authController));
router.post('/login', validateBody(LoginSchema), authController.login.bind(authController));
router.get('/me', authMiddleware, authController.getMe.bind(authController));

export default router;
