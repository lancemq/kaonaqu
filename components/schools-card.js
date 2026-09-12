// 学校列表卡片（server 组件）：纯展示 + 底部两个岛（对比按钮为 client、分数线徽标纯展示）。
import { RegionLink } from './region-link';
import SchoolsCompareToggle from './schools-compare-toggle';

function getOwnershipLabel(school) {
  const label = String(school?.schoolPropertyLabel || '').trim();
  return label || '—';
}

function ScoreLineBadge({ scoreLines }) {
  const lines = Array.isArray(scoreLines) ? scoreLines : [];
  let year = null;
  let scoreText = null;
  let note = '近年无统一录取线';
  if (lines.length) {
    let best = lines[0];
    for (const line of lines) {
      if (Number(line.year) > Number(best.year)) best = line;
    }
    year = best.year;
    scoreText = best.score != null && String(best.score).trim() !== '' ? String(best.score) : null;
    note = best.note || note;
  }
  return (
    <div className="schools-aerial-card-score">
      {year ? <span className="schools-aerial-card-score-year">{year} 年</span> : null}
      {scoreText ? (
        <span className="schools-aerial-card-score-value">录取线 {scoreText}</span>
      ) : (
        <span className="schools-aerial-card-score-note">{note}</span>
      )}
    </div>
  );
}

export default function SchoolsCard({ school }) {
  return (
    <article className="schools-aerial-card-wrap">
      <RegionLink href={`/schools/${school.id}`} className="schools-aerial-card">
        <div className="schools-aerial-card-main">
          <p>{school.districtName} / {school.schoolStageLabel} / {getOwnershipLabel(school)}</p>
          <h3>{school.name}</h3>
          <span>{school.positioning || '查看学校画像、招生路径与择校提示。'}</span>
          <div className="schools-aerial-card-tags">
            {school.tags.slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
          </div>
        </div>
        <div className="schools-aerial-card-side">
          <strong>{school.eliteCohort || school.schoolKeyLevel || school.schoolPropertyLabel || '—'}</strong>
          <b>查看详情 →</b>
        </div>
      </RegionLink>
      <div className="schools-aerial-card-foot">
        <ScoreLineBadge scoreLines={school.scoreLines} />
        <SchoolsCompareToggle schoolId={school.id} schoolName={school.name} />
      </div>
    </article>
  );
}
