import fs from 'fs';
import path from 'path';
import assert from 'assert/strict';
import { buildSchoolMarkdown } from '../lib/school-content-files.mjs';

const schools = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'schools.json'), 'utf8'));

function getSchool(name) {
  const school = schools.find((item) => item.name === name);
  assert.ok(school, `missing school: ${name}`);
  return school;
}

// profileDepth 是 DB 字段，验证头部校为 priority
const shs = getSchool('上海中学');
assert.equal(shs.profileDepth, 'priority');
assert.ok(!String(shs.schoolDescription || '').trim(), 'schoolDescription should not live in schools.json');
const shsMarkdown = buildSchoolMarkdown(shs);
assert.ok(shsMarkdown.includes('## 学校概览'));
assert.ok(shsMarkdown.length >= 200, 'priority school markdown should contain rich content');

const hsefz = getSchool('华东师范大学第二附属中学');
assert.equal(hsefz.profileDepth, 'priority');
const hsefzMarkdown = buildSchoolMarkdown(hsefz);
assert.ok(hsefzMarkdown.includes('## 学校概览'));

const ordinary = getSchool('上海市崇明区城桥中学');
assert.ok(
  ordinary.profileDepth === 'enhanced' || ordinary.profileDepth === 'priority',
  `unexpected profileDepth for ${ordinary.name}: ${ordinary.profileDepth}`
);
const ordinaryMarkdown = buildSchoolMarkdown(ordinary);
assert.ok(String(ordinaryMarkdown || '').trim().length >= 100);

// 数据现状全局检查：所有学校的 profileDepth 必须是 enhanced 或 priority
const invalidDepth = schools.filter(
  (s) => s.profileDepth !== 'enhanced' && s.profileDepth !== 'priority'
);
assert.equal(
  invalidDepth.length,
  0,
  `schools with invalid profileDepth: ${invalidDepth.map((s) => `${s.name}(${s.profileDepth})`).join(', ')}`
);

console.log('school enrichment checks passed');
