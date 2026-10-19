import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BEST_MENU, MENU, MENU_CATEGORIES } from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { DrinkThumb, Provisional, Segmented } from '../components/ui.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { REFILL_DRINKS, TEMPS, hasTemp, itemKey } from '../lib/order.js';
import { formatWon } from '../lib/time.js';
import NotFoundPage from './NotFoundPage.jsx';

// 음료 상세: 누구나 볼 수 있다. '주문하기'를 누르면 이 음료 1잔을 장바구니에 담고 장바구니로 넘어간다.
export default function MenuDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useAppData();
  const drink = MENU.value.find((d) => d.id === id);
  // 커피는 아이스/핫을 꼭 골라야 담을 수 있다
  const [temp, setTemp] = useState(null);
  if (!drink) return <NotFoundPage />;
  const needsTemp = hasTemp(drink);

  return (
    <>
      <AppBar back title="" />
      <div className="screen-body has-bottom-bar">
        <DrinkThumb drink={drink} size="lg" />
        <section className="drink-head" aria-labelledby="drink-title">
          <span className="drink-head__meta">
            <span className="drink-head__category">{MENU_CATEGORIES.find((c) => c.id === drink.category)?.label}</span>
            {BEST_MENU.includes(drink.id) && <span className="badge badge--best">베스트</span>}
          </span>
          <h2 id="drink-title" className="screen-title">{drink.name}</h2>
          <p className="drink-price">{formatWon(drink.price)} <Provisional note={MENU.note} /></p>
          <p className="drink-desc">{drink.desc}</p>
        </section>
        {needsTemp && (
          <section className="block" aria-labelledby="temp-title">
            <p id="temp-title" className="group-title">온도</p>
            <Segmented label="온도" name="temp" value={temp} onChange={setTemp} options={TEMPS.map((t) => ({ value: t.value, label: t.label }))} />
            {!temp && <p className="group-hint">아이스와 핫 중 하나를 골라 주세요. 가격은 같아요.</p>}
          </section>
        )}
        <ul className="note-list">
          <li>1잔당 스탬프 1개가 적립돼요.</li>
          <li>포인트는 음료 주문에 쓸 수 없어요.</li>
          <li>Focus·Rest 이용 중에는 재주문 50% 할인 쿠폰을 최대 2회 쓸 수 있어요.</li>
          {REFILL_DRINKS.includes(drink.id) && <li>Suite 이용 중 1회 무료 리필 대상 음료예요.</li>}
        </ul>
      </div>
      <BottomBar>
        <button
          type="button"
          className="button button--primary"
          disabled={needsTemp && !temp}
          onClick={() => { addToCart(itemKey(drink.id, needsTemp ? temp : null)); navigate('/cart'); }}
        >
          {needsTemp && !temp ? '온도를 골라 주세요' : '주문하기'}
        </button>
      </BottomBar>
    </>
  );
}
