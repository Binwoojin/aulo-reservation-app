import { useId } from 'react';
import { SPACES } from '../config/policy.js';
import { reservationCoupons } from '../lib/coupons.js';
import { benefitBlocker, orderKindFor } from '../lib/order.js';
import { reservationEnd } from '../lib/reservation.js';
import { formatTime } from '../lib/time.js';

// 쿠폰 고르기 (좌석 주문·장바구니 공통): 이용 중인 예약에 발급된 쿠폰 중 하나 또는 '사용 안 함'
// value: 지금 적용된 혜택('half' | 'refill' | 'normal'), onChange(benefit)
export default function CouponPicker({ reservation, orders, items, value, onChange, title = '할인 쿠폰' }) {
  const name = useId();
  const kind = orderKindFor(reservation);
  const coupons = reservationCoupons(reservation, orders);
  const space = SPACES[reservation.type];
  return (
    <fieldset className="coupon-pick">
      <legend className="group-title">{title}</legend>
      <p className="group-hint">{space.name} {reservation.unit}번 이용 중 발급 · {formatTime(reservationEnd(reservation))} 이용 종료 때 함께 끝나요</p>
      <div className="coupon-pick__list">
        {coupons.map((c) => {
          const blocker = benefitBlocker(c.benefit, kind, reservation, orders, items);
          return (
            <label key={c.id} className="coupon-ticket" data-disabled={blocker ? true : undefined}>
              <input type="radio" name={name} value={c.benefit} checked={value === c.benefit} disabled={!!blocker} onChange={() => onChange(c.benefit)} />
              <span className="coupon-ticket__stub" lang="en">{c.short}</span>
              <span className="coupon-ticket__body">
                <strong>{c.title}</strong>
                <span>{blocker ?? c.detail}</span>
              </span>
              <span className="coupon-ticket__count"><b lang="en">{c.left}</b>/{c.total}장</span>
            </label>
          );
        })}
        <label className="coupon-ticket coupon-ticket--none">
          <input type="radio" name={name} value="normal" checked={value === 'normal'} onChange={() => onChange('normal')} />
          <span className="coupon-ticket__body"><strong>쿠폰 사용 안 함</strong><span>정상가로 주문하고 쿠폰은 남겨 둬요</span></span>
        </label>
      </div>
    </fieldset>
  );
}
