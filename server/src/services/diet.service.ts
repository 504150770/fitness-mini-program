import { prisma } from '../config/db';
import { HttpError } from '../middlewares/error.middleware';
import { checkinService, dateKey } from './checkin.service';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

function dayRange(date?: string) {
  const dk = date || dateKey();
  return { gte: new Date(dk + 'T00:00:00'), lte: new Date(dk + 'T23:59:59.999') };
}

export const dietService = {
  async list(userId: string, date?: string) {
    const range = dayRange(date);
    return prisma.dietRecord.findMany({
      where: { userId, recordedAt: range },
      orderBy: { recordedAt: 'asc' },
    });
  },

  async create(userId: string, input: { mealType: string; foodName: string; caloriesKcal: number; proteinG?: number; carbsG?: number; fatG?: number; note?: string }) {
    if (!MEAL_TYPES.includes(input.mealType)) throw new HttpError(400, '餐次不合法');
    const foodName = typeof input.foodName === 'string' ? input.foodName.trim().slice(0, 100) : '';
    if (!foodName) throw new HttpError(400, '食物名称不能为空');
    const calories = Math.round(Number(input.caloriesKcal));
    if (!Number.isInteger(calories) || calories < 0 || calories > 10000) throw new HttpError(400, '热量须为 0-10000 的整数');
    const proteinG = input.proteinG != null ? Number(input.proteinG) : null;
    const carbsG = input.carbsG != null ? Number(input.carbsG) : null;
    const fatG = input.fatG != null ? Number(input.fatG) : null;
    const record = await prisma.dietRecord.create({
      data: { userId, mealType: input.mealType, foodName, caloriesKcal: calories, proteinG, carbsG, fatG, note: input.note ? input.note.slice(0, 200) : null },
    });
    await checkinService.ensure(userId, 'DIET');
    return record;
  },

  async update(userId: string, id: string, input: { mealType?: string; foodName?: string; caloriesKcal?: number; proteinG?: number; carbsG?: number; fatG?: number; note?: string }) {
    const rec = await prisma.dietRecord.findFirst({ where: { id, userId } });
    if (!rec) throw new HttpError(404, '饮食记录不存在');
    const data: any = {};
    if (input.mealType !== undefined) { if (!MEAL_TYPES.includes(input.mealType)) throw new HttpError(400, '餐次不合法'); data.mealType = input.mealType; }
    if (input.foodName !== undefined) { const n = input.foodName.trim().slice(0, 100); if (!n) throw new HttpError(400, '食物名称不能为空'); data.foodName = n; }
    if (input.caloriesKcal !== undefined) { const c = Math.round(Number(input.caloriesKcal)); if (!Number.isInteger(c) || c < 0 || c > 10000) throw new HttpError(400, '热量须为 0-10000 的整数'); data.caloriesKcal = c; }
    if (input.proteinG !== undefined) data.proteinG = input.proteinG != null ? Number(input.proteinG) : null;
    if (input.carbsG !== undefined) data.carbsG = input.carbsG != null ? Number(input.carbsG) : null;
    if (input.fatG !== undefined) data.fatG = input.fatG != null ? Number(input.fatG) : null;
    if (input.note !== undefined) data.note = input.note ? input.note.slice(0, 200) : null;
    return prisma.dietRecord.update({ where: { id }, data });
  },

  async remove(userId: string, id: string) {
    const rec = await prisma.dietRecord.findFirst({ where: { id, userId } });
    if (!rec) throw new HttpError(404, '饮食记录不存在');
    return prisma.dietRecord.delete({ where: { id } });
  },

  async getFrequentFoods(userId: string) {
    const records = await prisma.dietRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 200,
      select: { foodName: true, caloriesKcal: true, proteinG: true, carbsG: true, fatG: true },
    });
    const foodMap = new Map<string, { name: string; caloriesKcal: number; proteinG: number | null; carbsG: number | null; fatG: number | null; count: number }>();
    for (const r of records) {
      const existing = foodMap.get(r.foodName);
      if (existing) { existing.count++; }
      else {
        foodMap.set(r.foodName, { name: r.foodName, caloriesKcal: r.caloriesKcal, proteinG: r.proteinG, carbsG: r.carbsG, fatG: r.fatG, count: 1 });
      }
    }
    return Array.from(foodMap.values()).sort((a, b) => b.count - a.count).slice(0, 12);
  },

  async summary(userId: string, date?: string) {
    const records = await this.list(userId, date);
    const totals = records.reduce((acc, r) => ({
      calories: acc.calories + r.caloriesKcal,
      protein: acc.protein + (r.proteinG || 0),
      carbs: acc.carbs + (r.carbsG || 0),
      fat: acc.fat + (r.fatG || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return { records, totals: { caloriesKcal: totals.calories, proteinG: +totals.protein.toFixed(1), carbsG: +totals.carbs.toFixed(1), fatG: +totals.fat.toFixed(1) } };
  },
};