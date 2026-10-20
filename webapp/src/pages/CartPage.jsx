import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MENU } from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { CartItem, OrderLines, OrderSuccess } from '../components/OrderParts.jsx';
import { OptionList } from '../components/ui.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { SERVE_OPTIONS, parseKey, priceOrder, sortedKeys } from '../lib/order.js';
import { formatWon } from '../lib/time.js';

// 장바구니: 카페 주문 전용. 음료 상세의 '주문하기'로 담은 메뉴를 확인하고, 매장/테이크아웃을 골라 주문한다.
// 좌석 추가 주문과 Suite 배달은 별도로 운영해 '내 예약 > 예약 상세'에서 들어간다.
// 로그인한 사용자만 들어온다(라우트에서 RequireLogin). 비로그인 주문은 음료 상세의 '주문하기'에서 막는다.
export default function CartPage() {
  const { addOrder, cart, setCartQty, setCartServe, clearCart } = useAppData();
  const items = cart.items;
  const [placed, setPlaced] = useState(null);

  const quote = priceOrder({ kind: 'cafe', items });
  const count = Object.values(items).reduce((a, b) => a + b, 0);

  const submit = () => {
    if (!count) return;
    const order = {
      id: crypto.randomUUID(),
      kind: 'cafe',
      serve: cart.serve,
      reservationId: null,
      items,
      total: quote.total,
      benefit: quote.benefit,
      coupon: null,
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
        message={`${placed.order.serve === 'takeout' ? '테이크아웃' : '매장'} 주문이에요. 준비되면 카운터에서 픽업해 주세요.`}
      />
    );
  }

  return (
    <>
      <AppBar back title="장바구니" />
      <div className="screen-body has-bottom-bar">
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

        {count > 0 && <OrderLines quote={quote} />}
      </div>

      <BottomBar>
        <div className="price">
          <span className="price__label">{count}잔</span>
          <span className="price__value">{formatWon(quote.total)}</span>
        </div>
        <button className="button button--primary" type="button" disabled={!count} onClick={submit}>주문하기</button>
      </BottomBar>
    </>
  );
}
