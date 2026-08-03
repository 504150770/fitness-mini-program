import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { planService } from '../services/plan.service';
import { success } from '../utils/response';

function toPlanExerciseDto(pe: { id: string; exerciseId: string; sets: number; reps: string; weightKg: number | null; sortOrder: number; note: string | null; exercise: { name: string; category: string } | null }) {
  return {
    id: pe.id,
    exerciseId: pe.exerciseId,
    exerciseName: pe.exercise?.name || '',
    category: pe.exercise?.category || '',
    sets: pe.sets,
    reps: pe.reps,
    weightKg: pe.weightKg,
    sortOrder: pe.sortOrder,
    note: pe.note,
  };
}

function toPlanDto(p: { id: string; name: string; note: string | null; sortOrder: number; exercises: Array<ReturnType<typeof toPlanExerciseDto> | any> }) {
  return {
    id: p.id,
    name: p.name,
    note: p.note,
    sortOrder: p.sortOrder,
    exercises: (p.exercises || []).map(toPlanExerciseDto),
  };
}

export const planController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plans = await planService.list(req.userId as string);
      res.json(success(plans.map(toPlanDto)));
    } catch (e) { next(e); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plan = await planService.create(req.userId as string, req.body || {});
      res.json(success(toPlanDto(plan), '训练日已创建'));
    } catch (e) { next(e); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plan = await planService.update(req.userId as string, req.params.id, req.body || {});
      res.json(success(toPlanDto(plan), '已更新'));
    } catch (e) { next(e); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await planService.remove(req.userId as string, req.params.id);
      res.json(success(null, '已删除'));
    } catch (e) { next(e); }
  },

  async addExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await planService.addExercise(req.userId as string, req.params.id, req.body || {});
      res.json(success(toPlanExerciseDto(item), '动作已添加'));
    } catch (e) { next(e); }
  },

  async updateExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await planService.updateExercise(req.userId as string, req.params.id, req.params.itemId, req.body || {});
      res.json(success(toPlanExerciseDto(item), '已更新'));
    } catch (e) { next(e); }
  },

  async removeExercise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await planService.removeExercise(req.userId as string, req.params.id, req.params.itemId);
      res.json(success(null, '已移除'));
    } catch (e) { next(e); }
  },

  async clone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plan = await planService.clone(req.userId as string, req.params.id);
      res.json(success(toPlanDto(plan), '已复制'));
    } catch (e) { next(e); }
  },
  async reorder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plan = await planService.reorder(req.userId as string, req.params.id, (req.body || {}).items || []);
      res.json(success(toPlanDto(plan), '顺序已调整'));
    } catch (e) { next(e); }
  },
};