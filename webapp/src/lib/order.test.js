import { describe, expect, it } from 'vitest';
import { couponFor, orderKindFor, priceOrder, suiteBenefit } from './order.js';
import { recommend } from './recommend.js';

const suite = { id: 's1', type: 'suite', drinkId: 'latte' };
const focus = { id: 'f1', type: 'focus', drinkId: 'americano' };

describe('음료 주문 요금', () => {
  it('카페 주문은 정상가', () => {
    const r = priceOrder({ kind: 'cafe', items: { americano: 2 } });
    expect(r.total).toBe(6000);
    expect(r.discount).toBe(0);
  });

  it('Focus·Rest 추가 주문은 50% 할인', () => {
    const r = priceOrder({ kind: orderKindFor(focus), items: { latte: 1, 'herb-tea': 1 }, reservation: focus });
    expect(r.benefit).toBe('half');
    expect(r.total).toBe(4000);
  });

  it('Suite 첫 주문은 기본 음료 1잔 무료 리필, 다른 메뉴는 정상가', () => {
    const r = priceOrder({ kind: 'suite', items: { latte: 2, americano: 1 }, reservation: suite });
    expect(r.benefit).toBe('refill');
    expect(r.total).toBe(4000 + 3000);
  });

  it('Suite 순서: 리필 → 정상가 → 50% → (임시) 교대', () => {
    expect([0, 1, 2, 3, 4].map(suiteBenefit)).toEqual(['refill', 'normal', 'half', 'normal', 'half']);
    const prev = [{ reservationId: 's1' }, { reservationId: 's1' }, { reservationId: 'other' }];
    expect(priceOrder({ kind: 'suite', items: { latte: 1 }, reservation: suite, previousOrders: prev }).total).toBe(2000);
  });
});

describe('공간 추천', () => {
  it('목적별 기본 추천', () => {
    expect(recommend({ purpose: 'coffee', duration: 'short', privacy: 'open' }).primary).toBe('cafe');
    expect(recommend({ purpose: 'work', duration: 'mid', privacy: 'semi' }).primary).toBe('focus');
    expect(recommend({ purpose: 'rest', duration: 'short', privacy: 'semi' }).primary).toBe('rest');
    expect(recommend({ purpose: 'private', duration: 'mid', privacy: 'closed' }).primary).toBe('suite');
  });

  it('Focus 최대 4시간을 넘는 작업은 Suite', () => {
    expect(recommend({ purpose: 'work', duration: 'long', privacy: 'open' }).primary).toBe('suite');
  });
});

describe('예약 확인 할인 쿠폰', () => {
  it('카페 주문이나 예약 없는 주문에는 쿠폰이 없다', () => {
    expect(couponFor('cafe', null)).toBeNull();
    expect(couponFor('extra', null)).toBeNull();
  });

  it('Focus·Rest 예약이 확인되면 재주문마다 50% 할인 쿠폰', () => {
    const prev = [{ reservationId: 'f1' }, { reservationId: 'f1' }];
    expect(couponFor('extra', focus, prev).benefit).toBe('half');
  });

  it('Suite는 리필 쿠폰 → 쿠폰 없음(정상가) → 50% 할인 쿠폰', () => {
    expect(couponFor('suite', suite, []).benefit).toBe('refill');
    expect(couponFor('suite', suite, [{ reservationId: 's1' }])).toBeNull();
    expect(couponFor('suite', suite, [{ reservationId: 's1' }, { reservationId: 's1' }]).benefit).toBe('half');
  });
});
