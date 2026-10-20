import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BEST_MENU, BEST_MENU_TEMP, HOURS, MENU, SPACES } from '../config/policy.js';
import { needsTemp } from '../lib/drink.js';
import { AppBar } from '../components/AppShell.jsx';
import { itemsSummary, useReorder } from '../components/AgainCard.jsx';
import Icon from '../components/Icon.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import StorePicker from '../components/StorePicker.jsx';
import { DrinkThumb, SpaceImage } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { lastPastReservation, lastReorderable, rebookPath, reorderItems } from '../lib/again.js';
import { HALF_LIMIT, orderKindFor, parseKey, remainingBenefits, sortedKeys } from '../lib/order.js';
import { canCancel, getDrink, getStore, isHoliday, reservationEnd } from '../lib/reservation.js';
import { daysUntil, formatDuration, homeStatus, storeToday } from '../lib/status.js';
import { drinkPicks } from '../lib/drinkPick.js';
import { QUESTIONS } from '../lib/recommend.js';
import { TEMPS } from '../lib/order.js';
import { addDays, formatDate, formatTime, formatWon, minutesOfDay } from '../lib/time.js';

// 홈: 맨 위에 지금 매장과 내 상태 하나(이용 중 > 다가오는 예약 > 예약 없음, 필수 규칙 2·3),
// 그 아래 '한 번에 다시 하기'(규칙 1), 대표 음료, 매장 기준 공간 정보(규칙 4), 맨 아래 데모 안내(규칙 7).
export default function HomePage() {
  const { user, myReservations, myOrders, store } = useAppData();
  const now = useNow();
  const status = homeStatus(myReservations, now);
  const lastOrder = user ? lastReorderable(myOrders) : null;
  const lastPast = user && status.kind === 'none' ? lastPastReservation(myReservations, now) : null;
  const fabHidden = useHideOnScrollDown();

  return (
    <>
      <AppBar />
      <div className="screen-body has-fab">
        {/* 지금 매장 + 오늘 운영: 박스 없이 한 줄 (필수 규칙 4) */}
        <div className="home-meta">
          <StorePicker variant="inline" />
          <StoreToday now={now} />
        </div>

        {status.kind === 'in-use' && <InUseCard status={status} orders={myOrders} />}
        {status.kind === 'upcoming' && <UpcomingCard reservation={status.reservation} now={now} />}
        {status.kind === 'none' && (
          <>
            <section className="home-greeting" aria-labelledby="home-title">
              <p className="eyebrow" lang="en">SPACE FOR YOUR NOW</p>
              <h2 id="home-title" className="screen-title">오늘은 어떤 시간을<br />보내실 건가요?</h2>
            </section>
            {/* 예약이 없을 때만: 사진 위 목적 칩으로 공간 찾기를 시작한다. 고른 목적이 첫 질문의 답이 된다 */}
            <PurposeHero />
          </>
        )}

        {(lastOrder || lastPast) && <AgainTiles reservation={lastPast} order={lastOrder} />}

        <DrinkShelf orders={user ? myOrders : []} now={now} showPicks={status.kind !== 'in-use'} />

        <AuloDay now={now} />

        <p className="demo-pill home-demo">데모 · 실제 예약·결제 없음</p>
      </div>

      {/* 이용 도우미: 오른쪽 아래 고정 버튼. 탭바 위에 떠서 스크롤해도 늘 보인다 */}
      <Link to="/help" className="help-fab" data-hidden={fabHidden || undefined} aria-label="이용 도우미 열기">
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

// 지금 매장의 오늘: 운영 시간·퇴실 시각, 공휴일 휴무 (정책 데이터만 사용)
function StoreToday({ now }) {
  const { closed, nextHoliday } = storeToday(now, isHoliday, addDays);
  return (
    <p className="store-today" data-closed={closed || undefined}>
      {closed ? '오늘은 공휴일 휴무' : `오늘 ${formatTime(HOURS.open)}–${formatTime(HOURS.close)}`}
      {nextHoliday && <> · {formatDate(nextHoliday).replace(/ \(.\)$/, '')} 휴무</>}
    </p>
  );
}

// 예약 없음: 매장 사진 위에 목적 칩을 얹는다. 칩을 누르면 추천의 두 번째 질문부터 시작
function PurposeHero() {
  const purpose = QUESTIONS[0];
  return (
    <section className="purpose-hero" aria-labelledby="purpose-title">
      <SpaceImage space={SPACES.cafe} eager />
      <div className="purpose-hero__body">
        <h2 id="purpose-title" className="purpose-hero__title">무엇을 하러 오세요?</h2>
        <p className="purpose-hero__text">고르면 두 가지만 더 묻고 맞는 공간을 찾아 드려요</p>
        <ul className="purpose-hero__chips">
          {purpose.options.map((o) => (
            <li key={o.id}><Link to={`/recommend?purpose=${o.id}`} className="glass-chip">{o.label}</Link></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// 한 번에 다시 하기 (필수 규칙 1): 사진이 있는 작은 타일 두 장
function AgainTiles({ reservation: r, order }) {
  const reorder = useReorder();
  const first = order ? parseKey(sortedKeys(reorderItems(order))[0]) : null;
  const drink = first ? getDrink(first.id) : null;
  return (
    <section className="block" aria-labelledby="again-title">
      <h2 id="again-title" className="block-title">지난번처럼</h2>
      <div className={`again-tiles${r && order && drink ? '' : ' again-tiles--single'}`}>
        {r && (
          <Link to={rebookPath(r)} className="again-tile">
            <SpaceImage space={SPACES[r.type]} />
            <span className="again-tile__body">
              <span className="again-tile__kicker">다시 예약</span>
              <span className="again-tile__what">{SPACES[r.type].name}</span>
              <span className="again-tile__meta">{formatTime(r.start)}부터 {r.hours}시간</span>
            </span>
          </Link>
        )}
        {order && drink && (
          <button type="button" className="again-tile" onClick={() => reorder(order)}>
            <DrinkThumb drink={drink} temp={first.temp} size="card" />
            <span className="again-tile__body">
              <span className="again-tile__kicker">다시 담기</span>
              <span className="again-tile__what">{itemsSummary(reorderItems(order))}</span>
              <span className="again-tile__meta">같은 옵션으로 장바구니에</span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

// 음료: 홈 구성 결정의 '추천'과 '베스트'를 한 섹션의 두 탭으로 (같은 사진 카드)
// 추천은 이유를 제목 한 줄로 보여 주고(필수 규칙 5), 이용 중에는 상태 카드의 추천 한 줄만 두므로 숨긴다
function DrinkShelf({ orders, now, showPicks }) {
  const { slot, picks } = drinkPicks({ orders, now });
  const hasPicks = showPicks && picks.length > 0;
  const [tab, setTab] = useState(hasPicks ? 'picks' : 'best');
  const current = hasPicks && tab === 'picks' ? 'picks' : 'best';
  const hasRecent = picks.some((p) => p.basis === 'recent');
  const items = current === 'picks'
    ? picks.map((p) => ({ drink: p.drink, temp: p.temp, tag: p.basis === 'recent' ? '지난 주문' : null }))
    : BEST_MENU.map((id) => ({ drink: MENU.value.find((d) => d.id === id), temp: null, tag: null }));
  return (
    <section aria-labelledby="best-title" className="block drink-shelf">
      <div className="block-head">
        <div>
          {/* 로고와 같은 Fraunces 소문자로 브랜드 목소리를 한 줄 */}
          <p className="shelf-script" lang="en">a cup for your stay</p>
          <h2 id="best-title" className="block-title">머무름에 곁들이는 한 잔</h2>
        </div>
        <Link to="/order" className="text-link">메뉴 전체</Link>
      </div>
      {hasPicks && (
        <div className="text-tabs" role="tablist" aria-label="음료 분류">
          <button type="button" role="tab" aria-selected={current === 'picks'} onClick={() => setTab('picks')}>지금 추천</button>
          <button type="button" role="tab" aria-selected={current === 'best'} onClick={() => setTab('best')}>대표 메뉴</button>
        </div>
      )}
      {current === 'picks' ? (
        <p className="shelf-reason">
          <span className="shelf-reason__kicker" lang="en">{slot.en[0]}{slot.en.slice(1).toLowerCase()}</span>
          {slot.reason}{hasRecent ? ' · 지난 주문도 함께 담았어요' : ''}
        </p>
      ) : (
        // 베스트: 주문 데이터가 없어 운영자가 고른 대표 메뉴. 순위·판매량처럼 읽히는 말은 쓰지 않는다 (필수 규칙 5)
        <p className="shelf-reason">어떤 시간에도 잘 어울리는, Aulo의 대표 메뉴예요</p>
      )}
      <ul className="best-list" aria-label={current === 'picks' ? '지금 추천 음료' : '대표 메뉴'}>
        {items.map(({ drink: d, temp, tag }) => {
          const showTemp = needsTemp(d) ? (temp ?? BEST_MENU_TEMP) : null;
          return (
            <li key={d.id}>
              <Link to={showTemp ? `/menu/${d.id}?temp=${showTemp}` : `/menu/${d.id}`} className="best-item">
                <span className="best-item__media">
                  <DrinkThumb drink={d} temp={showTemp} size="card" />
                  {tag && <span className="best-item__tag">{tag}</span>}
                </span>
                <span className="best-item__name">{temp ? `${TEMPS.find((t) => t.value === temp).label} ` : ''}{d.name}</span>
                <span className="best-item__price"><span lang="en">{d.price.toLocaleString('ko-KR')}</span>원</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// 도우미 버튼: 아래로 내리는 동안에는 숨겨 콘텐츠(섹션 링크 등)를 가리지 않고, 위로 올리거나 맨 위면 다시 보인다
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80 || y < last - 6) setHidden(false);
      else if (y > last + 6) setHidden(true);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return hidden;
}

// Aulo의 하루 (브랜드 'Stay in your rhythm'): 시간 흐름에 따라 어울리는 공간을 세로 타임라인으로 보여 준다.
// 시간대와 공간의 짝은 이야기일 뿐, 모든 공간은 운영 시간 내내 이용할 수 있다고 함께 알린다. 지금 시간대를 강조한다.
const DAY = [
  { from: HOURS.open, time: '08:00', en: 'MORNING', type: 'cafe' },
  { from: 11 * 60, time: '11:00', en: 'MIDDAY', type: 'focus' },
  { from: 14 * 60, time: '14:00', en: 'AFTERNOON', type: 'rest' },
  { from: 17 * 60, time: '17:00', en: 'EVENING', type: 'suite' },
];
function AuloDay({ now }) {
  const { store } = useAppData();
  const m = minutesOfDay(now);
  const closed = m < HOURS.open || m >= HOURS.checkout;
  const current = closed ? -1 : DAY.findLastIndex((d) => m >= d.from);
  return (
    <section aria-labelledby="day-title" className="block aulo-day">
      <p className="eyebrow" lang="en">STAY IN YOUR RHYTHM</p>
      <h2 id="day-title" className="block-title">Aulo의 하루</h2>
      <p className="group-hint">모든 공간은 {formatTime(HOURS.open)}–{formatTime(HOURS.checkout)} 이용할 수 있어요 · 좌석 수는 {store.name} 기준</p>
      <ol className="day-line">
        {DAY.map((d, i) => {
          const space = SPACES[d.type];
          return (
            <li key={d.type} className="day-line__item" data-now={i === current || undefined}>
              <span className="day-line__time"><span lang="en">{d.time}</span>{i === current && <span className="day-line__now">지금</span>}</span>
              <Link to={space.reservable ? `/reserve/${d.type}` : '/order'} className="day-card">
                <SpaceImage space={space} />
                <span className="day-card__body">
                  <span className="day-card__kicker" lang="en">{d.en} · {space.name}</span>
                  <span className="day-card__headline">{space.headline}</span>
                  <span className="day-card__meta">
                    {space.reservable
                      ? `${space.unitName} ${store.units[d.type]}개 · ${formatWon(space.pricePerHour)}/시간 · ${space.minHours}~${space.maxHours}시간`
                      : '예약 없이 음료 주문 후 이용'}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        <li className="day-line__item day-line__item--end" data-now={closed || undefined}>
          <span className="day-line__time"><span lang="en">{formatTime(HOURS.checkout)}</span>{closed && <span className="day-line__now">지금</span>}</span>
          <p className="day-end">
            <strong>모든 좌석 퇴실</strong>
            <span>{formatTime(HOURS.close)}에 문을 닫고, 내일 {formatTime(HOURS.open)}에 다시 열어요</span>
          </p>
        </li>
      </ol>
    </section>
  );
}
