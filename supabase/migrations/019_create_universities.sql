-- ============================================================
-- 019_create_universities.sql
-- 高校知识库：独立新表 public.universities（与初高中 schools 表完全分离，
-- 不共享任何列/索引/policy）。设计见 docs/高校知识库详细设计.md。
-- - 教育部《全国高等学校名单》全量骨架（本科+专科，约 2868 所）
-- - moe_code（教育部标识码）为稳定唯一锚点（更名不漂移）
-- - content / score_lines 与 schools 同构 jsonb（BlockRenderer 直接渲染）
-- - score_lines 复合键 = province + year + track + batch，只增不覆盖
-- - audit_notes 独立列存内部维护信息，出口层清洗（不对外展示）
-- RLS：anon 读 / service_role 写（同 schools policy 对）。
-- 在 Supabase Dashboard -> SQL Editor 中一次性执行本文件。幂等可重跑。
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ universities（独立高校表） ============
CREATE TABLE IF NOT EXISTS public.universities (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,          -- 对外 id：{省份}-{校名}，如 北京-清华大学
  moe_code        TEXT UNIQUE,                   -- 教育部标识码（10位），稳定锚点；导入校验唯一
  name            TEXT NOT NULL,
  aliases         JSONB NOT NULL DEFAULT '[]'::jsonb,     -- 曾用名/简称，搜索召回
  province        TEXT NOT NULL DEFAULT '',      -- 受控：31 省市区标准名
  city            TEXT NOT NULL DEFAULT '',
  is_undergrad    BOOLEAN NOT NULL DEFAULT TRUE, -- true=本科 / false=专科(高职)
  nature          TEXT NOT NULL DEFAULT '',      -- 受控：公办/民办/中外合作
  affiliation     TEXT NOT NULL DEFAULT '',      -- 受控：教育部/工信部/其他部委/省级/市级/军队
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,     -- 受控：双一流/985/211/强基计划
  disciplines     JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{name,rating,round}] 第四轮学科评估
  founding_year   INTEGER,
  address         TEXT NOT NULL DEFAULT '',
  website         TEXT NOT NULL DEFAULT '',
  content         JSONB NOT NULL DEFAULT '[]'::jsonb,     -- 与 schools 同构 blocks
  score_lines     JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{province,year,track,batch,min,minRank,note}]
  outcome_stats   JSONB NOT NULL DEFAULT '[]'::jsonb,     -- 预留 v1 不填
  profile_depth   TEXT NOT NULL DEFAULT 'basic',
  info_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  audit_notes     TEXT NOT NULL DEFAULT '',      -- 内部维护审计链，出口清洗剔除
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_universities_province    ON public.universities(province);
CREATE INDEX IF NOT EXISTS idx_universities_undergrad   ON public.universities(is_undergrad);
CREATE INDEX IF NOT EXISTS idx_universities_nature      ON public.universities(nature);
CREATE INDEX IF NOT EXISTS idx_universities_tags_gin    ON public.universities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_universities_name_trgm   ON public.universities USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_universities_moe_code    ON public.universities(moe_code);

-- updated_at 自动维护
CREATE OR REPLACE FUNCTION public.set_universities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_universities_updated_at ON public.universities;
CREATE TRIGGER trg_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.set_universities_updated_at();

-- RLS：anon 可读，service_role 可写（对齐 schools）
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS universities_select_anon ON public.universities;
CREATE POLICY universities_select_anon
  ON public.universities FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS universities_write_service ON public.universities;
CREATE POLICY universities_write_service
  ON public.universities FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 通知 PostgREST 重新加载 schema 缓存
NOTIFY pgrst, 'reload schema';
