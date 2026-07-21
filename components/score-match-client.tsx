'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  getAllDistricts,
  groupResultsByCategory,
  matchSchoolsByScore,
  MAX_SCORE_PER_EXAM,
  type ExamType,
  type MatchCategory,
  type ScoreMatchResult,
  type SchoolRecord
} from '../lib/score-match-engine';

const CATEGORY_META: Record<MatchCategory, { label: string; hint: string; tone: string }> = {
  reach: { label: '冲刺', hint: '分数略低于参考区间下限，可尝试', tone: 'reach' },
  match: { label: '匹配', hint: '分数在参考区间内', tone: 'match' },
  safety: { label: '保底', hint: '分数高于参考区间上限', tone: 'safety' }
};

const EXAM_OPTIONS: { value: ExamType; label: string; fullMark: string }[] = [
  { value: 'zhongkao', label: '中考', fullMark: '满分 750' },
  { value: 'international', label: '国际课程', fullMark: '参考中考分' }
];

export default function ScoreMatchClient({ schools }: { schools: SchoolRecord[] }) {
  const districts = useMemo(() => getAllDistricts(schools), [schools]);
  const [examType, setExamType] = useState<ExamType>('zhongkao');
  const [scoreInput, setScoreInput] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    if (score === null) return [];
    return matchSchoolsByScore({ score, districtId: districtId || undefined, examType }, schools);
  }, [score, districtId, examType, schools]);

  const grouped = useMemo(() => groupResultsByCategory(results), [results]);

  const applyMatch = () => {
    const parsed = Number(scoreInput);
    const max = MAX_SCORE_PER_EXAM[examType];
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
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

  const heroStats = [
    { value: '3', label: '档位建议' },
    { value: String(districts.length), label: '覆盖区域' },
    { value: String(MAX_SCORE_PER_EXAM[examType]), label: '满分参考' },
    { value: '8', label: '每档上限' }
  ];

  return (
    <>
      <nav className="channel-nav" aria-label="顶部导航">
        <Link className="channel-brand" href="/" aria-label="考哪去首页">
          <strong>考哪去</strong>
          <span>SHANGHAI EDUCATION</span>
        </Link>
        <div className="channel-nav-links">
          <Link href="/">首页</Link>
          <Link href="/news">新闻</Link>
          <Link className="is-active" href="/schools">学校</Link>
          <Link href="/knowledge">知识</Link>
        </div>
      </nav>

      <header className="channel-hero" id="top">
        <section className="channel-hero-content" aria-label="估分择校">
          <div className="channel-hero-copy">
            <p className="channel-kicker"><span aria-hidden="true"></span>SCORE MATCH</p>
            <h1>估分择校</h1>
            <p>输入中考成绩或切换至国际课程方向，选择所在区域，按学校层级参考区间给出冲刺、匹配、保底三档可填报高中建议。</p>
          </div>
          <aside className="channel-hero-stats" aria-label="估分择校统计">
            {heroStats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </aside>
        </section>
      </header>

      <section className="score-match-aerial-tools" aria-label="估分条件">
        <div className="score-match-aerial-tools-head">
          <p className="channel-kicker"><span aria-hidden="true"></span>YOUR SCORE</p>
          <h2>输入成绩与区域</h2>
          <p>选择考试类型、填写成绩，可选所在区域缩小范围，生成三档可填报高中建议。</p>
        </div>

        <div className="score-match-aerial-form">
          <div className="score-match-aerial-form-row">
            <span>考试类型</span>
            <div className="score-match-aerial-toggle" role="radiogroup" aria-label="考试类型">
              {EXAM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={examType === opt.value}
                  className={`score-match-aerial-toggle-btn${examType === opt.value ? ' score-match-aerial-toggle-btn-active' : ''}`}
                  onClick={() => { setExamType(opt.value); setSubmitted(false); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="score-match-aerial-form-row">
            <span>成绩</span>
            <label className="score-match-aerial-scorefield" htmlFor="score-match-score-input">
              <input
                id="score-match-score-input"
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_SCORE_PER_EXAM[examType]}
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyMatch(); } }}
                placeholder={`0 - ${MAX_SCORE_PER_EXAM[examType]}`}
              />
              <em>{EXAM_OPTIONS.find((o) => o.value === examType)?.fullMark}</em>
            </label>
          </div>

          <div className="score-match-aerial-form-row">
            <span>所在区域</span>
            <label className="score-match-aerial-scorefield score-match-aerial-scorefield-select" htmlFor="score-match-district">
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

          <div className="score-match-aerial-form-actions">
            <button className="score-match-aerial-button" type="button" onClick={applyMatch}>生成建议</button>
            <button className="score-match-aerial-button score-match-aerial-button-secondary" type="button" onClick={reset}>重置</button>
          </div>
        </div>

        <p className="score-match-aerial-disclaimer">
          已收录真实录取线的学校按近年录取线精确匹配（绿色"真实录取线"标记），其余按同 tier 参考区间估算；最终以当年市/区招考机构发布为准。
        </p>
        {examType === 'international' ? (
          <p className="score-match-aerial-disclaimer score-match-aerial-disclaimer-warn">
            国际课程 / 海外方向：本平台仅覆盖上海高中信息，无大学录取数据。国际课程班通常综合中考成绩、校测与简历录取，以下为参考示意，不代表高考志愿结果。
          </p>
        ) : null}
      </section>

      <section className="score-match-aerial-results" aria-label="择校建议">
        <div className="score-match-aerial-section-head">
          <p className="channel-kicker"><span aria-hidden="true"></span>RESULTS</p>
          <h2>择校建议</h2>
          <p>
            {submitted
              ? (hasResults ? `当前分数匹配 ${results.length} 所高中，按匹配 / 冲刺 / 保底分栏展示。` : '当前分数范围内无匹配，请核对分数或切换为全市范围。')
              : '输入成绩后生成三档可填报高中建议。'}
          </p>
        </div>

        {submitted && hasResults ? (
          <div className="score-match-aerial-grid">
            {(['match', 'reach', 'safety'] as MatchCategory[]).map((cat) => (
              grouped[cat].length ? (
                <section key={cat} className={`score-match-aerial-column score-match-aerial-column-${CATEGORY_META[cat].tone}`}>
                  <header>
                    <strong>{CATEGORY_META[cat].label}</strong>
                    <span>{CATEGORY_META[cat].hint}</span>
                    <em>{grouped[cat].length} 所</em>
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
          <div className="score-match-aerial-empty">
            <strong>{submitted ? '暂无可填报高中建议' : '输入成绩后生成建议'}</strong>
            <p>{submitted ? '当前分数范围内无匹配，请核对分数或切换为全市范围。' : '选择考试类型、填写成绩，可选所在区域缩小范围。'}</p>
          </div>
        )}
      </section>

      <div className="channel-color-bar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <footer className="channel-footer">
        <div><strong>考哪去</strong><span>SHANGHAI EDUCATION PLATFORM</span></div>
        <nav aria-label="页脚导航">
          <Link href="/">首页</Link>
          <Link href="/news">新闻</Link>
          <Link href="/schools">学校</Link>
          <Link href="/knowledge">知识</Link>
        </nav>
        <p>© 2026 考哪去</p>
      </footer>
    </>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  real_line: '真实录取线',
  rich_profile: 'rich profile 参考线',
  tier_reference: 'tier 参考区间'
};

function ResultCard({ result }: { result: ScoreMatchResult }) {
  const { school, estimatedRange, reason, source } = result;
  return (
    <li>
      <Link className="score-match-aerial-card" href={`/schools/${school.id}`}>
        <div className="score-match-aerial-card-head">
          <strong>{school.name}</strong>
          <span className="score-match-aerial-card-tier">{school.eliteCohort || school.schoolKeyLevel}</span>
        </div>
        <div className="score-match-aerial-card-meta">
          <span>{school.districtName}</span>
          <span className="score-match-aerial-card-range">
            参考 {estimatedRange.min}-{estimatedRange.max}
          </span>
        </div>
        <p className="score-match-aerial-card-reason">{reason}</p>
        <div className="score-match-aerial-card-foot">
          <span className={`score-match-aerial-source score-match-aerial-source-${source}`}>
            {SOURCE_LABEL[source] || '参考'}
          </span>
          <span className="score-match-aerial-card-link">查看详情</span>
        </div>
      </Link>
    </li>
  );
}
