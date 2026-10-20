import { Link } from 'react-router-dom';
import { BEST_MENU, BEST_MENU_TEMP, HOURS, MENU, SPACES, SPACE_TYPES } from '../config/policy.js';
import { needsTemp } from '../lib/drink.js';
import { AppBar } from '../components/AppShell.jsx';
import { RebookCard, ReorderCard } from '../components/AgainCard.jsx';
import Icon from '../components/Icon.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import StorePicker from '../components/StorePicker.jsx';
import { DrinkThumb, SpaceImage, Tag } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { lastPastReservation, lastReorderable } from '../lib/again.js';
import { HALF_LIMIT, orderKindFor, remainingBenefits } from '../lib/order.js';
import { canCancel, getStore, reservationEnd } from '../lib/reservation.js';
import { daysUntil, formatDuration, homeStatus } from '../lib/status.js';
import { addDays, formatDate, formatTime, formatWon } from '../lib/time.js';

// 홈: 맨 위에 지금 매장과 내 상태 하나(이용 중 > 다가오는 예약 > 예약 없음, 필수 규칙 2·3),
// 그 아래 '한 번에 다시 하기'(규칙 1), 대표 음료, 매장 기준 공간 정보(규칙 4), 맨 아래 데모 안내(규칙 7).
export default function HomePage() {
  const { user, myReservations, myOrders, store } = useAppData();
  const now = useNow();
  const status = homeStatus(myReservations, now);
  const lastOrder = user ? lastReorderable(myOrders) : null;
  const lastPast = user && status.kind === 'none' ? lastPastReservation(myReservations, now) : null;

  return (
    <>
      <AppBar />
      <div className="screen-body has-fab">
        <StorePicker />

        {status.kind === 'in-use' && <InUseCard status={status} orders={myOrders} />}
        {status.kind === 'upcoming' && <UpcomingCard reservation={status.reservation} now={now} />}
        {status.kind === 'none' && (
          <>
            <section className="home-greeting" aria-labelledby="home-title">
              <p className="eyebrow" lang="en">SPACE FOR YOUR NOW</p>
              <h2 id="home-title" className="screen-title">오늘은 어떤 시간을<br />보내실 건가요?</h2>
            </section>
            {/* 예약이 없을 때만: 상태 카드 자리에 목적별 공간 찾기를 둔다 (추천 탭 바로가기를 늘 반복하지 않게, 규칙 6) */}
            <Link to="/recommend" className="hero-card">
              <SpaceImage space={SPACES.cafe} eager />
              <span className="hero-card__body">
                <span className="hero-card__title">목적에 맞는 공간 찾기</span>
                <span className="hero-card__text">세 가지 질문이면 충분해요</span>
              </span>
              <span className="hero-card__go" aria-hidden="true"><Icon name="chevron" size={20} /></span>
            </Link>
          </>
        )}

        {(lastOrder || lastPast) && (
          <div className="again-stack">
            {lastPast && <RebookCard reservation={lastPast} />}
            {lastOrder && <ReorderCard order={lastOrder} />}
          </div>
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
                  <DrinkThumb drink={d} temp={BEST_MENU_TEMP} size="card" />
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
          <p className="group-hint">{store.name}에서 운영하는 좌석·공간 수예요</p>
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
                        {space.reservable ? `${space.unitName} ${store.units[type]}개 · ${formatWon(space.pricePerHour)}/시간` : '예약 없이 이용'}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="demo-pill home-demo">데모 · 실제 예약·결제 없음</p>
      </div>

      {/* 이용 도우미: 오른쪽 아래 고정 버튼. 탭바 위에 떠서 스크롤해도 늘 보인다 */}
      <Link to="/help" className="help-fab" aria-label="이용 도우미 열기">
        <Icon name="chat" size={24} />
      </Link>
    </>
  );
}

// 이용 중: 남은 시간·종료 시각과 지금 할 수 있는 일(추가 주문/배달)을 바로 보여 준다
function InUseCard({ status, orders }) {
  const r = status.reservation;
  const space = SPACES[r.type];
  const kind = orderKindFor(r);
  const left = remainingBenefits(kind, r, orders);
  const progress = Math.min(100, Math.max(0, ((r.hours * 60 - status.minutesLeft) / (r.hours * 60)) * 100));
  const tip = kind === 'suite'
    ? `${left.refill ? '아메리카노·카페라떼 1잔 무료 리필이 남아 있어요. ' : ''}공간 번호로 배달해 드려요.`
    : left.half
      ? `이용 중 재주문은 50% 할인 쿠폰을 쓸 수 있어요 (남은 ${left.half}회 / ${HALF_LIMIT}회).`
      : '50% 할인 쿠폰을 모두 썼어요. 추가 주문은 정상가예요.';
  return (
    <section className="status-card" aria-labelledby="status-title">
      <p className="status-card__eyebrow"><span className="live-dot" aria-hidden="true" />이용 중 · {getStore(r.storeId)?.name}</p>
      <h2 id="status-title" className="status-card__title">{space.name} {r.unit}번 {space.unitName}</h2>
      <p className="status-card__time"><strong>{formatDuration(status.minutesLeft)}</strong> 남았어요</p>
      <div className="status-progress" role="progressbar" aria-label="이용 시간 진행" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="status-card__meta">{formatTime(r.start)} – {formatTime(reservationEnd(r))} 이용 · {formatTime(HOURS.checkout)}까지 퇴실</p>
      <p className="status-card__tip"><Icon name="cup" size={16} />{tip}</p>
      <div className="status-card__actions">
        <Link className="button button--primary" to={`/reservations/${r.id}/order`}>{kind === 'suite' ? '배달 주문하기' : '추가 주문하기'}</Link>
        <Link className="button button--secondary" to={`/reservations/${r.id}`}>예약 상세</Link>
      </div>
    </section>
  );
}

// 다가오는 예약: 며칠 남았는지와 취소 기한을 함께
function UpcomingCard({ reservation: r, now }) {
  const days = daysUntil(r.date, now);
  const when = days === 0 ? '오늘' : days === 1 ? '내일' : `${days}일 뒤`;
  return (
    <section aria-labelledby="next-title" className="block status-upcoming">
      <div className="block-head">
        <h2 id="next-title" className="block-title">다가오는 예약 <span className="badge badge--when">{when}</span></h2>
        <Link to="/my/reservations" className="text-link">전체 보기</Link>
      </div>
      <ReservationCard reservation={r} link />
      <p className="group-hint">
        {canCancel(r, now)
          ? `${formatDate(addDays(r.date, -1))} 23:59까지 앱에서 취소할 수 있어요.`
          : '오늘 예약이에요. 늦을 것 같으면 매장에 미리 연락해 주세요.'}
      </p>
    </section>
  );
}
