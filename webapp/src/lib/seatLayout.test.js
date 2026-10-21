import { describe, expect, it } from 'vitest';
import { seatLayout, seatZone } from './seatLayout.js';

describe('임시 좌석 배치도', () => {
  it('매장 좌석 수를 구역에 빠짐없이 차례로 나눈다', () => {
    for (const [type, count] of [['focus', 24], ['focus', 30], ['rest', 18], ['rest', 20], ['suite', 16], ['suite', 12]]) {
      const seats = seatLayout(type, count).flatMap((z) => z.seats);
      expect(seats).toEqual(Array.from({ length: count }, (_, i) => i + 1));
    }
  });
  it('Focus 24석은 창가·벽면·중앙 8석씩', () => {
    expect(seatLayout('focus', 24).map((z) => [z.label, z.seats.length])).toEqual([['창가', 8], ['벽면', 8], ['중앙', 8]]);
    expect(seatZone('focus', 24, 9).label).toBe('벽면');
  });
});
