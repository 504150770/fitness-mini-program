import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { checkinService } from '../services/checkin.service';
import { success } from '../utils/response';

export const checkinController = {
  async checkin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const type = (req.body || {}).type;
      if (type !== 'TRAINING' && type !== 'DIET') {
        return res.status(400).json({ code: 400, message: 'type 须为 TRAINING 或 DIET', data: null });
      }
      await checkinService.ensure(req.userId as string, type);
      const today = await checkinService.getToday(req.userId as string);
      res.json(success(today, '打卡成功'));
    } catch (e) { next(e); }
  },
  async today(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(success(await checkinService.getToday(req.userId as string))); } catch (e) { next(e); }
  },
  async streak(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(success({ streak: await checkinService.getStreak(req.userId as string) })); } catch (e) { next(e); }
  },
};