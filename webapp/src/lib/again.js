// 한 번에 다시 하기 (필수 규칙 1): 최근 카페 주문을 같은 옵션으로 다시 담고, 지난 예약을 같은 조건으로 다시 예약한다.
import { getDrink } from './reservation.js';
import { parseKey } from './order.js';
import { isUpcoming } from './status.js';

const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

// 다시 담을 수 있는 음료(메뉴에서 빠진 음료는 뺀다). 카페 주문만 대상 — 좌석 추가 주문·Suite 배달은 예약에 묶여 있다.
export const reorderItems = (order) =>
  order?.kind === 'cafe'
    ? Object.fromEntries(Object.entries(order.items).filter(([key, qty]) => qty > 0 && getDrink(parseKey(key).id)))
    : {};
export const canReorder = (order) => Object.keys(reorderItems(order)).length > 0;
export const lastReorderable = (orders) => [...orders].sort(newestFirst).find(canReorder) ?? null;

// 다시 예약: 지난 예약 중 가장 최근 것. 공간·매장·시작 시각·이용 시간·좌석·음료를 채우고 날짜만 새로 고른다.
export const lastPastReservation = (reservations, now) =>
  [...reservations].filter((r) => !isUpcoming(r, now)).sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start)[0] ?? null;
export const rebookPath = (r) => `/reserve/${r.type}?from=${r.id}`;
