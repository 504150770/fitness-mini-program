import { prisma } from '../config/db';
import { HttpError } from '../middlewares/error.middleware';
import type { Prisma } from '@prisma/client';

export interface BodyRecordInput {
  weightKg: number;
  bodyFatPct?: number | null;
  note?: string | null;
  recordedAt?: string | null;
}

function parseDate(s?: string | null): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function validateWeight(v: unknown): number {
  if (typeof v !== 'number' || isNaN(v) || v <= 0 || v >= 1000) {
    throw new HttpError(400, 'weightKg 必须为 0-1000 之间的有效数值');
  }
  return v;
}

function validateBodyFat(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'number' || isNaN(v) || v < 0 || v > 100) {
    throw new HttpError(400, 'bodyFatPct 必须为 0-100 之间的数值');
  }
  return v;
}

export const bodyService = {
  async create(userId: string, input: BodyRecordInput) {
    const weightKg = validateWeight(input.weightKg);
    const bodyFatPct = validateBodyFat(input.bodyFatPct);
    const note =
      input.note === null
        ? null
        : typeof input.note === 'string'
        ? input.note.slice(0, 200)
        : null;
    const recordedAt = parseDate(input.recordedAt) ?? new Date();
    return prisma.bodyRecord.create({
      data: { userId, weightKg, bodyFatPct, note, recordedAt },
    });
  },

  async list(userId: string, opts?: { from?: string; to?: string; limit?: number }) {
    const where: Prisma.BodyRecordWhereInput = { userId };
    const from = parseDate(opts?.from);
    const to = parseDate(opts?.to);
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = from;
      if (to) where.recordedAt.lte = to;
    }
    const limit = opts?.limit && opts.limit > 0 && opts.limit <= 500 ? opts.limit : 50;
    return prisma.bodyRecord.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  },

  async latest(userId: string) {
    return prisma.bodyRecord.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });
  },

  async trend(userId: string, opts?: { limit?: number }) {
    const limit = opts?.limit && opts.limit > 0 && opts.limit <= 500 ? opts.limit : 30;
    const records = await prisma.bodyRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: 'asc' },
      take: limit,
      select: { recordedAt: true, weightKg: true },
    });
    return records.map((r) => ({
      date: r.recordedAt.toISOString().slice(0, 10),
      weightKg: r.weightKg,
    }));
  },
};