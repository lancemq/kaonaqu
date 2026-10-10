// 无锡建库（playbook 第 3 步）：官方名录 → schools 表 seed JSON
// slug 铁律：「无锡市-{官方校名}」中文格式，禁拼音
// district 派生：address 含江阴/宜兴/各区名 → districtCatalog id；department 为江阴/宜兴教育局的强判
// stage: 高中表→高中（民办国际校也归高中）；初中表→初中（含"（初中部）"条目按初中处理）
// keyLevel: 四星名单（34 所调研口径）→市重点(高中)；三星样本→区重点(高中)；其余高中→一般高中
//   初中首期骨架：默认一般初中，头部（大桥实验/外国语/狄邦文理/协和双语/匡园双语 + 金桥/侨育等口碑校）→ 强民办(初中)/顶级民办(初中) 后续 enrichment 再校准
// content/scoreLines 留空骨架；profile_depth=basic
// 输出: tmp/wuxi-seed-20261010.json，供 import 脚本消费
const fs = require('fs');
const path = require('path');

const hs = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../reports/wuxi-research/wuxi-highschools-2025.json'), 'utf8'));
const js = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../reports/wuxi-research/wuxi-juniors-2025.json'), 'utf8'));

// 四星名单（调研：institution-part1.md，34 所口径）
const FOUR_STAR = new Set([
  '无锡市第一中学', '无锡市辅仁高级中学', '江苏省梅村高级中学', '江苏省天一中学', '江苏省锡山高级中学', '江苏省太湖高级中学',
  '无锡市第三高级中学', '无锡市市北高级中学', '无锡市青山高级中学', '无锡市第六高级中学', '江苏省锡东高级中学', '江苏省怀仁中学',
  '无锡市洛社高级中学', '无锡市玉祁高级中学', '无锡市堰桥高级中学', '无锡市立人高级中学',
  '江苏省南菁高级中学', '江苏省江阴高级中学', '江苏省江阴市第一中学', '江苏省江阴长泾中学', '江阴市青阳中学', '江阴市华士高级中学', '江阴市成化高级中学', '江阴市山观高级中学', '江阴市第二中学', '江阴市澄西高级中学',
  '江苏省宜兴中学', '江苏省宜兴第一中学', '宜兴市第二高级中学', '宜兴市阳羡高级中学', '宜兴市丁蜀高级中学', '宜兴市张渚高级中学', '宜兴市官林中学', '宜兴市和桥高级中学',
].map(n => n.replace(/\s+/g, '')));
// 三星样本（调研确认的）
const THREE_STAR = new Set(['无锡市第一女子中学', '无锡市湖滨中学', '无锡光华学校', '江阴市要塞中学', '江阴市祝塘中学'].map(n => n.replace(/\s+/g, '')));

// district 派生（address/department 双信号）
const DISTRICT_RULES = [
  { id: 'jiangyin', re: /江阴/ },
  { id: 'yixing', re: /宜兴/ },
  { id: 'xishan', re: /锡山区|安镇|东亭|羊尖|鹅湖|东北塘|锡北|东港/ },
  { id: 'huishan', re: /惠山区|洛社|玉祁|堰桥|前洲|钱桥/ },
  { id: 'binhu', re: /滨湖区|蠡园|荣巷|雪浪|马山|胡埭|太湖街道/ },
  { id: 'xinwu', re: /新吴区|旺庄|硕放|江溪|梅村街道|鸿山/ },
  { id: 'jingkai', re: /经开区|华庄|太湖新城|观山路/ },
  { id: 'liangxi', re: /梁溪区|迎龙桥|北大街|广益|扬名|黄巷|山北|通扬/ },
];

function deriveDistrict(item) {
  const text = `${item.address || ''} ${item.department || ''}`;
  for (const r of DISTRICT_RULES) if (r.re.test(text)) return r.id;
  // department 兜底：市级主管默认市区（梁溪为市区中心）
  return 'liangxi';
}

function cleanName(name) {
  return String(name).replace(/\s+/g, '').replace(/（待更名）|（暂定名）/g, '');
}

const seed = [];
const seenSlug = new Set();
let starCounts = {};

function push(item, stage) {
  const name = cleanName(item.name);
  if (!name) return;
  // 完全同名校内去重（名录异常）
  const slug = `无锡市-${name}`;
  if (seenSlug.has(slug)) {
    // 高中表与初中表同名（完全中学两表分列）：保留高中行，初中行以「（初中部）」slug 补录
    if (stage === '初中') {
      const juniorSlug = `${slug}（初中部）`;
      if (seenSlug.has(juniorSlug)) { console.log(`SKIP 重复slug: ${slug}`); return; }
      seenSlug.add(juniorSlug);
      seed.push(makeSchool(item, stage, juniorSlug, name + '（初中部）'));
    }
    return;
  }
  seenSlug.add(slug);
  seed.push(makeSchool(item, stage, slug, name));
}

function makeSchool(item, stage, slug, name) {

  let keyLevel;
  if (stage === '高中') {
    if (FOUR_STAR.has(name)) keyLevel = '市重点(高中)';
    else if (THREE_STAR.has(name)) keyLevel = '区重点(高中)';
    else keyLevel = '一般高中';
  } else {
    keyLevel = '一般初中'; // 初中骨架默认，enrichment 再校准头部
  }
  starCounts[keyLevel] = (starCounts[keyLevel] || 0) + 1;

  return {
    slug,
    name,
    districtId: deriveDistrict(item),
    districtName: '',           // 由 districtId 派生，import 脚本填
    schoolStageLabel: stage,
    schoolPropertyLabel: item.property === '民办' ? '民办' : '公办',
    schoolKeyLevel: keyLevel,
    address: String(item.address || '').replace(/\s+/g, ' ').trim(),
    phone: String(item.phone || '').trim(),
    admissionInfo: { code: '', methods: [], routes: [], notes: '' },
    scoreLines: [],
    content: [],
    outcomeStats: [],
    profileDepth: 'basic',
    features: [],
    infoVerified: false,
    region: 'wuxi',
  };
}

for (const item of hs) push(item, '高中');
for (const item of js) push(item, '初中');

// 初中表里的"小学部"条目（名录原文归入初中分表的华东师大附属滨湖等3条）：按原文保留为初中部条目，不改 stage（有（初中部）标记的除外——名录这3条名字就带"小学部"，改标初中会失真）
// → 按调研结论：名录把它们归入初中表，保留 stage=初中 但 notes 说明
for (const s of seed) {
  if (s.name.includes('小学部')) {
    s.admissionInfo.notes = '【建库说明】名录原文将该条目列于初中一览表（一贯制学校小学部条目），按官方名录原文收录。';
  }
}

const out = path.resolve(__dirname, 'wuxi-seed-20261010.json');
fs.writeFileSync(out, JSON.stringify(seed, null, 2));
console.log(`seed 总数: ${seed.length}（高中 ${seed.filter(s => s.schoolStageLabel === '高中').length} / 初中 ${seed.filter(s => s.schoolStageLabel === '初中').length}）`);
console.log('keyLevel 分布:', JSON.stringify(starCounts));
const byDistrict = {};
for (const s of seed) byDistrict[s.districtId] = (byDistrict[s.districtId] || 0) + 1;
console.log('district 分布:', JSON.stringify(byDistrict));
console.log(`已写 ${out}`);
