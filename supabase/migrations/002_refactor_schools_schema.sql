-- ============================================================
-- 002_refactor_schools_schema.sql
-- 重构：数字主键 + slug + section 拆列（合并 school_contents）
-- ============================================================

-- 1. 删除旧表（含 school_contents）
DROP TABLE IF EXISTS public.school_contents;
DROP TABLE IF EXISTS public.schools;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. 重建 schools 表
CREATE TABLE public.schools (
  -- 数字主键（应用层 text id 从 content_file 提取）
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL DEFAULT '',   -- 学校唯一性标识（区名-校名）

  -- 基本信息标量列
  name                    TEXT NOT NULL,
  district_id             TEXT NOT NULL DEFAULT '',
  district_name           TEXT NOT NULL DEFAULT '',
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
  admission_info          JSONB NOT NULL DEFAULT '{}',   -- {code, methods, routes}
  content_file            TEXT NOT NULL DEFAULT '',
  profile_depth           TEXT NOT NULL DEFAULT 'foundation',

  -- JSONB 数组字段
  features            JSONB NOT NULL DEFAULT '[]',
  tags                JSONB NOT NULL DEFAULT '[]',
  training_directions JSONB NOT NULL DEFAULT '[]',
  facilities           JSONB NOT NULL DEFAULT '[]',
  decision_tags       JSONB NOT NULL DEFAULT '[]',
  search_keywords     JSONB NOT NULL DEFAULT '[]',
  specializations     JSONB NOT NULL DEFAULT '[]',
  related_schools     JSONB NOT NULL DEFAULT '[]',
  -- JSONB 嵌套对象
  source              JSONB NOT NULL DEFAULT '{}',
  profile_signals     JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 索引
CREATE INDEX idx_schools_district_id  ON public.schools(district_id);
CREATE INDEX idx_schools_school_stage ON public.schools(school_stage);
CREATE INDEX idx_schools_school_type  ON public.schools(school_type);
CREATE INDEX idx_schools_category    ON public.schools(category);
CREATE INDEX idx_schools_group        ON public.schools("group");
CREATE INDEX idx_schools_tags_gin     ON public.schools USING GIN(tags);
CREATE INDEX idx_schools_name_trgm    ON public.schools USING GIN(name gin_trgm_ops);
CREATE INDEX idx_schools_updated_at   ON public.schools(updated_at DESC);

-- 4. RLS：anon 可读，service_role 可写
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY schools_select_anon   ON public.schools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY schools_write_service ON public.schools FOR ALL    TO service_role   USING (true) WITH CHECK (true);
