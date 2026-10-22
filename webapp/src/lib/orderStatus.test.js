import { describe, expect, it } from 'vitest';
import { DEMO_FLOW, isActiveOrder, latestActiveOrder, orderStage, stageTimes } from './orderStatus.js';

const T0 = new Date('2026-10-20T03:00:00Z');
const order = (o = {}) => ({ id: 'o', createdAt: T0.toISOString(), items: { 'latte@hot': 2 }, ...o });
const after = (sec) => new Date(T0.getTime() + sec * 1000);

describe('주문 진행 상태 (데모 진행)', () => {
  it('접수 → 수락 → 제조 중 → 제조 완료 순서로 진행한다', () => {
    const o = order();
    expect(orderStage(o, after(0))).toBe('received');
    expect(orderStage(o, after(DEMO_FLOW.acceptSec))).toBe('accepted');
    expect(orderStage(o, after(DEMO_FLOW.makeSec))).toBe('making');
    // 2잔 → 제조 시작 후 40초
    expect(orderStage(o, after(DEMO_FLOW.makeSec + 39))).toBe('making');
    expect(orderStage(o, after(DEMO_FLOW.makeSec + 40))).toBe('ready');
  });
  it('제조 시간은 최대 maxMakeSec', () => {
    const t = stageTimes(order({ items: { 'latte@hot': 20 } }));
    expect((t.ready - t.making) / 1000).toBe(DEMO_FLOW.maxMakeSec);
  });
  it('수령 확인(pickedAt)이나 오래된 주문은 수령 완료', () => {
    expect(orderStage(order({ pickedAt: after(70).toISOString() }), after(70))).toBe('picked');
    expect(isActiveOrder(order(), after(DEMO_FLOW.autoPickHours * 3600))).toBe(false);
  });
  it('진행 중인 주문 중 가장 최근 것', () => {
    const list = [order({ id: 'a' }), order({ id: 'b', createdAt: after(30).toISOString() }), order({ id: 'c', createdAt: after(40).toISOString(), pickedAt: after(50).toISOString() })];
    expect(latestActiveOrder(list, after(60)).id).toBe('b');
  });
});
