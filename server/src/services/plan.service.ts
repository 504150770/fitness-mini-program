import { prisma } from '../config/db';
import { HttpError } from '../middlewares/error.middleware';

async function assertPlanOwned(userId: string, planId: string) {
  const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new HttpError(404, '训练计划不存在');
  return plan;
}

function validateSets(v: unknown): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 50) throw new HttpError(400, '组数须为 1-50 的整数');
  return n;
}
function validateReps(v: unknown): string {
  const s = typeof v === 'string' ? v.trim().slice(0, 20) : '';
  if (!s) throw new HttpError(400, '次数不能为空');
  return s;
}
function validateWeight(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  if (isNaN(n) || n < 0 || n >= 1000) throw new HttpError(400, '重量须为 0-1000 之间的数值');
  return n;
}

export const planService = {
  async list(userId: string) {
    return prisma.workoutPlan.findMany({
      where: { userId },
      include: {
        exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async create(userId: string, input: { name: string; note?: string }) {
    const name = typeof input.name === 'string' ? input.name.trim().slice(0, 50) : '';
    if (!name) throw new HttpError(400, '训练日名称不能为空');
    const note = input.note ? input.note.trim().slice(0, 200) : null;
    const count = await prisma.workoutPlan.count({ where: { userId } });
    return prisma.workoutPlan.create({
      data: { userId, name, note, sortOrder: count },
      include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } } },
    });
  },

  async update(userId: string, id: string, input: { name?: string; note?: string }) {
    await assertPlanOwned(userId, id);
    const data: { name?: string; note?: string | null } = {};
    if (input.name !== undefined) {
      const name = input.name.trim().slice(0, 50);
      if (!name) throw new HttpError(400, '训练日名称不能为空');
      data.name = name;
    }
    if (input.note !== undefined) {
      data.note = input.note ? input.note.trim().slice(0, 200) : null;
    }
    return prisma.workoutPlan.update({
      where: { id },
      data,
      include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } } },
    });
  },

  async remove(userId: string, id: string) {
    await assertPlanOwned(userId, id);
    return prisma.workoutPlan.delete({ where: { id } });
  },

  async addExercise(userId: string, planId: string, input: { exerciseId: string; sets?: number; reps?: string; weightKg?: number; note?: string }) {
    await assertPlanOwned(userId, planId);
    const ex = await prisma.exercise.findUnique({ where: { id: input.exerciseId } });
    if (!ex) throw new HttpError(404, '动作不存在');
    if (!ex.isSystem && ex.creatorId !== userId) throw new HttpError(403, '无权使用该动作');
    const maxOrder = await prisma.workoutPlanExercise.aggregate({
      where: { planId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    return prisma.workoutPlanExercise.create({
      data: {
        planId,
        exerciseId: input.exerciseId,
        sets: input.sets !== undefined ? validateSets(input.sets) : 3,
        reps: input.reps !== undefined ? validateReps(input.reps) : '8-12',
        weightKg: validateWeight(input.weightKg),
        note: input.note ? input.note.trim().slice(0, 200) : null,
        sortOrder,
      },
      include: { exercise: true },
    });
  },

  async updateExercise(userId: string, planId: string, itemId: string, input: { sets?: number; reps?: string; weightKg?: number; note?: string }) {
    await assertPlanOwned(userId, planId);
    const item = await prisma.workoutPlanExercise.findFirst({ where: { id: itemId, planId } });
    if (!item) throw new HttpError(404, '计划动作不存在');
    const data: { sets?: number; reps?: string; weightKg?: number | undefined; note?: string | null } = {};
    if (input.sets !== undefined) data.sets = validateSets(input.sets);
    if (input.reps !== undefined) data.reps = validateReps(input.reps);
    if (input.weightKg !== undefined) data.weightKg = validateWeight(input.weightKg);
    if (input.note !== undefined) data.note = input.note ? input.note.trim().slice(0, 200) : null;
    return prisma.workoutPlanExercise.update({
      where: { id: itemId },
      data,
      include: { exercise: true },
    });
  },

  async removeExercise(userId: string, planId: string, itemId: string) {
    await assertPlanOwned(userId, planId);
    const item = await prisma.workoutPlanExercise.findFirst({ where: { id: itemId, planId } });
    if (!item) throw new HttpError(404, '计划动作不存在');
    return prisma.workoutPlanExercise.delete({ where: { id: itemId } });
  },

  async reorder(userId: string, planId: string, items: { id: string; sortOrder: number }[]) {
    await assertPlanOwned(userId, planId);
    await prisma.$transaction(
      items.map((item) =>
        prisma.workoutPlanExercise.updateMany({
          where: { id: item.id, planId },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return prisma.workoutPlan.findFirstOrThrow({
      where: { id: planId },
      include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } } },
    });
  },
};