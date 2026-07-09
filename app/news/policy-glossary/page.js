import { Fragment } from 'react';
import Link from 'next/link';
import { createRequire } from 'module';
import {
  PolicyToolLabel,
  PolicyToolLinks,
  PolicyToolShell,
  PolicyToolSideCard
} from '../../../components/news-policy-tool-ui';
import policyGlossary from '../../../lib/policy-glossary';
import { getPolicyDetailHref } from '../../../lib/policy-detail';
import { readPolicyPlainText } from '../../../lib/policy-content-files.mjs';

const require = createRequire(import.meta.url);
const { loadDataStore } = require('../../../shared/data-store');

export const metadata = {
  title: '政策概念速查 | 考哪去',
  description: '集中查看上海升学常见政策术语与当年关键政策文件，包括中本贯通、名额到区、名额到校、自主招生录取等重点概念与官方政策原文。',
  alternates: { canonical: '/news/policy-glossary' }
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
      focus: '优先确认录取批次顺序、适用对象和不同招生类型的边界。'
    };
  }
  if (title.includes('报名')) {
    return {
      label: '操作节点',
      focus: '先看报名资格、确认方式、时间窗口和材料要求。'
    };
  }
  if (title.includes('特殊教育')) {
    return {
      label: '专项政策',
      focus: '重点确认申请条件、审核流程和评估确认环节。'
    };
  }
  return {
    label: '补充政策',
    focus: '先看摘要，再回到原文确认时间、资格和执行方式。'
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

function groupByPill(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.pill || '其他';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return Array.from(groups.entries());
}

function groupPoliciesByTopic(policies) {
  const grouped = policies.reduce((acc, item) => {
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
  return Object.entries(grouped);
}

export default async function PolicyGlossaryPage() {
  const { news } = await loadDataStore();
  const currentYear = getCurrentYear(news);
  const officialPolicies = news
    .filter((n) => n.newsType === 'policy')
    .filter((item) => isRenderablePolicy(item, currentYear))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));

  const policyGroups = groupPoliciesByTopic(officialPolicies);
  const groups = groupByPill(policyGlossary);

  const processSteps = [
    {
      label: '第一层',
      title: '自主招生录取',
      detail: '普通高中自主招生与中职校自主招生都在这一批次先完成。',
      related: ['市实验性示范性高中自主招生', '国际课程班和中外合作办学高中自主招生', '中本贯通', '五年一贯制', '中高职贯通', '中职校提前招生']
    },
    {
      label: '第二层',
      title: '名额分配综合评价录取',
      detail: '分为"名额到区"和"名额到校"，结合成绩与综合素质评价进行投档。',
      related: ['名额到区', '名额到校', '综合素质评价', '最低投档控制分数线']
    },
    {
      label: '第三层',
      title: '统一招生录取',
      detail: '前序批次未录取的学生进入这一层，重点看"1 至 15 志愿"和征求志愿。',
      related: ['1 至 15 志愿', '平行志愿', '征求志愿']
    }
  ];

  return (
    <PolicyToolShell
      variant="glossary"
      hero={{
        kicker: 'POLICY GLOSSARY',
        title: '政策概念速查',
        description: '把上海升学常见、容易混淆的政策概念与当年关键政策文件做成可快速定位的工具页，先建立概念地图，再回到政策原文继续判断。',
        stats: [
          { value: policyGlossary.length, label: '核心术语' },
          { value: officialPolicies.length, label: '当年政策' },
          { value: groups.length, label: '分类主题' },
          { value: 'MAP', label: '概念地图' }
        ]
      }}
    >
      <section className="policy-process-section">
        <PolicyToolLabel>PROCESS MAP</PolicyToolLabel>
        <h2>先把上海中招的"大顺序"看懂，再查术语会容易很多。</h2>
        <div className="policy-process-flow" aria-label="上海中招批次流程总览">
          {processSteps.map((step, index) => (
            <Fragment key={step.title}>
              <article className="policy-process-card">
                <p className="policy-process-label">{step.label}</p>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
                <div className="policy-process-tags">
                  {step.related.slice(0, 4).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
              {index < processSteps.length - 1 ? <div className="policy-process-arrow" aria-hidden="true">→</div> : null}
            </Fragment>
          ))}
        </div>
      </section>

      <section className="policy-glossary-list" id="policy-files">
        <PolicyToolLabel>POLICY FILES</PolicyToolLabel>
        <h2>{currentYear} 年政策文件</h2>
        {officialPolicies.length === 0 ? (
          <p>暂无当年可渲染的官方政策文件，请稍后再来查看。</p>
        ) : (
          policyGroups.map(([group, items]) => (
            <section key={group} className="policy-term-group">
              <div className="policy-tool-section-head">
                <div>
                  <PolicyToolLabel>{group}</PolicyToolLabel>
                  <h3>{group}</h3>
                </div>
                <p>这一组适合连续阅读同类规则，减少"把报名、批次和专项政策混在一起看"的理解成本。</p>
              </div>
              <div className="policy-term-stack">
                {items.map((item) => {
                  const priority = buildPolicyPriority(item);
                  const lens = buildPolicyLens(item);
                  return (
                    <Link key={item.id} href={getPolicyDetailHref(item)} className="policy-term-card">
                      <div className="policy-term-meta">
                        <span>{priority.tier} 级</span>
                        <span>{lens.label}</span>
                        <span>{item.publishedAt || '暂无日期'}</span>
                        <span>{item.source?.name || '官方来源'}</span>
                      </div>
                      <h4>{item.title}</h4>
                      <div className="policy-term-detail-grid">
                        <article>
                          <span>文件定位</span>
                          <p>{priority.description}</p>
                        </article>
                        <article>
                          <span>核心内容</span>
                          <p>{getPolicySummary(item)}</p>
                        </article>
                        <article>
                          <span>先看什么</span>
                          <p>{lens.focus}</p>
                        </article>
                      </div>
                      <p className="policy-term-source">{buildReadingHint(item)}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </section>

      <section className="policy-glossary-list" id="glossary-list">
        <PolicyToolLabel>TERMS</PolicyToolLabel>
        <h2>核心术语</h2>
        {groups.map(([pill, items]) => (
          <section key={pill} className="policy-term-group">
            <div className="policy-tool-section-head">
              <div>
                <PolicyToolLabel>{pill}</PolicyToolLabel>
                <h3>{pill === '职业教育' ? '职业教育相关概念' : pill === '录取批次' ? '录取批次相关概念' : `${pill}相关概念`}</h3>
              </div>
              <p>解决"这个词是什么意思、处在什么流程里、和其它词有什么差别"的问题。</p>
            </div>
            <div className="policy-term-stack">
              {items.map((item) => (
                <article key={item.title} id={`term-${item.title}`} className="policy-term-card">
                  <div className="policy-term-meta">
                    <span>{item.pill}</span>
                    <span>{item.date}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <div className="policy-term-detail-grid">
                    <article>
                      <span>一句理解</span>
                      <p>{item.summary}</p>
                    </article>
                    <article>
                      <span>关键规则</span>
                      <p>{item.detail}</p>
                    </article>
                  </div>
                  <p className="policy-term-source">{item.source}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="policy-tool-bottom-links">
        <PolicyToolSideCard label="继续查看" dark>
          <PolicyToolLinks links={[
            { label: '进入高频政策问答', href: '/news/policy-faq' },
            { label: '进入官方招生日程', href: '/news/admission-timeline' }
          ]} />
        </PolicyToolSideCard>
      </section>
    </PolicyToolShell>
  );
}
