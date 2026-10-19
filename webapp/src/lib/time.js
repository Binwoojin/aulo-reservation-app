// 시간은 자정 기준 분(minute), 날짜는 'YYYY-MM-DD' 문자열로 다룬다.
// 기준 시간은 한국 시간(KST, UTC+9) 고정 (2026-10-19 확정): 기기 시간대와 관계없이 같은 결과를 낸다.

const pad = (n) => String(n).padStart(2, '0');
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
// KST 벽시계 값을 UTC 필드로 읽기 위한 Date
const kst = (date) => new Date(date.getTime() + KST_OFFSET_MS);
const ymd = (utcDate) => `${utcDate.getUTCFullYear()}-${pad(utcDate.getUTCMonth() + 1)}-${pad(utcDate.getUTCDate())}`;

export const formatTime = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

export const toDateString = (date) => ymd(kst(date));

export const minutesOfDay = (date) => {
  const k = kst(date);
  return k.getUTCHours() * 60 + k.getUTCMinutes();
};

export const addDays = (dateString, days) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return ymd(new Date(Date.UTC(y, m - 1, d + days)));
};

export const formatDate = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  const day = '일월화수목금토'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 (${day})`;
};

// KST 날짜·시각 (예: 10월 19일 14:05)
export const formatDateTime = (date) => {
  const [, m, d] = toDateString(date).split('-').map(Number);
  return `${m}월 ${d}일 ${formatTime(minutesOfDay(date))}`;
};

export const formatWon = (amount) => `${amount.toLocaleString('ko-KR')}원`;

export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
