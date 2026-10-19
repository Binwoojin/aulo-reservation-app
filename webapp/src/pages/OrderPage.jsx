import { Link } from 'react-router-dom';
import { MENU } from '../config/policy.js';
import { AppBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { formatWon } from '../lib/time.js';

// 주문 탭: 메뉴와 가격만 보여 준다. 메뉴를 누르면 상세로, 상세의 '주문하기'로 장바구니에 담긴다.
export default function OrderPage() {
  const { cart } = useAppData();
  const count = Object.values(cart.items).reduce((a, b) => a + b, 0);

  return (
    <>
      <AppBar title="음료 주문">
        <Link to="/cart" className="icon-button cart-button" aria-label={`장바구니 ${count}잔`}>
          <Icon name="bag" />
          {count > 0 && <span className="cart-button__count" aria-hidden="true">{count}</span>}
        </Link>
      </AppBar>
      <div className="screen-body">
        <ul className="list-card" aria-label="메뉴">
          {MENU.value.map((d) => (
            <li key={d.id}>
              <Link to={`/menu/${d.id}`} className="menu-link">
                <span className="cup-thumb" aria-hidden="true"><Icon name="cup" size={22} /></span>
                <span className="menu-link__name">{d.name}</span>
                <span className="menu-link__price">{formatWon(d.price)}</span>
                <Icon name="chevron" size={18} className="list-row__chev" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
