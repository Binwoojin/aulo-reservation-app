import { Link, useSearchParams } from 'react-router-dom';
import { MENU, MENU_CATEGORIES } from '../config/policy.js';
import { AppBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { DrinkThumb, Segmented } from '../components/ui.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { formatWon } from '../lib/time.js';

// 주문 탭: 카테고리(커피 · 논커피 · 에이드·티)별로 메뉴와 가격만 보여 준다.
// 메뉴를 누르면 상세로, 상세의 '주문하기'로 장바구니에 담긴다. 고른 카테고리는 주소(?cat=)에 남겨 상세에서 돌아와도 유지한다.
export default function OrderPage() {
  const { cart } = useAppData();
  const count = Object.values(cart.items).reduce((a, b) => a + b, 0);
  const [params, setParams] = useSearchParams();
  const category = MENU_CATEGORIES.some((c) => c.id === params.get('cat')) ? params.get('cat') : MENU_CATEGORIES[0].id;
  const list = MENU.value.filter((d) => d.category === category);

  return (
    <>
      <AppBar title="음료 주문">
        <Link to="/cart" className="icon-button cart-button" aria-label={`장바구니 ${count}잔`}>
          <Icon name="bag" />
          {count > 0 && <span className="cart-button__count" aria-hidden="true">{count}</span>}
        </Link>
      </AppBar>
      <div className="screen-body">
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
              <Link to={`/menu/${d.id}`} className="menu-card">
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
