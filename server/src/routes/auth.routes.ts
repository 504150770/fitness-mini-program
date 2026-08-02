import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authRequired } from '../middlewares/auth.middleware';

export const authRouter = Router();
authRouter.post('/wx-login', authController.wxLogin);
authRouter.get('/me', authRequired, authController.me);

export const devAuthRouter = Router();
devAuthRouter.post('/dev-login', authController.devLogin);
