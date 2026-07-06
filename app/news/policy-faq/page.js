import {
  PolicyToolLabel,
  PolicyToolLinks,
  PolicyToolShell,
  PolicyToolSideCard
} from '../../../components/news-policy-tool-ui';

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
        question: '什么时候该从 FAQ 跳去概念速查？',
        shortAnswer: '遇到术语卡住时去概念速查；想确认边界条件、原文规则和实际适用范围时，同样在概念速查页查看当年政策文件。',
        whyItMatters: 'FAQ 更适合解决”我先看什么、先做什么”的问题；但一旦要判断具体资格、批次边界和执行口径，就需要切换到更细的速查页，那里同时提供术语解释和当年政策原文入口。',
        nextStep: '先用 FAQ 建立判断顺序，再用概念速查补足具体规则与政策原文。'
      }
    ]
  },
  {
    title: '高考通道选择与规划',
    label: '高招通道',
    summary: '上海高考有春招、秋招、综合评价、强基计划等多条通道，不同通道的时间、录取规则和适用人群差异很大。',
    items: [
      {
        question: '春季高考和秋季高考可以同时参加吗？',
        shortAnswer: '可以同时报考，但春招一旦录取，自动放弃秋招资格。',
        whyItMatters: '很多家庭以为春招是"多一次机会，录取了还能选择"，但官方口径明确：被春招录取的考生，不再参加秋季高考。这意味着选择春招需要做好"一次定结果"的心理准备。',
        nextStep: '先评估自己的目标院校层次和模考水平，再判断春招是否值得投入复习精力。'
      },
      {
        question: '综合评价批次和强基计划，应该优先准备哪个？',
        shortAnswer: '强基计划定位基础学科，综评批次覆盖更广；两者不冲突，但侧重点和报名时间不同。',
        whyItMatters: '强基计划在 4 月报名、高考出分后校测，录取在提前批次之前；综合评价批次通常在 5 月前报名、高考后组织校测，录取在提前批次之前但晚于强基。两者不互斥，但报名材料、校测形式和录取规则差异很大，需要分别准备。',
        nextStep: '先确认自己是否有明确的基础学科兴趣（强基），再考虑是否适合综评的面试考核方式。'
      },
      {
        question: '高中学业水平考试的合格考和等级考有什么区别？',
        shortAnswer: '合格考决定毕业资格和等级考报名权，等级考成绩按等级折算后计入高考总分。',
        whyItMatters: '合格考覆盖所有学科，成绩只有合格/不合格，每年 1 月和 6 月开考。等级考只考六选三科目，每年 5 月一次，成绩按 A+ 到 E 共 11 档折算（满分 70 分）。先过合格考才能报等级考，这个顺序不能颠倒。',
        nextStep: '确认自己已选的三门等级考科目是否已通过合格考，未通过的要尽快补考。'
      },
      {
        question: '艺术类考生要关注哪些时间节点？',
        shortAnswer: '统考报名通常在 10 月、统考在 11-12 月、校考在 1-3 月，文化考试和普通高考相同。',
        whyItMatters: '艺术类升学路径有独立的统考和校考流程，时间线和普通类考生完全不同。很多家庭只关注 6 月高考，却忽略了 11-12 月的统考报名和考试安排。统考成绩合格是后续校考和志愿填报的基础条件。',
        nextStep: '把艺考统考时间、校考时间、文化考试时间分别标注到日历上，不要把艺考和普通高考混在同一条时间线里。'
      }
    ]
  },
  {
    title: '高考志愿填报与录取规则',
    label: '高招录取',
    summary: '高考志愿的批次设置、平行志愿规则和投档方式与中招有很大不同，最容易在理解上出错。',
    items: [
      {
        question: '上海高考本科批次是怎么划分的？投档顺序是什么？',
        shortAnswer: '本科批次按顺序依次为：强基计划 → 综合评价批次 → 零志愿批次 → 本科提前批次 → 本科普通批次。',
        whyItMatters: '批次顺序决定录取优先级。前一批次一旦录取，后续批次自动失效。2026 年上海高考本科批次仍然维持这一顺序框架。很多家长只盯本科普通批次，却忽略综合评价批次和提前批次的独立投档机会。',
        nextStep: '先建立完整的批次顺序图，再逐一确认自己是否符合各批次的报名资格。'
      },
      {
        question: '高考平行志愿和中招平行志愿是不是一样的逻辑？',
        shortAnswer: '核心逻辑一致（分数优先、遵循志愿、一轮投档），但志愿数量和批次结构不同。',
        whyItMatters: '上海高考本科普通批次可填报 24 个平行志愿（院校专业组），远多于中招的志愿数。理解平行志愿的关键在于：它不是 "志愿优先"，高分考生在所有志愿上都优先于低分考生。填志愿时要利用这一特点做梯度设计。',
        nextStep: '先用模考成绩模拟排序，理解 "冲稳保" 的梯度逻辑，再做正式志愿方案。'
      },
      {
        question: '高考录取中 "院校专业组" 是什么意思？',
        shortAnswer: '院校专业组是高考志愿填报和投档的基本单位，同一所高校不同专业组对应不同的选科要求和招生计划。',
        whyItMatters: '同一所大学可能设置多个专业组，每个专业组有不同的选科要求和录取分数线。填报时不是在 "选大学"，而是在 "选大学的某个专业组"。如果只记学校不记专业组，容易因选科不匹配而投档失败。',
        nextStep: '在查阅高校招生简章时，重点看目标专业的选科要求属于哪个专业组，而不是只看学校最低录取分。'
      }
    ]
  },
];

const readingRules = [
  {
    value: '01',
    title: '先看资格',
    detail: '判断自己是不是适用对象，优先级高于看时间。'
  },
  {
    value: '02',
    title: '再看批次',
    detail: '先弄清它属于哪一个录取批次，再判断志愿数量和投档方式。'
  },
  {
    value: '03',
    title: '最后留痕',
    detail: '把官方原文、确认窗口和下一步动作保存成自己的政策卡片。'
  }
];

const sideWarnings = [
  '只看标题，不核对适用对象和前置资格',
  '只记大概月份，漏掉填报、确认和测试窗口',
  '只记志愿个数，不分批次顺序和平行志愿逻辑'
];

const relatedLinks = [
  { label: '招生日程 →', href: '/news/admission-timeline' },
  { label: '政策概念速查 →', href: '/news/policy-glossary' }
];

export const metadata = {
  title: '上海中考高考政策问答 - 高频问题与录取规则 | 考哪去',
  description: '集中查看上海中考、高考升学中最常问的政策问题，包括报名资格、时间节点、志愿规则、高招通道选择、信息口径与下一步判断。'
};

export default function PolicyFaqPage() {
  const faqCount = faqGroups.reduce((count, group) => count + group.items.length, 0);
  const faqPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqGroups.flatMap((group) => group.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${item.shortAnswer} ${item.whyItMatters} ${item.nextStep}`
      }
    })))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
      />
      <PolicyToolShell
      variant="faq"
      hero={{
        kicker: 'POLICY FAQ',
        title: '政策问答',
        description: '按 2026 年上海市教委和市教育考试院公开口径，把中考和高招中最常遇到的资格、时间、批次和信息校准问题整理成行动问答。',
        stats: [
          { value: faqCount, label: '校准问答' },
          { value: faqGroups.length, label: '判断场景' },
          { value: '2026 口径', label: '中招 + 高招' },
          { value: '先收藏', label: '配合概念页与深读页' }
        ]
      }}
    >
      <section className="policy-faq-primer" aria-labelledby="policy-faq-primer-title">
        <PolicyToolLabel>READING ORDER</PolicyToolLabel>
        <h2 id="policy-faq-primer-title">读上海升学政策前，先把这三条顺序记住</h2>
        <div className="policy-faq-rule-grid">
          {readingRules.map((rule) => (
            <article key={rule.value}>
              <span>{rule.value}</span>
              <h3>{rule.title}</h3>
              <p>{rule.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="special-content policy-faq-content" id="faq-list">
        <section className="special-main">
          {faqGroups.map((group) => (
            <section key={group.title} className="policy-tool-section">
              <div className="policy-tool-section-head">
                <div>
                  <PolicyToolLabel>{group.label}</PolicyToolLabel>
                  <h2>{group.title}</h2>
                </div>
                <p>{group.summary}</p>
              </div>
              <div className="policy-faq-stack">
                {group.items.map((item, index) => (
                  <article key={item.question} className="policy-faq-card">
                    <div className="policy-faq-index">{`Q${String(index + 1).padStart(2, '0')}`}</div>
                    <div className="policy-faq-body">
                      <h3>{item.question}</h3>
                      <p className="policy-faq-answer">{item.shortAnswer}</p>
                      <div className="policy-faq-meta">
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
        <aside className="special-side policy-faq-side" aria-label="政策问答辅助信息">
          <PolicyToolSideCard dark label="COMMON MISREADS">
            <h2>最常见的三种误读</h2>
            <div className="policy-faq-warning-list">
              {sideWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </PolicyToolSideCard>
          <PolicyToolSideCard dark label="SOURCE">
            <h2>整理口径</h2>
            <p>主要按 2026 年上海市教委中招若干意见、实施细则问答，以及上海市教育考试院公开信息整理。</p>
            <p>涉及学校执行安排时，仍需回到学校通知核对材料、测试和确认要求。</p>
          </PolicyToolSideCard>
          <PolicyToolSideCard label="NEXT">
            <h2>继续校准</h2>
            <PolicyToolLinks links={relatedLinks} />
          </PolicyToolSideCard>
        </aside>
      </section>

      <section className="policy-faq-cta" aria-labelledby="policy-faq-cta-title">
        <PolicyToolLabel>WORKFLOW</PolicyToolLabel>
        <h2 id="policy-faq-cta-title">把问答变成可执行清单</h2>
        <p>先用本页确认判断顺序，再去概念速查页核对术语边界，最后把具体时间写入招生日程。政策不是背下来，而是拆成下一步动作。</p>
        <a href="/news/policy-glossary">进入政策概念速查</a>
      </section>
    </PolicyToolShell>
    </>
  );
}
