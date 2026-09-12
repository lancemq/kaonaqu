# CSS 全面重构计划

## 现状
14 文件 / 7815 行。死代码占比极低（0.43%），但**重复严重**：19 类重复模式、4 频道 token 平行复制（44 条声明仅 1 套真值）、专题页三件套近乎逐字重复、`components/cards.css` 名不副实。

## 目标架构
```
styles/
  tokens.css            共享 :root token（--channel-* 无前缀，单一来源）
  base.css              基础重置 + .pill 等基础类（合并三重声明）
  components/
    channel-shell.css   通用频道骨架（page/nav/brand/nav-links/hero/hero-content/
                        hero-stats/kicker/color-bar/footer/split/side-card）— 新建
    cards.css           .card / .card-grid / .card--hoverable / .pager / .text-link — 扩充
    prose.css           .prose（markdown 渲染）— 从 news-detail 提取，新建
  channels/{home,news,schools,knowledge}.css   仅保留真差异
  pages/                                        仅保留页面专属结构
```
**原则**：通用结构 → components；频道差异 → channels（仅覆盖 token + 专属结构）；页面专属 → pages。

## 阶段 1：死代码清理（低风险，约 -40 行）
- `base.css`：删 `news-special-faq-body`、`news-glossary-process-card` 死类（:51-52，保留同块 `news-glossary-relation-card`）
- `base.css`：合并 `.pill` 三重声明（:90-102 / :163-167 / :169-175 → 一处）
- `news-special.css`：删 `news-special-aerial-hero.is-faq/is-gaokao::before` 死选择器（:36, :40，`NewsAerialHero` 从未传入这两个变体）
- `tokens.css`：删 22 个死 token（`--site-bg-*`、`--site-paper`、`--site-text-soft`、`--site-line-strong`、`--site-dark-soft`、`--site-school-accent`、`--site-blueprint`、`--site-radius-lg`、`--channel-accent-dark/soft/hero-glow` 及 4 频道覆盖、6 个遗留死别名 `--bg-strong`/`--line-strong`/`--blue-deep`/`--shadow-sm`/`--shadow-inset`/`--radius-xl`）
- `tokens.css:67`：修复 news 越权覆盖 `--site-accent`（会泄漏到 `cards.css` compare-bag）→ 改为覆盖 `--channel-accent` 或删除
- `schools.css`：解决双 token 块冲突（:1-21 `--schools-tone-*`+渐变 vs :176-191 `--schools-*`+paper `!important`）→ 确认 schools 走纯白 paper 方案，删 `--schools-tone-*` 块
- `tokens.css:75-89`：删已被覆盖的 15 行 `--schools-tone-*` 死定义

## 阶段 2：token 体系统一（中风险，-44 条声明）
- `tokens.css`：定义共享 `--channel-blue/blue-soft/ink/text/muted/line/paper/font-heading/font-body/font-caption/font-data`（无频道前缀）
- 4 频道 `:root`：删除平行重复 token，仅保留 `--channel-hero-padding` 等真差异；`body[data-page]` 只覆盖真正不同的值
- `knowledge.css`：14 处内联字体栈 → 改用 `--channel-font-*` token
- `schools-groups.css` / `schools-score-match.css` / `schools-compare.css`：内联硬编码颜色（`#0a0a0a`/`#4a9fd8`/`#1a1a1a`/`#666`/`#eef0f2`）→ 改用 `--channel-*` token

## 阶段 3：通用组件提取（中风险，-500+ 行）
- 新建 `components/channel-shell.css`：从 home/news/schools-detail/news-detail/knowledge 提取
  `.channel-page` / `.channel-nav` / `.channel-brand` / `.channel-nav-links`(+`a.is-active`)
  / `.channel-hero`(+`::before`/`::after`) / `.channel-hero-content`(+`--static` 修饰) / `.channel-hero-stats`
  / `.channel-kicker` / `.channel-color-bar` / `.channel-footer` / `.channel-split`(2 栏) / `.channel-side-card`(+`.is-dark`)
  hero 背景图 URL 用 inline style 注入（每页不同），遮罩透明度用 `--channel-hero-overlay`
- 扩充 `components/cards.css`：`.card` / `.card-grid` / `.card--hoverable` / `.pager`（news+schools 两套合并）/ `.text-link`（home 重复发明，base 已有）
  compare-bag-checkbox 保留原位或移至 `components/compare-bag.css`
- 新建 `components/prose.css`：`.prose` 从 `news-detail-markdown-*` 提取，颜色/字号走 `--channel-*`，schools 频道用 token 覆盖而非长选择器链
- home/news/schools-detail/news-detail/knowledge：替换重复类为通用类，删除被替代的重复规则
- `index.css`：更新 `@import` 顺序（tokens → base → components → channels → pages）

## 阶段 4：专题页/学校页合并（高风险，-300 行）
- `news-special.css`：`policy-tool-*` 与 `topic-special-*` 合并为通用 `.special-hero`/`.special-hero-shade`/`.special-hero-inner`/`.special-hero-panel`/`.special-content`/`.special-side-card`，三变体用 `.is-aerial`/`.is-policy`/`.is-topic` 修饰类切换图片 URL 与个别尺寸（预计删 ~300 行）
- `schools-*.css`：4 套同构 hero（schools-aerial/district-channel/school-groups/score-match/compare）合并为 `.channel-hero` + 变体背景
- `knowledge.css`：191 条全局 `.knowledge-*` 规则加 `body[data-page="knowledge"]` 前缀（用 CSS nesting 或选择器前缀），统一 scope 策略

## 执行策略
分阶段顺序执行，**每阶段独立验证 + 单独 commit**，便于回滚：
1. 阶段 1 → 验证 → commit `chore(styles): 清理死代码与冗余 token`
2. 阶段 2 → 验证 → commit `refactor(styles): 统一频道 token 体系`
3. 阶段 3 → 验证 → commit `refactor(styles): 提取通用频道骨架与卡片组件`
4. 阶段 4 → 验证 → commit `refactor(styles): 合并专题页与学校页同构结构`

## 验证（每阶段必跑）
- `npm run data:validate`
- `node --test tests/*.test.mjs`（含 home/news-special/schools 等 redesign-source 测试）
- `npm run dev` + 手动核对各频道首页与专题/详情/学校/知识页面视觉
- 全局 grep 确认无残留死类、无 token 覆盖泄漏

## 工作量与风险
- 涉及 14 文件 7815 行，预计净减 800+ 行
- 阶段 1 低风险；阶段 2-3 中风险（需逐页验视觉）；阶段 4 高风险（结构合并）
- 关键约束：不改变任何页面可见视觉，仅合并/清理底层 CSS；保留 `body[data-page]` 频道切换机制

## 不做
- 不改 JSX 结构（除非替换 className 指向新通用类）
- 不改数据/内容
- 不动 `.codex/`、`data/top100-schools.json`
