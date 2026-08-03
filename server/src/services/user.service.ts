import { prisma } from '../config/db';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

function parseDate(s?: string | null): Date | undefined | null {
  if (s === null) return null;
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function optInt(v: unknown, min: number, max: number): number | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return undefined;
  return n;
}

function optFloat(v: unknown, min: number, max: number): number | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  const n = Number(v);
  if (isNaN(n) || n < min || n > max) return undefined;
  return n;
}

export const userService = {
  async getOrCreateByOpenid(
    openid: string,
    profile?: { nickname?: string; avatarUrl?: string; unionid?: string },
  ) {
    return prisma.user.upsert({
      where: { openid },
      update: {
        nickname: profile?.nickname ?? undefined,
        avatarUrl: profile?.avatarUrl ?? undefined,
        unionid: profile?.unionid ?? undefined,
      },
      create: {
        openid,
        nickname: profile?.nickname,
        avatarUrl: profile?.avatarUrl,
        unionid: profile?.unionid,
      },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async getProfile(userId: string) {
    return prisma.userProfile.findUnique({ where: { userId } });
  },

  async upsertProfile(
    userId: string,
    input: {
      gender?: string | null;
      birthDate?: string | null;
      heightCm?: number | null;
      goal?: string | null;
      dailyCalorieGoal?: number | null;
      dailyProteinGoal?: number | null;
      weeklyTrainGoal?: number | null;
      targetWeightKg?: number | null;
    },
  ) {
    const gender =
      input.gender === null ? null : input.gender && GENDERS.includes(input.gender) ? input.gender : undefined;
    const birthDate = parseDate(input.birthDate);
    const heightCm =
      input.heightCm === null
        ? null
        : typeof input.heightCm === 'number' && input.heightCm > 0 && input.heightCm < 400
        ? input.heightCm
        : undefined;
    const goal = input.goal === null ? null : typeof input.goal === 'string' ? input.goal.slice(0, 100) : undefined;
    const dailyCalorieGoal = optInt(input.dailyCalorieGoal, 0, 10000);
    const dailyProteinGoal = optFloat(input.dailyProteinGoal, 0, 1000);
    const weeklyTrainGoal = optInt(input.weeklyTrainGoal, 0, 30);
    const targetWeightKg = optFloat(input.targetWeightKg, 0, 500);
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, gender, birthDate, heightCm, goal, dailyCalorieGoal, dailyProteinGoal, weeklyTrainGoal, targetWeightKg },
      update: { gender, birthDate, heightCm, goal, dailyCalorieGoal, dailyProteinGoal, weeklyTrainGoal, targetWeightKg },
    });
  },
};