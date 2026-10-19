import { REWARDS } from '../config/policy.js';
import { minutesOfDay, toDateString } from './time.js';

// 이용을 시작한 예약 (방문해 결제한 것으로 본다)
export const hasStarted = (r, now) => {
  const today = toDateString(now);
  return r.date < today || (r.date === today && r.start <= minutesOfDay(now));
};

// 스탬프: 음료 1잔당 1개 — 앱 주문 잔 수 + 이용을 시작한 예약의 음료 1잔
export const stampCount = (orders, reservations, now) => {
  const ordered = orders.reduce((sum, o) => sum + Object.values(o.items).reduce((a, b) => a + b, 0), 0);
  const reserved = reservations.filter((r) => r.drinkId && hasStarted(r, now)).length;
  return (ordered + reserved) * REWARDS.stampsPerDrink;
};

// 포인트로 낸 금액을 뺀 좌석 이용료의 10%
export const pointsEarnedFor = (r) => Math.floor((r.fee - (r.pointsUsed ?? 0)) * REWARDS.pointRate);

// 보유 포인트 = 이용을 시작한 예약에서 적립한 포인트 − 예약에 쓴 포인트 (취소한 예약은 목록에서 빠져 자동으로 돌려받는다)
export const pointBalance = (reservations, now) => {
  const earned = reservations.filter((r) => hasStarted(r, now)).reduce((sum, r) => sum + pointsEarnedFor(r), 0);
  const used = reservations.reduce((sum, r) => sum + (r.pointsUsed ?? 0), 0);
  return Math.max(0, earned - used);
};

// 이번 예약에 쓸 수 있는 포인트: 보유 포인트와 좌석 이용료 중 작은 값 (음료 금액에는 못 쓴다)
export const usablePoints = (balance, fee) => Math.max(0, Math.min(balance, fee));
