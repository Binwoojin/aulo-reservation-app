// 홈 음료 '추천' (홈 구성 결정 2026-10-16): 로그인 전에는 시간대, 로그인 후에는 최근 주문을 근거로 하고
// 왜 추천하는지 한 줄로 보여 준다 (필수 규칙 5). 인기·판매량 같은 근거 없는 말은 쓰지 않는다.
// 이용 중일 때는 홈 상태 카드의 추천 한 줄만 두므로 이 목록은 쓰지 않는다.
import { getDrink } from './reservation.js';
import { parseKey, sortedKeys } from './order.js';
import { lastReorderable } from './again.js';
import { HOURS } from '../config/policy.js';
import { minutesOfDay } from './time.js';

// 시간대별 제안: 이유는 시간대 자체(아침·식사 뒤·오후·저녁)만 말한다
export const TIME_PICKS = [
  { until: 11 * 60, label: '아침', reason: '하루를 여는 시간, 기본에 충실한 커피로 시작해요', drinks: ['americano', 'latte'] },
  { until: 14 * 60, label: '점심', reason: '식사 뒤에는 깔끔하고 가볍게', drinks: ['americano', 'earl-grey'] },
  { until: 17 * 60, label: '오후', reason: '오후엔 달콤한 한 잔으로 한 템포 쉬어 가요', drinks: ['vanilla-latte', 'caramel-macchiato'] },
  { until: HOURS.close, label: '저녁', reason: '저녁엔 커피 없이 편하게 마무리해요', drinks: ['yuja-tea', 'hot-chocolate'] },
];
export const timePick = (now) => {
  const m = minutesOfDay(now);
  return TIME_PICKS.find((t) => m < t.until) ?? TIME_PICKS.at(-1);
};

// 추천 목록: [{ drink, temp, reason }] 최대 3개. 최근 주문한 음료(같은 온도)가 있으면 맨 앞에.
export const drinkPicks = ({ orders = [], now }) => {
  const picks = [];
  const recent = lastReorderable(orders);
  if (recent) {
    const { id, temp } = parseKey(sortedKeys(recent.items)[0]);
    const drink = getDrink(id);
    if (drink) picks.push({ drink, temp, reason: '지난번에 주문하신 메뉴예요', basis: 'recent' });
  }
  const slot = timePick(now);
  slot.drinks
    .map(getDrink)
    .filter((d) => d && !picks.some((p) => p.drink.id === d.id))
    .forEach((drink) => picks.push({ drink, temp: null, reason: slot.reason, basis: 'time' }));
  return { slot, picks: picks.slice(0, 3) };
};
