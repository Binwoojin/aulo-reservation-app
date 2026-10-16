import { MENU, SPACES } from '../config/policy.js';

// 주문 유형
// - cafe:  일반 주문, 정상가
// - extra: Focus·Rest 이용 중 추가 주문, 50% 할인 (이용 전 음료는 예약 때 정상가로 주문)
// - suite: Suite 공간 번호로 배달 주문
//          무료 리필 1회 → 정상가 → 50% 할인, 이후는 정상가/50% 교대 (반복 방식은 임시값)

export const suiteBenefit = (previousOrderCount) => {
  if (previousOrderCount === 0) return 'refill';
  return previousOrderCount % 2 === 1 ? 'normal' : 'half';
};

export const BENEFIT_LABEL = {
  normal: '정상가',
  half: '50% 할인 쿠폰',
  refill: '무료 리필 쿠폰',
};

export const orderBenefit = (kind, reservation, previousOrders = []) => {
  if (kind === 'extra') return 'half';
  if (kind === 'suite') {
    const count = previousOrders.filter((o) => o.reservationId === reservation?.id).length;
    return suiteBenefit(count);
  }
  return 'normal';
};

// items: { [drinkId]: quantity }
export const priceOrder = ({ kind, items, reservation, previousOrders = [] }) => {
  const benefit = orderBenefit(kind, reservation, previousOrders);
  let refillLeft = benefit === 'refill' ? 1 : 0;
  const lines = MENU.value
    .filter((drink) => (items[drink.id] ?? 0) > 0)
    .map((drink) => {
      const quantity = items[drink.id];
      let paidQuantity = quantity;
      if (refillLeft && drink.id === reservation?.drinkId) {
        paidQuantity -= 1;
        refillLeft -= 1;
      }
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

// 할인 쿠폰: Focus·Rest·Suite 예약이 확인되면(오늘 이용 중인 예약을 주문에 연결하면)
// 그 예약의 재주문 혜택을 쿠폰으로 발급해 자동 적용한다. 할인 폭은 확정 정책을 따른다.
// - Focus·Rest: 이용 중 재주문마다 50% 할인 쿠폰
// - Suite: 1번째 주문 무료 리필 쿠폰 → 2번째 정상가(쿠폰 없음) → 3번째 50% 할인 쿠폰 → 이후 교대(임시)
export const couponFor = (kind, reservation, previousOrders = []) => {
  if (kind === 'cafe' || !reservation) return null;
  const benefit = orderBenefit(kind, reservation, previousOrders);
  if (benefit === 'normal') return null;
  const space = SPACES[reservation.type];
  const drink = MENU.value.find((d) => d.id === reservation.drinkId);
  return {
    benefit,
    title: BENEFIT_LABEL[benefit],
    detail: benefit === 'refill'
      ? `${drink?.name ?? '기본 음료'} 1잔 무료 · 이번 주문에 자동 적용`
      : `${space.name} 예약 확인 · 이번 주문 음료 전체 50% 할인`,
  };
};

export const orderKindFor = (reservation) => {
  if (!reservation) return 'cafe';
  return SPACES[reservation.type].drink === 'included' ? 'suite' : 'extra';
};
