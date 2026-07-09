-- ============================================================
-- 007_create_news_table.sql
-- 创建 public.news 表，结构与 data/news.json 字段对齐。
-- id 使用 TEXT 主键（稳定应用标识），source 用 JSONB，
-- related_school_ids 用 JSONB 数组，school_link_confidence 用 NUMERIC。
-- 在 Supabase Dashboard -> SQL Editor 中一次性执行本文件。
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.news (
  id                      TEXT PRIMARY KEY,
  title                   TEXT NOT NULL DEFAULT '',
  news_type               TEXT NOT NULL DEFAULT '',
  category                TEXT NOT NULL DEFAULT '',
  exam_type               TEXT NOT NULL DEFAULT '',
  summary                 TEXT NOT NULL DEFAULT '',
  content                 TEXT NOT NULL DEFAULT '',
  published_at            TEXT NOT NULL DEFAULT '',
  updated_at              TEXT NOT NULL DEFAULT '',
  source                  JSONB NOT NULL DEFAULT '{}',
  district_id             TEXT NOT NULL DEFAULT '',
  district_name           TEXT NOT NULL DEFAULT '',
  primary_school_id       TEXT NOT NULL DEFAULT '',
  related_school_ids      JSONB NOT NULL DEFAULT '[]',
  school_link_reason      TEXT NOT NULL DEFAULT '',
  school_link_confidence  NUMERIC
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_news_news_type     ON public.news(news_type);
CREATE INDEX IF NOT EXISTS idx_news_exam_type      ON public.news(exam_type);
CREATE INDEX IF NOT EXISTS idx_news_category       ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_district_id    ON public.news(district_id);
CREATE INDEX IF NOT EXISTS idx_news_published_at   ON public.news(published_at);
CREATE INDEX IF NOT EXISTS idx_news_title_trgm     ON public.news USING GIN(title gin_trgm_ops);

-- RLS：anon 可读，service_role 可写（与 schools 表一致）
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY news_select_anon   ON public.news FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY news_write_service ON public.news FOR ALL    TO service_role   USING (true) WITH CHECK (true);

-- 通知 PostgREST 重新加载 schema 缓存
NOTIFY pgrst, 'reload schema';
