import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { homeService } from '../services/home.service';
import { success } from '../utils/response';

export const homeController = {
  async getHome(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(success(await homeService.getHome(req.userId as string))); } catch (e) { next(e); }
  },
};