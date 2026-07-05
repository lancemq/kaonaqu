import Link from 'next/link';
import GradeSubjectExplorer from './knowledge-grade-explorer';

const NAV_ITEMS = [
  { label: '首页', href: '/' },
  { label: '新闻', href: '/news' },
  { label: '学校', href: '/schools' },
  { label: '知识', href: '/knowledge' }
];

const GRADE_RIBBON = [
  { label: '六年级', desc: '小升初衔接 · 基础巩固', href: '/knowledge/grade-7', disabled: true },
  { label: '七年级', desc: '能力提升 · 拓展思维', href: '/knowledge/grade-7' },
  { label: '八年级', desc: '关键学年 · 备战中考', href: '/knowledge/grade-8', featured: true },
  { label: '九年级', desc: '中考冲刺 · 全面复习', href: '/knowledge/grade-9' },
  { label: '高一', desc: '选科规划 · 打好基础', href: '/knowledge/senior-1' },
  { label: '高二', desc: '深化学习 · 备战等级考', href: '/knowledge/senior-2' },
  { label: '高三', desc: '高考冲刺 · 志愿指导', href: '/knowledge/senior-3' }
];

const LEARNING_PATHS = [
  { title: '中考数学满分路径', desc: '从基础巩固到压轴突破的系统学习方案', meta: '6 阶段 · 32 讲', href: '/knowledge/math-grade9' },
  { title: '物理入门到精通', desc: '零基础掌握八年级物理核心概念与实验', meta: '实验 · 公式 · 例题', href: '/knowledge/physics-grade8' },
  { title: '英语阅读理解进阶', desc: '完形填空与阅读理解题型分类突破指南', meta: '题型训练 · 写作', href: '/knowledge/english-grade8' },
  { title: '文言文通关攻略', desc: '课内文言文精讲与课外阅读拓展训练', meta: '古诗文 · 翻译', href: '/knowledge/chinese-grade8' }
];

const HOT_TOPICS = [
  { count: '24 讲', title: '中考数学压轴题突破', desc: '函数综合与几何证明', href: '/knowledge/math-grade9' },
  { count: '18 讲', title: '初中物理实验大全', desc: '操作要点与数据处理', href: '/knowledge/physics-grade9' },
  { count: '15 讲', title: '英语满分作文模板', desc: '常考主题与表达升级', href: '/knowledge/english-grade9' },
  { count: '12 讲', title: '化学方程式配平', desc: '守恒思想与计算基础', href: '/knowledge/chemistry-grade9' }
];

const EXAM_TIPS = [
  { title: '制定科学的复习计划', desc: '按周拆分章节、题型和错题订正，不把所有任务堆到考前。' },
  { title: '建立错题本系统', desc: '记录错因、对应知识点和同类题，复习时优先处理重复错误。' },
  { title: '模拟考试环境训练', desc: '固定时间、固定顺序完成整卷，训练稳定输出和时间分配。' }
];

const RECENT_UPDATES = [
  '二次函数压轴题精讲新增 6 道真题解析',
  '物理电学实验专题更新操作视频',
  '中考英语听力新增2025年真题训练',
  '九年级化学方程式配平技巧上线',
  '初中数学几何辅助线专题全面升级'
];

function getKnowledgePageKind(page) {
  if (page.slug === 'index') return 'channel';
  if (page.slug?.startsWith('grade-') || page.slug?.startsWith('senior-')) return 'grade';
  return 'subject';
}

function textFromNodes(nodes = []) {
  return nodes.map((node) => {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    return textFromNodes(node.children);
  }).join('').trim();
}

function createAnchorId(label, index) {
  const normalized = String(label || '')
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  return `knowledge-${index}-${normalized || 'section'}`;
}

function collectRichAnchors(nodes = [], { limit = 8, includeTags = ['h2', 'h3'] } = {}) {
  const anchors = [];
  let headingIndex = 0;
  const includedTags = new Set(includeTags);

  function visit(node) {
    if (!node || anchors.length >= limit) return;
    if (['h2', 'h3'].includes(node.tag)) {
      const label = textFromNodes(node.children);
      if (label) {
        headingIndex += 1;
        if (includedTags.has(node.tag)) {
          anchors.push({ href: `#${node.id || createAnchorId(label, headingIndex)}`, label });
        }
      }
    }
    node.children?.forEach(visit);
  }

  nodes.forEach(visit);
  return anchors;
}

function getPageTrail(page) {
  if (page.renderMode === 'structured') {
    return (page.sections || []).map((section) => ({
      href: `#${section.id}`,
      label: section.title
    }));
  }
  return collectRichAnchors(page.richBlocks, { limit: 12, includeTags: ['h2'] });
}

function getPageHeading(page) {
  const header = page.richBlocks?.find((block) => block.className === 'page-header');
  const h1 = header?.children?.find((node) => node.tag === 'h1');
  const p = header?.children?.find((node) => node.tag === 'p');
  const rawTitle = textFromNodes(h1?.children) || page.title || '知识详情';
  return {
    title: rawTitle.replace(/\s*\|\s*考哪去\s*$/, ''),
    desc: textFromNodes(p?.children) || page.description
  };
}

function getSubjectMeta(page) {
  const summary = page.richBlocks?.find((block) => block.className === 'subject-summary');
  const items = summary?.children?.map((item) => {
    const label = textFromNodes(item.children?.find((child) => child.className === 'summary-label')?.children);
    const value = textFromNodes(item.children?.find((child) => child.className === 'summary-value')?.children);
    return label && value ? { label, value } : null;
  }).filter(Boolean) || [];

  if (items.length) return items.slice(0, 4);

  const anchors = collectRichAnchors(page.richBlocks, { limit: 4, includeTags: ['h2'] });
  return [
    { label: '专题数量', value: String(Math.max(anchors.length, 1)) },
    { label: '知识点', value: '持续更新' },
    { label: '适用阶段', value: inferGradeLabel(page) },
    { label: '阅读方式', value: '章节复盘' }
  ];
}

function inferGradeLabel(page) {
  const title = page.title || '';
  const slug = page.slug || '';
  if (title.includes('七年级') || slug.includes('grade7')) return '七年级';
  if (title.includes('八年级') || slug.includes('grade8')) return '八年级';
  if (title.includes('九年级') || slug.includes('grade9')) return '九年级';
  if (title.includes('高一') || slug.includes('senior1')) return '高一';
  if (title.includes('高二') || slug.includes('senior2')) return '高二';
  if (title.includes('高三') || slug.includes('senior3')) return '高三';
  return '知识专题';
}

function SiteNav() {
  return (
    <header className="knowledge-site-nav">
      <Link className="knowledge-brand" href="/">
        <strong>考哪去</strong>
        <span>SHANGHAI EDUCATION</span>
      </Link>
      <nav className="knowledge-nav-links" aria-label="主导航">
        {NAV_ITEMS.map((item) => (
          <Link className={item.href === '/knowledge' ? 'is-active' : undefined} href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="knowledge-footer">
      <div>
        <strong>考哪去</strong>
        <span>SHANGHAI EDUCATION PLATFORM</span>
      </div>
      <p>© 2026 考哪去</p>
    </footer>
  );
}

function ColorBlocks() {
  return (
    <div className="channel-color-bar" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function SectionKicker({ label }) {
  return (
    <div className="knowledge-section-kicker">
      <span />
      <em>{label}</em>
    </div>
  );
}

function ChannelHero({ page }) {
  const stats = page.hero?.stats?.length ? page.hero.stats : [
    { value: '40+', label: '学科档案' },
    { value: '6', label: '年级入口' },
    { value: '持续', label: '内容更新' }
  ];

  return (
    <section className="knowledge-channel-hero">
      <div className="knowledge-hero-bg" />
      <div className="knowledge-hero-tint" />
      <div className="knowledge-hero-content">
        <div className="knowledge-hero-copy">
          <SectionKicker label="KNOWLEDGE SYSTEM" />
          <h1>知识专题</h1>
          <p>{page.hero?.summary || page.description}</p>
        </div>
        <div className="knowledge-hero-stats" aria-label="知识频道统计">
          {stats.slice(0, 3).map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LearningPaths() {
  return (
    <section className="knowledge-section knowledge-learning-zone">
      <div className="knowledge-section-head">
        <SectionKicker label="LEARNING PATHS" />
        <Link href="/knowledge/grade-8">查看全部 →</Link>
      </div>
      <h2>学习路径</h2>
      <div className="knowledge-path-grid">
        {LEARNING_PATHS.map((path) => (
          <Link className="knowledge-path-card" href={path.href} key={path.title}>
            <strong>{path.title}</strong>
            <p>{path.desc}</p>
            <span>{path.meta}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HotTopics() {
  return (
    <section className="knowledge-section knowledge-hot-zone">
      <SectionKicker label="HOT TOPICS" />
      <h2>热门专题</h2>
      <div className="knowledge-hot-grid">
        {HOT_TOPICS.map((topic) => (
          <Link className="knowledge-hot-card" href={topic.href} key={topic.title}>
            <span>{topic.count}</span>
            <strong>{topic.title}</strong>
            <p>{topic.desc}</p>
            <em>查看 →</em>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ExamTips() {
  return (
    <section className="knowledge-exam-zone">
      <div className="knowledge-tips-main">
        <SectionKicker label="EXAM TIPS" />
        <h2>备考锦囊</h2>
        <p>来自一线教师和学霸的实战备考经验，帮你高效规划学习路径。</p>
        <div className="knowledge-tip-list">
          {EXAM_TIPS.map((tip) => (
            <article key={tip.title}>
              <span />
              <div>
                <strong>{tip.title}</strong>
                <p>{tip.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <aside className="knowledge-updates-card">
        <SectionKicker label="RECENT UPDATES" />
        <h3>最新更新</h3>
        {RECENT_UPDATES.map((item) => (
          <p key={item}><span>·</span>{item}</p>
        ))}
      </aside>
    </section>
  );
}

function ChannelPage({ page }) {
  return (
    <>
      <ChannelHero page={page} />
      <GradeSubjectExplorer />
      <LearningPaths />
      <HotTopics />
      <ExamTips />
    </>
  );
}

function GradeHero({ page }) {
  const stats = page.hero?.stats || [];
  return (
    <section className="knowledge-grade-hero">
      <div className="knowledge-breadcrumbs">
        <Link href="/">首页</Link><span>/</span><Link href="/knowledge">知识</Link><span>/</span><em>{page.breadcrumbItems?.at(-1)?.label || inferGradeLabel(page)}</em>
      </div>
      <SectionKicker label="GRADE OVERVIEW" />
      <h1>{page.hero?.title || page.title.replace(' | 考哪去', '')}</h1>
      <p>{page.hero?.summary || page.description}</p>
      {stats.length ? (
        <div className="knowledge-grade-stats">
          {stats.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <p>{stat.description}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function StructuredSection({ section }) {
  if (section.type === 'list') {
    return (
      <section className="knowledge-section knowledge-list-section" id={section.id}>
        <SectionKicker label={section.id.toUpperCase()} />
        <h2>{section.title}</h2>
        <ul>
          {section.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    );
  }

  return (
    <section className="knowledge-section knowledge-structured-grid-section" id={section.id}>
      <SectionKicker label={section.id.toUpperCase()} />
      <h2>{section.title}</h2>
      <div className={section.type === 'cardGrid' ? 'knowledge-card-grid' : 'knowledge-overview-grid'}>
        {section.cards.map((card, index) => {
          const content = (
            <>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{card.title}</strong>
              {card.status ? <em>{card.status}</em> : null}
              <p>{card.description}</p>
            </>
          );
          return card.href ? (
            <Link className="knowledge-index-card" href={card.href} key={card.title}>{content}</Link>
          ) : (
            <article className="knowledge-index-card" key={card.title}>{content}</article>
          );
        })}
      </div>
    </section>
  );
}

function GradePage({ page }) {
  return (
    <>
      <GradeHero page={page} />
      {page.header ? (
        <section className="knowledge-grade-intro">
          <h2>{page.header.title}</h2>
          <p>{page.header.description}</p>
          <div>
            {page.header.actions?.map((action) => (
              <Link href={action.href} key={action.href}>{action.label}</Link>
            ))}
          </div>
        </section>
      ) : null}
      {page.ribbons?.length ? (
        <section className="knowledge-grade-focus">
          {page.ribbons.map((ribbon) => (
            <article key={ribbon.label}>
              <span>{ribbon.label}</span>
              <strong>{ribbon.title}</strong>
              <p>{ribbon.description}</p>
            </article>
          ))}
        </section>
      ) : null}
      {page.sections.map((section) => <StructuredSection section={section} key={section.id} />)}
    </>
  );
}

function DetailSidebar({ page }) {
  const trail = getPageTrail(page);
  const meta = getSubjectMeta(page);
  return (
    <aside className="knowledge-detail-sidebar" aria-label="知识详情侧栏">
      <section>
        <SectionKicker label="RELATED" />
        {GRADE_RIBBON.filter((grade) => !grade.disabled).slice(1, 4).map((grade) => (
          <Link href={grade.href} key={grade.label}><span>{grade.label}</span><em>→</em></Link>
        ))}
      </section>
      <section className="is-dark">
        <SectionKicker label="QUICK ACCESS" />
        <h2>快速入口</h2>
        {trail.slice(0, 5).map((item) => (
          <a href={item.href} key={`${item.href}-${item.label}`}>{item.label}</a>
        ))}
      </section>
      <section>
        <SectionKicker label="KEY FACTS" />
        {meta.slice(0, 3).map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>
    </aside>
  );
}

function SubjectHeader({ page }) {
  const heading = getPageHeading(page);
  const meta = getSubjectMeta(page);
  return (
    <section className="knowledge-subject-header">
      <div className="knowledge-breadcrumbs">
        <Link href="/">首页</Link><span>/</span><Link href="/knowledge">知识</Link><span>/</span><em>{inferGradeLabel(page)}</em>
      </div>
      <div className="knowledge-subject-title-row">
        <span>{inferGradeLabel(page)}</span>
        <h1>{heading.title}</h1>
      </div>
      <p>{heading.desc}</p>
      <div className="knowledge-subject-stats">
        {meta.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function RichTextNodes({ nodes = [], headingState }) {
  return nodes.map((node, index) => (
    <RichTextNode
      headingState={headingState}
      node={node}
      key={`${node.type}-${node.tag || 'text'}-${index}`}
    />
  ));
}

function RichTextNode({ headingState, node }) {
  if (!node) return null;
  if (node.type === 'text') return node.text;

  const children = <RichTextNodes headingState={headingState} nodes={node.children} />;
  const props = {};
  if (node.className) props.className = node.className;
  if (node.id) props.id = node.id;
  if (node['aria-label']) props['aria-label'] = node['aria-label'];
  if (!props.id && ['h2', 'h3'].includes(node.tag)) {
    const label = textFromNodes(node.children);
    if (label && headingState) {
      headingState.count += 1;
      props.id = createAnchorId(label, headingState.count);
    }
  }

  if (node.tag === 'a') {
    const href = node.href || '#';
    if (href.startsWith('/')) return <Link {...props} href={href}>{children}</Link>;
    return <a {...props} href={href} target={node.target} rel={node.rel || (node.target === '_blank' ? 'noopener noreferrer' : undefined)}>{children}</a>;
  }

  switch (node.tag) {
    case 'article': return <article {...props}>{children}</article>;
    case 'aside': return <aside {...props}>{children}</aside>;
    case 'br': return <br />;
    case 'code': return <code {...props}>{children}</code>;
    case 'div': return <div {...props}>{children}</div>;
    case 'h1': return <h1 {...props}>{children}</h1>;
    case 'h2': return <h2 {...props}>{children}</h2>;
    case 'h3': return <h3 {...props}>{children}</h3>;
    case 'h4': return <h4 {...props}>{children}</h4>;
    case 'h5': return <h5 {...props}>{children}</h5>;
    case 'li': return <li {...props}>{children}</li>;
    case 'ol': return <ol {...props}>{children}</ol>;
    case 'p': return <p {...props}>{children}</p>;
    case 'section': return <section {...props}>{children}</section>;
    case 'span': return <span {...props}>{children}</span>;
    case 'strong': return <strong {...props}>{children}</strong>;
    case 'em': return <em {...props}>{children}</em>;
    case 'table': return <table {...props}>{children}</table>;
    case 'thead': return <thead {...props}>{children}</thead>;
    case 'tbody': return <tbody {...props}>{children}</tbody>;
    case 'td': return <td {...props}>{children}</td>;
    case 'th': return <th {...props}>{children}</th>;
    case 'tr': return <tr {...props}>{children}</tr>;
    case 'ul': return <ul {...props}>{children}</ul>;
    default: return null;
  }
}

function SubjectPage({ page }) {
  const headingState = { count: 0 };
  const articleBlocks = (page.richBlocks || []).filter((block) => !['page-header', 'subject-summary'].includes(block.className));

  return (
    <>
      <SubjectHeader page={page} />
      <section className="knowledge-detail-body">
        <article className="knowledge-detail-main">
          <RichTextNodes headingState={headingState} nodes={articleBlocks} />
        </article>
        <DetailSidebar page={page} />
      </section>
    </>
  );
}

export default function KnowledgePage({ page }) {
  const pageKind = getKnowledgePageKind(page);

  return (
    <main className={`knowledge-page knowledge-page-${pageKind}`} data-knowledge-slug={page.slug}>
      <SiteNav />
      {pageKind === 'channel' ? <ChannelPage page={page} /> : null}
      {pageKind === 'grade' ? (page.renderMode === 'structured' ? <GradePage page={page} /> : <SubjectPage page={page} />) : null}
      {pageKind === 'subject' ? <SubjectPage page={page} /> : null}
      <ColorBlocks />
      <Footer />
    </main>
  );
}
