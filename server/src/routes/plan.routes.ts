import { Router } from 'express';
import { planController } from '../controllers/plan.controller';
import { authRequired } from '../middlewares/auth.middleware';

export const planRouter = Router();
planRouter.get('/', authRequired, planController.list);
planRouter.post('/', authRequired, planController.create);
planRouter.put('/:id', authRequired, planController.update);
planRouter.delete('/:id', authRequired, planController.remove);
planRouter.post('/:id/exercises', authRequired, planController.addExercise);
planRouter.put('/:id/exercises/:itemId', authRequired, planController.updateExercise);
planRouter.delete('/:id/exercises/:itemId', authRequired, planController.removeExercise);
planRouter.put('/:id/reorder', authRequired, planController.reorder);