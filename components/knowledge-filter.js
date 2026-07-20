'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SUBJECT_LABELS, GRADE_LABELS, SUBJECT_ORDER, GRADE_ORDER } from '../lib/knowledge-labels.mjs';

export default function KnowledgeFilter({ pages = [] }) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState(null);
  const [grade, setGrade] = useState(null);

  const subjects = useMemo(
    () => SUBJECT_ORDER.filter((s) => pages.some((p) => p.subject === s)),
    [pages]
  );
  const grades = useMemo(
    () => GRADE_ORDER.filter((g) => pages.some((p) => p.grade === g)),
    [pages]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages
      .filter((p) => p.slug !== 'index')
      .filter((p) => (subject ? p.subject === subject : true))
      .filter((p) => (grade ? p.grade === grade : true))
      .filter((p) => {
        if (!q) return true;
        const hay = [p.title, p.summary, p.description, ...(p.tags || [])].join(' ').toLowerCase();
        return hay.includes(q);
      });
  }, [pages, query, subject, grade]);

  const reset = () => {
    setQuery('');
    setSubject(null);
    setGrade(null);
  };

  return (
    <section className="knowledge-filter" aria-label="知识检索">
      <div className="knowledge-filter-bar">
        <input
          type="search"
          className="knowledge-filter-input"
          placeholder="搜索学科、知识点或关键词，如「二次函数」「文言文」"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="搜索知识"
        />
      </div>

      <div className="knowledge-filter-chips">
        <span className="knowledge-filter-group-label">学科</span>
        {subjects.map((s) => (
          <button
            type="button"
            key={s}
            className={`knowledge-chip${subject === s ? ' is-active' : ''}`}
            onClick={() => setSubject(subject === s ? null : s)}
            aria-pressed={subject === s}
          >
            {SUBJECT_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="knowledge-filter-chips">
        <span className="knowledge-filter-group-label">年级</span>
        {grades.map((g) => (
          <button
            type="button"
            key={g}
            className={`knowledge-chip${grade === g ? ' is-active' : ''}`}
            onClick={() => setGrade(grade === g ? null : g)}
            aria-pressed={grade === g}
          >
            {GRADE_LABELS[g]}
          </button>
        ))}
      </div>

      <div className="knowledge-filter-meta">
        <span>共 {results.length} 个结果</span>
        {(query || subject || grade) ? (
          <button type="button" className="knowledge-filter-reset" onClick={reset}>清除筛选</button>
        ) : null}
      </div>

      <div className="knowledge-filter-results">
        {results.map((p) => (
          <Link className="knowledge-result-card" href={p.href} key={p.slug}>
            <strong>{p.title}</strong>
            <p>{p.summary}</p>
            <span>
              {p.gradeLabel}
              {p.subjectLabel ? ` · ${p.subjectLabel}` : ''}
            </span>
          </Link>
        ))}
        {results.length === 0 ? (
          <p className="knowledge-filter-empty">没有匹配的知识页，试试其他关键词或清除筛选。</p>
        ) : null}
      </div>
    </section>
  );
}
