-- ============================================================
-- 010_add_score_lines.sql
-- 为 public.schools 新增 score_lines 列，按年份记录该校统一招生
-- 录取分数线（中考）。结构为 jsonb 数组，每个元素：
--   {
--     "year":  "2023",        -- 年份（字符串，如 "2023"）
--     "score": "707.5",       -- 当年统一招生录取最低分（字符串，保留原始口径，如 "707.5"）
--     "plan":  "200人",       -- 招生计划（可选）
--     "note":  "口径/来源说明"（可选）
--   }
-- 说明：
-- - 历年数据按年份顺序追加，前端取最新若干条展示（详情页"历年分数线"）。
-- - 初中阶段无统一录取分数线（公民同招、电脑派位），其 score_lines 保持默认空数组 []，
--   可在元素 note 中标记摇号说明；研究未查到公开分数线的学校同样保持默认空数组 []。
-- 幂等：列已存在则跳过。在 Supabase Dashboard → SQL Editor 中执行。
-- 与 base/supabase/migrations/005_recreate_schools_final.sql 的 CREATE TABLE 保持同步。
-- ============================================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS score_lines jsonb NOT NULL DEFAULT '[]'::jsonb;
