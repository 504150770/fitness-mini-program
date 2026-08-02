import { Router } from 'express';
import { statsController } from '../controllers/stats.controller';
import { authRequired } from '../middlewares/auth.middleware';
export const statsRouter = Router();
statsRouter.get('/', authRequired, statsController.getStats);