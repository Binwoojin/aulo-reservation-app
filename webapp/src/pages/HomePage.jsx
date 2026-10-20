import { Link } from 'react-router-dom';
import { BEST_MENU, BEST_MENU_TEMP, MENU, SPACES, SPACE_TYPES } from '../config/policy.js';
import { needsTemp } from '../lib/drink.js';
import { AppBar, isUpcoming } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import { DrinkThumb, SpaceImage, Tag } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { formatWon } from '../lib/time.js';

export default function HomePage() {
  const { myReservations: reservations } = useAppData();
  const now = useNow();
  const next = reservations
    .filter((r) => isUpcoming(r, now))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)[0];

  return (
    <>
      <AppBar />
      <div className="screen-body has-fab">
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

        {next && (
          <section aria-labelledby="next-title" className="block">
            <div className="block-head">
              <h2 id="next-title" className="block-title">다가오는 예약</h2>
              <Link to="/my/reservations" className="text-link">전체 보기</Link>
            </div>
            <ReservationCard reservation={next} link />
          </section>
        )}

        <section aria-labelledby="best-title" className="block">
          <div className="block-head">
            <h2 id="best-title" className="block-title">머무름에 곁들이는 한 잔</h2>
            <Link to="/order" className="text-link">메뉴 전체</Link>
          </div>
          {/* 베스트: 주문 데이터가 없어 운영자가 고른 대표 메뉴. 순위·판매량처럼 읽히는 말은 쓰지 않는다 (필수 규칙 5) */}
          <p className="group-hint">어떤 시간에도 잘 어울리는, Aulo의 대표 메뉴예요</p>
          <ul className="best-list" aria-label="대표 메뉴">
            {BEST_MENU.map((id) => MENU.value.find((d) => d.id === id)).map((d) => (
              <li key={d.id}>
                <Link to={needsTemp(d) ? `/menu/${d.id}?temp=${BEST_MENU_TEMP}` : `/menu/${d.id}`} className="best-item">
                  <DrinkThumb drink={d} temp={BEST_MENU_TEMP} size="sm" />
                  <span className="best-item__name">{d.name}</span>
                  <span className="best-item__price">{formatWon(d.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

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

      {/* 이용 도우미: 오른쪽 아래 고정 버튼. 탭바 위에 떠서 스크롤해도 늘 보인다 */}
      <Link to="/help" className="help-fab" aria-label="이용 도우미 열기">
        <Icon name="chat" size={24} />
      </Link>
    </>
  );
}
