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
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const latestBody = await prisma.bodyRecord.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });
    const streak = await checkinService.getStreak(userId);
    const checkIn = await checkinService.getToday(userId);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekSessions = await prisma.workoutSession.count({
      where: { userId, startedAt: { gte: weekStart }, status: 'COMPLETED' },
    });
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
      goals: {
        dailyCalorieGoal: profile?.dailyCalorieGoal ?? null,
        dailyProteinGoal: profile?.dailyProteinGoal ?? null,
        weeklyTrainGoal: profile?.weeklyTrainGoal ?? null,
        targetWeightKg: profile?.targetWeightKg ?? null,
        weekSessionsDone: weekSessions,
      },
    };
  },
};