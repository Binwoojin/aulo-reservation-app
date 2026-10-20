import { Link, useSearchParams } from 'react-router-dom';
import { MENU, MENU_CATEGORIES } from '../config/policy.js';
import { AppBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { DrinkThumb } from '../components/ui.jsx';
import { drinkTemps, needsTemp } from '../lib/drink.js';
import { lastReorderable } from '../lib/again.js';
import { ReorderCard } from '../components/AgainCard.jsx';
import StorePicker from '../components/StorePicker.jsx';
import { useAppData } from '../lib/AppData.jsx';

// 주문 탭: 카테고리(커피 · 논커피 · 에이드·티)별로 메뉴와 가격만 보여 준다.
// 메뉴를 누르면 상세로, 상세의 '주문하기'로 장바구니에 담긴다. 고른 카테고리는 주소(?cat=)에 남겨 상세에서 돌아와도 유지한다.
// 카테고리 소개 한 줄 (확정 메뉴·온도 정책에서 나온 사실만)
const CATEGORY_INTRO = {
  coffee: 'ICE·HOT을 고르고, 샷을 더할 수 있어요',
  'non-coffee': '커피 없이 부드럽게 즐기는 한 잔',
  'ade-tea': '상큼한 에이드와 차분한 차',
};

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
      <div className="screen-body order-body">
        {/* 홈 음료 섹션과 같은 브랜드 톤: 따뜻한 베이지 띠 + Fraunces 한 줄 + 텍스트 탭 */}
        <section className="order-band" aria-labelledby="order-title">
          <StorePicker label="주문 매장" forOrder variant="inline" />
          <p className="shelf-script" lang="en">aulo menu</p>
          <h2 id="order-title" className="order-band__title">머무름에 곁들일<br />한 잔을 골라 주세요</h2>
          {lastOrder && <ReorderCard order={lastOrder} />}
          <div className="text-tabs" role="tablist" aria-label="메뉴 카테고리">
            {MENU_CATEGORIES.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={category === c.id} onClick={() => setParams({ cat: c.id }, { replace: true })}>{c.label}</button>
            ))}
          </div>
        </section>
        <p className="shelf-reason order-intro">
          <span className="shelf-reason__kicker" lang="en">{MENU_CATEGORIES.find((c) => c.id === category).en}</span>
          {CATEGORY_INTRO[category]}
        </p>
        {/* 2열 카드: 아치형 사진 아래에 메뉴명과 가격만 둔다 */}
        <ul className="menu-grid" aria-label={`${MENU_CATEGORIES.find((c) => c.id === category).label} 메뉴`}>
          {list.map((d) => (
            <li key={d.id}>
              {/* 사진에 보이는 온도(ICE/HOT 음료는 HOT)가 상세에서 선택된 상태로 열린다 */}
              <Link to={needsTemp(d) ? `/menu/${d.id}?temp=${drinkTemps(d)[0]}` : `/menu/${d.id}`} className="menu-card">
                <DrinkThumb drink={d} size="card" />
                <span className="menu-card__name">{d.name}</span>
                <span className="menu-card__price"><span lang="en">{d.price.toLocaleString('ko-KR')}</span>원</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
