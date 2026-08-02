import { prisma } from '../config/db';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

function parseDate(s?: string | null): Date | undefined | null {
  if (s === null) return null;
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
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
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, gender, birthDate, heightCm, goal },
      update: { gender, birthDate, heightCm, goal },
    });
  },
};