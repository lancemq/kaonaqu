-- ============================================================
-- 001_create_schools_table.sql
-- 学校信息表 + Markdown 内容表 + 索引 + RLS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- schools 表
-- ============================================================

CREATE TABLE IF NOT EXISTS public.schools (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  district_id             TEXT NOT NULL,
  district_name           TEXT NOT NULL,
  school_stage            TEXT NOT NULL DEFAULT '',
  school_stage_label      TEXT NOT NULL DEFAULT '',
  school_type             TEXT NOT NULL DEFAULT '',
  school_type_label       TEXT NOT NULL DEFAULT '',
  tier                    TEXT NOT NULL DEFAULT '',
  category                TEXT NOT NULL DEFAULT '',
  "group"                 TEXT NOT NULL DEFAULT '',
  group_canonical         TEXT NOT NULL DEFAULT '',
  address                 TEXT NOT NULL DEFAULT '',
  phone                   TEXT NOT NULL DEFAULT '',
  website                 TEXT NOT NULL DEFAULT '',
  founding_year           INTEGER,
  is_boarding             BOOLEAN NOT NULL DEFAULT FALSE,
  is_international        BOOLEAN NOT NULL DEFAULT FALSE,
  image                   TEXT NOT NULL DEFAULT '',
  description             TEXT NOT NULL DEFAULT '',
  achievements            TEXT NOT NULL DEFAULT '',
  admission_notes         TEXT NOT NULL DEFAULT '',
  admission_code          TEXT NOT NULL DEFAULT '',
  official_admission      TEXT NOT NULL DEFAULT '',
  previous_admission_code TEXT NOT NULL DEFAULT '',
  content_file            TEXT NOT NULL DEFAULT '',
  profile_depth           TEXT NOT NULL DEFAULT 'foundation',
  updated_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- JSONB 数组字段
  features                JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags                    JSONB NOT NULL DEFAULT '[]'::jsonb,
  training_directions     JSONB NOT NULL DEFAULT '[]'::jsonb,
  facilities              JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision_tags           JSONB NOT NULL DEFAULT '[]'::jsonb,
  search_keywords         JSONB NOT NULL DEFAULT '[]'::jsonb,
  specializations         JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_schools         JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- JSONB 嵌套对象
  source                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  profile_signals         JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- JSONB 对象数组
  admission_methods       JSONB NOT NULL DEFAULT '[]'::jsonb,
  admission_routes        JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_schools_district_id  ON public.schools(district_id);
CREATE INDEX IF NOT EXISTS idx_schools_school_stage ON public.schools(school_stage);
CREATE INDEX IF NOT EXISTS idx_schools_school_type  ON public.schools(school_type);
CREATE INDEX IF NOT EXISTS idx_schools_category      ON public.schools(category);
CREATE INDEX IF NOT EXISTS idx_schools_group         ON public.schools("group");
CREATE INDEX IF NOT EXISTS idx_schools_tags_gin      ON public.schools USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_schools_name_trgm     ON public.schools USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_schools_updated_at    ON public.schools(updated_at DESC);

-- ============================================================
-- school_contents 表（Markdown 内容）
-- ============================================================

CREATE TABLE IF NOT EXISTS public.school_contents (
  id         TEXT PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_contents_updated_at ON public.school_contents(updated_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_select_anon"    ON public.schools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "schools_write_service"  ON public.schools FOR ALL    TO service_role   USING (true) WITH CHECK (true);

ALTER TABLE public.school_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_contents_select_anon"   ON public.school_contents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "school_contents_write_service" ON public.school_contents FOR ALL    TO service_role   USING (true) WITH CHECK (true);
