'use client';

import { useState, useEffect } from 'react';

const STORAGE_PREFIX = 'kaonaqu:wrong:';

export default function KnowledgeQuiz({ questions = [], slug = '' }) {
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [wrong, setWrong] = useState([]);
  const [showWrongBook, setShowWrongBook] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + slug);
      if (raw) setWrong(JSON.parse(raw));
    } catch {
      /* localStorage 不可用时静默降级 */
    }
  }, [slug]);

  function persist(next) {
    setWrong(next);
    try {
      localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(next));
    } catch {
      /* 忽略写入失败 */
    }
  }

  function choose(qid, idx) {
    if (submitted[qid]) return;
    setSelected((s) => ({ ...s, [qid]: idx }));
  }

  function submit(q) {
    if (submitted[q.id]) return;
    const ans = selected[q.id];
    if (ans === undefined) return;
    setSubmitted((s) => ({ ...s, [q.id]: true }));
    const isCorrect = ans === q.answer;
    const cur = new Set(wrong);
    if (isCorrect) cur.delete(q.id);
    else cur.add(q.id);
    persist(Array.from(cur));
  }

  function reset(qid) {
    setSubmitted((s) => {
      const n = { ...s };
      delete n[qid];
      return n;
    });
    setSelected((s) => {
      const n = { ...s };
      delete n[qid];
      return n;
    });
  }

  function clearWrong() {
    persist([]);
  }

  if (!questions.length) return null;

  const wrongQuestions = questions.filter((q) => wrong.includes(q.id));

  return (
    <section className="knowledge-quiz" aria-label="知识点自测">
      <div className="knowledge-section-head">
        <div className="channel-kicker">
          <span />
          <em>自测练习</em>
        </div>
        <div className="kq-controls">
          <button
            type="button"
            className="kq-wrongbook-btn"
            onClick={() => setShowWrongBook((v) => !v)}
          >
            我的错题本（{wrongQuestions.length}）
          </button>
        </div>
      </div>
      <h2>知识点自测</h2>

      {showWrongBook ? (
        <div className="kq-wrongbook">
          <div className="kq-wrongbook-head">
            <strong>错题本</strong>
            {wrongQuestions.length ? (
              <button type="button" className="kq-clear" onClick={clearWrong}>
                清空
              </button>
            ) : null}
          </div>
          {wrongQuestions.length === 0 ? (
            <p className="kq-empty">暂无错题，继续加油！</p>
          ) : (
            <ul>
              {wrongQuestions.map((q) => (
                <li key={q.id}>
                  <span>{q.question}</span>
                  <button
                    type="button"
                    onClick={() => {
                      reset(q.id);
                      setShowWrongBook(false);
                    }}
                  >
                    重做
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <ol className="kq-list">
        {questions.map((q, qi) => {
          const ans = selected[q.id];
          const done = submitted[q.id];
          const correct = ans === q.answer;
          return (
            <li className="kq-item" key={q.id} id={`quiz-${q.id}`}>
              <p className="kq-q">
                <span className="kq-num">{qi + 1}</span>
                {q.question}
              </p>
              <div className="kq-options" role="radiogroup" aria-label={q.question}>
                {q.options.map((opt, oi) => {
                  const isChosen = ans === oi;
                  const isAnswer = q.answer === oi;
                  let cls = 'kq-option';
                  if (done) {
                    if (isAnswer) cls += ' is-correct';
                    else if (isChosen && !correct) cls += ' is-wrong';
                  } else if (isChosen) {
                    cls += ' is-chosen';
                  }
                  return (
                    <button
                      type="button"
                      key={oi}
                      className={cls}
                      disabled={done}
                      aria-checked={isChosen}
                      role="radio"
                      onClick={() => choose(q.id, oi)}
                    >
                      <span className="kq-opt-key">{String.fromCharCode(65 + oi)}</span>
                      <span className="kq-opt-text">{opt}</span>
                    </button>
                  );
                })}
              </div>
              {done ? (
                <div className={`kq-feedback${correct ? ' is-correct' : ' is-wrong'}`}>
                  <strong>{correct ? '回答正确' : '回答错误'}</strong>
                  <p>{q.explanation}</p>
                  {!correct ? (
                    <button type="button" className="kq-retry" onClick={() => reset(q.id)}>
                      重做本题
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  className="kq-submit"
                  onClick={() => submit(q)}
                  disabled={ans === undefined}
                >
                  {ans === undefined ? '请选择答案' : '提交'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
