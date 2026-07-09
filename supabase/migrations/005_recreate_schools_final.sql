-- ============================================================
-- 005_recreate_schools_final.sql
-- 将 public.schools 重建为与本地 data/schools.json 完全对齐的最终结构。
-- 适用场景：Supabase 线上的 schools 表停留在旧 schema（缺 profile_depth /
-- school_key_level / elite_cohort 等列），且当前为空表（0 行），可安全重建。
-- 在 Supabase Dashboard → SQL Editor 中一次性执行本文件。
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS public.schools CASCADE;

CREATE TABLE public.schools (
  id                    BIGSERIAL PRIMARY KEY,
  slug                  TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  district_name         TEXT NOT NULL DEFAULT '',
  school_stage_label    TEXT NOT NULL DEFAULT '',
  school_property_label TEXT NOT NULL DEFAULT '',
  tier                  TEXT NOT NULL DEFAULT '',
  school_key_level      TEXT NOT NULL DEFAULT '',
  elite_cohort          TEXT NOT NULL DEFAULT '',
  "group"               TEXT NOT NULL DEFAULT '',
  address               TEXT NOT NULL DEFAULT '',
  phone                 TEXT NOT NULL DEFAULT '',
  website               TEXT NOT NULL DEFAULT '',
  founding_year         INTEGER,
  is_boarding           BOOLEAN NOT NULL DEFAULT FALSE,
  is_international      BOOLEAN NOT NULL DEFAULT FALSE,
  image                 TEXT NOT NULL DEFAULT '',
  description           TEXT NOT NULL DEFAULT '',
  achievements          TEXT NOT NULL DEFAULT '',
  admission_notes       TEXT NOT NULL DEFAULT '',
  profile_depth         TEXT NOT NULL DEFAULT 'foundation',
  features              JSONB NOT NULL DEFAULT '[]',
  admission_info        JSONB NOT NULL DEFAULT '{}'
);

-- 索引
CREATE INDEX idx_schools_slug                    ON public.schools(slug);
CREATE INDEX idx_schools_district_name           ON public.schools(district_name);
CREATE INDEX idx_schools_school_stage_label      ON public.schools(school_stage_label);
CREATE INDEX idx_schools_school_property_label   ON public.schools(school_property_label);
CREATE INDEX idx_schools_tier                     ON public.schools(tier);
CREATE INDEX idx_schools_school_key_level         ON public.schools(school_key_level);
CREATE INDEX idx_schools_elite_cohort             ON public.schools(elite_cohort);
CREATE INDEX idx_schools_group                    ON public.schools("group");
CREATE INDEX idx_schools_features_gin            ON public.schools USING GIN(features);
CREATE INDEX idx_schools_name_trgm               ON public.schools USING GIN(name gin_trgm_ops);

-- RLS：anon 可读，service_role 可写
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY schools_select_anon   ON public.schools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY schools_write_service ON public.schools FOR ALL    TO service_role   USING (true) WITH CHECK (true);

-- 通知 PostgREST 重新加载 schema 缓存
NOTIFY pgrst, 'reload schema';
