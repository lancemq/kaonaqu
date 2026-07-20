'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Pager from './pager';
import admissionTimeline from '../lib/admission-timeline';

const FILTERS = [
  ['all', '全部'],
  ['policy', '政策文件'],
  ['guide', '备考指南'],
  ['school', '学校动态'],
  ['exam', '考试通知'],
  ['admission', '招生简章']
];

// 卡片分类色 chip：与 getNewsSection 的 section 值一一对应
const SECTION_CHIP = {
  policy: '政策',
  guide: '指南',
  school: '学校',
  exam: '考试',
  admission: '招生'
};

function getSectionChip(section) {
  return SECTION_CHIP[section] || '资讯';
}

const QUICK_LINKS = [
  { label: '中招专题', href: '/news/zhongkao-special' },
  { label: '高招专题', href: '/news/gaokao-special' },
  { label: '政策速查', href: '/news/policy-glossary' },
  { label: '政策问答', href: '/news/policy-faq' }
];

const SPORTS_SPECIAL = {
  label: '体育改革',
  title: '上海体育考试改革专题',
  summary: '中考体育新规、过程性评价、统一考试时间表、伤病免缓考与体育特长生招生，一页串起来看。',
  href: '/news/sports-reform'
};

function getItemHref(item) {
  return `/news/${encodeURIComponent(item.id)}`;
}

function SectionLabel({ children }) {
  return (
    <div className="channel-kicker">
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

// 将筛选/分页状态写入 URL，浏览器前进/后退即可保留筛选条件
function buildNewsHref(base, next) {
  const merged = { ...base, page: 1, ...next };
  const qs = new URLSearchParams();
  if (merged.filter && merged.filter !== 'all') qs.set('filter', merged.filter);
  if (merged.page && Number(merged.page) > 1) qs.set('page', String(merged.page));
  const s = qs.toString();
  return s ? `/news?${s}` : '/news';
}

export default function NewsPageClient({ news, schoolNamesById = {}, total = 0, totalPages = 1, currentPage = 1, activeFilter = 'all' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 服务端是唯一数据源：URL 变化即重新请求并下发当前页卡片。
  const navigate = (next) => {
    startTransition(() => {
      router.push(buildNewsHref({ filter: activeFilter, page: currentPage }, next));
    });
  };

  const timelinePreview = admissionTimeline.slice(0, 3);

  return (
    <section className="news-aerial-content">
      <div className="news-aerial-main-column">
        <div className="news-list-header">
          <div>
            <SectionLabel>ALL NEWS</SectionLabel>
            <h2>全部新闻</h2>
          </div>
          <div className="news-result-count">
            <strong>{total}</strong>
            <span>条结果</span>
          </div>
        </div>

        <div className="news-filter-row" aria-label="新闻分类筛选">
          {FILTERS.map(([value, label]) => (
            <button
              className={`news-filter-button${activeFilter === value ? ' is-active' : ''}`}
              key={value}
              type="button"
              aria-pressed={activeFilter === value}
              onClick={() => navigate({ filter: value })}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="news-article-list"
          aria-busy={isPending}
          style={{ opacity: isPending ? 0.55 : 1, transition: 'opacity 120ms' }}
        >
          {news.length ? news.map((item) => {
            const linkedSchool = item.itemType === 'news' && item.primarySchoolId
              ? schoolNamesById[item.primarySchoolId] || ''
              : '';
            return (
              <Link className="news-article-row" href={getItemHref(item)} key={`${item.itemType}-${item.id}`}>
                <div className="news-article-copy">
                  <div className="news-article-tags">
                    <span className={`news-article-chip is-${item.section || 'default'}`}>{getSectionChip(item.section)}</span>
                    <span className="news-article-kicker">{item.kicker}</span>
                  </div>
                  <h3>{item.title}</h3>
                  {linkedSchool ? <p className="news-article-signal">涉及学校 / {linkedSchool}</p> : null}
                  <p>{item.summaryText}</p>
                </div>
                <div className="news-article-meta">
                  <time>{item.publishedAt || item.date || 'DATE'}</time>
                  <span className="news-article-cta">查看 →</span>
                </div>
              </Link>
            );
          }) : (
            <article className="news-article-row news-article-empty">
              <div className="news-article-copy">
                <span>EMPTY</span>
                <h3>当前分类暂无内容</h3>
                <p>切换到全部或其他分类继续浏览。</p>
              </div>
            </article>
          )}
        </div>

        <Pager
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => navigate({ page })}
        />
      </div>

      <aside className="news-aerial-sidebar">
        <section className="news-hot-card">
          <SectionLabel>SPECIALS</SectionLabel>
          <h2>{SPORTS_SPECIAL.title}</h2>
          <p>{SPORTS_SPECIAL.summary}</p>
          <Link href={SPORTS_SPECIAL.href}>
            <span>{SPORTS_SPECIAL.label}</span>
            <strong>进入</strong>
          </Link>
        </section>

        <section className="news-quick-card">
          <SectionLabel>RESOURCES</SectionLabel>
          <div className="news-quick-grid">
            {QUICK_LINKS.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </div>
        </section>

        {timelinePreview.length ? (
          <section className="news-timeline-card">
            <SectionLabel>TIMELINE</SectionLabel>
            {timelinePreview.map((item) => (
              <Link href="/news/admission-timeline" key={item.title}>
                <span>{item.window}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </section>
        ) : null}

      </aside>
    </section>
  );
}
