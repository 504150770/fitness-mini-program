import { Router } from 'express';
import { checkinController } from '../controllers/checkin.controller';
import { authRequired } from '../middlewares/auth.middleware';
export const checkinRouter = Router();
checkinRouter.post('/', authRequired, checkinController.checkin);
checkinRouter.get('/today', authRequired, checkinController.today);
checkinRouter.get('/streak', authRequired, checkinController.streak);