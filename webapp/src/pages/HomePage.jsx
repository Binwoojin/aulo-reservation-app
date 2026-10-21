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
import { lastPastReservation, lastReorderable, rebookPath, recentPastReservations, reorderItems } from '../lib/again.js';
import { orderKindFor, parseKey, recentOrders, remainingBenefits, sortedKeys } from '../lib/order.js';
import { canCancel, getDrink, getStore, isHoliday, reservationEnd } from '../lib/reservation.js';
import { daysUntil, formatDuration, homeStatus, storeToday } from '../lib/status.js';
import { drinkPicks } from '../lib/drinkPick.js';
import { pointBalance, stampCount } from '../lib/rewards.js';
import { QUESTIONS } from '../lib/recommend.js';
import { TEMPS, drinkLabel } from '../lib/order.js';
import { ORDER_STAGES, STAGE_TITLE, latestActiveOrder, orderStage, stageIndex } from '../lib/orderStatus.js';
import { addDays, formatDate, formatTime, formatWon, minutesOfDay } from '../lib/time.js';
import { SupportSection } from '../components/MySection.jsx';

// 홈: 맨 위에 지금 매장과 내 상태 하나(이용 중 > 다가오는 예약 > 예약 없음, 필수 규칙 2·3),
// 그 아래 '한 번에 다시 하기'(규칙 1), 대표 음료, 매장 기준 공간 정보(규칙 4), 맨 아래 데모 안내(규칙 7).
export default function HomePage() {
  const { user, myReservations, myOrders, store } = useAppData();
  const now = useNow();
  const status = homeStatus(myReservations, now);
  const lastOrder = user ? lastReorderable(recentOrders(myOrders, now)) : null;
  const lastPast = user && status.kind === 'none' ? lastPastReservation(recentPastReservations(myReservations, now), now) : null;
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
        {/* 진행 중인 주문 (필수 규칙 3): 상태 카드 바로 아래. 예약이 없을 때는 인사 아래·사진 위 */}
        {user && status.kind !== 'none' && <ActiveOrderStrip orders={myOrders} />}
        {status.kind === 'none' && (
          <>
            <section className="home-greeting" aria-labelledby="home-title">
              <p className="eyebrow" lang="en">SPACE FOR YOUR NOW</p>
              <h2 id="home-title" className="screen-title">오늘은 어떤 시간을<br />보내실 건가요?</h2>
            </section>
            {user && <ActiveOrderStrip orders={myOrders} />}
            {/* 예약이 없을 때만: 사진 위 목적 칩으로 공간 찾기를 시작한다. 고른 목적이 첫 질문의 답이 된다 */}
            <PurposeHero />
          </>
        )}

        {(lastOrder || lastPast) && <AgainTiles reservation={lastPast} order={lastOrder} />}

        {user && <RewardStrip />}

        <DrinkShelf orders={user ? myOrders : []} now={now} showPicks={status.kind !== 'in-use'} />

        <AuloDay now={now} />

        {/* 보조 기능: 홈 맨 아래 (2026-10-21 사용자 결정, 마이에서 옮김). 로그인 없이도 쓴다 */}
        <SupportSection />

        <p className="demo-pill home-demo">데모 · 실제 예약·결제 없음</p>
      </div>

      {/* 이용 도우미: 오른쪽 아래 고정 버튼. 탭바 위에 떠서 스크롤해도 늘 보인다 */}
      <Link to="/help" className="help-fab" data-hidden={fabHidden || undefined} aria-label="이용 도우미 열기">
        <Icon name="chat" size={24} />
      </Link>
    </>
  );
}

// 진행 중인 주문 한 줄: 단계 점 5개 + 지금 단계 + 첫 음료. 누르면 주문 현황으로. 진행 중인 주문이 없으면 숨긴다
function ActiveOrderStrip({ orders }) {
  const now = useNow(5000);
  const order = latestActiveOrder(orders, now);
  if (!order) return null;
  const stage = orderStage(order, now);
  const current = stageIndex(stage);
  const keys = sortedKeys(order.items);
  const first = parseKey(keys[0] ?? '');
  const cups = Object.values(order.items).reduce((a, b) => a + b, 0);
  const name = getDrink(first.id) ? drinkLabel(first.id, first.temp) : '음료';
  return (
    <Link to={`/my/orders/${order.id}`} className="active-order" data-stage={stage}>
      <span className="active-order__pulse" aria-hidden="true" />
      <span className="active-order__text">
        <span className="active-order__stage">{STAGE_TITLE[stage]}</span>
        <span className="active-order__items">{name}{cups > 1 ? ` 외 ${cups - 1}잔` : ''}</span>
      </span>
      <span className="active-order__dots" aria-hidden="true">
        {ORDER_STAGES.map((st, i) => <span key={st.id} data-on={i <= current || undefined} />)}
      </span>
      <Icon name="chevron" size={18} />
    </Link>
  );
}

// 이용 중: 남은 시간·종료 시각과 지금 할 수 있는 일(추가 주문/배달)을 바로 보여 준다
function InUseCard({ status, orders }) {
  const r = status.reservation;
  const space = SPACES[r.type];
  const kind = orderKindFor(r);
  const left = remainingBenefits(kind, r, orders);
  const progress = Math.min(100, Math.max(0, ((r.hours * 60 - status.minutesLeft) / (r.hours * 60)) * 100));
  // 쿠폰 남은 장수는 아래 쿠폰 줄에서 보여 주므로, 여기서는 받는 방법만
  const tip = kind === 'suite' ? `주문하면 ${r.unit}번 Suite로 배달해 드려요.` : `추가 주문은 ${r.unit}번 ${space.unitName}에서 받아 가세요.`;
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
      {/* 이용 시작과 함께 발급된 재주문 쿠폰의 남은 장수 → 쿠폰함 */}
      <Link to="/my/coupons" className="status-card__coupons">
        <Icon name="percent" size={18} />
        <span>재주문 쿠폰 <b lang="en">{left.half + left.refill}</b>장 남았어요</span>
        <span className="status-card__coupons-link">내 쿠폰<Icon name="chevron" size={16} /></span>
      </Link>
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
  // 제목은 보여 주는 것에 맞춘다 ('지난번처럼'은 무엇을 다시 하는지 알 수 없어 2026-10-21 변경)
  const both = r && order && drink;
  const title = both ? '최근 이용 다시 하기' : r ? '지난 예약 다시 하기' : '최근 주문 다시 담기';
  const hint = both
    ? '지난 예약과 최근 주문을 같은 조건으로 한 번에 다시 시작해요.'
    : r ? '공간·시간·좌석·음료를 채워 두고 날짜만 고르면 돼요.' : '같은 음료·옵션으로 장바구니에 담아요.';
  return (
    <section className="block" aria-labelledby="again-title">
      <div>
        <h2 id="again-title" className="block-title">{title}</h2>
        <p className="group-hint">{hint}</p>
      </div>
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
        <p className="shelf-reason swap" key="reason-picks">
          <span className="shelf-reason__kicker" lang="en">{slot.en[0]}{slot.en.slice(1).toLowerCase()}</span>
          {slot.reason}{hasRecent ? ' · 지난 주문도 함께 담았어요' : ''}
        </p>
      ) : (
        // 베스트: 주문 데이터가 없어 운영자가 고른 대표 메뉴. 순위·판매량처럼 읽히는 말은 쓰지 않는다 (필수 규칙 5)
        <p className="shelf-reason swap" key="reason-best">어떤 시간에도 잘 어울리는, Aulo의 대표 메뉴예요</p>
      )}
      <ul className="best-list swap" key={`list-${current}`} aria-label={current === 'picks' ? '지금 추천 음료' : '대표 메뉴'}>
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
  // 지금 시간대 카드만 펼쳐 두고, 나머지는 한 줄로 접는다. 접힌 줄을 누르면 그 카드가 펼쳐진다 (한 번에 하나)
  // 운영 시간 밖이면 아침(오픈) 카드를 펼친다
  const [open, setOpen] = useState(current >= 0 ? current : 0);
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
              <span className="day-line__dot" aria-hidden="true" />
              <p className="day-line__time"><span lang="en">{d.time}</span><span lang="en" className="day-line__en">{d.en}</span>{i === current && <span className="day-line__now">지금</span>}</p>
              {i !== open ? (
                <button type="button" className="day-row" onClick={() => setOpen(i)} aria-expanded="false" aria-label={`${d.time} ${space.name} 펼치기`}>
                  <SpaceImage space={space} />
                  <span className="day-row__text">
                    <span className="day-row__name" lang="en">{space.name}</span>
                    <span className="day-row__meta">
                      {space.reservable
                        ? `${store.units[d.type]}${space.unitName === '공간' ? '실' : '석'} · ${formatWon(space.pricePerHour)}/시간`
                        : '예약 없이 이용'}
                    </span>
                  </span>
                  <Icon name="down" size={18} />
                </button>
              ) : (
              <Link to={space.reservable ? `/reserve/${d.type}` : '/order'} className="day-card day-card--open" aria-expanded="true">
                <SpaceImage space={space} />
                <span className="day-card__body">
                  <span className="day-card__kicker" lang="en">{space.name}</span>
                  <span className="day-card__headline">{space.headline}</span>
                  {/* 비교 카드: 특징 아이콘 · 지금 매장 좌석 수 · 이용 시간 범위 · 가격 */}
                  <span className="day-card__features">
                    {space.highlights.map((h) => <span key={h.label}><Icon name={h.icon} size={14} />{h.label}</span>)}
                  </span>
                  <span className="day-card__facts">
                    {space.reservable ? (
                      <>
                        <span><strong lang="en">{store.units[d.type]}</strong>{space.unitName === '공간' ? '실' : '석'}</span>
                        <span><strong lang="en">{space.minHours}~{space.maxHours}</strong>시간</span>
                        <span><strong lang="en">{space.pricePerHour.toLocaleString('ko-KR')}</strong>원/시간</span>
                      </>
                    ) : <span>음료 주문 후 이용</span>}
                  </span>
                </span>
              </Link>
              )}
            </li>
          );
        })}
        <li className="day-line__item day-line__item--end" data-now={closed || undefined}>
          <span className="day-line__dot" aria-hidden="true" />
          <p className="day-line__time"><span lang="en">{formatTime(HOURS.checkout)}</span>{closed && <span className="day-line__now">지금</span>}</p>
          <p className="day-end">
            <strong>모든 좌석 퇴실</strong>
            <span>{formatTime(HOURS.close)}에 문을 닫고, 내일 {formatTime(HOURS.open)}에 다시 열어요</span>
          </p>
        </li>
      </ol>
    </section>
  );
}

// 적립 위젯 (로그인): 스탬프·포인트 개수와 지금 할 수 있는 행동 한 줄.
// 스탬프 교환 혜택은 정책에 없어 개수만 보여 준다. 포인트는 좌석 이용료에만 쓸 수 있다(1P = 1원).
function RewardStrip() {
  const { myOrders, myReservations } = useAppData();
  const now = useNow();
  const stamps = stampCount(myOrders, myReservations, now);
  const points = pointBalance(myReservations, now);
  return (
    <Link to={points > 0 ? '/reserve' : '/my'} className="reward-strip" aria-label={`적립: 스탬프 ${stamps}개, 포인트 ${points}P`}>
      <span className="reward-strip__stats">
        <span><strong lang="en">{stamps}</strong>스탬프</span>
        <span className="reward-strip__sep" aria-hidden="true" />
        <span><strong lang="en">{points.toLocaleString('ko-KR')}</strong>포인트</span>
      </span>
      <span className="reward-strip__action">
        {points > 0 ? `다음 좌석 예약에서 ${points.toLocaleString('ko-KR')}원 할인받을 수 있어요` : '좌석 이용료의 10%가 포인트로 쌓여요'}
        <Icon name="chevron" size={16} />
      </span>
    </Link>
  );
}
