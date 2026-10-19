import { describe, expect, it } from 'vitest';
import { getDrink, validateReservation } from './reservation.js';
import { drinkImage, fixedTemp, needsTemp } from './drink.js';

describe('음료 온도·사진', () => {
  it('커피와 녹차는 ICE/HOT을 고르고, 나머지는 한 가지 온도로만 나간다', () => {
    expect(needsTemp(getDrink('americano'))).toBe(true);
    expect(needsTemp(getDrink('green-tea'))).toBe(true);
    expect(fixedTemp(getDrink('matcha-latte'))).toBe('hot');
    expect(fixedTemp(getDrink('strawberry-latte'))).toBe('ice');
    expect(fixedTemp(getDrink('lemon-ade'))).toBe('ice');
    expect(fixedTemp(getDrink('grapefruit-ade'))).toBe('ice');
    expect(fixedTemp(getDrink('yuja-tea'))).toBe('hot');
    expect(fixedTemp(getDrink('earl-grey'))).toBe('hot');
  });

  it('고른 온도의 사진을 쓰고, 고르기 전에는 첫 번째 온도의 사진을 쓴다', () => {
    expect(drinkImage(getDrink('green-tea'), 'hot')).toBe('green-tea-hot');
    expect(drinkImage(getDrink('green-tea'), null)).toBe('green-tea-ice');
    expect(drinkImage(getDrink('yuja-tea'), null)).toBe('yuja-tea');
  });

  it('녹차를 예약 음료로 고르면 온도가 필요하다', () => {
    const errors = validateReservation({ type: 'focus', storeId: 'seongsu', date: '2026-10-21', start: 600, hours: 1, unit: 1, drinkId: 'green-tea', drinkTemp: null, requests: [] }, [], new Date('2026-10-19T03:00:00Z'));
    expect(errors).toContain('음료의 아이스와 핫 중 하나를 골라 주세요.');
  });
});
