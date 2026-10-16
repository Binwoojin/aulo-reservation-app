// 시간은 자정 기준 분(minute), 날짜는 로컬 'YYYY-MM-DD' 문자열로 다룬다.

const pad = (n) => String(n).padStart(2, '0');

export const formatTime = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

export const toDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

export const addDays = (dateString, days) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return toDateString(new Date(y, m - 1, d + days));
};

export const formatDate = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  const day = '일월화수목금토'[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${day})`;
};

export const formatWon = (amount) => `${amount.toLocaleString('ko-KR')}원`;

export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
