# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

考哪去（kaonaqu）是面向上海学生和家长的升学信息站，聚合上海中考/高考新闻政策、学校信息、区域专题和初高中知识体系。基于 Next.js App Router（Next 16, React 19），数据权威源为线上 Supabase 数据库（`schools`/`news` 表），本地 JSON 为运行时只读缓存。

## 常用命令

```bash
npm install
npm run dev              # 本地开发，http://localhost:3000
npm run build            # 生产构建
npm start                # 启动 Next 生产服务

# 测试（node:test，无额外测试框架）
node --test tests/*.test.mjs                  # 跑全部测试
node --test tests/knowledge-content.test.mjs  # 跑单个测试文件
```

TypeScript 为可选（`strict: false`，`allowJs: true`）；仅 `score-match-engine.ts`、`score-match-client.tsx` 等少数文件用 TS。无 lint 脚本。

## 架构要点

### 数据流：数据库优先

```
content/*.md + data/*.json  ->  lib/* 与 shared/*  ->  app/* 页面 / app/api/*
```

- 学校与新闻数据权威源均为线上数据库（`schools` / `news` 表），Supabase 为**唯一数据源**（2026-07-17 已移除 schools/news 的文件系统 json 缓存：不再写回、不再降级读取，serverless 上写不进/读不到/跨实例不共享）。`districts` 由 `buildDistricts(schools, news)` 从学校数据动态聚合生成，不依赖 `data/districts.json` 文件。其余 `data/*.json`（`districts.json`/`policies.json`/`knowledge-pages.json`）为提交的运行数据。
- `content/` 存放 Markdown 长文（news / schools / policies 详情、knowledge 结构化 JSON）。
- `shared/data-store.js` 的 `loadDataStore()` 以 Supabase 为唯一源（未配置时返回空数据集，不再降级读本地文件）；进程内 60s memo 缓存避免每次请求打库。Vercel 上的**跨实例缓存**由 Supabase 查询层的 Next.js Data Cache 承担（`shared/supabase-client.js` 的 `cachedFetch` 给所有 Supabase 查询附加 `next: { revalidate: 60, tags: ['supabase-data'] }`，持久化在 Vercel 缓存层、跨实例共享）。
- 增删改直接操作 DB（`createXxxInSupabase`/`updateXxxInSupabase`/`deleteXxxFromSupabase`），写操作后列表至多 60s 经 Data Cache revalidate 自动刷新（如需更强一致性可在写路径调 `revalidateTag('supabase-data')`）；DB 未配置时写操作抛 503。

### API 层：单一 catch-all 入口

- 所有 REST 接口走 `app/api/[...slug]/route.js`，转给 `shared/api-router.js` 的 `handleApiRequest({ method, pathname, query, body })`。
- 业务逻辑在 `shared/content-service.js`（CRUD 写 DB + 搜索 + 轻量归一化 `buildSchoolRecord`/`buildNewsRecord`），区域目录与基础工具在 `shared/data-schema.js`，DB 行↔应用对象映射在 `shared/data-store.js`（`rowToSchool`/`schoolToRow`、`rowToNews`/`newsToRow`）。
- 新增接口：在 `api-router.js` 加 `pathname` 分支即可，无需新建 route 文件。

### 页面与频道

四个顶级频道，由 `components/body-page-flag.js` 设置 `body[data-page="..."]` 决定主题：

| 路径 | data-page | 主要 client 组件 |
|---|---|---|
| `/` | home | （首页 server 组件） |
| `/news` 及子路由 | news | `news-page-client.js` |
| `/schools` 及 `/schools/[id]`、`/compare`、`/schools/score-match`、`/schools/district`、`/schools/groups` 等 | schools | `schools-page-client.js` / `schools-compare-client.js` / `score-match-client.tsx` / `groups-page-client.js` |
| `/knowledge` 与 `/knowledge/[[...slug]]` | knowledge | `knowledge-page.js` |

页面 server 组件（如 `app/schools/page.js`）通过 `loadDataStore()` 取数，透传给 client 组件做交互；多数页面 `export const revalidate = 86400`（ISR 一天）。

### 样式系统

- `styles/index.css` 依次 import `base.css` → `theme-{home,news,schools,knowledge}.css`。
- **站点设计令牌统一定义在 `base.css` `:root`**（`--site-*`、`--font-*`、`--channel-*`）；各频道 `theme-*.css` 只覆盖与默认值不同的变量，禁止重复声明整套令牌。
- 频道切换靠 `body[data-page="..."]` 选择器；`--channel-accent` 等变量按频道重定义。
- 改全局视觉先动 `base.css`；只动某一频道才动对应 `theme-*.css`。

### lib/ 与 shared/ 的边界

- `lib/`：内容解析与页面数据组织（news/policy/school/knowledge 的 markdown 解析、派生数据、工具函数），多由 `.mjs` 提供，供页面 server 端 import。
- `shared/`：API 路由、数据 schema、数据读写与服务层（CommonJS，被 API route 通过 `createRequire` 引入）。
- 注意：`app/` 下 server 文件用 ESM import，需要 `shared/` 时通过 `createRequire(import.meta.url)` 桥接 CommonJS。

## 约定

- 提交信息使用中文，遵循 `<type>(<scope>): <subject>` 风格（见 `git log`：`refactor(schools):`、`style:`、`feat(news):`、`fix(news):`）。
- 新增 API 接口走 `shared/api-router.js` 而非新建 route 文件。
- 不要在 `theme-*.css` 里复制 `:root` 全套令牌；只写差异。
- `.codex/`、`data/top100-schools.json`、`data/schools.json`、`data/news.json`、`reports/` 已 gitignore，勿提交。
- Vercel 部署：Root Directory 为仓库根，Framework Preset 选 Next.js，Build Command 用默认 `next build`。需配置 Supabase 环境变量（`KNQ_SUPABASE_URL`/`KNQ_SUPABASE_SERVICE_ROLE_KEY`/`KNQ_SUPABASE_ANON_KEY`）。
