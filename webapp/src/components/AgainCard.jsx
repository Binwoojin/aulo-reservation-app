import { Link, useNavigate } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { useAppData } from '../lib/AppData.jsx';
import { rebookPath, reorderItems } from '../lib/again.js';
import { drinkLabel, parseKey, sortedKeys } from '../lib/order.js';
import { formatTime } from '../lib/time.js';
import Icon from './Icon.jsx';

// 담긴 음료 요약: '핫 카페라떼 2잔 외 1'
export const itemsSummary = (items) => {
  const keys = sortedKeys(items);
  if (!keys.length) return '';
  const first = parseKey(keys[0]);
  return `${drinkLabel(first.id, first.temp)} ${items[keys[0]]}잔${keys.length > 1 ? ` 외 ${keys.length - 1}` : ''}`;
};

// 같은 음료·옵션을 장바구니에 다시 담고 장바구니로 간다 (필수 규칙 1)
export const useReorder = () => {
  const { addToCart } = useAppData();
  const navigate = useNavigate();
  return (order) => {
    Object.entries(reorderItems(order)).forEach(([key, qty]) => addToCart(key, qty));
    navigate('/cart');
  };
};

export function ReorderCard({ order }) {
  const reorder = useReorder();
  return (
    <section className="again-card" aria-label="최근 주문 다시 담기">
      <span className="again-card__icon" aria-hidden="true"><Icon name="repeat" size={20} /></span>
      <span className="again-card__text">
        <span className="again-card__label">최근 주문</span>
        <span className="again-card__what">{itemsSummary(reorderItems(order))}</span>
      </span>
      <button type="button" className="button button--secondary button--small" onClick={() => reorder(order)}>다시 담기</button>
    </section>
  );
}

export function RebookCard({ reservation: r }) {
  const space = SPACES[r.type];
  return (
    <Link to={rebookPath(r)} className="again-card" aria-label={`지난 예약 다시 예약: ${space.name}`}>
      <span className="again-card__icon" aria-hidden="true"><Icon name="repeat" size={20} /></span>
      <span className="again-card__text">
        <span className="again-card__label">지난번처럼 예약하기</span>
        <span className="again-card__what">{space.name} · {formatTime(r.start)}부터 {r.hours}시간</span>
      </span>
      <span className="again-card__go">다시 예약<Icon name="chevron" size={16} /></span>
    </Link>
  );
}
