-- ============================================================
-- 014_add_info_verified.sql
-- 新增 info_verified 列：标记学校信息是否已被人工校正/富化。
-- NULL 或 false = 未校正，true = 已校正。按顺序每天更新 5 所。
-- ============================================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS info_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 已校正学校按校正日期排序的索引（未来可加 verified_at 时间列）
CREATE INDEX IF NOT EXISTS idx_schools_info_verified ON public.schools(info_verified);

NOTIFY pgrst, 'reload schema';
