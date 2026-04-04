import Link from 'next/link';
import SiteShell from '../../../components/site-shell';

const faqBullets = [
  {
    question: '看到报名通知后，第一步先看什么？',
    answer: '先看自己是否具备报名资格，再看报名时间、确认方式和材料要求。'
  },
  {
    question: '学校官网和考试院、教委口径不完全一致时该信谁？',
    answer: '优先以考试院和教育主管部门的正式通知为准，再把学校官网当作执行层补充。'
  },
  {
    question: '哪些信息最值得提前保存？',
    answer: '报名资格、缴费节点、志愿填报时间、成绩公布和确认安排，通常是最容易影响后续操作的内容。'
  }
];

export const metadata = {
  title: '高频政策问答 | 考哪去',
  description: '集中查看上海升学中家长和学生最常问的政策问题，包括报名资格、时间节点、信息口径等常见疑问。'
};

export default function PolicyFaqPage() {
  return (
    <SiteShell hideKnowledgeNav>
      <header className="hero">
        <section className="search-panel school-prototype-hero news-glossary-hero news-special-hero news-special-hero-faq" aria-label="高频政策问答">
          <div className="school-prototype-hero-grid">
            <div className="school-prototype-hero-main">
              <p className="overview-label">新闻政策 / 高频政策问答</p>
              <h1>上海升学高频政策问答</h1>
              <p className="school-prototype-subtitle">把家长和学生最常问的报名、资格、时间节点和信息口径问题集中整理，方便快速查看。</p>
              <div className="school-prototype-action-row">
                <Link className="action-button" href="/news">返回新闻频道</Link>
                <a className="action-button action-button-secondary" href="#faq-list">开始查看</a>
              </div>
            </div>
            <aside className="school-prototype-hero-side">
              <article className="school-prototype-focus-card">
                <p className="overview-label">适合先看</p>
                <h2>想先弄清报名资格、时间节点、信息来源优先级这些实际问题的家长和学生。</h2>
              </article>
            </aside>
          </div>
        </section>
      </header>

      <section className="school-prototype-stats news-glossary-stats news-special-stats">
        <article>
          <strong>{faqBullets.length}</strong>
          <span>高频问题</span>
        </article>
        <article>
          <strong>报名 / 资格</strong>
          <span>覆盖主要疑问</span>
        </article>
        <article>
          <strong>适合收藏</strong>
          <span>查政策时可随时回看</span>
        </article>
        <article>
          <strong>继续阅读</strong>
          <span>可跳转政策与日程专题</span>
        </article>
      </section>

      <main className="layout school-prototype-layout news-special-layout" id="faq-list">
        <section className="school-prototype-main">
          <section className="school-prototype-panel news-glossary-panel news-special-panel">
            <p className="overview-label">高频政策问答</p>
            <h2>先把最常见的问题看清楚，再去读术语和原文，会更容易理解。</h2>
            <div className="news-glossary-list">
              {faqBullets.map((item) => (
                <article key={item.question} className="news-glossary-card news-special-card">
                  <h3>{item.question}</h3>
                  <p className="news-glossary-summary">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </section>

      </main>

      <footer className="prototype-page-footer">
        <span>上海升学观察 / 高频政策问答专题页</span>
        <span>常见问题 / 快速答案</span>
      </footer>
    </SiteShell>
  );
}
