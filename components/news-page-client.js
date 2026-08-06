'use client';

import { RegionLink } from './region-link';
import { useRegion } from './region-context';
import { regionPath } from '../shared/region-path.mjs';
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
  title: '{label}体育考试改革专题',
  summary: '中考体育新规、过程性评价、统一考试时间表、伤病免缓考与体育特长生招生，一页串起来看。',
  href: '/news/sports-reform'
};

// 苏州专题：仅新闻频道，侧栏入口指向苏州专属专题页
const SUZHOU_QUICK_LINKS = [
  { label: '中考专题', href: '/news/suzhou-zhongkao' },
  { label: '升学路径', href: '/news/suzhou-pathways' },
  { label: '高考选考', href: '/news/suzhou-gaokao' }
];

const SUZHOU_FEATURED_SPECIAL = {
  label: '中考专题',
  title: '{label}中考政策详解',
  summary: '录取批次、四市六区招生格局、指标生 70% 均衡、740 分构成与体育中考，一页串起来看。',
  href: '/news/suzhou-zhongkao'
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
  const { region, label } = useRegion();
  const quickLinks = region === 'suzhou' ? SUZHOU_QUICK_LINKS : QUICK_LINKS;
  const featuredSpecial = region === 'suzhou' ? SUZHOU_FEATURED_SPECIAL : SPORTS_SPECIAL;
  const [isPending, startTransition] = useTransition();

  // 服务端是唯一数据源：URL 变化即重新请求并下发当前页卡片。
  const navigate = (next) => {
    startTransition(() => {
      router.push(regionPath(buildNewsHref({ filter: activeFilter, page: currentPage }, next), region));
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
              <RegionLink className="news-article-row" href={getItemHref(item)} key={`${item.itemType}-${item.id}`}>
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
              </RegionLink>
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
          <h2>{featuredSpecial.title.replace('{label}', label)}</h2>
          <p>{featuredSpecial.summary}</p>
          <RegionLink href={featuredSpecial.href}>
            <span>{featuredSpecial.label}</span>
            <strong>进入</strong>
          </RegionLink>
        </section>

        <section className="news-quick-card">
          <SectionLabel>RESOURCES</SectionLabel>
          <div className="news-quick-grid">
            {quickLinks.map((item) => (
              <RegionLink href={item.href} key={item.href}>{item.label}</RegionLink>
            ))}
          </div>
        </section>

        {timelinePreview.length ? (
          <section className="news-timeline-card">
            <SectionLabel>TIMELINE</SectionLabel>
            {timelinePreview.map((item) => (
              <RegionLink href="/news/admission-timeline" key={item.title}>
                <span>{item.window}</span>
                <strong>{item.title}</strong>
              </RegionLink>
            ))}
          </section>
        ) : null}

      </aside>
    </section>
  );
}
