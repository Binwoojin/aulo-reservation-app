import { BOOKING_WINDOW_DAYS, EXTENSION, HOURS, MENU, SPACES, STORES } from '../config/policy.js';
import { addDays, formatTime, minutesOfDay, rangesOverlap, toDateString } from './time.js';

export const getStore = (storeId) => STORES.value.find((s) => s.id === storeId);
export const getDrink = (drinkId) => MENU.value.find((d) => d.id === drinkId);

export const lastEndFor = (type) =>
  type === 'suite' ? HOURS.suiteLastEnd.value : HOURS.focusRestLastEnd.value;

export const unitIds = (storeId, type) => {
  const count = getStore(storeId)?.units[type] ?? 0;
  return Array.from({ length: count }, (_, i) => i + 1);
};

export const bookableDates = (now) => {
  const today = toDateString(now);
  return Array.from({ length: BOOKING_WINDOW_DAYS.value + 1 }, (_, i) => addDays(today, i));
};

// Suite: 마감까지 3시간 이하가 남으면 '오늘' 신규 예약을 제한한다.
// 미래 날짜는 해당 이용 시간 기준으로 판단하므로 이 제한을 적용하지 않는다.
export const isSuiteSameDayBlocked = (date, now) =>
  date === toDateString(now) &&
  HOURS.close - minutesOfDay(now) <= HOURS.suiteNewBookingCutoffHours * 60;

// 선택 가능한 시작 시각 (정시, 최소 이용 시간을 마감 전에 채울 수 있어야 함)
export const startOptions = (type, date, now) => {
  const space = SPACES[type];
  if (!space?.reservable) return [];
  if (type === 'suite' && isSuiteSameDayBlocked(date, now)) return [];
  const isToday = date === toDateString(now);
  const latestStart = lastEndFor(type) - space.minHours * 60;
  const options = [];
  for (let start = HOURS.open.value; start <= latestStart; start += 60) {
    if (isToday && start <= minutesOfDay(now)) continue;
    options.push(start);
  }
  return options;
};

export const durationOptions = (type, start) => {
  const space = SPACES[type];
  if (!space?.reservable || start == null) return [];
  const options = [];
  for (let hours = space.minHours; hours <= space.maxHours; hours += 1) {
    if (start + hours * 60 <= lastEndFor(type)) options.push(hours);
  }
  return options;
};

export const reservationEnd = (r) => r.start + r.hours * 60;

const conflicts = (a, b) =>
  a.storeId === b.storeId &&
  a.type === b.type &&
  a.unit === b.unit &&
  a.date === b.date &&
  rangesOverlap(a.start, reservationEnd(a), b.start, reservationEnd(b));

export const freeUnits = ({ storeId, type, date, start, hours }, existing) =>
  unitIds(storeId, type).filter(
    (unit) => !existing.some((r) => conflicts(r, { storeId, type, date, start, hours, unit })),
  );

// Suite 공간별 예약된 시간대 (가능 시간 조회용)
export const bookedRanges = ({ storeId, type, date, unit }, existing) =>
  existing
    .filter((r) => r.storeId === storeId && r.type === type && r.date === date && r.unit === unit)
    .map((r) => ({ start: r.start, end: reservationEnd(r) }))
    .sort((a, b) => a.start - b.start);

export const reservationFee = (type, hours) => SPACES[type].pricePerHour * hours;

// 현장 연장 요금: 10분 단가(100원 단위 버림) × 10분 단위 수. 연장이 없는 공간은 null
export const extensionUnitPrice = (type) => {
  if (!SPACES[type].extendable) return null;
  const { unitMinutes, roundDownTo } = EXTENSION;
  return Math.floor((SPACES[type].pricePerHour * unitMinutes) / 60 / roundDownTo) * roundDownTo;
};

// 연장은 폐점 1시간 전까지만 (23:00 마감 → 22:00)
export const extensionDeadline = () => HOURS.close - EXTENSION.cutoffBeforeCloseMinutes;

// 이 예약이 연장할 수 있는 최대 분(10분 단위). 0이면 연장 불가
export const maxExtensionMinutes = (r) => {
  if (!SPACES[r.type].extendable) return 0;
  const { unitMinutes, maxMinutes } = EXTENSION;
  const room = Math.floor((extensionDeadline() - reservationEnd(r)) / unitMinutes) * unitMinutes;
  return Math.max(0, Math.min(maxMinutes, room));
};

export const extensionFee = (r, minutes) => {
  if (minutes <= 0 || minutes % EXTENSION.unitMinutes || minutes > maxExtensionMinutes(r)) return null;
  return extensionUnitPrice(r.type) * (minutes / EXTENSION.unitMinutes);
};

export const extensionNote = (type) => {
  const unit = extensionUnitPrice(type);
  if (unit === null) return SPACES[type].extension;
  return `${SPACES[type].extension} 연장 요금은 10분당 ${unit.toLocaleString('ko-KR')}원이며, 폐점 1시간 전(${formatTime(extensionDeadline())})까지만 연장할 수 있습니다.`;
};

// 예약별 연장 안내: 가능한 범위, 또는 연장 불가
export const extensionStatus = (r) => {
  if (!SPACES[r.type].extendable) return SPACES[r.type].extension;
  const max = maxExtensionMinutes(r);
  if (max === 0) return `폐점 1시간 전(${formatTime(extensionDeadline())}) 이후로는 연장할 수 없어 이 예약은 연장이 불가해요.`;
  return `현장에서 ${formatTime(reservationEnd(r) + max)}까지 최대 ${max}분 연장할 수 있어요. 10분당 ${extensionUnitPrice(r.type).toLocaleString('ko-KR')}원.`;
};

export const drinkFee = (type, drinkId) => {
  if (SPACES[type].drink === 'included') return 0;
  return getDrink(drinkId)?.price ?? 0;
};

export const validateReservation = (input, existing, now) => {
  const errors = [];
  const space = SPACES[input.type];
  if (!space?.reservable) return ['예약할 수 없는 공간입니다.'];
  if (!getStore(input.storeId)) errors.push('매장을 선택해 주세요.');
  if (!bookableDates(now).includes(input.date)) errors.push('예약 가능한 날짜가 아닙니다.');
  if (input.type === 'suite' && isSuiteSameDayBlocked(input.date, now)) {
    errors.push('마감까지 3시간 이하가 남아 오늘 Suite 신규 예약이 제한됩니다.');
  }
  if (!startOptions(input.type, input.date, now).includes(input.start)) {
    errors.push('선택할 수 없는 시작 시간입니다.');
  } else if (!durationOptions(input.type, input.start).includes(input.hours)) {
    errors.push(`이용 시간은 ${space.minHours}~${space.maxHours}시간, 마감 전에 끝나야 합니다.`);
  }
  if (!getDrink(input.drinkId)) {
    errors.push(space.drink === 'included' ? '기본 음료를 선택해 주세요.' : '이용 전 음료를 선택해 주세요.');
  }
  if (input.unit != null && errors.length === 0) {
    if (!freeUnits(input, existing).includes(input.unit)) errors.push('이미 예약된 시간입니다.');
  }
  if (input.unit == null && errors.length === 0 && freeUnits(input, existing).length === 0) {
    errors.push(`선택한 시간에 남은 ${space.unitName}이 없습니다.`);
  }
  return errors;
};

// Suite는 사용자가 공간을 고르고, Focus·Rest는 빈 좌석을 자동 배정한다.
export const createReservation = (input, existing, now, makeId = () => crypto.randomUUID()) => {
  const errors = validateReservation(input, existing, now);
  if (errors.length) return { errors };
  const unit = input.unit ?? freeUnits(input, existing)[0];
  const space = SPACES[input.type];
  return {
    errors: [],
    reservation: {
      id: makeId(),
      type: input.type,
      storeId: input.storeId,
      date: input.date,
      start: input.start,
      hours: input.hours,
      unit,
      drinkId: input.drinkId,
      requests: (input.requests ?? []).filter((id) => space.requests.some((r) => r.id === id)),
      fee: reservationFee(input.type, input.hours),
      drinkFee: drinkFee(input.type, input.drinkId),
      createdAt: now.toISOString(),
    },
  };
};
