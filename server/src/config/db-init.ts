import { prisma } from './db';

let initPromise: Promise<void> | null = null;

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openid" TEXT NOT NULL,
    "unionid" TEXT,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "UserProfile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "gender" TEXT,
    "birthDate" DATETIME,
    "heightCm" REAL,
    "goal" TEXT,
    "dailyCalorieGoal" INTEGER,
    "dailyProteinGoal" REAL,
    "weeklyTrainGoal" INTEGER,
    "targetWeightKg" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "BodyRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" REAL NOT NULL,
    "bodyFatPct" REAL,
    "photoUrl" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BodyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "muscleGroup" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exercise_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "WorkoutPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "WorkoutPlanExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" TEXT NOT NULL DEFAULT '8-12',
    "weightKg" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutPlanExercise_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutPlanExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "WorkoutSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "planName" TEXT,
    "name" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalVolumeKg" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "WorkoutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "setOrder" INTEGER NOT NULL DEFAULT 1,
    "weightKg" REAL NOT NULL,
    "reps" INTEGER NOT NULL,
    "volumeKg" REAL NOT NULL,
    "isPR" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PersonalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "maxWeightKg" REAL NOT NULL,
    "maxWeightReps" INTEGER NOT NULL,
    "sessionId" TEXT,
    "achievedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "DietRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "caloriesKcal" INTEGER NOT NULL,
    "proteinG" REAL,
    "carbsG" REAL,
    "fatG" REAL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DietRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "hasTraining" BOOLEAN NOT NULL DEFAULT false,
    "hasDiet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_openid_key" ON "User"("openid");
CREATE INDEX IF NOT EXISTS "BodyRecord_userId_recordedAt_idx" ON "BodyRecord"("userId", "recordedAt");
CREATE INDEX IF NOT EXISTS "Exercise_category_idx" ON "Exercise"("category");
CREATE INDEX IF NOT EXISTS "Exercise_creatorId_idx" ON "Exercise"("creatorId");
CREATE INDEX IF NOT EXISTS "Favorite_userId_idx" ON "Favorite"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_exerciseId_key" ON "Favorite"("userId", "exerciseId");
CREATE INDEX IF NOT EXISTS "WorkoutPlan_userId_idx" ON "WorkoutPlan"("userId");
CREATE INDEX IF NOT EXISTS "WorkoutPlanExercise_planId_sortOrder_idx" ON "WorkoutPlanExercise"("planId", "sortOrder");
CREATE INDEX IF NOT EXISTS "WorkoutSession_userId_startedAt_idx" ON "WorkoutSession"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "WorkoutLog_sessionId_exerciseId_setOrder_idx" ON "WorkoutLog"("sessionId", "exerciseId", "setOrder");
CREATE INDEX IF NOT EXISTS "PersonalRecord_userId_idx" ON "PersonalRecord"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalRecord_userId_exerciseId_key" ON "PersonalRecord"("userId", "exerciseId");
CREATE INDEX IF NOT EXISTS "DietRecord_userId_recordedAt_idx" ON "DietRecord"("userId", "recordedAt");
CREATE INDEX IF NOT EXISTS "CheckIn_userId_dateKey_idx" ON "CheckIn"("userId", "dateKey");
CREATE UNIQUE INDEX IF NOT EXISTS "CheckIn_userId_dateKey_key" ON "CheckIn"("userId", "dateKey");
┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.9.1                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
`;

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

export function ensureDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = doInit();
  }
  return initPromise;
}

async function doInit() {
  try {
    await prisma.$queryRaw`SELECT COUNT(*) as c FROM User`;
    return;
  } catch {
    // tables don't exist yet
  }
  const statements = CREATE_TABLES.split(';').map((s: string) => s.trim()).filter((s: string) => s && !s.startsWith('--'));
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (e) {
      console.error('[db-init] SQL failed:', stmt.slice(0, 60), (e as Error).message);
    }
  }
  try {
    const existing = await prisma.exercise.count();
    if (existing === 0) {
      await prisma.exercise.createMany({
        data: SYSTEM_EXERCISES.map(e => ({ ...e, isSystem: true })),
      });
      console.log('[db-init] Seeded', SYSTEM_EXERCISES.length, 'system exercises');
    }
  } catch (e) {
    console.error('[db-init] Seed failed:', (e as Error).message);
  }
}
