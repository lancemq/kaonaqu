# 考哪去 MVP

一个聚焦上海中考信息的本地可运行原型，当前提供：

- 上海各区概览
- 学校列表与关键词搜索
- 招生政策摘要展示
- 从 crawler 到前端的单向数据发布链路

## 当前架构

项目已经收敛为一套最小闭环实现：

- `web/`：Node.js 原生 HTTP 服务 + 静态前端
- `data/`：页面和 API 消费的统一 JSON 数据
- `crawler/`：原始抓取、结构化处理和发布
- `shared/`：共享 schema 与归一化逻辑
- `scripts/`：基础数据校验脚本

当前版本不包含数据库、登录系统或评论系统，目标是先保证数据展示链路可运行。

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

## 可用接口

- `GET /api/districts`
- `GET /api/schools`
- `GET /api/schools?district=xuhui`
- `GET /api/policies`
- `GET /api/policies?district=pudong`
- `GET /api/search?q=复旦`

## 数据链路

```text
crawler/data/raw
  -> crawler/src/process-data.js
  -> crawler/data/processed
  -> data/
  -> web/server.js API
  -> web/script.js 前端展示
```

## 统一字段

- `district`: `id`, `name`, `description`, `schoolCount`, `policyCount`, `latestPolicyTitle`
- `school`: `id`, `name`, `districtId`, `districtName`, `schoolType`, `schoolTypeLabel`, `address`, `phone`, `website`, `admissionNotes`, `features`, `source`, `updatedAt`
- `policy`: `id`, `title`, `districtId`, `districtName`, `year`, `summary`, `content`, `source`, `publishedAt`, `updatedAt`

`source` 统一为：

- `name`
- `type`
- `url`
- `crawledAt`
- `confidence`

## 目录说明

```text
kaonaqu/
├── data/           # 前端和 API 使用的数据文件
├── shared/         # 共享 schema 和归一化逻辑
├── scripts/        # 数据校验脚本
├── web/            # MVP 服务端与静态页面
├── crawler/        # 数据采集与处理流水线
└── package.json    # 启动脚本
```

## 常用命令

- `npm run crawl`
- `npm run data:process`
- `npm run data:validate`
- `npm start`
