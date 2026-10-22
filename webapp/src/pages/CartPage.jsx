import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MENU } from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { CartItem, OrderLines, OrderSuccess } from '../components/OrderParts.jsx';
import { OptionList } from '../components/ui.jsx';
import StorePicker from '../components/StorePicker.jsx';
import { getStore } from '../lib/reservation.js';
import { useAppData, useNow } from '../lib/AppData.jsx';
import CouponPicker from '../components/CouponPicker.jsx';
import { isInUse } from '../lib/reservation.js';
import { BENEFIT_LABEL, SERVE_OPTIONS, parseKey, priceOrder, sortedKeys } from '../lib/order.js';
import { formatWon } from '../lib/time.js';

// 장바구니: 카페 주문 전용. 음료 상세의 '주문하기'로 담은 메뉴를 확인하고, 매장/테이크아웃을 골라 주문한다.
// 좌석 추가 주문과 Suite 배달은 별도로 운영해 '내 예약 > 예약 상세'에서 들어간다.
// 로그인한 사용자만 들어온다(라우트에서 RequireLogin). 비로그인 주문은 음료 상세의 '주문하기'에서 막는다.
export default function CartPage() {
  const { addOrder, cart, setCartQty, setCartServe, clearCart, storeId, myReservations, orders } = useAppData();
  const now = useNow();
  const items = cart.items;
  const [placed, setPlaced] = useState(null);
  const [chosen, setChosen] = useState(null);

  // 좌석 이용 중이면 그 예약에 발급된 쿠폰을 카페 주문에도 쓸 수 있다 (2026-10-20 결정)
  const inUse = myReservations.find((r) => isInUse(r, now)) ?? null;
  const quote = priceOrder({ kind: 'cafe', items, reservation: inUse, previousOrders: orders, chosen });
  const usingCoupon = inUse && quote.benefit !== 'normal';
  const count = Object.values(items).reduce((a, b) => a + b, 0);

  const submit = () => {
    if (!count) return;
    const order = {
      id: crypto.randomUUID(),
      kind: 'cafe',
      storeId, // 홈에서 고른 매장으로 주문한다 (필수 규칙 4)
      serve: cart.serve,
      reservationId: usingCoupon ? inUse.id : null, // 쿠폰을 쓰면 발급한 예약에 연결해 남은 장수를 센다
      items,
      total: quote.total,
      benefit: quote.benefit,
      coupon: usingCoupon ? BENEFIT_LABEL[quote.benefit] : null,
      createdAt: new Date().toISOString(),
    };
    addOrder(order);
    setPlaced({ order, quote });
    clearCart();
    window.scrollTo(0, 0);
  };

  if (placed) {
    return (
      <OrderSuccess
        order={placed.order}
        quote={placed.quote}
        message={`${getStore(placed.order.storeId)?.name ?? ''} ${placed.order.serve === 'takeout' ? '테이크아웃' : '매장'} 주문이에요. 준비되면 카운터에서 픽업해 주세요.`}
      />
    );
  }

  return (
    <>
      <AppBar back title="장바구니" />
      <div className={`screen-body${count > 0 ? ' has-bottom-bar' : ''}`}>
        <section className="order-band cart-band" aria-labelledby="cart-band-title">
          <StorePicker label="주문 매장" forOrder variant="inline" />
          <p className="shelf-script" lang="en">your order</p>
          <h2 id="cart-band-title" className="order-band__title">주문 전에<br />한 번 더 확인해요</h2>
        </section>
        <OptionList legend="이용 방법" name="serve" value={cart.serve} onChange={setCartServe} options={SERVE_OPTIONS} />

        <section className="block" aria-labelledby="cart-title">
          <div className="block-head">
            <h2 id="cart-title" className="block-title">담은 메뉴</h2>
            <Link to="/order" className="text-link">메뉴 더 담기</Link>
          </div>
          {count > 0 ? (
            <ul className="cart-list">
              {sortedKeys(items).map((key) => {
                const { id } = parseKey(key);
                return (
                  <CartItem
                    key={key}
                    itemKey={key}
                    drink={MENU.value.find((d) => d.id === id)}
                    quantity={items[key]}
                    line={quote.lines.find((l) => l.key === key)}
                    onChange={(q) => setCartQty(key, q)}
                  />
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">
              <p>장바구니가 비어 있어요.</p>
              <Link className="text-link" to="/order">메뉴 보러 가기</Link>
            </div>
          )}
          <p className="group-hint">1잔당 스탬프 1개 적립 · 포인트는 음료 주문에 쓸 수 없어요</p>
        </section>

        {count > 0 && inUse && <CouponPicker title="좌석 이용 중 쿠폰" reservation={inUse} orders={orders} items={items} value={quote.benefit} onChange={setChosen} />}

        {count > 0 && <OrderLines quote={quote} />}
      </div>

      {/* 비어 있으면 하단 바를 숨기고 '메뉴 보러 가기'만 둔다 */}
      {count > 0 && <BottomBar>
        <div className="price">
          <span className="price__label">{count}잔</span>
          <span className="price__value" key={quote.total}>{formatWon(quote.total)}</span>
        </div>
        <button className="button button--primary" type="button" onClick={submit}>주문하기</button>
      </BottomBar>}
    </>
  );
}
