# scripts/ 当前脚本作用分析（18 个）

> 时间：2026-07-09
> 背景：已删除 tier 列、并已将 `data/schools.json` 与线上 22 列表对齐（移除 tier/schoolTypeLabel/districtId/schoolStage/contentFile/related_schools 等非 DB 字段）。
> 本文重新梳理 `scripts/` 下剩余的 18 个脚本作用，并标注对已删字段的依赖与运行风险。

## 一、核心同步（Supabase ↔ 本地）— 生产关键

| 脚本 | 行数 | 作用 | npm 流程 | 风险 |
|------|------|------|----------|------|
| `migrate-schools-to-supabase.js` | 246 | 本地 `schools.json` + `content/schools/*.md` → Supabase `schools` 表主同步（Markdown 按 `##` 拆 section 写入） | `data:sync:supabase` | ⚠️ 读 `school.related_schools`（已从本地 JSON 删除）→ related-school 关联映射恒空，关联功能失效（无害但丢特性） |
| `sync-supabase-to-local.js` | 35 | Supabase `schools` 表 → 本地 `schools.json`（经 `rowToSchool`） | `data:sync:from-supabase` | 干净 |
| `migrate-news-to-supabase.js` | 217 | 本地 `news.json` + `content/news/*.md` → Supabase `news` 表 | — | 干净（与 schools 对称） |
| `sync-supabase-news-to-local.js` | 35 | Supabase `news` 表 → 本地 `news.json` | — | 干净（与 schools 对称） |
| `export-schools-backup.js` | 43 | 导出 Supabase `schools` 表为备份 JSON | — | 干净 |

## 二、内容生成 / Markdown 构建

| 脚本 | 行数 | 作用 | npm 流程 | 风险 |
|------|------|------|----------|------|
| `build-news-markdown.mjs` | 21 | 由 `news.json` 生成新闻 Markdown 文件 | `data:news:markdown` | 干净 |
| `build-policy-markdown.mjs` | 31 | 由 `policies.json` + `news.json` 生成政策 Markdown | `data:policies:markdown` | 干净 |
| `enrich-school-profile-signals.mjs` | 11 | 调用 `lib/school-profile-enrichment` 计算 `profileSignals` 并**直接写回** `schools.json` | `data:schools:signals` | 🔴 写回时绕过 `stripLocalSchoolFields`，会把非 DB 字段 `profileSignals` 重新写进 `data/schools.json`，破坏"与库对齐"（上一轮已清掉非 DB 字段）。运行后文件不再与库对齐 |
| `update-school-descriptions.js` | 517 | 通用批量更新学校 `description`（基于现有字段 + 百度百科数据） | — | ⚠️ 读 `school.schoolTypeLabel`（已删）→ `typeLabel` 恒为空，无害降级 |
| `generate-rich-profiles.mjs` | 335 | 按 `tier` 分档生成 rich profile 模板，输出 `lib/school-rich-profiles.generated.js` | — | 🔴 **生产退化**：产物被 `lib/school-rich-profiles.js` 运行时导入；源 `schools.json` 已无 `tier` → `school.tier` 恒 `undefined` → 全部学校落 default 档，rich profile 功能名存实亡。需改写为基于 `schoolKeyLevel`/`eliteCohort` |

## 三、校验 / 审计

| 脚本 | 行数 | 作用 | npm 流程 | 风险 |
|------|------|------|----------|------|
| `validate-data.js` | 210 | 校验本地 districts/schools/news 基础结构（district id、exam type 等） | `data:validate`（一部分） | 干净 |
| `validate-schools-data.js` | 208 | 校验 Supabase `schools` 表准确性（完整性/唯一性/格式/类型/一致性/内容） | — | ⚠️ 读 `school.tier`（已删 DB 列）→ tier 校验恒为 no-op，无害降级 |
| `audit-schools.mjs` | 273 | 全面审计本地 `schools.json` 准确性（tier 一致性、related_schools 悬空引用等） | — | 🔴 重度读 `s.tier`/`s.related_schools`（均已删）→ tier 一致性检查全失效、related 检查恒空，且会对每校报 "tier missing"，噪音极大。建议改写或退役 |
| `check-news-school-links.mjs` | 265 | 校验新闻↔学校关联链接 | `data:validate`（一部分） | 干净 |
| `check-school-enrichment.mjs` | 45 | 校验学校 Markdown 富集完整性（如 `profileDepth`） | `data:validate`（一部分） | 干净 |
| `audit-supabase-school-type-strict.js` | 167 | 只读审计 Supabase `school_property_label` 四值（公办/民办/中外合作/外籍）清洗 | — | 干净（不依赖 tier） |
| `apply-supabase-school-type-strict.js` | 49 | 按四值清洗 `school_property_label` 并同步 `is_international`（按 slug 定位） | — | 干净（不依赖 tier） |

## 四、SEO / 其他

| 脚本 | 行数 | 作用 | npm 流程 | 风险 |
|------|------|------|----------|------|
| `generate-seo.js` | 134 | 生成 sitemap / seo 文件 | `seo:build` | 干净 |

---

## 五、需处理项（按优先级）

### 🔴 高（影响生产 / 破坏对齐）
1. **`generate-rich-profiles.mjs`** — 产物被生产代码导入，但因 `tier` 已删而全部落 default 档。需改写为基于 `schoolKeyLevel`/`eliteCohort` 分档，再重跑生成 `lib/school-rich-profiles.generated.js`。
2. **`enrich-school-profile-signals.mjs`** — 运行 `npm run data:schools:signals` 会把非 DB 字段 `profileSignals` 写回 `data/schools.json`，破坏文件↔库对齐。建议：写回前调用 `stripLocalSchoolFields`，或将该脚本从 npm 流程中移除以避免误跑。

### 🟡 中（功能失效但无害降级）
3. **`migrate-schools-to-supabase.js`** — `related_schools` 关联映射失效（源字段已从 JSON 删除）。如需保留关联，应从 `schoolKeyLevel`/兄弟校派生或另建关联表。
4. **`audit-schools.mjs`** — 因读已删字段，审计结论不可信。建议改写（用 `schoolKeyLevel`/`eliteCohort` 替代 `tier`）或退役。
5. **`validate-schools-data.js`** — tier 校验段为死代码（列已删），建议移除该段避免误导。
6. **`update-school-descriptions.js`** — `schoolTypeLabel` 引用为死代码，无害，可清理。

### 🟢 干净（无需改动）
`build-news-markdown.mjs`、`build-policy-markdown.mjs`、`sync-supabase-to-local.js`、`migrate-news-to-supabase.js`、`sync-supabase-news-to-local.js`、`export-schools-backup.js`、`validate-data.js`、`check-news-school-links.mjs`、`check-school-enrichment.mjs`、`audit-supabase-school-type-strict.js`、`apply-supabase-school-type-strict.js`、`generate-seo.js` — 共 12 个。

---

## 六、结论
- 18 个脚本中 **12 个完全干净**，**6 个**仍残留对已删字段（`tier` / `schoolTypeLabel` / `related_schools`）的引用。
- 其中 **2 个有实际影响**：`generate-rich-profiles.mjs`（生产功能退化）与 `enrich-school-profile-signals.mjs`（写回破坏对齐）。
- 其余 4 个为无害降级（读 undefined → 静默 no-op 或噪音日志）。
