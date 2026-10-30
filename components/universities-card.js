// 高校列表卡片（server 组件）：DOM 结构与 SchoolsCard 完全同款
// （schools-aerial-card-wrap / -card / -main / -side / -foot），样式由
// styles/pages/schools-detail.css 原样接管，本频道零自建 CSS。
// 学校卡 foot 左为录取线、右为「加入对比」；高校无对比能力，改为左「创办年份」右「隶属」，
// 保留同一视觉节奏（同高、同底色、同字号），不做新的外观。
import Link from 'next/link';

function FoundingBadge({ year }) {
  if (!year) {
    return (
      <div className="schools-aerial-card-score">
        <span className="schools-aerial-card-score-note">建校年份待补</span>
      </div>
    );
  }
  return (
    <div className="schools-aerial-card-score">
      <span className="schools-aerial-card-score-year">创办</span>
      <span className="schools-aerial-card-score-value">{year} 年</span>
    </div>
  );
}

export default function UniversitiesCard({ university }) {
  const u = university;
  // 直辖市 city 与 province 重复时只留一个（北京 / 北京市 → 北京）
  const city = u.city && u.city !== u.province && u.city !== `${u.province}市` ? u.city : '';
  const meta = [u.province, city, u.nature, u.isUndergrad ? '本科' : '专科'].filter(Boolean).join(' / ');
  const headline = (u.tags || [])[0] || (u.isUndergrad ? '本科' : '专科');

  return (
    <article className="schools-aerial-card-wrap">
      <Link href={`/universities/${encodeURIComponent(u.slug)}`} className="schools-aerial-card" prefetch={false}>
        <div className="schools-aerial-card-main">
          <p>{meta}</p>
          <h3>{u.name}</h3>
          <span>{u.positioning || '查看高校概况、学科实力与录取数据。'}</span>
          <div className="schools-aerial-card-tags">
            {(u.tags || []).slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
          </div>
        </div>
        <div className="schools-aerial-card-side">
          <strong>{headline}</strong>
          <b>查看详情 →</b>
        </div>
      </Link>
      <div className="schools-aerial-card-foot">
        <FoundingBadge year={u.foundingYear} />
        <span className="schools-aerial-card-score-note">{u.affiliation ? `${u.affiliation}直属` : '—'}</span>
      </div>
    </article>
  );
}
