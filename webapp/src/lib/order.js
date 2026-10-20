import { MENU, ORDER_HISTORY_MONTHS, OWN_CUP_DISCOUNT, SHOT_PRICE, SPACES } from '../config/policy.js';
import { needsTemp } from './drink.js';
import { historyCutoff } from './time.js';

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

// 온도: 커피·녹차는 아이스/핫을 골라 주문한다 (2026-10-19). 가격 차이는 없다. 한 가지 온도만 있는 음료는 키에 온도를 넣지 않는다.
// 담은 음료의 키에 옵션을 담는다: 'americano@ice+shot1+cup' = 아이스 · 샷 1회 추가 · 개인컵
// 옵션이 없으면 'hot-chocolate'처럼 음료 id만 쓴다. 옵션이 다르면 다른 줄로 담긴다.
export const TEMPS = [
  { value: 'ice', label: '아이스', short: 'ICE' },
  { value: 'hot', label: '핫', short: 'HOT' },
];
export const TEMP_LABEL = { ice: '아이스', hot: '핫' };
export const hasTemp = needsTemp;
export const itemKey = (id, temp, { shot = 0, ownCup = false } = {}) =>
  `${id}${temp ? `@${temp}` : ''}${shot ? `+shot${shot}` : ''}${ownCup ? '+cup' : ''}`;
export const parseKey = (key) => {
  const [head, ...opts] = key.split('+');
  const [id, temp = null] = head.split('@');
  const shot = Number(opts.find((o) => o.startsWith('shot'))?.slice(4) ?? 0);
  return { id, temp, shot, ownCup: opts.includes('cup') };
};
// 옵션 설명 (예: '샷 1회 추가 · 개인컵'), 없으면 ''
export const optionsText = ({ shot, ownCup }) => [shot ? `샷 ${shot}회 추가` : '', ownCup ? `텀블러 −${OWN_CUP_DISCOUNT.toLocaleString('ko-KR')}원` : ''].filter(Boolean).join(' · ');
// 1잔 가격 = 음료 가격 + 샷 추가 금액 − 텀블러 할인(300원)
export const unitPriceOf = (key) => {
  const { id, shot, ownCup } = parseKey(key);
  return (MENU.value.find((d) => d.id === id)?.price ?? 0) + shot * SHOT_PRICE.value - (ownCup ? OWN_CUP_DISCOUNT : 0);
};
// '아이스 아메리카노'처럼 온도를 붙인 이름
export const drinkLabel = (id, temp) => {
  const name = MENU.value.find((d) => d.id === id)?.name ?? id;
  return temp ? `${TEMP_LABEL[temp]} ${name}` : name;
};
// 메뉴 순서 → 아이스 → 핫 순으로 담은 음료 키를 정렬
const menuIndex = (id) => MENU.value.findIndex((d) => d.id === id);
export const sortedKeys = (items) =>
  Object.keys(items)
    .filter((k) => items[k] > 0)
    .sort((a, b) => {
      const pa = parseKey(a); const pb = parseKey(b);
      return menuIndex(pa.id) - menuIndex(pb.id) || (pa.temp === 'hot') - (pb.temp === 'hot');
    });

// 리필할 음료(키): 기본 음료가 리필 대상이고 주문에 있으면 그것, 아니면 주문에 있는 첫 리필 대상 음료
const refillDrinkIn = (items, reservation) => {
  const keys = sortedKeys(items).filter((k) => REFILL_DRINKS.includes(parseKey(k).id));
  return keys.find((k) => parseKey(k).id === reservation?.drinkId) ?? keys[0] ?? null;
};

export const orderBenefit = (kind, reservation, previousOrders = [], items = {}) => {
  const left = remainingBenefits(kind, reservation, previousOrders);
  const nothingChosen = Object.values(items).every((q) => !q);
  if (left.refill && (nothingChosen || refillDrinkIn(items, reservation))) return 'refill';
  if (left.half) return 'half';
  return 'normal';
};

// 쿠폰을 고를 수 있는지: 고른 혜택이 이번 주문에 쓸 수 없으면 이유를 돌려준다 (쓸 수 있으면 null)
export const benefitBlocker = (benefit, kind, reservation, previousOrders = [], items = {}) => {
  if (benefit === 'normal') return null;
  const left = remainingBenefits(kind, reservation, previousOrders);
  if (benefit === 'half') return left.half ? null : '모두 사용했어요';
  if (benefit === 'refill') {
    if (!left.refill) return kind === 'suite' ? '이미 사용했어요' : 'Suite 이용 때만 발급돼요';
    if (!Object.values(items).some((q) => q > 0)) return null;
    return refillDrinkIn(items, reservation) ? null : '아메리카노·카페라떼를 담으면 쓸 수 있어요';
  }
  return '쓸 수 없는 쿠폰이에요';
};

// items: { [itemKey]: quantity }
// chosen: 사용자가 고른 쿠폰('half' | 'refill' | 'normal'). 없거나 이번 주문에 못 쓰면 가장 유리한 쿠폰을 자동으로 고른다.
// 카페 주문(장바구니)도 이용 중인 예약을 넘기면 그 예약의 쿠폰을 쓸 수 있다 (혜택 종류는 예약 기준).
export const priceOrder = ({ kind, items, reservation, previousOrders = [], chosen }) => {
  const couponKind = reservation ? orderKindFor(reservation) : kind;
  const auto = orderBenefit(couponKind, reservation, previousOrders, items);
  const benefit = chosen && !benefitBlocker(chosen, couponKind, reservation, previousOrders, items) ? chosen : auto;
  const refillKey = benefit === 'refill' ? refillDrinkIn(items, reservation) : null;
  const lines = sortedKeys(items)
    .map((key) => {
      const opts = parseKey(key);
      const drink = MENU.value.find((d) => d.id === opts.id);
      const quantity = items[key];
      const listUnit = unitPriceOf(key);
      const unitPrice = benefit === 'half' ? Math.round(listUnit / 2) : listUnit;
      // 무료 리필 잔은 샷 추가 금액만 받는다 (이미 무료라 텀블러 할인은 겹쳐 주지 않는다)
      const refillDiscount = key === refillKey ? listUnit - opts.shot * SHOT_PRICE.value : 0;
      return {
        key,
        drinkId: drink.id,
        temp: opts.temp,
        options: optionsText(opts),
        name: drinkLabel(opts.id, opts.temp),
        quantity,
        listPrice: listUnit * quantity,
        total: unitPrice * quantity - refillDiscount,
      };
    });
  const listTotal = lines.reduce((sum, l) => sum + l.listPrice, 0);
  const total = lines.reduce((sum, l) => sum + l.total, 0);
  return { benefit, lines, listTotal, discount: listTotal - total, total };
};

// 할인 쿠폰: 이용 중인 Focus·Rest·Suite 예약을 주문에 연결하면(예약 확인) 재주문 혜택을 쿠폰으로 자동 적용한다.
export const couponFor = (kind, reservation, previousOrders = [], items = {}, chosen) => {
  if (!reservation) return null;
  kind = orderKindFor(reservation);
  const benefit = priceOrder({ kind, items, reservation, previousOrders, chosen }).benefit;
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

// 주문 내역 보관 기간: 지금부터 ORDER_HISTORY_MONTHS개월 전(같은 날짜·시각, 그 달에 없는 날이면 말일)까지의 주문만 보여 준다
export { historyCutoff };
export const recentOrders = (orders, now) => {
  const cutoff = historyCutoff(now, ORDER_HISTORY_MONTHS).getTime();
  return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
};
