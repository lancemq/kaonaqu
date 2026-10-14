-- 018: admission notes 审计分离
-- schools.admission_info.notes 原为「内部维护审计链」（【抽查】戳/口径考据/null 记账，
-- apply 脚本靠原文幂等去重、enrichment 消费原文），此前靠出口层清洗（shared/admission-notes.js）。
-- 本迁移把审计过程持久化到独立列 admission_audit，notes 列清洗为可直接对外展示的事实文本。
-- 数据迁移由 scripts/migrate-admission-audit.mjs 完成（先备份至 backups/，幂等可重跑）。

alter table public.schools add column if not exists admission_audit text;

comment on column public.schools.admission_audit is
  '招生说明内部维护审计原文（【抽查】戳/口径考据/记账），仅库内使用，不对外展示';
