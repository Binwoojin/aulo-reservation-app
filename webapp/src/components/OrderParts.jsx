import { Link, Navigate } from 'react-router-dom';
import { MENU } from '../config/policy.js';
import Icon from './Icon.jsx';
import { DrinkThumb, Provisional, Stepper } from './ui.jsx';
import { formatWon } from '../lib/time.js';
import { fixedTemp } from '../lib/drink.js';
import { TEMPS, optionsText, parseKey, unitPriceOf } from '../lib/order.js';

// 주문 금액 요약 (장바구니·좌석 주문 공통)
export function OrderLines({ quote }) {
  return (
    <dl className="kv summary-card">
      {quote.lines.map((l) => (
        <div key={l.drinkId}>
          <dt>{l.name} × {l.quantity}{l.options && <small className="kv__sub">{l.options}</small>}</dt>
          <dd>{l.total !== l.listPrice && <s>{formatWon(l.listPrice)}</s>} {formatWon(l.total)}</dd>
        </div>
      ))}
      {quote.discount > 0 && <div><dt>쿠폰 할인</dt><dd>−{formatWon(quote.discount)}</dd></div>}
      <div className="kv__total"><dt>결제 예정</dt><dd>{formatWon(quote.total)}</dd></div>
    </dl>
  );
}

// 담은 음료 카드 (이미지 자리 + 이름·배지 + 1잔 가격 + 수량 + 줄 합계)
// itemKey가 있으면 그 안의 온도·샷·개인컵 옵션을 함께 보여 준다
export function CartItem({ drink, itemKey = drink.id, quantity, line, badges = [], onChange }) {
  const opts = parseKey(itemKey);
  const temp = opts.temp ?? fixedTemp(drink);
  const tempInfo = TEMPS.find((t) => t.value === temp);
  const options = optionsText(opts);
  const unit = unitPriceOf(itemKey);
  return (
    <li className="cart-item">
      <Link to={opts.temp ? `/menu/${drink.id}?temp=${opts.temp}` : `/menu/${drink.id}`} className="cart-item__media" aria-label={`${drink.name} 상세 보기`}>
        <DrinkThumb drink={drink} temp={temp} />
      </Link>
      <div className="cart-item__body">
        <div className="cart-item__head">
          <div className="cart-item__title">
            <strong className="cart-item__name">
              {tempInfo && <span className="temp-chip" data-temp={temp}>{tempInfo.short}</span>}
              {drink.name}
            </strong>
            {badges.length > 0 && <span className="cart-item__badges">{badges.map((b) => <span key={b} className="badge">{b}</span>)}</span>}
          </div>
          <button type="button" className="cart-item__remove" onClick={() => onChange(0)} aria-label={`${tempInfo ? `${tempInfo.label} ` : ''}${drink.name} 빼기`}>
            <Icon name="close" size={18} />
          </button>
        </div>
        {options && <span className="cart-item__options">{options}</span>}
        <span className="cart-item__unit">1잔 {formatWon(unit)} <Provisional note={MENU.note} /></span>
        <div className="cart-item__foot">
          <Stepper label={drink.name} value={quantity} onChange={onChange} min={1} />
          <span className="cart-item__total">
            {line && line.total !== line.listPrice && <s>{formatWon(line.listPrice)}</s>}
            {formatWon(line?.total ?? unit * quantity)}
          </span>
        </div>
      </div>
    </li>
  );
}

// 주문 완료 화면
// 주문 완료: 주문 현황(접수 → 수락 → 제조 중 → 제조 완료 → 수령 완료) 화면으로 바로 보낸다 (필수 규칙 3)
export function OrderSuccess({ order }) {
  return <Navigate to={`/my/orders/${order.id}?new=1`} replace />;
}
