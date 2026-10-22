import { describe, expect, it } from 'vitest';
import { lastPastReservation, lastReorderable, rebookPath, reorderItems } from './again.js';
import { daysUntil, formatDuration, homeStatus } from './status.js';

const NOW = new Date('2026-10-20T03:00:00Z'); // 화 12:00 KST
const r = (o) => ({ id: 'x', type: 'focus', storeId: 'seongsu', date: '2026-10-20', start: 600, hours: 3, unit: 7, ...o });

describe('내 상태 (홈 최상단)', () => {
  it('이용 중 > 다가오는 예약 > 예약 없음 순으로 하나만 고른다', () => {
    const inUse = r({ id: 'use' }); const next = r({ id: 'next', date: '2026-10-23' });
    expect(homeStatus([next, inUse], NOW)).toMatchObject({ kind: 'in-use', minutesLeft: 60 });
    expect(homeStatus([next], NOW)).toMatchObject({ kind: 'upcoming', reservation: { id: 'next' } });
    expect(homeStatus([r({ date: '2026-10-19' })], NOW)).toEqual({ kind: 'none' });
  });
  it('남은 시간과 남은 날을 읽기 쉽게 만든다', () => {
    expect(formatDuration(65)).toBe('1시간 5분');
    expect(formatDuration(40)).toBe('40분');
    expect(daysUntil('2026-10-21', NOW)).toBe(1);
  });
});

describe('한 번에 다시 하기', () => {
  it('가장 최근 카페 주문을 같은 옵션으로 다시 담고, 메뉴에서 빠진 음료는 뺀다', () => {
    const orders = [
      { id: 'a', kind: 'cafe', items: { 'latte@hot+shot1': 2 }, createdAt: '2026-10-17T02:00:00Z' },
      { id: 'b', kind: 'extra', items: { americano: 1 }, createdAt: '2026-10-18T02:00:00Z' },
      { id: 'c', kind: 'cafe', items: { 'herb-tea': 1, 'americano@ice+cup': 1 }, createdAt: '2026-10-19T02:00:00Z' },
    ];
    expect(lastReorderable(orders).id).toBe('c');
    expect(reorderItems(orders[2])).toEqual({ 'americano@ice+cup': 1 });
    expect(reorderItems(orders[1])).toEqual({});
  });
  it('지난 예약 중 가장 최근 것을 다시 예약 대상으로 고른다', () => {
    const list = [r({ id: 'old', date: '2026-10-10' }), r({ id: 'recent', date: '2026-10-19' }), r({ id: 'future', date: '2026-10-25' })];
    expect(lastPastReservation(list, NOW).id).toBe('recent');
    expect(rebookPath(lastPastReservation(list, NOW))).toBe('/reserve/focus?from=recent');
  });
});

describe('지난 예약 보관 기간 (최근 1개월)', () => {
  it('이용 날짜가 한 달 전 같은 날 이후인 지난 예약만', async () => {
    const { recentPastReservations } = await import('./again.js');
    const now = new Date('2026-10-20T03:00:00Z');
    const r = (id, date) => ({ id, date, start: 600, hours: 1 });
    expect(recentPastReservations([r('a', '2026-09-20'), r('b', '2026-09-19'), r('c', '2026-10-25')], now).map((x) => x.id)).toEqual(['a']);
  });
});
