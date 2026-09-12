# 江苏全省初高中资料库

`data/jiangsu/` 是江苏 13 个地级市初高中学校的**项目内 JSON 资料库**：纯数据资产，不在运行时加载路径上；字段与 Supabase `schools` 表逐一对齐（camelCase 应用层形态，入库时 `shared/data-store.js` 的 `schoolToRow` 自动转 snake_case），便于后续批量入库成为正式 region。

- 字段词典：[SCHEMA.md](./SCHEMA.md)
- 机器校验 Schema：[school.schema.json](./school.schema.json)（JSON Schema draft-07）
- 方案文档：`.claude/plans/jiangsu-schools-repo.md`

## 目录结构

```
data/jiangsu/
├── README.md / SCHEMA.md / school.schema.json
├── cities/
│   ├── _registry.json              # 13 市注册表（进度一览）
│   └── <city>/                     # 每市一目录（slug 命名）
│       ├── city.json               # 城市配置（对齐 shared/region-config.js 结构）
│       ├── districts.json          # 区县目录（对齐 districtCatalog）
│       ├── sources.md              # 数据来源记录（URL + 日期 + 置信度）
│       └── schools/
│           ├── _index.json         # 全市学校清单（轻量）
│           ├── senior/_index.json  # 高中 + 完全中学清单
│           ├── senior/<slug>.json  # 单校完整数据
│           ├── junior/_index.json  # 初中清单
│           └── junior/<slug>.json
└── scripts/
    ├── lib/schema.mjs              # 字段常量 + makeSlug + validateSchool（零依赖）
    ├── validate.mjs                # 校验单市或全部
    └── import-to-supabase.mjs      # 入库（dry-run 默认，--exec 才写库）
```

## 13 市进度表

| 市 | slug | 状态 | 高中数 | 初中数 | 说明 |
|---|------|------|--------|--------|------|
| 南京 | `nanjing` | ✅ complete | 11 | 3 | 样板市，含 2024/2025 中招投档线 |
| 苏州 | `suzhou` | 📌 reference | — | — | 385 所已全量入库 DB（2026-08-06），本地不重采 |
| 无锡 | `wuxi` | ⬜ not_started | 0 | 0 | 占位 |
| 徐州 | `xuzhou` | ⬜ not_started | 0 | 0 | 占位 |
| 常州 | `changzhou` | ⬜ not_started | 0 | 0 | 占位 |
| 南通 | `nantong` | ⬜ not_started | 0 | 0 | 占位 |
| 连云港 | `lianyungang` | ⬜ not_started | 0 | 0 | 占位 |
| 淮安 | `huaian` | ⬜ not_started | 0 | 0 | 占位 |
| 盐城 | `yancheng` | ⬜ not_started | 0 | 0 | 占位 |
| 扬州 | `yangzhou` | ⬜ not_started | 0 | 0 | 占位 |
| 镇江 | `zhenjiang` | ⬜ not_started | 0 | 0 | 占位 |
| 泰州 | `taizhou` | ⬜ not_started | 0 | 0 | 占位 |
| 宿迁 | `suqian` | ⬜ not_started | 0 | 0 | 占位 |

状态值：`not_started`（占位）→ `in_progress`（采集中）→ `complete`（完成）；`reference` = 权威数据在 DB、本地仅存配置参照。

## 江苏与上海的关键差异

| 维度 | 上海 | 江苏 |
|---|---|---|
| 精英梯队 | 四校/八大（`eliteCohort`） | **不使用**，`eliteCohort` 留空字符串 |
| 高中评级 | 市实验性示范性/市特色普通高中 | **江苏省普通高中星级评估**（四星/三星/二星/一星），写进 `features`（如"江苏省四星级普通高中"） |
| 中考满分 | 750 | 因市而异（南京 700、苏州 740），见各市 `city.json.examTotal` |
| 高考满分 | 660 | 750（3+1+2 新高考，全省统一） |
| `schoolKeyLevel` 8 值词表 | 共用 | 共用 |

## 采集规则（硬约束）

1. **不臆造**：查得到的写；查不到的字段留空字符串/空数组、`foundingYear` 留 `null`，并置 `infoVerified=false`。分数线、地址、电话尤其如此。
2. **scoreLines 只写有出处的年份**，年份不重复，口径写进 `note`（如校区、提前批口径）。
3. 每校必填 `source: {url, crawledAt(YYYY-MM-DD), confidence: high|medium|low}`；所有来源记入该市 `sources.md`。
4. 优先级：市教育局 / 招生考试院（high）> 权威媒体（medium）> 单源自媒体（low）。
5. 学段词表：`初中 / 完全中学 / 高中`；属性词表：`公办 / 民办 / 外籍 / 中外合作`。
6. slug 格式：`${districtId}-${语义slug}`（如 `xuanwu-nanjing-fls`），须以该市 `districts.json` 中某个 districtId 开头。

## 校验与入库

```bash
cd data/jiangsu
node scripts/validate.mjs nanjing   # 校验南京
node scripts/validate.mjs           # 校验全部 13 市（占位市只查结构）
VERBOSE=1 node scripts/validate.mjs nanjing  # 显示 infoVerified=false 等提示

node scripts/import-to-supabase.mjs nanjing          # dry-run（默认，只打印）
node scripts/import-to-supabase.mjs nanjing --exec   # 真写库（按 slug upsert，需 Supabase 环境变量）
```

入库脚本经 `createRequire` 桥接 CommonJS 的 `shared/data-store.js`：先 `updateSchoolInSupabase`（不存在则 `createSchoolInSupabase`），`source` 溯源字段在写入前剥离（非 DB 列）。

## 后续阶段（不在本资料库范围）

- 其余 12 市实际数据采集（结构已就绪，按市逐步填）。
- 苏州 `_index.json` 从 DB 导出作字段样板。
- 上线为正式 region：改 `shared/region-config.js` 的 `REGIONS` + `shared/region-list.mjs` 的 `KNOWN_REGIONS`/`REGION_ENTRIES`（苏州当时即此路径）。
