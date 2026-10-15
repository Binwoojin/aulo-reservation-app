import { Link, useParams } from 'react-router-dom';
import { CANCEL_POLICY, CLOSING_NOTICES, PAYMENT_POLICY, SPACES } from '../config/policy.js';
import ReservationCard from '../components/ReservationCard.jsx';
import { useAppData } from '../lib/AppData.jsx';

export default function ReservationDonePage() {
  const { id } = useParams();
  const { reservations } = useAppData();
  const reservation = reservations.find((r) => r.id === id);

  if (!reservation) {
    return (
      <div className="container page">
        <h1 className="page-title">예약을 찾을 수 없어요</h1>
        <p className="lead">이 브라우저에 저장된 예약만 볼 수 있습니다.</p>
        <Link className="button button--primary" to="/reserve">예약하러 가기</Link>
      </div>
    );
  }

  const space = SPACES[reservation.type];
  return (
    <div className="container page">
      <p className="section-label" lang="en">RESERVED</p>
      <h1 className="page-title">예약이 완료되었어요</h1>
      <p className="lead">방문하시면 매장에서 결제 후 이용을 시작합니다.</p>

      <ReservationCard reservation={reservation} detailed />

      <section className="panel info-list" aria-labelledby="guide-title">
        <h2 id="guide-title">이용 안내</h2>
        <ul>
          <li>{PAYMENT_POLICY}</li>
          {space.drink === 'required' && <li>예약 시 고른 이용 전 음료는 방문 후 함께 결제합니다. 이용 중 추가 음료는 50% 할인됩니다.</li>}
          {space.drink === 'included' && <li>기본 음료는 이용료에 포함됩니다. 앱에서 공간 번호({reservation.unit}번)로 음료를 배달 주문할 수 있어요.</li>}
          <li>{space.extension}</li>
          <li>{CANCEL_POLICY}</li>
          {CLOSING_NOTICES.filter((n) => reservation.type === 'suite' || !n.startsWith('Suite')).map((n) => <li key={n}>{n}</li>)}
        </ul>
      </section>

      <div className="actions">
        <Link className="button button--primary" to={`/order?reservation=${reservation.id}`}>
          {space.drink === 'included' ? 'Suite로 음료 배달 주문' : '추가 음료 주문 (50% 할인)'}
        </Link>
        <Link className="button button--secondary" to="/">홈으로</Link>
      </div>
    </div>
  );
}
