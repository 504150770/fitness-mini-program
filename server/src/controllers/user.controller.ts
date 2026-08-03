import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { userService } from '../services/user.service';
import { success } from '../utils/response';

function ageFromBirth(date?: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--;
  return age >= 0 && age < 150 ? age : null;
}

function toProfileDto(p: {
  userId: string;
  gender: string | null;
  birthDate: Date | null;
  heightCm: number | null;
  goal: string | null;
  dailyCalorieGoal: number | null;
  dailyProteinGoal: number | null;
  weeklyTrainGoal: number | null;
  targetWeightKg: number | null;
}) {
  return {
    userId: p.userId,
    gender: p.gender,
    birthDate: p.birthDate ? new Date(p.birthDate).toISOString().slice(0, 10) : null,
    age: ageFromBirth(p.birthDate),
    heightCm: p.heightCm,
    goal: p.goal,
    dailyCalorieGoal: p.dailyCalorieGoal,
    dailyProteinGoal: p.dailyProteinGoal,
    weeklyTrainGoal: p.weeklyTrainGoal,
    targetWeightKg: p.targetWeightKg,
  };
}

export const userController = {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const p = await userService.getProfile(req.userId as string);
      res.json(success(p ? toProfileDto(p) : null));
    } catch (e) {
      next(e);
    }
  },

  async upsertProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const p = await userService.upsertProfile(req.userId as string, req.body || {});
      res.json(success(toProfileDto(p), '资料已保存'));
    } catch (e) {
      next(e);
    }
  },
};