import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authRequired } from '../middlewares/auth.middleware';

export const userRouter = Router();
userRouter.get('/profile', authRequired, userController.getProfile);
userRouter.put('/profile', authRequired, userController.upsertProfile);