'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import admissionTimeline from '../lib/admission-timeline';
import {
  getNewsCardActionLabel,
  getNewsCardValueLine,
  getNewsSection,
  getSchoolObservationTag,
  shouldShowNewsSchoolCta
} from '../lib/news-channel-utils.mjs';
import policyGlossary from '../lib/policy-glossary';
import { filterNews, getNewsCategoryLabel } from '../lib/site-utils';

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

function getAudienceLabel(item) {
  if (item.newsType === 'school') return '择校家庭';
  if (item.examType === 'zhongkao') return '上海中考家庭';
  if (item.examType === 'gaokao') return '上海高考家庭';
  return '上海升学家庭';
}

export default function NewsPageClient({ news, policies, schoolNamesById = {} }) {
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
  const policyCount = currentYearPolicies.length;
  const visibleItems = useMemo(() => {
    if (activeFilter === 'policy') {
      return currentYearPolicies.map((item) => ({
        ...item,
        itemType: 'policy'
      }));
    }

    const filteredNews = filterNews(currentYearNews, activeFilter);
    return filteredNews.map((item) => ({
      ...item,
      itemType: 'news'
    }));
  }, [currentYearNews, currentYearPolicies, activeFilter]);
  const rankedItems = useMemo(
    () => [...visibleItems].sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || ''))),
    [visibleItems]
  );
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / NEWS_PER_PAGE));
  const pagedNews = useMemo(() => {
    const start = (currentPage - 1) * NEWS_PER_PAGE;
    return rankedItems.slice(start, start + NEWS_PER_PAGE);
  }, [rankedItems, currentPage]);
  const examCount = currentYearNews.filter((item) => item.newsType === 'exam').length;
  const admissionCount = currentYearNews.filter((item) => item.newsType === 'admission').length;
  const schoolCount = currentYearNews.filter((item) => item.newsType === 'school').length;
  const conceptItems = policyGlossary.slice(0, 3);
  const deepPolicyItems = currentYearPolicies.slice(0, 2);
  const weeklyFocus = useMemo(
    () => currentYearNews
      .slice()
      .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')))
      .slice(0, 3),
    [currentYearNews]
  );
  const timelinePreview = admissionTimeline.slice(0, 4);
  const faqBullets = [
    '先确认自己有没有资格，再看报名和确认时间，很多误解都出在这一步。',
    '学校通知和官方口径不一致时，先以考试院和教育主管部门发布的信息为准。',
    '真正值得提前收藏的，通常不是热闹消息，而是资格、时间和志愿确认。'
  ];
  const getLinkedSchoolName = (item) => (
    item?.primarySchoolId ? schoolNamesById[item.primarySchoolId] || '' : ''
  );

  return (
    <main className="layout news-prototype-layout">
      <section className="news-prototype-body">
        <div className="news-prototype-main">
          {weeklyFocus.length ? (
            <section className="panel news-prototype-list-panel">
              <div className="news-prototype-list-head news-prototype-list-head-secondary">
                <div className="news-prototype-list-title">
                  <p className="overview-label">本周重点</p>
                  <h2>这几条消息，最值得家长先看</h2>
                </div>
              </div>
              <div className={`news-prototype-focus-grid news-prototype-focus-grid-count-${Math.min(weeklyFocus.length, 3)}`}>
                {weeklyFocus.map((item, index) => (
                  <Link key={item.id} className={`news-prototype-focus-card${index === 0 ? ' news-prototype-focus-card-lead' : ''}`} href={`/news/${item.id}`}>
                    <p className="news-prototype-item-kicker">{getNewsCategoryLabel(item)} / {item.publishedAt || '暂无日期'}</p>
                    <h3>{item.title}</h3>
                    <p>{item.summary || '暂无摘要'}</p>
                    <span className="news-prototype-focus-meta">{getAudienceLabel(item)}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel news-prototype-list-panel">
            <div className="news-prototype-filter-meta">
              <p className="overview-label">按你现在最关心的内容看</p>
              <span>考试、招生、学校动态和政策文件，一键切换</span>
            </div>
            <div className="news-prototype-filter-row" aria-label="新闻分类筛选">
              {[
                ['all', '全部'],
                ['exam', '考试新闻'],
                ['admission', '招生新闻'],
                ['school', '学校动态'],
                ['policy', '政策文件']
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

            <div className="news-prototype-list">
              {pagedNews.length ? (
                <>
                  {pagedNews.map((item, index) => {
                    const newsSection = item.itemType === 'news' ? getNewsSection(item) : '';
                    const linkedSchoolName = item.itemType === 'news' ? getLinkedSchoolName(item) : '';
                    const showSchoolSignal = newsSection === 'school' && linkedSchoolName;
                    const showAdmissionSchoolSignal = newsSection === 'admission' && linkedSchoolName && shouldShowNewsSchoolCta(item);

                    return (
                      <Link
                        key={item.id}
                        className={`news-prototype-item news-prototype-item-link${index === 1 ? ' news-prototype-item-dark' : ''}`}
                        href={item.itemType === 'policy' ? `/news/policy/${encodeURIComponent(item.id)}` : `/news/${item.id}`}
                      >
                        <p className="news-prototype-item-kicker">
                          {item.itemType === 'policy'
                            ? `${String(item.title || '').includes('义务教育') ? '义务教育' : String(item.title || '').includes('普通高校') || String(item.title || '').includes('高考') || String(item.title || '').includes('春季考试') ? '高招政策' : '中招政策'} / 政策文件`
                            : `${item.examType === 'zhongkao' ? '中招新闻' : item.examType === 'gaokao' ? '高招新闻' : '综合资讯'} / ${getNewsCategoryLabel(item)}`}
                        </p>
                        <h3>
                          <span className="news-title-link">{item.title}</span>
                        </h3>
                        {item.itemType === 'news' ? (
                          <>
                            {showSchoolSignal ? (
                              <p className="news-prototype-item-signal">
                                {linkedSchoolName} / {getSchoolObservationTag(item)}
                              </p>
                            ) : null}
                            {showAdmissionSchoolSignal ? (
                              <p className="news-prototype-item-signal">涉及学校 / {linkedSchoolName}</p>
                            ) : null}
                            <p className="news-prototype-item-summary">{item.summary || '暂无摘要'}</p>
                            <p className="news-prototype-item-copy">{getNewsCardValueLine(item)}</p>
                            <span className="news-prototype-item-action">{getNewsCardActionLabel(item)}</span>
                          </>
                        ) : (
                          <p className="news-prototype-item-copy">{getPolicySummaryText(item)}</p>
                        )}
                      </Link>
                    );
                  })}
                </>
              ) : (
                <article className="news-prototype-item news-prototype-item-empty">
                  <p className="news-prototype-item-kicker">这一栏暂时还没有新消息</p>
                  <h3>换个分类看看，可能你关心的内容正在别处更新</h3>
                  <p>可以切换到“全部”“考试新闻”“招生新闻”“学校动态”或“政策文件”，先把最近的重要信息补齐。</p>
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
            <p className="overview-label">先有个数</p>
            <div className="news-prototype-brief-metrics">
              <article><strong>{examCount}</strong><span>考试新闻</span></article>
              <article><strong>{admissionCount}</strong><span>招生新闻</span></article>
              <article><strong>{schoolCount}</strong><span>学校动态</span></article>
              <article><strong>{policyCount}</strong><span>政策文件</span></article>
            </div>
          </section>

          {timelinePreview.length ? (
            <Link className="news-prototype-side-link-card" href="/news/admission-timeline">
              <section className="news-prototype-side-card news-prototype-side-card-timeline">
                <p className="overview-label">先别错过时间</p>
                <div className="news-prototype-timeline-list">
                  {timelinePreview.map((item) => (
                    <article key={item.title} className="news-prototype-timeline-item">
                      <div className="news-prototype-timeline-meta">
                        <span className="pill">{item.examType === 'gaokao' ? '高考' : item.examType === 'zhongkao' ? '中考' : '入学'}</span>
                        <span className="news-prototype-timeline-window">{item.window}</span>
                      </div>
                      <h3>{item.title}</h3>
                    </article>
                  ))}
                </div>
              </section>
            </Link>
          ) : null}

          <Link className="news-prototype-side-link-card" href="/news/zhongkao-special">
            <section className="news-prototype-side-card news-prototype-side-card-zhongkao">
              <p className="overview-label">中招专题</p>
              <h3 className="news-prototype-side-title">孩子今年参加中考，先把这些关键事看明白</h3>
              <p className="news-prototype-side-description">报名怎么走、批次怎么看、录取顺序是什么，这一页帮你先把中招主线理清楚。</p>
            </section>
          </Link>

          <Link className="news-prototype-side-link-card" href="/news/gaokao-special">
            <section className="news-prototype-side-card news-prototype-side-card-gaokao">
              <p className="overview-label">高招专题</p>
              <h3 className="news-prototype-side-title">春考、高考、出分和录取，哪些节点最不能错过</h3>
              <p className="news-prototype-side-description">把高招阶段最容易让人慌的时间点和规则放在一起，方便你按顺序往下看。</p>
            </section>
          </Link>

          {conceptItems.length ? (
            <Link className="news-prototype-side-link-card" href="/news/policy-glossary">
              <section className="news-prototype-side-card news-prototype-side-card-glossary">
                <p className="overview-label">政策概念速查</p>
                <h3 className="news-prototype-side-title">{conceptItems[0].title}</h3>
                <p className="news-prototype-side-description">看新闻总被术语卡住，就先来这里。把词看懂了，后面的规则才不会越看越乱。</p>
              </section>
            </Link>
          ) : null}

          {faqBullets.length ? (
            <Link className="news-prototype-side-link-card" href="/news/policy-faq">
              <section className="news-prototype-side-card news-prototype-side-card-deep">
                <p className="overview-label">高频政策问答</p>
                <h3 className="news-prototype-side-title">最常见的疑问，先帮你问到点子上</h3>
                <p className="news-prototype-side-description">很多家长反复确认的，其实就是这几类问题。先看这里，能少走不少弯路。</p>
                <div className="news-prototype-faq-list">
                  {faqBullets.slice(0, 2).map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </section>
            </Link>
          ) : null}

          {deepPolicyItems.length ? (
            <Link className="news-prototype-side-link-card" href="/news/policy-deep-dive">
              <section className="news-prototype-side-card news-prototype-side-card-faq">
                <p className="overview-label">政策深读</p>
                <h3 className="news-prototype-side-title">{deepPolicyItems[0].title}</h3>
                <p className="news-prototype-side-description">想知道新闻背后的正式规则，就直接看这里。先抓关键文件，再判断今年到底变了什么。</p>
              </section>
            </Link>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
