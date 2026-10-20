import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { BrandBand } from '../components/BrandBand.jsx';
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
      <div className="screen-body order-body">
        <BrandBand id={`q-${q.id}`} script="find your rhythm" title={q.title} hint="고르면 바로 다음 질문으로 넘어가요" />
        <ChoiceCards
          key={q.id}
          question={q}
          value={answers[q.id]}
          onChange={(v) => {
            setAnswers((a) => ({ ...a, [q.id]: v }));
            setStep((s) => s + 1);
          }}
        />
      </div>
    </>
  );
}

// 질문별 보기 모양 (홈의 사진 카드·Fraunces 숫자 톤): 목적은 사진 2×2, 시간은 큰 숫자 카드, 환경은 아치형 사진 줄
const CHOICE_LOOK = {
  purpose: {
    layout: 'photo-grid',
    options: {
      coffee: { space: 'cafe', sub: '음료와 함께 편하게' },
      work: { space: 'focus', sub: '오래 집중할 자리' },
      rest: { space: 'rest', sub: '기대어 쉬어 가기' },
      private: { space: 'suite', sub: '방해 없이 나만의 공간' },
    },
  },
  duration: {
    layout: 'number',
    options: {
      short: { big: '1–2', sub: '가볍게 들르기' },
      mid: { big: '3–4', sub: '반나절 머무르기' },
      long: { big: '5+', sub: '하루를 길게' },
    },
  },
  privacy: {
    layout: 'photo-row',
    options: { open: { space: 'cafe' }, semi: { space: 'focus' }, closed: { space: 'suite' } },
  },
};

function ChoiceCards({ question: q, value, onChange }) {
  const look = CHOICE_LOOK[q.id];
  return (
    <fieldset className={`choices choices--${look.layout}`}>
      <legend className="visually-hidden">{q.title}</legend>
      {q.options.map((o) => {
        const v = look.options[o.id] ?? {};
        return (
          <label key={o.id} className="choice" data-checked={value === o.id || undefined}>
            <input type="radio" name={q.id} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            {v.space && <SpaceImage space={SPACES[v.space]} />}
            {v.big && <span className="choice__big" lang="en">{v.big}<small>시간</small></span>}
            <span className="choice__text">
              <span className="choice__label">{o.label}</span>
              {v.sub && <span className="choice__sub">{v.sub}</span>}
            </span>
            <span className="choice__go" aria-hidden="true"><Icon name="chevron" size={18} /></span>
          </label>
        );
      })}
    </fieldset>
  );
}
