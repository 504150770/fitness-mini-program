import { prisma } from './db';
import { readFileSync } from 'fs';
import { join } from 'path';

let initialized = false;

const SYSTEM_EXERCISES: { name: string; category: string; muscleGroup: string | null }[] = [
  { name: '杠铃卧推', category: 'CHEST', muscleGroup: '胸大肌' },
  { name: '哑铃卧推', category: 'CHEST', muscleGroup: '胸大肌' },
  { name: '上斜哑铃卧推', category: 'CHEST', muscleGroup: '上胸' },
  { name: '下斜卧推', category: 'CHEST', muscleGroup: '下胸' },
  { name: '蝴蝶机夹胸', category: 'CHEST', muscleGroup: '胸大肌' },
  { name: '绳索夹胸', category: 'CHEST', muscleGroup: '胸大肌' },
  { name: '引体向上', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '高位下拉', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '杠铃划船', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '哑铃划船', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '坐姿绳索划船', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '直臂下压', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '哑铃肩推', category: 'SHOULDER', muscleGroup: '三角肌' },
  { name: '杠铃肩推', category: 'SHOULDER', muscleGroup: '三角肌' },
  { name: '侧平举', category: 'SHOULDER', muscleGroup: '三角肌中束' },
  { name: '前平举', category: 'SHOULDER', muscleGroup: '三角肌前束' },
  { name: '反向飞鸟', category: 'SHOULDER', muscleGroup: '三角肌后束' },
  { name: '面拉', category: 'SHOULDER', muscleGroup: '三角肌后束' },
  { name: '杠铃深蹲', category: 'LEG', muscleGroup: '股四头肌' },
  { name: '腿举', category: 'LEG', muscleGroup: '股四头肌' },
  { name: '腿弯举', category: 'LEG', muscleGroup: '腘绳肌' },
  { name: '腿屈伸', category: 'LEG', muscleGroup: '股四头肌' },
  { name: '保加利亚分腿蹲', category: 'LEG', muscleGroup: '股四头肌' },
  { name: '臀推', category: 'LEG', muscleGroup: '臀大肌' },
  { name: '杠铃弯举', category: 'ARM', muscleGroup: '肱二头肌' },
  { name: '哑铃弯举', category: 'ARM', muscleGroup: '肱二头肌' },
  { name: '锤式弯举', category: 'ARM', muscleGroup: '肱二头肌' },
  { name: '牧师椅弯举', category: 'ARM', muscleGroup: '肱二头肌' },
  { name: '绳索下压', category: 'ARM', muscleGroup: '肱三头肌' },
  { name: '窄距卧推', category: 'ARM', muscleGroup: '肱三头肌' },
  { name: '过头臂屈伸', category: 'ARM', muscleGroup: '肱三头肌' },
  { name: '双杠臂屈伸', category: 'ARM', muscleGroup: '肱三头肌' },
  { name: '平板支撑', category: 'CORE', muscleGroup: '腹横肌' },
  { name: '卷腹', category: 'CORE', muscleGroup: '腹直肌' },
  { name: '悬垂举腿', category: 'CORE', muscleGroup: '腹直肌' },
  { name: '俄罗斯转体', category: 'CORE', muscleGroup: '腹斜肌' },
  { name: '仰卧举腿', category: 'CORE', muscleGroup: '腹直肌' },
];

export async function ensureDatabase() {
  if (initialized) return;
  try {
    await prisma.$queryRaw`SELECT COUNT(*) as c FROM User`;
    initialized = true;
  } catch {
    const schemaPath = join(process.cwd(), 'prisma', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    const statements = schema.split(';').map((s: string) => s.trim()).filter((s: string) => s && !s.startsWith('--'));
    for (const stmt of statements) {
      try { await prisma.$executeRawUnsafe(stmt); } catch {}
    }
    const existing = await prisma.exercise.count();
    if (existing === 0) {
      await prisma.exercise.createMany({
        data: SYSTEM_EXERCISES.map(e => ({ ...e, isSystem: true })),
      });
    }
    initialized = true;
  }
}