-- 006: 删除已废弃的 tier 列
-- tier 字段已拆分为 school_key_level（层级）与 elite_cohort（荣誉体系）两个字段，
-- 应用层不再读取 tier 列（改读 school_key_level / elite_cohort），故删除该冗余列。
-- 由于 schools 表数据已存在，使用 IF EXISTS 安全删除；不影响其他列与数据。

ALTER TABLE public.schools DROP COLUMN IF EXISTS tier;
