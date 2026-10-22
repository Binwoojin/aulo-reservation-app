import { describe, expect, it } from 'vitest';
import { couponWallet, reservationCoupons } from './coupons.js';
import { benefitBlocker, priceOrder } from './order.js';

const NOW = new Date('2026-10-20T03:00:00Z'); // 12:00 KST
const focus = { id: 'f', type: 'focus', storeId: 'seongsu', unit: 3, date: '2026-10-20', start: 600, hours: 3, drinkId: 'americano' };
const suite = { id: 's', type: 'suite', storeId: 'seongsu', unit: 2, date: '2026-10-20', start: 600, hours: 3, drinkId: 'latte' };
const later = { ...focus, id: 'l', date: '2026-10-25' };

describe('쿠폰함', () => {
  it('이용 중 예약에 발급된 쿠폰과 다가오는 예약의 발급 예정 쿠폰', () => {
    const w = couponWallet([focus, later], [], NOW);
    expect(w.active.map((c) => [c.benefit, c.left])).toEqual([['half', 2]]);
    expect(w.usableCount).toBe(2);
    expect(w.scheduled.map((x) => x.reservation.id)).toEqual(['l']);
  });
  it('Suite는 리필 1장 + 50% 2장, 사용하면 줄어든다', () => {
    const used = [{ reservationId: 's', benefit: 'refill' }, { reservationId: 's', benefit: 'half' }];
    expect(reservationCoupons(suite, used).map((c) => [c.benefit, c.left])).toEqual([['refill', 0], ['half', 1]]);
  });
});

describe('쿠폰 고르기', () => {
  it('사용 안 함을 고르면 정상가, 50%를 고르면 반값', () => {
    const items = { 'latte@hot': 1 };
    expect(priceOrder({ kind: 'extra', items, reservation: focus, chosen: 'normal' }).benefit).toBe('normal');
    expect(priceOrder({ kind: 'extra', items, reservation: focus, chosen: 'half' }).total).toBe(2000);
  });
  it('카페 주문도 이용 중 예약을 넘기면 그 예약 쿠폰을 쓴다', () => {
    expect(priceOrder({ kind: 'cafe', items: { 'latte@hot': 1 }, reservation: focus }).benefit).toBe('half');
  });
  it('리필은 대상 음료가 있어야 고를 수 있다', () => {
    expect(benefitBlocker('refill', 'suite', suite, [], { 'lemon-ade': 1 })).toBeTruthy();
    expect(benefitBlocker('refill', 'suite', suite, [], { 'latte@hot': 1 })).toBeNull();
    expect(priceOrder({ kind: 'suite', items: { 'lemon-ade': 1 }, reservation: suite, chosen: 'refill' }).benefit).toBe('half');
  });
});
