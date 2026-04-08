import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const schools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'schools.json'), 'utf8'));
const OUT = path.join(ROOT, 'docs', 'school-quality-audit-2026-04-08.md');

function mulberry32(a) {
  return function rand() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleDeterministic(arr, n, seed = 20260408) {
  const rand = mulberry32(seed);
  const pool = arr.slice();
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

function scoreMarkdown(content = '') {
  const checks = {
    hasOverview: content.includes('## 学校概览'),
    hasHistory: content.includes('## 历史沿革（公开资料）'),
    hasFeature: content.includes('## 办学特色（公开资料）'),
    hasPathway: content.includes('## 课程与培养路径解读'),
    hasTips: content.includes('## 阅读提示'),
    hasPublicLink: content.includes('## 公开信息入口') && /\[.+\]\(https?:\/\/.+\)/.test(content),
    noDefaultPhrase: !content.includes('当前已整理基础学校画像')
  };
  let score = 0;
  if (checks.hasOverview) score += 1;
  if (checks.hasHistory) score += 1;
  if (checks.hasFeature) score += 1;
  if (checks.hasPathway) score += 1;
  if (checks.hasTips) score += 1;
  if (checks.hasPublicLink) score += 1;
  if (checks.noDefaultPhrase) score += 1;
  if (content.trim().length >= 1100) score += 1;
  return { score, checks, length: content.trim().length };
}

function evaluateSchool(school) {
  const rel = school.contentFile || `content/schools/${school.id}.md`;
  const abs = path.join(ROOT, rel);
  const content = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  const result = scoreMarkdown(content);
  return {
    name: school.name,
    district: school.districtName,
    stage: school.schoolStage,
    file: rel,
    ...result
  };
}

const picked = sampleDeterministic(schools, 30);
const rows = picked.map(evaluateSchool);
const avgScore = (rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(2);
const low = rows.filter((r) => r.score <= 6);

const lines = [];
lines.push('# 学校详情质量抽检报告（随机30所）');
lines.push('');
lines.push(`生成时间：${new Date().toISOString()}`);
lines.push(`平均得分：${avgScore} / 8`);
lines.push(`低分样本（<=6分）：${low.length} 所`);
lines.push('');
lines.push('评分维度：结构完整（5项）+ 公开链接 + 去模板语 + 文本长度>=1100');
lines.push('');
lines.push('| 序号 | 学校 | 区县 | 学段 | 得分 | 字数 | 文件 |');
lines.push('|---|---|---|---|---:|---:|---|');
rows.forEach((r, idx) => {
  lines.push(`| ${idx + 1} | ${r.name} | ${r.district} | ${r.stage} | ${r.score} | ${r.length} | ${r.file} |`);
});

if (low.length) {
  lines.push('');
  lines.push('## 建议优先复核（低分样本）');
  low
    .sort((a, b) => a.score - b.score || a.length - b.length)
    .forEach((r) => {
      lines.push(`- ${r.name}（${r.district}）：${r.score}/8，${r.length}字`);
    });
}

lines.push('');
fs.writeFileSync(OUT, `${lines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({
  output: path.relative(ROOT, OUT),
  sampled: rows.length,
  averageScore: Number(avgScore),
  lowCount: low.length
}, null, 2));
