import { SPACES } from '../config/policy.js';
import { drinkLabel } from '../lib/order.js';
import { drinkOptionsText, getDrink, getStore, reservationEnd } from '../lib/reservation.js';
import { seatZone } from '../lib/seatLayout.js';
import { formatDate, formatTime, formatWon } from '../lib/time.js';
import { DrinkThumb, SpaceImage } from './ui.jsx';

// 예약 카드(티켓): 공간 머리(아치 사진·Fraunces 이름) → 날짜·시간 → 절취선 → 음료·요청 → 금액.
// 예약 확인 단계와 예약 상세가 같은 카드를 쓴다. feeDetail: 이용료 칸에 저장된 금액 대신 보여 줄 내용(확인 단계의 '단가 × 시간')
export default function StayCard({ reservation: r, feeDetail, feeNote }) {
  const space = SPACES[r.type];
  const store = getStore(r.storeId);
  const zone = store ? seatZone(r.type, store.units[r.type], r.unit) : null;
  const drink = getDrink(r.drinkId);
  const options = drinkOptionsText(r);
  const requests = r.requests ?? [];
  const drinkFee = r.drinkFee ?? 0;
  const pointsUsed = r.pointsUsed ?? 0;

  return (
    <article className="stay-card" aria-label="예약 내용">
      <header className="stay-card__head">
        <SpaceImage space={space} />
        <div className="stay-card__who">
          <p className="shelf-script" lang="en">your stay</p>
          <p className="stay-card__space" lang="en">{space.name}</p>
          <p className="stay-card__where">{store?.name} · {r.unit}번 {space.unitName}{zone && ` · ${zone.label}`}</p>
        </div>
      </header>
      <div className="stay-card__when">
        <div>
          <span className="stay-card__label">날짜</span>
          <span className="stay-card__big" lang="en">{r.date.slice(5).replace('-', '.')}</span>
          <span className="stay-card__small">{formatDate(r.date).replace(/^\d+월 \d+일 /, '')}</span>
        </div>
        <div>
          <span className="stay-card__label">시간</span>
          <span className="stay-card__big" lang="en">{formatTime(r.start)}<span className="stay-card__dash">–</span>{formatTime(reservationEnd(r))}</span>
          <span className="stay-card__chip">{r.hours}시간 이용</span>
        </div>
      </div>
      <div className="stay-card__cut" aria-hidden="true" />
      {drink && (
        <div className="stay-card__drink">
          <DrinkThumb drink={drink} temp={r.drinkTemp ?? null} size="sm" />
          <span className="stay-card__drink-text">
            <span className="stay-card__label">{space.drink === 'included' ? '기본 음료' : '이용 전 음료'}</span>
            <strong>{drinkLabel(drink.id, r.drinkTemp ?? null)}</strong>
            {options && <span className="stay-card__opts">{options}</span>}
          </span>
        </div>
      )}
      {requests.length > 0 && (
        <ul className="stay-card__requests" aria-label="무료 요청">
          {requests.map((id) => <li key={id}>{space.requests.find((q) => q.id === id)?.label} · 무료</li>)}
        </ul>
      )}
      <dl className="stay-card__price">
        <div><dt>이용료{feeNote && <> {feeNote}</>}</dt><dd>{feeDetail ?? formatWon(r.fee)}</dd></div>
        <div><dt>음료</dt><dd>{space.drink === 'included' ? (drinkFee ? `포함 · 샷 ${formatWon(drinkFee)}` : '포함') : formatWon(drinkFee)}</dd></div>
        {pointsUsed > 0 && <div><dt>포인트 사용</dt><dd>−{formatWon(pointsUsed)}</dd></div>}
        <div className="stay-card__total"><dt>결제 예정 <small>방문 후 매장에서</small></dt><dd lang="en">{formatWon(r.fee - pointsUsed + drinkFee)}</dd></div>
      </dl>
    </article>
  );
}
