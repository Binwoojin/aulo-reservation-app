import { CANCEL_POLICY, CLOSING_NOTICES, PAYMENT_POLICY, PROVISIONAL_NOTES, SPACES, SPACE_TYPES } from '../config/policy.js';
import { AppBar } from '../components/AppShell.jsx';
import { Tag } from '../components/ui.jsx';
import { formatWon } from '../lib/time.js';

export default function InfoPage() {
  return (
    <>
      <AppBar back title="이용 안내·정책" />
      <div className="screen-body">
        <section className="block" aria-labelledby="spaces-info">
          <h2 id="spaces-info" className="block-title">공간별 이용</h2>
          <ul className="stack">
            {SPACE_TYPES.map((t) => {
              const s = SPACES[t];
              return (
                <li key={t} className="info-card">
                  <div className="info-card__head">
                    <Tag type={t}>{s.label}</Tag>
                    <strong lang="en">{s.name}</strong>
                  </div>
                  {s.reservable ? (
                    <ul className="note-list">
                      <li>{formatWon(s.pricePerHour)}/시간 · 1시간 단위 · {s.minHours}~{s.maxHours}시간</li>
                      {s.features.map((f) => <li key={f}>{f}</li>)}
                      <li>{s.extension}</li>
                    </ul>
                  ) : (
                    <p className="muted">{s.summary}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="block" aria-labelledby="common-info">
          <h2 id="common-info" className="block-title">예약·결제·마감</h2>
          <ul className="note-list">
            <li>{PAYMENT_POLICY}</li>
            <li>{CANCEL_POLICY}</li>
            <li>데모 매장 마감은 23:00입니다.</li>
            {CLOSING_NOTICES.map((n) => <li key={n}>{n}</li>)}
            <li>야외 라운지는 Aulo 이용 고객 누구나 쓰는 공용 공간이며 예약 대상이 아닙니다.</li>
          </ul>
        </section>

        <section className="block" aria-labelledby="prov-info">
          <h2 id="prov-info" className="block-title">임시 정책 <span className="provisional">임시</span></h2>
          <p className="muted">아래 항목은 정책이 확정되지 않아 임시값으로 동작해요.</p>
          <ul className="note-list">{PROVISIONAL_NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>

        <p className="fine-print">가상 브랜드 프로젝트 · 실제 운영 매장이 아닙니다. 사진은 AI 생성 참고 이미지입니다.</p>
      </div>
    </>
  );
}
