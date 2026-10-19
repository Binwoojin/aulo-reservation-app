import { describe, expect, it } from 'vitest';
import { couponFor, orderKindFor, priceOrder } from './order.js';
import { recommend } from './recommend.js';

const suite = { id: 's1', type: 'suite', drinkId: 'latte' };
const focus = { id: 'f1', type: 'focus', drinkId: 'americano' };

describe('음료 주문 요금', () => {
  const half = { reservationId: 'f1', benefit: 'half' };
  const sHalf = { reservationId: 's1', benefit: 'half' };
  const sRefill = { reservationId: 's1', benefit: 'refill' };

  it('카페 주문은 정상가', () => {
    const r = priceOrder({ kind: 'cafe', items: { americano: 2 } });
    expect(r.total).toBe(6000);
    expect(r.discount).toBe(0);
  });

  it('Focus·Rest 추가 주문은 50% 할인, 예약당 최대 2회', () => {
    const items = { latte: 1, 'herb-tea': 1 };
    expect(priceOrder({ kind: orderKindFor(focus), items, reservation: focus }).total).toBe(4000);
    expect(priceOrder({ kind: 'extra', items, reservation: focus, previousOrders: [half] }).benefit).toBe('half');
    const third = priceOrder({ kind: 'extra', items, reservation: focus, previousOrders: [half, half, { reservationId: 'other', benefit: 'half' }] });
    expect(third.benefit).toBe('normal');
    expect(third.total).toBe(8000);
  });

  it('Suite 첫 리필은 아메리카노·카페라떼 1잔만 무료, 다른 음료는 정상가', () => {
    const r = priceOrder({ kind: 'suite', items: { latte: 2, 'vanilla-latte': 1 }, reservation: suite });
    expect(r.benefit).toBe('refill');
    expect(r.total).toBe(4000 + 4500);
    const base = { ...suite, drinkId: 'herb-tea' }; // 기본 음료가 리필 대상이 아니어도 아메리카노·라떼는 리필
    expect(priceOrder({ kind: 'suite', items: { americano: 1 }, reservation: base }).total).toBe(0);
  });

  it('Suite 주문에 리필 대상이 없으면 리필은 남기고 50% 쿠폰을 쓴다', () => {
    const r = priceOrder({ kind: 'suite', items: { 'herb-tea': 1 }, reservation: suite });
    expect(r.benefit).toBe('half');
    expect(r.total).toBe(2000);
  });

  it('Suite 리필 후에는 50% 할인 최대 2회, 그 뒤는 정상가', () => {
    expect(priceOrder({ kind: 'suite', items: { latte: 1 }, reservation: suite, previousOrders: [sRefill] }).total).toBe(2000);
    expect(priceOrder({ kind: 'suite', items: { latte: 1 }, reservation: suite, previousOrders: [sRefill, sHalf, sHalf] }).total).toBe(4000);
    expect(couponFor('suite', suite, [sRefill, sHalf, sHalf], { latte: 1 })).toBeNull();
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

  it('Focus·Rest는 50% 쿠폰 2회까지', () => {
    expect(couponFor('extra', focus, [{ reservationId: 'f1', benefit: 'half' }]).benefit).toBe('half');
    expect(couponFor('extra', focus, [{ reservationId: 'f1', benefit: 'half' }, { reservationId: 'f1', benefit: 'half' }])).toBeNull();
  });

  it('Suite는 아직 메뉴를 고르지 않았으면 리필 쿠폰을 먼저 보여 준다', () => {
    expect(couponFor('suite', suite, []).benefit).toBe('refill');
  });
});
