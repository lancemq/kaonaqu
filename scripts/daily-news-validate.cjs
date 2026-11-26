// 每日新闻素材校验（通用）：引号扫描 + 键名白名单 + heading level + U+FFFD + source 对象 + 配额。
// 用法：node scripts/daily-news-validate.cjs [--date=YYYY-MM-DD]
const fs = require('fs');
const {
  ALLOWED_KEYS, BLOCK_TYPES, NEWS_TYPES, parseDate, loadMaterials
} = require('./daily-news-common.cjs');

const date = parseDate(process.argv);
const materials = loadMaterials(date);
console.log(`校验日期 ${date}`);

let ok = 0, fail = 0, total = 0;
for (const { region, file, items } of materials) {
  if (!items) { console.log(`[MISSING] ${region}: 缺素材 ${file}`); fail++; continue; }
  if (!Array.isArray(items)) { console.log(`[FAIL] ${region}: 素材不是数组`); fail++; continue; }
  if (items.length < 3 || items.length > 5) {
    console.log(`[QUOTA] ${region}: ${items.length} 篇，应为 3-5 篇`); fail++;
  }
  const seen = new Set();
  for (const item of items) {
    total++;
    const errs = [];
    for (const k of Object.keys(item)) if (!ALLOWED_KEYS.includes(k)) errs.push('非法键:' + k);
    if (!item.id || !/^\d{4}-[a-z]{2}-/.test(item.id)) errs.push('id 异常:' + item.id);
    if (seen.has(item.id)) errs.push('同批重复 id:' + item.id);
    seen.add(item.id);
    if (!item.title) errs.push('缺 title');
    if (!NEWS_TYPES.includes(item.newsType)) errs.push('newsType 非法:' + item.newsType);
    if (item.examType !== null && item.examType !== undefined && item.examType !== 'zhongkao' && item.examType !== 'gaokao') errs.push('examType 非法:' + item.examType);
    if (!item.summary || item.summary.length < 40) errs.push('summary 过短');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt || '')) errs.push('publishedAt 格式异常');
    if (!item.source || typeof item.source !== 'object') errs.push('缺 source 对象');
    else {
      if (!item.source.url) errs.push('source 缺 url');
      if (!item.source.name) errs.push('source 缺 name');
      if (!item.source.type) errs.push('source 缺 type');
    }
    if (!Array.isArray(item.content) || item.content.length < 4) errs.push('content blocks <4');
    let halfQuotes = 0, blockErr = null;
    const walkQuotes = (s) => { let c = 0; for (const ch of String(s)) if (ch === '"' || ch === "'") c++; return c; };
    for (const b of (item.content || [])) {
      if (!BLOCK_TYPES.includes(b.type)) { blockErr = '非法 block 类型:' + b.type; break; }
      if (b.type === 'heading' && (!b.level || b.level > 3)) { blockErr = 'heading level 超限:' + b.text; break; }
      if (['paragraph', 'quote', 'heading'].includes(b.type) && typeof b.text !== 'string') { blockErr = b.type + ' 缺 text'; break; }
      if (b.type === 'list' && (!Array.isArray(b.items) || !b.items.length)) { blockErr = 'list 缺 items'; break; }
      const flat = b.type === 'list' ? (b.items || []).join('|') : (b.text || '');
      if (String(flat).indexOf('\uFFFD') >= 0) { blockErr = 'U+FFFD 乱码:' + String(flat).slice(0, 30); break; }
      halfQuotes += walkQuotes(flat);
    }
    halfQuotes += walkQuotes(item.title) + walkQuotes(item.summary);
    if (blockErr) errs.push(blockErr);
    if (halfQuotes) errs.push('半角引号 x' + halfQuotes + '（正文须用中文弯引号）');
    if ((item.title + item.summary).indexOf('\uFFFD') >= 0) errs.push('标题/summary 乱码');

    if (errs.length) { fail++; console.log(`[FAIL] (${region}) ${item.id}`); errs.forEach(e => console.log('   - ' + e)); }
    else { ok++; console.log(`[OK] (${region}) ${item.id} blocks=${item.content.length}`); }
  }
}
console.log(`\nVALIDATION ${ok}/${total} 通过，失败 ${fail} — ${fail ? '存在失败项，禁止写库' : '全部通过'}`);
process.exit(fail ? 1 : 0);
