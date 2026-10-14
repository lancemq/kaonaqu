// admission notes 对外展示清洗（单源，CJS/ESM 双消费）。
// 背景：schools.admission_info.notes 原文是「内部维护审计链」——含【2026-08抽查】
// /【2026-07补线】等戳段、口径考据、来源核实过程、null 记账等，只应留在库内
// （apply 写库脚本靠原文做幂等去重，enrichment 消费原文），不应对外展示。
// 消费方：
//   - lib/site-utils.js（ESM，站点页面渲染出口）
//   - shared/api-router.js（CJS，公开 API 出口）
// 规则两层：
//   1) 整行剥：以【…】戳开头的行（抽查/补线/更名处理/合并说明等维护记录）
//   2) 整句剥（按。；分句）：口径考据、来源核实过程、内部记账/字段名等技术过程句
// 保留：对外有用的事实句（办学性质、招生范围等）与「以官方为准」类免责声明。

// 整行剥：以【…】戳开头
const INTERNAL_NOTE_LINE = /^\s*【[^】]*】/;
// 整句剥：内部过程信息特征词（i 忽略大小写，兼容 outcome_stats/admissionCode 等）
const INTERNAL_NOTE_SENTENCE = /记为\s*null|未在来源中|未在\d{4}专项|待复核|库内|抽查|补线|更名处理|合并说明|沿用代码|口径为|来源为|交叉核实|留空|outcome_stats|score_lines|admission_info|admissionCode/i;

function stripInternalNotes(raw) {
  if (!raw) return '';
  // 第一层：剥【…】戳行
  const keptLines = String(raw)
    .split('\n')
    .filter((line) => !INTERNAL_NOTE_LINE.test(line))
    .join('\n');
  // 第二层：按句剥过程信息，再剥模板套话
  return keptLines
    .split(/(?<=[。；])/)
    .filter((sentence) => !INTERNAL_NOTE_SENTENCE.test(sentence))
    .join('')
    .replace(/建议重点关注[^。]*。/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { stripInternalNotes };
