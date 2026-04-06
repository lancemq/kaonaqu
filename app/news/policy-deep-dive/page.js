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

function buildPolicyLens(policy) {
  const title = String(policy.title || '');
  if (title.includes('招生工作') || title.includes('中招意见')) {
    return {
      label: '规则总盘',
      focus: '优先确认录取批次顺序、适用对象和不同招生类型的边界。',
      audience: '适合正在判断整体升学路径和批次差异的家庭。'
    };
  }
  if (title.includes('报名')) {
    return {
      label: '操作节点',
      focus: '先看报名资格、确认方式、时间窗口和材料要求。',
      audience: '适合已经进入报名或补报名阶段，需要立刻执行的人。'
    };
  }
  if (title.includes('特殊教育')) {
    return {
      label: '专项政策',
      focus: '重点确认申请条件、审核流程和评估确认环节。',
      audience: '适合需要判断专项通道是否适用的家庭。'
    };
  }
  return {
    label: '补充政策',
    focus: '先看摘要，再回到原文确认时间、资格和执行方式。',
    audience: '适合已经知道主题，但还想核对官方口径的人。'
  };
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
  const groupedEntries = Object.entries(groupedPolicies);

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-deep" aria-label="政策深读">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 政策深读</p>
              <h1>{currentYear} 上海政策不是越多越好，而是先读对几份。</h1>
              <p className="school-prototype-subtitle">这页把当年更关键的正式政策文件整理成“先读哪份、为什么先读、读的时候重点看什么”的深读入口，帮助你把新闻结论和官方规则真正对应起来。</p>
              <div className="news-special-hero-chips">
                <span>优先阅读清单</span>
                <span>阅读提示</span>
                <span>原文入口</span>
              </div>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#policy-list">查看政策列表</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card news-special-focus-card">
                <p className="overview-label">本页重点</p>
                <h2>重点不是把政策全文堆在一起，而是先帮你判断哪些文件最值得先读。</h2>
                <div className="news-special-focus-points">
                  <span>按阅读主题分组，不让政策混作一团</span>
                  <span>每份文件都提示“先看什么”</span>
                  <span>直接保留原文入口，便于核对口径</span>
                </div>
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
          <strong>{groupedEntries.length}</strong>
          <span>阅读主题</span>
        </article>
        <article>
          <strong>优先阅读</strong>
          <span>不是全文堆叠，而是先看关键文件</span>
        </article>
        <article>
          <strong>官方来源</strong>
          <span>保留原文入口，便于继续核对</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="policy-list">
        <section className="school-prototype-main">
          <section className="school-prototype-panel news-special-panel">
            <p className="overview-label">读法建议</p>
            <h2>读政策深度专题时，不建议按发布时间机械往下翻。</h2>
            <div className="news-special-brief-grid">
              <article className="news-special-brief-card">
                <span>01</span>
                <strong>先看总盘文件</strong>
                <p>先理解当年的总规则，再读报名、专项和补充类文件，效率更高。</p>
              </article>
              <article className="news-special-brief-card">
                <span>02</span>
                <strong>再看执行节点</strong>
                <p>所有带有报名、确认、缴费和录取安排的文件，都应该配合时间线一起看。</p>
              </article>
              <article className="news-special-brief-card">
                <span>03</span>
                <strong>最后核对原文</strong>
                <p>当你已经知道“结论”，要回到原文确认自己是否满足适用条件。</p>
              </article>
            </div>
          </section>

          {leadPolicy ? (
            <section className="school-prototype-panel news-glossary-panel news-special-panel">
              <p className="overview-label">优先阅读</p>
              <h2>{leadPolicy.title}</h2>
              <div className="news-special-lead-note">
                <p className="news-glossary-summary">{getPolicySummary(leadPolicy)}</p>
                <div className="news-special-annotation-grid">
                  <article>
                    <span>先看什么</span>
                    <p>{buildPolicyLens(leadPolicy).focus}</p>
                  </article>
                  <article>
                    <span>适合谁读</span>
                    <p>{buildPolicyLens(leadPolicy).audience}</p>
                  </article>
                </div>
              </div>
              <p>{buildReadingHint(leadPolicy)}</p>
              <div className="news-glossary-links">
                {leadPolicy.source?.url ? (
                  <a className="text-link" href={leadPolicy.source.url} target="_blank" rel="noreferrer">查看原文</a>
                ) : null}
              </div>
            </section>
          ) : null}

          {groupedEntries.map(([group, items]) => (
            <section key={group} id={`group-${group}`} className="school-prototype-panel news-glossary-panel news-special-panel">
              <div className="news-special-section-head">
                <div>
                  <p className="overview-label">{group}</p>
                  <h2>{group}</h2>
                </div>
                <p className="news-special-section-summary">这一组适合连续阅读同类规则，减少“把报名、批次和专项政策混在一起看”的理解成本。</p>
              </div>
              <div className="news-glossary-list">
                {items.map((item) => (
                  <article key={item.id} className="news-glossary-card news-special-card">
                    <div className="news-prototype-glossary-meta">
                      <span className="pill">{buildPolicyLens(item).label}</span>
                      <span>{item.publishedAt || '暂无日期'}</span>
                      <span>{item.source?.name || '官方来源'}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <div className="news-special-annotation-grid">
                      <article>
                        <span>核心内容</span>
                        <p className="news-glossary-summary">{getPolicySummary(item)}</p>
                      </article>
                      <article>
                        <span>先看什么</span>
                        <p>{buildPolicyLens(item).focus}</p>
                      </article>
                    </div>
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

        <aside className="school-prototype-side">
          <article className="school-prototype-side-card news-special-side-card">
            <p className="overview-label">推荐阅读顺序</p>
            {leadPolicy ? <p>{leadPolicy.title}</p> : null}
            {groupedEntries.map(([group]) => (
              <a key={group} className="school-prototype-side-link" href={`#group-${group}`}>
                {group}
              </a>
            ))}
          </article>

          <article className="school-prototype-side-card news-special-side-card news-special-side-card-dark">
            <p className="overview-label">配合阅读</p>
            <Link className="school-prototype-side-link" href="/news/admission-timeline">先查时间线</Link>
            <Link className="school-prototype-side-link" href="/news/policy-glossary">再看政策术语</Link>
            <Link className="school-prototype-side-link" href="/news/policy-faq">回到高频问答</Link>
          </article>
        </aside>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 政策深读专题页</span>
        <span>重点政策 / 原文入口</span>
      </footer>
    </SiteShell>
  );
}
