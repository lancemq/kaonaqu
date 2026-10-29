// 高校详情页：/universities/[slug]（全局路由，无 region 前缀）。
// ISR 1 天（高校数据低频变更）；不做 generateStaticParams 全量预渲染（2868 所拉长 build，
// 按需 ISR + CDN 兜底）。区块：头部徽章 / 基本信息卡 / content blocks（BlockRenderer 同源）/
// 学科实力 / 录取数据（v1 双一流校逐步补齐）。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createRequire } from 'module';
import { renderBlocks } from '../../../components/BlockRenderer';
import '../../../styles/channels/universities.css';
import '../../../styles/pages/universities-detail.css';

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

function tagBadgeClass(tag) {
  if (tag === '双一流') return 'uni-badge double';
  if (tag === '985') return 'uni-badge c985';
  if (tag === '211') return 'uni-badge c211';
  return 'uni-badge';
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

  const infoRows = [
    ['层次', u.isUndergrad ? '本科' : '专科（高职）'],
    ['性质', u.nature || '—'],
    ['隶属', u.affiliation ? `${u.affiliation}${u.affiliation.includes('级') || u.affiliation.includes('部') ? '直属' : ''}` : '—'],
    ['所在地', `${u.province}${u.city ? ` · ${u.city}` : ''}`],
    ['建校时间', u.foundingYear ? `${u.foundingYear} 年` : '—'],
    ['教育部标识码', u.moeCode || '—'],
    ['官网', u.website ? { link: u.website } : '—'],
    ['地址', u.address || '—']
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="uni-detail-page">
        <nav className="channel-nav" aria-label="顶部导航">
          <Link className="channel-brand" href="/" aria-label="考哪去首页">
            <strong>考哪去</strong>
            <span>高校库</span>
          </Link>
          <div className="channel-nav-links">
            <Link href="/">首页</Link>
            <Link href="/news">新闻</Link>
            <Link href="/schools">学校</Link>
            <Link href="/knowledge">知识</Link>
            <Link className="is-active" href="/universities">高校</Link>
          </div>
        </nav>

        <header className="uni-detail-hero">
          <nav className="uni-detail-breadcrumb" aria-label="面包屑">
            <Link href="/universities">高校库</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/universities?province=${encodeURIComponent(u.province)}`}>{u.province}</Link>
            <span aria-hidden="true">/</span>
            <span>{u.name}</span>
          </nav>
          <div className="uni-detail-title">
            <h1>{u.name}</h1>
            <div className="uni-detail-badges">
              {(u.tags || []).map((t) => <span key={t} className={tagBadgeClass(t)}>{t}</span>)}
              {!u.isUndergrad && <span className="uni-badge jc">专科（高职）</span>}
            </div>
            {u.aliases && u.aliases.length > 0 && (
              <p className="uni-detail-aliases">简称/曾用名：{u.aliases.join(' / ')}</p>
            )}
          </div>
        </header>

        <div className="uni-detail-layout">
          <article className="uni-detail-main">
            {u.content && u.content.length > 0 ? (
              <section className="uni-detail-section" aria-label="学校介绍">
                {renderBlocks(u.content)}
              </section>
            ) : (
              <section className="uni-detail-section uni-detail-placeholder" aria-label="资料整理中">
                <h2>学校介绍</h2>
                <p>资料整理中。基本办学信息（层次/性质/隶属/所在地）已收录，详细介绍与学科数据陆续补齐。</p>
              </section>
            )}

            {disciplines.length > 0 && (
              <section className="uni-detail-section" aria-label="学科实力">
                <h2>学科实力（教育部第四轮学科评估）</h2>
                <ul className="uni-discipline-list">
                  {disciplines.map((d, i) => (
                    <li key={`${d.name}-${i}`}>
                      <span className={`uni-rating r${(d.rating || '').replace('+', 'p').replace('-', 'm')}`}>{d.rating}</span>
                      <span className="uni-discipline-name">{d.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="uni-detail-section" aria-label="录取数据">
              <h2>录取数据</h2>
              {scoreGroups.length === 0 ? (
                <p className="uni-detail-placeholder-p">分省录取分数线整理中，优先补齐双一流高校（上海/江苏）数据。</p>
              ) : scoreGroups.map(([province, rows]) => (
                <div key={province} className="uni-score-group">
                  <h3>{province}</h3>
                  <table className="uni-score-table">
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

          <aside className="uni-detail-aside">
            <section className="uni-info-card" aria-label="基本信息">
              <h2>基本信息</h2>
              <dl>
                {infoRows.map(([k, v]) => (
                  <div key={k} className="uni-info-row">
                    <dt>{k}</dt>
                    <dd>
                      {v && typeof v === 'object' && v.link ? (
                        <a href={v.link} target="_blank" rel="noreferrer nofollow">{v.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
                      ) : (v || '—')}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {related.length > 0 && (
              <section className="uni-related-card" aria-label="同省高校">
                <h2>{u.province}其他高校</h2>
                <ul>
                  {related.map((x) => (
                    <li key={x.slug}>
                      <Link href={`/universities/${encodeURIComponent(x.slug)}`}>{x.name}</Link>
                      <span className="uni-related-tags">{(x.tags || []).join('/') || (x.isUndergrad ? '本科' : '专科')}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>

        <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <footer className="channel-footer">
          <div><strong>考哪去</strong><span>高校知识库</span></div>
          <nav aria-label="页脚导航">
            <Link href="/">首页</Link>
            <Link href="/news">新闻</Link>
            <Link href="/schools">学校</Link>
            <Link href="/knowledge">知识</Link>
            <Link href="/universities">高校</Link>
          </nav>
          <p>© 2026 考哪去</p>
        </footer>
      </main>
    </>
  );
}
