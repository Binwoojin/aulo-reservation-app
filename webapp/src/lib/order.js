import { MENU, SPACES } from '../config/policy.js';

// 주문 유형
// - cafe:  일반 주문, 정상가
// - extra: Focus·Rest 이용 중 추가 주문 (이용 전 음료는 예약 때 정상가로 주문)
// - suite: Suite 공간 번호로 배달 주문 (기본 음료 1잔은 이용료에 포함)
//
// 재주문 혜택 (2026-10-19 확정) — 예약 시작 시각부터 이용 중에만 적용
// - Focus·Rest: 50% 할인 쿠폰, 예약당 최대 2회
// - Suite: 아메리카노·카페라떼 1잔 무료 리필 1회 → 이후 50% 할인 쿠폰 최대 2회. 그 밖의 음료는 정상가
//   주문에 리필 대상 음료가 없으면 리필은 남겨 두고 50% 쿠폰을 쓴다.

export const HALF_LIMIT = 2;
export const REFILL_DRINKS = ['americano', 'latte'];

export const BENEFIT_LABEL = {
  normal: '정상가',
  half: '50% 할인 쿠폰',
  refill: '무료 리필 쿠폰',
};

const usedFor = (reservation, previousOrders, benefit) =>
  previousOrders.filter((o) => o.reservationId === reservation?.id && o.benefit === benefit).length;

// 남은 혜택: { refill: 0|1, half: 0~2 }
export const remainingBenefits = (kind, reservation, previousOrders = []) => {
  if (kind === 'cafe' || !reservation) return { refill: 0, half: 0 };
  return {
    refill: kind === 'suite' ? Math.max(0, 1 - usedFor(reservation, previousOrders, 'refill')) : 0,
    half: Math.max(0, HALF_LIMIT - usedFor(reservation, previousOrders, 'half')),
  };
};

// 리필할 음료: 기본 음료가 리필 대상이고 주문에 있으면 그것, 아니면 주문에 있는 첫 리필 대상 음료
const refillDrinkIn = (items, reservation) => {
  const has = (id) => (items[id] ?? 0) > 0;
  if (REFILL_DRINKS.includes(reservation?.drinkId) && has(reservation.drinkId)) return reservation.drinkId;
  return REFILL_DRINKS.find(has) ?? null;
};

export const orderBenefit = (kind, reservation, previousOrders = [], items = {}) => {
  const left = remainingBenefits(kind, reservation, previousOrders);
  const nothingChosen = Object.values(items).every((q) => !q);
  if (left.refill && (nothingChosen || refillDrinkIn(items, reservation))) return 'refill';
  if (left.half) return 'half';
  return 'normal';
};

// items: { [drinkId]: quantity }
export const priceOrder = ({ kind, items, reservation, previousOrders = [] }) => {
  const benefit = orderBenefit(kind, reservation, previousOrders, items);
  const refillDrink = benefit === 'refill' ? refillDrinkIn(items, reservation) : null;
  const lines = MENU.value
    .filter((drink) => (items[drink.id] ?? 0) > 0)
    .map((drink) => {
      const quantity = items[drink.id];
      let paidQuantity = quantity;
      if (drink.id === refillDrink) paidQuantity -= 1;
      const unitPrice = benefit === 'half' ? Math.round(drink.price / 2) : drink.price;
      return {
        drinkId: drink.id,
        name: drink.name,
        quantity,
        listPrice: drink.price * quantity,
        total: unitPrice * paidQuantity,
      };
    });
  const listTotal = lines.reduce((sum, l) => sum + l.listPrice, 0);
  const total = lines.reduce((sum, l) => sum + l.total, 0);
  return { benefit, lines, listTotal, discount: listTotal - total, total };
};

// 할인 쿠폰: 이용 중인 Focus·Rest·Suite 예약을 주문에 연결하면(예약 확인) 재주문 혜택을 쿠폰으로 자동 적용한다.
export const couponFor = (kind, reservation, previousOrders = [], items = {}) => {
  if (kind === 'cafe' || !reservation) return null;
  const benefit = orderBenefit(kind, reservation, previousOrders, items);
  if (benefit === 'normal') return null;
  const left = remainingBenefits(kind, reservation, previousOrders);
  const name = (id) => MENU.value.find((d) => d.id === id)?.name;
  return {
    benefit,
    title: BENEFIT_LABEL[benefit],
    detail: benefit === 'refill'
      ? `${REFILL_DRINKS.map(name).join('·')} 중 1잔 무료 · 다른 음료는 정상가`
      : `${SPACES[reservation.type].name} 예약 확인 · 이번 주문 음료 전체 50% 할인 (남은 ${left.half}회 중 1회 사용)`,
  };
};

export const orderKindFor = (reservation) => {
  if (!reservation) return 'cafe';
  return SPACES[reservation.type].drink === 'included' ? 'suite' : 'extra';
};

// 카페 주문만 매장/테이크아웃을 고른다. 좌석 추가 주문과 Suite 배달은 이용 중인 공간에서 마시므로 매장 이용
export const SERVE_OPTIONS = [
  { value: 'dine-in', label: '매장에서 마실게요', detail: '매장용 컵에 담아 드려요' },
  { value: 'takeout', label: '테이크아웃할게요', detail: '일회용 컵에 담아 드려요' },
];
export const SERVE_LABEL = { 'dine-in': '매장', takeout: '테이크아웃' };
