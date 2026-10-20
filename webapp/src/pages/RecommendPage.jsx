import { useEffect, useState } from 'react';
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
  // 마지막 답을 고르면 잠깐 '찾는 중' 화면을 보여 준 뒤 결과가 차례로 떠오른다 (움직임 줄이기면 짧게, 움직임 없이)
  const [finding, setFinding] = useState(false);
  useEffect(() => {
    if (!finding) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setFinding(false), reduce ? 300 : FINDING_MS);
    return () => window.clearTimeout(t);
  }, [finding]);

  const back = step > 0 ? () => setStep((s) => s - 1) : false;

  if (done && finding) return <Finding answers={answers} />;

  if (done) {
    const result = recommend(answers);
    const space = SPACES[result.primary];
    const action = actionFor(result.primary);
    return (
      <>
        <AppBar back={back} title="추천 결과" />
        <div className="screen-body has-bottom-bar">
          <article className="result-card reveal" style={{ '--i': 0 }}>
            <SpaceImage space={space} eager />
            <div className="result-card__body">
              <span className="reveal" style={{ '--i': 1 }}><Tag type={result.primary}>추천 · {space.label}</Tag></span>
              <h2 className="screen-title reveal" style={{ '--i': 1 }} lang="en">{space.name}</h2>
              <p className="result-card__headline reveal" style={{ '--i': 2 }}>{space.headline}</p>
              <p className="muted reveal" style={{ '--i': 3 }}>{result.reason}</p>
            </div>
          </article>
          {result.alternatives.length > 0 && (
            <section className="block reveal" style={{ '--i': 4 }} aria-labelledby="alt-title">
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
            if (step === QUESTIONS.length - 1) setFinding(true);
            setStep((s) => s + 1);
          }}
        />
      </div>
    </>
  );
}

// 질문별 보기 모양: 목적은 아이콘 카드 2×2, 시간은 Fraunces 큰 숫자 카드, 환경은 아치형 이미지 자리(임시 모양) 줄
const CHOICE_LOOK = {
  purpose: {
    layout: 'icon-grid',
    options: {
      coffee: { icon: 'cup', sub: '음료와 함께 편하게' },
      work: { icon: 'partition', sub: '오래 집중할 자리' },
      rest: { icon: 'recliner', sub: '기대어 쉬어 가기' },
      private: { icon: 'door', sub: '방해 없이 나만의 공간' },
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
  // 환경: 이미지 없이 텍스트 박스로 고른다 (2026-10-20)
  privacy: {
    layout: 'text',
    options: {
      open: { sub: '주변이 보여도 편하게 머물 수 있어요' },
      semi: { sub: '옆 사람 시선이 가려지는 자리가 좋아요' },
      closed: { sub: '통화하거나 혼자 집중할 방이 필요해요' },
    },
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
            {v.icon && <span className="choice__icon" aria-hidden="true"><Icon name={v.icon} size={28} /></span>}
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

// 결과를 찾는 동안: 고른 답이 하나씩 떠오르고, 아치 모양이 천천히 채워진다 (브랜드 모션 'Stay in your rhythm')
const FINDING_MS = 1600;
function Finding({ answers }) {
  const picked = QUESTIONS.map((q) => q.options.find((o) => o.id === answers[q.id])?.label).filter(Boolean);
  return (
    <>
      <AppBar title="공간 추천" />
      <div className="screen-body finding" role="status" aria-live="polite">
        <span className="finding__arch" aria-hidden="true"><span /></span>
        <p className="shelf-script" lang="en">finding your space</p>
        <h2 className="finding__title">답변에 맞는 공간을<br />고르고 있어요</h2>
        <ul className="finding__answers" aria-label="고른 답">
          {picked.map((label, i) => <li key={label} style={{ '--i': i }}>{label}</li>)}
        </ul>
      </div>
    </>
  );
}
