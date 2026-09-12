# 江苏全省初高中资料库建设方案

## 背景与决策（已与用户确认）

- 现状：项目多地区架构已就绪（`shared/region-config.js`），上海 + 苏州两个 region；苏州已入库 385 所初高中（含 2023–2026 分数线、区县、星级）。
- 学校数据权威源为 Supabase `schools` 表，字段 schema 在 `shared/data-store.js` 的 `rowToSchool`/`schoolToRow`。
- **用户决策**：
  1. 资料库形式 = **项目内 JSON 资料库**（`data/jiangsu/`，纯数据资产，不改框架代码，便于后续批量入库成为正式 region）。
  2. 本次交付范围 = **统一目录结构 + schema 规范 + 采集/入库脚本框架 + 南京（1市）样板数据**。其余 12 市搭结构占位，逐步填充。
- 江苏共 13 个地级市：南京、无锡、徐州、常州、苏州(已有/参照)、南通、连云港、淮安、盐城、扬州、镇江、泰州、宿迁。

## 关键差异：江苏 vs 上海

| 维度 | 上海 | 江苏（含苏州） |
|---|---|---|
| 精英梯队 | 四校/八大（`eliteCohort`） | **不使用**，`eliteCohort` 留空 |
| 高中评级 | 市实验性示范性/市特色普通高中 | **江苏省普通高中星级评估**（四星/三星/二星/一星），写进 `features`，由 `lib/school-taxonomy.js:deriveSchoolStar` 自动派生 |
| 中考满分 | 750 | 因市而异（苏州 740，南京 700，各市在 `city.json.examTotal` 配置） |
| 高考满分 | 660 | 750（3+1+2 新高考，全省统一） |
| `school_key_level` 8 值词表 | 共用 | 共用（市重点(高中)/区重点(高中)/顶级公办(初中)/顶级民办(初中)/强公办(初中)/强民办(初中)/一般高中/一般初中） |

## 字段对齐目标（schools 表）

资料库 JSON 用 camelCase（应用层形态），入库时 `schoolToRow` 自动转 snake_case，零转换摩擦。完整字段：

`slug`(id) · `name` · `region` · `districtName` · `schoolStageLabel`(初中/完全中学/高中) · `schoolPropertyLabel`(公办/民办/外籍/中外合作) · `schoolKeyLevel`(8值词表) · `eliteCohort`(江苏留空) · `group` · `address` · `phone` · `website` · `foundingYear` · `isBoarding` · `isInternational` · `image` · `profileDepth`(foundation/enhanced) · `features`[](含"江苏省四星级普通高中"等) · `admissionInfo`{code,methods[],routes[],notes} · `scoreLines`[{year,score,plan?,note?}] · `outcomeStats`[{year,exam,kind,verified,source,sourceUrl?,metrics{}}] · `content`[] · `infoVerified`。

新增可选 `source`{url,crawledAt,confidence} 字段（非 DB 列，入库时剥离），用于资料库溯源与质量分级。

## 目录结构

```
data/jiangsu/                          # 江苏全省初高中资料库（数据资产，非运行时数据）
├── README.md                          # 资料库总览：目录结构、字段规范索引、采集与入库流程、13市进度表
├── SCHEMA.md                          # 字段词典：每字段含义/类型/合法值/示例（含星级与8值层级词表）
├── school.schema.json                 # JSON Schema(draft-07)：机器校验单校 <slug>.json
├── cities/
│   ├── _registry.json                 # 13市注册表：slug/中文名/拼音/区县数/初高中数/采集状态/region slug
│   ├── nanjing/                       # ✅ 南京（本次样板，完整采集）
│   │   ├── city.json                  # 城市配置 = region-config 对应项（label/区目录/满分/教育局/features）
│   │   ├── districts.json             # 区县目录(id/name/description)，对齐 districtCatalog
│   │   ├── sources.md                 # 数据来源记录(教育局/招生考试院/星级评估公示 URL + 采集日期 + 置信度)
│   │   └── schools/
│   │       ├── _index.json            # 全市学校清单(轻量：slug/name/district/stage/level/property/star)
│   │       ├── senior/                # 高中 + 完全中学
│   │       │   ├── _index.json        # 高中清单
│   │       │   └── <slug>.json         # 单校完整数据(对齐 school.schema.json)
│   │       └── junior/                # 初中
│   │           ├── _index.json
│   │           └── <slug>.json
│   ├── suzhou/                        # 📌 苏州(参照标准：city.json + 从 DB 导出的 _index 作字段样板，不重采)
│   ├── wuxi/ ... suqian/              # ⬜ 其余11市占位(city.json 占位 + 空 schools/ + sources.md 模板)
└── scripts/
    ├── lib/
    │   └── schema.mjs                 # 共享：字段常量(8值层级/学段/属性/星级词表) + makeSlug + validateSchool
    ├── validate.mjs                   # 校验：node scripts/validate.mjs [city]，跑 JSON Schema + 一致性检查
    └── import-to-supabase.mjs         # 入库：node scripts/import-to-supabase.mjs nanjing [--exec]，dry-run 默认
```

## 单校 JSON 样板（南京 · 南京外国语学校示例）

```json
{
  "slug": "xuanwu-nanjing-fls",
  "name": "南京外国语学校",
  "region": "nanjing",
  "districtName": "玄武区",
  "schoolStageLabel": "完全中学",
  "schoolPropertyLabel": "公办",
  "schoolKeyLevel": "顶级公办(初中)",
  "eliteCohort": "",
  "group": "",
  "address": "南京市玄武区北京东路30号",
  "phone": "025-83612246",
  "website": "https://www.nfls.com.cn",
  "foundingYear": 1963,
  "isBoarding": false,
  "isInternational": false,
  "image": "",
  "profileDepth": "enhanced",
  "features": ["江苏省四星级普通高中", "外语特色"],
  "admissionInfo": { "code": "", "methods": ["统一招生", "指标生"], "routes": [], "notes": "" },
  "scoreLines": [
    { "year": "2024", "score": "712", "plan": "", "note": "来源：南京市中考指南" }
  ],
  "outcomeStats": [],
  "content": [],
  "infoVerified": false,
  "source": { "url": "https://jyj.nanjing.gov.cn", "crawledAt": "2026-08-11", "confidence": "high" }
}
```

## city.json 样板（南京，可直接复制进 region-config.js）

```json
{
  "slug": "nanjing",
  "label": "南京",
  "brandSuffix": "NANJING EDUCATION",
  "brandSuffixFull": "NANJING EDUCATION PLATFORM",
  "officialSourceName": "南京市教育局",
  "examTotal": { "zhongkao": 700, "gaokao": 750 },
  "districtCatalog": [
    { "id": "xuanwu", "name": "玄武区", "description": "南京中心城区，名校聚集" },
    { "id": "gulou", "name": "鼓楼区", "description": "教育强区，名校集中" }
    // …南京11区
  ],
  "keyLevelPriority": { "市重点(高中)": 100, "顶级公办(初中)": 95, /* …8值与苏州一致 */ },
  "seo": { "areaServed": "南京", "titleTemplate": "考哪去 | {label}中考高考政策与升学新闻", "descriptionTemplate": "考哪去汇集{label}中考、高考政策与升学新闻。", "keywords": ["{label}中考","{label}高考","{label}新闻","升学政策","中招","高招","{label}教育"] },
  "features": { "schools": true, "knowledge": false, "compare": false, "groups": false, "district": true, "scoreMatch": false },
  "dataSource": ["南京市教育局", "南京招生考试院", "江苏省星级高中评估公示"],
  "collectionStatus": "in_progress",
  "schoolCount": { "junior": 0, "senior": 0 }
}
```

## 采集/入库脚本框架

1. **`scripts/lib/schema.mjs`**（ESM，零依赖，可被资料库脚本与后续工具复用）
   - 导出字段常量：`STAGE_LABELS`([初中,完全中学,高中])、`PROPERTY_LABELS`([公办,民办,外籍,中外合作])、`KEY_LEVELS`(8值)、`STAR_LEVELS`([四星级,三星级,二星级,一星级])。
   - `makeSlug(region, districtId, name)`：与 `createSchool` 的 `slugify(districtId-name)` 对齐。
   - `validateSchool(obj)`：返回 issue 列表（必填校验 + 词表校验 + scoreLines.year 去重）。

2. **`scripts/validate.mjs`**：`node scripts/validate.mjs [city]`（不传 city 跑全部）
   - 用 `school.schema.json`（ajv 或手写校验）校验每个 `<slug>.json`。
   - 跨文件一致性：slug 全市唯一、districtName 在 districts.json 内、`_index.json` 与实际文件一致、scoreLines.year 不重复。
   - 输出报告：✅ 通过数 / ❌ 错误清单（文件:字段:问题）。

3. **`scripts/import-to-supabase.mjs`**：`node scripts/import-to-supabase.mjs nanjing [--exec]`
   - dry-run 默认（打印将写入的行数 + 抽样），`--exec` 才真写。
   - 读 `cities/<city>/schools/**/*.json`，剥离 `source` 字段，调 `shared/data-store.js` 的 `createSchoolInSupabase`/`updateSchoolInSupabase`（按 slug upsert，存在则 update），`region=<city>`。
   - 用 `createRequire(import.meta.url)` 桥接 CommonJS（与 app/ server 文件同模式）。

## 关键设计决策

1. **放 `data/jiangsu/`**：与项目 data 目录并列，纯数据资产，不被运行时加载（运行时只读 `data/districts.json` 等固定文件）；不污染 region-config / region-list，零框架侵入。
2. **字段逐一对齐 `schoolToRow`/`rowToSchool`**：camelCase 应用层形态，入库自动转 snake_case，未来一键入库无转换摩擦。
3. **江苏用星级不用四校八大**：`eliteCohort` 留空，星级写进 `features`（如"江苏省四星级普通高中"），由 `deriveSchoolStar` 自动派生，与苏州 385 所的口径完全一致。
4. **slug 唯一性**：`${districtId}-${nameSlug}`（与 `createSchool` 一致）；区 id 跨市语义化（南京鼓楼=`gulou`，苏州无同名区不冲突）；入库脚本 upsert 兜底 + DB UNIQUE 约束。
5. **苏州作参照不重采**：`cities/suzhou/` 只放 `city.json` + 从 DB 导出的 `_index.json` 作字段样板（实施时通过 API 或脚本导出），权威数据仍在 DB，不重复采集避免分叉。
6. **占位城市结构一致**：11 个占位市各放 `city.json`（仅 label/slug/officialSourceName 占位）+ 空 `schools/` 目录 + `sources.md` 模板，确保结构统一、可逐步填充，且 `_registry.json` 一眼看清进度。
7. **`source` 溯源字段**：每条记录带来源 URL/采集日期/置信度，便于资料库质量分级与后续校验复核；入库时剥离（非 DB 列）。

## 本次交付清单

- [ ] 目录骨架（13 市：南京完整 + 12 市占位）
- [ ] `README.md` + `SCHEMA.md` + `school.schema.json`
- [ ] `scripts/lib/schema.mjs` + `scripts/validate.mjs` + `scripts/import-to-supabase.mjs`
- [ ] 南京 `city.json`（11 区目录 + 满分 700/750 + features）+ `districts.json` + `sources.md`
- [ ] 南京 `schools/_index.json` + `senior/`、`junior/` 下 **~10–15 所样板校**（重点高中：南师附中、金陵中学、南京外国语、南京市第一中学、第二十九中学、中华中学、第十三中学、第九中学、宁海中学等；含完整字段 + 星级 + 近年分数线）
- [ ] `cities/_registry.json`（13 市注册表 + 进度）
- [ ] `scripts/validate.mjs nanjing` 跑通、零错误

## 数据源策略（南京样板实施时）

- 南京市教育局（jyj.nanjing.gov.cn）学校名录、南京市招生考试院中考指南（分数线）、江苏省教育评估院四星级普通高中评估公示（星级）。
- 实施时用 `WebFetch` 精确抓取上述公开页；查不到的字段留空 + `infoVerified=false`，不臆造。
- 全部来源记入 `sources.md`，每校 `source` 字段记录原始 URL。

## 不在本次范围（后续阶段）

- 其余 12 市实际数据采集（结构已就绪，按市逐步填）。
- 苏州数据从 DB 导出（可后续补，不影响南京样板）。
- 上线为正式 region：需改 `shared/region-config.js` 的 `REGIONS` + `shared/region-list.mjs` 的 `KNOWN_REGIONS`/`REGION_ENTRIES`，属独立阶段（苏州当时即此路径）。
