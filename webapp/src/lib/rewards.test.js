import { describe, expect, it } from 'vitest';
import { pointBalance, pointsEarnedFor, stampCount, usablePoints } from './rewards.js';

// KST 2026-10-19 12:00
const NOW = new Date(Date.UTC(2026, 9, 19, 3, 0));
const r = (id, date, start, fee, extra = {}) => ({ id, date, start: start * 60, hours: 2, fee, drinkId: 'americano', ...extra });

describe('스탬프', () => {
  it('음료 1잔당 1개: 주문 잔 수 + 이용을 시작한 예약의 음료', () => {
    const orders = [{ items: { americano: 2, latte: 1 } }, { items: { 'hot-chocolate': 1 } }];
    const reservations = [r('a', '2026-10-18', 10, 4000), r('b', '2026-10-19', 11, 4000), r('c', '2026-10-20', 10, 4000)];
    expect(stampCount(orders, reservations, NOW)).toBe(4 + 2);
  });
});

describe('포인트', () => {
  it('좌석 이용료 결제 금액의 10%, 포인트로 낸 금액은 제외', () => {
    expect(pointsEarnedFor(r('a', '2026-10-18', 10, 13000))).toBe(1300);
    expect(pointsEarnedFor(r('a', '2026-10-18', 10, 13000, { pointsUsed: 1300 }))).toBe(1170);
  });

  it('이용을 시작한 예약만 적립하고, 쓴 포인트는 빼며, 음료 금액에는 못 쓴다', () => {
    const list = [r('a', '2026-10-18', 10, 13000), r('b', '2026-10-25', 10, 4000, { pointsUsed: 500 })];
    expect(pointBalance(list, NOW)).toBe(1300 - 500);
    expect(pointBalance(list.slice(0, 1), NOW)).toBe(1300); // b를 취소하면 500P를 돌려받는다
    expect(usablePoints(800, 4000)).toBe(800);
    expect(usablePoints(5000, 4000)).toBe(4000);
  });
});
