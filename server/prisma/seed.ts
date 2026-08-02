import { prisma } from '../src/config/db';

const EXERCISES: { name: string; category: string; muscleGroup: string }[] = [
  { name: '杠铃卧推', category: 'CHEST', muscleGroup: '胸大肌' },
  { name: '上斜哑铃卧推', category: 'CHEST', muscleGroup: '上胸' },
  { name: '下斜杠铃卧推', category: 'CHEST', muscleGroup: '下胸' },
  { name: '哑铃飞鸟', category: 'CHEST', muscleGroup: '胸大肌' },
  { name: '蝴蝶机夹胸', category: 'CHEST', muscleGroup: '胸大肌' },
  { name: '俯卧撑', category: 'CHEST', muscleGroup: '胸大肌' },

  { name: '引体向上', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '高位下拉', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '杠铃划船', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '哑铃划船', category: 'BACK', muscleGroup: '背阔肌' },
  { name: '坐姿绳索划船', category: 'BACK', muscleGroup: '中背部' },
  { name: '直臂下压', category: 'BACK', muscleGroup: '背阔肌' },

  { name: '哑铃推举', category: 'SHOULDER', muscleGroup: '三角肌前束' },
  { name: '杠铃推举', category: 'SHOULDER', muscleGroup: '三角肌前束' },
  { name: '哑铃侧平举', category: 'SHOULDER', muscleGroup: '三角肌中束' },
  { name: '哑铃前平举', category: 'SHOULDER', muscleGroup: '三角肌前束' },
  { name: '俯身哑铃飞鸟', category: 'SHOULDER', muscleGroup: '三角肌后束' },
  { name: '面拉', category: 'SHOULDER', muscleGroup: '三角肌后束' },

  { name: '杠铃深蹲', category: 'LEG', muscleGroup: '股四头肌' },
  { name: '腿举', category: 'LEG', muscleGroup: '股四头肌' },
  { name: '罗马尼亚硬拉', category: 'LEG', muscleGroup: '腘绳肌' },
  { name: '坐姿腿弯举', category: 'LEG', muscleGroup: '腘绳肌' },
  { name: '坐姿腿屈伸', category: 'LEG', muscleGroup: '股四头肌' },
  { name: '站姿提踵', category: 'LEG', muscleGroup: '小腿' },

  { name: '杠铃弯举', category: 'ARM', muscleGroup: '肱二头肌' },
  { name: '哑铃交替弯举', category: 'ARM', muscleGroup: '肱二头肌' },
  { name: '锤式弯举', category: 'ARM', muscleGroup: '肱肌' },
  { name: '绳索下压', category: 'ARM', muscleGroup: '肱三头肌' },
  { name: '仰卧臂屈伸', category: 'ARM', muscleGroup: '肱三头肌' },
  { name: '牧师凳弯举', category: 'ARM', muscleGroup: '肱二头肌' },

  { name: '平板支撑', category: 'CORE', muscleGroup: '核心' },
  { name: '卷腹', category: 'CORE', muscleGroup: '腹直肌' },
  { name: '悬垂举腿', category: 'CORE', muscleGroup: '腹直肌' },
  { name: '俄罗斯转体', category: 'CORE', muscleGroup: '腹斜肌' },
  { name: '仰卧举腿', category: 'CORE', muscleGroup: '腹直肌' },
  { name: '山羊挺身', category: 'CORE', muscleGroup: '竖脊肌' },
];

async function main() {
  const existing = await prisma.exercise.count({ where: { isSystem: true } });
  if (existing > 0) {
    console.log('System exercises already exist:', existing);
    return;
  }
  const created = await prisma.exercise.createMany({
    data: EXERCISES.map((e) => ({ ...e, isSystem: true })),
  });
  console.log('Seeded system exercises:', created.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());