-- ============================================================
-- 003_target_schools_schema.sql
-- 目标库 supabase-knq- 建表 DDL（与源库实际结构精确匹配，21 列）
-- 在目标库 Supabase Dashboard SQL Editor 执行
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS public.schools CASCADE;

CREATE TABLE public.schools (
  id                   BIGSERIAL PRIMARY KEY,
  slug                 TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL,
  district_name        TEXT NOT NULL DEFAULT '',
  school_stage_label   TEXT NOT NULL DEFAULT '',
  school_property_label    TEXT NOT NULL DEFAULT '',
  tier                 TEXT NOT NULL DEFAULT '',
  "group"              TEXT NOT NULL DEFAULT '',
  address              TEXT NOT NULL DEFAULT '',
  phone                TEXT NOT NULL DEFAULT '',
  website              TEXT NOT NULL DEFAULT '',
  founding_year        INTEGER,
  is_boarding          BOOLEAN NOT NULL DEFAULT FALSE,
  is_international     BOOLEAN NOT NULL DEFAULT FALSE,
  image                TEXT NOT NULL DEFAULT '',
  description          TEXT NOT NULL DEFAULT '',
  achievements         TEXT NOT NULL DEFAULT '',
  admission_notes      TEXT NOT NULL DEFAULT '',
  profile_depth        TEXT NOT NULL DEFAULT 'foundation',
  features             JSONB NOT NULL DEFAULT '[]',
  admission_info       JSONB NOT NULL DEFAULT '{}'
);

-- 索引
CREATE INDEX idx_schools_slug              ON public.schools(slug);
CREATE INDEX idx_schools_district_name     ON public.schools(district_name);
CREATE INDEX idx_schools_school_stage_label ON public.schools(school_stage_label);
CREATE INDEX idx_schools_school_property_label ON public.schools(school_property_label);
CREATE INDEX idx_schools_tier              ON public.schools(tier);
CREATE INDEX idx_schools_group              ON public.schools("group");
CREATE INDEX idx_schools_features_gin      ON public.schools USING GIN(features);
CREATE INDEX idx_schools_name_trgm         ON public.schools USING GIN(name gin_trgm_ops);

-- RLS：anon 可读，service_role 可写
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY schools_select_anon   ON public.schools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY schools_write_service ON public.schools FOR ALL    TO service_role   USING (true) WITH CHECK (true);

-- 导入数据后需重置 sequence（脚本会提示）
-- SELECT setval('schools_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.schools));
