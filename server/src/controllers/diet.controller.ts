import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { dietService } from '../services/diet.service';
import { success } from '../utils/response';

function toDto(r: { id: string; mealType: string; foodName: string; caloriesKcal: number; proteinG: number | null; carbsG: number | null; fatG: number | null; recordedAt: Date; note: string | null }) {
  return { id: r.id, mealType: r.mealType, foodName: r.foodName, caloriesKcal: r.caloriesKcal, proteinG: r.proteinG, carbsG: r.carbsG, fatG: r.fatG, recordedAt: r.recordedAt.toISOString(), note: r.note };
}

export const dietController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try { const { date } = req.query; const items = await dietService.list(req.userId as string, date as string | undefined); res.json(success(items.map(toDto))); } catch (e) { next(e); }
  },
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try { const r = await dietService.create(req.userId as string, req.body || {}); res.json(success(toDto(r), '已记录')); } catch (e) { next(e); }
  },
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try { const r = await dietService.update(req.userId as string, req.params.id, req.body || {}); res.json(success(toDto(r), '已更新')); } catch (e) { next(e); }
  },
  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try { await dietService.remove(req.userId as string, req.params.id); res.json(success(null, '已删除')); } catch (e) { next(e); }
  },
  async frequent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const foods = await dietService.getFrequentFoods(req.userId as string);
      res.json(success(foods));
    } catch (e) { next(e); }
  },

  async summary(req: AuthRequest, res: Response, next: NextFunction) {
    try { const { date } = req.query; const s = await dietService.summary(req.userId as string, date as string | undefined); res.json(success({ records: s.records.map(toDto), ...s.totals, recordCount: s.records.length })); } catch (e) { next(e); }
  },
};