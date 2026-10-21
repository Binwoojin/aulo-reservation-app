import { SEAT_LAYOUT } from '../config/policy.js';

// 매장 좌석 수(count)를 임시 배치도의 구역 비율대로 나눠 번호를 붙인다.
// 반환: [{ id, label, desc, look, cols(실제 한 줄 칸 수), seats: [번호...] }]
export const seatLayout = (type, count) => {
  const zones = SEAT_LAYOUT.value[type] ?? [];
  let next = 1;
  return zones.map((z, i) => {
    const last = i === zones.length - 1;
    const size = last ? count - next + 1 : Math.round(count * z.share);
    const seats = Array.from({ length: Math.max(0, size) }, (_, k) => next + k);
    next += seats.length;
    // 한 줄 최대 cols칸 안에서 줄마다 비슷한 수로 나눈다 (8석 → 4+4, 10석 → 5+5). 마주 보기는 반씩 위·아래 줄
    const perRow = z.look === 'facing' ? Math.ceil(seats.length / 2) : seats.length;
    const rows = Math.max(1, Math.ceil(perRow / z.cols));
    return { ...z, cols: Math.max(1, Math.ceil(perRow / rows)), seats };
  });
};

// 좌석 번호가 속한 구역 이름 (확인 단계·요약에 쓴다)
export const seatZone = (type, count, unit) => seatLayout(type, count).find((z) => z.seats.includes(unit)) ?? null;
