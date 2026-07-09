-- ============================================================
-- 008_drop_news_content_md.sql
-- 删除 news.content_md 列：内容已语义重写并入 content，contentMd 不再使用。
-- 在 Supabase Dashboard -> SQL Editor 中一次性执行本文件。
-- ============================================================

ALTER TABLE public.news DROP COLUMN IF EXISTS content_md;

NOTIFY pgrst, 'reload schema';
