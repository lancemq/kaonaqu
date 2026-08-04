-- ============================================================
-- 017_add_region_to_schools_news.sql
-- 多地区改造阶段 1：直接在原表 schools / news 加 region 列。
--
-- 决策变更（2026-08-03）：放弃影子表 school_new/news_new（016），
-- 沿用原表 schools/news。理由：影子表策略需拷贝数据、配表名环境变量、
-- crawler 同步写入目标、回滚需代码与 DB 同步退，复杂度高；直接原表加列
-- 更简单，代码默认查 schools/news，无需 SUPABASE_SCHOOLS_TABLE 环境变量。
--
-- - region 列 NOT NULL DEFAULT 'shanghai'：存量行自动归入上海，无需回填。
-- - 幂等（IF NOT EXISTS），可安全重跑。
-- - RLS：schools/news 原有 policy 不变（anon 读 / service_role 写），无需改。
-- - schools 883 行、news 量级类似，add column default 瞬时完成，不锁表。
-- 在 Supabase Dashboard -> SQL Editor 中一次性执行本文件。
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ schools ============
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'shanghai';

CREATE INDEX IF NOT EXISTS idx_schools_region          ON public.schools(region);
CREATE INDEX IF NOT EXISTS idx_schools_region_district ON public.schools(region, district_name);

-- ============ news ============
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'shanghai';

CREATE INDEX IF NOT EXISTS idx_news_region             ON public.news(region);
CREATE INDEX IF NOT EXISTS idx_news_region_district    ON public.news(region, district_name);

-- 通知 PostgREST 重新加载 schema 缓存
NOTIFY pgrst, 'reload schema';

-- 验证：执行后用以下查询确认（可选）
-- SELECT region, COUNT(*) FROM schools GROUP BY region;  -- 应返回 shanghai | 883
-- SELECT region, COUNT(*) FROM news GROUP BY region;
