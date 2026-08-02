import { Router } from 'express';
import { bodyController } from '../controllers/body.controller';
import { authRequired } from '../middlewares/auth.middleware';

export const bodyRouter = Router();
bodyRouter.post('/records', authRequired, bodyController.create);
bodyRouter.get('/records', authRequired, bodyController.list);
bodyRouter.get('/latest', authRequired, bodyController.latest);
bodyRouter.get('/trend', authRequired, bodyController.trend);