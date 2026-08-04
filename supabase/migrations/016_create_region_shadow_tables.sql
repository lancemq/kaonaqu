-- ============================================================
-- 016_create_region_shadow_tables.sql
-- 多地区改造阶段 1：建立带 region 列的影子表 school_new / news_new。
-- 数据从 schools / news 拷贝（region 默认 'shanghai'），原表完全不动，
-- 作为安全回退。本地开发环境通过环境变量指向新表：
--   SUPABASE_SCHOOLS_TABLE=school_new
--   SUPABASE_NEWS_TABLE=news_new
-- 在 Supabase Dashboard -> SQL Editor 中一次性执行本文件。
-- ============================================================
--
-- 设计说明：
-- - 用 LIKE ... INCLUDING ALL EXCLUDING INDEXES 复制完整结构（列/约束/默认值/注释/IDENTITY），
--   排除索引以避免与旧表同名索引冲突，索引在下方手动重建（带 _new 前缀）。
-- - region 列 NOT NULL DEFAULT 'shanghai'：存量拷贝行自动归入上海。
-- - 数据拷贝用 SELECT *, 'shanghai'：旧表无 region 列，补一个常量值；
--   列顺序与 school_new（旧列 ..., region）一致。
-- - school_new.id 为 BIGSERIAL（IDENTITY），拷贝显式 id 后需 setval 重置序列。
-- - RLS policy 不随 INCLUDING ALL 复制，下方手动建（与 schools/news 一致：anon 读 / service_role 读写）。

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ school_new ============
CREATE TABLE IF NOT EXISTS public.school_new (LIKE public.schools INCLUDING ALL EXCLUDING INDEXES);

ALTER TABLE public.school_new ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'shanghai';

-- 索引（_new 前缀，避免与 schools 同名索引冲突；新增 region 维度索引）
CREATE INDEX IF NOT EXISTS idx_school_new_region          ON public.school_new(region);
CREATE INDEX IF NOT EXISTS idx_school_new_region_district ON public.school_new(region, district_name);
CREATE INDEX IF NOT EXISTS idx_school_new_district_name   ON public.school_new(district_name);
CREATE INDEX IF NOT EXISTS idx_school_new_stage_label     ON public.school_new(school_stage_label);
CREATE INDEX IF NOT EXISTS idx_school_new_property_label ON public.school_new(school_property_label);
CREATE INDEX IF NOT EXISTS idx_school_new_key_level       ON public.school_new(school_key_level);
CREATE INDEX IF NOT EXISTS idx_school_new_elite_cohort    ON public.school_new(elite_cohort);
CREATE INDEX IF NOT EXISTS idx_school_new_group           ON public.school_new("group");
CREATE INDEX IF NOT EXISTS idx_school_new_features_gin    ON public.school_new USING GIN(features);
CREATE INDEX IF NOT EXISTS idx_school_new_name_trgm       ON public.school_new USING GIN(name gin_trgm_ops);

-- 拷贝数据：schools 所有列 + region='shanghai'。ON CONFLICT 支持安全重跑（首次执行无冲突）。
INSERT INTO public.school_new
SELECT *, 'shanghai' AS region FROM public.schools
ON CONFLICT (slug) DO NOTHING;

-- 重置 BIGSERIAL 序列到 max(id)，避免后续 INSERT 主键冲突
SELECT setval(
  pg_get_serial_sequence('public.school_new', 'id'),
  COALESCE((SELECT MAX(id) FROM public.school_new), 1),
  true
);

-- RLS：与 schools 一致（anon 可读，service_role 可写）
ALTER TABLE public.school_new ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS school_new_select_anon   ON public.school_new;
DROP POLICY IF EXISTS school_new_write_service  ON public.school_new;
CREATE POLICY school_new_select_anon   ON public.school_new FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY school_new_write_service ON public.school_new FOR ALL    TO service_role   USING (true) WITH CHECK (true);

-- ============ news_new ============
CREATE TABLE IF NOT EXISTS public.news_new (LIKE public.news INCLUDING ALL EXCLUDING INDEXES);

ALTER TABLE public.news_new ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'shanghai';

CREATE INDEX IF NOT EXISTS idx_news_new_region            ON public.news_new(region);
CREATE INDEX IF NOT EXISTS idx_news_new_region_district   ON public.news_new(region, district_name);
CREATE INDEX IF NOT EXISTS idx_news_new_news_type         ON public.news_new(news_type);
CREATE INDEX IF NOT EXISTS idx_news_new_exam_type         ON public.news_new(exam_type);
CREATE INDEX IF NOT EXISTS idx_news_new_category          ON public.news_new(category);
CREATE INDEX IF NOT EXISTS idx_news_new_district_id       ON public.news_new(district_id);
CREATE INDEX IF NOT EXISTS idx_news_new_published_at      ON public.news_new(published_at);
CREATE INDEX IF NOT EXISTS idx_news_new_title_trgm        ON public.news_new USING GIN(title gin_trgm_ops);

INSERT INTO public.news_new
SELECT *, 'shanghai' AS region FROM public.news
ON CONFLICT (id) DO NOTHING;

-- news 表 id 为 TEXT 主键，无序列，无需 setval

ALTER TABLE public.news_new ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS news_new_select_anon   ON public.news_new;
DROP POLICY IF EXISTS news_new_write_service  ON public.news_new;
CREATE POLICY news_new_select_anon   ON public.news_new FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY news_new_write_service ON public.news_new FOR ALL    TO service_role   USING (true) WITH CHECK (true);

-- 通知 PostgREST 重新加载 schema 缓存
NOTIFY pgrst, 'reload schema';

-- 验证：执行后可用以下查询确认（可选，不执行也无妨）
-- SELECT region, COUNT(*) FROM school_new GROUP BY region;
-- SELECT region, COUNT(*) FROM news_new GROUP BY region;
