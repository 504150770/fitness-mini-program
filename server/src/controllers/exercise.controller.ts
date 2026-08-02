import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { exerciseService } from '../services/exercise.service';
import { success } from '../utils/response';

function toDto(e: { id: string; name: string; category: string; muscleGroup: string | null; isSystem: boolean; creatorId: string | null }) {
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    muscleGroup: e.muscleGroup,
    isSystem: e.isSystem,
    creatorId: e.creatorId,
  };
}

export const exerciseController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category, search } = req.query;
      const items = await exerciseService.list(req.userId as string, {
        category: category as string | undefined,
        search: search as string | undefined,
      });
      res.json(success(items.map(toDto)));
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ex = await exerciseService.create(req.userId as string, req.body || {});
      res.json(success(toDto(ex), '动作已创建'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ex = await exerciseService.update(req.userId as string, req.params.id, req.body || {});
      res.json(success(toDto(ex), '已更新'));
    } catch (e) { next(e); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await exerciseService.remove(req.userId as string, req.params.id);
      res.json(success(null, '已删除'));
    } catch (e) { next(e); }
  },
};