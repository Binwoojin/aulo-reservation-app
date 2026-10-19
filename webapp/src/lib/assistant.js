// Aulo 이용 도우미 (데모): AI 없이 policy.js의 확정 정책과 '내 예약' 상태로 답하는 시나리오형 챗봇.
// 정책이 바뀌면 답도 함께 바뀐다. 모르는 질문은 지어내지 않고 이용 안내나 매장으로 넘긴다(필수 규칙 5).
import {
  BOOKING_WINDOW_DAYS, CANCEL_POLICY, HOURS, LATE_POLICY, MAX_SHOTS, OWN_CUP_DISCOUNT,
  PAYMENT_METHODS, PENALTY, SHOT_PRICE, SPACES,
} from '../config/policy.js';
import { HALF_LIMIT, REFILL_DRINKS, orderKindFor, remainingBenefits } from './order.js';
import { canCancel, extensionStatus, extensionUnitPrice, getDrink, isInUse, reservationEnd } from './reservation.js';
import { pointBalance, stampCount } from './rewards.js';
import { addDays, formatDate, formatTime, formatWon, minutesOfDay, toDateString } from './time.js';

// 빠른 질문 칩 (화면 첫 안내와 매 답변 아래에 보여 준다)
export const QUICK_INTENTS = [
  { id: 'extend', label: '연장할 수 있어요?' },
  { id: 'cancel', label: '예약 취소' },
  { id: 'late', label: '늦을 것 같아요' },
  { id: 'coupon', label: '음료 할인·쿠폰' },
  { id: 'rewards', label: '스탬프·포인트' },
  { id: 'penalty', label: '노쇼 페널티' },
  { id: 'hours', label: '운영 시간·휴무' },
];

// 자유 입력은 낱말로 의도를 고른다 (앞에 있는 의도가 우선)
const KEYWORDS = [
  ['extend', ['연장', '더 있', '늘리']],
  ['late', ['늦', '지각']],
  ['cancel', ['취소', '환불']],
  ['penalty', ['노쇼', '페널티', '패널티', '제한', '정지']],
  ['refill', ['리필']],
  ['tumbler', ['텀블러', '개인컵']],
  ['coupon', ['쿠폰', '할인', '추가 주문', '50%']],
  ['rewards', ['스탬프', '포인트', '적립']],
  ['options', ['샷', '아이스', '핫', '옵션']],
  ['hours', ['운영', '영업', '오픈', '마감', '휴무', '공휴일', '몇 시']],
  ['booking', ['예약 가능', '언제까지 예약', '당일', '며칠']],
  ['payment', ['결제', '카드', '계좌', '부가세']],
];

export const detectIntent = (text) => {
  const t = text.replace(/\s+/g, ' ').trim();
  return KEYWORDS.find(([, words]) => words.some((w) => t.includes(w)))?.[0] ?? 'unknown';
};

const label = (r) => `${SPACES[r.type].name} ${r.unit}번`;
const when = (r) => `${formatDate(r.date)} ${formatTime(r.start)}–${formatTime(reservationEnd(r))}`;
const byTime = (a, b) => a.date.localeCompare(b.date) || a.start - b.start;

// 지금 이용 중인 예약, 없으면 가장 가까운 다가오는 예약
const focusReservation = (mine, now) => {
  const inUse = mine.find((r) => isInUse(r, now));
  if (inUse) return inUse;
  const today = toDateString(now);
  return [...mine]
    .filter((r) => r.date > today || (r.date === today && reservationEnd(r) > minutesOfDay(now)))
    .sort(byTime)[0] ?? null;
};

const loginNeeded = {
  text: ['로그인하면 내 예약을 기준으로 알려 드릴 수 있어요.'],
  actions: [{ label: '로그인하기', to: '/login?redirect=%2Fhelp' }],
};

// 답변: { text: string[], actions: { label, to }[] }
export const answer = (intent, { user, myReservations = [], reservations = [], orders = [], now }) => {
  const r = user ? focusReservation(myReservations, now) : null;

  switch (intent) {
    case 'extend': {
      const general = `Focus·Rest는 현장에서 10분 단위로 최대 1시간 연장할 수 있어요. 10분 요금은 Focus ${formatWon(extensionUnitPrice('focus'))}, Rest ${formatWon(extensionUnitPrice('rest'))}이에요. 폐점 1시간 전(${formatTime(HOURS.close - 60)})까지만, 다음 예약과 겹치거나 최대 4시간으로 예약했다면 연장할 수 없어요. Suite는 연장이 없어요.`;
      if (!user) return { text: [general, ...loginNeeded.text], actions: loginNeeded.actions };
      if (!r) return { text: ['지금 이용 중이거나 다가오는 예약이 없어요.', general], actions: [{ label: '예약하기', to: '/reserve' }] };
      return {
        text: [`${label(r)} 예약(${when(r)}) 기준으로 알려 드릴게요.`, extensionStatus(r, reservations)],
        actions: [{ label: '예약 상세 보기', to: `/reservations/${r.id}` }],
      };
    }

    case 'cancel': {
      if (!user) return { text: [CANCEL_POLICY, ...loginNeeded.text], actions: loginNeeded.actions };
      if (!r) return { text: ['취소할 수 있는 예약이 없어요.', CANCEL_POLICY], actions: [{ label: '내 예약', to: '/my/reservations' }] };
      const deadline = formatDate(addDays(r.date, -1));
      return canCancel(r, now)
        ? { text: [`${label(r)} 예약(${when(r)})은 ${deadline} 23:59까지 취소할 수 있어요.`, '예약 상세에서 바로 취소할 수 있고, 예약에 쓴 포인트는 돌려받아요.'], actions: [{ label: '예약 상세에서 취소하기', to: `/reservations/${r.id}` }] }
        : { text: [`${label(r)} 예약은 이용 당일이라 앱에서 취소할 수 없어요.`, '급한 사정이 있으면 매장에 연락해 주세요. 사유가 확인되면 페널티를 면제해요.'], actions: [{ label: '예약 상세 보기', to: `/reservations/${r.id}` }] };
    }

    case 'late': {
      const text = [...LATE_POLICY.slice(0, 2)];
      if (user && r && r.date === toDateString(now)) {
        text.unshift(`오늘 ${label(r)} 예약은 ${formatTime(r.start)} 시작이에요. 연락 없이 ${formatTime(r.start + PENALTY.noNoticeLimitMinutes)}, 미리 연락하면 ${formatTime(r.start + PENALTY.lateLimitMinutes)}까지 오시면 예약이 유지돼요.`);
      }
      text.push('카카오톡 채널 연락은 준비 중이에요. 지금은 매장에 직접 연락해 주세요.');
      return { text, actions: r ? [{ label: '예약 상세 보기', to: `/reservations/${r.id}` }] : [] };
    }

    case 'penalty':
      return {
        text: [
          `노쇼이거나 연락 없이 ${PENALTY.noNoticeLimitMinutes}분, 연락했어도 ${PENALTY.lateLimitMinutes}분 넘게 늦으면 예약이 취소되고 ${PENALTY.banDays}일 동안 예약할 수 없어요. 사유 없는 당일 취소 통보도 같아요.`,
          `페널티는 1년 동안 유효하고, 1년 안에 ${PENALTY.permanentAt}회 이상이거나 ${PENALTY.frequentMonths}개월 연속으로 받으면 예약 서비스를 영구적으로 이용할 수 없어요.`,
          '데모 버전에서는 매장 체크인이 없어 실제로 페널티가 매겨지지 않아요.',
        ],
        actions: [{ label: '이용 안내 보기', to: '/info' }],
      };

    case 'coupon': {
      const text = [
        `Focus·Rest 이용 중 재주문은 50% 할인 쿠폰을 예약당 최대 ${HALF_LIMIT}회 쓸 수 있어요.`,
        `Suite는 아메리카노·카페라떼 1잔 무료 리필 1회, 이후 50% 할인 쿠폰 최대 ${HALF_LIMIT}회예요.`,
        '쿠폰은 좌석 이용 시작 시각부터, 내 예약에서 추가 주문·Suite 배달 메뉴로 들어가면 자동 적용돼요.',
      ];
      const actions = [];
      if (user && r && isInUse(r, now)) {
        const left = remainingBenefits(orderKindFor(r), r, orders);
        text.unshift(`지금 이용 중인 ${label(r)}은 ${left.refill ? '무료 리필 1회, ' : ''}50% 할인 쿠폰 ${left.half}회가 남아 있어요.`);
        actions.push({ label: SPACES[r.type].drink === 'included' ? 'Suite 배달 메뉴' : '추가 주문하기', to: `/reservations/${r.id}/order` });
      }
      return { text, actions };
    }

    case 'refill': {
      const base = user && r?.type === 'suite' ? getDrink(r.drinkId)?.name : null;
      return {
        text: [
          `Suite 이용 중 첫 리필 1잔은 ${REFILL_DRINKS.map((id) => getDrink(id).name).join('·')}만 무료예요. 다른 음료는 정상가예요.`,
          '샷 추가 금액은 리필 잔에도 받고, 텀블러 할인은 겹쳐 드리지 않아요.',
          ...(base ? [`예약하신 기본 음료는 ${base}예요.`] : []),
        ],
        actions: [],
      };
    }

    case 'tumbler':
      return {
        text: [`텀블러·개인컵으로 주문하면 1잔당 ${formatWon(OWN_CUP_DISCOUNT)} 할인돼요. 음료 상세에서 '주문하기'를 누르고 '텀블러 사용'을 켜 주세요.`, '50% 쿠폰은 텀블러 할인 후 금액에 적용돼요.'],
        actions: [{ label: '음료 주문', to: '/order' }],
      };

    case 'options':
      return {
        text: [`커피는 아이스·핫 중 하나를 골라야 해요(가격 같음). 샷은 최대 ${MAX_SHOTS}회, 1회 ${formatWon(SHOT_PRICE.value)}이에요(임시 가격).`],
        actions: [{ label: '음료 주문', to: '/order' }],
      };

    case 'rewards': {
      const text = ['스탬프는 음료 1잔당 1개, 포인트는 좌석 이용료 결제 금액의 10%를 적립해요. 포인트는 좌석 이용료에만 쓸 수 있고 음료 주문에는 못 써요.'];
      if (user) text.unshift(`지금 스탬프 ${stampCount(orders, myReservations, now)}개, 포인트 ${pointBalance(myReservations, now).toLocaleString('ko-KR')}P가 있어요.`);
      return { text, actions: user ? [{ label: '마이에서 보기', to: '/my' }] : loginNeeded.actions };
    }

    case 'hours':
      return {
        text: [`매장은 ${formatTime(HOURS.open)}에 열고 23:00에 닫아요. 모든 좌석은 폐점 10분 전인 ${formatTime(HOURS.checkout)}까지 퇴실해야 해요.`, '공휴일(대체공휴일 포함)은 휴무예요.'],
        actions: [{ label: '이용 안내 보기', to: '/info' }],
      };

    case 'booking':
      return {
        text: [`앱 예약은 내일부터 오늘+${BOOKING_WINDOW_DAYS}일까지 할 수 있어요. 당일 예약은 받지 않아요.`, 'Focus·Rest 당일 이용은 매장에 방문하면 빈 좌석을 배정해 드리고, Suite는 사전 예약으로만 이용해요. 한 사람은 같은 날 1개 좌석만 예약할 수 있어요.'],
        actions: [{ label: '예약하기', to: '/reserve' }],
      };

    case 'payment':
      return {
        text: [`이용료와 음료는 방문 후 매장에서 결제해요(${PAYMENT_METHODS.join(' · ')}). 표시 가격은 모두 부가세 포함이에요.`],
        actions: [],
      };

    default:
      return {
        text: ['그 질문은 아직 답할 수 없어요. 아래 질문 중에서 골라 주시거나, 이용 안내를 확인해 주세요.'],
        actions: [{ label: '이용 안내 보기', to: '/info' }],
      };
  }
};
