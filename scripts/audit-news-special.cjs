// 新闻专题页数据质量巡检（只读，不写库）
// 直接调用线上同款 builder，核对四城两专题的政策口径、空壳区块与动态覆盖。
// 用法：node scripts/audit-news-special.cjs  （需先确保 pg 隧道可用）
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

(function loadEnv() {
  const txt = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const re = /^([A-Za-z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/gm;
  let m;
  while ((m = re.exec(txt)) !== null) if (!(m[1] in process.env)) process.env[m[1]] = m[2];
})();

const { Client } = require('pg');
const REQUIRE_ROOT = createRequire(path.join(__dirname, '..', 'package.json'));
const REGIONS_DATA = REQUIRE_ROOT('./shared/regions.data.json');
const regions = Object.keys(REGIONS_DATA.regions);
const variants = ['zhongkao', 'gaokao'];

(async () => {
  const { buildSpecialProps } = await import('../shared/news-special-builder.mjs');
  const { getPolicyDetailHref } = await import('../lib/policy-detail.js');

  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  await client.connect();
  const { rows } = await client.query(
    'SELECT id,title,news_type,category,exam_type,summary,published_at,source,region FROM news'
  );
  await client.end();

  const out = { generatedAt: new Date().toISOString(), byRegion: {}, violations: [] };
  for (const region of regions) {
    const cfg = REGIONS_DATA.regions[region];
    const news = rows.filter((r) => r.region === region).map((r) => ({
      id: r.id, title: r.title, newsType: r.news_type, category: r.category,
      examType: r.exam_type || '', summary: r.summary, publishedAt: r.published_at,
      source: typeof r.source === 'string' ? JSON.parse(r.source || '{}') : (r.source || {})
    }));
    out.byRegion[region] = {};
    for (const variant of variants) {
      const props = buildSpecialProps({
        region, regionConfig: cfg, variant, news, detailHref: getPolicyDetailHref
      });
      const dynamicCount = Number(props.heroStats.find((h) => h.label === '当年动态')?.value || 0);
      const summary = {
        title: props.title,
        examTotal: props.heroStats[0]?.value,
        policyBlocks: props.policyBlocks.length,
        officialItems: props.officialItems.length,
        dynamicCount,
        sections: props.sections.map((s) => `${s.id}:${s.items.length}`),
        emptyShells: [
          props.officialItems.length === 0 ? 'official' : null,
          props.sections.every((s) => s.items.length === 0) ? 'sections' : null,
          props.policyItems.length === 0 ? 'policies' : null
        ].filter(Boolean)
      };
      out.byRegion[region][variant] = summary;

      // 硬校验：非上海城市不得出现上海政策口径
      if (region !== 'shanghai') {
        const joined = JSON.stringify({
          title: props.title, description: props.description, blocks: props.policyBlocks,
          notes: props.sideNotes, links: props.sideLinks
        });
        for (const bad of ['上海中招', '上海高招', '沪教委规', '五大批次', '660 分构成', '11 所综评']) {
          if (joined.includes(bad)) out.violations.push(`${region}/${variant}: 命中上海口径「${bad}」`);
        }
      }
      // 总分必须来自 examTotal
      if (String(props.heroStats[0]?.value) !== String(cfg.examTotal?.[variant])) {
        out.violations.push(`${region}/${variant}: 总分 ${props.heroStats[0]?.value} ≠ examTotal ${cfg.examTotal?.[variant]}`);
      }
    }
  }
  fs.writeFileSync(path.join(__dirname, '..', 'tmp', 'audit-news-special.result.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  if (out.violations.length) process.exitCode = 1;
})().catch((e) => { console.error('ERR', e); process.exit(1); });
