# 考哪去

面向学生和家长的升学信息网站，聚合中考、高考新闻政策、学校信息、区域专题和初高中知识体系。**多地区**：上海（默认）与苏州已上线，所有页面统一走 `/{region}/...` URL 前缀（如 `/shanghai/schools`、`/suzhou/news`），由 `proxy.js` rewrite 并按地区注入配置。

当前主线：

- 新闻、头条与政策解读
- 学校信息、区域筛选与学校详情
- 初高中知识体系（上海）

## 当前架构

项目已统一到 Next.js App Router：

```text
kaonaqu/
├── app/              # Next 页面、布局和 API Route
├── components/       # 页面组件与客户端交互组件
├── content/          # knowledge 结构化 JSON（学科×年级）
├── data/             # sitemap 静态 URL、江苏资料库等数据资产
├── lib/              # 内容解析、页面数据组织、业务工具
├── shared/           # API 路由、schema、数据读写、地区配置
├── styles/           # 全站与频道样式
├── proxy.js          # 多地区路由代理（/{region}/ 前缀 rewrite）
├── public/           # robots、sitemap、百度 URL、图片等静态资源
├── vercel.json       # cleanUrls 配置
└── package.json      # 启动脚本
```

## 快速开始

```bash
npm install
npm run dev
```

启动后访问：

```text
http://localhost:3000
```

常用页面（无前缀访问会 308 到 `/shanghai/...`）：

- `/shanghai`
- `/shanghai/news`（苏州：`/suzhou/news`）
- `/shanghai/schools`（苏州：`/suzhou/schools`）
- `/shanghai/knowledge`（上海专属）

## 可用接口

Next API Route 统一入口在 `app/api/[...slug]/route.js`，业务处理复用 `shared/api-router.js`。

- `GET /api/districts?region=shanghai`
- `GET /api/schools?region=shanghai`
- `GET /api/schools?district=xuhui&region=shanghai`
- `GET /api/policies`
- `GET /api/news`
- `GET /api/search?q=复旦`
- `POST /api/schools` / `PUT /api/schools?id=<school-id>` / `DELETE /api/schools?id=<school-id>`
- `POST /api/news` / `PUT /api/news?id=<news-id>` / `DELETE /api/news?id=<news-id>`

> API 不走 `/{region}/` 前缀，地区从 `query.region` 取（默认 `shanghai`）；写操作的 `region` 优先取 body。
> 写操作（POST/PUT/DELETE）直接变更线上数据库，需配置 Supabase；未配置时返回 503。
> 写操作必须带 `Authorization: Bearer $KNQ_ADMIN_TOKEN`，否则返回 401/403；GET 只读放行。

## 数据链路

数据权威源为线上 Supabase 数据库（`schools` / `news` 表）：

```text
Supabase (schools / news 表，带 region 列)
  -> shared/data-store.js 按页面需求查询函数（loadSchoolsList/loadNewsList 等）
  -> lib/* / shared/*
  -> app/* 页面与 app/api/* 接口
```

- Supabase 为唯一数据源，无本地缓存文件；查询经 Next.js Data Cache 缓存（60s，写操作后主动失效）。
- 增删改直接操作数据库。
- knowledge 内容为文件系统 JSON（`content/knowledge/`），不经过数据库。

## 常用命令

- `npm run dev`：本地开发
- `npm run build`：生产构建
- `npm start`：启动 Next 生产服务
- `npm test`：跑全部测试（node:test）

## Vercel 部署

项目可直接按 Next.js 部署到 Vercel：

1. Root Directory 设为仓库根目录
2. Framework Preset 选择 Next.js
3. Build Command 使用默认 `next build`
4. 配置 Supabase 环境变量：`KNQ_SUPABASE_URL`、`KNQ_SUPABASE_SERVICE_ROLE_KEY`、`KNQ_SUPABASE_ANON_KEY`
5. 配置写 API 鉴权变量：
   - `KNQ_ADMIN_TOKEN`：≥32 字符随机串（`openssl rand -hex 32`）。未配置时所有写操作一律 403。
   - `KNQ_API_ALLOW_ORIGINS`：CORS 白名单（逗号分隔），默认 `http://localhost:3000,https://kaonaqu.xyz`。
   - 调用写 API 时带 `Authorization: Bearer <token>`。
6. 部署后访问 `/shanghai`、`/shanghai/news`、`/shanghai/schools`、`/shanghai/knowledge`

`vercel.json` 当前仅负责 `cleanUrls` 配置。
