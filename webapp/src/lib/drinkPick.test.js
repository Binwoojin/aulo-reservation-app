import { describe, expect, it } from 'vitest';
import { drinkPicks, timePick } from './drinkPick.js';

const at = (h, m = 0) => new Date(Date.UTC(2026, 9, 20, h - 9, m)); // KST

describe('홈 음료 추천', () => {
  it('비로그인(주문 없음)이면 시간대를 근거로 고르고 이유를 붙인다', () => {
    expect(timePick(at(9)).label).toBe('아침');
    expect(timePick(at(15)).label).toBe('오후');
    const { picks } = drinkPicks({ now: at(19) });
    expect(picks.map((p) => p.drink.id)).toEqual(['yuja-tea', 'hot-chocolate']);
    expect(picks.every((p) => p.reason && p.basis === 'time')).toBe(true);
  });
  it('최근 카페 주문이 있으면 그 음료를 같은 온도로 맨 앞에 두고, 시간대 추천과 겹치지 않게 한다', () => {
    const orders = [{ id: 'o', kind: 'cafe', items: { 'vanilla-latte@ice': 1 }, createdAt: '2026-10-19T02:00:00Z' }];
    const { picks } = drinkPicks({ orders, now: at(15) });
    expect(picks[0]).toMatchObject({ drink: { id: 'vanilla-latte' }, temp: 'ice', basis: 'recent' });
    expect(picks.map((p) => p.drink.id)).toEqual(['vanilla-latte', 'caramel-macchiato']);
  });
});
