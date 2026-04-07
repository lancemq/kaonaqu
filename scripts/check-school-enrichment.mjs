import fs from 'fs';
import path from 'path';
import assert from 'assert/strict';

const schools = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'schools.json'), 'utf8'));

function getSchool(name) {
  const school = schools.find((item) => item.name === name);
  assert.ok(school, `missing school: ${name}`);
  return school;
}

function readSchoolMarkdown(school) {
  const relative = school.contentFile || `content/schools/${school.id}.md`;
  const absolute = path.join(process.cwd(), relative);
  assert.ok(fs.existsSync(absolute), `missing school markdown: ${relative}`);
  return fs.readFileSync(absolute, 'utf8');
}

const shs = getSchool('上海中学');
assert.equal(shs.profileDepth, 'priority');
assert.ok(Array.isArray(shs.trainingDirections) && shs.trainingDirections.includes('科创竞赛'));
assert.ok(!String(shs.schoolDescription || '').trim(), 'schoolDescription should not live in schools.json');
const shsMarkdown = readSchoolMarkdown(shs);
assert.ok(shsMarkdown.includes('## 关注重点'));
assert.ok(shsMarkdown.includes('## 培养方向'));
assert.ok((shsMarkdown.match(/^- /gm) || []).length >= 8, 'priority school markdown should contain rich bullets');

const hsefz = getSchool('华东师范大学第二附属中学');
assert.equal(hsefz.profileDepth, 'priority');
assert.ok(Array.isArray(hsefz.trainingDirections) && hsefz.trainingDirections.length >= 2);
const hsefzMarkdown = readSchoolMarkdown(hsefz);
assert.ok(hsefzMarkdown.includes('## 适合谁'));
assert.ok(hsefzMarkdown.includes('## 阅读提示'));

const ordinary = getSchool('上海市崇明区城桥中学');
assert.equal(ordinary.profileDepth, 'foundation');
assert.ok(Array.isArray(ordinary.tags) && ordinary.tags.length >= 2);
const ordinaryMarkdown = readSchoolMarkdown(ordinary);
assert.ok(ordinaryMarkdown.includes('## 学校概览'));
assert.ok(String(ordinaryMarkdown || '').trim().length >= 200);

console.log('school enrichment checks passed');
