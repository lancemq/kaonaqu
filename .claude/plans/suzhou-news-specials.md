# 苏州教育新闻专题页实现计划

## 目标

为苏州地区新建 3 个教育新闻专题页，复用现有 `NewsTopicSpecialPage` 组件，用苏州本地 15 条新闻填充，并在苏州首页/新闻页加入地区化导航入口。上海保持现状不变。

## 选题（已确认 3 个）

| 专题 | 路由文件 | 苏州访问 URL | 覆盖新闻 |
|---|---|---|---|
| 苏州中考专题 | `app/news/suzhou-zhongkao/page.js` | `/suzhou/news/suzhou-zhongkao` | 录取批次全解、四市六区招生格局、六区统招分数线、指标生70%均衡、740分构成、体育中考50分（6 条） |
| 苏州升学路径专题 | `app/news/suzhou-pathways/page.js` | `/suzhou/news/suzhou-pathways` | 职教高考与中高职贯通(3+4/5+2)、国际课程与中外合作办学(UWC常熟/苏外/领科/德威)（2 条） |
| 苏州高考选考专题 | `app/news/suzhou-gaokao/page.js` | `/suzhou/news/suzhou-gaokao` | 江苏2027选考科目要求(3+1+2)、江苏2026高考录取时间轴与苏州投档线（2 条） |

## 关键架构决策

1. **路径不加入 proxy 的 `NEWS_SPECIAL_PATHS`**（`proxy.js`）：现有 6 个上海专题路径在该集合内，对 `features.schools===false` 的苏州会 308 重定向到 `/suzhou/news`。新苏州专题路径不加入 → 苏州可正常访问，proxy 无需改动。
2. **不加 `features.schools===false` redirect**：与现有上海专题页不同，苏州专题页不写 `redirect(\`/${region}/news\`)`，否则会自我挡住。
3. **复用 `NewsTopicSpecialPage`**（`components/news-topic-special-ui.js`）：沿用其 props 契约（variant/kicker/title/description/heroStats/facts/stageEntries/lead/checklist/sections/policyItems/sideLinks/sideNotes/contentId），无需新 CSS。
4. **文案 facts 针对苏州政策**：基于新闻标题与摘要提炼（740 分制、3+1+2、指标生 70% 均衡、四市六区格局、职教 3+4/5+2 等），确保与已发布数据一致，不杜撰。

## 文件改动清单

### 新建（3 个专题页 server 组件，各约 200-260 行）

参照 `app/news/sports-reform/page.js` 模式：`getRegionContext()` → `loadNewsList(region)` → 关键词分组 → 组装 props → `<NewsTopicSpecialPage .../>`。每个含 `generateMetadata`（用 `${label}` 参数化 title/description/canonical）。

- **`app/news/suzhou-zhongkao/page.js`** — 苏州中考专题
  - facts：740 分构成（语数各 130、体育 50、艺术等级不计、两考合一）、四市六区招生格局（三区可跨报）、指标生 70% 均衡到校、五批次录取顺序、先填后出分
  - sections：录取批次与志愿填报 / 四市六区招生格局 / 指标生分配 / 分数构成与计分 / 体育中考
  - 分组关键词：批次|志愿|录取|跨区|指标生|均衡|740|体育中考|统招|分数线

- **`app/news/suzhou-pathways/page.js`** — 苏州升学路径专题
  - facts：职教高考通道、中高职贯通(3+4/5+2)、国际课程高中类型(UWC/苏外/领科/德威)
  - sections：职教升学通道 / 国际课程与中外合作办学 / 多元路径对比
  - 分组关键词：职教|贯通|3+4|5+2|职教高考|国际|UWC|中外合作|课程

- **`app/news/suzhou-gaokao/page.js`** — 苏州高考选考专题
  - facts：3+1+2 模式、选考科目要求(物化双选 46.73%)、750 分制、录取时间轴
  - sections：选考科目要求 / 录取时间轴与查询 / 苏州高校投档线
  - 分组关键词：选考|科目|3+1+2|物化|录取|投档|时间轴|高考

### 修改（导航入口地区化）

- **`app/page.js`**：新增 `SUZHOU_NEWS_SPECIALS`（3 张苏州专题卡片，指向 `/news/suzhou-zhongkao` 等，用 `RegionLink`），渲染 NEWS_SPECIALS 区块时按 region 切换：
  ```js
  const specials = region === 'suzhou' ? SUZHOU_NEWS_SPECIALS : NEWS_SPECIALS;
  ```
  卡片 description 用 `{label}` 占位 + `config.label` 回填（沿用上次修复模式）。

- **`components/news-page-client.js`**：`QUICK_LINKS` 与 `SPORTS_SPECIAL` 区块按 `useRegion().region` 切换。新增 `SUZHOU_QUICK_LINKS`（3 个苏州专题）+ 苏州侧栏专题卡；苏州用苏州集，上海保持现有。`label` 已从 `useRegion()` 解构。

### 修改（sitemap 收录苏州专题）

- **`app/sitemap.js`**：新增 `SUZHOU_SPECIAL_PAGES = ['suzhou-zhongkao','suzhou-pathways','suzhou-gaokao']`，将第 115 行
  ```js
  const specialPages = features.schools ? SPECIAL_PAGES : [];
  ```
  改为按 region 取专题列表（苏州 schools=false 但新闻专题应进 sitemap）：
  ```js
  const specialPages = region === 'suzhou' ? SUZHOU_SPECIAL_PAGES : (features.schools ? SPECIAL_PAGES : []);
  ```

## 不改动

- `proxy.js`（新路径不在 `NEWS_SPECIAL_PATHS`，自动放行）
- `shared/region-config.js` / `shared/region-list.mjs`（无需新配置）
- `data/sitemap-extra.xml`（专题 URL 由 sitemap.js 代码生成，非该 xml）
- 现有上海专题页（保持原样）

## 验证

1. `curl /suzhou/news/suzhou-zhongkao`、`/suzhou-pathways`、`/suzhou-gaokao` 各返回 200，页面渲染苏州新闻条目
2. `grep "上海"` 三页 HTML 命中 0（除 RSC payload 无外泄）
3. `/suzhou` 与 `/suzhou/news` 专题卡片指向苏州专题、点击可达
4. `/shanghai` 与 `/shanghai/news` 卡片仍为上海专题、未被影响
5. `node --test tests/region-config.test.mjs` 通过
6. sitemap 含 3 个苏州专题 URL（`curl /sitemap.xml` 检查）

## 提交

按 `<type>(<scope>)` 风格，预计 2 个提交：
- `feat(news): 新增苏州中考/升学路径/高考选考 3 个专题页`
- `feat(region): 苏州首页与新闻页专题卡片入口地区化`
（不推送，待明确要求）
