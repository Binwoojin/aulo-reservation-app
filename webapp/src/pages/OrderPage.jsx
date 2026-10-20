import { Link, useSearchParams } from 'react-router-dom';
import { MENU, MENU_CATEGORIES } from '../config/policy.js';
import { AppBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { DrinkThumb, Segmented } from '../components/ui.jsx';
import { drinkTemps, needsTemp } from '../lib/drink.js';
import { lastReorderable } from '../lib/again.js';
import { ReorderCard } from '../components/AgainCard.jsx';
import StorePicker from '../components/StorePicker.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { formatWon } from '../lib/time.js';

// 주문 탭: 카테고리(커피 · 논커피 · 에이드·티)별로 메뉴와 가격만 보여 준다.
// 메뉴를 누르면 상세로, 상세의 '주문하기'로 장바구니에 담긴다. 고른 카테고리는 주소(?cat=)에 남겨 상세에서 돌아와도 유지한다.
export default function OrderPage() {
  const { user, cart, myOrders } = useAppData();
  const lastOrder = user ? lastReorderable(myOrders) : null;
  const count = Object.values(cart.items).reduce((a, b) => a + b, 0);
  const [params, setParams] = useSearchParams();
  const category = MENU_CATEGORIES.some((c) => c.id === params.get('cat')) ? params.get('cat') : MENU_CATEGORIES[0].id;
  const list = MENU.value.filter((d) => d.category === category);

  return (
    <>
      <AppBar title="음료 주문">
        {/* 장바구니는 로그인한 사용자만 쓴다(2026-10-20). 비로그인에는 아이콘을 보여 주지 않는다 */}
        {user && (
          <Link to="/cart" className="icon-button cart-button" aria-label={`장바구니 ${count}잔`}>
            <Icon name="bag" />
            {count > 0 && <span className="cart-button__count" aria-hidden="true">{count}</span>}
          </Link>
        )}
      </AppBar>
      <div className="screen-body">
        <StorePicker label="주문 매장" forOrder />
        {lastOrder && <ReorderCard order={lastOrder} />}
        <Segmented
          label="메뉴 카테고리"
          name="category"
          value={category}
          onChange={(v) => setParams({ cat: v }, { replace: true })}
          options={MENU_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
        />
        {/* 2열 카드: 큰 정사각형 사진 아래에 메뉴명과 가격만 둔다 */}
        <ul className="menu-grid" aria-label={`${MENU_CATEGORIES.find((c) => c.id === category).label} 메뉴`}>
          {list.map((d) => (
            <li key={d.id}>
              {/* 사진에 보이는 온도(ICE/HOT 음료는 HOT)가 상세에서 선택된 상태로 열린다 */}
              <Link to={needsTemp(d) ? `/menu/${d.id}?temp=${drinkTemps(d)[0]}` : `/menu/${d.id}`} className="menu-card">
                <DrinkThumb drink={d} size="card" />
                <span className="menu-card__name">{d.name}</span>
                <span className="menu-card__price">{formatWon(d.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
