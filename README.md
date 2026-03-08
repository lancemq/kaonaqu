# 考哪去

一个面向上海学生和家长的学习与升学信息网站，当前整合了三条主线：

- 新闻、头条与政策信息
- 学校信息与区域筛选
- 初高中知识体系

站点支持本地 Node 服务运行，也支持直接部署到 Vercel 并从域名根路径访问。

## 当前结构

项目当前分成四层：

- 根目录静态页面：站点首页、新闻页、学校页、知识体系页
- `api/`：Vercel Serverless Functions，同时也作为前端统一 API 设计参考
- `data/`：本地兜底数据与初始导入数据
- `crawler/`：来源抓取、数据处理与发布链路
- `supabase/`：数据库建表 SQL
- `shared/`：共享 schema、存储层和服务层

当前版本已支持使用 Supabase 作为后端存储，学校、新闻、政策的增删改查和定时采集写入都可以落到数据库。

## 快速开始

```bash
npm run data:process
npm run data:validate
npm start
```

启动后访问：

```text
http://localhost:8080
```

本地可直接访问的页面：

- `/`
- `/news`
- `/schools`
- `/knowledge`

## 可用接口

- `GET /api/districts`
- `GET /api/schools`
- `GET /api/schools?district=xuhui`
- `GET /api/policies`
- `GET /api/policies?district=pudong`
- `GET /api/news`
- `GET /api/search?q=复旦`
- `POST /api/schools`
- `PUT /api/schools?id=<school-id>`
- `DELETE /api/schools?id=<school-id>`
- `POST /api/policies`
- `PUT /api/policies?id=<policy-id>`
- `DELETE /api/policies?id=<policy-id>`
- `POST /api/news`
- `PUT /api/news?id=<news-id>`
- `DELETE /api/news?id=<news-id>`

## 数据链路

```text
crawler/data/raw
  -> crawler/src/process-data.js
  -> crawler/data/processed
  -> Supabase / data/
  -> api/* / web/server.js
  -> script.js 前端展示
```

## 统一字段

- `district`: `id`, `name`, `description`, `schoolCount`, `policyCount`, `latestPolicyTitle`
- `school`: `id`, `name`, `districtId`, `districtName`, `schoolType`, `schoolTypeLabel`, `address`, `phone`, `website`, `admissionNotes`, `features`, `source`, `updatedAt`
- `policy`: `id`, `title`, `districtId`, `districtName`, `year`, `summary`, `content`, `source`, `publishedAt`, `updatedAt`
- `news`: `id`, `title`, `summary`, `source`, `publishedAt`, `examType`, `url`

`source` 统一为：

- `name`
- `type`
- `url`
- `crawledAt`
- `confidence`

## 目录说明

```text
kaonaqu/
├── api/              # Vercel Serverless Functions
├── data/             # 前端和 API 使用的数据文件
├── knowledge/        # 知识体系页面与样式
├── crawler/          # 数据采集与处理流水线
├── shared/           # 共享 schema、存储、服务、路由逻辑
├── scripts/          # 数据校验脚本
├── supabase/         # Supabase 建表 SQL
├── index.html        # 首页
├── news.html         # 新闻政策模块
├── schools.html      # 学校信息模块
├── styles.css        # 主站样式
├── script.js         # 前端脚本
├── web/server.js     # 本地 Node 静态服务
├── vercel.json       # Vercel 配置
└── package.json      # 启动脚本
```

## Vercel 部署

当前项目已经适配 Vercel 根路径访问，不需要再通过 `/web` 进入。

部署建议：

1. 在 Vercel 中将项目 Root Directory 设为仓库根目录
2. Framework Preset 选择 `Other`
3. 不需要额外的 Build Command
4. 部署后直接访问：
   - `/`
   - `/news`
   - `/schools`
   - `/knowledge`

当前 [vercel.json](/Users/maqi/project/msy/kaonaqu/vercel.json) 主要负责两件事：

- 开启 `cleanUrls`
- 确保 `api/*` 和定时任务打包时包含所需数据与 crawler 文件

### Supabase 配置

先在 Supabase SQL Editor 中执行 [supabase/schema.sql](/Users/maqi/project/msy/kaonaqu/supabase/schema.sql)。

然后为项目配置：

- `SUPABASE_URL` 或 `KNQ_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` 或 `KNQ_SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SCHOOLS_TABLE`（可选，默认 `content_schools`）
- `SUPABASE_POLICIES_TABLE`（可选，默认 `content_policies`）
- `SUPABASE_NEWS_TABLE`（可选，默认 `content_news`）

如果你已经使用了 `KNQ_SUPABASE_SECRET_KEY`，当前后端也兼容这个名字，但更建议统一成 `SUPABASE_SERVICE_ROLE_KEY`。

首次把本地数据导入数据库可以执行：

```bash
npm run data:sync:supabase
```

### 定时采集任务

项目已配置 Vercel Cron，每天凌晨 `1:00`（Asia/Shanghai）执行一次信息获取任务。

注意：

- Vercel Cron 使用 UTC，因此配置写成 `0 17 * * *`
- 该任务会触发 `/api/cron-refresh`
- 任务顺序是：采集 -> 处理 -> 校验 -> 写入 Supabase
- 前端 API 会优先读取 Supabase 中的最新数据，读取失败时才回退到仓库内置数据

需要在 Vercel 项目中配置的环境变量：

- `CRON_SECRET`
- `SUPABASE_URL` 或 `KNQ_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` 或 `KNQ_SUPABASE_SERVICE_ROLE_KEY`

如果你还保留 Blob 方案，也可以继续配置：

- `BLOB_READ_WRITE_TOKEN`
- `BLOB_DATA_PREFIX`（可选，默认是 `runtime-data`）

如果你设置了 `CRON_SECRET`，Vercel Cron 会自动在请求里带上 `Authorization: Bearer <CRON_SECRET>`。

如果部署后页面正常但接口报错，优先检查 `/api/districts`、`/api/schools`、`/api/news` 是否返回 200。

## 常用命令

- `npm run crawl`
- `npm run data:process`
- `npm run data:validate`
- `npm run data:sync:supabase`
- `npm start`
