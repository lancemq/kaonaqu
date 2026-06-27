'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  getAllDistricts,
  groupResultsByCategory,
  matchSchoolsByScore,
  MAX_SCORE,
  type ExamType,
  type MatchCategory,
  type ScoreMatchResult
} from '../lib/score-match-engine';

const CATEGORY_META: Record<MatchCategory, { label: string; hint: string; tone: string }> = {
  reach: { label: '冲刺', hint: '分数略低于参考区间下限，可尝试', tone: 'reach' },
  match: { label: '匹配', hint: '分数在参考区间内', tone: 'match' },
  safety: { label: '保底', hint: '分数高于参考区间上限', tone: 'safety' }
};

const EXAM_OPTIONS: { value: ExamType; label: string; fullMark: string }[] = [
  { value: 'zhongkao', label: '中考', fullMark: '满分 660' },
  { value: 'gaokao', label: '高考', fullMark: '满分 660' }
];

export default function ScoreMatchClient() {
  const districts = useMemo(() => getAllDistricts(), []);
  const [examType, setExamType] = useState<ExamType>('zhongkao');
  const [scoreInput, setScoreInput] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    if (score === null) return [];
    return matchSchoolsByScore({ score, districtId: districtId || undefined, examType });
  }, [score, districtId, examType]);

  const grouped = useMemo(() => groupResultsByCategory(results), [results]);

  const applyMatch = () => {
    const parsed = Number(scoreInput);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_SCORE) {
      setSubmitted(true);
      setScore(null);
      return;
    }
    setScore(parsed);
    setSubmitted(true);
  };

  const reset = () => {
    setScoreInput('');
    setScore(null);
    setDistrictId('');
    setSubmitted(false);
  };

  const hasResults = results.length > 0;

  return (
    <>
      <header className="hero" id="top">
        <section className="score-match-hero" aria-label="估分择校">
          <div className="score-match-hero-copy">
            <span className="overview-label">Score Match</span>
            <h1>估分择校</h1>
            <p>输入成绩与所在区域，按学校层级参考区间给出冲刺、匹配、保底三档建议。</p>
          </div>

          <div className="score-match-hero-panel">
            <div className="score-match-form">
              <div className="score-match-form-row">
                <span>考试类型</span>
                <div className="score-match-toggle" role="radiogroup" aria-label="考试类型">
                  {EXAM_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={examType === opt.value}
                      className={`score-match-toggle-btn${examType === opt.value ? ' score-match-toggle-btn-active' : ''}`}
                      onClick={() => { setExamType(opt.value); setSubmitted(false); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="score-match-form-row">
                <span>成绩</span>
                <label className="score-match-scorefield" htmlFor="score-match-score-input">
                  <input
                    id="score-match-score-input"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MAX_SCORE}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyMatch(); } }}
                    placeholder={`0 - ${MAX_SCORE}`}
                  />
                  <em>{EXAM_OPTIONS.find((o) => o.value === examType)?.fullMark}</em>
                </label>
              </div>

              <div className="score-match-form-row">
                <span>所在区域</span>
                <label className="score-match-scorefield score-match-scorefield-select" htmlFor="score-match-district">
                  <span className="visually-hidden">按区域筛选</span>
                  <select
                    id="score-match-district"
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                  >
                    <option value="">全市范围</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="score-match-form-actions">
                <button className="score-match-button" type="button" onClick={applyMatch}>生成建议</button>
                <button className="score-match-button score-match-button-secondary" type="button" onClick={reset}>重置</button>
              </div>
            </div>

            <p className="score-match-disclaimer">
              分数基于同 tier 学校参考区间，非该校精确录取线；最终以当年市/区招考机构发布为准。
            </p>
          </div>
        </section>
      </header>

      {submitted ? (
        <section className="score-match-results" aria-label="择校建议">
          {hasResults ? (
            <div className="score-match-grid">
              {(['match', 'reach', 'safety'] as MatchCategory[]).map((cat) => (
                grouped[cat].length ? (
                  <section key={cat} className={`score-match-column score-match-column-${CATEGORY_META[cat].tone}`}>
                    <header>
                      <strong>{CATEGORY_META[cat].label}</strong>
                      <span>{CATEGORY_META[cat].hint}</span>
                    </header>
                    <ul>
                      {grouped[cat].map((r) => (
                        <ResultCard key={r.school.id} result={r} />
                      ))}
                    </ul>
                  </section>
                ) : null
              ))}
            </div>
          ) : (
            <div className="score-match-empty">
              <strong>暂无可填报高中建议</strong>
              <p>当前分数范围内无匹配，请核对分数或切换为全市范围。</p>
            </div>
          )}
        </section>
      ) : (
        <section className="score-match-results" aria-label="占位">
          <div className="score-match-empty">
            <strong>输入成绩后生成建议</strong>
            <p>选择考试类型、填写成绩，可选所在区域缩小范围。</p>
          </div>
        </section>
      )}

      <footer className="prototype-page-footer">
        <span>上海学校数据库 / 估分择校</span>
        <span>冲刺 / 匹配 / 保底 三档建议</span>
      </footer>
    </>
  );
}

function ResultCard({ result }: { result: ScoreMatchResult }) {
  const { school, estimatedRange, reason, source } = result;
  return (
    <li>
      <Link className="score-match-card" href={`/schools/${school.id}`}>
        <div className="score-match-card-head">
          <strong>{school.name}</strong>
          <span className="score-match-card-tier">{school.tier}</span>
        </div>
        <div className="score-match-card-meta">
          <span>{school.districtName}</span>
          <span className="score-match-card-range">
            参考 {estimatedRange.min}-{estimatedRange.max}
          </span>
        </div>
        <p className="score-match-card-reason">{reason}</p>
        <div className="score-match-card-foot">
          <span className={`score-match-source score-match-source-${source}`}>
            {source === 'rich_profile' ? 'rich profile 参考线' : 'tier 参考区间'}
          </span>
          <span className="score-match-card-link">查看详情</span>
        </div>
      </Link>
    </li>
  );
}
