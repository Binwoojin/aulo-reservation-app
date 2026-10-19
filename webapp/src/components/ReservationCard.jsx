import { Link } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { getDrink, getStore, reservationEnd } from '../lib/reservation.js';
import { formatDate, formatTime, formatWon } from '../lib/time.js';
import { drinkLabel } from '../lib/order.js';
import Icon from './Icon.jsx';
import { Tag } from './ui.jsx';

export default function ReservationCard({ reservation: r, link = false, detailed = false }) {
  const space = SPACES[r.type];
  const store = getStore(r.storeId);
  const drink = getDrink(r.drinkId);

  const body = (
    <>
      <span className="ticket__head">
        <Tag type={r.type}>{space.label}</Tag>
        <span className="ticket__store"><Icon name="pin" size={16} />{store?.name}</span>
      </span>
      <span className="ticket__title">{space.name} {r.unit}번 {space.unitName}</span>
      <span className="ticket__when">
        <Icon name="clock" size={16} />
        {formatDate(r.date)} · {formatTime(r.start)}–{formatTime(reservationEnd(r))} ({r.hours}시간)
      </span>
      {link && <span className="ticket__go" aria-hidden="true"><Icon name="chevron" size={20} /></span>}
    </>
  );

  return (
    <article className="ticket" data-service={r.type}>
      {link ? <Link to={`/reservations/${r.id}`} className="ticket__link">{body}</Link> : <div className="ticket__link">{body}</div>}
      {detailed && (
        <dl className="kv ticket__detail">
          <div><dt>이용료</dt><dd>{formatWon(r.fee)}</dd></div>
          <div><dt>{space.drink === 'included' ? '기본 음료' : '이용 전 음료'}</dt><dd>{drink ? drinkLabel(drink.id, r.drinkTemp) : ''} · {r.drinkFee ? formatWon(r.drinkFee) : '포함'}</dd></div>
          {r.requests.length > 0 && (
            <div><dt>무료 요청</dt><dd>{r.requests.map((id) => space.requests.find((q) => q.id === id)?.label).filter(Boolean).join(', ')}</dd></div>
          )}
          {r.pointsUsed > 0 && <div><dt>포인트 사용</dt><dd>−{formatWon(r.pointsUsed)}</dd></div>}
          <div className="kv__total"><dt>결제 예정</dt><dd>{formatWon(r.fee - (r.pointsUsed ?? 0) + r.drinkFee)}</dd></div>
        </dl>
      )}
    </article>
  );
}
