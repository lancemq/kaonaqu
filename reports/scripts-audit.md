# scripts/ 维护脚本梳理与清理建议

> 审计时间：2026-07-09
> 范围：scripts/ 下 49 个 .js/.mjs 脚本（不含 `__pycache__`）
> 依据：①脚本头部用途注释 ②对线上已删字段（tier 列 / school.tier / schoolTypeLabel / related_schools）的依赖 ③是否被 package.json 的 npm 流程引用 ④是否为一次性已完成迁移

## 一、结论速览

| 分类 | 数量 | 处理建议 |
|------|------|----------|
| A. 明确失效（引用已删除的 `tier` 列，运行必报错） | 6 | **已删除** |
| B. 一次性已完成迁移（已应用、冗余、不可重复产生价值） | 23 | **已删除** |
| C. 保留（核心同步 / npm 流程 / 可复用校验 / 生产依赖） | 18 | **保留** |

合计删除 **33**，保留 **18**。所有脚本原本大多未被 git 跟踪（仅 14 个受跟踪文件标记为 D），删除后可从工作树移除；受跟踪部分可从历史回退。

> 注：`scripts/` 下另有两个 `news` 表同步脚本 `migrate-news-to-supabase.js` / `sync-supabase-news-to-local.js`（与保留的 `schools` 同步脚本对称），属保留项，未在初版计数内（首次 `ls` 输出被截断漏看）。

### 第二轮删除（2026-07-09 12:15，用户指定）
用户指令额外删除 4 个（此前归入 C 组保留）：`fix-school-overviews.js`、`import-schools-to-target.js`、`sync-detail-markdown.mjs`、`enrich-school-markdown-unified.mjs`。
- 其中 `sync-detail-markdown.mjs`、`enrich-school-markdown-unified.mjs` 曾在 package.json 接为 `data:schools:markdown` / `data:schools:enrich` / `data:schools:enrich:dry`；删除脚本后已从 package.json 一并移除这 3 条 npm 脚本，避免悬空引用。
- 文档残留引用（未动，待用户确认）：`CLAUDE.md:89`、`README.md:130`、`docs/school-markdown-enrichment.md`（多处）、`docs/school-completeness-analysis.md:995` 仍指向 `enrich-school-markdown-unified.mjs`，作为「统一入口」描述；`sync-detail-markdown.mjs` 在 docs 未引用。

---

## 二、A 组：明确失效 —— 删除（6）

这些脚本直接 `SELECT tier` / `UPDATE ... SET tier` 或读取本地已删除的 `school.tier` 字段，针对当前库或当前 `data/schools.json` 运行会报错或产出无意义结果。

| 脚本 | 行数 | 失效原因 |
|------|------|----------|
| `audit-supabase-tier-type.js` | 204 | 第 49 行 `select('...tier...')`、第 27/35/80 行读 `school.tier` —— 当前库已无 tier 列，必报错 |
| `apply-supabase-tier-type-corrections.js` | 75 | 第 47 行 `patch.tier = ...`（写已删列）、第 54 行 `select('slug, tier, ...')` |
| `sync-tier-split-to-supabase.js` | 40 | tier 拆分同步，tier 概念已废除 |
| `split-tier-fields.js` | 273 | 把 tier 拆成 school_key_level+elite_cohort 的迁移脚本；tier 本地已删，重跑无意义 |
| `clean-school-tier-fields.mjs` | 107 | 清洗 tier 列；tier 已删 |
| `clean-description-tier-tag.js` | 62 | 清除 description 里的"梯队标签"块；描述已重写，无残留 |

> 注：`generate-rich-profiles.mjs` 同样重度依赖 `school.tier`，但其产物 `lib/school-rich-profiles.generated.js` **被生产代码 `lib/school-rich-profiles.js` 运行时导入**，故归入 C 组保留（待重写为用 `schoolKeyLevel`/`eliteCohort`）。

---

## 三、B 组：一次性已完成迁移 —— 删除（23）

均为历史一次性数据修复/迁移，改动已落地（904→898 条、层级/描述/去重均已固化到库与本地 JSON），重跑不会带来价值，且部分仍残留 `tier`/`related_schools` 死代码。

**层级重命名 / 升级（5）**
- `rename-youzhi-to-qiang.js` — 优质公办→强公办（已完成）
- `rename-school-key-levels.js` — 层级标签重命名（已完成）
- `upgrade-gongban-to-youzhi.js` — 公办→优质公办（已完成）
- `upgrade-minban-to-qiang.js` — 民办→强民办（已完成）
- `upgrade-top-gongban.js` — 顶级公办升级（已完成）

**描述填充 / 模板清理（7）**
- `batch-fill-all-junior-descriptions.js` — 批量补初中描述（已完成）
- `batch-fix-all-level-desc.js` — 按层级补描述（已完成）
- `batch-update-baike-descs.js` — 百度百科描述（已完成）
- `clear-template-descriptions.js` — 清空模板描述（已完成）
- `fix-elite-desc.js` — 4 所 elite 描述（一次性）
- `fix-last-template.js` — 单校模板修复（一次性）
- `fix-remaining-templates.js` — 剩余模板修复（一次性）

**去重 / 合并（7）**
- `dedupe-schools.mjs` — 综合去重（已完成）
- `merge-admission-info.js` — 合并 admission_info（已完成）
- `merge-all-duplicates.js` — 指定合并（已完成）
- `merge-lansheng-duplicate.js` — 兰生合并（已完成）
- `merge-more-duplicates.js` — 永昌等合并（已完成）
- `merge-complete-school-splits.mjs` — 完中拆分合并（已完成）
- `merge-policies-to-news.js` — 政策并入 news（已完成）

**数据准确性修复（3）**
- `fix-school-data-accuracy.mjs` — 繁简/归属综合修复（已完成）
- `fix-school-ids-and-names.mjs` — id/名称规范化（已完成）
- `fix-school-level-by-official-list.js` — 按官方名单订正层级（已完成）

**冗余同步（1）**
- `clean-local-school-type.js` — 仅回写 school_property_label+isInternational；已被更全的 `sync-supabase-to-local.js` 取代，且绕过 `stripLocalSchoolFields` 逻辑

---

## 四、C 组：保留（18）

| 脚本 | 行数 | 用途 | npm 流程 |
|------|------|------|----------|
| `migrate-schools-to-supabase.js` | 246 | 本地 JSON + Markdown → Supabase 主同步 | `data:sync:supabase` |
| `sync-supabase-to-local.js` | 35 | Supabase → 本地 JSON（保持对齐） | `data:sync:from-supabase` |
| `migrate-news-to-supabase.js` | — | 本地 news JSON + md → Supabase news 表 | —（建议补 `data:sync:news:supabase`） |
| `sync-supabase-news-to-local.js` | — | Supabase news 表 → 本地 JSON | —（建议补 `data:sync:news:from-supabase`） |
| `export-schools-backup.js` | 43 | 导出库数据为备份 JSON | — |
| `validate-data.js` | — | 校验 districts / 字段 schema | `data:validate` |
| `validate-schools-data.js` | 208 | 校验 Supabase schools 表（完整性/唯一性/格式） | —（手动） |
| `audit-supabase-school-type-strict.js` | 167 | 审计 school_property_label 四值 | —（手动） |
| `apply-supabase-school-type-strict.js` | 49 | 应用性质校正到库 | —（手动） |
| `build-news-markdown.mjs` | 21 | 生成 news Markdown | `data:news:markdown` |
| `build-policy-markdown.mjs` | 31 | 生成 policy Markdown | `data:policies:markdown` |
| `check-news-school-links.mjs` | 265 | 校验新闻-学校关联 | `data:validate` |
| `check-school-enrichment.mjs` | 45 | 校验学校内容充实度 | `data:validate` |
| `enrich-school-profile-signals.mjs` | 11 | 充实 profile 信号 | `data:schools:signals` |
| `generate-seo.js` | 134 | 生成 sitemap/seo | `seo:build` |
| `update-school-descriptions.js` | 517 | 通用描述更新器（可复用） | — |
| `audit-schools.mjs` | 273 | 综合数据准确性审计（可复用） | — |
| `generate-rich-profiles.mjs` | 335 | 生成 `school-rich-profiles.generated.js`（生产依赖） | — |

### C 组需注意的死代码（不影响运行，建议后续清理）
- `validate-schools-data.js:140/195` — 读 `school.tier`，当前恒为 undefined，对应分支永不触发（无害，可删该分支）。
- `update-school-descriptions.js:351` — 读 `schoolTypeLabel`（已删字段），仅作标签字符串，为 undefined 时回退（无害）。
- `audit-schools.mjs` 多处读 `tier`/`related_schools`，均为 undefined 时的无害降级（只读审计）。
- `generate-rich-profiles.mjs` 重度依赖 `school.tier` → **当前运行会产出错误或陈旧画像**；其产物 `school-rich-profiles.generated.js` 仍在用。如需更新画像，需改写为基于 `schoolKeyLevel`/`eliteCohort`。

---

## 五、附加小清理
- `scripts/__pycache__/`：Python 编译缓存（crawler 相关），可安全删除（会自动再生）。

---

## 六、执行记录（2026-07-09）
1. ✅ 已删除 A 组 6 个（必删，避免误执行报错）。
2. ✅ 已删除 B 组 23 个（瘦身，均为已完成一次性脚本）；另清除 `scripts/__pycache__`。
3. ✅ C 组 22 个保留；`migrate-news-to-supabase.js` / `sync-supabase-news-to-local.js` 一并保留（news 表对称同步）。
4. ⏳ 后续可清理的死代码：`validate-schools-data.js:140/195`、`update-school-descriptions.js:351`、`audit-schools.mjs` 的 `tier`/`schoolTypeLabel`/`related_schools` 死引用（均为 undefined 无害降级）；`generate-rich-profiles.mjs` 需改写为基于 `schoolKeyLevel`/`eliteCohort`（当前其产物 `lib/school-rich-profiles.generated.js` 仍被 `lib/school-rich-profiles.js` 运行时导入）。
5. 💡 建议把 news 的两个同步脚本补进 `package.json`（与 schools 对称）。
