# MT Academy

Wyckoff 2.0 交易教育 / 后台管理系统。

技术栈：React 19 + Vite + Hono + Cloudflare Pages / D1 / R2 / KV

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置密钥（不要提交真实密钥）

复制示例并填写本地值：

- `.env.example` → 参考
- 创建 `.dev.vars`（Wrangler 自动加载，已 gitignore）：

```ini
JWT_SECRET=local-dev-only-change-me
ALLOW_DEV_FALLBACK=1
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

说明：

| 变量 | 含义 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥（**生产必须用 Pages Secret**） |
| `ALLOW_DEV_FALLBACK` | 仅本地可设 `1`，启用 `admin@mt.com` / `teacher@mt.com` / `student@mt.com` 演示账号 |
| `ALLOWED_ORIGINS` | CORS 白名单，逗号分隔 |

生产：

```bash
wrangler pages secret put JWT_SECRET
# 不要设置 ALLOW_DEV_FALLBACK=1
```

### 3. 初始化本地 D1

> 警告：`schema/mt-academy.sql` 含 `DROP TABLE`，**只用于本地重建**，切勿对生产远程库执行。

```bash
npm run db:init:local
npm run db:seed:local
npm run db:migrate:submissions:local
```

远程生产请使用增量迁移：

```bash
npm run db:migrate:enrollments
npm run db:migrate:submissions
# seed 仅在空库时手动执行，且确认不会清数据
```

### 4. 启动

```bash
npm run dev
```

打开 http://localhost:5173

### 本地演示账号（`ALLOW_DEV_FALLBACK=1` 且无对应 DB 用户时）

| 邮箱 | 密码 | 角色 |
|------|------|------|
| admin@mt.com | 123456 | 管理员 |
| teacher@mt.com | 123456 | 老师（课程/作业/直播，无学生管理） |
| student@mt.com | 123456 | 学生（Advanced） |

生产环境必须关闭 fallback，只使用 D1 用户。

## 部署

```bash
npm run build
npm run deploy
```

部署前检查清单：

1. `JWT_SECRET` 已写入 Pages Secrets，且不在仓库
2. `ALLOW_DEV_FALLBACK` 未开启
3. D1 / R2 绑定正确（见 `wrangler.toml`）
4. CORS `ALLOWED_ORIGINS` 指向正式域名
5. 不要对远程库跑带 `DROP TABLE` 的 init 脚本

## 主要能力

- 学生：注册/登录、按会员等级看课、选课、学习进度、交作业、直播回放
- 老师：课程/作业/批改/直播
- 管理员：学生管理、会员等级、认证审核、系统设置

## R2 资源

上传接口返回可访问 URL：`/api/assets/<key>`（需登录）。  
作业文件前缀：`submissions/{userId}/...`（学生仅可读自己的）。

## 脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run lint` | `tsc --noEmit` |
| `npm run build` | 构建前端 |
| `npm run db:init:local` | 本地重建 schema |
| `npm run db:seed:local` | 本地种子课程/作业 |
| `npm run db:migrate:submissions:local` | 提交唯一索引迁移 |
