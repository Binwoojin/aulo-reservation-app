import { Link } from 'react-router-dom';
import { MENU } from '../config/policy.js';
import { BottomBar, AppBar } from './AppShell.jsx';
import Icon from './Icon.jsx';
import { DrinkThumb, Provisional, Stepper } from './ui.jsx';
import { formatWon } from '../lib/time.js';
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
  const temp = opts.temp;
  const tempInfo = TEMPS.find((t) => t.value === temp);
  const options = optionsText(opts);
  const unit = unitPriceOf(itemKey);
  return (
    <li className="cart-item">
      <Link to={`/menu/${drink.id}`} className="cart-item__media" aria-label={`${drink.name} 상세 보기`}>
        <DrinkThumb drink={drink} />
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
export function OrderSuccess({ message, quote, order, moreTo = '/order', moreLabel = '더 주문하기' }) {
  const cups = Object.values(order.items).reduce((a, b) => a + b, 0);
  return (
    <>
      <AppBar title="" />
      <div className="screen-body has-bottom-bar">
        <div className="success-head">
          <span className="success-head__icon" aria-hidden="true"><Icon name="check" size={32} /></span>
          <h2 className="screen-title">주문이 접수되었어요</h2>
          <p className="muted">{message} 결제는 매장에서 해요. 스탬프 {cups}개가 적립됐어요.</p>
        </div>
        <OrderLines quote={quote} />
      </div>
      <BottomBar>
        <Link className="button button--secondary" to={moreTo}>{moreLabel}</Link>
        <Link className="button button--primary" to="/my/orders">주문 내역</Link>
      </BottomBar>
    </>
  );
}
