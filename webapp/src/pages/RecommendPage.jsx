import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { ChoiceGroup, SpaceImage, Tag } from '../components/ui.jsx';
import { QUESTIONS, recommend } from '../lib/recommend.js';

const actionFor = (type) =>
  SPACES[type].reservable
    ? { to: `/reserve/${type}`, label: `${SPACES[type].name} 예약하기` }
    : { to: '/order', label: '음료 주문하기' };

export default function RecommendPage() {
  const [answers, setAnswers] = useState({});
  const complete = QUESTIONS.every((q) => answers[q.id]);
  const result = complete ? recommend(answers) : null;

  return (
    <div className="container page">
      <p className="section-label" lang="en">FIND YOUR SPACE</p>
      <h1 className="page-title">목적에 맞는 공간 찾기</h1>
      <p className="lead">세 가지 질문에 답하면 오늘에 맞는 공간을 추천해 드려요.</p>

      <div className="recommend-layout">
        <form className="panel" onSubmit={(e) => e.preventDefault()}>
          {QUESTIONS.map((q, i) => (
            <ChoiceGroup
              key={q.id}
              legend={`${i + 1}. ${q.title}`}
              name={q.id}
              value={answers[q.id]}
              onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              options={q.options.map((o) => ({ value: o.id, label: o.label }))}
            />
          ))}
        </form>

        <section className="recommend-result" aria-live="polite" aria-labelledby="result-title">
          {result ? (
            <>
              <h2 id="result-title" className="visually-hidden">추천 결과</h2>
              <article className="space-card space-card--featured">
                <SpaceImage space={SPACES[result.primary]} eager />
                <div className="space-card__body">
                  <Tag type={result.primary}>추천 · {SPACES[result.primary].label}</Tag>
                  <h3 lang="en">{SPACES[result.primary].name}</h3>
                  <p className="space-card__headline">{SPACES[result.primary].headline}</p>
                  <p>{result.reason}</p>
                  <Link className="button button--primary button--block" to={actionFor(result.primary).to}>
                    {actionFor(result.primary).label} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
              {result.alternatives.length > 0 && (
                <div className="alternatives">
                  <h3>이런 공간도 있어요</h3>
                  <ul>
                    {result.alternatives.map((type) => (
                      <li key={type}>
                        <Link to={actionFor(type).to} className="alt-link">
                          <Tag type={type}>{SPACES[type].label}</Tag>
                          <span lang="en">{SPACES[type].name}</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="placeholder-panel">
              <h2 id="result-title">추천 결과</h2>
              <p>질문에 모두 답하면 이곳에 추천 공간이 나타납니다. ({QUESTIONS.filter((q) => answers[q.id]).length}/{QUESTIONS.length})</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
