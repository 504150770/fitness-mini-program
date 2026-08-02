import { prisma } from '../config/db';

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
};
