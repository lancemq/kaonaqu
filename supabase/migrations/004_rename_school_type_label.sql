-- ============================================================
-- 004_rename_school_type_label.sql
-- 将 school_type_label 重命名为 school_property_label（办学性质）
-- 在 Supabase SQL Editor 执行
-- ============================================================

ALTER TABLE public.schools RENAME COLUMN school_type_label TO school_property_label;

DROP INDEX IF EXISTS idx_schools_school_type_label;
CREATE INDEX idx_schools_school_property_label ON public.schools(school_property_label);

NOTIFY pgrst, 'reload schema';
