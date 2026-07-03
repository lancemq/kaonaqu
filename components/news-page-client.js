'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import admissionTimeline from '../lib/admission-timeline';
import policyGlossary from '../lib/policy-glossary';
import { filterNews, getNewsCategoryLabel } from '../lib/site-utils';

const NEWS_PER_PAGE = 7;

const FILTERS = [
  ['all', '全部'],
  ['policy', '中考政策'],
  ['guide', '高考政策'],
  ['school', '学校动态'],
  ['exam', '考试通知'],
  ['admission', '招生简章']
];

const QUICK_LINKS = [
  { label: '中考政策', href: '/news/zhongkao-special' },
  { label: '高考指南', href: '/news/gaokao-special' },
  { label: '时间轴', href: '/news/admission-timeline' },
  { label: '政策问答', href: '/news/policy-faq' }
];

function sanitizePolicyText(text, title = '') {
  let value = String(text || '');
  if (!value) return '';

  value = value
    .replace(/无障碍 首页[\s\S]*?内容概述\s*/g, '')
    .replace(/索取号：[^。]*?/g, '')
    .replace(/发布日期：\d{4}-\d{2}-\d{2}/g, '')
    .replace(/字体 \[ 大 中 小 ]/g, '')
    .replace(/查阅全文[\s\S]*$/g, '')
    .replace(/\[返回上一页][\s\S]*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (title && value.startsWith(title)) {
    value = value.slice(title.length).trim();
  }

  return value;
}

function clipText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function getPolicySummaryText(policy) {
  const summary = sanitizePolicyText(policy.summary, policy.title);
  const content = sanitizePolicyText(policy.content, policy.title);
  return clipText(summary || content || '查看政策原文与关键内容。', 130);
}

function isCurrentYearItem(item, year) {
  const publishedYear = Number(String(item?.publishedAt || item?.date || '').slice(0, 4)) || Number(item?.year) || 0;
  return publishedYear === year;
}

function isRenderablePolicy(policy, currentYear) {
  const title = String(policy?.title || '').trim();
  if (!title || title === '上海市教育委员会') return false;
  if (!isCurrentYearItem(policy, currentYear)) return false;
  return policy.source?.type === 'official' || String(policy.source?.name || '').includes('上海市教育委员会');
}

function getPolicyLabel(policy) {
  const title = String(policy.title || '');
  if (title.includes('义务教育')) return '义务教育';
  if (title.includes('普通高校') || title.includes('高考') || title.includes('春季考试')) return '高招政策';
  return '中招政策';
}

function getItemHref(item) {
  return `/news/${encodeURIComponent(item.id)}`;
}

function getItemKicker(item) {
  if (item.itemType === 'policy') {
    return `${getPolicyLabel(item)} / 政策文件`;
  }
  return `${item.examType === 'zhongkao' ? '中招新闻' : item.examType === 'gaokao' ? '高招新闻' : '综合资讯'} / ${getNewsCategoryLabel(item)}`;
}

function SectionLabel({ children }) {
  return (
    <div className="news-section-label">
      <span aria-hidden="true"></span>
      <p>{children}</p>
    </div>
  );
}

export default function NewsPageClient({ news, policies, schoolNamesById = {}, currentYear }) {
  const currentYearNews = useMemo(
    () => news
      .filter((item) => isCurrentYearItem(item, currentYear))
      .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))),
    [news, currentYear]
  );
  const currentYearPolicies = useMemo(
    () => policies
      .filter((item) => isRenderablePolicy(item, currentYear))
      .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))),
    [policies, currentYear]
  );
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const visibleItems = useMemo(() => {
    if (activeFilter === 'policy') {
      return [
        ...filterNews(currentYearNews, 'policy').map((item) => ({ ...item, itemType: 'news' })),
        ...currentYearPolicies.map((item) => ({ ...item, itemType: 'policy' }))
      ];
    }

    return filterNews(currentYearNews, activeFilter).map((item) => ({
      ...item,
      itemType: 'news'
    }));
  }, [activeFilter, currentYearNews, currentYearPolicies]);

  const rankedItems = useMemo(
    () => visibleItems
      .slice()
      .sort((left, right) => String(right.publishedAt || right.date || '').localeCompare(String(left.publishedAt || left.date || ''))),
    [visibleItems]
  );
  const totalPages = Math.max(1, Math.ceil(rankedItems.length / NEWS_PER_PAGE));
  const pagedItems = rankedItems.slice((currentPage - 1) * NEWS_PER_PAGE, currentPage * NEWS_PER_PAGE);
  const hotTopics = [
    { label: '中考政策', count: currentYearNews.filter((item) => item.examType === 'zhongkao').length, href: '/news/zhongkao-special' },
    { label: '高考指南', count: currentYearNews.filter((item) => item.examType === 'gaokao').length, href: '/news/gaokao-special' }
  ];
  const timelinePreview = admissionTimeline.slice(0, 3);
  const glossaryLead = policyGlossary[0];

  return (
    <section className="news-aerial-content">
      <div className="news-aerial-main-column">
        <div className="news-list-header">
          <div>
            <SectionLabel>ALL NEWS</SectionLabel>
            <h2>全部新闻</h2>
          </div>
          <div className="news-result-count">
            <strong>{rankedItems.length}</strong>
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
              onClick={() => {
                setActiveFilter(value);
                setCurrentPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="news-article-list">
          {pagedItems.length ? pagedItems.map((item) => {
            const linkedSchool = item.itemType === 'news' && item.primarySchoolId
              ? schoolNamesById[item.primarySchoolId] || ''
              : '';
            return (
              <Link className="news-article-row" href={getItemHref(item)} key={`${item.itemType}-${item.id}`}>
                <div className="news-article-copy">
                  <span>{getItemKicker(item)}</span>
                  <h3>{item.title}</h3>
                  {linkedSchool ? <p className="news-article-signal">涉及学校 / {linkedSchool}</p> : null}
                  <p>{item.itemType === 'policy' ? getPolicySummaryText(item) : item.summary || '进入详情查看完整内容。'}</p>
                </div>
                <div className="news-article-meta">
                  <time>{item.publishedAt || item.date || 'DATE'}</time>
                  <strong>阅读</strong>
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

        <div className="news-pager">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </button>
          <span>第 {currentPage} 页 / 共 {totalPages} 页</span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </button>
        </div>
      </div>

      <aside className="news-aerial-sidebar">
        <section className="news-hot-card">
          <SectionLabel>TRENDING</SectionLabel>
          <h2>热门话题</h2>
          {hotTopics.map((topic) => (
            <Link href={topic.href} key={topic.label}>
              <span>{topic.label}</span>
              <strong>{topic.count}</strong>
            </Link>
          ))}
        </section>

        <section className="news-quick-card">
          <SectionLabel>RESOURCES</SectionLabel>
          <div className="news-quick-grid">
            {QUICK_LINKS.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </div>
        </section>

        <section className="news-subscribe-card">
          <SectionLabel>SUBSCRIBE</SectionLabel>
          <h2>订阅最新资讯</h2>
          <p>第一时间获取中考、高考政策推送。</p>
          <Link href="/news/admission-timeline">查看时间轴</Link>
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

        {glossaryLead ? (
          <section className="news-quick-card">
            <SectionLabel>GLOSSARY</SectionLabel>
            <Link className="news-glossary-link" href="/news/policy-glossary">{glossaryLead.title}</Link>
          </section>
        ) : null}
      </aside>
    </section>
  );
}
