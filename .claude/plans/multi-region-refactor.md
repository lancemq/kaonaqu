# 考哪去 多地区改造实施计划

## 背景与已确认决策

- 现状：全栈无"地区"抽象，"上海"是从 DB schema 到 SEO 的硬编码默认值。
- 决策1（路由/部署）：**单站 + 子路径**。`/schools`（上海，主站，URL 不变）+ `/{region}/schools`（其他地区，如 `/beijing/schools`）。
- 决策2（数据隔离）：**共享库 + region 列**。schools/news 表加 `region` 列，查询加 `.eq('region', region)`。
- 决策3（节奏）：先出详细计划，审阅后再实施。
- **SEO 关键策略**：上海不加前缀（保护已收录的 `/schools`、`/news` 等 URL 与权重），非上海地区加 `/{region}/` 前缀。region 由 Next.js middleware 注入，app/ 路由结构基本不动。

## 总体架构

```
请求 /beijing/schools
  -> middleware.js 识别 /beijing/ 前缀，rewrite 到 /schools，注入 header x-region: beijing
  -> app/schools/page.js 用 headers() 读 region='beijing'
  -> loadSchoolsList('beijing')  (.eq('region','beijing'))
  -> getRegionConfig('beijing')  (区目录/tier/满分/品牌/SEO文案)
  -> 渲染北京版页面

请求 /schools（无前缀）
  -> middleware 不注入（region 兜底 DEFAULT_REGION='shanghai'）
  -> 行为与现状完全一致
```

三块改造贯穿四层：
1. **`shared/region-config.js`**（新）：集中所有"上海专属"规则为可复制配置。
2. **`region` 维度**：DB 列 + 查询过滤 + API/页面透传。
3. **middleware 注入**：路由层 region 识别，app 结构不动。

---

## 阶段 0｜地区配置抽象层（纯重构，上海行为零变化）

**目标**：把散落在 ~15 个文件的上海硬编码收敛到 `shared/region-config.js`。本阶段不引入运行时 region 切换，只做"搬家"——所有现有值原样保留，import 改指向配置源。加回归测试确保上海行为不变。

### 新建文件
- **`shared/region-config.js`**（CommonJS，被 shared/ 与 createRequire 桥接的 app/ 引用）
  - `DEFAULT_REGION = 'shanghai'`
  - `REGIONS`：`{ shanghai: {...}, beijing: {...} }`（本阶段只填 shanghai，beijing 留空壳）
  - 上海配置项（从各文件搬入，保持原值）：
    - `districtCatalog` ← `shared/data-schema.js:5-22` DISTRICT_CATALOG（16 区）
    - `keyLevelPriority` ← `shared/data-store.js:67-76` KEY_LEVEL_PRIORITY（8 值词表）
    - `tierScoreRange` / `tierPrestige` / `tierAlias` / `internationalDefaultRange` / `maxScorePerExam` ← `lib/score-match-engine.ts:63-140`（搬成纯数据对象，引擎改为接收配置）
    - `schoolCategories` ← `lib/school-taxonomy.js:11-162` SCHOOL_CATEGORIES
    - `schoolSystems` ← `lib/school-curation.js:3-17` SCHOOL_SYSTEM_DEFINITIONS
    - `districtTopicIntros` ← `lib/school-curation.js:28-45`
    - `keyLevelSort` ← `app/schools/page.js:129-133` KEY_LEVEL_SORT（列表页排序副本，与 keyLevelPriority 对齐合并）
    - `brandSuffix`（'SHANGHAI EDUCATION'）/ `brandSuffixFull`（'SHANGHAI EDUCATION PLATFORM'）
    - `seo`：`{ titleTemplate, descriptionTemplate, keywords, areaServed }`（从 layout.js / 各页 metadata 抽模板，含 `{region}` 占位）
    - `examTotal`：`{ zhongkao: 750, gaokao: 660 }`
  - 导出 `getRegionConfig(region)`：返回该 region 配置，未知 region 抛错或兜底 shanghai
  - 导出 `getDistrictCatalog(region)` / `getDistrictNameToId(region)` 等便捷函数

### 改动文件（改 import 指向，保持值不变）
- `shared/data-schema.js`：`DISTRICT_CATALOG` 改为从 region-config 取（上海）；`DISTRICT_NAME_TO_ID`/`DISTRICT_ID_TO_NAME` 同源生成。导出签名不变，向后兼容。
- `shared/data-store.js`：`KEY_LEVEL_PRIORITY` 改为从 region-config 取。
- `lib/score-match-engine.ts`：模块级常量 `TIER_SCORE_RANGE` 等改为从注入的 regionConfig 读取（见阶段2，本阶段先保留常量但标注来源，或改为 `getRegionConfig(DEFAULT_REGION)`）。`MAX_SCORE`/`MAX_SCORE_PER_EXAM` 同理。
- `lib/school-taxonomy.js`、`lib/school-curation.js`：同上改 import。
- `app/schools/page.js`：`KEY_LEVEL_SORT` 改从 region-config 取。

### 验收
- `npm run build` 通过
- `node --test tests/*.test.mjs` 全绿（含新增 region-config 回归测试：断言 shanghai 配置与原硬编码值逐项相等）
- 上海站所有页面渲染结果与改造前一致（人工抽查首页/学校列表/估分/区域页）

### 风险
- score-match-engine.ts 是 `'use client'` TSX，不能直接 `require` CommonJS。需用 ESM import region-config 的导出（region-config 改为可被 ESM import 的形式，或提供 `.mjs` 入口）。**注意：client 组件无法读 server-only 的 region-config（含 DB 依赖），需由 server page 取好 regionConfig 后作为 prop 传入 client 组件。**

---

## 阶段 1｜数据层加 region 维度

**目标**：schools/news 表加 region 列，查询函数支持按 region 过滤。存量数据归入 shanghai。

### DB migration
- **`supabase/migrations/0NN_add_region_column.sql`**：
  ```sql
  alter table schools add column if not exists region text not null default 'shanghai';
  alter table news add column if not exists region text not null default 'shanghai';
  create index if not exists idx_schools_region_district on schools(region, district_name);
  create index if not exists idx_news_region on news(region);
  -- 存量行 region 自动为 'shanghai'（DEFAULT 生效），无需回填
  ```
- 可选：配 RLS policy 按 region 隔离（本期可不做，靠查询层过滤）

### 改动文件
- **`shared/data-store.js`**：
  - `rowToSchool`：增加 `region: row.region || 'shanghai'`
  - `rowToNews`：增加 `region: row.region || 'shanghai'`
  - `schoolToRow`/`newsToRow`：增加 `region` 字段写入（取 `school.region || DEFAULT_REGION`）
  - 所有 `load*` 函数加 `region` 参数 + `.eq('region', region)`：
    - `loadSchoolsList(region)` / `loadNewsList(region)` / `loadSchoolsMinimal(region)`
    - `loadNewsIds(region)` / `loadSchoolCountsByDistrict(region)`
    - `loadSchoolsByDistrict(districtId, region)`：先用 `getDistrictNameToId(region)` 反查区名
    - `loadSchoolsForRelated(primarySchoolId, region, limit)`：filler 查询加 region 过滤
    - `loadSchoolNamesByIds(ids)`：按 id 查无需 region（id 全局唯一）
  - `getSchoolById`/`getNewsById`：返回的行自带 region（无需过滤，slug/id 全局唯一）
- **`shared/data-schema.js`**：
  - `buildDistricts(schools, news, region)`：用 `getDistrictCatalog(region)` 代替 DISTRICT_CATALOG
- **`shared/content-service.js`**：
  - `listSchools(filters)`/`listNews(filters)`/`listDistricts(region)`/`searchSchools` 等：从 filters.region 取，透传给 data-store
  - `createSchool`/`createNews`：写入时设 `region`（取 input.region || DEFAULT_REGION）
- **`shared/api-router.js`**：
  - 从 `query.region` 提取 region，透传给 content-service 各函数（`listSchools({...query, region})` 等）

### 验收
- DB migration 在本地/线上执行成功，存量数据 region='shanghai'
- 所有页面先显式传 `DEFAULT_REGION`（行为不变）
- 新增测试：写入一条 `region='beijing'` 的学校，断言 `loadSchoolsList('shanghai')` 不含它、`loadSchoolsList('beijing')` 含它
- 上海站行为不变

### 风险
- `loadSchoolsForRelated` 的 filler 查询现 `.neq('slug', ...).limit(N)`，加 region 后 filler 也在同地区内取（正确行为，但需确认北京学校少时不报错）
- 写库脚本（`scripts/*.mjs`、`tmp/apply-spotcheck-*.cjs`）写入的学校默认归 shanghai（DEFAULT 兜底），无需改；如要写其他地区需传 region

---

## 阶段 2｜路由 region 注入（middleware + headers）

**目标**：支持 `/{region}/schools` 形态，region 通过 middleware 注入 header，页面用 `headers()` 读取。上海无前缀路径行为不变。

### 新建文件
- **`middleware.js`**（项目根）：
  ```js
  import { NextResponse } from 'next/server';
  import { REGIONS, DEFAULT_REGION } from './shared/region-config.mjs';
  // 注意：middleware 是 ESM，region-config 需提供 .mjs 入口或在 middleware 内联合法 region 列表
  const VALID = new Set(Object.keys(REGIONS));
  export function middleware(request) {
    const m = request.nextUrl.pathname.match(/^\/([a-z0-9-]+)(\/.*)?$/);
    let region = DEFAULT_REGION;
    let rewritePath = request.nextUrl.pathname;
    if (m && VALID.has(m[1]) && m[1] !== DEFAULT_REGION) {
      region = m[1];
      rewritePath = m[2] || '/';            // /beijing/schools -> /schools
    }
    const res = NextResponse.rewrite(new URL(rewritePath, request.url));
    res.headers.set('x-region', region);
    return res;
  }
  export const config = {
    matcher: ['/((?!api|_next|favicon|robots|sitemap|.*\\.).*)']  // 排除 API/静态/资源
  };
  ```
  - 关键：`/{region}/...` rewrite 为 `/...`，注入 `x-region`；无前缀或前缀=shanghai 时不 rewrite、region=shanghai。
- **`lib/region-server.js`**（ESM，server 端用）：
  ```js
  import { headers } from 'next/headers';
  import { getRegionConfig, DEFAULT_REGION } from '../shared/region-config.mjs';
  export async function getRegion() {
    const h = await headers();
    return h.get('x-region') || DEFAULT_REGION;
  }
  export async function getRegionContext() {
    const region = await getRegion();
    return { region, config: getRegionConfig(region) };
  }
  ```
- **`shared/region-config.mjs`**：ESM 入口，re-export `shared/region-config.js`（CJS）的内容，供 middleware（ESM）与 app server 组件 import。或在 region-config.js 用兼容写法。

### 改动文件
- **`components/body-page-flag.js`**：`resolvePage` 先剥离 `/{region}/` 前缀再判定频道：
  ```js
  function stripRegion(pathname) {
    const m = pathname.match(/^\/[a-z0-9-]+(\/.*)$/);
    // 仅当首段是已知 region 才剥离（需注入合法 region 列表，或简单按是否命中 /news|/schools|/knowledge 判断）
    return m ? m[1] : pathname;
  }
  ```
- **`app/layout.js`**：内联 script 的频道判定同样剥离 region 前缀。
- **API 层**：`app/api/[...slug]/route.js` 在 `handle` 内读 `request.headers.get('x-region')`（middleware 对 `/api` 默认不拦截，需把 api 加入 matcher 或 API 显式从 `query.region` 取）。**推荐：API 从 query `?region=` 取**，与页面 header 注入解耦，更简单。
- 各页面 server 组件：调用 `getRegion()` 取 region，传给 data-store 查询（`loadSchoolsList(region)`）与 region-config。

### 验收
- `/schools` 渲染上海（行为不变）
- `/beijing/schools` 渲染北京数据（需先有北京数据，可用测试数据）
- 无前缀路径不被 rewrite（`/schools` 仍命中 `app/schools/page.js`）
- 频道主题 `body[data-page]` 在 `/{region}/news` 下仍正确设为 news
- API `/api/schools?region=beijing` 返回北京学校

### 风险
- middleware rewrite 与 Next 16 的缓存/动态渲染交互：`headers()` 使页面动态化（符合现状，项目已默认动态）
- matcher 必须正确排除静态资源、`/api`、`/sitemap`、`/robots`、`/llms.txt` 等，否则静态文件被 rewrite 破坏
- region-config 被 middleware（Edge runtime）import：不能含 Node API。region-config 是纯数据，安全。但需确认 `@supabase` 等不被间接引入——middleware 只 import REGIONS 常量，不引入 supabase-client。

---

## 阶段 3｜页面与 SEO 参数化

**目标**：metadata、品牌 chrome、估分引擎 UI、对比页分数全部按 region 渲染。域名抽环境变量。

### 改动文件
- **`app/layout.js`**：
  - metadata 改 `generateMetadata`（async，读 `headers()` 取 region），title/description/keywords/openGraph 用 `regionConfig.seo` 模板填充
  - `metadataBase` 改 `new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz')`
  - AdSense ID 抽 `process.env.NEXT_PUBLIC_ADSENSE_CLIENT`（可选，默认保持现值）
- **各页 metadata**（`app/schools/page.js`、`app/news/page.js`、`app/schools/[id]/page.js`、`app/news/[id]/page.js`、`app/schools/district/*`、`app/schools/groups/page.js`、`app/schools/compare/page.js`、`app/schools/score-match/page.tsx`、`app/not-found.js`）：改 `generateMetadata`，文案/keywords/JSON-LD `areaServed` 用 region-config。
- **品牌 chrome（13+ 文件 `SHANGHAI EDUCATION`）**：
  - 收敛为 `regionConfig.brandSuffix`。因多数在 client 组件（`schools-page-client.js`、`news-aerial-ui.js` 等），由对应 server page 取好 `brandSuffix` 作 prop 传入；或新建轻量 `RegionContext`（React Context）在 layout 注入，client 组件 `useRegion()`。
  - 涉及：`app/page.js`、`app/not-found.js`、`app/news/page.js`、`app/news/[id]/page.js`、`app/schools/[id]/page.js`、`app/schools/district/page.js`、`app/schools/district/[district]/page.js`、`components/news-aerial-ui.js`、`components/schools-page-client.js`、`components/schools-compare-client.js`、`components/score-match-client.tsx`、`components/groups-page-client.js`、`components/knowledge-page.js`
- **`app/schools/score-match/page.tsx`** + **`components/score-match-client.tsx`**：
  - server page 取 `regionConfig`，将 `maxScore`、`tierScoreRange`、`tierPrestige`、`tierAlias`、`internationalDefaultRange` 作为 prop 传给 client
  - `score-match-engine.ts`：`matchSchoolsByScore(input, schools, regionConfig)` 增加第三参，内部 `TIER_SCORE_RANGE` 等改读 `regionConfig`；`MAX_SCORE` 改 `regionConfig.maxScorePerExam.zhongkao`
  - `score-match-client.tsx`：`EXAM_OPTIONS` 的 `fullMark` 动态用 regionConfig；"本平台仅覆盖上海高中信息"文案改 region-aware
- **`components/schools-compare-client.js`**：`getSyntheticScore` 的 `base=660` 与 tier 判定改读 regionConfig（高考满分/tier）。`FEATURED_KEYWORDS`（上海四校）改 region 配置。
- **`components/groups-page-client.js`**：`TIER_ORDER`/`TOP_TIER_SET`/别名改 region 配置；"上海自2014年起学区化集团化"文案改 region-aware。
- **`app/page.js`**：`FEATURED_SCHOOL_NAMES`（上海四校）、hero 文案、`keyLevelRank`、JSON-LD `areaServed` 全部 region 化。
- **域名抽取**（`NEXT_PUBLIC_SITE_URL`）：
  - `app/sitemap.js`、`app/page.js`（JSON-LD url）、`app/news/[id]/page.js`、`app/schools/[id]/page.js`、`public/robots.txt`→改 `app/robots.js` 动态生成、`public/llms.txt`、`data/sitemap-extra.xml`、`public/baidu_urls.txt`
  - `shared/api-auth.js:7` DEFAULT_ALLOW_ORIGINS 与 `.env.example`：保留 kaonaqu.xyz 为默认，新增 region 域名时按环境配置
- **`app/sitemap.js`**：按 region 生成 URL。上海用无前缀 URL，其他地区用 `/{region}/...`。考虑 sitemap index 分地区。`app/robots.js`（新建，替代静态 robots.txt）动态生成 Host/Sitemap。

### 验收
- `/schools` 与 `/beijing/schools` 的 title/keywords/品牌副标题/JSON-LD 分别正确
- 估分页在北京 region 下用北京满分/tier（需北京 regionConfig 有值）
- `NEXT_PUBLIC_SITE_URL` 未设时兜底 kaonaqu.xyz，build 不报错
- 现有 SEO（`/schools` 的 title 等）与改造前一致（上海 regionConfig 值=原值）

### 风险
- `generateMetadata` + `headers()` 使所有页面动态化（已是现状，无回归）
- 品牌 chrome 改 React Context 需确保 SSR/CSR 一致（避免 hydration mismatch，layout 已有 suppressHydrationWarning）
- score-match-engine.ts 签名变更需同步所有调用方（仅 score-match-client.tsx）

---

## 阶段 4｜内容生产（按地区，持续进行）

**目标**：为新地区生产政策、知识、学校数据内容。本阶段是内容运营工作，技术上是"按 region 加载内容目录"。

### 改动文件/结构
- **知识体系**：
  - `content/knowledge/` → `content/knowledge/{region}/`（上海迁入 `content/knowledge/shanghai/`）
  - `lib/knowledge-content.mjs`、`lib/knowledge-structured-data.mjs`、`lib/knowledge-quizzes.mjs`、`lib/knowledge-meta.mjs`、`lib/knowledge-labels.mjs`：按 region 加载对应目录与配置；`buildKeywords` 的硬编码 `'上海'` 改 region label
  - 上海独有专题（zhongkao-zhenti/kuaxueke-anli/tiyu-zhongkao/xuanke-zhidao）按 region 增删；`science` 学科按 region 配置
- **政策专题页**（整页上海化，需为每地区重写内容）：
  - `app/news/zhongkao-special/page.js`、`gaokao-special/page.js`、`admission-timeline/page.js`（+`lib/admission-timeline.js`）、`policy-glossary/page.js`（+`lib/policy-glossary.js`）、`policy-faq/page.js`、`sports-reform/page.js`
  - 改造方式：内容抽到 `content/policy/{region}/` 数据文件，页面按 region 加载；或 region 未配置时隐藏该专题入口
- **学校富集档案**：`lib/school-rich-profiles.js` + `lib/school-rich-profiles.generated.js`（生成）按 region 分库；`scripts/generate-rich-profiles.mjs` 支持 region 参数
- **`lib/policy-detail.js`**：`POLICY_NEWS_DETAIL_MAP` 的政策 ID 按 region 隔离
- **`lib/school-data-quality.js`**：占位网站域名校验（`*.edu.sh.cn`）按 region 配置
- **数据入库**：各地区学校/新闻数据按 region 写入 DB（写库脚本加 region 参数）

### 验收
- 上海知识体系页面内容与改造前一致（迁目录后路径不变）
- 北京 region 有内容时 `/beijing/knowledge/...` 可渲染；无内容时优雅降级或隐藏
- 各政策专题页在北京 region 下显示北京政策（需北京内容已生产）

### 风险
- 内容生产是真正瓶颈，无法纯技术解决；需本地化运营
- 知识 JSON 迁目录会影响 `contentFile` 路径引用（`rowToSchool` 的 `content/schools/${slug}.md`），需同步

---

## 不在本次范围 / 待确认

- **是否对非上海地区也做 SEO 规范化重定向**：如 `/beijing` 是否 301 到 `/beijing/schools`。建议在 next.config redirects 加，本期可不做。
- **RLS 行级安全**：本期靠查询层 `.eq('region')` 过滤，不做 DB 层 RLS。如需更强隔离后续补。
- **多地区分析/AdSense 分账号**：`@vercel/analytics` 共享当前项目；AdSense 若分账号需 `NEXT_PUBLIC_ADSENSE_CLIENT`，本期保持共享。
- **国际化（非中文地区）**：`<html lang>`、locale 等本期不动，仅中文地区。
- **`baidu_urls.txt` / `sitemap-extra.xml`**：这些是手工/脚本生成的静态推送文件，改造后需重新生成脚本支持 region，属运维工作。

## 工作量估算

| 阶段 | 内容 | 估时 | 性质 |
|---|---|---|---|
| 0 | region-config 抽象 + 回归测试 | 1-2 天 | 纯重构 |
| 1 | DB migration + data-store/content-service/api region 透传 | 2-3 天 | 数据层 |
| 2 | middleware + headers 注入 + 频道判定 | 1-2 天 | 路由层 |
| 3 | metadata/品牌/估分/对比/域名参数化 | 3-5 天 | 页面层 |
| 4 | 内容生产（每地区） | 持续 | 内容运营 |
| **技术合计（0-3）** | | **~2 周** | |
| **每新增地区内容** | | **1-2 周起** | 取决于内容深度 |

## 推荐推进顺序

1. **先做阶段 0**（低风险、高 ROI，验证抽象层设计）
2. **阶段 1**（DB + 查询，上海行为不变即可上线）
3. **阶段 2**（middleware，先只支持上海，验证 rewrite 不破坏现有路由）
4. **阶段 3**（页面参数化，逐页推进，每页可独立验收）
5. **阶段 4**（选定第一个试点地区如北京，同步配置 regionConfig + 生产内容）

每个阶段独立可上线、可回滚。阶段 0-3 完成后，新增地区只需：填 regionConfig + 入库数据 + 生产内容，无需再改代码框架。

---

## 实施进展（截至 2026-08-03）

### 决策变更：上海也带 `/shanghai/` 前缀
原决策1/3 为"上海不加前缀（保护 SEO）"。2026-08-03 用户改为**上海也带 `/shanghai/` 前缀**，理由：统一前缀策略简化心智模型，避免上海/非上海两套 URL 规则。旧无前缀 URL（`/`、`/schools`、`/news/xxx`）经 middleware **308 永久重定向**到 `/shanghai/...`，SEO 权重传递。

### 阶段 0-2 已完成
- `shared/region-config.js`（CJS）+ `shared/region-list.mjs`（ESM 纯数据）+ `lib/region-server.mjs`（`getRegionContext`）
- `shared/data-store.js` / `content-service.js` / `api-router.js` 支持 region 透传（`.eq('region')`）
- `middleware.js`：`/{region}/...` rewrite 到 `/...` + 注入 `x-region` header；无前缀路径 308 重定向到 `/shanghai/...`
- `components/region-context.jsx`：`RegionProvider`（server layout 注入）+ `useRegion()` hook（client 兜底上海）
- `components/body-page-flag.js`：`resolvePage` 剥离 region 前缀再判频道

### 阶段 3 已完成
- **品牌 chrome 参数化**（13 文件）：server 用 `getRegionContext`，client 用 `useRegion()`（`brandSuffix`/`brandSuffixFull`/`label`/`examTotal`）
- **估分引擎**：`examTotal` 注入 Context，`score-match-engine.ts` `matchSchoolsByScore(input, schools, maxScore)` 第三参，client 用 `examMaxScore`
- **区域选择器**：`components/region-selector.jsx`，导航右上角，当前仅上海可选（"更多地区即将上线"提示）；`select` 用 `regionPath(base, value)` 统一加前缀
- **URL 统一前缀**：
  - `shared/region-path.mjs`：`regionPath(path, region)` 纯 ESM 辅助
  - `components/region-link.jsx`：客户端 `Link` 封装，自动加前缀
  - `middleware.js`：无前缀路径 308 -> `/shanghai/...`
  - `app/sitemap.js`：knowledge/news/extra URL 全加 `/shanghai/`（`BASE_WITH_REGION`），1255 URL 全带前缀
  - 全站 `<Link>` -> `<RegionLink>`（19 文件，约 160 处）+ `router.push` 包 `regionPath`（5 处：schools-page-client / schools-compare-client ×3 / news-page-client）
  - 验证：`/` -> 308 `/shanghai`，`/schools` -> 308 `/shanghai/schools`，`/shanghai/*` -> 200，页面内链接全带前缀，sitemap 无无前缀 URL

### 已修复 bug（阶段 3 途中）
- news 详情 500（`/news/2026-waishengshi-luqu-youhui-0803`）：`NewsDetailNav`/`NewsDetailFooter` 等独立子组件引用了仅在外层默认导出函数定义的 `config`；改为 `async` + 内部 `const { config } = await getRegionContext()`。同理修 `app/schools/district/page.js` 与 `district/[district]/page.js` 的 `SiteNav`/`Footer`
- 学校详情页高考办学成果表格数据未居中：`styles/pages/schools-detail.css` 的 `.outcome-head span`/`.outcome-row strong|b|span` 改 `text-align: center` / `justify-content: center`

### 阶段 3 剩余事项进展（2026-08-03 续）
- ✅ 各页 `generateMetadata` 按 region 填 title/description/keywords（13 个静态 metadata 页改 `generateMetadata`，"上海"->`${label}`；页面转动态渲染符合多地区方向）
- ✅ 域名抽 `NEXT_PUBLIC_SITE_URL`（app/sitemap.js、page.js、news/[id]/page.js、schools/[id]/page.js 的 JSON-LD；layout.js 已先抽）
- ✅ `app/robots.js` 动态生成（Host/Sitemap 跟随环境变量），`git rm public/robots.txt`
- ✅ `middleware.js` -> `proxy.js` 迁移（Next 16 重命名，弃用警告消除，构建识别为 `ƒ Proxy`）
- ✅ JSON-LD `@id`/页面 url/SearchAction target/canonical 加 `/shanghai/` 前缀（news/[id]、schools/[id]、page.js、layout.js）；publisher/Organization `url: SITE_URL` 根保持
- ✅ `app/sitemap.js` 改 ESM（`export default` + `createRequire` 桥接 data-store），消除 Turbopack `export *` 警告
- ✅ `public/llms.txt` URL 加 `/shanghai/` 前缀
- ⏳ sitemap 按 region 分地区生成（当前只上海一套，等新地区）
- ⏳ `public/baidu_urls.txt` 重新生成支持 region（1228 行，运维脚本工作；当前百度爬无前缀 URL 经 308 到 `/shanghai/`，不影响收录）
- ✅ `data/sitemap-extra.xml`：sitemap.js 运行时加前缀（`parseExtraUrls` 的 `loc.replace`），文件本身不改

### 数据库变更：原表加 region 列（决策变更 2026-08-03）
**放弃影子表策略，沿用原表 schools/news。** 执行 `supabase/migrations/017_add_region_to_schools_news.sql`：直接 `ALTER TABLE schools/news ADD COLUMN region TEXT NOT NULL DEFAULT 'shanghai'` + region 索引。存量数据自动归入上海，原表结构其余部分不变，RLS 不变。

**原决策**（影子表 school_new/news_new，016 migration）已废弃：影子表需拷贝数据、配表名环境变量、crawler 同步写入目标、回滚需代码与 DB 同步退，复杂度高。016 文件保留作历史记录，若已执行产生的 school_new/news_new 可后续 `DROP TABLE` 清理。

**上线要点**：线上 Supabase 执行 017 后，Vercel 无需配 `SUPABASE_SCHOOLS_TABLE`/`SUPABASE_NEWS_TABLE`（代码默认查 schools/news）。本地 `.env.local` 若之前配了指向影子表，需注释/删除这两行改回默认。
