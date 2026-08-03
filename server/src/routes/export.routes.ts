import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { authRequired } from '../middlewares/auth.middleware';

export const exportRouter = Router();
exportRouter.get('/csv', authRequired, exportController.exportCsv);