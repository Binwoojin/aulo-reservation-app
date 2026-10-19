import { useNavigate, useParams } from 'react-router-dom';
import { BEST_MENU, MENU } from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { Provisional } from '../components/ui.jsx';
import { REFILL_DRINKS } from '../lib/order.js';
import { formatWon } from '../lib/time.js';
import NotFoundPage from './NotFoundPage.jsx';

// 음료 상세: 누구나 볼 수 있다. '주문 담기'를 누르면 주문 화면으로 가서 이 음료 1잔이 담긴다.
export default function MenuDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const drink = MENU.value.find((d) => d.id === id);
  if (!drink) return <NotFoundPage />;

  return (
    <>
      <AppBar back title="" />
      <div className="screen-body has-bottom-bar">
        <div className="drink-hero" aria-hidden="true"><Icon name="cup" size={72} /></div>
        <section className="drink-head" aria-labelledby="drink-title">
          {BEST_MENU.includes(drink.id) && <span className="badge badge--best">베스트</span>}
          <h2 id="drink-title" className="screen-title">{drink.name}</h2>
          <p className="drink-price">{formatWon(drink.price)} <Provisional note={MENU.note} /></p>
          <p className="drink-desc">{drink.desc}</p>
        </section>
        <ul className="note-list">
          <li>1잔당 스탬프 1개가 적립돼요.</li>
          <li>포인트는 음료 주문에 쓸 수 없어요.</li>
          <li>Focus·Rest 이용 중에는 재주문 50% 할인 쿠폰을 최대 2회 쓸 수 있어요.</li>
          {REFILL_DRINKS.includes(drink.id) && <li>Suite 이용 중 1회 무료 리필 대상 음료예요.</li>}
        </ul>
      </div>
      <BottomBar>
        <button type="button" className="button button--primary" onClick={() => navigate(`/order?add=${drink.id}`)}>주문 담기</button>
      </BottomBar>
    </>
  );
}
