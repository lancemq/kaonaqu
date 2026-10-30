// 高校详情页：/universities/[slug]（全局路由，无 region 前缀）。
// **样式完全复用学校频道详情皮肤**：页面结构/类名对齐 app/[region]/schools/[id]/page.js
// （school-pencil-* 骨架），data-page 输出 "schools"，由 schools-detail.css 原样接管。
// ISR 1 天；区块：面包屑 / chip 行+指标 header / content blocks（BlockRenderer）/
// 学科评估 / 分省录取表 / 侧栏（基本信息卡 + 同省推荐）。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import { renderBlocks } from '../../../components/BlockRenderer';
import { RegionSelector } from '../../../components/region-selector';
import { SiteMenuLinks } from '../../../components/site-menu';
import '../../../styles/channels/schools.css';
import '../../../styles/pages/schools-detail.css';

const require = createRequire(import.meta.url);
const { getUniversityBySlug, loadUniversitiesList } = require('../../../shared/university-store');

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaonaqu.xyz';

const RATING_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const u = await getUniversityBySlug(decoded);
  if (!u) return { title: '高校详情 | 考哪去' };
  const tagText = (u.tags || []).join('/');
  return {
    title: `${u.name}${tagText ? `（${tagText}）` : ''} - 概况/学科/录取 | 考哪去高校库`,
    description: `${u.name}，位于${u.province}${u.city ? u.city : ''}的${u.nature || ''}${u.isUndergrad ? '本科' : '专科'}院校${tagText ? `，${tagText}` : ''}。查看学校概览、学科实力与分省录取数据。`,
    keywords: [u.name, ...(u.aliases || []), u.province, '大学', '录取分数', '学科评估'],
    alternates: { canonical: `/universities/${encodeURIComponent(u.slug)}` },
    openGraph: { type: 'article', title: `${u.name} | 考哪去高校库`, url: `${SITE_URL}/universities/${encodeURIComponent(u.slug)}` }
  };
}

// 分省录取表：按 省份→年份 倒序 组装行
function groupScoreLines(lines) {
  const byProvince = new Map();
  for (const l of Array.isArray(lines) ? lines : []) {
    const p = l.province || '未知';
    if (!byProvince.has(p)) byProvince.set(p, []);
    byProvince.get(p).push(l);
  }
  for (const [p, arr] of byProvince) {
    arr.sort((a, b) => Number(b.year) - Number(a.year) || String(a.batch || '').localeCompare(String(b.batch || '')));
  }
  return [...byProvince.entries()];
}

export default async function UniversityDetailPage({ params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const u = await getUniversityBySlug(decoded);
  if (!u) notFound();

  const disciplines = (u.disciplines || [])
    .filter((d) => d && d.name)
    .sort((a, b) => RATING_ORDER.indexOf(a.rating || '') - RATING_ORDER.indexOf(b.rating || ''));

  const scoreGroups = groupScoreLines(u.scoreLines);

  // 相关推荐：同省 + 高 tag 权重，排除自身
  const all = await loadUniversitiesList();
  const related = all
    .filter((x) => x.slug !== u.slug && x.province === u.province)
    .sort((a, b) => {
      const w = (t) => (t.tags || []).includes('双一流') ? 2 : (t.tags || []).length;
      return w(b) - w(a) || String(a.name).localeCompare(String(b.name), 'zh');
    })
    .slice(0, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: u.name,
    url: u.website || `${SITE_URL}/universities/${encodeURIComponent(u.slug)}`,
    address: {
      '@type': 'PostalAddress',
      addressRegion: u.province,
      addressLocality: u.city || undefined,
      streetAddress: u.address || undefined
    },
    ...(u.foundingYear ? { foundingDate: String(u.foundingYear) } : {})
  };

  // chip 行（对齐 school-pencil-chip-row 结构；chip-* 类为学校详情既有类，语义映射）
  const chipItems = [
    { type: 'stage', text: u.isUndergrad ? '本科' : '专科（高职）' },
    { type: 'ownership', text: u.nature || '高校' },
    { type: 'district', text: `${u.province}${u.city ? ` · ${u.city}` : ''}` },
    ...(u.affiliation ? [{ type: 'updated', text: `${u.affiliation}直属` }] : [])
  ].filter((x) => x.text);

  const headerStats = [
    [String((u.tags || []).length ? (u.tags || []).join('/') : (u.isUndergrad ? '本科' : '专科')), '层次标签'],
    [u.foundingYear ? String(u.foundingYear) : '—', '建校年份'],
    [u.moeCode || '—', '教育部标识码']
  ];

  const infoRows = [
    ['层次', u.isUndergrad ? '本科' : '专科（高职）'],
    ['性质', u.nature || '—'],
    ['隶属', u.affiliation || '—'],
    ['所在地', `${u.province}${u.city ? ` · ${u.city}` : ''}`],
    ['建校时间', u.foundingYear ? `${u.foundingYear} 年` : '—'],
    ['官网', u.website || '—'],
    ['地址', u.address || '—']
  ];

  return (
    <main className="school-detail-page is-pencil-school-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="channel-nav" aria-label="顶部导航">
        <Link className="channel-brand" href="/" aria-label="考哪去首页"><strong>考哪去</strong><span>高校库</span></Link>
        <div className="channel-nav-links">
          <SiteMenuLinks active="universities" />
          <RegionSelector />
        </div>
      </nav>

      <nav className="school-pencil-breadcrumb" aria-label="面包屑">
        <Link href="/">首页</Link>
        <i aria-hidden="true">/</i>
        <Link href="/universities">高校库</Link>
        <i aria-hidden="true">/</i>
        <Link href={`/universities?province=${encodeURIComponent(u.province)}`}>{u.province}</Link>
        <i aria-hidden="true">/</i>
        <span className="is-current">{u.name}</span>
      </nav>

      <header className="school-pencil-header" id="top">
        <div className="school-pencil-chip-row">
          {chipItems.map((item) => <span key={item.type} className={`chip-${item.type}`}>{item.text}</span>)}
        </div>
        <h1>{u.name}</h1>
        {u.aliases && u.aliases.length > 0 && (
          <p className="school-pencil-kicker">简称/曾用名：{u.aliases.join(' / ')}</p>
        )}
        <div className="school-pencil-stats" aria-label="高校关键指标">
          {headerStats.map(([value, label]) => (
            <article key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </header>

      <section className="school-pencil-body">
        <article className="school-pencil-main">
          {u.content && u.content.length > 0
            ? renderBlocks(u.content, { sectionClass: 'school-pencil-section' })
            : (
              <section className="school-pencil-section" aria-label="资料整理中">
                <h2>学校介绍</h2>
                <p>资料整理中。基本办学信息（层次/性质/隶属/所在地）已收录，详细介绍与学科数据陆续补齐。</p>
              </section>
            )}

          {disciplines.length > 0 && (
            <section className="school-pencil-section" aria-label="学科实力">
              <h2>学科实力（教育部第四轮学科评估）</h2>
              <div className="school-pencil-tags-list">
                {disciplines.map((d, i) => (
                  <span key={`${d.name}-${i}`} className="school-pencil-chipline">{d.rating} · {d.name}</span>
                ))}
              </div>
            </section>
          )}

          <section className="school-pencil-section school-pencil-score" aria-label="录取数据">
            <h2>录取数据</h2>
            {scoreGroups.length === 0 ? (
              <p>分省录取分数线整理中，优先补齐双一流高校（上海/江苏）数据。</p>
            ) : scoreGroups.map(([province, rows]) => (
              <div key={province} className="school-pencil-admission-block">
                <h3>{province}</h3>
                <table className="school-pencil-score-table">
                  <thead>
                    <tr><th>年份</th><th>科类</th><th>批次</th><th>最低分</th><th>最低位次</th><th>备注</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.year}</td>
                        <td>{r.track || '—'}</td>
                        <td>{r.batch || '—'}</td>
                        <td>{r.min != null ? r.min : '—'}</td>
                        <td>{r.minRank != null ? r.minRank : '—'}</td>
                        <td>{r.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        </article>

        <aside className="school-pencil-sidebar">
          <div className="school-pencil-card">
            <h2>基本信息</h2>
            <div className="school-pencil-rows">
              {infoRows.map(([k, v]) => (
                <div key={k} className="school-pencil-row">
                  <span>{k}</span>
                  <b>{v || '—'}</b>
                </div>
              ))}
            </div>
          </div>

          {related.length > 0 && (
            <div className="school-pencil-card">
              <h2>{u.province}其他高校</h2>
              <div className="school-pencil-rows">
                {related.map((x) => (
                  <div key={x.slug} className="school-pencil-row">
                    <span>{(x.tags || []).join('/') || (x.isUndergrad ? '本科' : '专科')}</span>
                    <b><Link href={`/universities/${encodeURIComponent(x.slug)}`}>{x.name}</Link></b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <footer className="channel-footer">
        <div><strong>考哪去</strong><span>高校知识库</span></div>
        <nav aria-label="页脚导航">
          <SiteMenuLinks />
        </nav>
        <p>© 2026 考哪去</p>
      </footer>
    </main>
  );
}
