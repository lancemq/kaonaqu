-- 012: 移除 schools 冗余文本列 description / achievements
-- 学校概览、办学成就已统一迁入 content (jsonb) 结构化 blocks，
-- 详情页正文、卡片简介、SEO 摘要、区页兜底、taxonomy 特色推断均改读 content。
-- 保留这两个文本列会造成“详情页 vs 卡片/SEO 文本不一致”的双源问题，故删除。

ALTER TABLE public.schools DROP COLUMN IF EXISTS description;
ALTER TABLE public.schools DROP COLUMN IF EXISTS achievements;

-- 通知 PostgREST 重新加载 schema 缓存
NOTIFY pgrst, 'reload schema';
