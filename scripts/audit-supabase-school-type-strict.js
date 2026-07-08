#!/usr/bin/env node
/**
 * 按严格「办学性质」四值 {公办, 民办, 中外合作, 外籍} 重新清洗 Supabase schools 表 school_type_label（只读）
 *   node scripts/audit-supabase-school-type-strict.js
 *
 * 产出：
 *   - 控制台摘要
 *   - reports/supabase-school-type-strict-audit.md
 *   - reports/supabase-school-type-strict-corrections.json  (含 confidence 字段)
 */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { getServiceClient, SCHOOLS_TABLE, isSupabaseConfigured } = require('../shared/supabase-client');

const TARGET = new Set(['公办', '民办', '中外合作', '外籍']);

// 外籍人员子女学校品牌（仅招外籍护照，独立于公/民办体系）
const FOREIGN_BRAND = ['外籍人员子女', '美国学校', '英国学校', '德威', '惠灵顿', '耀中', '新加坡国际', '虹桥国际', '长宁国际', '协和国际', '西华', '李文斯顿', '韩国外籍', '日本人学校', '法国学校', '德国学校', '不列颠', '澳大利亚国际', '新西兰国际', '中欧国际', '加拿大国际', '哈罗'];
// 中外合作办学
const COOP_BRAND = ['德怀特', '中外合作办学'];
// 已知民办品牌（补充「民办」关键词之外的判定）
const PRIVATE_BRAND = ['世外', '平和', '包玉刚', '星河湾', '康德', '赫贤', '诺德安达', '惠立', '领科', '光华剑桥', '光剑', '尚德', '金苹果', '美高', '杭州湾', '文来', '文绮', '西南位育', '西南模范', '华育', '兰生', '上宝', '张江集团', '协和', '西外', '美达菲', '华旭', '枫叶', '万科', '诺达', '诺美', '燎原'];
// 注：GONG_BAN 不含「位育中学」，避免误匹配「西南位育中学」（民办）
// 知名公办学校（其国际课程班不改变办学性质，仍为公办）
const GONG_BAN = ['上海中学', '华东师范大学第二附属中学', '复旦大学附属中学', '上海交通大学附属中学', '建平中学', '大同中学', '格致中学', '卢湾高级中学', '市西中学', '曹杨第二中学', '进才中学', '延安中学', '控江中学', '七宝中学', '南洋模范中学', '复兴高级中学', '上外附中', '浦东外国语学校', '上海市实验学校', '行知中学', '松江二中', '奉贤中学', '金山中学', '崇明中学', '嘉定一中', '青浦高级中学', '杨浦高级中学', '市北中学', '育才中学', '吴淞中学', '南汇中学', '川沙中学', '洋泾中学', '高桥中学', '上大附中', '虹口高级中学', '市三女中', '复旦中学', '徐汇中学', '南洋中学'];

function hasAny(text, list) {
  return list.some((k) => text.includes(k));
}

function infer(school) {
  const name = String(school.name || '');
  const desc = String(school.description || '');
  const typeCur = String(school.school_type_label || '');
  const blob = `${name}\n${desc}`;

  // 1) 中外合作办学
  if (hasAny(blob, COOP_BRAND)) {
    return { type: '中外合作', confidence: 'high', reason: `命中中外合作品牌：${hasAny(name, COOP_BRAND) ? name.match(/德怀特|中外合作办学/)[0] : '(描述)德怀特/中外合作办学'}` };
  }
  // 2) 外籍人员子女学校
  if (hasAny(blob, FOREIGN_BRAND)) {
    const kw = FOREIGN_BRAND.find((k) => blob.includes(k));
    return { type: '外籍', confidence: 'high', reason: `命中外籍人员子女学校品牌：${kw}` };
  }
  // 2.5) 知名公办学校的国际课程班，办学性质仍为公办（仅依据校名品牌，不用描述，描述含「公办」噪声太大）
  if (hasAny(blob, GONG_BAN) || (name.includes('国际部') && !hasAny(blob, PRIVATE_BRAND))) {
    const kw = hasAny(blob, GONG_BAN) ? GONG_BAN.find((k) => blob.includes(k)) : '国际部且非民办品牌';
    return { type: '公办', confidence: 'high', reason: `知名公办校/公办国际部：${kw}` };
  }
  // 3) 民办（关键词最可靠）
  if (name.includes('民办') || desc.includes('民办') || hasAny(blob, PRIVATE_BRAND)) {
    const kw = name.includes('民办') ? '校名含「民办」' : desc.includes('民办') ? '描述含「民办」' : `民办品牌：${PRIVATE_BRAND.find((k) => blob.includes(k))}`;
    return { type: '民办', confidence: 'high', reason: kw };
  }
  // 4) 公办国际部（知名公办高中的国际部）
  if (name.endsWith('国际部') || name.includes('国际部') || desc.includes('公办国际部')) {
    return { type: '公办', confidence: 'medium', reason: '国际部且未命中民办/外籍/中外合作，按知名公办高中国际部处理（需复核）' };
  }
  // 5) 其他国际课程校，无法判定 → 默认民办并标记复核
  return { type: '民办', confidence: 'low', reason: '国际课程校但无公/外/合作明确信号，暂归民办（需人工复核）' };
}

async function fetchAll() {
  const c = getServiceClient();
  const cols = 'id,slug,name,district_name,school_stage_label,school_type_label,tier,description,is_international';
  const PAGE = 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await c.from(SCHOOLS_TABLE).select(cols).range(from, from + PAGE - 1);
    if (error) throw new Error('查询失败: ' + error.message);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  if (!isSupabaseConfigured()) { console.error('Supabase 未配置'); process.exit(1); }
  console.log('\n=== 按四值「办学性质」清洗 school_type_label（只读） ===\n');
  const rows = await fetchAll();
  console.log(`拉取 ${rows.length} 条\n`);

  const corrections = [];
  const currentDist = {};
  for (const r of rows) {
    const cur = String(r.school_type_label || '').trim();
    currentDist[cur || '(空)'] = (currentDist[cur || '(空)'] || 0) + 1;
    if (!TARGET.has(cur)) {
      // 当前值不在四值集合内（如「国际」）→ 必须重分类
      const inf = infer(r);
      corrections.push({
        slug: r.slug, name: r.name, district_name: r.district_name,
        school_stage_label: String(r.school_stage_label || ''),
        current_school_type_label: cur,
        proposed_school_type_label: inf.type,
        current_is_international: Boolean(r.is_international),
        proposed_is_international: true, // 这些校均为国际课程/外籍/合作办学，统一置 true 以保全站 isInternational 语义
        confidence: inf.confidence,
        reasons: [`当前值「${cur}」不在四值集合 → ${inf.reason}`, `is_international 同步为 true（原 ${r.is_international === true ? 'true' : 'false'}）`]
      });
    } else {
      // 当前值在四值内，但仍用推理复核是否错标（如本应是中外合作/外籍却标了公办/民办）
      const inf = infer(r);
      if (inf.type !== cur && (inf.type === '中外合作' || inf.type === '外籍')) {
        corrections.push({
          slug: r.slug, name: r.name, district_name: r.district_name,
          school_stage_label: String(r.school_stage_label || ''),
          current_school_type_label: cur,
          proposed_school_type_label: inf.type,
          current_is_international: Boolean(r.is_international),
          proposed_is_international: true,
          confidence: inf.confidence,
          reasons: [`推理认为应为「${inf.type}」：${inf.reason}`, `is_international 同步为 true（原 ${r.is_international === true ? 'true' : 'false'}）`]
        });
      }
    }
  }

  console.log('━━━ 当前 school_type_label 分布 ━━━');
  Object.entries(currentDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${String(v).padStart(4)}  ${k}${TARGET.has(k) ? ' ✓' : ' ✗不在四值内'}`);
  });

  const byConf = { high: 0, medium: 0, low: 0 };
  corrections.forEach((c) => { byConf[c.confidence] = (byConf[c.confidence] || 0) + 1; });
  console.log('\n━━━ 需变更行数 ━━━');
  console.log(`  总计: ${corrections.length}`);
  console.log(`  high 置信: ${byConf.high}, medium: ${byConf.medium}, low(需复核): ${byConf.low}`);
  console.log('\n━━━ 明细（按置信升序，low 优先）━━━');
  const order = { low: 0, medium: 1, high: 2 };
  corrections.sort((a, b) => order[a.confidence] - order[b.confidence]);
  corrections.forEach((c, i) => {
    console.log(`  [${c.confidence}] ${c.name} (${c.district_name}) ${c.school_stage_label}: ${c.current_school_type_label} → ${c.proposed_school_type_label}  | ${c.reasons.join('；')}`);
  });

  const outDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const md = [
    `# school_type_label 四值「办学性质」清洗审计`,
    '',
    `> 生成: ${new Date().toLocaleString('zh-CN')} | 数据源: Supabase \`${SCHOOLS_TABLE}\` (${rows.length} 条)`,
    `> 目标集合: { 公办, 民办, 中外合作, 外籍 }`,
    '',
    `## 当前分布`,
    ...Object.entries(currentDist).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}${TARGET.has(k) ? '' : ' （✗ 需重分类）'}`),
    '',
    `## 需变更: ${corrections.length} 条（high ${byConf.high} / medium ${byConf.medium} / low ${byConf.low}）`,
    '',
    `| 置信 | 学校 | 区 | 阶段 | 当前 | 建议 | 理由 |`,
    `| --- | --- | --- | --- | --- | --- | --- |`,
    ...corrections.map((c) => `| ${c.confidence} | ${c.name} | ${c.district_name || ''} | ${c.school_stage_label} | ${c.current_school_type_label} | ${c.proposed_school_type_label} | ${c.reasons.join('；')} |`),
    '',
    `> low 置信行建议人工复核后再写库。`
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'supabase-school-type-strict-audit.md'), md, 'utf8');
  fs.writeFileSync(path.join(outDir, 'supabase-school-type-strict-corrections.json'), JSON.stringify({ total: rows.length, target: [...TARGET], corrections }, null, 2) + '\n', 'utf8');
  console.log(`\n✓ reports/supabase-school-type-strict-audit.md`);
  console.log(`✓ reports/supabase-school-type-strict-corrections.json`);
}

main().catch((err) => { console.error(err); process.exit(1); });
