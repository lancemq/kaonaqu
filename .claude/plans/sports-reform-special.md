# 上海体育考试改革专题页 + 新闻频道入口

## 目标
新增一个「上海体育考试改革」专题页（路由 `/news/sports-reform`），聚合上海中考体育改革、考试安排、伤病免缓考、体育特长生/高水平运动员招生、体育特色校等相关新闻与政策；并在新闻频道页加入突出入口。

完全复用现有专题页模式（`zhongkao-special` / `gaokao-special`），不引入新组件、不复制整套令牌。

## 数据现状（已核实）
`data/news.json` 含 15 条「体育」相关新闻；`data/policies.json` 含 1 条政策。核心条目：
- `policy-2026-sports-exam-reform`（zhongkao, 2026-04-12）中考体育新规/过程性评价解读 ★专题核心
- `exam-2026-sports-timeline`（zhongkao, 2026-06-03）中考体育时间表：4 月统一考 + 日常考核
- `policy-2026-sports-injury-rules`（zhongkao, 2026-05-02）伤病免考/缓考细则
- `policy-2026-gaoshuiping-yundong`（gaokao, 2026-04-26）高水平运动员招生
- `school-2026-kongjiang-sports`（gaokao, 2026-05-24）控江中学体育特色
- `2026-tiyu-zhaosheng`（政策, 2026-03-23）高中阶段招收优秀体育学生通知

## 实施步骤

### 1. 新建 `app/news/sports-reform/page.js`
照搬 `app/news/zhongkao-special/page.js` 结构，差异如下：

- `metadata.title` = `体育考试改革专题 | 考哪去`，description 聚焦体育考试改革与体育特长生招生。
- 复用 `NewsAerialNav` / `NewsAerialHero`（传 `imageClass="is-sports"`）/ `NewsAerialFooter` / `NewsAerialKicker`。
- 复用现有 CSS 类 `news-special-aerial-*`、`news-special-annotation-grid`、`news-special-brief-grid`、`news-special-stage-grid`、`news-special-aerial-stack`、`news-special-aerial-entry`、`news-glossary-summary`、`pill`、`news-panel-link` 等，**不新增页面级样式**。
- 数据过滤逻辑：体育改革**跨中考/高考**，因此不按 `examType` 过滤，改为按关键词从 `news` + `policies` 聚合：
  ```js
  const sportsNews = news.filter(i => isCurrentYearItem(i, currentYear) && /体育/.test(`${i.title}${i.summary}`))
                         .sort(byPublishedAtDesc);
  const sportsPolicies = policies.filter(i => isCurrentYearItem(i, currentYear) && /体育/.test(`${i.title}${i.summary}${i.content||''}`))
                                 .sort(byPublishedAtDesc);
  ```
- `groupSportsNews(news)` 分组（参考现有 `groupZhongkaoNews` 写法）：
  - `reform`：`/新规|改革|过程性评价|满分/`
  - `exam`：`/时间表|统一考|日常考核|时间安排|考试/`
  - `injury`：`/伤病|免考|缓考|免修/`
  - `recruit`：`/优秀体育|高水平|招收|招生|特长/`
  - `school`：`/体育特色|篮球|田径|游泳|特色/`
- `officialFocus`：`pickItemsById` 选上面 6 条核心 id（含 1 条政策，复用 `getDetailHref` 自动分流 news/policy 链接）。
- `keyFacts`：3 条核心事实（过程性评价占比 / 统一考 + 日常考核构成 / 体育特长生招生通道）。
- `stageEntries`：4 阶段导航卡（改革解读 → 考试安排 → 伤病规则 → 招生通道），锚点 `#sports-reform` / `#sports-exam` / `#sports-injury` / `#sports-recruit`。
- `currentChecklist`：按当前月份给准备建议（参考现有 `getCurrentPhaseLabel` 季节判断写法）。
- 侧边栏 3 张 `news-special-aerial-side-card`：体育改革核心提示 + 时间链 + 跳转招生时间轴/术语页。

### 2. CSS：新增 hero 背景变体（`styles/theme-news.css`）
在第 596 行 `is-gaokao::before` 之后追加一条（仅换背景图，配色沿用现有 `::after` 遮罩）：
```css
body[data-page="news"] .news-special-aerial-hero.is-sports::before {
    background-image: url("https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600");
}
```
> 仅新增 1 条规则，不复制 `:root` 令牌，符合 CLAUDE.md 约定。

### 3. 新闻频道页加入口
**主入口（突出）**：`components/news-page-client.js` 在 `news-list-header` 之前插入一个「专题聚焦」入口卡区块，展示体育改革专题作为主卡片 + 已有中招/高招专题作为次卡片。结构：
```jsx
<section className="news-special-entry-row" aria-label="专题聚焦">
  <SectionLabel>SPECIALS</SectionLabel>
  <div className="news-special-entry-grid">
    <Link className="news-special-entry-card is-lead" href="/news/sports-reform">
      <span>体育考试改革</span>
      <strong>过程性评价 · 统一考 · 特长生招生</strong>
      <p>把上海中考体育新规、考试安排、伤病免缓考与体育特长生招生串成一条专题线。</p>
    </Link>
    <Link className="news-special-entry-card" href="/news/zhongkao-special">中招专题</Link>
    <Link className="news-special-entry-card" href="/news/gaokao-special">高招专题</Link>
  </div>
</section>
```
**侧边入口**：在 `QUICK_LINKS` 数组追加 `{ label: '体育改革', href: '/news/sports-reform' }`（RESOURCES 区第 5 项）。

### 4. 新增少量 CSS（`styles/theme-news.css`，频道页专用）
为 `.news-special-entry-row` / `.news-special-entry-grid` / `.news-special-entry-card` / `.is-lead` 加布局规则（grid 自适应、主卡片跨列、hover 与 `news-aerial-*` 卡片一致），配色复用 `--channel-accent` 等 news 频道变量。约 30 行，不重复 `:root` 令牌。

### 5. 校验
- `npm run data:validate`（未改数据，预期通过）。
- `npm run dev` 手动验证：`/news/sports-reform` 渲染、各分组有内容、锚点跳转、频道页入口卡片可见且可点。
- 不需要跑测试（无对应测试文件）。

## 不做的事
- 不新建 client 组件（专题页是 server 组件，沿用现有模式）。
- 不改 `shared/api-router.js`（专题页不涉及 API）。
- 不改数据文件、不跑 crawler。
- 不动 `base.css` 与其他频道 `theme-*.css`。
