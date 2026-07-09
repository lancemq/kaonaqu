# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

考哪去（kaonaqu）是面向上海学生和家长的升学信息站，聚合上海中考/高考新闻政策、学校信息、区域专题和初高中知识体系。基于 Next.js App Router（Next 16, React 19），数据默认读自仓库本地文件，可由 Vercel Cron 触发 crawler 流水线刷新。

## 常用命令

```bash
npm install
npm run dev              # 本地开发，http://localhost:3000
npm run build            # 生产构建
npm start                # 启动 Next 生产服务
npm run data:validate    # 校验新闻、学校和基础数据（改完数据必跑）

# 测试（node:test，无额外测试框架）
node --test tests/*.test.mjs                  # 跑全部测试
node --test tests/knowledge-content.test.mjs  # 跑单个测试文件

# 内容与数据维护
npm run seo:build                       # 生成 sitemap.xml 与 baidu_urls.txt
npm run data:news:markdown              # 从新闻数据生成 Markdown
npm run data:policies:markdown          # 从政策数据生成 Markdown
npm run data:schools:markdown           # 同步学校详情 Markdown
npm run data:schools:enrich:dry         # 预演学校详情补全（--limit 20）
npm run data:schools:enrich             # 正式执行学校详情补全
npm run data:sync:supabase              # 同步本地数据到 Supabase（可选）

# 采集流水线
npm run crawl                           # crawler 主流程
npm run crawl:news / crawl:policies / crawl:schools / crawl:websites / crawl:social
npm run crawl:school-enrich             # 学校字段补全抓取
npm run data:process                    # 处理 raw -> processed
```

TypeScript 为可选（`strict: false`，`allowJs: true`）；仅 `score-match-engine.ts`、`simulator-engine.ts`、`schools-simulator-client.tsx`、`score-match-client.tsx` 等少数文件用 TS。无 lint 脚本。

## 架构要点

### 数据流：本地文件优先

```
content/*.md + data/*.json  ->  lib/* 与 shared/*  ->  app/* 页面 / app/api/*
                                                    ->  crawler/src/* -> data/
```

- 学校数据权威源是线上数据库 `schools` 表；`data/schools.json` 是运行时由数据库生成的缓存文件（已 gitignore，从仓库移除），每次读取数据库时自动刷新并与线上对齐。其余 `data/*.json`（`districts.json`/`news.json`/`policies.json`/`knowledge-pages.json`）为提交的运行数据。
- `content/` 存放 Markdown 长文（news / schools / policies 详情、knowledge 结构化 JSON）。
- `shared/data-store.js` 通过 `KAONAQU_RUNTIME_ROOT_DATA_DIR` 环境变量定位数据目录；找不到本地文件时回退到 `require('../data/*.json')` 的打包快照（用于 serverless）。
- 写入用 `writeLocalJson`（2 空格 JSON + 尾换行）；记录合并走 `mergeRecords` / `pickPreferredRecord`，按 `updatedAt` 时间 + 字段完整度择优。

### API 层：单一 catch-all 入口

- 所有 REST 接口走 `app/api/[...slug]/route.js`，转给 `shared/api-router.js` 的 `handleApiRequest({ method, pathname, query, body })`。
- 业务逻辑在 `shared/content-service.js`（CRUD + 搜索 + 归一化），schema 与归一化在 `shared/data-schema.js`。
- 新增接口：在 `api-router.js` 加 `pathname` 分支即可，无需新建 route 文件。
- `app/api/cron-refresh/route.js` 是 Vercel Cron（每天 17:00 UTC）入口，需 `Authorization: Bearer $CRON_SECRET`；它在 `/tmp` 下建临时目录跑 crawler 并 `mergeDataStore` 替换本地数据。

### 页面与频道

四个顶级频道，由 `components/body-page-flag.js` 设置 `body[data-page="..."]` 决定主题：

| 路径 | data-page | 主要 client 组件 |
|---|---|---|
| `/` | home | （首页 server 组件） |
| `/news` 及子路由 | news | `news-page-client.js` |
| `/schools` 及 `/schools/[id]`、`/compare`、`/score-match`、`/simulator`、`/groups` 等 | schools | `schools-page-client.js` / `schools-compare-client.js` / `score-match-client.tsx` / `schools-simulator-client.tsx` / `groups-page-client.js` |
| `/knowledge` 与 `/knowledge/[[...slug]]` | knowledge | `knowledge-page.js` |

页面 server 组件（如 `app/schools/page.js`）通过 `loadDataStore()` 取数，透传给 client 组件做交互；多数页面 `export const revalidate = 86400`（ISR 一天）。

### 样式系统

- `styles/index.css` 依次 import `base.css` → `theme-{home,news,schools,knowledge}.css`。
- **站点设计令牌统一定义在 `base.css` `:root`**（`--site-*`、`--font-*`、`--channel-*`）；各频道 `theme-*.css` 只覆盖与默认值不同的变量，禁止重复声明整套令牌。
- 频道切换靠 `body[data-page="..."]` 选择器；`--channel-accent` 等变量按频道重定义。
- 改全局视觉先动 `base.css`；只动某一频道才动对应 `theme-*.css`。

### lib/ 与 shared/ 的边界

- `lib/`：内容解析与页面数据组织（news/policy/school/knowledge 的 markdown 解析、派生数据、工具函数），多由 `.mjs` 提供，供页面 server 端 import。
- `shared/`：API 路由、数据 schema、数据读写与服务层（CommonJS，被 API route 与 cron 通过 `createRequire` 引入）。
- 注意：`app/` 下 server 文件用 ESM import，需要 `shared/` 时通过 `createRequire(import.meta.url)` 桥接 CommonJS。

### 学校详情补全流程

统一入口 `scripts/enrich-school-markdown-unified.mjs`，流程：先 `data:schools:enrich:dry` 预演 → `data:schools:enrich` 正式补全 → `data:validate` 校验。详见 `docs/school-markdown-enrichment.md`。

## 约定

- 提交信息使用中文，遵循 `<type>(<scope>): <subject>` 风格（见 `git log`：`refactor(schools):`、`style:`、`feat(news):`、`fix(news):`）。
- 改动数据或内容后跑 `npm run data:validate`。
- 新增 API 接口走 `shared/api-router.js` 而非新建 route 文件。
- 不要在 `theme-*.css` 里复制 `:root` 全套令牌；只写差异。
- `.codex/` 与 `data/top100-schools.json` 已 gitignore，勿提交。
- Vercel 部署：Root Directory 为仓库根，Framework Preset 选 Next.js，Build Command 用默认 `next build`。Cron 需要 `CRON_SECRET`；恢复 Supabase/Blob 同步时再配相应变量。
