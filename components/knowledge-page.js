import Link from 'next/link';
import GradeSubjectExplorer from './knowledge-grade-explorer';
import { buildKnowledgeNav, getGradeQuickLinks } from '../lib/knowledge-content.mjs';
import { MathBlock, renderInlineMath } from './knowledge-math';
import KnowledgeQuiz from './knowledge-quiz';
import { FREQ_LABELS } from '../lib/knowledge-meta.mjs';

const NAV_ITEMS = [
  { label: '首页', href: '/' },
  { label: '新闻', href: '/news' },
  { label: '学校', href: '/schools' },
  { label: '知识', href: '/knowledge' }
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

const GRADE_TOKEN_LABELS = {
  'grade-7': '七年级', 'grade-8': '八年级', 'grade-9': '九年级',
  'senior-1': '高一', 'senior-2': '高二', 'senior-3': '高三',
  grade7: '七年级', grade8: '八年级', grade9: '九年级',
  senior1: '高一', senior2: '高二', senior3: '高三'
};

function inferGradeLabel(page) {
  if (page?.grade && GRADE_TOKEN_LABELS[page.grade]) return GRADE_TOKEN_LABELS[page.grade];
  const title = page.title || '';
  const slug = page.slug || '';
  if (title.includes('七年级') || slug.includes('grade7') || slug.includes('grade-7')) return '七年级';
  if (title.includes('八年级') || slug.includes('grade8') || slug.includes('grade-8')) return '八年级';
  if (title.includes('九年级') || slug.includes('grade9') || slug.includes('grade-9')) return '九年级';
  if (title.includes('高一') || slug.includes('senior1') || slug.includes('senior-1')) return '高一';
  if (title.includes('高二') || slug.includes('senior2') || slug.includes('senior-2')) return '高二';
  if (title.includes('高三') || slug.includes('senior3') || slug.includes('senior-3')) return '高三';
  return '知识专题';
}

function MetaBadges({ difficulty, examFrequency }) {
  if (!difficulty && !examFrequency) return null;
  return (
    <div className="kb-badges">
      {difficulty ? (
        <span className="kb-badge kb-badge-diff" data-level={difficulty} title={`难度 ${difficulty}/5`}>
          <em>难度</em>
          {String('★'.repeat(difficulty))}
          <span className="kb-badge-dim">{String('☆'.repeat(5 - difficulty))}</span>
        </span>
      ) : null}
      {examFrequency ? (
        <span className={`kb-badge kb-badge-freq freq-${examFrequency}`}>
          <em>考频</em>
          {FREQ_LABELS[examFrequency] || examFrequency}
        </span>
      ) : null}
    </div>
  );
}

function SiteNav() {
  return (
    <header className="channel-nav">
      <Link className="channel-brand" href="/">
        <strong>考哪去</strong>
        <span>SHANGHAI EDUCATION</span>
      </Link>
      <nav className="channel-nav-links" aria-label="主导航">
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
    <div className="channel-kicker">
      <span />
      <em>{label}</em>
    </div>
  );
}

function ChannelHero({ page }) {
  const hero = page.hero || {};
  const stats = hero.stats?.length ? hero.stats : [
    { value: '40+', label: '学科档案' },
    { value: '7', label: '年级入口' },
    { value: '持续', label: '内容更新' }
  ];
  const kicker = hero.kicker || '知识体系';
  const title = hero.title || '知识专题';
  const summary = hero.summary || page.description;

  return (
    <section className="channel-hero">
      <div className="knowledge-hero-bg" />
      <div className="knowledge-hero-tint" />
      <div className="channel-hero-content">
        <div className="channel-hero-copy">
          <SectionKicker label={kicker} />
          <h1>{title}</h1>
          <p>{summary}</p>
        </div>
        <div className="channel-hero-stats" aria-label="知识频道统计">
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

function ChannelRibbons({ ribbons = [] }) {
  if (!ribbons.length) return null;
  return (
    <section className="knowledge-channel-ribbons" aria-label="学段概况">
      {ribbons.map((ribbon) => (
        <article key={ribbon.label}>
          <span>{ribbon.label}</span>
          <strong>{ribbon.title}</strong>
          <p>{ribbon.description}</p>
        </article>
      ))}
    </section>
  );
}

async function ChannelPage({ page }) {
  const nav = await buildKnowledgeNav();
  const sections = page.sections || [];
  return (
    <>
      <ChannelHero page={page} />
      <GradeSubjectExplorer nav={nav} />
      <ChannelRibbons ribbons={page.ribbons} />
      {sections.map((section) => <StructuredSection section={section} key={section.id} />)}
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
      <MetaBadges difficulty={page.difficulty} examFrequency={page.examFrequency} />
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
  const kicker = section.kicker || section.id.toUpperCase();
  if (section.type === 'list') {
    return (
      <section className="knowledge-section knowledge-list-section" id={section.id}>
        <SectionKicker label={kicker} />
        <h2>{section.title}</h2>
        <ul>
          {section.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    );
  }

  if (section.type === 'math') {
    return (
      <section className="knowledge-section knowledge-math-section" id={section.id}>
        <SectionKicker label={kicker} />
        <h2>{section.title}</h2>
        {section.intro ? (
          <p className="knowledge-math-intro">{renderInlineMath(section.intro)}</p>
        ) : null}
        <div className="knowledge-math-grid">
          {(section.equations || []).map((eq, i) => (
            <MathBlock key={i} tex={eq.tex} display={eq.display !== false} caption={eq.caption} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="knowledge-section knowledge-structured-grid-section" id={section.id}>
      <SectionKicker label={kicker} />
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
      {page.quizzes?.length ? (
        <KnowledgeQuiz questions={page.quizzes} slug={page.slug} />
      ) : null}
    </>
  );
}

function stageFromGrade(grade) {
  if (!grade) return null;
  if (grade.startsWith('grade')) return '初中';
  if (grade.startsWith('senior')) return '高中';
  return null;
}

function DetailSidebar({ page }) {
  const trail = getPageTrail(page);
  const meta = getSubjectMeta(page);
  const relatedPages = page.relatedPages?.length ? page.relatedPages : null;
  const stage = stageFromGrade(page.grade);
  const schoolHref = stage ? `/schools?stage=${encodeURIComponent(stage)}` : '/schools';
  const newsHref = '/news?filter=exam';
  return (
    <aside className="knowledge-detail-sidebar" aria-label="知识详情侧栏">
      <section>
        <SectionKicker label="RELATED" />
        {relatedPages ? (
          relatedPages.map((rel) => (
            <Link href={rel.href} key={rel.slug}><span>{rel.label}</span><em>→</em></Link>
          ))
        ) : (
          getGradeQuickLinks().filter((grade) => !grade.disabled).slice(1, 4).map((grade) => (
            <Link href={grade.href} key={grade.label}><span>{grade.label}</span><em>→</em></Link>
          ))
        )}
      </section>
      <section>
        <SectionKicker label="SCHOOLS" />
        <Link href={schoolHref}><span>{stage ? `查看${stage}学校` : '查看全部学校'}</span><em>→</em></Link>
      </section>
      <section>
        <SectionKicker label="NEWS" />
        <Link href={newsHref}><span>考试升学新闻</span><em>→</em></Link>
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
      <MetaBadges difficulty={page.difficulty} examFrequency={page.examFrequency} />
      <p>{heading.desc}</p>
      {page.updatedAt ? (
        <p className="knowledge-subject-updated">最后更新：{page.updatedAt}</p>
      ) : null}
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
  if (node.type === 'text') return renderInlineMath(node.text);

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
      {page.quizzes?.length ? (
        <KnowledgeQuiz questions={page.quizzes} slug={page.slug} />
      ) : null}
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
