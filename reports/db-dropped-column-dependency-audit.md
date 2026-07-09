# 数据库已删除字段依赖审计报告

> 审计时间：2026-07-09
> 方法：pg 直连线上库 introspect `public.schools` 实际列 → 与全仓代码引用对比（同"删 tier 列"时的逻辑）
> 直连方式：`POSTGRES_URL_NON_POOLING`（5432，非池化），`ssl:{rejectUnauthorized:false}`，手动解析连接串避开 sslmode=verify-full

## 一、线上库当前 schema（22 列）

```
id, slug, name, district_name, school_stage_label, school_property_label,
school_key_level, elite_cohort, "group", address, phone, website,
founding_year, is_boarding, is_international, image, description,
achievements, admission_notes, profile_depth, features, admission_info
```

**已删除（不在以上 22 列中）的字段：** `tier`、`school_stage`（裸列，已用 `school_stage_label` 推断）、`school_type_label`（从未作为 DB 列存在）、`related_schools`（从未作为 DB 列存在）。

## 二、结论：运行时/应用代码 —— 干净，无已删除列依赖

| 文件 | 现状 |
|------|------|
| `shared/data-store.js` (`rowToSchool`) | 仅映射 22 列；`school_stage` 已用 `inferSchoolStage(school_stage_label)` 推断；无 `tier`/`school_type_label`/`related_schools` |
| `lib/school-taxonomy.js` (`inferSchoolCategory`) | 仅用 `eliteCohort`/`schoolKeyLevel`/`schoolPropertyLabel`/`schoolStage`/`isInternational`；含注释"tier 列已从数据库删除" |
| `components/groups-page-client.js` | 实际读取 `school.eliteCohort \|\| school.schoolKeyLevel`；`getTierRank()` 只接收合法的层级标签排序，从不接收 `school.tier` |
| `components/schools-compare-client.js` | `tier:` 展示列值 = `school.eliteCohort \|\| school.schoolKeyLevel`（合法列派生），仅 `key:'tier'` 为显示标签键 |
| `components/score-match-client.tsx` | 读取 `school.eliteCohort \|\| school.schoolKeyLevel` |
| `scripts/migrate-schools-to-supabase.js` (`schoolToRow`) | 插入行只含合法列；读本地 `related_schools` 仅做 id→slug 映射，不写库 |
| `scripts/audit-supabase-school-type-strict.js` | `select` 列清单不含 `tier`/`school_type_label` |
| `scripts/clean-local-school-type.js` | `select` 列清单不含 `tier` |

✅ **线上库读取主链路（`data-store` + 组件 + lib）不依赖任何已删除列。**

## 三、遗留维护脚本 —— 若针对当前库运行会报错（引用已删除的 `tier` 列）

1. `scripts/apply-supabase-tier-type-corrections.js`
   - 第 47 行：`patch.tier = ch.proposed_tier`（写入不存在的列）
   - 第 54 行：`.select('slug, tier, school_property_label')`（select 不存在的列，Supabase 会报错）
   - 属于 tier 时代的一次性纠错脚本，tier 拆分后已无意义。

2. `scripts/audit-supabase-tier-type.js`
   - 第 49 行：`cols` 含 `tier`；第 27/35/80 行读 `school.tier`（来自 tier 时代本地源）
   - 针对当前库运行会因 `tier` 列不存在而报 `Could not find the 'tier' column`。

> 这两处是 tier 拆分前的历史脚本，运行时已不会进入主流程；但代码层面确实仍"依赖"已删除列，执行即失败。

## 四、仅依赖本地数据、非 DB 依赖（提示性，不阻塞运行）

以下文件读 `school.tier` / `schoolTypeLabel` / `related_schools`，但来源是**本地 `data/schools.json`**（该文件仍残留 `tier` 字段，见 `data/schools.json:55460 "tier": ""`），并非从线上库读取：

- `scripts/split-tier-fields.js`、`scripts/validate-schools-data.js`、`scripts/generate-rich-profiles.mjs`、`scripts/audit-schools.mjs`、`scripts/dedupe-schools.mjs`、`scripts/clean-school-tier-fields.mjs`、`scripts/fix-school-data-accuracy.mjs`、`scripts/merge-complete-school-splits.mjs`、`scripts/merge-admission-info.js`
- `lib/school-profile-enrichment.mjs`（读/写本地 `related_schools`）
- `shared/data-schema.js`（`raw.tier` / `raw.schoolTypeLabel` 兜底，来自本地原始源）

这些不影响线上运行，但本地数据仍携带废弃 `tier`/`related_schools`/`schoolTypeLabel` 字段，属"语义残留"。

## 五、建议

1. （可选）删除/归档第三节两个 tier 时代脚本，避免误执行报错。
2. （可选）清理本地 `data/schools.json` 中的废弃 `tier`/`related_schools`/`schoolTypeLabel` 字段（第四节脚本相应适配或停止读取）。
3. 运行时代码无需改动 —— 已确认安全。

## 六、已执行：data/schools.json 与线上库对齐（2026-07-09）

用户指令：本地文件与线上库对齐，DB 表不存在的字段本地也删除。

- 删除的非 DB 字段：`tier`、`schoolTypeLabel`（废弃数据，各 1 条）、`districtId`/`schoolStage`/`contentFile`（运行时派生字段）。
- 结果：898 条记录不变，每条仅保留 24 个 DB 对应字段（22 列 camelCase + admission_info 拆出的 admissionCode/Methods/Routes）；共移除 2695 个键实例。
- 备份：`data/backups/schools-before-align-2026-07-09T11-55-56.json`。
- 代码（`shared/data-store.js`）：新增 `LOCAL_SCHOOL_DB_FIELDS` 保留集；`deriveLocalSchoolFields` 在 `loadLocalData` 时补回派生字段（保持本地回退可用）；`stripLocalSchoolFields` 在 `saveDataStore` 写回前剥离非 DB 字段（文件持续对齐）。
- **待办（未做）**：仓库内约 20 个 `scripts/*.mjs`/`*.js` 直接用 `fs.writeFileSync` 写 `data/schools.json`，可能绕过剥离重新引入非 DB 字段；如需彻底杜绝，应让这些脚本统一调用 `stripLocalSchoolFields`（其中 `sync-supabase-to-local.js` 从线上库写回，反而保持对齐）。
