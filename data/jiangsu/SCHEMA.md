# 字段词典（单校 `<slug>.json`）

字段与 Supabase `schools` 表逐一对齐：资料库用 **camelCase 应用层形态**，入库时 `shared/data-store.js` 的 `schoolToRow` 自动转 snake_case（如 `schoolStageLabel` → `school_stage_label`）。机器校验见 [school.schema.json](./school.schema.json)，词表常量与校验逻辑见 `scripts/lib/schema.mjs`。

## 核心字段

| 字段 | 类型 | 必填 | 合法值/说明 |
|---|---|---|---|
| `slug` | string | ✅ | 应用层 id = DB slug（UNIQUE）。格式 `${districtId}-${语义slug}`（如 `xuanwu-nanjing-fls`），只允许小写字母/数字/中文/连字符，≤80 字符，须以该市 `districts.json` 中某 districtId 开头。与 `createSchool` 的 `slugify(districtId-name)` 规则同源 |
| `name` | string | ✅ | 学校全称（按当地习惯含「市/区」前缀，如"南京市第一中学"） |
| `region` | string | ✅ | 市 slug，13 值：`nanjing/wuxi/xuzhou/changzhou/suzhou/nantong/lianyungang/huaian/yancheng/yangzhou/zhenjiang/taizhou/suqian`，等于所在目录名 |
| `districtName` | string | ✅ | 区县中文名（如"玄武区"），必须在该市 `districts.json` 的 districtCatalog 内 |
| `schoolStageLabel` | string | ✅ | **学段词表**：`初中` / `完全中学`（含初高中）/ `高中` |
| `schoolPropertyLabel` | string | ✅ | **属性词表**：`公办` / `民办` / `外籍` / `中外合作` |
| `schoolKeyLevel` | string | ✅ | **8 值层级词表**（与上海/苏州共用，决定 `keyLevelPriority` 排序权重）：`市重点(高中)` / `区重点(高中)` / `顶级公办(初中)` / `顶级民办(初中)` / `强公办(初中)` / `强民办(初中)` / `一般高中` / `一般初中` |
| `eliteCohort` | string | — | **江苏不使用**，恒为空字符串 `""`（上海才用四校/八大） |
| `group` | string | — | 教育集团（如"金陵中学"），未知留空 |
| `address` / `phone` / `website` | string | — | 联系信息；查不到留空字符串，**不臆造** |
| `foundingYear` | integer \| null | — | 创办年份（整数）或 `null`（未知） |
| `isBoarding` / `isInternational` | boolean | — | 是否寄宿 / 国际课程，默认 false |
| `image` | string | — | 学校图片 URL，可空 |
| `profileDepth` | string | — | `foundation`（基础）/ `enhanced`（增强，默认） |
| `features` | string[] | — | 特色/荣誉标签。**江苏普通高中星级写在此处**：`江苏省四星级普通高中` / `江苏省三星级普通高中` / `江苏省二星级普通高中` / `江苏省一星级普通高中`（运行时由 `lib/school-taxonomy.js:deriveSchoolStar` 派生为星级筛选维度） |
| `admissionInfo` | object | — | 统一招生信息源：`{code(招生代码), methods[], routes[], notes}` |
| `scoreLines` | array | — | 中招录取分数线序列 `[{year(YYYY 字符串), score(字符串), plan?, note?}]`；**只写有出处的年份**，年份不重复；初中阶段无统一线，留空数组 |
| `outcomeStats` | array | — | 办学成果序列 `[{year(int), exam(中考/高考), kind(综评/喜报), verified(bool), source, sourceUrl?, metrics{}, note?}]` |
| `content` | array | — | 详情页内容块，资料库阶段通常留空 |
| `infoVerified` | boolean | — | 是否已人工核实；样板数据默认 `false` |
| `source` | object | ✅(资料库) | 采集溯源 `{url, crawledAt(YYYY-MM-DD), confidence: high|medium|low}`。**非 DB 列，入库时剥离**。high=官方源，medium=权威媒体，low=单源未核实 |

## city.json 字段（对齐 shared/region-config.js 配置结构）

完整市：`slug` · `label` · `brandSuffix` · `brandSuffixFull` · `officialSourceName` · `examTotal{zhongkao, gaokao}`（南京 700/750，江苏高考全省 750）· `districtCatalog[{id, name, description}]` · `keyLevelPriority`（8 值词表 → 权重 100/95/95/80/72/70/60/40）· `seo{areaServed, titleTemplate, descriptionTemplate, keywords[]}` · `features{schools, knowledge, compare, groups, district, scoreMatch}` · `dataSource[]` · `collectionStatus` · `schoolCount{junior, senior}`。

占位市只含：`slug` · `label` · `officialSourceName` · `collectionStatus: "not_started"`。

`districts.json`：`{region, districtCatalog[]}`，id 集合必须与 `city.json.districtCatalog` 一致（校验脚本检查）。

## _index.json 清单格式

`schools/_index.json`、`schools/senior/_index.json`、`schools/junior/_index.json` 为轻量数组：

```json
[{ "slug": "xuanwu-nanjing-fls", "name": "南京外国语学校", "district": "玄武区", "stage": "完全中学", "level": "顶级公办(初中)", "property": "公办", "star": "江苏省四星级普通高中" }]
```

校验脚本要求 `_index.json` 与目录下实际文件**双向一致**（不缺不多）。`senior/` 只放 `高中/完全中学`，`junior/` 只放 `初中`。
