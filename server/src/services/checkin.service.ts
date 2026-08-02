import { prisma } from '../config/db';

export function dateKey(d: Date = new Date()): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export const checkinService = {
  async ensure(userId: string, type: 'TRAINING' | 'DIET') {
    const dk = dateKey();
    const data = type === 'TRAINING' ? { hasTraining: true } : { hasDiet: true };
    await prisma.checkIn.upsert({
      where: { userId_dateKey: { userId, dateKey: dk } },
      create: { userId, dateKey: dk, ...data },
      update: data,
    });
  },

  async getToday(userId: string) {
    const ci = await prisma.checkIn.findUnique({ where: { userId_dateKey: { userId, dateKey: dateKey() } } });
    return { hasTraining: ci?.hasTraining || false, hasDiet: ci?.hasDiet || false };
  },

  async getStreak(userId: string): Promise<number> {
    const checkIns = await prisma.checkIn.findMany({
      where: { userId, OR: [{ hasTraining: true }, { hasDiet: true }] },
      orderBy: { dateKey: 'desc' },
      select: { dateKey: true },
    });
    if (checkIns.length === 0) return 0;
    const dateSet = new Set(checkIns.map(c => c.dateKey));
    const today = new Date();
    let streak = 0;
    const d = new Date(today);
    if (!dateSet.has(dateKey(d))) d.setDate(d.getDate() - 1);
    while (dateSet.has(dateKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  },
};