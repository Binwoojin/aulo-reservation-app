import { describe, expect, it } from 'vitest';
import {
  bookableDates,
  getStore,
  createReservation,
  durationOptions,
  extensionFee,
  extensionRange,
  extensionUnitPrice,
  maxExtensionMinutes,
  freeUnits,
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
  it('Focus는 정시 단위, 22:50 퇴실 전(22:00 종료)까지 최소 1시간을 채울 수 있어야 한다', () => {
    const opts = startOptions('focus', TOMORROW, NOW).map(formatTime);
    expect(opts[0]).toBe('09:00');
    expect(opts.at(-1)).toBe('21:00');
  });

  it('Suite는 최소 3시간이고 마지막 종료 22:00까지라 19:00이 마지막 시작이다', () => {
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

  it('22:50 퇴실을 넘는 시간은 제외한다', () => {
    expect(durationOptions('focus', 20 * 60)).toEqual([1, 2]);
    expect(durationOptions('focus', 21 * 60)).toEqual([1]);
  });

  it('Suite는 3~9시간이고 22:00 이후 종료는 제외한다', () => {
    expect(durationOptions('suite', 9 * 60)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(durationOptions('suite', 17 * 60)).toEqual([3, 4, 5]);
  });
});

describe('Suite 당일 마감 (최소 3시간 · 22:00 종료)', () => {
  it('오늘 19:00 시작이 지나면 Suite는 예약할 시간이 없다', () => {
    expect(startOptions('suite', TODAY, at(2026, 10, 14, 18, 30)).map(formatTime)).toEqual(['19:00']);
    expect(startOptions('suite', TODAY, at(2026, 10, 14, 19, 0))).toEqual([]);
  });

  it('미래 날짜는 예약하는 시각과 무관하게 예약할 수 있다', () => {
    expect(startOptions('suite', TOMORROW, at(2026, 10, 14, 22, 0)).length).toBeGreaterThan(0);
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

describe('현장 연장 요금', () => {
  it('10분 단가는 시간당 요금 ÷ 6을 100원 단위로 버린다', () => {
    expect(extensionUnitPrice('focus')).toBe(300); // 2,000 ÷ 6 = 333.3
    expect(extensionUnitPrice('rest')).toBe(1000); // 6,500 ÷ 6 = 1,083.3
    expect(extensionUnitPrice('suite')).toBeNull();
  });

  const r = (type, start, hours) => ({ type, start: start * 60, hours });

  it('10분 단위로 최대 1시간까지만 계산한다', () => {
    expect(extensionFee(r('focus', 10, 2), 30)).toBe(900);
    expect(extensionFee(r('rest', 10, 2), 60)).toBe(6000);
    expect(extensionFee(r('focus', 10, 2), 70)).toBeNull();
    expect(extensionFee(r('focus', 10, 2), 15)).toBeNull();
    expect(extensionFee(r('suite', 10, 3), 10)).toBeNull();
  });

  it('폐점 1시간 전(22:00)까지만 연장할 수 있다', () => {
    expect(maxExtensionMinutes(r('focus', 19, 2))).toBe(60); // 21:00 종료 → 22:00까지
    expect(maxExtensionMinutes(r('focus', 18.5, 3))).toBe(30); // 21:30 종료 → 30분
    expect(maxExtensionMinutes(r('rest', 20, 2))).toBe(0); // 22:00 종료 → 연장 불가
    expect(maxExtensionMinutes(r('rest', 21, 2))).toBe(0); // 23:00 종료 → 연장 불가
    expect(extensionFee(r('focus', 18.5, 3), 40)).toBeNull();
  });

  it('최대 예약 시간(4시간)으로 예약하면 연장할 수 없다', () => {
    expect(extensionRange(r('focus', 10, 4))).toEqual({ max: 0, reason: 'max' });
    expect(extensionRange(r('rest', 10, 3))).toEqual({ max: 60, reason: null });
    expect(extensionFee(r('rest', 10, 4), 10)).toBeNull();
  });

  it('같은 좌석의 다음 예약과 겹치면 다음 예약이 우선이다', () => {
    const seat = { storeId: 'seongsu', date: TOMORROW, unit: 3 };
    const mine = { id: 'm', ...seat, ...r('focus', 12, 2) }; // 14:00 종료
    const next = (start, extra = {}) => ({ id: 'n', ...seat, ...r('focus', start, 1), ...extra });
    expect(extensionRange(mine, [mine, next(14)])).toEqual({ max: 0, reason: 'next' });
    expect(extensionRange(mine, [mine, next(14.5)])).toEqual({ max: 30, reason: null });
    expect(extensionFee(mine, 40, [mine, next(14.5)])).toBeNull();
    expect(maxExtensionMinutes(mine, [mine, next(14, { unit: 4 })])).toBe(60); // 다른 좌석은 무관
    expect(maxExtensionMinutes(mine, [mine, next(10)])).toBe(60); // 앞 예약은 무관
  });
});

describe('앱 당일 예약과 좌석 선택', () => {
  it('Focus·Rest는 앱 당일 예약이 안 되고 내일부터, Suite는 오늘부터', () => {
    expect(bookableDates(NOW, 'focus')[0]).toBe(TOMORROW);
    expect(bookableDates(NOW, 'rest')[0]).toBe(TOMORROW);
    expect(bookableDates(NOW, 'suite')[0]).toBe(TODAY);
    expect(bookableDates(NOW, 'focus').at(-1)).toBe(bookableDates(NOW, 'suite').at(-1));
  });

  it('Focus 당일 예약은 매장 방문 안내와 함께 거절한다', () => {
    const errors = validateReservation({ ...base, date: TODAY, type: 'focus', start: 15 * 60, hours: 1 }, [], NOW);
    expect(errors[0]).toMatch('매장에 방문');
  });

  it('앱 예약은 고른 좌석으로 저장하고, 이미 예약된 좌석은 거절한다', () => {
    const first = make({ type: 'rest', start: 10 * 60, hours: 2, unit: 7 });
    expect(first.reservation.unit).toBe(7);
    expect(make({ type: 'rest', start: 11 * 60, hours: 1, unit: 7 }, [first.reservation]).errors).toContain('이미 예약된 시간입니다.');
  });
});
