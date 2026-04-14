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
├── data/             # 本地运行数据与知识体系数据
├── lib/              # 内容解析、页面数据组织、业务工具
├── shared/           # API 路由、schema、数据读写与服务层
├── crawler/          # 数据采集与处理流水线
├── scripts/          # 数据生成、校验、SEO 与维护脚本
├── styles/           # 全站与频道样式
├── public/           # robots、sitemap、百度 URL、图片等静态资源
├── vercel.json       # Vercel Cron 与 cleanUrls 配置
└── package.json      # 启动与维护脚本
```

旧静态站入口已经下线，页面不再依赖根目录 `index.html`、`news.html`、`schools.html`、`script.js` 或 `web/server.js`。

## 快速开始

```bash
npm install
npm run data:validate
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

当前站点默认读取仓库本地文件：

```text
content/*.md + data/*.json
  -> lib/* / shared/*
  -> app/* 页面与 app/api/* 接口
```

采集链路仍保留在 `crawler/`：

```text
crawler/src/*
  -> crawler/data/raw
  -> crawler/data/processed
  -> data/
```

## 常用命令

- `npm run dev`：本地开发
- `npm run build`：生产构建
- `npm start`：启动 Next 生产服务
- `npm run seo:build`：生成 `public/sitemap.xml` 和 `public/baidu_urls.txt`
- `npm run data:validate`：校验新闻、学校和基础数据
- `npm run data:policies:markdown`：从政策数据生成 Markdown 内容
- `npm run data:schools:markdown`：同步学校详情 Markdown
- `npm run data:schools:enrich:dry`：预演学校详情补全
- `npm run data:schools:enrich`：执行学校详情补全
- `npm run crawl`：执行 crawler 主流程

## Vercel 部署

项目可直接按 Next.js 部署到 Vercel：

1. Root Directory 设为仓库根目录
2. Framework Preset 选择 Next.js
3. Build Command 使用默认 `next build`
4. 部署后访问 `/`、`/news`、`/schools`、`/knowledge`

`vercel.json` 当前负责：

- `cleanUrls`
- 每天触发 `/api/cron-refresh` 的 Vercel Cron

定时采集需要配置：

- `CRON_SECRET`

如果后续恢复外部存储同步，再按脚本需要配置 Supabase 或 Blob 相关变量。

## 学校详情补全

学校详情 Markdown 的统一补全入口为：

- `scripts/enrich-school-markdown-unified.mjs`

建议流程：

1. 先预演范围：

```bash
npm run data:schools:enrich:dry
```

2. 确认后执行正式补全：

```bash
npm run data:schools:enrich
```

3. 完成后做全量校验：

```bash
npm run data:validate
```

更多说明见：

- `docs/school-markdown-enrichment.md`
