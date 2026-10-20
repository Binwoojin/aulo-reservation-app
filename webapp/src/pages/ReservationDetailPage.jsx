import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CANCEL_POLICY, CLOSING_NOTICES, HOURS, LATE_POLICY, PAYMENT_POLICY, PENALTY, SPACES } from '../config/policy.js';
import { SpaceHead } from '../components/BrandBand.jsx';
import { AppBar, BottomBar, isUpcoming } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import { NoticeDialog } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { canCancel, extensionStatus, forfeitAt, isInUse, reservationEnd } from '../lib/reservation.js';
import { formatDuration } from '../lib/status.js';
import { rebookPath } from '../lib/again.js';
import { formatDate, formatTime, minutesOfDay, toDateString } from '../lib/time.js';

// 예약 완료(?new=1)와 예약 상세를 함께 보여준다
export default function ReservationDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { reservations, removeReservation } = useAppData();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lateOpen, setLateOpen] = useState(false);
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
  const todayBefore = upcoming && !inUse && reservation.date === toDateString(now);
  const minutesLeft = reservationEnd(reservation) - minutesOfDay(now);

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

        <SpaceHead space={space} />
        <ReservationCard reservation={reservation} detailed />

        {/* 지금 알아 둘 것: 예약 단계(이용 전 · 오늘 · 이용 중)에 맞는 안내만 먼저 보여 준다 */}
        {inUse && (
          <section className="live-panel" aria-labelledby="live-title">
            <p id="live-title" className="live-panel__time"><strong>{formatDuration(minutesLeft)}</strong> 남았어요 · {formatTime(reservationEnd(reservation))} 종료</p>
            <div className="status-progress status-progress--light" role="progressbar" aria-label="이용 시간 진행" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((reservation.hours * 60 - minutesLeft) / (reservation.hours * 60)) * 100)}>
              <span style={{ width: `${((reservation.hours * 60 - minutesLeft) / (reservation.hours * 60)) * 100}%` }} />
            </div>
            <ul className="note-list">
              <li>{extensionStatus(reservation, reservations)}</li>
              <li>{formatTime(HOURS.checkout)}까지 모든 좌석은 퇴실해야 해요. 22:30에 앱 알림으로 마감을 안내해요.</li>
            </ul>
          </section>
        )}
        {todayBefore && (
          <section className="live-panel" aria-labelledby="today-title">
            <p id="today-title" className="live-panel__time"><strong>오늘 {formatTime(reservation.start)}</strong> 시작이에요</p>
            <ul className="note-list">
              <li>연락 없이 {formatTime(forfeitAt(reservation))}까지 오지 않으면 예약이 취소되고 {PENALTY.banDays}일 동안 예약할 수 없어요.</li>
              <li>늦을 것 같으면 미리 연락해 주세요. {formatTime(forfeitAt(reservation, true))}까지 예약을 유지해 드려요.</li>
            </ul>
            <button type="button" className="button button--secondary button--block" onClick={() => setLateOpen(true)}>늦을 것 같아요</button>
          </section>
        )}
        {upcoming && !inUse && !todayBefore && (
          <section className="live-panel" aria-labelledby="before-title">
            <p id="before-title" className="live-panel__time"><strong>{formatDate(reservation.date)}</strong> {formatTime(reservation.start)} 방문</p>
            <ul className="note-list">
              <li>이용료는 방문 후 이용 시작 전에 매장에서 결제해요.</li>
              <li>늦을 것 같으면 미리 연락해 주세요. 시작 후 최대 {PENALTY.lateLimitMinutes / 60}시간까지 예약을 유지해 드려요.</li>
            </ul>
          </section>
        )}

        {/* 전체 규칙은 접어 둔다 */}
        <details className="rules">
          <summary className="rules__summary">전체 이용 규칙 보기<Icon name="down" size={18} /></summary>
          <ul className="note-list">
            <li>{PAYMENT_POLICY}</li>
            {space.drink === 'required' && <li>이용 전 음료는 방문 후 함께 결제해요. 이용 시작부터 재주문에 50% 할인 쿠폰을 최대 2회 드려요.</li>}
            {space.drink === 'included' && <li>기본 음료는 이용료에 포함돼요. 공간 번호({reservation.unit}번)로 음료를 배달 주문할 수 있어요. 아메리카노·카페라떼 1잔 무료 리필 1회, 이후 50% 할인 쿠폰 최대 2회.</li>}
            <li>{extensionStatus(reservation, reservations)}</li>
            <li>{CANCEL_POLICY}</li>
            {LATE_POLICY.map((n) => <li key={n}>{n}</li>)}
            {CLOSING_NOTICES.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </details>

        <Link to="/help?q=extend" className="notice-row help-link">
          <Icon name="chat" size={20} /><span>연장·취소·지각 규칙이 궁금하면 이용 도우미에게 물어보세요</span><Icon name="chevron" size={18} />
        </Link>

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
          <Link className="button button--primary" to={`/reservations/${reservation.id}/order`}>
            {space.drink === 'included' ? 'Suite 배달 메뉴' : '추가 주문하기'}
          </Link>
        )}
        {/* 지난 예약은 같은 조건으로 다시 예약 (필수 규칙 1) */}
        {!upcoming && <Link className="button button--primary" to={rebookPath(reservation)}>다시 예약</Link>}
        <Link className={`button ${inUse || !upcoming ? 'button--secondary' : 'button--primary button--block'}`} to={isNew ? '/' : '/my/reservations'}>
          {isNew ? '홈으로' : '내 예약'}
        </Link>
      </BottomBar>
      {/* 지각 연락: 카카오톡 채널 연락은 추후 개발 (정책). 데모에서는 준비 중 안내만 */}
      <NoticeDialog open={lateOpen} title="지각 연락은 준비 중이에요" onClose={() => setLateOpen(false)}>
        카카오톡 채널로 예약 정보와 함께 연락하는 기능을 준비하고 있어요. 지금은 매장에 직접 연락해 주세요. 미리 연락하면 {formatTime(forfeitAt(reservation, true))}까지 예약을 유지해 드려요.
      </NoticeDialog>
      <NoticeDialog open={confirmOpen} title="예약을 취소할까요?" confirmLabel="예약 취소" danger onConfirm={cancel} onClose={() => setConfirmOpen(false)}>
        {formatDate(reservation.date)} {space.name} {reservation.unit}번 예약을 취소해요. 예약에 쓴 포인트는 돌려받아요.
      </NoticeDialog>
    </>
  );
}
