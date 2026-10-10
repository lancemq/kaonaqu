// 无锡建库导入（playbook 第 3 步）：tmp/wuxi-seed-20261010.json → Supabase
// 用法: node tmp/import-wuxi-schools.cjs        # DRY：校验+统计+与库内比对
//       node tmp/import-wuxi-schools.cjs --exec # 真正写入（skip 已存在 slug）
// 前置：seed 由 build-wuxi-seed.cjs 生成（253 条：高中62/初中191，slug=「无锡市-{校名}」中文格式）
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const EXEC = process.argv.includes('--exec');
const SRC = path.join(__dirname, 'wuxi-seed-20261010.json');
const REGION = 'wuxi';

// districtId → districtName（与 region-config districtCatalog 对齐）
const DISTRICT_NAMES = {
  liangxi: '梁溪区', xishan: '锡山区', huishan: '惠山区', binhu: '滨湖区',
  xinwu: '新吴区', jingkai: '经开区', jiangyin: '江阴市', yixing: '宜兴市'
};

(async () => {
  const { createSchoolInSupabase, loadSchoolsList } = require(path.join(__dirname, '..', 'shared', 'data-store'));
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));

  // seed 格式转 school 对象格式（id=slug, districtName 派生）
  const schools = raw.map(s => ({
    id: s.slug,
    slug: s.slug,
    name: s.name,
    districtId: s.districtId,
    districtName: DISTRICT_NAMES[s.districtId] || '',
    schoolStageLabel: s.schoolStageLabel,
    schoolPropertyLabel: s.schoolPropertyLabel,
    schoolKeyLevel: s.schoolKeyLevel,
    address: s.address,
    phone: s.phone,
    admissionInfo: s.admissionInfo || { code: '', methods: [], routes: [], notes: '' },
    scoreLines: s.scoreLines || [],
    content: s.content || [],
    outcomeStats: s.outcomeStats || [],
    profileDepth: s.profileDepth || 'basic',
    features: s.features || [],
    infoVerified: !!s.infoVerified,
    region: s.region,
  }));

  // --- 字段合法性校验 ---
  const STAGES = new Set(['初中', '高中', '完全中学']);
  const PROPS = new Set(['公办', '民办', '中外合作']);
  const LEVELS = new Set(['市重点(高中)', '区重点(高中)', '一般高中', '顶级公办(初中)', '顶级民办(初中)', '强公办(初中)', '强民办(初中)', '一般初中']);
  let bad = 0; const badList = [];
  for (const s of schools) {
    const issues = [];
    if (!s.id) issues.push('no-id');
    if (!s.name) issues.push('no-name');
    if (!s.districtName) issues.push('no-districtName:' + s.districtId);
    if (!STAGES.has(s.schoolStageLabel)) issues.push('stage:' + s.schoolStageLabel);
    if (!PROPS.has(s.schoolPropertyLabel)) issues.push('prop:' + s.schoolPropertyLabel);
    if (!LEVELS.has(s.schoolKeyLevel)) issues.push('level:' + s.schoolKeyLevel);
    if (!Array.isArray(s.content)) issues.push('content-not-array');
    if (!Array.isArray(s.scoreLines)) issues.push('scoreLines-not-array');
    if (s.region !== REGION) issues.push('region:' + s.region);
    if (JSON.stringify(s).indexOf('\uFFFD') >= 0) issues.push('U+FFFD');
    if (issues.length) { bad++; if (badList.length < 20) badList.push(s.id + ' => ' + issues.join(',')); }
  }

  // --- 与库内比对（防 409 / 防撞名）---
  const existing = await loadSchoolsList(REGION);
  const existingSlugs = new Set(existing.map(s => s.id));
  const existingNames = new Set(existing.map(s => s.name));
  const would409 = schools.filter(s => existingSlugs.has(s.id));
  const toInsert = schools.filter(s => !existingSlugs.has(s.id));
  const nameCollide = toInsert.filter(s => existingNames.has(s.name));

  console.log('=== DRY 校验结果 ===');
  console.log('seed 总数:', schools.length);
  console.log('  字段违规:', bad);
  if (bad) badList.forEach(x => console.log('   ✗', x));
  console.log('现有 wuxi 学校:', existing.length);
  console.log('将跳过(已存在 slug):', would409.length);
  console.log('同名冲突(需人工核对):', nameCollide.length);
  if (nameCollide.length) nameCollide.slice(0, 10).forEach(x => console.log('   ⚠ collision:', x.id, '|', x.name));
  console.log('本次将写入:', toInsert.length);
  const byStage = {}, byDist = {}, byLevel = {};
  for (const s of toInsert) {
    byStage[s.schoolStageLabel] = (byStage[s.schoolStageLabel] || 0) + 1;
    byDist[s.districtName] = (byDist[s.districtName] || 0) + 1;
    byLevel[s.schoolKeyLevel] = (byLevel[s.schoolKeyLevel] || 0) + 1;
  }
  console.log('写入分布 学段:', JSON.stringify(byStage));
  console.log('写入分布 区县:', JSON.stringify(byDist));
  console.log('写入分布 层级:', JSON.stringify(byLevel));

  if (!EXEC) { console.log('\n[DRY] 未写入数据库。确认无误后加 --exec 执行。'); return; }

  console.log('\n=== EXEC 写入中 ===');
  let ok = 0, fail = 0; const failures = [];
  for (const s of toInsert) {
    try { await createSchoolInSupabase(s); ok++; }
    catch (e) { fail++; failures.push({ id: s.id, err: e.message }); if (fail <= 15) console.log('  ✗', s.id, '=>', e.message); }
  }
  console.log(`写入完成: 成功 ${ok} / 失败 ${fail} / 跳过已存在 ${would409.length}`);

  const verify = await loadSchoolsList(REGION);
  console.log('读回验证: 库内 wuxi 学校 =', verify.length, '(导入前', existing.length + ')');
  if (failures.length) {
    fs.writeFileSync(path.join(__dirname, 'import-wuxi-failures.json'), JSON.stringify(failures, null, 1));
    console.log('失败清单已写 tmp/import-wuxi-failures.json');
  }
  console.log('\n✅ 入库流程结束');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
