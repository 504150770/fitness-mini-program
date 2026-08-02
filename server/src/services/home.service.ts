import { prisma } from '../config/db';
import { checkinService, dateKey } from './checkin.service';
import { dietService } from './diet.service';

export const homeService = {
  async getHome(userId: string) {
    const dk = dateKey();
    const dayStart = new Date(dk + 'T00:00:00');

    const todaySession = await prisma.workoutSession.findFirst({
      where: { userId, startedAt: { gte: dayStart } },
      orderBy: { startedAt: 'desc' },
    });

    const dietSummary = await dietService.summary(userId, dk);
    const latestBody = await prisma.bodyRecord.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });
    const streak = await checkinService.getStreak(userId);
    const checkIn = await checkinService.getToday(userId);

    return {
      todayTraining: todaySession
        ? { id: todaySession.id, name: todaySession.name, status: todaySession.status, totalVolumeKg: todaySession.totalVolumeKg }
        : null,
      todayDiet: {
        ...dietSummary.totals,
        recordCount: dietSummary.records.length,
      },
      currentWeight: latestBody ? latestBody.weightKg : null,
      streak,
      checkIn,
    };
  },
};