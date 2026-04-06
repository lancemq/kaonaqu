import Link from 'next/link';
import SiteShell from '../../../components/site-shell';
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
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-glossary" aria-label="政策概念速查">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 政策概念速查</p>
              <h1>术语先弄懂，上海升学信息才不会越看越乱。</h1>
              <p className="school-prototype-subtitle">这页把最常见、最容易混淆的政策概念做成可快速定位的术语工具页，帮你先建立“概念地图”，再回到新闻和政策原文继续判断。</p>
              <div className="news-special-hero-chips">
                <span>录取批次</span>
                <span>职业教育通道</span>
                <span>术语不再混着看</span>
              </div>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#glossary-list">开始查看</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card news-special-focus-card">
                <p className="overview-label">这页最适合</p>
                <h2>读新闻时总能看见关键词，但还说不清它到底属于哪一段录取流程的人。</h2>
                <div className="news-special-focus-points">
                  <span>先知道术语是什么</span>
                  <span>再知道它会影响哪一类选择</span>
                  <span>最后回到官方口径核对规则</span>
                </div>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-glossary-stats news-special-stats">
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
          <span>读专题时可随时返回速查</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="glossary-list">
        <section className="school-prototype-main">
          <section className="school-prototype-panel news-special-panel">
            <p className="overview-label">建议阅读顺序</p>
            <h2>按这三个入口进入，会比从头到尾硬读更快。</h2>
            <div className="news-special-brief-grid">
              {quickStarts.map((item, index) => (
                <article key={item.title} className="news-special-brief-card">
                  <span>{`0${index + 1}`}</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="school-prototype-panel news-special-panel">
            <p className="overview-label">批次流程总览</p>
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

          <section className="school-prototype-panel news-special-panel">
            <div className="news-special-section-head">
              <div>
                <p className="overview-label">概念关系图</p>
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
            <section key={pill} className="school-prototype-panel news-glossary-panel news-special-panel">
              <div className="news-special-section-head">
                <div>
                  <p className="overview-label">{pill}</p>
                  <h2>{pill === '职业教育' ? '职业教育相关概念' : pill === '录取批次' ? '录取批次相关概念' : `${pill}相关概念`}</h2>
                </div>
                <p className="news-special-section-summary">这一组更适合解决“这个词是什么意思、处在什么流程里、和其它词有什么差别”的问题。</p>
              </div>
              <div className="news-glossary-list">
                {items.map((item) => (
                  <article key={item.title} id={`term-${item.title}`} className="news-glossary-card news-special-card">
                    <div className="news-prototype-glossary-meta">
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

        <aside className="school-prototype-side">
          <article className="school-prototype-side-card news-special-side-card">
            <p className="overview-label">先查这些词</p>
            {policyGlossary.slice(0, 5).map((item) => (
              <p key={item.title} className="news-special-side-term">{item.title}</p>
            ))}
          </article>

          <article className="school-prototype-side-card news-special-side-card news-special-side-card-dark">
            <p className="overview-label">继续查看</p>
            <Link className="school-prototype-side-link" href="/news/policy-faq">进入高频政策问答</Link>
            <Link className="school-prototype-side-link" href="/news/policy-deep-dive">进入政策深读</Link>
            <Link className="school-prototype-side-link" href="/news/admission-timeline">进入官方招生日程</Link>
          </article>
        </aside>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 政策概念速查专题页</span>
        <span>术语解释 / 官方口径</span>
      </footer>
    </SiteShell>
  );
}
