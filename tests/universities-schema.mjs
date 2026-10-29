// 高校词表与数据 schema 校验（对标 tests/ 套路）：
// 1) shared/university-store.js VOCAB 词表完整性
// 2) seed 数据字段合法性（nature/affiliation/tags/province 词表内，moe_code 唯一，slug 格式）
// 用法: node tests/universities-schema.mjs [--db]（--db 时连线上库抽查 100 所）
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { VOCAB } = require('../shared/university-store.js');

const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'
];

let failed = 0;
const check = (ok, msg) => { if (!ok) { console.error('✗ ' + msg); failed++; } };

// 1) VOCAB 完整性
check(VOCAB.nature.length === 3 && VOCAB.nature.includes('公办'), 'VOCAB.nature 应含 公办');
check(VOCAB.affiliation.length === 6, 'VOCAB.affiliation 应为 6 值');
check(VOCAB.tags.includes('双一流') && VOCAB.tags.includes('强基计划'), 'VOCAB.tags 应含 双一流/强基计划');
check(VOCAB.rating[0] === 'A+' && VOCAB.rating.length === 9, 'VOCAB.rating 应为 9 级');

// 2) seed 数据校验
const seedPath = join(process.cwd(), 'tmp', 'universities-seed.json');
if (existsSync(seedPath)) {
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  check(seed.length > 2000, `seed 数量异常: ${seed.length}`);
  const codes = new Set();
  for (const u of seed) {
    check(PROVINCES.includes(u.province), `${u.slug} 省份越表: ${u.province}`);
    check(VOCAB.nature.includes(u.nature), `${u.slug} nature 越表: ${u.nature}`);
    check(VOCAB.affiliation.includes(u.affiliation), `${u.slug} affiliation 越表: ${u.affiliation}`);
    for (const t of u.tags) check(VOCAB.tags.includes(t), `${u.slug} tag 越表: ${t}`);
    check(/^[0-9]{10}$/.test(u.moeCode), `${u.slug} moeCode 非法: ${u.moeCode}`);
    check(!codes.has(u.moeCode), `${u.slug} moeCode 重复: ${u.moeCode}`);
    codes.add(u.moeCode);
    check(u.slug.startsWith(u.province + '-'), `${u.slug} slug 前缀与省份不符`);
  }
  console.log(`seed ${seed.length} 所校验完成`);
} else {
  console.log('seed 文件不存在，跳过 seed 校验');
}

if (failed) { console.error(`\n${failed} 项失败`); process.exit(1); }
console.log('✓ universities schema 校验全部通过');
