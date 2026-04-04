import Link from 'next/link';
import { createRequire } from 'module';
import SiteShell from '../../../components/site-shell';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '政策深读 | 考哪去',
  description: '集中查看上海升学当年关键政策文件与解读，帮助家长和学生理解报名、录取、志愿和特殊招生相关规则。'
};

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

function getCurrentYear(items) {
  const years = items
    .map((item) => Number(item.year) || Number(String(item.publishedAt || '').slice(0, 4)) || 0)
    .filter(Boolean)
    .sort((a, b) => b - a);
  return years[0] || new Date().getFullYear();
}

function isRenderablePolicy(policy, currentYear) {
  const title = String(policy?.title || '').trim();
  if (!title || title === '上海市教育委员会') return false;
  const publishedYear = Number(policy?.year) || Number(String(policy?.publishedAt || '').slice(0, 4)) || 0;
  if (publishedYear !== currentYear) return false;
  return policy.source?.type === 'official' || String(policy.source?.name || '').includes('上海市教育委员会');
}

function getPolicySummary(policy) {
  const summary = sanitizePolicyText(policy.summary, policy.title);
  const content = sanitizePolicyText(policy.content, policy.title);
  return clipText(summary || content || '暂无摘要', 160);
}

function buildReadingHint(policy) {
  const title = String(policy.title || '');
  if (title.includes('招生工作') || title.includes('中招意见')) {
    return '这类文件更适合先看录取批次、分数线和招生计划，再结合学校和区县情况判断。';
  }
  if (title.includes('报名')) {
    return '这类文件优先关注报名资格、材料要求和时间节点，避免错过操作窗口。';
  }
  if (title.includes('特殊教育')) {
    return '这类文件建议结合具体申请条件和时间安排一起看，尤其注意评估和确认环节。';
  }
  return '建议先看摘要，再回到原文确认适用对象、关键时间和操作方式。';
}

export default async function PolicyDeepDivePage() {
  const { policies } = await loadDataStore();
  const currentYear = getCurrentYear(policies);
  const officialPolicies = policies
    .filter((item) => isRenderablePolicy(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const leadPolicy = officialPolicies[0] || null;
  const groupedPolicies = officialPolicies.reduce((acc, item) => {
    const bucket = item.title.includes('报名')
      ? '报名与资格'
      : item.title.includes('招生工作') || item.title.includes('中招意见')
        ? '招生与录取'
        : item.title.includes('特殊教育')
          ? '专项与特殊类型'
          : '其他政策';
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(item);
    return acc;
  }, {});

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-deep" aria-label="政策深读">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 政策深读</p>
              <h1>{currentYear} 上海升学政策深读</h1>
              <p className="school-prototype-subtitle">把当年更关键的政策文件集中整理，帮助家长和学生把新闻里的结论和官方规则对应起来。</p>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#policy-list">查看政策列表</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">本页重点</p>
                <h2>重点不是把政策全文堆在一起，而是先帮你看清哪些文件最值得先读。</h2>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-glossary-stats news-special-stats">
        <article>
          <strong>{officialPolicies.length}</strong>
          <span>当年政策</span>
        </article>
        <article>
          <strong>{Object.keys(groupedPolicies).length}</strong>
          <span>阅读主题</span>
        </article>
        <article>
          <strong>官方来源</strong>
          <span>优先收录教委公开口径</span>
        </article>
        <article>
          <strong>适合回看</strong>
          <span>可和新闻频道结合阅读</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="policy-list">
        <section className="school-prototype-main">
          {leadPolicy ? (
            <section className="school-prototype-panel news-glossary-panel news-special-panel">
              <p className="overview-label">优先阅读</p>
              <h2>{leadPolicy.title}</h2>
              <p className="news-glossary-summary">{getPolicySummary(leadPolicy)}</p>
              <p>{buildReadingHint(leadPolicy)}</p>
              <div className="news-glossary-links">
                {leadPolicy.source?.url ? (
                  <a className="text-link" href={leadPolicy.source.url} target="_blank" rel="noreferrer">查看原文</a>
                ) : null}
              </div>
            </section>
          ) : null}

          {Object.entries(groupedPolicies).map(([group, items]) => (
            <section key={group} className="school-prototype-panel news-glossary-panel news-special-panel">
              <p className="overview-label">{group}</p>
              <h2>{group}</h2>
              <div className="news-glossary-list">
                {items.map((item) => (
                  <article key={item.id} className="news-glossary-card news-special-card">
                    <div className="news-prototype-glossary-meta">
                      <span className="pill">{item.publishedAt || '暂无日期'}</span>
                      <span>{item.source?.name || '官方来源'}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className="news-glossary-summary">{getPolicySummary(item)}</p>
                    <p>{buildReadingHint(item)}</p>
                    <div className="news-glossary-links">
                      {item.source?.url ? (
                        <a className="text-link" href={item.source.url} target="_blank" rel="noreferrer">查看原文</a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 政策深读专题页</span>
        <span>重点政策 / 原文入口</span>
      </footer>
    </SiteShell>
  );
}
