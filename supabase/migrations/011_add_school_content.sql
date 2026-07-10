-- ============================================================
-- 011_add_school_content.sql
-- 给 public.schools 增加 content 列，用于存放学校详情的
-- 「结构化 JSON blocks」（与 news.content 同格式）：
--   [{type:'heading',level:2,text:'学校概览'},
--    {type:'paragraph',text:'...'},
--    {type:'heading',level:2,text:'办学成就'},
--    {type:'list',items:['...','...']}]
-- block 类型：heading(level) / paragraph / list(ordered,items) / quote / divider
-- 既有的 description / achievements 文本字段保留（content 为其结构化镜像）。
-- 在 Supabase Dashboard → SQL Editor 执行本文件（幂等，可重复跑）。
-- ============================================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 通知 PostgREST 重新加载 schema 缓存
NOTIFY pgrst, 'reload schema';
