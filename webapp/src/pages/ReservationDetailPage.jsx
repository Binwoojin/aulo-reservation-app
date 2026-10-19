import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CANCEL_POLICY, CLOSING_NOTICES, LATE_POLICY, PAYMENT_POLICY, SPACES } from '../config/policy.js';
import { AppBar, BottomBar, isUpcoming } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import { NoticeDialog } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { canCancel, extensionStatus, isInUse } from '../lib/reservation.js';
import { formatDate } from '../lib/time.js';

// 예약 완료(?new=1)와 예약 상세를 함께 보여준다
export default function ReservationDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { reservations, removeReservation } = useAppData();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const now = useNow();
  const reservation = reservations.find((r) => r.id === id);
  const isNew = params.get('new') === '1';

  if (!reservation) {
    return (
      <>
        <AppBar back title="예약" />
        <div className="screen-body center-state">
          <h2 className="screen-title">예약을 찾을 수 없어요</h2>
          <p className="muted">이 기기에 저장된 예약만 볼 수 있어요.</p>
          <Link className="button button--primary" to="/reserve">예약하러 가기</Link>
        </div>
      </>
    );
  }

  const space = SPACES[reservation.type];
  const upcoming = isUpcoming(reservation, now);
  const cancellable = canCancel(reservation, now);
  const inUse = isInUse(reservation, now);

  const cancel = () => {
    setConfirmOpen(false);
    removeReservation(reservation.id);
    navigate('/my/reservations', { replace: true });
  };

  return (
    <>
      <AppBar back={isNew ? false : true} title={isNew ? '' : '예약 상세'} />
      <div className="screen-body has-bottom-bar">
        {isNew && (
          <div className="success-head">
            <span className="success-head__icon" aria-hidden="true"><Icon name="check" size={32} /></span>
            <h2 className="screen-title">예약이 완료되었어요</h2>
            <p className="muted">방문하시면 매장에서 결제 후 이용을 시작해요.</p>
          </div>
        )}

        <ReservationCard reservation={reservation} detailed />

        <section className="block" aria-labelledby="guide-title">
          <h3 id="guide-title" className="block-title">이용 안내</h3>
          <ul className="note-list">
            <li>{PAYMENT_POLICY}</li>
            {space.drink === 'required' && <li>이용 전 음료는 방문 후 함께 결제해요. 이용 시작부터 재주문에 50% 할인 쿠폰을 최대 2회 드려요.</li>}
            {space.drink === 'included' && <li>기본 음료는 이용료에 포함돼요. 공간 번호({reservation.unit}번)로 음료를 배달 주문할 수 있어요. 아메리카노·카페라떼 1잔 무료 리필 1회, 이후 50% 할인 쿠폰 최대 2회.</li>}
            <li>{extensionStatus(reservation, reservations)}</li>
            <li>{CANCEL_POLICY}</li>
            {LATE_POLICY.map((n) => <li key={n}>{n}</li>)}
            {CLOSING_NOTICES.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </section>

        {upcoming && (
          <section className="block" aria-labelledby="cancel-title">
            <h3 id="cancel-title" className="block-title">예약 취소</h3>
            {cancellable ? (
              <>
                <p className="muted">{formatDate(reservation.date)} 전날 23:59까지 취소할 수 있어요.</p>
                <button type="button" className="button button--secondary button--block cancel-button" onClick={() => setConfirmOpen(true)}>예약 취소하기</button>
              </>
            ) : (
              <p className="muted">이용 당일에는 앱에서 취소할 수 없어요. 급한 사정이 있으면 매장에 연락해 주세요. 사유가 확인되면 페널티를 면제해요.</p>
            )}
          </section>
        )}
      </div>
      <BottomBar>
        {inUse && (
          <Link className="button button--primary" to={`/order?reservation=${reservation.id}`}>
            {space.drink === 'included' ? '음료 배달 주문' : '추가 음료 주문'}
          </Link>
        )}
        <Link className={`button ${inUse ? 'button--secondary' : 'button--primary button--block'}`} to={isNew ? '/' : '/my/reservations'}>
          {isNew ? '홈으로' : '내 예약'}
        </Link>
      </BottomBar>
      <NoticeDialog open={confirmOpen} title="예약을 취소할까요?" confirmLabel="예약 취소" danger onConfirm={cancel} onClose={() => setConfirmOpen(false)}>
        {formatDate(reservation.date)} {space.name} {reservation.unit}번 예약을 취소해요. 예약에 쓴 포인트는 돌려받아요.
      </NoticeDialog>
    </>
  );
}
