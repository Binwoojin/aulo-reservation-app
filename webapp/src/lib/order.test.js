import { describe, expect, it } from 'vitest';
import { couponFor, historyCutoff, itemKey, orderKindFor, parseKey, priceOrder, recentOrders } from './order.js';
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
    const items = { latte: 1, 'yuja-tea': 1 };
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
    const base = { ...suite, drinkId: 'yuja-tea' }; // 기본 음료가 리필 대상이 아니어도 아메리카노·라떼는 리필
    expect(priceOrder({ kind: 'suite', items: { americano: 1 }, reservation: base }).total).toBe(0);
  });

  it('Suite 주문에 리필 대상이 없으면 리필은 남기고 50% 쿠폰을 쓴다', () => {
    const r = priceOrder({ kind: 'suite', items: { 'yuja-tea': 1 }, reservation: suite });
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

describe('아이스·핫 담기', () => {
  it('같은 커피도 온도별로 따로 담고 이름에 온도를 붙인다', () => {
    const r = priceOrder({ kind: 'cafe', items: { 'americano@hot': 1, 'americano@ice': 2, 'hot-chocolate': 1 } });
    expect(r.lines.map((l) => l.name)).toEqual(['아이스 아메리카노', '핫 아메리카노', '핫초코']);
    expect(r.total).toBe(3000 * 3 + 4000);
  });

  it('Suite 리필은 온도와 관계없이 아메리카노·카페라떼 1잔', () => {
    const r = priceOrder({ kind: 'suite', items: { 'latte@hot': 1, 'americano@ice': 1 }, reservation: suite });
    expect(r.total).toBe(3000); // 기본 음료(카페라떼) 1잔 무료
  });
});

describe('음료 옵션', () => {
  it('샷 추가는 1회 500원(임시), 텀블러는 300원 할인, 옵션이 다르면 다른 줄', () => {
    const shot = itemKey('latte', 'ice', { shot: 2, ownCup: true });
    expect(shot).toBe('latte@ice+shot2+cup');
    expect(parseKey(shot)).toEqual({ id: 'latte', temp: 'ice', shot: 2, ownCup: true });
    const r = priceOrder({ kind: 'cafe', items: { [shot]: 1, 'latte@ice': 1 } });
    expect(r.lines.map((l) => [l.name, l.options])).toEqual([['아이스 카페라떼', '샷 2회 추가 · 텀블러 −300원'], ['아이스 카페라떼', '']]);
    expect(r.total).toBe(4700 + 4000);
  });

  it('Suite 무료 리필 잔은 샷 추가 금액만 받고 텀블러 할인은 겹치지 않는다', () => {
    expect(priceOrder({ kind: 'suite', items: { 'latte@hot+shot1': 1 }, reservation: suite }).total).toBe(500);
    expect(priceOrder({ kind: 'suite', items: { 'latte@hot+cup': 1 }, reservation: suite }).total).toBe(0);
  });

  it('텀블러 할인 후에 50% 쿠폰을 적용한다', () => {
    const focus = { id: 'f9', type: 'focus', drinkId: 'americano' };
    expect(priceOrder({ kind: 'extra', items: { 'americano@ice+cup': 1 }, reservation: focus }).total).toBe(1350);
  });
});

describe('주문 내역 보관 기간 (최근 1개월)', () => {
  const at = (iso) => ({ id: iso, createdAt: iso });
  it('한 달 전 같은 시각까지만 남긴다', () => {
    const now = new Date('2026-10-20T03:00:00Z');
    const kept = recentOrders([at('2026-09-20T03:00:00Z'), at('2026-09-20T02:59:00Z'), at('2026-10-19T00:00:00Z')], now).map((o) => o.id);
    expect(kept).toEqual(['2026-09-20T03:00:00Z', '2026-10-19T00:00:00Z']);
  });
  it('전달에 같은 날이 없으면 말일로 맞춘다 (3/31 → 2/28)', () => {
    const cut = historyCutoff(new Date(2027, 2, 31, 12));
    expect([cut.getMonth(), cut.getDate()]).toEqual([1, 28]);
  });
});
