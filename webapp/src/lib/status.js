// 내 상태 (필수 규칙 2·3): 홈 최상단에 하나만 보여 줄 상태 — 이용 중 > 다가오는 예약 > 예약 없음
import { isInUse, reservationEnd } from './reservation.js';
import { minutesOfDay, toDateString } from './time.js';

export const isUpcoming = (r, now) => {
  const today = toDateString(now);
  return r.date > today || (r.date === today && reservationEnd(r) > minutesOfDay(now));
};
const byTime = (a, b) => a.date.localeCompare(b.date) || a.start - b.start;

export const homeStatus = (reservations, now) => {
  const inUse = reservations.find((r) => isInUse(r, now));
  if (inUse) return { kind: 'in-use', reservation: inUse, minutesLeft: reservationEnd(inUse) - minutesOfDay(now) };
  const next = reservations.filter((r) => isUpcoming(r, now)).sort(byTime)[0];
  if (next) return { kind: 'upcoming', reservation: next };
  return { kind: 'none' };
};

// '1시간 5분', '40분'
export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60); const m = minutes % 60;
  return [h ? `${h}시간` : '', m ? `${m}분` : ''].filter(Boolean).join(' ') || '0분';
};
// 이용일까지 남은 날 (KST 날짜 기준): 0 오늘, 1 내일
export const daysUntil = (date, now) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${toDateString(now)}T00:00:00Z`)) / 86_400_000);

// 지금 매장의 오늘 운영 정보 (필수 규칙 4): 오늘 휴무인지, 7일 안에 공휴일 휴무가 있는지
export const storeToday = (now, isHoliday, addDays) => {
  const today = toDateString(now);
  const closed = isHoliday(today);
  let nextHoliday = null;
  for (let i = 1; i <= 7 && !nextHoliday; i += 1) if (isHoliday(addDays(today, i))) nextHoliday = addDays(today, i);
  return { closed, nextHoliday };
};
