# school_type_label 字段全校统一

> 目标：把所有「学校类型/办学性质」相关引用统一到数据库的 `school_type_label` 字段，消除孤儿代码字段 `schoolType`。

## 改动前的问题
- 本地 `data/schools.json` 每条记录同时带 `schoolType`（码：`public/private/international/municipal_key/...`）和 `schoolTypeLabel`（label：`公办/民办/...`）。
- `shared/data-schema.js` 用 `SCHOOL_TYPE_MAP`/`normalizeSchoolType` 把**梯队类标签**（市重点/区重点/普通）映射成码塞进 `schoolType` —— 字段名与内容双重错配。
- `schoolType` 码在 live DB **根本没有对应列**（`school_type` 列在 003 target schema 中已被省略，`data-store.rowToSchool` 也只映射 `schoolTypeLabel`）。
- `app/schools/district/*` 用 `school.schoolType === 'public'/'private'` 做公办/民办计数，但 `normalizeSchoolType('public')` 会归一成 `'unknown'`，且 DB 源对象没有 `schoolType` → **区级「公办/民办记录」计数长期为 0**（bug，本次顺带修复）。

## 改动清单
| 文件 | 改动 |
|---|---|
| `shared/data-schema.js` | 删除 `SCHOOL_TYPE_MAP`/`normalizeSchoolType` 及归一化对象的 `schoolType` 属性，仅保留 `schoolTypeLabel` |
| `shared/content-service.js` | `listSchools` 过滤改为比对 `schoolTypeLabel`（兼容旧 code 值，加 `CODE_TO_TYPE_LABEL` 反向映射） |
| `lib/site-utils.js` | `getSchoolType` 直接返回 `schoolTypeLabel` |
| `lib/school-taxonomy.js` | `inferSchoolCategory` 去掉 `schoolType`；`isInternational` 改为 `school?.isInternational \|\| label.includes('外籍')` |
| `app/schools/district/page.js` | 计数 `schoolTypeLabel === '公办'/'民办'` |
| `app/schools/district/[district]/page.js` | 民办计数改 `schoolTypeLabel === '民办'` |
| `app/schools/[id]/page.js` | ownership 回退改 `schoolTypeLabel` |
| `lib/school-profile-enrichment.mjs` | 去掉 `schoolType` 引用 |
| `crawler/src/crawlers/social-platforms.js` | 去除孤儿 `type` 码产出，仅留 `schoolTypeLabel` |
| `scripts/audit-schools.mjs` | 类型逻辑全部基于 `schoolTypeLabel` |
| `scripts/fix-school-data-accuracy.mjs` | isPublic/isPrivate 改按 `schoolTypeLabel` |
| `scripts/dedupe-schools.mjs` | `deriveCompleteFields` 改用 `schoolTypeLabel` |
| `data/schools.json` | **剥离全部 911 条记录的 `schoolType` 字段**（0 残留） |

## 验证
- `node --check` 全部编辑文件通过。
- 归一化对象不再含 `schoolType` 键。
- 区级计数现：**公办 761 / 民办 135 / 中外合作 1 / 外籍 14**（不再为 0）。
- `validate-schools-data.js`：ERROR 0 / WARN 0 / INFO 0。
- `audit-schools.mjs` 正常跑（仅剩 features 空等既有数据问题，与本任务无关）。

## 回滚
- 本地 JSON 备份：`data/backups/schools-pre-schooltype-strip-2026-07-08T03-11-12-290Z.json`

## 遗留建议（未做，需用户确认）
- 迁移 SQL `001/002` 仍 `CREATE` 了 `school_type` 列；live DB 实际已无该列（003 已省略）。如需显式收口，可加 `004_drop_school_type_if_exists.sql`（`DROP COLUMN IF EXISTS school_type`），属 schema 变更，需另行确认再执行。
