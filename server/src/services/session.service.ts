import { prisma } from '../config/db';
import { HttpError } from '../middlewares/error.middleware';

function validateWeight(v: unknown): number {
  const n = Number(v);
  if (isNaN(n) || n <= 0 || n >= 1000) throw new HttpError(400, '重量须为 0-1000 之间的数值');
  return n;
}
function validateReps(v: unknown): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 1000) throw new HttpError(400, '次数须为 1-1000 的整数');
  return n;
}

async function assertSessionOwned(userId: string, sessionId: string) {
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new HttpError(404, '训练记录不存在');
  return session;
}

export const sessionService = {
  async start(userId: string, input: { planId?: string; name?: string }) {
    let planName: string | null = null;
    let name = input.name || '自由训练';
    let plannedExercises: { exerciseId: string; exerciseName: string; category: string; sets: number; reps: string; weightKg: number | null }[] = [];

    if (input.planId) {
      const plan = await prisma.workoutPlan.findFirst({
        where: { id: input.planId, userId },
        include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } } },
      });
      if (!plan) throw new HttpError(404, '训练计划不存在');
      planName = plan.name;
      name = input.name || plan.name;
      plannedExercises = plan.exercises.map((pe) => ({
        exerciseId: pe.exerciseId,
        exerciseName: pe.exercise.name,
        category: pe.exercise.category,
        sets: pe.sets,
        reps: pe.reps,
        weightKg: pe.weightKg,
      }));
    }

    const session = await prisma.workoutSession.create({
      data: { userId, planId: input.planId || null, planName, name, status: 'ACTIVE' },
    });
    return { session, plannedExercises };
  },

  async getById(userId: string, id: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id, userId },
      include: { logs: { orderBy: [{ exerciseId: 'asc' }, { setOrder: 'asc' }] } },
    });
    if (!session) throw new HttpError(404, '训练记录不存在');
    return session;
  },

  async list(userId: string, opts?: { limit?: number }) {
    const limit = opts?.limit && opts.limit > 0 && opts.limit <= 100 ? opts.limit : 50;
    return prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { _count: { select: { logs: true } } },
    });
  },

  async complete(userId: string, id: string, input?: { note?: string }) {
    const session = await assertSessionOwned(userId, id);
    if (session.status === 'COMPLETED') throw new HttpError(400, '训练已完成');
    const logs = await prisma.workoutLog.findMany({ where: { sessionId: id } });
    const totalVolume = logs.reduce((sum, l) => sum + l.volumeKg, 0);
    return prisma.workoutSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        totalVolumeKg: +totalVolume.toFixed(2),
        note: input?.note !== undefined ? (input.note ? input.note.slice(0, 200) : null) : session.note,
      },
    });
  },

  async addLog(userId: string, sessionId: string, input: { exerciseId: string; weightKg: number; reps: number; note?: string }) {
    const session = await assertSessionOwned(userId, sessionId);
    if (session.status !== 'ACTIVE') throw new HttpError(400, '训练已结束，无法添加');
    const ex = await prisma.exercise.findUnique({ where: { id: input.exerciseId } });
    if (!ex) throw new HttpError(404, '动作不存在');
    if (!ex.isSystem && ex.creatorId !== userId) throw new HttpError(403, '无权使用该动作');

    const weightKg = validateWeight(input.weightKg);
    const reps = validateReps(input.reps);
    const volumeKg = +(weightKg * reps).toFixed(2);

    const lastLog = await prisma.workoutLog.findFirst({
      where: { sessionId, exerciseId: input.exerciseId },
      orderBy: { setOrder: 'desc' },
    });
    const setOrder = (lastLog?.setOrder || 0) + 1;

    const pr = await prisma.personalRecord.findUnique({
      where: { userId_exerciseId: { userId, exerciseId: input.exerciseId } },
    });
    const isPR = !pr || weightKg > pr.maxWeightKg;

    const log = await prisma.workoutLog.create({
      data: {
        sessionId, exerciseId: input.exerciseId, exerciseName: ex.name,
        setOrder, weightKg, reps, volumeKg, isPR,
        note: input.note ? input.note.slice(0, 200) : null,
      },
    });

    if (isPR) {
      await prisma.personalRecord.upsert({
        where: { userId_exerciseId: { userId, exerciseId: input.exerciseId } },
        create: {
          userId, exerciseId: input.exerciseId, exerciseName: ex.name,
          maxWeightKg: weightKg, maxWeightReps: reps, sessionId, achievedAt: new Date(),
        },
        update: {
          exerciseName: ex.name, maxWeightKg: weightKg, maxWeightReps: reps,
          sessionId, achievedAt: new Date(),
        },
      });
    }
    return log;
  },

  async updateLog(userId: string, sessionId: string, logId: string, input: { weightKg?: number; reps?: number; note?: string }) {
    const session = await assertSessionOwned(userId, sessionId);
    if (session.status !== 'ACTIVE') throw new HttpError(400, '训练已结束，无法修改');
    const log = await prisma.workoutLog.findFirst({ where: { id: logId, sessionId } });
    if (!log) throw new HttpError(404, '训练组不存在');

    const data: { weightKg?: number; reps?: number; volumeKg?: number; note?: string | null } = {};
    if (input.weightKg !== undefined) data.weightKg = validateWeight(input.weightKg);
    if (input.reps !== undefined) data.reps = validateReps(input.reps);
    if (data.weightKg !== undefined || data.reps !== undefined) {
      const w = data.weightKg ?? log.weightKg;
      const r = data.reps ?? log.reps;
      data.volumeKg = +(w * r).toFixed(2);
    }
    if (input.note !== undefined) data.note = input.note ? input.note.slice(0, 200) : null;
    return prisma.workoutLog.update({ where: { id: logId }, data });
  },

  async removeLog(userId: string, sessionId: string, logId: string) {
    const session = await assertSessionOwned(userId, sessionId);
    if (session.status !== 'ACTIVE') throw new HttpError(400, '训练已结束，无法删除');
    const log = await prisma.workoutLog.findFirst({ where: { id: logId, sessionId } });
    if (!log) throw new HttpError(404, '训练组不存在');
    return prisma.workoutLog.delete({ where: { id: logId } });
  },

  async copyLastSet(userId: string, sessionId: string, exerciseId: string) {
    await assertSessionOwned(userId, sessionId);
    const lastLog = await prisma.workoutLog.findFirst({
      where: { sessionId, exerciseId },
      orderBy: { setOrder: 'desc' },
    });
    if (!lastLog) throw new HttpError(404, '该动作暂无历史组');
    return this.addLog(userId, sessionId, {
      exerciseId, weightKg: lastLog.weightKg, reps: lastLog.reps,
    });
  },

  async listPRs(userId: string) {
    return prisma.personalRecord.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
    });
  },
};