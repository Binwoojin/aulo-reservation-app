import { Link } from 'react-router-dom';
import { SPACES, SPACE_TYPES } from '../config/policy.js';
import { AppBar, isUpcoming } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import { SpaceImage, Tag } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { formatWon } from '../lib/time.js';

const QUICK = [
  { to: '/recommend', icon: 'compass', label: '공간 추천' },
  { to: '/reserve', icon: 'calendar', label: '예약하기' },
  { to: '/order', icon: 'cup', label: '음료 주문' },
  { to: '/my/reservations', icon: 'receipt', label: '내 예약' },
];

export default function HomePage() {
  const { reservations } = useAppData();
  const now = useNow();
  const next = reservations
    .filter((r) => isUpcoming(r, now))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)[0];

  return (
    <>
      <AppBar />
      <div className="screen-body">
        <p className="demo-pill">데모 · 실제 예약·결제 없음</p>
        <section className="home-greeting" aria-labelledby="home-title">
          <p className="eyebrow" lang="en">SPACE FOR YOUR NOW</p>
          <h2 id="home-title" className="screen-title">오늘은 어떤 시간을<br />보내실 건가요?</h2>
        </section>

        <Link to="/recommend" className="hero-card">
          <SpaceImage space={SPACES.cafe} eager />
          <span className="hero-card__body">
            <span className="hero-card__title">목적에 맞는 공간 찾기</span>
            <span className="hero-card__text">세 가지 질문이면 충분해요</span>
          </span>
          <span className="hero-card__go" aria-hidden="true"><Icon name="chevron" size={20} /></span>
        </Link>

        <nav aria-label="바로가기">
          <ul className="quick-grid">
            {QUICK.map((q) => (
              <li key={q.to}>
                <Link to={q.to} className="quick">
                  <span className="quick__icon"><Icon name={q.icon} /></span>
                  <span>{q.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {next && (
          <section aria-labelledby="next-title" className="block">
            <div className="block-head">
              <h2 id="next-title" className="block-title">다가오는 예약</h2>
              <Link to="/my/reservations" className="text-link">전체 보기</Link>
            </div>
            <ReservationCard reservation={next} link />
          </section>
        )}

        <section aria-labelledby="spaces-title" className="block">
          <div className="block-head">
            <h2 id="spaces-title" className="block-title">같은 건물, 다른 머무름</h2>
          </div>
          <ul className="carousel" aria-label="공간 목록">
            {SPACE_TYPES.map((type) => {
              const space = SPACES[type];
              return (
                <li key={type}>
                  <Link to={space.reservable ? `/reserve/${type}` : '/order'} className="space-tile">
                    <SpaceImage space={space} />
                    <span className="space-tile__body">
                      <Tag type={type}>{space.label}</Tag>
                      <span className="space-tile__name" lang="en">{space.name}</span>
                      <span className="space-tile__meta">
                        {space.reservable ? `${formatWon(space.pricePerHour)}/시간 · ${space.minHours}~${space.maxHours}시간` : '예약 없이 이용'}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
