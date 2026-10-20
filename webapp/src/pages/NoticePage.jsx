import { CLOSING_NOTICES, HOLIDAYS, HOURS } from '../config/policy.js';
import { BrandBand } from '../components/BrandBand.jsx';
import { AppBar } from '../components/AppShell.jsx';
import { useNow } from '../lib/AppData.jsx';
import { formatDate, formatTime, toDateString } from '../lib/time.js';

// 공지사항 (햄버거 서랍, 필수 규칙 6): 확정 정책에서 나온 운영 공지만 싣는다. 이벤트·혜택 공지는 지어내지 않는다.
export default function NoticePage() {
  const now = useNow();
  const today = toDateString(now);
  const upcoming = HOLIDAYS.filter((d) => d >= today).slice(0, 6);
  return (
    <>
      <AppBar back title="공지사항" />
      <div className="screen-body order-body">
        <BrandBand id="notice-title" script="notice" title="공지사항" hint="확정된 운영 정책에서 나온 소식만 알려 드려요" />
        <ul className="stack">
          <li className="notice-card">
            <span className="notice-card__tag">휴무</span>
            <h2 className="notice-card__title">공휴일은 쉬어요</h2>
            <p className="notice-card__body">모든 매장은 공휴일(대체공휴일 포함)에 휴무예요. 노동절은 공휴일이 아니어서 정상 운영해요.</p>
            {upcoming.length > 0 && (
              <ul className="notice-card__dates" aria-label="다가오는 휴무일">
                {upcoming.map((d) => <li key={d}>{formatDate(d)}</li>)}
              </ul>
            )}
          </li>
          <li className="notice-card">
            <span className="notice-card__tag">운영</span>
            <h2 className="notice-card__title">운영 시간과 마감 안내</h2>
            <p className="notice-card__body">매일 {formatTime(HOURS.open)}에 열고 {formatTime(HOURS.close)}에 닫아요.</p>
            <ul className="note-list">{CLOSING_NOTICES.map((n) => <li key={n}>{n}</li>)}</ul>
          </li>
          <li className="notice-card">
            <span className="notice-card__tag">서비스</span>
            <h2 className="notice-card__title">카카오톡 채널 지각 연락은 준비 중이에요</h2>
            <p className="notice-card__body">예약 정보와 함께 카카오톡 채널로 연락하는 기능을 준비하고 있어요. 지금은 매장에 직접 연락해 주세요. 미리 연락하면 예약 시작 후 최대 1시간까지 예약을 유지해 드려요.</p>
          </li>
          <li className="notice-card">
            <span className="notice-card__tag">데모</span>
            <h2 className="notice-card__title">데모 버전 안내</h2>
            <p className="notice-card__body">가상 브랜드 Aulo의 포트폴리오 데모예요. 실제 예약·결제·주문은 이루어지지 않고, 기록은 이 기기에만 저장돼요.</p>
          </li>
        </ul>
      </div>
    </>
  );
}
