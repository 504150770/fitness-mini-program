# 健身小程序 MVP

个人主体健身内容创作者的内测小程序，前后端分离架构，业务逻辑全部在后端 API，前端不写死业务规则。

## 技术栈

- 前端：uni-app + Vue 3 + Vite + TypeScript（编译到微信小程序）
- 后端：Node.js + TypeScript + Express + Prisma
- 数据库：开发期 SQLite，可切换 PostgreSQL（改 prisma/schema.prisma 的 datasource.provider 与 DATABASE_URL）
- API：统一前缀 /api/v1，统一响应格式 { code, message, data }

## 目录结构

- server/ 后端服务
  - src/ 源码（config / routes / controllers / services / middlewares / utils）
  - prisma/schema.prisma 数据模型；prisma/schema.sql 初始建表 SQL
  - .env.example 环境变量示例
- miniprogram/ uni-app 前端
  - src/api 请求封装与接口定义
  - src/pages/index 首页（阶段0 联调页）
  - .env.development / .env.production 接口地址（区分开发/生产）
- docs/ 设计文档

## 环境要求

- Node.js 18+（本机 v24）
- npm：若 PowerShell 执行策略禁用了 npm.ps1，请用 npm.cmd 执行命令，不要修改系统执行策略
- 微信开发者工具（运行小程序端）

## 后端启动

1. cd server
2. npm.cmd install
3. 复制 .env.example 为 .env，按需填写 JWT_SECRET（开发期可用默认）、WX_APP_ID / WX_APP_SECRET（正式微信登录时再填）
4. 生成 Prisma 客户端：npm.cmd run db:generate
5. 创建数据库：见下方“数据库迁移”
6. 启动：npm.cmd run dev，服务运行在 http://localhost:3000

## 数据库迁移（重要）

本机环境下 `prisma db push` 与 `prisma migrate dev` 的 schema engine CLI 会报空错误，因此改用 diff + execute 工作流：

首次建库（项目已提供 prisma/schema.sql，内含 User 建表语句）：
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
5. 在开发者工具“详情 - 本地设置”勾选“不校验合法域名”（manifest 已设 urlCheck:false）
6. 接口地址在 .env.development（默认 http://localhost:3000/api/v1）与 .env.production，不要在前端写死后端地址

## API 接口（阶段0）

- GET  /api/v1/health 健康检查
- POST /api/v1/auth/dev-login  body: { openid }  开发环境模拟登录（仅开发环境挂载）
- POST /api/v1/auth/wx-login   body: { code }   正式微信登录（需配置 AppID/AppSecret，当前为占位）
- GET  /api/v1/auth/me         需 Authorization: Bearer <token>

开发登录与正式微信登录共用同一套用户体系（userService.getOrCreateByOpenid + JWT），不形成两套业务逻辑。

## 开发登录使用

调用 POST /api/v1/auth/dev-login，body 传 { openid: 'tester001' }，返回 user 与 token；前端将 token 存入本地，后续请求自动带 Authorization 头。小程序首页提供按钮直接测试健康检查、开发登录、读取当前用户与触发错误（统一提示）。

## 已知问题

- OneDrive 目录会同步 node_modules（大量文件），安装被中断可能写坏原生二进制（如 esbuild）。项目已用 npmmirror 镜像完成干净安装；安装过程中产生的 miniprogram/node_modules.bad（旧损坏副本）可手动删除。
- `prisma db push` 在本机 schema engine CLI 下报空错误，已用 db:diff + db:apply 工作流替代。
- 阶段0 未做真机/开发者工具内运行时联调验证：后端接口已用 curl 验证（health / dev-login / me / 404 / 未配置微信），前端已通过 build:mp-weixin 编译与 vue-tsc 类型检查。真机调用需在微信开发者工具导入产物并运行后端后确认。
- 微信正式登录（wx-login）当前为占位，缺 AppID/AppSecret 时不阻塞开发。