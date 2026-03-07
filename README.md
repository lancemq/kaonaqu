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
- `data/`：页面和 API 消费的统一 JSON 数据
- `crawler/`：来源抓取、数据处理与发布链路

当前版本不包含数据库、登录或后台管理，重点先保证内容展示、数据发布和部署链路稳定。

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

## 数据链路

```text
crawler/data/raw
  -> crawler/src/process-data.js
  -> crawler/data/processed
  -> data/
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
├── shared/           # 共享 schema 和归一化逻辑
├── scripts/          # 数据校验脚本
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
- 确保 `api/*` 打包时包含 `data/*.json`

如果部署后页面正常但接口报错，优先检查 `/api/districts`、`/api/schools`、`/api/news` 是否返回 200。

## 常用命令

- `npm run crawl`
- `npm run data:process`
- `npm run data:validate`
- `npm start`
