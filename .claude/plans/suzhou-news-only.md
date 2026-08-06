# 苏州地区（仅新闻频道）实现计划

## 用户决策（已确认）
- 非新闻频道（/schools/*、/knowledge/*、/compare、/groups、/district、/score-match）访问 → 308 重定向到 `/suzhou/news`
- 苏州首页 `/suzhou` → 精简（hero + 新闻动态 + 新闻专题 section，隐藏学校/知识 section）
- 苏州新闻数据 → 已有（news 表 region='suzhou' 有内容）

## 频道开关机制
`region-config.js` 的每个地区配置加 `features` 字段：
```js
features: { schools, knowledge, compare, groups, district, scoreMatch }
```
- 上海：全 `true`
- 苏州：全 `false`（news 始终可用，无需开关）

client 通过 `useRegion().features` 读，server 通过 `getRegionContext().config.features` 读。

## 改动清单（~15 文件）

### 1. 配置层
- **`shared/region-config.js`**
  - `SHANGHAI` 加 `features`（全 true）
  - 新增 `SUZHOU` 条目：`label:'苏州'`、`brandSuffix:'SUZHOU EDUCATION'`、`officialSourceName:'苏州市教育局'`、`examTotal:{zhongkao:740,gaokao:750}`、`districtCatalog`（姑苏/吴中/相城/吴江/工业园区/虎丘/昆山/常熟/张家港/太仓）、`keyLevelPriority`、`seo`、`features` 全 false
  - `REGIONS` 注册 `suzhou`
  - 导出 `getRegionFeatures(region)` helper
- **`shared/region-list.mjs`**：`KNOWN_REGIONS` + `REGION_ENTRIES` 加 `suzhou`

### 2. Context 传递
- **`components/region-context.jsx`**：Provider `value` 加 `features`
- **`app/layout.js`**：从 `config.features` 传给 Provider

### 3. 路由重定向
- **`proxy.js`**（集中拦截）：region=suzhou 且路径匹配 `/schools|/knowledge|/compare|/groups|/district|/score-match`（含子路由）→ 308 `/suzhou/news`
  - proxy 通过 createRequire 取 region-config features
- **兜底**：`app/schools/page.js`、`app/schools/[id]/page.js`、`app/schools/compare/page.js`、`app/schools/groups/page.js`、`app/schools/district/page.js`、`app/schools/district/[district]/page.js`、`app/schools/score-match/page.tsx`、`app/knowledge/[[...slug]]/page.js` 各 generateMetadata/page 组件开头检测 `config.features.{xxx}===false` → `redirect(\`/${region}/news\`)`（防 proxy 漏 + 无前缀直访）

### 4. 导航入口隐藏（6 个 client 组件）
各组件 `const { features } = useRegion()`，条件渲染：
- `components/news-aerial-ui.js`：channel-nav-links 学校/知识入口（line 18-19）+ 底部导航（line 73-74）
- `components/schools-page-client.js`：channel-nav-links + 知识入口（兜底）
- `components/schools-compare-client.js`：同上
- `components/groups-page-client.js`：同上
- `components/score-match-client.tsx`：同上
- `components/knowledge-page.js`：同上

模式：`{features.schools && <RegionLink href="/schools">学校</RegionLink>}`

### 5. 首页精简（app/page.js）
`const { config } = await getRegionContext()` 取 features：
- `home-schools-slab`（line 375）：`features.schools` false 隐藏
- `home-knowledge-districts`（line 421）：`features.knowledge` false 隐藏
- hero actions（学校/知识按钮）：条件渲染
- "继续探索上海升学路径" section（line 463）：苏州改为新闻导向或隐藏
- 新闻动态 + 新闻专题 section：保留

### 6. sitemap 苏州只 news
- **`app/sitemap.js`**：
  - `districtUrls(region)`：features.district false 返回 []
  - `knowledgeUrls(region)`：features.knowledge false 返回 []
  - `toolUrls`（score-match）：features.scoreMatch false 跳过
  - `parseExtraUrls`：苏州按 features 过滤 schools/compare/groups/district 的静态 URL

### 7. 苏州新闻页
- `app/news/page.js` + `news/[id]/page.js`：已 `.eq('region')`，自动查苏州新闻。已有数据，无需空状态。

## 新闻专题页处理（需确认）
新闻专题（`/news/gaokao-special`、`zhongkao-special`、`sports-reform`、`policy-faq`、`policy-glossary`、`admission-timeline`）内容硬编码上海政策（高考 3+3、中考体育等）。
- **默认方案**：苏州访问这些专题 → 重定向 `/suzhou/news`（内容上海专属，苏州展示会误导）
- 实现：proxy.js 拦截 `/suzhou/news/{专题}` 或各专题 page.js 检测 region
- 备选：保留展示（如用户认为专题也算新闻频道）

## 不改
- 估分引擎逻辑（苏州不展示估分，proxy 重定向）
- 上海行为（features 全 true，完全不变）

## 验证
- `npm run build`
- `/suzhou/news`（苏州新闻列表，应有苏州新闻数据）
- `/suzhou/schools`（应 308 → /suzhou/news）
- `/suzhou/knowledge`（应 308）
- `/suzhou`（精简首页，无学校/知识 section）
- `/suzhou/sitemap.xml`（只 news + news/[id] URL）
- 上海 `/shanghai/schools` 等不变

## 实现顺序
1. 配置（region-config + region-list + context + layout）
2. proxy 重定向 + 各 page 兜底
3. client 导航隐藏
4. 首页精简
5. sitemap 过滤
6. 构建 + 验证 + 提交
