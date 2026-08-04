'use client';

import { useState, useMemo } from 'react';
import { RegionLink } from './region-link';

function SectionKicker({ label }) {
  return (
    <div className="channel-kicker">
      <span />
      <em>{label}</em>
    </div>
  );
}

// Renders entirely from `nav` (built server-side from the manifest), so the
// navigation can never drift from real content. Missing subject x grade
// combinations render as "筹备中" placeholders instead of being omitted.
// Transition grades (e.g. 小升初) have no single-subject pages and instead
// surface a single CTA to their structured overview page.
export default function GradeSubjectExplorer({ nav }) {
  const grades = nav?.grades || [];
  const subjectsByGrade = nav?.subjectsByGrade || {};
  const [selected, setSelected] = useState('grade8');
  const [query, setQuery] = useState('');

  const grade = grades.find((item) => item.key === selected) || grades.find((item) => !item.disabled);

  const gradeLabelByKey = useMemo(() => {
    const map = {};
    grades.forEach((g) => {
      map[g.key] = g.label;
    });
    return map;
  }, [grades]);

  const allSubjects = useMemo(() => {
    const out = [];
    Object.keys(subjectsByGrade).forEach((g) => {
      const list = subjectsByGrade[g];
      if (!Array.isArray(list)) return;
      list.forEach((s) => out.push({ ...s, gradeKey: g, gradeLabel: gradeLabelByKey[g] || g }));
    });
    return out;
  }, [subjectsByGrade, gradeLabelByKey]);

  const q = query.trim();
  const results = q
    ? allSubjects.filter((s) => `${s.title}${s.desc}${s.gradeLabel}`.includes(q))
    : null;

  const subjects = subjectsByGrade[selected] || [];

  return (
    <>
      <section className="knowledge-explorer-search" aria-label="知识搜索">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索学科或年级，如：数学、高三、物理"
          aria-label="搜索学科或年级"
        />
      </section>

      <section className="knowledge-grade-ribbon" aria-label="年级入口">
        {grades.map((item) => {
          const content = (
            <>
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
            </>
          );
          if (item.disabled) {
            return (
              <div className="knowledge-grade-tile is-disabled" key={item.key} aria-disabled="true">
                {content}
              </div>
            );
          }
          return (
            <button
              type="button"
              className={`knowledge-grade-tile${selected === item.key ? ' is-active' : ''}`}
              onClick={() => setSelected(item.key)}
              key={item.key}
              aria-pressed={selected === item.key}
            >
              {content}
            </button>
          );
        })}
      </section>

      {results ? (
        <section className="knowledge-section knowledge-search-results">
          <div className="knowledge-section-head">
            <SectionKicker label="搜索" />
            <button type="button" className="knowledge-search-clear" onClick={() => setQuery('')}>
              清除筛选
            </button>
          </div>
          <h2>“{q}” 相关学科（{results.length}）</h2>
          <div className="knowledge-subject-strip">
            {results.map((s) =>
              s.exists ? (
                <RegionLink className="knowledge-subject-card" href={s.href} key={`${s.gradeKey}-${s.slug}`}>
                  <span>{s.gradeLabel}</span>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                  <em>进入 →</em>
                </RegionLink>
              ) : (
                <div className="knowledge-subject-card is-disabled" key={`${s.gradeKey}-${s.slug}`} aria-disabled="true">
                  <span>{s.gradeLabel}</span>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                  <em>筹备中</em>
                </div>
              )
            )}
          </div>
        </section>
      ) : grade?.isTransition ? (
        <section className="knowledge-section knowledge-featured-subjects">
          <div className="knowledge-section-head">
            <SectionKicker label={grade.label} />
          </div>
          <h2>{grade.label} · 衔接准备</h2>
          <p>{grade.desc}</p>
          <div className="knowledge-subject-strip">
            <RegionLink className="knowledge-subject-card knowledge-subject-card--cta" href={grade.href}>
              <span>{grade.label}</span>
              <strong>进入{grade.label}衔接页</strong>
              <p>查看小升初衔接重点、习惯方法与升学建议</p>
              <em>进入 →</em>
            </RegionLink>
          </div>
        </section>
      ) : (
        <section className="knowledge-section knowledge-featured-subjects">
          <div className="knowledge-section-head">
            <SectionKicker label={grade?.label || ''} />
            {grade && !grade.disabled ? <RegionLink href={grade.href}>查看{grade.label}全部 →</RegionLink> : null}
          </div>
          <h2>{grade?.label} · 核心学科</h2>
          <p>{grade?.desc}</p>
          <div className="knowledge-subject-strip">
            {subjects.map((subject) =>
              subject.exists ? (
                <RegionLink className="knowledge-subject-card" href={subject.href} key={subject.slug}>
                  <span>{grade?.label}</span>
                  <strong>{subject.title}</strong>
                  <p>{subject.desc}</p>
                  <em>进入 →</em>
                </RegionLink>
              ) : (
                <div className="knowledge-subject-card is-disabled" key={subject.slug} aria-disabled="true">
                  <span>{grade?.label}</span>
                  <strong>{subject.title}</strong>
                  <p>{subject.desc}</p>
                  <em>筹备中</em>
                </div>
              )
            )}
          </div>
        </section>
      )}
    </>
  );
}
