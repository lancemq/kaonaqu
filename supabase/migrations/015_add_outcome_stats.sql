-- 015: 新增 outcome_stats —— 存储学校办学成果（高考综评/喜报、中考喜报）年度序列
-- 与 score_lines（中招录取分数线，学生"考进"高中的线）方向相反：
-- outcome_stats 记录学校自身毕业生的升学/考试输出。
ALTER TABLE schools ADD COLUMN IF NOT EXISTS outcome_stats jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN schools.outcome_stats IS
'办学成果年度序列。结构: [{ year, exam:"中考"|"高考", kind:"综评"|"喜报", verified:boolean, source:string, sourceUrl:string, metrics:{...} }]。高考综评(kind="综评")源于上海招考热线综评公示，verified=true；喜报类(kind="喜报")源于各校喜报/自媒体，verified=false。';
