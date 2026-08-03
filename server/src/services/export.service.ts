import { prisma } from '../config/db';
import { HttpError } from '../middlewares/error.middleware';

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(...cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(',');
}

export const exportService = {
  async trainingCsv(userId: string): Promise<string> {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId },
      include: { logs: true },
      orderBy: { startedAt: 'desc' },
    });
    const rows = ['日期,训练名称,计划名称,动作,组号,重量kg,次数,容量kg,是否PR,状态'];
    for (const s of sessions) {
      for (const log of s.logs) {
        rows.push(csvRow(
          s.startedAt.toISOString().slice(0, 10),
          s.name,
          s.planName || '',
          log.exerciseName,
          log.setOrder,
          log.weightKg,
          log.reps,
          log.volumeKg,
          log.isPR ? '是' : '否',
          s.status,
        ));
      }
    }
    return rows.join('\n');
  },

  async dietCsv(userId: string): Promise<string> {
    const records = await prisma.dietRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });
    const rows = ['日期,餐次,食物,热量kcal,蛋白质g,碳水g,脂肪g,备注'];
    const mealLabels: Record<string, string> = { BREAKFAST: '早餐', LUNCH: '午餐', DINNER: '晚餐', SNACK: '加餐' };
    for (const r of records) {
      rows.push(csvRow(
        r.recordedAt.toISOString().slice(0, 10),
        mealLabels[r.mealType] || r.mealType,
        r.foodName,
        r.caloriesKcal,
        r.proteinG,
        r.carbsG,
        r.fatG,
        r.note,
      ));
    }
    return rows.join('\n');
  },

  async bodyCsv(userId: string): Promise<string> {
    const records = await prisma.bodyRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });
    const rows = ['日期,体重kg,体脂率%,备注'];
    for (const r of records) {
      rows.push(csvRow(
        r.recordedAt.toISOString().slice(0, 10),
        r.weightKg,
        r.bodyFatPct,
        r.note,
      ));
    }
    return rows.join('\n');
  },

  async exportCsv(userId: string, type: string): Promise<{ csv: string; filename: string }> {
    let csv: string;
    let filename: string;
    const date = new Date().toISOString().slice(0, 10);
    if (type === 'training') { csv = await this.trainingCsv(userId); filename = 'training_' + date + '.csv'; }
    else if (type === 'diet') { csv = await this.dietCsv(userId); filename = 'diet_' + date + '.csv'; }
    else if (type === 'body') { csv = await this.bodyCsv(userId); filename = 'body_' + date + '.csv'; }
    else throw new HttpError(400, '不支持的数据类型');
    return { csv, filename };
  },
};