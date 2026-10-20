// 쿠폰함: 좌석 재주문 쿠폰 (2026-10-19 확정 혜택을 쿠폰으로 보여 준다)
// - 발급: 예약 이용이 시작되면 그 예약에 발급 (Focus·Rest 50% 할인 2장, Suite 무료 리필 1장 + 50% 할인 2장)
// - 사용: 이용 중 좌석 주문(추가 주문·Suite 배달)과 음료 주문 탭 장바구니에서 골라 쓴다
// - 만료: 예약 이용이 끝나면 남은 쿠폰도 함께 끝난다 (혜택은 이용 중에만 적용)
import { SPACES } from '../config/policy.js';
import { HALF_LIMIT, orderKindFor, remainingBenefits } from './order.js';
import { isInUse, reservationEnd } from './reservation.js';
import { isUpcoming } from './status.js';

export const COUPON_INFO = {
  half: { title: '50% 할인 쿠폰', short: '50%', detail: '이번 주문 음료 전체 50% 할인' },
  refill: { title: '무료 리필 쿠폰', short: 'FREE', detail: '아메리카노·카페라떼 1잔 무료 (샷 추가 금액만)' },
};

// 예약 하나에 발급되는(될) 쿠폰과 남은 장수
export const reservationCoupons = (reservation, orders) => {
  const kind = orderKindFor(reservation);
  const left = remainingBenefits(kind, reservation, orders);
  const list = [];
  if (kind === 'suite') list.push({ benefit: 'refill', total: 1, left: left.refill });
  list.push({ benefit: 'half', total: HALF_LIMIT, left: left.half });
  return list.map((c) => ({ ...c, id: `${reservation.id}:${c.benefit}`, reservation, ...COUPON_INFO[c.benefit] }));
};

// 쿠폰함: 지금 쓸 수 있는 쿠폰(이용 중 예약) + 이용 시작 때 발급될 쿠폰(다가오는 예약)
export const couponWallet = (reservations, orders, now) => {
  const reservable = reservations.filter((r) => SPACES[r.type]?.reservable);
  const active = reservable.filter((r) => isInUse(r, now)).flatMap((r) => reservationCoupons(r, orders));
  const scheduled = reservable
    .filter((r) => isUpcoming(r, now) && !isInUse(r, now))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)
    .map((r) => ({ reservation: r, coupons: reservationCoupons(r, []) }));
  return { active, scheduled, usableCount: active.reduce((n, c) => n + c.left, 0) };
};

export const couponEnd = (reservation) => reservationEnd(reservation);
