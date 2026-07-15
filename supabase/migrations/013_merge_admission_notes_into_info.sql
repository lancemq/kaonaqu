-- 013: 将 admission_notes 合并进 admission_info.notes，随后删除 admission_notes 列
-- 统一招生信息源：所有招生字段（code/methods/routes/notes）都维护在 admission_info jsonb 中。

-- 1) 回填 notes（仅当 admission_info 尚无 notes 键，避免覆盖既有内容）
UPDATE schools
SET admission_info = jsonb_set(
  COALESCE(admission_info, '{}'::jsonb),
  '{notes}',
  to_jsonb(admission_notes)
)
WHERE admission_notes IS NOT NULL AND admission_notes <> ''
  AND COALESCE(admission_info->>'notes', '') = '';

-- 2) 删除冗余的 admission_notes 文本列
ALTER TABLE schools DROP COLUMN IF EXISTS admission_notes;
