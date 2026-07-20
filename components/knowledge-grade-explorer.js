'use client';

import { useState } from 'react';
import Link from 'next/link';

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
export default function GradeSubjectExplorer({ nav }) {
  const grades = nav?.grades || [];
  const subjectsByGrade = nav?.subjectsByGrade || {};
  const [selected, setSelected] = useState('grade8');
  const grade = grades.find((item) => item.key === selected) || grades.find((item) => !item.disabled);
  const subjects = subjectsByGrade[selected] || [];

  return (
    <>
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

      <section className="knowledge-section knowledge-featured-subjects">
        <div className="knowledge-section-head">
          <SectionKicker label={grade?.label || ''} />
          {grade && !grade.disabled ? <Link href={grade.href}>查看{grade.label}全部 →</Link> : null}
        </div>
        <h2>{grade?.label} · 核心学科</h2>
        <p>{grade?.desc}</p>
        <div className="knowledge-subject-strip">
          {subjects.map((subject) =>
            subject.exists ? (
              <Link className="knowledge-subject-card" href={subject.href} key={subject.slug}>
                <span>{grade?.label}</span>
                <strong>{subject.title}</strong>
                <p>{subject.desc}</p>
                <em>进入 →</em>
              </Link>
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
    </>
  );
}
