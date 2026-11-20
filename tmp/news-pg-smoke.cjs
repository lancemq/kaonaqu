// 新闻自动化 pg 链路冒烟：模拟一批新闻 build→validate→import→verify 走 pg 库（自清理）
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnvLocal() {
  const p = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return;
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

let url = (process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '').replace(/[?&]sslmode=[^&]+/g, '');
const store = require('../shared/data-store');

(async () => {
  const nid = 'smoke-news-pg-' + Date.now();
  // 1) create（幂等插入）
  await store.createNewsInSupabase({
    id: nid, title: 'pg链路冒烟新闻', region: 'shanghai',
    newsType: 'news', category: '教育新闻', examType: '',
    summary: '数据源切换后的新闻写入冒烟测试。',
    content: [
      { type: 'heading', text: '一、测试' },
      { type: 'paragraph', text: '正文段落，中文弯引号「测试」。' },
      { type: 'list', items: ['条目一', '条目二'] }
    ],
    publishedAt: new Date().toISOString(),
    source: { type: 'official', name: '冒烟测试', url: 'https://example.com' },
    relatedSchoolIds: [], schoolLinkReason: '', schoolLinkConfidence: null
  });
  console.log('INSERT OK');

  // 2) 幂等 update（重复导入路径：409 → update）
  await store.updateNewsInSupabase(nid, { title: 'pg链路冒烟新闻(改)' });
  console.log('UPDATE OK');

  // 3) 读回验证（verify 路径）
  const back = await store.getNewsById(nid);
  const ok = back && back.title.includes('(改)') && back.content.length === 3
    && back.region === 'shanghai' && back.source.name === '冒烟测试';
  console.log(ok ? 'VERIFY OK' : 'VERIFY FAIL', JSON.stringify({ title: back.title, blocks: back.content.length, region: back.region }));

  // 4) 直连 SQL 侧确认落的是同一个 pg 库（列存在 + 行数）
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, channelBinding: 'disable' });
  await client.connect();
  const { rows } = await client.query('SELECT count(*)::int AS n FROM news WHERE id = $1', [nid]);
  console.log('SQL 直查同库命中:', rows[0].n === 1);
  // 5) 清理
  await store.deleteNewsFromSupabase(nid);
  console.log('DELETE OK（自清理）');
  await client.end();
  process.exit(0);
})().catch(e => { console.error('SMOKE FAIL:', e.message); process.exit(1); });
