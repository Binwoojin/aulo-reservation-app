import { describe, expect, it } from 'vitest';
import {
  getStore,
  createReservation,
  durationOptions,
  freeUnits,
  isSuiteSameDayBlocked,
  startOptions,
  validateReservation,
} from './reservation.js';
import { formatTime } from './time.js';

const at = (y, m, d, hh, mm = 0) => new Date(y, m - 1, d, hh, mm);
const NOW = at(2026, 10, 14, 10, 30);
const TODAY = '2026-10-14';
const TOMORROW = '2026-10-15';

const base = { storeId: 'seongsu', date: TOMORROW, drinkId: 'americano' };
let seq = 0;
const make = (input, existing = [], now = NOW) =>
  createReservation({ ...base, ...input }, existing, now, () => `r${++seq}`);

describe('시작 시간', () => {
  it('Focus는 정시 단위, 최소 1시간을 23:00 전에 채울 수 있어야 한다', () => {
    const opts = startOptions('focus', TOMORROW, NOW).map(formatTime);
    expect(opts[0]).toBe('09:00');
    expect(opts.at(-1)).toBe('22:00');
  });

  it('Suite는 최소 3시간이고 임시 마지막 종료 22:00까지라 19:00이 마지막 시작이다', () => {
    expect(startOptions('suite', TOMORROW, NOW).map(formatTime).at(-1)).toBe('19:00');
  });

  it('오늘은 지난 시각을 제외한다', () => {
    expect(formatTime(startOptions('focus', TODAY, NOW)[0])).toBe('11:00');
  });

  it('Cafe는 예약할 수 없다', () => {
    expect(startOptions('cafe', TOMORROW, NOW)).toEqual([]);
  });
});

describe('이용 시간', () => {
  it('Focus·Rest는 1~4시간', () => {
    expect(durationOptions('rest', 9 * 60)).toEqual([1, 2, 3, 4]);
  });

  it('마감을 넘는 시간은 제외한다', () => {
    expect(durationOptions('focus', 21 * 60)).toEqual([1, 2]);
  });

  it('Suite는 3~9시간이고 22:00 이후 종료는 제외한다', () => {
    expect(durationOptions('suite', 9 * 60)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(durationOptions('suite', 17 * 60)).toEqual([3, 4, 5]);
  });
});

describe('Suite 마감 임박 제한', () => {
  it('오늘 마감까지 3시간 이하면 신규 예약을 막는다', () => {
    expect(isSuiteSameDayBlocked(TODAY, at(2026, 10, 14, 20, 0))).toBe(true);
    expect(isSuiteSameDayBlocked(TODAY, at(2026, 10, 14, 19, 59))).toBe(false);
  });

  it('미래 날짜에는 예약 생성 시각과 무관하게 적용하지 않는다', () => {
    const late = at(2026, 10, 14, 22, 0);
    expect(isSuiteSameDayBlocked(TOMORROW, late)).toBe(false);
    expect(startOptions('suite', TOMORROW, late).length).toBeGreaterThan(0);
  });
});

describe('예약 생성과 충돌 방지', () => {
  it('요금은 시간당 단가 × 시간, Suite 기본 음료는 포함', () => {
    const { reservation } = make({ type: 'suite', start: 10 * 60, hours: 3, unit: 1 });
    expect(reservation.fee).toBe(33000);
    expect(reservation.drinkFee).toBe(0);
    const focus = make({ type: 'focus', start: 10 * 60, hours: 2 }).reservation;
    expect(focus.fee).toBe(4000);
    expect(focus.drinkFee).toBe(3000);
  });

  it('같은 Suite 공간의 겹치는 시간은 거절하고, 다른 공간은 허용한다', () => {
    const first = make({ type: 'suite', start: 10 * 60, hours: 3, unit: 1 }).reservation;
    expect(make({ type: 'suite', start: 12 * 60, hours: 3, unit: 1 }, [first]).errors).toContain('이미 예약된 시간입니다.');
    expect(make({ type: 'suite', start: 13 * 60, hours: 3, unit: 1 }, [first]).errors).toEqual([]);
    expect(make({ type: 'suite', start: 12 * 60, hours: 3, unit: 2 }, [first]).errors).toEqual([]);
  });

  it('Focus는 빈 좌석을 자동 배정하고, 모두 차면 거절한다', () => {
    const existing = [];
    const seats = getStore('seongsu').units.focus;
    for (let i = 0; i < seats; i += 1) {
      const { reservation, errors } = make({ type: 'focus', start: 14 * 60, hours: 1 }, existing);
      expect(errors).toEqual([]);
      expect(reservation.unit).toBe(i + 1);
      existing.push(reservation);
    }
    expect(freeUnits({ ...base, type: 'focus', start: 14 * 60, hours: 1 }, existing)).toEqual([]);
    expect(make({ type: 'focus', start: 14 * 60, hours: 1 }, existing).errors[0]).toMatch('남은 좌석');
  });

  it('음료 미선택, 최대 시간 초과, 예약 기간 밖 날짜를 거절한다', () => {
    expect(validateReservation({ ...base, type: 'rest', start: 600, hours: 2, drinkId: null }, [], NOW)).toContain('이용 전 음료를 선택해 주세요.');
    expect(validateReservation({ ...base, type: 'rest', start: 600, hours: 5 }, [], NOW)[0]).toMatch('1~4시간');
    expect(validateReservation({ ...base, type: 'rest', start: 600, hours: 1, date: '2026-12-01' }, [], NOW)).toContain('예약 가능한 날짜가 아닙니다.');
  });

  it('Rest 요청 옵션은 정의된 것만 저장한다', () => {
    const { reservation } = make({ type: 'rest', start: 600, hours: 1, requests: ['blanket', 'hack'] });
    expect(reservation.requests).toEqual(['blanket']);
  });
});
