'use client';

import { useMemo, useState } from 'react';
import policyGlossary from '../lib/policy-glossary';
import { filterNews, formatConfidence, getNewsCategoryLabel } from '../lib/site-utils';

function EmptyState() {
  return (
    <div className="empty-state">
      <h3>暂无数据</h3>
      <p>当前条件下没有匹配结果。</p>
    </div>
  );
}

export default function NewsPageClient({ news, policies }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const visibleNews = useMemo(() => filterNews(news, activeFilter), [news, activeFilter]);
  const [headline, ...restNews] = visibleNews;

  return (
    <main className="layout">
      <section className="panel news-panel" id="news">
        <div className="section-heading">
          <h2>新闻动态</h2>
          <p>除考试新闻外，补充查看招生新闻和学校动态，头条位优先展示最近且最重要的更新。</p>
        </div>
        <div className="news-toolbar" aria-label="新闻分类筛选">
          {[
            ['all', '全部'],
            ['exam', '考试新闻'],
            ['admission', '招生新闻'],
            ['school', '学校动态']
          ].map(([value, label]) => (
            <button
              key={value}
              className={`news-filter${activeFilter === value ? ' news-filter-active' : ''}`}
              type="button"
              onClick={() => setActiveFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {headline ? (
          <>
            <div className="featured-news">
              <article className="featured-news-card">
                <div className="news-meta-row">
                  <span className="pill">{getNewsCategoryLabel(headline)}</span>
                  <span className="news-date">{headline.publishedAt || '暂无日期'}</span>
                </div>
                <h3>{headline.title}</h3>
                <p className="news-summary">{headline.summary || '暂无摘要'}</p>
                <p className="news-source">来源：{headline.source?.name || '未知'} · 可信度 {formatConfidence(headline.source?.confidence)}</p>
                {headline.source?.url ? <a className="text-link" href={headline.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
              </article>
            </div>
            <div className="news-grid">
              {restNews.slice(0, 5).map((item) => (
                <article key={item.id} className="news-card">
                  <div className="news-card-header">
                    <div className="news-meta-row">
                      <span className="pill">{getNewsCategoryLabel(item)}</span>
                      <span className="news-date">{item.publishedAt || '暂无日期'}</span>
                    </div>
                    <h3>{item.title}</h3>
                  </div>
                  <p className="news-summary">{item.summary || '暂无摘要'}</p>
                  <p className="news-source">来源：{item.source?.name || '未知'} · 可信度 {formatConfidence(item.source?.confidence)}</p>
                  {item.source?.url ? <a className="text-link" href={item.source.url} target="_blank" rel="noreferrer">查看原文</a> : null}
                </article>
              ))}
            </div>
          </>
        ) : <EmptyState />}
      </section>

      <section className="panel" id="policies">
        <div className="section-heading">
          <h2>政策信息</h2>
          <p>与考试新闻对应查看官方政策、报名通知和制度性文件。</p>
        </div>
        <div className="policy-list">
          {policies.length ? policies.map((policy) => (
            <article key={policy.id} className="policy-card">
              <div className="policy-card-header">
                <h3>{policy.title}</h3>
                <span className="pill">{policy.districtName || policy.district || '全市'}</span>
              </div>
              <p className="policy-summary">{policy.summary || '暂无摘要'}</p>
              <p className="policy-meta">{policy.year || ''}{policy.publishedAt ? ` | ${policy.publishedAt}` : ''}</p>
              <p className="policy-content">{policy.content || ''}</p>
              <p className="policy-source">来源：{policy.source?.name || '未知'} · 可信度 {formatConfidence(policy.source?.confidence)}</p>
            </article>
          )) : <EmptyState />}
        </div>
      </section>

      <section className="panel policy-glossary-panel" id="policy-glossary">
        <div className="section-heading">
          <h2>政策概念速查</h2>
          <p>把新闻里常见但容易混淆的招生术语集中解释，优先采用上海市教委和上海市教育考试院公开口径整理。</p>
        </div>
        <div className="policy-glossary">
          {policyGlossary.map((item) => (
            <article key={item.title} className="glossary-card">
              <div className="glossary-meta">
                <span className="pill">{item.pill}</span>
                <span className="glossary-date">{item.date}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="glossary-summary">{item.summary}</p>
              <p className="glossary-detail">{item.detail}</p>
              <p className="glossary-source">{item.source}</p>
              <div className="glossary-links">
                {item.links.map((link) => (
                  <a key={link.href} className="text-link" href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
