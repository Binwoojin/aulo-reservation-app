import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandBand } from '../components/BrandBand.jsx';
import { AppBar, isUpcoming } from '../components/AppShell.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { isInUse } from '../lib/reservation.js';
import { rebookPath, recentPastReservations } from '../lib/again.js';
import { RESERVATION_HISTORY_MONTHS, SPACES } from '../config/policy.js';

export default function MyReservationsPage() {
  const { myReservations: reservations } = useAppData();
  const now = useNow();
  const [tab, setTab] = useState('upcoming');
  const byTime = (a, b) => a.date.localeCompare(b.date) || a.start - b.start;
  const upcoming = reservations.filter((r) => isUpcoming(r, now)).sort(byTime);
  // 지난 예약은 최근 1개월만 (기록은 지우지 않는다)
  const past = recentPastReservations(reservations, now).sort((a, b) => byTime(b, a));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <>
      <AppBar back title="내 예약" />
      <div className="screen-body order-body">
        <BrandBand id="resv-title" script="my stays" title="내 예약">
          <div className="text-tabs" role="tablist" aria-label="예약 구분">
            <button type="button" role="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>다가오는 {upcoming.length}</button>
            <button type="button" role="tab" aria-selected={tab === 'past'} onClick={() => setTab('past')}>지난 {past.length}</button>
          </div>
        </BrandBand>
        {tab === 'past' && <p className="list-note">최근 {RESERVATION_HISTORY_MONTHS}개월 안에 이용한 예약만 보여 드려요.</p>}
        {list.length ? (
          <ul className="stack swap" key={tab}>
            {list.map((r) => (
              <li key={r.id} className="reservation-item">
                <ReservationCard reservation={r} link />
                {/* 이용 중인 좌석은 여기서 바로 좌석 주문으로 (카페 장바구니와 따로 운영) */}
                {tab === 'past' && <Link className="button button--secondary button--block seat-order-link" to={rebookPath(r)}>다시 예약</Link>}
                {isInUse(r, now) && (
                  <Link className="button button--primary button--block seat-order-link" to={`/reservations/${r.id}/order`}>
                    {SPACES[r.type].drink === 'included' ? 'Suite 배달 메뉴' : '추가 주문하기'}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p>{tab === 'upcoming' ? '다가오는 예약이 없어요.' : `최근 ${RESERVATION_HISTORY_MONTHS}개월 동안 지난 예약이 없어요.`}</p>
            {tab === 'upcoming' && <Link className="text-link" to="/reserve">공간 예약하기</Link>}
          </div>
        )}
      </div>
    </>
  );
}
