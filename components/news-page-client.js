'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import admissionTimeline from '../lib/admission-timeline';
import policyGlossary from '../lib/policy-glossary';
import { filterNews, getNewsCategoryLabel, getNewsPriorityScore } from '../lib/site-utils';

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
  return `${text.slice(0, maxLength).trim()}…`;
}

function getPolicySummaryText(policy) {
  const summary = sanitizePolicyText(policy.summary, policy.title);
  const content = sanitizePolicyText(policy.content, policy.title);
  return clipText(summary || content || '暂无摘要', 120);
}

function getCurrentYear(news, policies) {
  const years = [...news, ...policies]
    .map((item) => {
      const value = String(item?.publishedAt || item?.date || '');
      return Number(value.slice(0, 4)) || Number(item?.year) || 0;
    })
    .filter(Boolean)
    .sort((a, b) => b - a);
  return years[0] || new Date().getFullYear();
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

export default function NewsPageClient({ news, policies }) {
  const currentYear = useMemo(() => getCurrentYear(news, policies), [news, policies]);
  const currentYearNews = useMemo(
    () => news.filter((item) => isCurrentYearItem(item, currentYear)).sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))),
    [news, currentYear]
  );
  const currentYearPolicies = useMemo(
    () => policies.filter((item) => isRenderablePolicy(item, currentYear)).sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))),
    [policies, currentYear]
  );

  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const NEWS_PER_PAGE = 8;
  const visibleNews = useMemo(() => filterNews(currentYearNews, activeFilter), [currentYearNews, activeFilter]);
  const rankedNews = useMemo(
    () => [...visibleNews].sort((left, right) => {
      const scoreDiff = getNewsPriorityScore(right) - getNewsPriorityScore(left);
      if (scoreDiff !== 0) return scoreDiff;
      return String(right.publishedAt || '').localeCompare(String(left.publishedAt || ''));
    }),
    [visibleNews]
  );
  const totalPages = Math.max(1, Math.ceil(visibleNews.length / NEWS_PER_PAGE));
  const pagedNews = useMemo(() => {
    const start = (currentPage - 1) * NEWS_PER_PAGE;
    return rankedNews.slice(start, start + NEWS_PER_PAGE);
  }, [rankedNews, currentPage]);
  const examCount = currentYearNews.filter((item) => item.newsType === 'exam').length;
  const admissionCount = currentYearNews.filter((item) => item.newsType === 'admission').length;
  const schoolCount = currentYearNews.filter((item) => item.newsType === 'school').length;
  const conceptItems = policyGlossary.slice(0, 3);
  const deepPolicyItems = currentYearPolicies.slice(0, 2);
  const faqBullets = [
    'Q1：看到报名通知后，第一步先看报考资格，再看时间节点。',
    'Q2：学校官网和考试院口径冲突时，优先看考试院和教育主管部门。',
    'Q3：最值得收藏的信息通常是报名资格、缴费节点、志愿填报和确认时间。'
  ];

  return (
    <main className="layout news-prototype-layout">
      <section className="news-prototype-body">
        <div className="news-prototype-main">
          <section className="panel news-prototype-list-panel">
            <div className="news-prototype-filter-meta">
              <p className="overview-label">新闻分类</p>
              <span>按栏目查看当年新闻</span>
            </div>
            <div className="news-prototype-filter-row" aria-label="新闻分类筛选">
              {[
                ['all', '全部'],
                ['exam', '考试新闻'],
                ['admission', '招生新闻'],
                ['school', '学校动态']
              ].map(([value, label], index) => (
                <button
                  key={value}
                  className={`news-prototype-filter${activeFilter === value ? ' news-prototype-filter-active' : ''}`}
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

            <div className="news-prototype-list-head news-prototype-list-head-secondary">
              <div className="news-prototype-list-title">
                <p className="overview-label">年度新闻总览</p>
                <h2>年度新闻总览</h2>
              </div>
            </div>

            <div className="news-prototype-list">
              {pagedNews.length ? (
                <>
                  {pagedNews.map((item, index) => (
                    <article key={item.id} className={`news-prototype-item${index === 1 ? ' news-prototype-item-dark' : ''}`}>
                      <p className="news-prototype-item-kicker">
                        {item.examType === 'zhongkao' ? '中招新闻' : item.examType === 'gaokao' ? '高招新闻' : '综合资讯'}
                        {' / '}
                        {getNewsCategoryLabel(item)}
                      </p>
                      <h3>
                        <Link className="news-title-link" href={`/news/${item.id}`}>{item.title}</Link>
                      </h3>
                      <p>{item.summary || '暂无摘要'}</p>
                    </article>
                  ))}
                </>
              ) : (
                <article className="news-prototype-item news-prototype-item-empty">
                  <p className="news-prototype-item-kicker">暂无内容</p>
                  <h3>当前筛选下还没有可展示的新闻</h3>
                  <p>可以切换到“全部”“考试新闻”或“招生新闻”，或者稍后再看学校动态更新。</p>
                </article>
              )}
            </div>

            <div className="news-prototype-pager">
              <button
                className="news-prototype-pager-button"
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </button>
              <span className="news-prototype-pager-status">第 {currentPage} 页 / 共 {totalPages} 页</span>
              <button
                className="news-prototype-pager-button"
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </button>
            </div>
          </section>
        </div>

        <aside className="news-prototype-side">
          <section className="news-prototype-side-card news-prototype-side-card-brief">
            <p className="overview-label">频道速览</p>
            <div className="news-prototype-brief-metrics">
              <article><strong>{examCount}</strong><span>考试新闻</span></article>
              <article><strong>{admissionCount}</strong><span>招生新闻</span></article>
              <article><strong>{schoolCount}</strong><span>学校动态</span></article>
            </div>
          </section>

          <Link className="news-prototype-side-link-card" href="/news/zhongkao-special">
            <section className="news-prototype-side-card news-prototype-side-card-zhongkao">
              <p className="overview-label">中招专题</p>
              <h3 className="news-prototype-side-title">中招报名、考试、录取与政策</h3>
              <p className="news-prototype-side-description">集中整理中招报名时间、考试安排、录取批次和配套政策，适合持续关注初中升学进度。</p>
            </section>
          </Link>

          <Link className="news-prototype-side-link-card" href="/news/gaokao-special">
            <section className="news-prototype-side-card news-prototype-side-card-gaokao">
              <p className="overview-label">高招专题</p>
              <h3 className="news-prototype-side-title">高招考试、成绩、录取与政策</h3>
              <p className="news-prototype-side-description">把春考、高考、成绩发布、专业计划和录取流程放在同一页，方便按节点连续查看。</p>
            </section>
          </Link>

          {conceptItems.length ? (
            <Link className="news-prototype-side-link-card" href="/news/policy-glossary">
              <section className="news-prototype-side-card news-prototype-side-card-glossary">
                <p className="overview-label">政策概念速查</p>
                <h3 className="news-prototype-side-title">{conceptItems[0].title}</h3>
                <p className="news-prototype-side-description">把常见升学术语拆开解释，适合先理解概念，再回到具体新闻继续看。</p>
              </section>
            </Link>
          ) : null}

          {faqBullets.length ? (
            <Link className="news-prototype-side-link-card" href="/news/policy-faq">
              <section className="news-prototype-side-card news-prototype-side-card-deep">
                <p className="overview-label">高频政策问答</p>
                <h3 className="news-prototype-side-title">常见问题与政策答疑</h3>
                <p className="news-prototype-side-description">汇总最常见的问题，帮助快速找到报名、资格、确认和录取相关答案。</p>
              </section>
            </Link>
          ) : null}

          {deepPolicyItems.length ? (
            <Link className="news-prototype-side-link-card" href="/news/policy-deep-dive">
              <section className="news-prototype-side-card news-prototype-side-card-faq">
                <p className="overview-label">政策深读</p>
                <h3 className="news-prototype-side-title">{deepPolicyItems[0].title}</h3>
                <p className="news-prototype-side-description">从年度重点文件里提炼规则、时间和口径，适合系统理解政策变化。</p>
              </section>
            </Link>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
