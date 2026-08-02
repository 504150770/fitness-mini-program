import { prisma } from '../config/db';
import { dateKey } from './checkin.service';

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateKey(d));
  }
  return days;
}

export const statsService = {
  async getStats(userId: string) {
    const totalSessions = await prisma.workoutSession.count({
      where: { userId, status: 'COMPLETED' },
    });

    const completedSessions = await prisma.workoutSession.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { totalVolumeKg: true, logs: { select: { id: true } } },
    });
    const totalVolumeKg = completedSessions.reduce((s, ses) => s + ses.totalVolumeKg, 0);
    const totalSets = completedSessions.reduce((s, ses) => s + ses.logs.length, 0);

    const prCount = await prisma.personalRecord.count({ where: { userId } });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const trainingDaysThisMonth = await prisma.workoutSession.count({
      where: { userId, startedAt: { gte: monthStart }, status: 'COMPLETED' },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentSessions = await prisma.workoutSession.findMany({
      where: { userId, startedAt: { gte: sevenDaysAgo }, status: 'COMPLETED' },
      select: { startedAt: true, totalVolumeKg: true },
    });
    const volByDay: Record<string, number> = {};
    for (const s of recentSessions) {
      const dk = dateKey(s.startedAt);
      volByDay[dk] = (volByDay[dk] || 0) + s.totalVolumeKg;
    }

    const recentDiet = await prisma.dietRecord.findMany({
      where: { userId, recordedAt: { gte: sevenDaysAgo } },
      select: { recordedAt: true, caloriesKcal: true },
    });
    const calByDay: Record<string, number> = {};
    for (const r of recentDiet) {
      const dk = dateKey(r.recordedAt);
      calByDay[dk] = (calByDay[dk] || 0) + r.caloriesKcal;
    }

    const days = last7Days();
    const weeklyVolume = days.map(d => ({ date: d.slice(5), volume: +((volByDay[d] || 0)).toFixed(1) }));
    const weeklyCalories = days.map(d => ({ date: d.slice(5), calories: calByDay[d] || 0 }));

    return {
      totalSessions,
      totalVolumeKg: +totalVolumeKg.toFixed(1),
      totalSets,
      prCount,
      trainingDaysThisMonth,
      weeklyVolume,
      weeklyCalories,
    };
  },
};