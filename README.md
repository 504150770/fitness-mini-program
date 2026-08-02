# 健身小程序 MVP

个人主体健身内容创作者的内测小程序，前后端分离架构，业务逻辑全部在后端 API，前端不写死业务规则。

## 技术栈

- 前端：uni-app + Vue 3 + Vite + TypeScript（编译到微信小程序）
- 后端：Node.js + TypeScript + Express + Prisma
- 数据库：开发期 SQLite，可切换 PostgreSQL（改 prisma/schema.prisma 的 provider 与 DATABASE_URL）
- API：统一前缀 /api/v1，统一响应格式 { code, message, data }

## V1 功能清单

1. 用户资料：性别、出生日期（自动算年龄）、身高、健身目标
2. 身体数据：体重记录、体脂率、体重趋势、历史记录
3. 动作库：36 个系统预置动作（胸/背/肩/腿/手臂/核心各 6 个），支持搜索、分类筛选、用户自定义动作（系统动作不可修改/删除）
4. 训练计划：创建/编辑/删除训练日，添加动作并设置组数/次数/建议重量，调整动作顺序
5. 训练记录：从训练计划开始训练或自由训练，记录每组重量×次数，自动计算训练容量（weight×reps），复制上一组，完成训练，训练历史与详情，个人最佳成绩 PR 自动记录
6. 饮食记录：早/午/晚/加餐四餐，记录热量/蛋白质/碳水/脂肪，每日汇总
7. 打卡：训练完成自动打卡、饮食记录自动打卡、手动打卡，连续打卡天数计算
8. 首页聚合：今日训练状态、今日饮食热量、当前体重、连续打卡天数

## 目录结构

- server/ 后端服务
  - src/config 配置与数据库连接
  - src/routes API 路由（health/auth/users/body/exercises/plans/sessions/diet/checkins/home）
  - src/controllers 控制器（参数提取 + DTO 转换）
  - src/services 业务逻辑（所有校验和计算在此层）
  - src/middlewares auth（JWT）+ error（统一错误处理）
  - src/utils/response 统一响应格式
  - prisma/schema.prisma 数据模型
  - prisma/schema.sql 完整建表 SQL（--from-empty 生成）
  - prisma/seed.ts 36 个系统动作种子脚本
  - .env.example 环境变量示例
- miniprogram/ uni-app 前端
  - src/api 请求封装（request.ts）、接口定义（index.ts）、token 管理（token.ts）、页面间状态传递（state.ts）
  - src/pages/index 首页（数据聚合 + 模块导航）
  - src/pages/profile 用户资料
  - src/pages/body 身体数据
  - src/pages/exercise 动作库
  - src/pages/plan 训练计划列表
  - src/pages/plan-detail 训练日详情（动作管理 + 开始训练）
  - src/pages/session 训练中（记录组、复制、完成）
  - src/pages/history 训练历史
  - src/pages/session-detail 训练详情
  - src/pages/diet 饮食记录
  - .env.development / .env.production 接口地址（区分开发/生产）

## 环境要求

- Node.js 18+（本机 v24）
- npm：若 PowerShell 执行策略禁用了 npm.ps1，请用 npm.cmd 执行命令，不要修改系统执行策略
- 微信开发者工具（运行小程序端）

## 后端启动

1. cd server
2. npm.cmd install
3. 复制 .env.example 为 .env，按需填写 JWT_SECRET（开发期可用默认）、WX_APP_ID / WX_APP_SECRET（正式微信登录时再填）
4. 生成 Prisma 客户端：npm.cmd run db:generate
5. 创建数据库（首次）：npx prisma db execute --file prisma/schema.sql --schema prisma/schema.prisma
6. 种子数据（36 个系统动作）：npm.cmd run db:seed
7. 启动：npm.cmd run dev，服务运行在 http://localhost:3000

## 数据库迁移（重要）

本机环境下 prisma db push 与 prisma migrate dev 的 schema engine CLI 会报空错误，因此改用 diff + execute 工作流：

首次建库（项目已提供 prisma/schema.sql，内含全部建表语句）：
  npx prisma db execute --file prisma/schema.sql --schema prisma/schema.prisma

后续修改 prisma/schema.prisma 后同步数据库：
  npm.cmd run db:diff > prisma/migration.sql   生成增量 SQL
  npm.cmd run db:apply                          应用到 SQLite
  npm.cmd run db:generate                       重新生成客户端

切换到 PostgreSQL：把 schema.prisma 的 provider 改为 postgresql，把 .env 的 DATABASE_URL 改为 postgres 连接串，再执行上述同步流程。

## 前端启动

1. cd miniprogram
2. npm.cmd install（境内可用 .npmrc 配置 npmmirror 加速，项目已带 .npmrc）
3. 开发：npm.cmd run dev:mp-weixin（监听输出到 dist/dev/mp-weixin）
   构建：npm.cmd run build:mp-weixin（输出到 dist/build/mp-weixin）
4. 用微信开发者工具导入 dist/dev/mp-weixin 或 dist/build/mp-weixin 运行
5. 在开发者工具"详情 - 本地设置"勾选"不校验合法域名"
6. 接口地址在 .env.development（默认 http://localhost:3000/api/v1）与 .env.production，不要在前端写死后端地址

## API 接口一览

基础认证：除 health 和 auth 外，所有接口需 Authorization: Bearer <token>

- GET  /api/v1/health 健康检查
- POST /api/v1/auth/dev-login { openid } 开发登录（仅开发环境）
- POST /api/v1/auth/wx-login { code } 微信登录（需 AppID/AppSecret）
- GET  /api/v1/auth/me 当前用户
- GET/PUT /api/v1/users/profile 用户资料
- GET/POST /api/v1/body/records 身体记录；GET /body/latest；GET /body/trend
- GET/POST /api/v1/exercises 动作库；PUT/DELETE /exercises/:id（仅自定义）
- GET/POST /api/v1/plans 训练计划；PUT/DELETE /plans/:id
- POST/PUT/DELETE /api/v1/plans/:id/exercises 计划动作管理；PUT /plans/:id/reorder
- POST /api/v1/sessions 开始训练；GET /sessions 历史；GET /sessions/:id 详情；PUT /sessions/:id 完成
- POST/PUT/DELETE /api/v1/sessions/:id/logs 训练组；POST /sessions/:id/logs/copy 复制上一组
- GET /api/v1/sessions/prs 个人最佳记录
- GET/POST/PUT/DELETE /api/v1/diet 饮食记录；GET /diet/summary 每日汇总
- POST /api/v1/checkins 打卡；GET /checkins/today；GET /checkins/streak
- GET /api/v1/home 首页聚合数据

## 字段单位约定

- 重量/体重：weightKg（千克）
- 身高：heightCm（厘米）
- 热量：caloriesKcal（千卡）
- 蛋白质/碳水/脂肪：proteinG / carbsG / fatG（克）
- 体脂率：bodyFatPct（百分比 0-100）
- 训练容量：volumeKg = weightKg × reps（千克）

## 已知问题

- OneDrive 目录会同步 node_modules，安装被中断可能写坏原生二进制（如 esbuild）。若遇到此问题，删除 node_modules 后用 npmmirror 重新安装。
- prisma db push / migrate dev 在本机 schema engine CLI 下报空错误，已用 db:diff + db:apply 工作流替代。
- 微信正式登录（wx-login）当前为占位，缺 AppID/AppSecret 时不阻塞开发。
- 身体照片功能为占位（BodyRecord.photoUrl 字段已预留），图片上传暂未实现。
- 前端运行时验证通过 vue-tsc 类型检查 + build:mp-weixin 编译；未在微信开发者工具中做真机运行验证（无头环境限制）。

## 下一版建议

1. 图片上传（身体照片、训练动作图示）
2. 训练计划模板（预设推日/拉日/腿日）
3. 饮食食物数据库（常见食物营养信息）
4. 数据图表可视化（体重曲线、训练容量趋势）
5. 企业主体切换 + 微信正式登录
6. Web 管理后台
7. 数据导出（CSV / Excel）