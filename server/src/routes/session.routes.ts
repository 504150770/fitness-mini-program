import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authRequired } from '../middlewares/auth.middleware';

export const sessionRouter = Router();
sessionRouter.post('/', authRequired, sessionController.start);
sessionRouter.get('/', authRequired, sessionController.list);
sessionRouter.get('/prs', authRequired, sessionController.listPRs);
sessionRouter.get('/:id', authRequired, sessionController.getById);
sessionRouter.put('/:id', authRequired, sessionController.complete);
sessionRouter.post('/:id/logs', authRequired, sessionController.addLog);
sessionRouter.put('/:id/logs/:logId', authRequired, sessionController.updateLog);
sessionRouter.delete('/:id/logs/:logId', authRequired, sessionController.removeLog);
sessionRouter.post('/:id/logs/copy', authRequired, sessionController.copyLastSet);