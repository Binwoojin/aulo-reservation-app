import { BOOKING_WINDOW_DAYS, EXTENSION, HOURS, MENU, PENALTY, SPACES, STORES } from '../config/policy.js';
import { addDays, formatTime, minutesOfDay, rangesOverlap, toDateString } from './time.js';

export const getStore = (storeId) => STORES.value.find((s) => s.id === storeId);
export const getDrink = (drinkId) => MENU.value.find((d) => d.id === drinkId);

// 모든 공간 공통: 마지막 슬롯 22:00 종료
export const lastEndFor = () => HOURS.lastEnd;

export const unitIds = (storeId, type) => {
  const count = getStore(storeId)?.units[type] ?? 0;
  return Array.from({ length: count }, (_, i) => i + 1);
};

// 앱 예약 가능 날짜. 모든 공간이 당일 예약 불가라 내일부터 (Focus·Rest 당일은 매장 방문, Suite는 사전 예약 전용)
export const bookableDates = (now, type) => {
  const today = toDateString(now);
  const first = type && !SPACES[type].sameDayApp ? 1 : 0;
  return Array.from({ length: BOOKING_WINDOW_DAYS.value + 1 - first }, (_, i) => addDays(today, i + first));
};

// 선택 가능한 시작 시각 (정시, 최소 이용 시간을 22:00 종료 전에 채울 수 있어야 함)
// Suite는 최소 3시간이라 19:00 이후 시작은 자연히 막힌다(별도 '마감 3시간 전' 제한은 두지 않음).
export const startOptions = (type, date, now) => {
  const space = SPACES[type];
  if (!space?.reservable) return [];
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

// 같은 좌석·공간의 다음 예약 시작 시각 (없으면 null). 다음 예약이 연장보다 우선한다
export const nextReservationStart = (r, existing = []) => {
  const starts = existing
    .filter((x) => x.id !== r.id && x.storeId === r.storeId && x.type === r.type && x.date === r.date && x.unit === r.unit && x.start >= reservationEnd(r))
    .map((x) => x.start);
  return starts.length ? Math.min(...starts) : null;
};

// 연장 가능 범위: 최대 1시간, 폐점 1시간 전까지, 다음 예약 시작 전까지 (10분 단위)
// 최대 예약 시간(Focus·Rest 4시간)으로 예약했다면 연장할 수 없다
// reason: 'none'(연장 없는 공간) | 'max'(최대 시간 예약) | 'deadline'(폐점 1시간 전 이후) | 'next'(다음 예약과 겹침) | null(가능)
export const extensionRange = (r, existing = []) => {
  if (!SPACES[r.type].extendable) return { max: 0, reason: 'none' };
  if (r.hours >= SPACES[r.type].maxHours) return { max: 0, reason: 'max' };
  const { unitMinutes, maxMinutes } = EXTENSION;
  const end = reservationEnd(r);
  const next = nextReservationStart(r, existing);
  const byDeadline = extensionDeadline() - end;
  const byNext = next === null ? Infinity : next - end;
  const room = Math.floor(Math.min(maxMinutes, byDeadline, byNext) / unitMinutes) * unitMinutes;
  if (room > 0) return { max: room, reason: null };
  return { max: 0, reason: byNext <= byDeadline ? 'next' : 'deadline' };
};

export const maxExtensionMinutes = (r, existing = []) => extensionRange(r, existing).max;

export const extensionFee = (r, minutes, existing = []) => {
  if (minutes <= 0 || minutes % EXTENSION.unitMinutes || minutes > maxExtensionMinutes(r, existing)) return null;
  return extensionUnitPrice(r.type) * (minutes / EXTENSION.unitMinutes);
};

export const extensionNote = (type) => {
  const unit = extensionUnitPrice(type);
  if (unit === null) return SPACES[type].extension;
  return `${SPACES[type].extension} 연장 요금은 10분당 ${unit.toLocaleString('ko-KR')}원이며, 폐점 1시간 전(${formatTime(extensionDeadline())})까지만 연장할 수 있습니다. 다음 예약과 겹치거나 최대 ${SPACES[type].maxHours}시간으로 예약한 경우에는 연장할 수 없습니다.`;
};

// 예약별 연장 안내: 가능한 범위, 또는 연장 불가
export const extensionStatus = (r, existing = []) => {
  const { max, reason } = extensionRange(r, existing);
  if (reason === 'none') return SPACES[r.type].extension;
  if (reason === 'max') return `최대 이용 시간(${SPACES[r.type].maxHours}시간)으로 예약해 연장이 불가해요.`;
  if (reason === 'deadline') return `폐점 1시간 전(${formatTime(extensionDeadline())}) 이후로는 연장할 수 없어 이 예약은 연장이 불가해요.`;
  if (reason === 'next') return '바로 다음 시간에 이 좌석의 다른 예약이 있어 연장이 불가해요. 다음 예약이 우선이에요.';
  const capped = nextReservationStart(r, existing) === reservationEnd(r) + max ? '다음 예약 전인 ' : '';
  return `현장에서 ${capped}${formatTime(reservationEnd(r) + max)}까지 최대 ${max}분 연장할 수 있어요. 10분당 ${extensionUnitPrice(r.type).toLocaleString('ko-KR')}원.`;
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
  if (!space.sameDayApp && input.date === toDateString(now)) {
    errors.push(`${space.name}: ${space.sameDayNote}`);
  } else if (!bookableDates(now, input.type).includes(input.date)) errors.push('예약 가능한 날짜가 아닙니다.');
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

// 취소: 이용 전날 23:59까지 (당일 취소 불가)
export const canCancel = (r, now) => toDateString(now) < r.date;

// 노쇼·1시간 이상 지각 판정 시각: 이 시각까지 도착(체크인)하지 않으면 강제 취소
export const forfeitAt = (r) => r.start + PENALTY.lateLimitMinutes;

// 도착 결과 판정 (매장 체크인 시 사용)
// minutesLate: 늦은 분, 노쇼는 null / notice: 'none' | 'late'(지각 연락) | 'cancel'(당일 취소 연락)
// 지각 연락은 1시간까지만 예약을 지켜 주고, 그 이상은 연락했어도 취소 + 페널티. 당일 취소 연락은 취소만 하고 페널티 없음.
export const arrivalOutcome = ({ minutesLate, notice = 'none' }) => {
  if (notice === 'cancel') return { status: 'cancelled', penalty: false };
  if (minutesLate === null || minutesLate >= PENALTY.lateLimitMinutes) return { status: 'cancelled', penalty: true };
  return { status: 'kept', penalty: false };
};

// 페널티 상태. penalties: [{ at: ISO 문자열 }]
// - 유효 페널티: 받은 지 1년 이내
// - 제한: 가장 최근 페널티부터 1주일
// - 영구 제한: 유효 페널티가 5회 이상 쌓인 적이 있으면 (permanent 플래그로 기록, 이후 만료되지 않음)
export const penaltyStatus = (penalties, now, permanent = false) => {
  const day = 24 * 60 * 60 * 1000;
  const times = penalties.map((p) => new Date(p.at).getTime()).sort((a, b) => a - b);
  const active = times.filter((t) => now.getTime() - t < PENALTY.validDays * day);
  const isPermanent = permanent || active.length >= PENALTY.permanentAt;
  const last = times.at(-1);
  const blockedUntil = last !== undefined && now.getTime() < last + PENALTY.banDays * day ? new Date(last + PENALTY.banDays * day) : null;
  return { activeCount: active.length, permanent: isPermanent, blockedUntil, canReserve: !isPermanent && !blockedUntil };
};
