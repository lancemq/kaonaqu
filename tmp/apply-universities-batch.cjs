// 高校资料批量写库（top100 enrichment）：合并语义，绝不覆盖已有值。
// content      : 库内为空才写入（概览 heading+paragraph + 办学成就 heading+list）
// disciplines  : 按 name 合并去重（保留库内已有评级，新增补充）
// foundingYear : 仅库内为 null 时回填
// website      : 仅库内为空时写入
// aliases      : 并集去重
// profileDepth : 提升为 foundation（有 content 的校）
// infoVerified : 不改（保持库内值，内容来源为公开资料，待抽检后置 true）
//
// 用法:
//   node tmp/apply-universities-batch.cjs                     # DRY，默认读 tmp/universities-top100-*.json
//   node tmp/apply-universities-batch.cjs --exec              # 写入
//   node tmp/apply-universities-batch.cjs --research=a.json,b.json [--exec]
const fs = require('fs');
const path = require('path');
function loadEnvLocal() {
  const p = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return;
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnvLocal();
const { createClient } = require('@supabase/supabase-js');

const EXEC = process.argv.includes('--exec');
const arg = (n) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
};

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function buildContent(entry) {
  const blocks = [];
  // heading 不带 level：与 schools 存量数据口径一致（BlockRenderer 会渲染为 h3.rich-block-subheading），
  // 保证高校详情与学校详情视觉完全同款。
  if (entry.overview) {
    blocks.push({ type: 'heading', text: '学校概览' });
    blocks.push({ type: 'paragraph', text: entry.overview });
  }
  if (Array.isArray(entry.achievements) && entry.achievements.length) {
    blocks.push({ type: 'heading', text: '办学成就' });
    blocks.push({ type: 'list', items: entry.achievements });
  }
  return blocks;
}

function mergeDisciplines(cur, add) {
  const list = Array.isArray(cur) ? [...cur] : [];
  const seen = new Set(list.map((d) => `${d.name}|${d.rating}`));
  const names = new Set(list.map((d) => d.name));
  let added = 0;
  for (const d of add || []) {
    if (!d || !d.name || !d.rating) continue;
    if (names.has(d.name)) continue; // 同学科已有记录，保留库内评级
    const key = `${d.name}|${d.rating}`;
    if (seen.has(key)) continue;
    list.push({ name: d.name, rating: d.rating, round: 4 });
    seen.add(key);
    names.add(d.name);
    added++;
  }
  return { list, added };
}

(async () => {
  const files = arg('research')
    ? arg('research').split(',').map((s) => path.resolve(s))
    : fs.readdirSync(__dirname)
        .filter((f) => /^universities-top100-[A-Z]\.json$/.test(f))
        .sort()
        .map((f) => path.join(__dirname, f));

  const entries = [];
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!Array.isArray(raw)) { console.error(`研究稿必须是数组: ${f}`); process.exit(1); }
    entries.push(...raw);
    console.log(`读入 ${path.basename(f)}: ${raw.length} 所`);
  }

  // 校验：重名 / 乱码 / 必填
  const seen = new Set();
  for (const e of entries) {
    if (!e.name) { console.error('缺 name 条目'); process.exit(1); }
    if (seen.has(e.name)) { console.error(`重复校名: ${e.name}`); process.exit(1); }
    seen.add(e.name);
    const blob = JSON.stringify(e);
    if (blob.includes('\uFFFD')) { console.error(`U+FFFD 乱码: ${e.name}`); process.exit(1); }
    if (!e.overview || e.overview.length < 60) { console.error(`概览过短(<60字): ${e.name}`); process.exit(1); }
    if (!Array.isArray(e.achievements) || e.achievements.length < 2) { console.error(`办学成就<2条: ${e.name}`); process.exit(1); }
  }
  console.log(`合计 ${entries.length} 所（校验通过）· 模式 ${EXEC ? '⚠️ EXEC' : 'DRY'}\n`);

  // 库内全量（按校名索引，含全部待合并字段）
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from('universities')
      .select('id,slug,name,content,disciplines,founding_year,website,aliases,profile_depth')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const byName = new Map(rows.map((r) => [r.name, r]));

  let ok = 0, skipped = 0, fail = 0, contentWritten = 0, discAdded = 0, fyFilled = 0, siteFilled = 0, aliasAdded = 0;
  const notFound = [];

  for (const e of entries) {
    const cur = byName.get(e.name);
    if (!cur) { notFound.push(e.name); fail++; continue; }

    const hasContent = Array.isArray(cur.content) && cur.content.length > 0;
    const nextContent = hasContent ? cur.content : buildContent(e);
    if (!hasContent) contentWritten++;

    const { list: nextDisc, added: dAdd } = mergeDisciplines(cur.disciplines, e.disciplines);
    discAdded += dAdd;

    const nextFy = cur.founding_year == null && Number(e.foundingYear) > 0 ? Number(e.foundingYear) : cur.founding_year;
    if (cur.founding_year == null && nextFy) fyFilled++;

    const nextSite = (!cur.website || !String(cur.website).trim()) && e.website ? e.website : cur.website;
    if ((!cur.website || !String(cur.website).trim()) && e.website) siteFilled++;

    const curAliases = Array.isArray(cur.aliases) ? cur.aliases : [];
    const aliasSet = new Set(curAliases);
    let aAdd = 0;
    for (const a of e.aliases || []) { if (a && !aliasSet.has(a)) { aliasSet.add(a); aAdd++; } }
    aliasAdded += aAdd;

    const nextDepth = nextContent.length > 0 ? 'foundation' : cur.profile_depth;
    const changed = !hasContent || dAdd > 0 || nextFy !== cur.founding_year || nextSite !== cur.website || aAdd > 0 || nextDepth !== cur.profile_depth;

    if (!changed) { skipped++; console.log(`SKIP(无变化) ${e.name}`); continue; }

    if (!EXEC) {
      console.log(`[DRY] ${e.name}: content=${hasContent ? '保留' : '新增' + nextContent.length + '块'} 学科+${dAdd} 年份=${nextFy || '-'}${nextFy !== cur.founding_year ? '(补)' : ''} 官网=${nextSite ? '有' : '-'} 别名+${aAdd}`);
      ok++;
      continue;
    }

    const { error } = await client
      .from('universities')
      .update({
        content: nextContent,
        disciplines: nextDisc,
        founding_year: nextFy,
        website: nextSite,
        aliases: [...aliasSet],
        profile_depth: nextDepth
      })
      .eq('id', cur.id);
    if (error) { console.error(`FAIL ${e.name}: ${error.message}`); fail++; continue; }

    // 读回校验
    const { data: back } = await client
      .from('universities')
      .select('name,content,disciplines,founding_year,website,aliases')
      .eq('id', cur.id)
      .single();
    const contentOk = (back.content || []).length >= nextContent.length;
    const discOk = (back.disciplines || []).length >= nextDisc.length;
    const fyOk = nextFy == null || Number(back.founding_year) === Number(nextFy);
    if (contentOk && discOk && fyOk) {
      ok++;
      console.log(`OK ${e.name}: content=${(back.content || []).length}块 学科=${(back.disciplines || []).length} 年份=${back.founding_year || '-'} 官网=${back.website ? '有' : '-'} 别名=${(back.aliases || []).length}`);
    } else {
      fail++;
      console.error(`VERIFY-DIFF ${e.name}: content=${(back.content || []).length}/${nextContent.length} 学科=${(back.disciplines || []).length}/${nextDisc.length} 年份=${back.founding_year}/${nextFy}`);
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\n${EXEC ? '写库' : 'DRY'} 完成: 成功 ${ok} / 跳过 ${skipped} / 失败 ${fail} / 总 ${entries.length}`);
  console.log(`  内容新增 ${contentWritten} 校 | 学科条目 +${discAdded} | 建校年补 ${fyFilled} | 官网补 ${siteFilled} | 别名 +${aliasAdded}`);
  if (notFound.length) console.error(`  未在库内找到(${notFound.length}): ${notFound.join('、')}`);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
