-- 004_split_tier_into_two_fields.sql
-- 将 tier 拆分为 school_key_level + elite_cohort

ALTER TABLE IF EXISTS public.schools
  ADD COLUMN IF NOT EXISTS school_key_level TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS elite_cohort     TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.schools.school_key_level IS '官方重点层级：市重点/区重点/特色高中/一般高中 | 顶级民办/优质公办/三公/一般初中';
COMMENT ON COLUMN public.schools.elite_cohort IS '精英声誉梯队标签（高中/完中）：四校/八大/四校分校/八大分校/三公';
