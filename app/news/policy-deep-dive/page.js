import Link from 'next/link';
import { createRequire } from 'module';
import { NewsAerialFooter, NewsAerialHero, NewsAerialKicker, NewsAerialNav } from '../../../components/news-aerial-ui';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { readPolicyPlainText } from '../../../lib/policy-content-files.mjs';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '政策深读 | 考哪去',
  description: '集中查看上海升学当年关键政策文件与解读，帮助家长和学生理解报名、录取、志愿和特殊招生相关规则。',
  alternates: { canonical: '/news/policy-deep-dive' }
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
  const content = sanitizePolicyText(readPolicyPlainText(policy), policy.title);
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

function buildPolicyPriority(policy) {
  const title = String(policy.title || '');
  if (title.includes('招生工作的若干意见') || title.includes('高中阶段学校招生工作')) {
    return {
      tier: 'A',
      title: '先读总盘文件',
      description: '这是年度规则总盘，适合先建立当年中招框架。'
    };
  }
  if (title.includes('实施细则')) {
    return {
      tier: 'A',
      title: '再读实施细则',
      description: '它负责把总盘文件落到考试、志愿、投档和操作细节。'
    };
  }
  if (title.includes('中等职业学校自主招生')) {
    return {
      tier: 'B',
      title: '职业教育专项',
      description: '适合重点关注中本贯通、五年一贯制、中高职贯通和提前招生的家庭。'
    };
  }
  if (title.includes('特殊教育')) {
    return {
      tier: 'B',
      title: '特殊类型专项',
      description: '适合需要判断专项通道是否适用、如何评估和如何入学的家庭。'
    };
  }
  return {
    tier: 'C',
    title: '补充阅读',
    description: '适合在总盘和实施细则之后，用来核对边界条件和补充规则。'
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
  const readingStages = [
    {
      label: '第一步',
      title: '先读年度总盘',
      detail: '优先看 2026 年 2 月 27 日发布的《若干意见》，先把考试科目、录取批次和整体框架看清。'
    },
    {
      label: '第二步',
      title: '再读实施细则',
      detail: '再看 2026 年 3 月 20 日发布并于 3 月 27 日公开解读的《实施细则》，把志愿、投档、同分排序和确认环节对上。'
    },
    {
      label: '第三步',
      title: '最后看专项文件',
      detail: '根据家庭实际需求，再进入中职自主招生、特殊教育或其他专项文件，不用一开始把所有文件都读一遍。'
    }
  ];
  const calibrationNotes = [
    {
      title: '总盘文件不等于操作细则',
      detail: '《若干意见》负责定义年度框架，《实施细则》负责把考试、志愿和录取规则写实。读到具体操作问题时，要落回细则。'
    },
    {
      title: '新闻摘要不等于资格边界',
      detail: '很多新闻会先给结论，但真正决定是否适用的，仍是原文里的对象、条件、时间和确认要求。'
    },
    {
      title: '专项文件不是所有家庭都要通读',
      detail: '特殊教育、中职自主招生、体艺类专项更适合按需求进入，而不是和总盘文件混在一起看。'
    }
  ];

  return (
    <main className="news-special-aerial-page">
      <NewsAerialNav />
      <NewsAerialHero
        kicker="POLICY DEEP DIVE"
        title="政策深读"
        description="把关键正式政策文件整理成先读哪份、为什么先读、读的时候重点看什么的深读入口。"
      />

      <section className="news-special-aerial-stats">
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

      <section className="news-special-aerial-content" id="policy-list">
        <section className="news-special-aerial-main">
          <section className="news-special-aerial-section">
            <NewsAerialKicker>读法建议</NewsAerialKicker>
            <h2>读政策深度专题时，不建议按发布时间机械往下翻。</h2>
            <div className="news-special-brief-grid">
              {readingStages.map((stage, index) => (
                <article key={stage.title} className="news-special-aerial-card">
                  <span>{`0${index + 1}`}</span>
                  <strong>{stage.title}</strong>
                  <p>{stage.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="news-special-aerial-section">
            <div className="news-special-section-head">
              <div>
                <NewsAerialKicker>深读校准</NewsAerialKicker>
                <h2>先校准这 3 个阅读误区，深读才不会越看越乱。</h2>
              </div>
              <p className="news-special-section-summary">深读不是把文件越堆越多，而是先确认哪些文件定义框架，哪些文件负责执行，哪些文件只是专项补充。</p>
            </div>
            <div className="news-glossary-relation-grid">
              {calibrationNotes.map((item) => (
                <article key={item.title} className="news-glossary-relation-card">
                  <h3>{item.title}</h3>
                  <div className="news-glossary-relation-list">
                    <p>{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {leadPolicy ? (
            <section className="news-special-aerial-section">
              <NewsAerialKicker>优先阅读</NewsAerialKicker>
              <h2>{leadPolicy.title}</h2>
              <div className="news-special-hero-chips">
                <span>{buildPolicyPriority(leadPolicy).tier} 级优先级</span>
                <span>{buildPolicyPriority(leadPolicy).title}</span>
              </div>
              <div className="news-special-lead-note">
                <p className="news-glossary-summary">{getPolicySummary(leadPolicy)}</p>
                <div className="news-special-annotation-grid">
                  <article>
                    <span>先看什么</span>
                    <p>{buildPolicyLens(leadPolicy).focus}</p>
                  </article>
                </div>
              </div>
              <p>{buildReadingHint(leadPolicy)}</p>
              <div className="news-glossary-links">
                <Link className="text-link" href={getPolicyDetailHref(leadPolicy)}>查看详情</Link>
              </div>
            </section>
          ) : null}

          {groupedEntries.map(([group, items]) => (
            <section key={group} id={`group-${group}`} className="news-special-aerial-section">
              <div className="news-special-section-head">
                <div>
                  <NewsAerialKicker>{group}</NewsAerialKicker>
                  <h2>{group}</h2>
                </div>
                <p className="news-special-section-summary">这一组适合连续阅读同类规则，减少“把报名、批次和专项政策混在一起看”的理解成本。</p>
              </div>
              <div className="news-special-aerial-stack">
                {items.map((item) => (
                  <Link key={item.id} className="news-special-aerial-entry" href={getPolicyDetailHref(item)}>
                    <div className="news-special-aerial-entry-meta">
                      <span className="pill">{buildPolicyPriority(item).tier} 级</span>
                      <span className="pill">{buildPolicyLens(item).label}</span>
                      <span>{item.publishedAt || '暂无日期'}</span>
                      <span>{item.source?.name || '官方来源'}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <div className="news-special-annotation-grid">
                      <article>
                        <span>文件定位</span>
                        <p>{buildPolicyPriority(item).description}</p>
                      </article>
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
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </section>

        <aside className="news-special-aerial-side">
          <article className="news-special-aerial-side-card">
            <NewsAerialKicker>推荐阅读顺序</NewsAerialKicker>
            {leadPolicy ? <p>{leadPolicy.title}</p> : null}
            <p>2026 年 2 月 27 日：先看《若干意见》</p>
            <p>2026 年 3 月 20 日：再看《实施细则》</p>
            {groupedEntries.map(([group]) => (
              <a key={group} className="news-special-aerial-side-link" href={`#group-${group}`}>
                {group}
              </a>
            ))}
          </article>

          <article className="news-special-aerial-side-card">
            <NewsAerialKicker>本页校准依据</NewsAerialKicker>
            <p>核心依据包括 2026 年 2 月 27 日《上海市高中阶段学校招生工作的若干意见》、2026 年 3 月 20 日发布的《实施细则》、2026 年 3 月 26 日发布的中职自主招生通知，以及 2026 年 3 月 13 日发布的特殊教育高中阶段招生通知。</p>
          </article>

          <article className="news-special-aerial-side-card is-dark">
            <NewsAerialKicker>配合阅读</NewsAerialKicker>
            <Link className="news-special-aerial-side-link" href="/news/admission-timeline">先查时间线</Link>
            <Link className="news-special-aerial-side-link" href="/news/policy-glossary">再看政策术语</Link>
            <Link className="news-special-aerial-side-link" href="/news/policy-faq">查看高频问答</Link>
          </article>
        </aside>

      </section>

      <NewsAerialFooter />
    </main>
  );
}
