import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const schoolsPath = path.join(ROOT, 'data', 'schools.json');
const outputPath = path.join(ROOT, 'docs', 'school-manual-polish-top50.md');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

function readMarkdown(school) {
  const relative = school.contentFile || `content/schools/${school.id}.md`;
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) return '';
  return fs.readFileSync(absolute, 'utf8');
}

function isGenericNotes(text) {
  const value = String(text || '').trim();
  if (!value) return true;
  return /^(上海|上海市)?[^，。；]{0,20}(区|新区)?\s*(初中|高中|完全中学)\s*(公办|民办|区重点|市重点|市重点分校|一般高中|学校公开条目)?$/.test(value);
}

function scoreSchool(school) {
  const markdown = readMarkdown(school);
  const sourceName = String(school?.source?.name || '').trim();
  const sourceType = String(school?.source?.type || '').trim();
  const website = String(school?.website || '').trim();
  const features = Array.isArray(school.features) ? school.features.filter(Boolean) : [];
  const directions = Array.isArray(school.trainingDirections) ? school.trainingDirections.filter(Boolean) : [];
  const tags = Array.isArray(school.tags) ? school.tags.filter(Boolean) : [];
  const reasons = [];
  let score = 0;

  if (!website) {
    score += 3;
    reasons.push('缺少学校官网');
  }
  if (!sourceName || sourceName === '公开学校目录' || sourceName === '公开招生目录' || sourceName === '维基百科') {
    score += 3;
    reasons.push('来源偏聚合/二手');
  }
  if (sourceType === 'directory' || sourceType === 'unknown' || sourceType === 'third_party') {
    score += 1;
    reasons.push('来源权重较低');
  }
  if (features.length <= 2) {
    score += 2;
    reasons.push('特色标签较少');
  }
  if (directions.length <= 1) {
    score += 2;
    reasons.push('培养方向维度较少');
  }
  if (tags.length <= 2) {
    score += 1;
    reasons.push('标签信息较薄');
  }
  if (isGenericNotes(school.admissionNotes)) {
    score += 2;
    reasons.push('招生说明偏模板');
  }

  const mdLen = markdown.trim().length;
  if (mdLen < 1050) {
    score += 2;
    reasons.push('详情文本偏短');
  }
  if (markdown.includes('现有资料更偏向近年办学画像')) {
    score += 1;
    reasons.push('历史信息仍较概括');
  }
  if (markdown.includes('公开学校目录')) {
    score += 1;
    reasons.push('公开入口非学校官方');
  }

  return { score, reasons: Array.from(new Set(reasons)), markdownLength: mdLen };
}

const ranked = schools
  .filter((s) => s.profileDepth !== 'priority')
  .map((school) => {
    const result = scoreSchool(school);
    return {
      id: school.id,
      name: school.name,
      districtId: school.districtId,
      districtName: school.districtName,
      schoolStage: school.schoolStage,
      score: result.score,
      reasons: result.reasons,
      markdownLength: result.markdownLength,
      sourceName: String(school?.source?.name || ''),
      hasWebsite: Boolean(String(school?.website || '').trim())
    };
  })
  .sort((a, b) => b.score - a.score || a.markdownLength - b.markdownLength || a.name.localeCompare(b.name, 'zh-Hans-CN'))
  .slice(0, 50);

const lines = [
  '# 学校详情人工润色优先级 Top 50',
  '',
  `生成时间：${new Date().toISOString()}`,
  '',
  '评分规则（越高越优先人工润色）：',
  '- 缺少官网、来源偏聚合/二手、特色与方向维度少、招生说明模板化、文本偏短',
  '',
  '| 排名 | 学校 | 区县 | 学段 | 分数 | 触发原因 |',
  '|---|---|---|---|---:|---|'
];

ranked.forEach((item, index) => {
  lines.push(`| ${index + 1} | ${item.name} | ${item.districtName} | ${item.schoolStage} | ${item.score} | ${item.reasons.join('；')} |`);
});

lines.push('');
lines.push('建议人工润色优先顺序：先处理分数 >= 9 的学校，再处理分数 7-8 的学校。');
lines.push('');

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ output: path.relative(ROOT, outputPath), total: ranked.length, top5: ranked.slice(0, 5) }, null, 2));
