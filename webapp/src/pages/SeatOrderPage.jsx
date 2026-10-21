import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MENU, MENU_CATEGORIES, SPACES } from '../config/policy.js';
import { SpaceHead } from '../components/BrandBand.jsx';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { OrderLines, OrderSuccess } from '../components/OrderParts.jsx';
import { DrinkThumb, Stepper } from '../components/ui.jsx';
import CouponPicker from '../components/CouponPicker.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { BENEFIT_LABEL, couponFor, hasTemp, itemKey, orderKindFor, priceOrder, REFILL_DRINKS, remainingBenefits, TEMPS } from '../lib/order.js';
import { getStore, isInUse, reservationEnd } from '../lib/reservation.js';
import { formatTime, formatWon } from '../lib/time.js';

// 좌석 주문: 카페 장바구니와 따로 운영한다. '내 예약 > 예약 상세'에서 이용 중인 예약으로만 들어온다.
// - Focus·Rest: 추가 주문 (50% 할인 쿠폰 최대 2회), 좌석에서 받아 간다
// - Suite: 전용 'Suite 배달 메뉴' (아메리카노·카페라떼 무료 리필 1회 → 50% 쿠폰 최대 2회), 공간 번호로 배달
export default function SeatOrderPage() {
  const { id } = useParams();
  const now = useNow();
  const { myReservations, orders, addOrder } = useAppData();
  const reservation = myReservations.find((r) => r.id === id);
  const [items, setItems] = useState({});
  const [category, setCategory] = useState(MENU_CATEGORIES[0].id);
  const [placed, setPlaced] = useState(null);
  const [chosen, setChosen] = useState(null); // 고른 쿠폰 (없으면 가장 유리한 쿠폰 자동)

  if (!reservation) {
    return (
      <>
        <AppBar back title="좌석 주문" />
        <div className="screen-body center-state">
          <h2 className="screen-title">예약을 찾을 수 없어요</h2>
          <Link className="button button--primary" to="/my/reservations">내 예약</Link>
        </div>
      </>
    );
  }

  const space = SPACES[reservation.type];
  const kind = orderKindFor(reservation);
  const isSuite = kind === 'suite';
  const title = isSuite ? 'Suite 배달 메뉴' : '추가 주문';
  const inUse = isInUse(reservation, now);
  const quote = priceOrder({ kind, items, reservation, previousOrders: orders, chosen });
  const coupon = couponFor(kind, reservation, orders, items, chosen);
  const left = remainingBenefits(kind, reservation, orders);
  const count = Object.values(items).reduce((a, b) => a + b, 0);
  const where = isSuite ? `${reservation.unit}번 Suite로 배달해 드려요` : `${space.name} ${reservation.unit}번 ${space.unitName}에서 받아 가세요`;

  const submit = () => {
    if (!count || !inUse) return;
    const order = {
      id: crypto.randomUUID(),
      kind,
      serve: 'dine-in',
      reservationId: reservation.id,
      items,
      total: quote.total,
      benefit: quote.benefit,
      coupon: coupon?.title ?? null,
      createdAt: new Date().toISOString(),
    };
    addOrder(order);
    setPlaced({ order, quote });
    setItems({});
    window.scrollTo(0, 0);
  };

  if (placed) {
    return <OrderSuccess order={placed.order} quote={placed.quote} message={`${where}.`} moreTo={`/reservations/${reservation.id}`} moreLabel="예약으로 돌아가기" />;
  }

  return (
    <>
      <AppBar back title={title} />
      <div className="screen-body has-bottom-bar">
        <SpaceHead space={space} sub={`${reservation.unit}번 ${space.unitName} · ${getStore(reservation.storeId)?.name} · ${formatTime(reservation.start)}–${formatTime(reservationEnd(reservation))} · ${isSuite ? '공간으로 배달해 드려요' : '좌석에서 받아 가세요'}`} />

        {!inUse ? (
          <div className="empty-state">
            <p>{title}은 이용 중일 때만 할 수 있어요.</p>
            <p>이용 시작 시각({formatTime(reservation.start)})부터 주문할 수 있어요.</p>
          </div>
        ) : (
          <>
            <CouponPicker reservation={reservation} orders={orders} items={items} value={quote.benefit} onChange={setChosen} />

            <section className="block" aria-labelledby="seat-menu-title">
              <h2 id="seat-menu-title" className="block-title">{isSuite ? '배달 메뉴' : '메뉴'}</h2>
              <div className="text-tabs text-tabs--brown" role="tablist" aria-label="메뉴 카테고리">
                {MENU_CATEGORIES.map((c) => (
                  <button key={c.id} type="button" role="tab" aria-selected={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</button>
                ))}
              </div>
              <ul className="seat-menu swap" key={category}>
                {MENU.value.filter((d) => d.category === category).map((d) => {
                  const badges = [
                    isSuite && reservation.drinkId === d.id && '기본 음료',
                    left.refill > 0 && REFILL_DRINKS.includes(d.id) && '리필 가능',
                  ].filter(Boolean);
                  return (
                    <li key={d.id} className="seat-menu__item">
                      <DrinkThumb drink={d} size="sm" />
                      <span className="seat-menu__text">
                        <span className="seat-menu__name">{d.name}</span>
                        {badges.length > 0 && <span className="cart-item__badges">{badges.map((b) => <span key={b} className="badge">{b}</span>)}</span>}
                        <span className="seat-menu__price">{formatWon(d.price)}</span>
                      </span>
                      {hasTemp(d) ? (
                        // 커피는 아이스·핫을 따로 담는다
                        <span className="temp-steppers">
                          {TEMPS.map((t) => {
                            const key = itemKey(d.id, t.value);
                            return (
                              <span key={t.value} className="temp-stepper">
                                <span className="temp-chip" data-temp={t.value}>{t.short}</span>
                                <Stepper label={`${t.label} ${d.name}`} value={items[key] ?? 0} onChange={(q) => setItems((prev) => ({ ...prev, [key]: q }))} />
                              </span>
                            );
                          })}
                        </span>
                      ) : (
                        <Stepper label={d.name} value={items[d.id] ?? 0} onChange={(q) => setItems((prev) => ({ ...prev, [d.id]: q }))} />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {count > 0 && <OrderLines quote={quote} />}
          </>
        )}
      </div>

      {inUse && (
        <BottomBar note={<>{quote.benefit === 'normal' ? '이번 주문' : '쿠폰 적용'} <strong>{BENEFIT_LABEL[quote.benefit]}</strong></>}>
          <div className="price">
            <span className="price__label">{count}잔</span>
            <span className="price__value" key={quote.total}>{formatWon(quote.total)}</span>
          </div>
          <button className="button button--primary" type="button" disabled={!count} onClick={submit}>{isSuite ? '배달 주문하기' : '주문하기'}</button>
        </BottomBar>
      )}
    </>
  );
}
