import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { OptionList, SpaceImage, StepProgress, Tag } from '../components/ui.jsx';
import { QUESTIONS, recommend } from '../lib/recommend.js';

const actionFor = (type) =>
  SPACES[type].reservable
    ? { to: `/reserve/${type}`, label: `${SPACES[type].name} 예약하기` }
    : { to: '/order', label: '음료 주문하기' };

// 질문 하나씩, 고르면 바로 다음 질문으로 넘어간다
export default function RecommendPage() {
  // 홈 목적 칩(?purpose=work)으로 들어오면 첫 질문의 답을 채우고 두 번째 질문부터 시작한다
  const [params] = useSearchParams();
  const preset = QUESTIONS[0].options.some((o) => o.id === params.get('purpose')) ? params.get('purpose') : null;
  const [answers, setAnswers] = useState(() => (preset ? { purpose: preset } : {}));
  const [step, setStep] = useState(preset ? 1 : 0);
  const done = step >= QUESTIONS.length;

  const back = step > 0 ? () => setStep((s) => s - 1) : false;

  if (done) {
    const result = recommend(answers);
    const space = SPACES[result.primary];
    const action = actionFor(result.primary);
    return (
      <>
        <AppBar back={back} title="추천 결과" />
        <div className="screen-body has-bottom-bar">
          <article className="result-card">
            <SpaceImage space={space} eager />
            <div className="result-card__body">
              <Tag type={result.primary}>추천 · {space.label}</Tag>
              <h2 className="screen-title" lang="en">{space.name}</h2>
              <p className="result-card__headline">{space.headline}</p>
              <p className="muted">{result.reason}</p>
            </div>
          </article>
          {result.alternatives.length > 0 && (
            <section className="block" aria-labelledby="alt-title">
              <h3 id="alt-title" className="block-title">이런 공간도 있어요</h3>
              <ul className="list-card">
                {result.alternatives.map((type) => (
                  <li key={type}>
                    <Link to={actionFor(type).to} className="list-row">
                      <Tag type={type}>{SPACES[type].label}</Tag>
                      <span className="list-row__main" lang="en">{SPACES[type].name}</span>
                      <Icon name="chevron" size={18} className="list-row__chev" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button type="button" className="text-button" onClick={() => { setAnswers({}); setStep(0); }}>다시 답하기</button>
        </div>
        <BottomBar>
          <Link className="button button--primary button--block" to={action.to}>{action.label}</Link>
        </BottomBar>
      </>
    );
  }

  const q = QUESTIONS[step];
  return (
    <>
      <AppBar back={back} title="공간 추천" />
      <StepProgress steps={QUESTIONS.map((x) => x.title)} current={step} />
      <div className="screen-body">
        <h2 className="screen-title question" id={`q-${q.id}`}>{q.title}</h2>
        <OptionList
          key={q.id}
          legend={q.title}
          hideLegend
          name={q.id}
          value={answers[q.id]}
          onChange={(v) => {
            setAnswers((a) => ({ ...a, [q.id]: v }));
            setStep((s) => s + 1);
          }}
          options={q.options.map((o) => ({ value: o.id, label: o.label }))}
        />
      </div>
    </>
  );
}
