// 高校名录 seed 构建：教育部《全国普通高等学校名单》(2026-06) xls 解析产物 → universities 表骨架 JSON。
// 输入：/tmp/moe-universities.json（python xlrd 预解析，2952 所）
// 输出：tmp/universities-seed.json
// 处理：省份归一 / 隶属词表归一（教育部/工信部/其他部委/省级/市级/军队）/
//       性质（备注：民办/中外合作） / tags join（双一流147/985/39/211/116 官方名单）/
//       slug={省份}-{校名}，冲突 fail-fast（同省同名不存在，跨省天然消歧）
const fs = require('fs');
const path = require('path');

const SRC = '/tmp/moe-universities.json';
const OUT = path.resolve(__dirname, 'universities-seed.json');

// 31 省标准名（短名，与 regions 同风格；名单标题行即标准全称，直接映射）
const PROVINCE_MAP = {
  '北京市': '北京', '天津市': '天津', '河北省': '河北', '山西省': '山西', '内蒙古自治区': '内蒙古',
  '辽宁省': '辽宁', '吉林省': '吉林', '黑龙江省': '黑龙江',
  '上海市': '上海', '江苏省': '江苏', '浙江省': '浙江', '安徽省': '安徽', '福建省': '福建', '江西省': '江西', '山东省': '山东',
  '河南省': '河南', '湖北省': '湖北', '湖南省': '湖南', '广东省': '广东', '广西回族自治区': '广西', '广西壮族自治区': '广西', '海南省': '海南',
  '重庆市': '重庆', '四川省': '四川', '贵州省': '贵州', '云南省': '云南', '西藏自治区': '西藏',
  '陕西省': '陕西', '甘肃省': '甘肃', '青海省': '青海', '宁夏回族自治区': '宁夏', '新疆维吾尔自治区': '新疆'
};

// 隶属词表归一（university-store VOCAB.affiliation 对齐）
const AFFILIATION_DEPT = ['教育部', '工业和信息化部'];
const MILITARY = ['中央军委', '军委', '解放军', '武警', '部队'];
function normalizeAffiliation(dept) {
  if (!dept) return '';
  if (dept === '教育部') return '教育部';
  if (AFFILIATION_DEPT.includes(dept)) return '工信部';
  if (MILITARY.some((k) => dept.includes(k))) return '军队';
  if (dept.includes('省') || dept.includes('自治区') || dept.includes('市政府') || dept === '北京市' || dept === '上海市' || dept === '天津市' || dept === '重庆市') {
    // 省级：XX省 / XX省教育厅；市级：北京/上海/天津/重庆 直辖市与地级市（名单中以"XX市"出现）
    if (['北京市', '上海市', '天津市', '重庆市'].includes(dept)) return '市级';
    return '省级';
  }
  if (/市$/.test(dept) && dept.length <= 5 && !dept.includes('省')) return '市级';
  if (dept.includes('教育厅') || dept.includes('教育委员会')) return '省级';
  // 其余部委（国家民委/公安部/交通运输部/中国科学院/共青团中央等）
  return '其他部委';
}

function normalizeNature(note) {
  if (!note) return '公办';
  if (note.includes('民办')) return '民办';
  if (note.includes('中外合作') || note.includes('港澳合作') || note.includes('境外')) return '中外合作';
  return '公办';
}

// ============ 双一流（第二轮 2022，147 所）/ 985（39）/ 211（116）官方名单 ============
// 双一流：教育部等《关于公布第二轮"双一流"建设高校及建设学科名单的通知》
// 985/211：历史官方名单（仍有检索价值）。校名以现名对齐（曾用名映射）。
const DOUBLE_FIRST_CLASS = new Set(require('./universities-double-first-class.json'));
const C985 = new Set(require('./universities-985.json'));
const C211 = new Set(require('./universities-211.json'));

// 名单校名 → 现名映射（更名/合并潮）
const NAME_ALIAS = {
  '中国矿业大学（北京）': '中国矿业大学(北京)', '中国石油大学（北京）': '中国石油大学(北京)', '中国地质大学（北京）': '中国地质大学(北京)',
  '中国矿业大学（徐州）': '中国矿业大学', '中国石油大学（华东）': '中国石油大学(华东)', '中国地质大学（武汉）': '中国地质大学(武汉)',
  '上海交通大学医学院': '上海交通大学', '北京大学医学部': '北京大学', '复旦大学上海医学院': '复旦大学',
};

function matchTag(name, set) {
  if (set.has(name)) return true;
  const alias = NAME_ALIAS[name];
  return alias ? set.has(alias) : false;
}

// ============ 主流程 ============
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const seen = new Map(); // slug -> name
const out = [];
let tagHit = { 双一流: 0, '985': 0, '211': 0 };

for (const r of raw) {
  const province = PROVINCE_MAP[r.provinceRaw];
  if (!province) { console.error(`未知省份: ${r.provinceRaw} (${r.name})`); process.exit(1); }
  const name = r.name.trim();
  const slug = `${province}-${name}`;
  if (seen.has(slug)) { console.error(`slug 冲突: ${slug}`); process.exit(1); }
  seen.set(slug, name);

  const tags = [];
  if (matchTag(name, DOUBLE_FIRST_CLASS)) { tags.push('双一流'); tagHit['双一流']++; }
  if (matchTag(name, C985)) { tags.push('985'); tagHit['985']++; }
  if (matchTag(name, C211)) { tags.push('211'); tagHit['211']++; }

  out.push({
    slug,
    moeCode: r.moeCode,
    name,
    aliases: [],
    province,
    city: (r.loc || '').trim(),
    isUndergrad: r.level === '本科',
    nature: normalizeNature(r.note),
    affiliation: normalizeAffiliation(r.dept),
    tags,
    disciplines: [],
    foundingYear: null,
    address: '',
    website: '',
    content: [],
    scoreLines: [],
    outcomeStats: [],
    profileDepth: 'basic',
    infoVerified: false,
    auditNotes: `【20261029seed】教育部《全国高等学校名单》(截至2026-06-17) 名录导入；主管部门原文:${r.dept}；备注原文:${r.note || '无'}`
  });
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const byProv = out.reduce((m, x) => { m[x.province] = (m[x.province] || 0) + 1; return m; }, {});
console.log(`✓ 共 ${out.length} 所（本科 ${out.filter((x) => x.isUndergrad).length} / 专科 ${out.filter((x) => !x.isUndergrad).length}）`);
console.log(`  性质: ${JSON.stringify(out.reduce((m, x) => { m[x.nature] = (m[x.nature] || 0) + 1; return m; }, {}))}`);
console.log(`  隶属: ${JSON.stringify(out.reduce((m, x) => { m[x.affiliation] = (m[x.affiliation] || 0) + 1; return m; }, {}))}`);
console.log(`  tags 命中: ${JSON.stringify(tagHit)}`);
console.log(`  省份分布(top6): ${Object.entries(byProv).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([p, n]) => p + n).join(' ')}`);
console.log(`已写 ${OUT}`);
