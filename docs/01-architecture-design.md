# 健身小程序 MVP — 架构与设计文档（第 0 阶段）

> 本文档为项目第一步产出：目录检查结论、技术架构、目录结构、数据库表设计、分阶段开发清单。
> 本轮不编写业务代码。

## 1. 项目目录检查结论

- 当前路径：`C:\Users\50415\OneDrive\文档\fitness app`
- Git：已初始化，`master` 分支，**无任何提交**
- 已有内容：仅一个空的 `docs/` 目录
- 结论：**全新项目**，无已有功能，不存在推翻或重写的风险
- 环境注意：本机 Node v24.18.1 可用；`npm`（PowerShell 脚本）因执行策略被禁用，后续阶段需改用 `npm.cmd` 或执行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 后再使用。

## 2. 推荐技术架构

### 前端：uni-app（Vue3 + Vite + JavaScript）

- 一套代码可编译为微信小程序，未来可复用到 iOS / Android / H5，契合“未来扩展为企业主体、App、Web”的目标。
- Vue3 生态成熟、学习成本低；Vite 开发体验好。
- 业务逻辑全部走后端 API，前端只做渲染与交互（`api/` 层统一封装请求），不写死业务规则。
- 备选：若希望工具链零抽象、仅做微信小程序，可改为微信原生（WXML/WXSS/JS），但跨平台复用性弱。本设计默认采用 uni-app。

### 后端：Node.js + TypeScript + Express + Prisma

- Express：生态最大、最简单；路由 → 控制器（薄层）→ 服务（业务核心）→ Prisma 分层，逻辑集中在服务层，便于未来替换前端或多端复用。
- TypeScript：保障 API 契约与类型安全；与 Prisma 自动生成的类型配合。
- Prisma：开发期用 SQLite，切换 PostgreSQL 只需改 `schema.prisma` 的 `datasource.provider` 与 `DATABASE_URL`，直接满足“保留切换 PostgreSQL 的能力”。
- 鉴权：微信 `wx.login` → 后端用 `code` 换 `openid`，签发 JWT；开发期提供 dev 旁路登录（无微信客户端时也能联调）。

### 数据库：SQLite（开发期）→ 可切换 PostgreSQL

- 通过 Prisma 抽象，业务代码不直接写 SQL 方言，迁移成本最低。
- 文件库 `./prisma/dev.db`，无需安装数据库服务。

### API 规范

- RESTful，统一前缀 `/api/v1`，资源化路径（如 `/api/v1/training/sessions`）。
- 统一响应结构 `{ code, message, data }`，统一错误处理中间件。
- 鉴权中间件注入 `req.userId`，所有用户数据按 `userId` 隔离。

### 分层职责（避免业务逻辑写死在小程序端）

```
小程序页面 → api/ 封装 → HTTP → 后端 routes → controllers(薄) → services(业务) → Prisma → DB
```

## 3. 目录结构

```
fitness-app/
├── docs/                          # 设计文档、API 文档
│   └── 01-architecture-design.md
├── server/                        # 后端 Node.js 服务
│   ├── src/
│   │   ├── config/                # 环境配置、常量
│   │   │   └── index.ts
│   │   ├── routes/                # 路由（按模块拆分）
│   │   │   ├── user.routes.ts
│   │   │   ├── training.routes.ts
│   │   │   ├── diet.routes.ts
│   │   │   ├── body.routes.ts
│   │   │   └── checkin.routes.ts
│   │   ├── controllers/           # 请求/响应处理（薄层）
│   │   ├── services/              # 业务逻辑核心（计算容量、PR、连续天数等）
│   │   ├── middlewares/           # auth、错误处理
│   │   ├── utils/                 # 工具函数
│   │   ├── types/                 # 共享类型
│   │   └── app.ts                 # Express 实例与中间件装配
│   ├── prisma/
│   │   ├── schema.prisma          # 数据模型
│   │   ├── seed.ts                # 预置动作库种子数据
│   │   └── migrations/
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── miniprogram/                   # uni-app 小程序前端
│   ├── src/
│   │   ├── pages/                 # 页面（按模块）
│   │   │   ├── index/             # 首页
│   │   │   ├── profile/           # 用户资料
│   │   │   ├── training/          # 训练计划/记录
│   │   │   ├── diet/              # 饮食记录
│   │   │   └── body/              # 身体数据
│   │   ├── components/            # 通用组件
│   │   ├── api/                   # 接口封装（统一 baseURL、token 注入）
│   │   │   └── request.ts
│   │   ├── store/                 # 状态管理（Pinia）
│   │   ├── utils/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   ├── pages.json
│   │   └── manifest.json
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

## 4. 数据库表设计（Prisma 模型）

设计要点：
- 体重不存进用户资料（会变化），而是存 `BodyRecord` 时序记录；“当前体重”取最新一条。
- 年龄存 `birthDate`，展示时派生，避免逐年失真。
- 动作库 `Exercise`：`userId` 为空即全局预置，非空即用户自建。
- 训练容量 `volume = weightKg * reps`（单组）；会话 `totalVolume` 汇总所有组。
- PR 每个（用户, 动作）保留一条最佳记录（按 volume）。
- 打卡 `CheckIn` 以 (userId, date, type) 唯一；连续天数由查询连续日期派生，无需冗余存储。

```prisma
// 鉴权用户
model User {
  id        String   @id @default(cuid())
  openid    String   @unique
  unionid   String?
  nickname  String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  profile           UserProfile?
  exercises         Exercise[]          @relation("UserExercises")
  trainingDays      TrainingDay[]
  trainingSessions  TrainingSession[]
  personalRecords   PersonalRecord[]
  dietLogs          DietLog[]
  bodyRecords       BodyRecord[]
  checkIns          CheckIn[]
}

// 用户资料（与 User 一对一）
model UserProfile {
  userId    String   @id
  user      User     @relation(fields: [userId], references: [id])
  gender    Gender?
  birthDate DateTime?          // 年龄由此派生
  heightCm  Float?
  goal      String?            // 健身目标（自由文本或枚举）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Gender { MALE FEMALE OTHER }

// 动作库（全局预置 + 用户自建）
model Exercise {
  id        String         @id @default(cuid())
  userId    String?                     // null = 全局预置
  user      User?          @relation("UserExercises", fields: [userId], references: [id])
  name      String
  category  MuscleCategory
  createdAt DateTime       @default(now())

  planItems TrainingDayExercise[]
  sets      TrainingSet[]
  records   PersonalRecord[]
}

enum MuscleCategory { CHEST BACK SHOULDER LEG ARM CORE }

// 训练计划日（模板）
model TrainingDay {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String                  // 如 "推拉腿 Day A"
  note      String?
  createdAt DateTime @default(now())

  exercises TrainingDayExercise[]
  sessions  TrainingSession[]
}

// 计划日 ↔ 动作（含目标组数/次数）
model TrainingDayExercise {
  id            String      @id @default(cuid())
  trainingDayId String
  trainingDay   TrainingDay @relation(fields: [trainingDayId], references: [id], onDelete: Cascade)
  exerciseId    String
  exercise      Exercise    @relation(fields: [exerciseId], references: [id])
  sortOrder     Int         @default(0)
  targetSets    Int?
  targetReps    Int?

  @@unique([trainingDayId, exerciseId])
}

// 一次训练记录（某天练了）
model TrainingSession {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  trainingDayId String?                 // 可关联计划日
  trainingDay   TrainingDay?  @relation(fields: [trainingDayId], references: [id])
  date          DateTime      @default(now())
  startedAt     DateTime?
  endedAt       DateTime?
  totalVolume   Float         @default(0)   // 自动汇总容量
  createdAt     DateTime      @default(now())

  sets TrainingSet[]
}

// 训练中的每一组
model TrainingSet {
  id         String          @id @default(cuid())
  sessionId  String
  session    TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  exerciseId String
  exercise   Exercise        @relation(fields: [exerciseId], references: [id])
  setIndex   Int                          // 第几组
  weightKg   Float
  reps        Int
  volume      Float                        // = weightKg * reps
  createdAt   DateTime        @default(now())
}

// 个人最佳 PR（每用户每动作一条最佳）
model PersonalRecord {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  exerciseId String
  exercise   Exercise @relation(fields: [exerciseId], references: [id])
  weightKg   Float
  reps        Int
  volume      Float                  // weightKg * reps
  achievedAt DateTime @default(now())
  createdAt   DateTime @default(now())

  @@unique([userId, exerciseId])
}

// 饮食记录
model DietLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  date      DateTime              // 仅日期 00:00
  mealType  MealType
  foodName  String
  calories  Float                 // kcal
  proteinG  Float
  carbsG    Float
  fatG      Float
  createdAt DateTime @default(now())
}

enum MealType { BREAKFAST LUNCH DINNER SNACK }

// 身体数据（体重时序 + 照片占位）
model BodyRecord {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  recordedAt DateTime              // 记录时间
  weightKg   Float
  bodyFatPct Float?                 // 可选体脂率
  photoUrl   String?                // V1 占位字段，未来接对象存储
  note       String?
  createdAt  DateTime @default(now())
}

// 打卡（训练 / 饮食）
model CheckIn {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  date      DateTime                 // 仅日期
  type      CheckInType
  createdAt DateTime    @default(now())

  @@unique([userId, date, type])    // 同一天同类型仅一次
}

enum CheckInType { TRAINING DIET }
```

## 5. 分阶段开发清单

原则：每次只完成一个模块；每完成一个模块项目可运行；不引入需求外功能。
顺序考虑了依赖关系（记录依赖动作库与计划，首页依赖各模块聚合）。

- **阶段 0｜项目脚手架**：搭建 server（Express+TS+Prisma+SQLite、JWT、dev 登录旁路、统一响应/错误处理）与 miniprogram（uni-app 工程骨架、`api/request.ts`、Pinia、登录与 token 存储、全局配置）。完成后两端可联通（登录拿到 token）。
- **阶段 1｜用户资料模块**：`UserProfile` CRUD（性别、出生日期→年龄、身高、目标）。完成后资料可读写。
- **阶段 2｜身体数据模块**：`BodyRecord` 增删查、体重趋势查询；“当前体重”取最新记录；照片用占位字段。完成后体重可记录与查看趋势。（放在首页前，因为首页需要“当前体重”。）
- **阶段 3｜训练计划模块**：预置动作库 seed（六分类）+ 用户自建动作；`TrainingDay` 创建/编辑、挂载动作与目标。完成后计划可建可看。
- **阶段 4｜训练记录模块**：`TrainingSession` 建会话、`TrainingSet` 记组（重量/次数/组数），后端自动算 `volume` 与 `totalVolume`；保存历史；写入/更新 `PersonalRecord` PR。完成后可记录训练并查看 PR。
- **阶段 5｜饮食记录模块**：`DietLog` 按早/午/晚/加餐录入热量/蛋白质/碳水/脂肪；按日期汇总。完成后饮食可记录。
- **阶段 6｜打卡与连续天数模块**：`CheckIn` 训练/饮食打卡；按连续日期计算连续打卡天数。完成后可打卡并显示连签。
- **阶段 7｜首页聚合**：聚合今日训练、今日饮食完成度、当前体重、连续打卡天数四项卡片。完成后首页可用，V1 功能闭环。

> 阶段 0 完成后即进入逐模块迭代；每阶段结束保证 `npm run dev`（后端）与小程序开发者工具（前端）可正常加载运行。
