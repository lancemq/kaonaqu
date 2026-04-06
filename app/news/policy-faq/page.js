import Link from 'next/link';
import SiteShell from '../../../components/site-shell';

const faqGroups = [
  {
    title: '先确认自己是不是适用对象',
    label: '资格判断',
    summary: '很多家长一上来就找时间表，但真正决定能不能报、能不能填、能不能进某个批次的，往往是资格条件。',
    items: [
      {
        question: '看到一条招生通知后，第一步应该先看什么？',
        shortAnswer: '先看适用对象和报名资格，再看时间、材料和操作方式。',
        whyItMatters: '同一条政策未必适用于所有学生。比如“名额到校”只面向不选择生源初中在籍在读满 3 年的应届初三学生；返沪生、往届生和跨区报名的应届初三学生不能填报这类志愿。',
        nextStep: '先圈出“适用对象、学籍 / 户籍 / 在读要求、是否需要资格确认”这几段，再继续读时间和流程。'
      },
      {
        question: '哪些志愿要先有资格确认，不能直接填？',
        shortAnswer: '体艺类专项志愿和部分中职专业志愿，往往要先通过资格确认、面试或专业测试。',
        whyItMatters: '2026 年上海中招口径明确，区级优秀体育学生和艺术骨干学生要先通过区教育行政部门资格确认；中职校提前招生中，部分专业也要求先通过学校组织的面试或专业测试。',
        nextStep: '如果你看到“资格确认”“面试”“专业测试”这些词，就不要只看志愿数，先查前置条件是否已完成。'
      },
      {
        question: '中本贯通是不是所有完成中招报名的学生都能填？',
        shortAnswer: '不是。中本贯通原则上只招收完成中招报名的上海户籍学生。',
        whyItMatters: '很多家庭会把“中本贯通”误当成普通中职志愿的一种，但它既有户籍要求，也有分数门槛，录取学生的学业考试总成绩还须达到普通高中最低投档控制分数线。',
        nextStep: '如果你重点看职业教育通道，先把“中本贯通、五年一贯制、中高职贯通、中职校提前招生”的资格边界分别看清。'
      }
    ]
  },
  {
    title: '时间节点到底该怎么盯',
    label: '时间与确认',
    summary: '中招里容易出错的不是不知道“大概几月”，而是漏掉具体的操作窗口和确认环节。',
    items: [
      {
        question: '今年上海中招志愿填报是在成绩公布前还是后？',
        shortAnswer: '在学业考试后、成绩发布前进行。',
        whyItMatters: '这是 2026 年实施细则里非常明确的口径。很多家庭会习惯性以为“出分后再报”，但上海中招是先填报志愿，再等成绩和录取。',
        nextStep: '把“考试后、出分前填志愿”这条单独记下来，再去结合各区日程表看具体填报时间。'
      },
      {
        question: '网上填完志愿就算完成了吗？',
        shortAnswer: '不算。学生本人及监护人还须进行书面确认，网上填报的志愿方可生效。',
        whyItMatters: '很多家庭把“提交成功”误认为全部结束，但政策口径强调志愿必须经过书面确认才有效。漏掉这一环节，会直接影响后续录取。',
        nextStep: '做时间提醒时，把“网上填报”和“书面确认”拆成两件事，避免只记前者。'
      },
      {
        question: '哪些时间最值得提前单独保存？',
        shortAnswer: '资格确认、面试测试、志愿填报、书面确认、缴费和征求志愿这几类时间最值得单独保存。',
        whyItMatters: '这些节点都是会影响后续操作的“硬门槛”。它们比泛泛的政策发布时间更重要，也最容易因为只看新闻摘要而漏掉。',
        nextStep: '建议把时间整理成“事项 + 开始时间 + 截止时间 + 需要谁确认”的待办清单。'
      }
    ]
  },
  {
    title: '批次、志愿和投档最容易混的地方',
    label: '录取理解',
    summary: '家长常把“批次顺序”“志愿个数”“平行志愿”混成一件事，但它们其实是三套不同逻辑。',
    items: [
      {
        question: '自主招生、名额分配综合评价、统一招生，三者到底是什么关系？',
        shortAnswer: '它们是依次进行的三个录取批次，不是可以自由打乱顺序的三个入口。',
        whyItMatters: '2026 年口径明确，这三个批次按顺序录取。前一批次一旦正式录取，后一批次志愿自然失效，所以理解“先后关系”比单纯记住术语更重要。',
        nextStep: '先把这条顺序记成流程图：自主招生录取 → 名额分配综合评价录取 → 统一招生录取。'
      },
      {
        question: '平行志愿是不是等于“随便填几个都一样”？',
        shortAnswer: '不是。平行志愿影响的是同一批次内的排序和投档方式，不代表填报顺序可以完全不考虑。',
        whyItMatters: '2026 年上海中招中，名额到校、中本贯通、五年一贯制 / 中高职贯通、中职校提前招生都涉及平行志愿设置。理解错误，会影响对同批次风险和选择梯度的判断。',
        nextStep: '先分清“这是哪个批次”“这一批次有几个志愿”“是不是平行志愿”，再做取舍。'
      },
      {
        question: '征求志愿是不是一轮新的大录取？',
        shortAnswer: '不是。征求志愿是统一招生中的补充填报机会，通常出现在“1 至 15 志愿”未录取之后。',
        whyItMatters: '把征求志愿误认为“还有一轮完整重来”，容易高估选择空间。它本质上取决于是否还有剩余招生计划和专业名额。',
        nextStep: '看见征求志愿时，要先判断自己为什么进入这个阶段，再去看还有哪些剩余计划。'
      }
    ]
  },
  {
    title: '读通知时最该校准哪些口径',
    label: '信息校准',
    summary: '同一条消息会被学校、家长群、媒体和机构反复转述，真正该留底的是官方原文里的关键句。',
    items: [
      {
        question: '学校官网和考试院、教委口径不完全一致时，优先信谁？',
        shortAnswer: '优先以考试院和教育主管部门正式通知为准，学校官网作为执行层补充。',
        whyItMatters: '学校官网常会聚焦本校安排，但真正决定资格、志愿规则、投档方式和录取边界的，仍是市教委和市教育考试院的正式口径。',
        nextStep: '遇到分歧时，先保存官方原文里的关键句，再回学校通知核对本校时间、测试和材料要求。'
      },
      {
        question: '看政策时，哪些信息最值得摘抄保存？',
        shortAnswer: '适用对象、志愿类别、志愿数量、是否平行、是否需要确认、是否有分数门槛，这六类最值得摘抄。',
        whyItMatters: '它们决定的是“能不能报、怎么报、报完会怎样”，比新闻标题里的宏观结论更具操作价值。',
        nextStep: '建议以后读一条新通知时，都按这六项做摘录，形成自己的政策卡片。'
      },
      {
        question: '什么时候该从 FAQ 跳去概念速查或政策深读？',
        shortAnswer: '遇到术语卡住时去概念速查；想确认边界条件、原文规则和实际适用范围时去政策深读。',
        whyItMatters: 'FAQ 更适合解决“我先看什么、先做什么”的问题；但一旦要判断具体资格、批次边界和执行口径，就需要切换到更细的专题页。',
        nextStep: '先用 FAQ 建立判断顺序，再用概念速查和政策深读补足具体规则。'
      }
    ]
  }
];

const faqCalibrationCards = [
  {
    title: '先看资格',
    detail: '判断自己是不是适用对象，优先级高于看时间。'
  },
  {
    title: '再看批次',
    detail: '先弄清它属于哪一个录取批次，而不是只盯“能填几个志愿”。'
  },
  {
    title: '最后看确认',
    detail: '网上提交之后是否还要书面确认，往往决定操作是否真的完成。'
  }
];

const faqLinks = [
  { label: '回到新闻频道', href: '/news' },
  { label: '查看政策概念速查', href: '/news/policy-glossary' },
  { label: '查看政策深读', href: '/news/policy-deep-dive' },
  { label: '查看官方招生日程', href: '/news/admission-timeline' }
];

export const metadata = {
  title: '高频政策问答 | 考哪去',
  description: '集中查看上海升学中家长和学生最常问的政策问题，包括报名资格、时间节点、志愿规则、信息口径与下一步判断。'
};

export default function PolicyFaqPage() {
  const faqCount = faqGroups.reduce((count, group) => count + group.items.length, 0);

  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-special-hero news-special-hero-faq" aria-label="高频政策问答">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 高频政策问答</p>
              <h1>先把问题问准，上海升学政策才不会越看越慌。</h1>
              <p className="school-prototype-subtitle">这页按 2026 年上海市教委和市教育考试院公开口径，把家长最常遇到的资格、时间、批次和信息校准问题，整理成一套可直接行动的问答工具页。</p>
              <div className="news-special-hero-chips">
                <span>按 2026 公开口径校准</span>
                <span>资格先于时间</span>
                <span>问题直接指向下一步</span>
              </div>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#faq-list">开始查看问答</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card news-special-focus-card">
                <p className="overview-label">本页更适合</p>
                <h2>已经刷到政策消息，但还不确定先信谁、先看哪一句、先做哪一步的人。</h2>
                <div className="news-special-focus-points">
                  <span>把常见问题改写成判断顺序</span>
                  <span>优先校准容易误读的官方口径</span>
                  <span>帮助你决定下一步去哪个专题页继续看</span>
                </div>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-special-stats">
        <article>
          <strong>{faqCount}</strong>
          <span>校准问答</span>
        </article>
        <article>
          <strong>{faqGroups.length}</strong>
          <span>判断场景</span>
        </article>
        <article>
          <strong>按 2026 口径</strong>
          <span>围绕中招关键规则整理</span>
        </article>
        <article>
          <strong>适合先收藏</strong>
          <span>配合概念页与深读页一起看</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="faq-list">
        <section className="school-prototype-main">
          <section className="school-prototype-panel news-special-panel">
            <p className="overview-label">先校准这 3 件事</p>
            <h2>读上海升学政策前，先把这三条顺序记住。</h2>
            <div className="news-special-brief-grid">
              {faqCalibrationCards.map((item, index) => (
                <article key={item.title} className="news-special-brief-card">
                  <span>{`0${index + 1}`}</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          {faqGroups.map((group) => (
            <section key={group.title} className="school-prototype-panel news-special-panel">
              <div className="news-special-section-head">
                <div>
                  <p className="overview-label">{group.label}</p>
                  <h2>{group.title}</h2>
                </div>
                <p className="news-special-section-summary">{group.summary}</p>
              </div>
              <div className="news-special-faq-stack">
                {group.items.map((item, index) => (
                  <article key={item.question} className="news-special-faq-card">
                    <div className="news-special-faq-index">Q{index + 1}</div>
                    <div className="news-special-faq-body">
                      <h3>{item.question}</h3>
                      <p className="news-special-faq-answer">{item.shortAnswer}</p>
                      <div className="news-special-faq-meta">
                        <article>
                          <span>为什么重要</span>
                          <p>{item.whyItMatters}</p>
                        </article>
                        <article>
                          <span>下一步怎么做</span>
                          <p>{item.nextStep}</p>
                        </article>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <aside className="school-prototype-side">
          <article className="school-prototype-side-card news-special-side-card">
            <p className="overview-label">最常见误区</p>
            <p>把“看到通知”误当成“自己就一定适用”。</p>
            <p>只记志愿个数，不分批次顺序和平行志愿逻辑。</p>
            <p>网上填完就结束，漏掉书面确认。</p>
          </article>

          <article className="school-prototype-side-card news-special-side-card">
            <p className="overview-label">本页校准依据</p>
            <p>主要按 2026 年 2 月 27 日上海市教委《高中阶段学校招生工作的若干意见》与 2026 年 3 月 27 日《实施细则》问答整理。</p>
            <p>涉及志愿设置、平行志愿、征求志愿和中职校自主招生说明，也参考上海市教育考试院 2026 年公开口径。</p>
          </article>

          <article className="school-prototype-side-card news-special-side-card news-special-side-card-dark">
            <p className="overview-label">继续查看</p>
            {faqLinks.map((link) => (
              <Link key={link.href} className="school-prototype-side-link" href={link.href}>
                {link.label}
              </Link>
            ))}
          </article>
        </aside>
      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 高频政策问答专题页</span>
        <span>2026 官方口径校准 / 常见问题 / 下一步动作</span>
      </footer>
    </SiteShell>
  );
}
