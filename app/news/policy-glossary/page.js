import Link from 'next/link';
import { NewsAerialFooter, NewsAerialHero, NewsAerialKicker, NewsAerialNav } from '../../../components/news-aerial-ui';
import policyGlossary from '../../../lib/policy-glossary';

export const metadata = {
  title: '政策概念速查 | 考哪去',
  description: '集中查看上海升学常见政策术语，包括中本贯通、名额到区、名额到校、自主招生录取等重点概念。'
};

function groupByPill(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.pill || '其他';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return Array.from(groups.entries());
}

export default function PolicyGlossaryPage() {
  const groups = groupByPill(policyGlossary);
  const quickStarts = [
    { title: '先看录取批次', detail: '如果你最困惑的是名额到区、名额到校、自招和统一招生的先后关系。' },
    { title: '再看职业教育', detail: '如果你在看中本贯通、五年一贯制、中高职贯通这些不同培养通道。' },
    { title: '最后回到新闻', detail: '概念看明白后，再去读专题和具体政策，会更容易判断自己适用哪条规则。' }
  ];
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
      detail: '分为“名额到区”和“名额到校”，结合成绩与综合素质评价进行投档。',
      related: ['名额到区', '名额到校', '综合素质评价', '最低投档控制分数线']
    },
    {
      label: '第三层',
      title: '统一招生录取',
      detail: '前序批次未录取的学生进入这一层，重点看“1 至 15 志愿”和征求志愿。',
      related: ['1 至 15 志愿', '平行志愿', '征求志愿']
    }
  ];
  const relationGroups = [
    {
      title: '先后关系',
      items: [
        '自主招生录取 → 名额分配综合评价录取 → 统一招生录取',
        '前一批次正式录取后，后一批次志愿自然失效'
      ]
    },
    {
      title: '资格前置',
      items: [
        '名额到校要先满足“在籍在读满 3 年”等资格条件',
        '区级优秀体育学生、艺术骨干学生要先完成资格确认',
        '中职校提前招生常常要先参加面试或专业测试'
      ]
    },
    {
      title: '投档理解',
      items: [
        '平行志愿影响同批次内的排序和投档方式',
        '最低投档控制分数线是进入投档范围的门槛，不是最终录取线',
        '征求志愿是统一招生中的补充填报机会，不是新的独立大批次'
      ]
    }
  ];

  return (
    <main className="news-special-aerial-page">
      <NewsAerialNav />
      <NewsAerialHero
        kicker="POLICY GLOSSARY"
        title="政策概念速查"
        description="把上海升学常见、容易混淆的政策概念做成可快速定位的术语工具页，先建立概念地图，再回到新闻和政策原文继续判断。"
      />

      <section className="news-special-aerial-stats">
        <article>
          <strong>{policyGlossary.length}</strong>
          <span>核心术语</span>
        </article>
        <article>
          <strong>{groups.length}</strong>
          <span>分类主题</span>
        </article>
        <article>
          <strong>先建概念地图</strong>
          <span>再去读新闻原文</span>
        </article>
        <article>
          <strong>适合反复回看</strong>
          <span>读专题时可随时进入速查</span>
        </article>
      </section>

      <section className="news-special-aerial-content" id="glossary-list">
        <section className="news-special-aerial-main">
          <section className="news-special-aerial-section">
            <NewsAerialKicker>建议阅读顺序</NewsAerialKicker>
            <h2>按这三个入口进入，会比从头到尾硬读更快。</h2>
            <div className="news-special-brief-grid">
              {quickStarts.map((item, index) => (
                <article key={item.title} className="news-special-aerial-card">
                  <span>{`0${index + 1}`}</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="news-special-aerial-section">
            <NewsAerialKicker>批次流程总览</NewsAerialKicker>
            <h2>先把上海中招的“大顺序”看懂，再查术语会容易很多。</h2>
            <div className="news-glossary-process-flow" aria-label="上海中招批次流程总览">
              {processSteps.map((step, index) => (
                <article key={step.title} className="news-glossary-process-card">
                  <p className="news-glossary-process-label">{step.label}</p>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                  <div className="news-glossary-process-tags">
                    {step.related.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  {index < processSteps.length - 1 ? <div className="news-glossary-process-arrow" aria-hidden="true">→</div> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="news-special-aerial-section">
            <div className="news-special-section-head">
              <div>
                <NewsAerialKicker>概念关系图</NewsAerialKicker>
                <h2>不是所有词都在同一个层级里，它们之间大致是这三种关系。</h2>
              </div>
              <p className="news-special-section-summary">把“批次”“资格”“投档方式”拆开理解，能明显减少术语混用和误判。</p>
            </div>
            <div className="news-glossary-relation-grid">
              {relationGroups.map((group) => (
                <article key={group.title} className="news-glossary-relation-card">
                  <h3>{group.title}</h3>
                  <div className="news-glossary-relation-list">
                    {group.items.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {groups.map(([pill, items]) => (
            <section key={pill} className="news-special-aerial-section">
              <div className="news-special-section-head">
                <div>
                  <NewsAerialKicker>{pill}</NewsAerialKicker>
                  <h2>{pill === '职业教育' ? '职业教育相关概念' : pill === '录取批次' ? '录取批次相关概念' : `${pill}相关概念`}</h2>
                </div>
                <p className="news-special-section-summary">这一组更适合解决“这个词是什么意思、处在什么流程里、和其它词有什么差别”的问题。</p>
              </div>
              <div className="news-special-aerial-stack">
                {items.map((item) => (
                  <article key={item.title} id={`term-${item.title}`} className="news-special-aerial-entry">
                    <div className="news-special-aerial-entry-meta">
                      <span className="pill">{item.pill}</span>
                      <span>{item.date}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <div className="news-special-annotation-grid">
                      <article>
                        <span>一句理解</span>
                        <p className="news-glossary-summary">{item.summary}</p>
                      </article>
                      <article>
                        <span>关键规则</span>
                        <p>{item.detail}</p>
                      </article>
                    </div>
                    <p className="news-glossary-source">{item.source}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <aside className="news-special-aerial-side">
          <article className="news-special-aerial-side-card">
            <NewsAerialKicker>先查这些词</NewsAerialKicker>
            {policyGlossary.slice(0, 5).map((item) => (
              <a key={item.title} className="school-prototype-side-link news-special-side-term" href={`#term-${item.title}`}>
                {item.title}
              </a>
            ))}
          </article>

          <article className="news-special-aerial-side-card is-dark">
            <NewsAerialKicker>继续查看</NewsAerialKicker>
            <Link className="news-special-aerial-side-link" href="/news/policy-faq">进入高频政策问答</Link>
            <Link className="news-special-aerial-side-link" href="/news/policy-deep-dive">进入政策深读</Link>
            <Link className="news-special-aerial-side-link" href="/news/admission-timeline">进入官方招生日程</Link>
          </article>
        </aside>

      </section>

      <NewsAerialFooter />
    </main>
  );
}
