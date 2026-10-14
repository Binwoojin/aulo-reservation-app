import { Link } from 'react-router-dom';
import { SPACES, SPACE_TYPES } from '../config/policy.js';
import { SpaceImage, Tag } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import { reservationEnd } from '../lib/reservation.js';
import { minutesOfDay, toDateString } from '../lib/time.js';

export default function HomePage() {
  const { reservations } = useAppData();
  const now = useNow();
  const today = toDateString(now);
  const upcoming = reservations
    .filter((r) => r.date > today || (r.date === today && reservationEnd(r) > minutesOfDay(now)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);

  return (
    <>
      <section className="home-hero container" aria-labelledby="home-title">
        <p className="section-label" lang="en">YOUR SPACE, YOUR RHYTHM</p>
        <h1 id="home-title">지금, 나에게<br />필요한 공간.</h1>
        <p className="lead">오늘의 목적을 알려주시면 맞는 공간을 찾아드려요.</p>
        <div className="actions">
          <Link className="button button--primary" to="/recommend">공간 추천 받기 <span aria-hidden="true">→</span></Link>
          <Link className="button button--secondary" to="/reserve">바로 예약하기</Link>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="section container" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="section-title">다가오는 예약</h2>
          <ul className="reservation-list">
            {upcoming.map((r) => (
              <li key={r.id}><ReservationCard reservation={r} link /></li>
            ))}
          </ul>
        </section>
      )}

      <section className="section container" aria-labelledby="spaces-title">
        <p className="section-label" lang="en">OUR SPACES</p>
        <h2 id="spaces-title" className="section-title">같은 건물, 다른 머무름.</h2>
        <ul className="space-grid">
          {SPACE_TYPES.map((type) => {
            const space = SPACES[type];
            return (
              <li key={type} className="space-card">
                <SpaceImage space={space} />
                <div className="space-card__body">
                  <Tag type={type}>{space.label} · {space.category}</Tag>
                  <h3 lang="en">{space.name}</h3>
                  <p>{space.headline}</p>
                  {space.reservable ? (
                    <p className="space-card__meta">시간당 {space.pricePerHour.toLocaleString('ko-KR')}원 · {space.minHours}~{space.maxHours}시간</p>
                  ) : (
                    <p className="space-card__meta">좌석 예약 없이 이용</p>
                  )}
                  <Link className="button button--secondary button--block" to={space.reservable ? `/reserve/${type}` : '/order'}>
                    {space.reservable ? `${space.name} 예약` : '음료 주문하기'}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
