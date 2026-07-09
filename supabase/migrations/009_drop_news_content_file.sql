-- ============================================================
-- 009_drop_news_content_file.sql
-- 删除 news.content_file 列：新闻内容已完全由 content 字段承载，
-- 本地 md 文件依赖已移除，content_file 路径不再使用。
-- 在 Supabase Dashboard -> SQL Editor 中一次性执行本文件。
-- ============================================================

ALTER TABLE public.news DROP COLUMN IF EXISTS content_file;

NOTIFY pgrst, 'reload schema';
