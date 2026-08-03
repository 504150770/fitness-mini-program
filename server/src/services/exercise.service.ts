import { prisma } from '../config/db';
import { HttpError } from '../middlewares/error.middleware';
import type { Prisma } from '@prisma/client';

const CATEGORIES = ['CHEST', 'BACK', 'SHOULDER', 'LEG', 'ARM', 'CORE'];

function toDetailsDto(e: { id: string; name: string; category: string; muscleGroup: string | null; isSystem: boolean; creatorId: string | null }) {
  return { id: e.id, name: e.name, category: e.category, muscleGroup: e.muscleGroup, isSystem: e.isSystem, creatorId: e.creatorId };
}

export function isValidCategory(c: string): boolean {
  return CATEGORIES.includes(c);
}

export const exerciseService = {
  async list(userId: string, opts?: { category?: string; search?: string; favoritesOnly?: boolean }) {
    const where: Prisma.ExerciseWhereInput = {
      OR: [{ isSystem: true }, { creatorId: userId }],
    };
    if (opts?.category && CATEGORIES.includes(opts.category)) {
      where.category = opts.category;
    }
    if (opts?.search) {
      where.name = { contains: opts.search };
    }
    if (opts?.favoritesOnly) {
      where.favoritedBy = { some: { userId } };
    }
    return prisma.exercise.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: { favoritedBy: { where: { userId }, select: { id: true }, take: 1 } },
    });
  },

  async create(userId: string, input: { name: string; category: string; muscleGroup?: string }) {
    const name = typeof input.name === 'string' ? input.name.trim().slice(0, 50) : '';
    if (!name) throw new HttpError(400, '动作名称不能为空');
    if (!CATEGORIES.includes(input.category)) throw new HttpError(400, '分类不合法');
    const muscleGroup = input.muscleGroup ? input.muscleGroup.trim().slice(0, 50) : null;
    return prisma.exercise.create({
      data: { name, category: input.category, muscleGroup, isSystem: false, creatorId: userId },
    });
  },

  async update(userId: string, id: string, input: { name?: string; category?: string; muscleGroup?: string }) {
    const ex = await prisma.exercise.findUnique({ where: { id } });
    if (!ex) throw new HttpError(404, '动作不存在');
    if (ex.isSystem) throw new HttpError(403, '系统动作不可修改');
    if (ex.creatorId !== userId) throw new HttpError(403, '无权修改');
    const data: { name?: string; category?: string; muscleGroup?: string | null } = {};
    if (input.name !== undefined) {
      const name = input.name.trim().slice(0, 50);
      if (!name) throw new HttpError(400, '动作名称不能为空');
      data.name = name;
    }
    if (input.category !== undefined) {
      if (!CATEGORIES.includes(input.category)) throw new HttpError(400, '分类不合法');
      data.category = input.category;
    }
    if (input.muscleGroup !== undefined) {
      data.muscleGroup = input.muscleGroup ? input.muscleGroup.trim().slice(0, 50) : null;
    }
    return prisma.exercise.update({ where: { id }, data });
  },

  async toggleFavorite(userId: string, exerciseId: string) {
    const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!ex) throw new HttpError(404, '动作不存在');
    if (!ex.isSystem && ex.creatorId !== userId) throw new HttpError(403, '无权访问');
    const existing = await prisma.favorite.findUnique({ where: { userId_exerciseId: { userId, exerciseId } } });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { isFavorite: false };
    }
    await prisma.favorite.create({ data: { userId, exerciseId } });
    return { isFavorite: true };
  },

  async getDetails(userId: string, id: string) {
    const ex = await prisma.exercise.findUnique({ where: { id } });
    if (!ex) throw new HttpError(404, '动作不存在');
    if (!ex.isSystem && ex.creatorId !== userId) throw new HttpError(403, '无权访问');
    const pr = await prisma.personalRecord.findUnique({
      where: { userId_exerciseId: { userId, exerciseId: id } },
    });
    const logs = await prisma.workoutLog.findMany({
      where: { exerciseId: id, session: { userId, status: 'COMPLETED' } },
      include: { session: { select: { name: true, startedAt: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return { exercise: toDetailsDto(ex), pr: pr ? { maxWeightKg: pr.maxWeightKg, maxWeightReps: pr.maxWeightReps, achievedAt: pr.achievedAt.toISOString() } : null, recentLogs: logs.map(l => ({ id: l.id, weightKg: l.weightKg, reps: l.reps, volumeKg: l.volumeKg, isPR: l.isPR, setOrder: l.setOrder, sessionName: l.session.name, sessionDate: l.session.startedAt.toISOString() })) };
  },

  async remove(userId: string, id: string) {
    const ex = await prisma.exercise.findUnique({
      where: { id },
      include: { planItems: { select: { id: true } } },
    });
    if (!ex) throw new HttpError(404, '动作不存在');
    if (ex.isSystem) throw new HttpError(403, '系统动作不可删除');
    if (ex.creatorId !== userId) throw new HttpError(403, '无权删除');
    if (ex.planItems.length > 0) throw new HttpError(400, '该动作已被训练计划引用，无法删除');
    return prisma.exercise.delete({ where: { id } });
  },
};