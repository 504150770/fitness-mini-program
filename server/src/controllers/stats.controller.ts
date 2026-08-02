import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { statsService } from '../services/stats.service';
import { success } from '../utils/response';

export const statsController = {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(success(await statsService.getStats(req.userId as string))); } catch (e) { next(e); }
  },
};