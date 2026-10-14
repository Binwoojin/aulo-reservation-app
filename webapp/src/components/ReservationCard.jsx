import { Link } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { getDrink, getStore, reservationEnd } from '../lib/reservation.js';
import { formatDate, formatTime, formatWon } from '../lib/time.js';
import { Tag } from './ui.jsx';

export default function ReservationCard({ reservation: r, link = false, detailed = false }) {
  const space = SPACES[r.type];
  const store = getStore(r.storeId);
  const drink = getDrink(r.drinkId);
  const total = r.fee + r.drinkFee;
  const title = `${space.name} ${r.unit}번 ${space.unitName}`;

  return (
    <article className="reservation-card" data-service={r.type}>
      <div className="reservation-card__head">
        <Tag type={r.type}>{space.label}</Tag>
        <span className="reservation-card__store">{store?.name}</span>
      </div>
      <h3>{link ? <Link to={`/reservations/${r.id}`}>{title}</Link> : title}</h3>
      <p className="reservation-card__when">
        {formatDate(r.date)} · {formatTime(r.start)}–{formatTime(reservationEnd(r))} ({r.hours}시간)
      </p>
      {detailed && (
        <dl className="spec">
          <dt>이용료</dt><dd>{formatWon(r.fee)}</dd>
          <dt>{space.drink === 'included' ? '기본 음료' : '이용 전 음료'}</dt>
          <dd>{drink?.name} · {r.drinkFee ? formatWon(r.drinkFee) : '포함'}</dd>
          {r.requests.length > 0 && (
            <><dt>요청</dt><dd>{r.requests.map((id) => space.requests.find((q) => q.id === id)?.label).join(', ')} (무료)</dd></>
          )}
          <dt>결제 예정</dt><dd className="spec__total">{formatWon(total)}</dd>
        </dl>
      )}
    </article>
  );
}
