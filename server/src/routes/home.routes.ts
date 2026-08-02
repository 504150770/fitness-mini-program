import { Router } from 'express';
import { homeController } from '../controllers/home.controller';
import { authRequired } from '../middlewares/auth.middleware';
export const homeRouter = Router();
homeRouter.get('/', authRequired, homeController.getHome);