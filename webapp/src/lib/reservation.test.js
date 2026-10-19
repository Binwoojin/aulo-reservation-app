import { describe, expect, it } from 'vitest';
import {
  isHoliday,
  arrivalOutcome,
  canCancel,
  penaltyStatus,
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
import { addDays, formatTime, minutesOfDay, toDateString } from './time.js';

// 한국 시간(KST) 기준 시각
const at = (y, m, d, hh, mm = 0) => new Date(Date.UTC(y, m - 1, d, hh - 9, mm));
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
    expect(opts[0]).toBe('08:00'); // 08:00 오픈
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

describe('Suite 사전 예약 전용', () => {
  it('Suite 당일 예약은 사전 예약 안내와 함께 거절한다', () => {
    const errors = validateReservation({ ...base, date: TODAY, type: 'suite', start: 15 * 60, hours: 3, unit: 1 }, [], NOW);
    expect(errors[0]).toMatch('사전 예약만');
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
  it('모든 공간이 앱 당일 예약 불가라 내일부터 예약한다', () => {
    for (const type of ['focus', 'rest', 'suite']) expect(bookableDates(NOW, type)[0]).toBe(TOMORROW);
    expect(bookableDates(NOW, 'focus').at(-1)).toBe('2026-10-28');
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

describe('취소와 노쇼 페널티', () => {
  it('취소는 이용 전날 23:59까지, 당일은 불가', () => {
    const r = { date: TOMORROW };
    expect(canCancel(r, at(2026, 10, 14, 23, 59))).toBe(true);
    expect(canCancel(r, at(2026, 10, 15, 0, 0))).toBe(false);
  });

  it('연락 없이 30분, 지각 연락 시 1시간이 지나면 취소 + 페널티', () => {
    expect(arrivalOutcome({ minutesLate: 20 })).toEqual({ status: 'kept', penalty: false });
    expect(arrivalOutcome({ minutesLate: 30 })).toEqual({ status: 'cancelled', penalty: true });
    expect(arrivalOutcome({ minutesLate: 50, notice: 'late' })).toEqual({ status: 'kept', penalty: false });
    expect(arrivalOutcome({ minutesLate: 70, notice: 'late' })).toEqual({ status: 'cancelled', penalty: true });
    expect(arrivalOutcome({ minutesLate: null })).toEqual({ status: 'cancelled', penalty: true });
  });

  it('당일 취소 연락은 사유가 확인될 때만 페널티 면제', () => {
    expect(arrivalOutcome({ minutesLate: null, notice: 'cancel' })).toEqual({ status: 'cancelled', penalty: true });
    expect(arrivalOutcome({ minutesLate: null, notice: 'cancel', reasonAccepted: true })).toEqual({ status: 'cancelled', penalty: false });
  });

  it('페널티를 받으면 1주일 동안 예약할 수 없다', () => {
    const p = [{ at: at(2026, 10, 1, 12).toISOString() }];
    expect(penaltyStatus(p, at(2026, 10, 8, 11)).canReserve).toBe(false);
    expect(penaltyStatus(p, at(2026, 10, 8, 12)).canReserve).toBe(true);
  });

  it('유효기간 1년, 유효 페널티 5회 이상이면 영구 제한', () => {
    const p = [1, 3, 5, 7, 9].map((m) => ({ at: at(2026, m, 1, 12).toISOString() }));
    expect(penaltyStatus(p, at(2026, 10, 1, 12))).toMatchObject({ activeCount: 5, permanent: true, canReserve: false });
    const old = [{ at: at(2025, 1, 1, 12).toISOString() }, ...p.slice(1)];
    expect(penaltyStatus(old, at(2026, 10, 1, 12))).toMatchObject({ activeCount: 4, permanent: false, canReserve: true });
  });

  it('3개월 연속 매달 페널티를 받으면 횟수와 관계없이 영구 제한', () => {
    const months = (list) => list.map((m) => ({ at: at(2026, m, 10, 12).toISOString() }));
    expect(penaltyStatus(months([7, 8, 9]), at(2026, 10, 1, 12)).permanent).toBe(true);
    expect(penaltyStatus(months([6, 8, 9]), at(2026, 10, 1, 12)).permanent).toBe(false);
    expect(penaltyStatus(months([11, 12]).concat({ at: at(2027, 1, 5, 12).toISOString() }), at(2027, 2, 1, 12)).permanent).toBe(true); // 해를 넘겨도 연속
  });
});

describe('한국 시간 기준', () => {
  it('기기 시간대와 관계없이 KST로 날짜와 시각을 계산한다', () => {
    const t = new Date('2026-10-14T15:30:00Z'); // KST 10/15 00:30
    expect(toDateString(t)).toBe('2026-10-15');
    expect(minutesOfDay(t)).toBe(30);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('휴무일과 1인 1좌석', () => {
  it('공휴일은 날짜 목록에서 예약할 수 없다', () => {
    const xmas = at(2026, 12, 20, 10);
    expect(isHoliday('2026-12-25')).toBe(true);
    expect(isHoliday('2027-02-09')).toBe(true); // 설날 대체공휴일
    expect(isHoliday('2027-05-01')).toBe(false); // 노동절은 영업
    expect(bookableDates(xmas, 'focus')).not.toContain('2026-12-25');
    const errors = validateReservation({ ...base, date: '2026-12-25', type: 'focus', start: 10 * 60, hours: 1 }, [], xmas);
    expect(errors[0]).toMatch('공휴일');
  });

  it('같은 날에는 공간 종류와 관계없이 1건만 예약할 수 있다', () => {
    const mine = [make({ type: 'focus', start: 10 * 60, hours: 1 }).reservation];
    expect(make({ type: 'suite', start: 14 * 60, hours: 3, unit: 1, mine }).errors).toContain('같은 날에는 1개의 좌석만 예약할 수 있어요.');
    const otherDay = make({ type: 'suite', date: '2026-10-16', start: 14 * 60, hours: 3, unit: 1, mine });
    expect(otherDay.errors).toEqual([]);
  });
});
