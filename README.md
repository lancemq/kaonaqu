# 考哪去

面向上海学生和家长的学习与升学信息网站，聚合上海中考、高考新闻政策、学校信息、区域专题和初高中知识体系。

当前主线：

- 新闻、头条与政策解读
- 学校信息、区域筛选与学校详情
- 初高中知识体系

## 当前架构

项目已统一到 Next.js App Router：

```text
kaonaqu/
├── app/              # Next 页面、布局和 API Route
├── components/       # 页面组件与客户端交互组件
├── content/          # 新闻、政策、学校 Markdown 内容
├── data/             # 运行时缓存与知识体系数据
├── lib/              # 内容解析、页面数据组织、业务工具
├── shared/           # API 路由、schema、数据读写与服务层
├── styles/           # 全站与频道样式
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

常用页面：

- `/`
- `/news`
- `/schools`
- `/knowledge`

## 可用接口

Next API Route 统一入口在 `app/api/[...slug]/route.js`，业务处理复用 `shared/api-router.js`。

- `GET /api/districts`
- `GET /api/schools`
- `GET /api/schools?district=xuhui`
- `GET /api/policies`
- `GET /api/news`
- `GET /api/search?q=复旦`
- `POST /api/schools` / `PUT /api/schools?id=<school-id>` / `DELETE /api/schools?id=<school-id>`
- `POST /api/news` / `PUT /api/news?id=<news-id>` / `DELETE /api/news?id=<news-id>`

> 写操作（POST/PUT/DELETE）直接变更线上数据库，需配置 Supabase；未配置时返回 503。

## 数据链路

数据权威源为线上 Supabase 数据库（`schools` / `news` 表）：

```text
Supabase (schools / news 表)
  -> shared/data-store.js loadDataStore()（DB 优先，读后刷新本地缓存）
  -> lib/* / shared/*
  -> app/* 页面与 app/api/* 接口
```

- `data/schools.json` 与 `data/news.json` 是运行时由数据库生成的缓存文件（已 gitignore，从仓库移除），每次读取数据库时自动刷新并与线上对齐。
- 增删改直接操作数据库，本地缓存只读。

## 常用命令

- `npm run dev`：本地开发
- `npm run build`：生产构建
- `npm start`：启动 Next 生产服务

## Vercel 部署

项目可直接按 Next.js 部署到 Vercel：

1. Root Directory 设为仓库根目录
2. Framework Preset 选择 Next.js
3. Build Command 使用默认 `next build`
4. 配置 Supabase 环境变量：`KNQ_SUPABASE_URL`、`KNQ_SUPABASE_SERVICE_ROLE_KEY`、`KNQ_SUPABASE_ANON_KEY`
5. 部署后访问 `/`、`/news`、`/schools`、`/knowledge`

`vercel.json` 当前仅负责 `cleanUrls` 配置。
