import { Router } from 'express';
import { exerciseController } from '../controllers/exercise.controller';
import { authRequired } from '../middlewares/auth.middleware';

export const exerciseRouter = Router();
exerciseRouter.get('/', authRequired, exerciseController.list);
exerciseRouter.post('/', authRequired, exerciseController.create);
exerciseRouter.get('/:id/details', authRequired, exerciseController.details);
exerciseRouter.put('/:id', authRequired, exerciseController.update);
exerciseRouter.delete('/:id', authRequired, exerciseController.remove);