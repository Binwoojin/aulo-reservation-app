// Aulo 서비스 정책
// - 확정 정책: brand-landing/CLAUDE_HANDOFF.md '확정 정책'
// - provisional(): 같은 문서 '미확정 — 임의 구현 금지' 항목의 임시값.
//   화면에 '임시' 표시가 붙고, 정책이 확정되면 이 파일의 값만 바꾸면 된다.

export const provisional = (value, note) => ({ value, provisional: true, note });

export const PROVISIONAL_NOTES = [];
const p = (value, note) => {
  PROVISIONAL_NOTES.push(note);
  return provisional(value, note);
};

const h = (hour, minute = 0) => hour * 60 + minute;

export const HOURS = {
  open: p(h(9), '매장 오픈 시간 미확정 — 임시로 09:00 오픈'),
  close: h(23), // 데모 마감 23:00 (확정)
  checkout: h(22, 50), // 모든 좌석 22:50 퇴실 = 폐점 10분 전 (Suite 확정, Focus·Rest 2026-10-16 결정)
  lastEnd: h(22), // 마지막 슬롯은 22:00 종료 (1시간 단위와 22:50 퇴실을 맞춤, 2026-10-16 확정)
};

export const BOOKING_WINDOW_DAYS = p(14, '예약 가능 기간 미확정 — 임시로 오늘부터 14일 후까지');

// 현장 연장 (Focus·Rest): 10분 단위, 최대 1시간 (확정)
// 10분 요금 = 시간당 이용료 ÷ 6을 100원 단위로 버림해 10의 자리를 항상 0으로 맞춘다 (2026-10-16 결정)
// 연장은 폐점 1시간 전(23:00 마감 → 22:00)까지만 가능하고, 그 이후로는 연장 불가로 안내한다 (2026-10-16 결정)
export const EXTENSION = { unitMinutes: 10, maxMinutes: 60, roundDownTo: 100, cutoffBeforeCloseMinutes: 60 };

export const SPACE_TYPES = ['cafe', 'focus', 'rest', 'suite'];

// 좌석 가격: 2026-10-16 사용자 요청으로 국내 유사 업종 시장 평균가에 맞춰 임의 설정 (기존 확정가 1,500/3,000/8,000원 대체)
// - Focus: 스터디카페 1인 좌석 평균 약 2,000원/시간
// - Rest: 수면·리클라이너 카페 5,000~8,000원/시간의 중간값
// - Suite: 1인 독립 오피스·소형 스터디룸 약 10,000~12,000원/시간의 평균
export const SEAT_PRICES = p(
  { focus: 2000, rest: 6500, suite: 11000 },
  '좌석 가격은 유사 업종 시장 평균으로 임의 설정 — Focus 2,000원 · Rest 6,500원 · Suite 11,000원/시간',
);

export const SPACES = {
  cafe: {
    id: 'cafe',
    name: 'Flow Cafe',
    label: '카페',
    category: '커피와 일상',
    headline: '커피 한 잔과 함께, 편안한 머무름.',
    image: 'flow-cafe',
    reservable: false,
    summary: '음료 주문 후 이용하는 일반 카페 좌석입니다. 별도 좌석 예약은 없습니다.',
  },
  focus: {
    id: 'focus',
    name: 'Flow Focus',
    label: '집중',
    category: '작업과 공부',
    headline: '조용히, 나의 일에 몰입.',
    image: 'flow-focus',
    reservable: true,
    unitName: '좌석',
    pricePerHour: SEAT_PRICES.value.focus,
    minHours: 1,
    maxHours: 4,
    drink: 'required', // 이용 전 음료 별도 주문
    extraDrinkDiscount: 0.5,
    requests: [],
    features: ['가림막이 있는 반폐쇄형 개인 좌석', '좌석별 사물함', '추가 음료 50% 할인'],
    sameDayApp: false, // 앱 당일 예약 불가, 당일 이용은 매장 방문 (2026-10-16 결정)
    sameDayNote: '앱에서는 당일 예약할 수 없어요. 오늘 이용은 매장에 방문하면 빈 좌석을 배정해 드려요.',
    extendable: true,
    extension: '앱으로 사전 예약하면 현장에서 10분 단위로 최대 1시간 연장할 수 있습니다.',
  },
  rest: {
    id: 'rest',
    name: 'Flow Rest',
    label: '휴식',
    category: '온전한 휴식',
    headline: '잠시 멈추고, 편안하게 쉬어가세요.',
    image: 'flow-rest',
    reservable: true,
    unitName: '리클라이너',
    pricePerHour: SEAT_PRICES.value.rest,
    minHours: 1,
    maxHours: 4,
    drink: 'required',
    extraDrinkDiscount: 0.5,
    requests: [
      { id: 'blanket', label: '담요' },
      { id: 'earphones', label: 'OTT 시청용 이어폰' },
    ],
    features: ['실내 반폐쇄형 1인 리클라이너', '사물함', '담요·이어폰 무료 요청', '추가 음료 50% 할인'],
    sameDayApp: false, // 앱 당일 예약 불가, 당일 이용은 매장 방문 (2026-10-16 결정)
    sameDayNote: '앱에서는 당일 예약할 수 없어요. 오늘 이용은 매장에 방문하면 빈 좌석을 배정해 드려요.',
    extendable: true,
    extension: '앱으로 사전 예약하면 현장에서 10분 단위로 최대 1시간 연장할 수 있습니다.',
  },
  suite: {
    id: 'suite',
    name: 'Flow Suite',
    label: '프라이빗',
    category: '나만의 독립 공간',
    headline: '방해 없이, 온전히 나의 시간.',
    image: 'flow-suite',
    reservable: true,
    unitName: '공간',
    pricePerHour: SEAT_PRICES.value.suite,
    minHours: 3,
    maxHours: 9,
    drink: 'included', // 기본 음료 포함, 예약 시 선택
    requests: [],
    features: ['문으로 분리된 독립형 오피스', '보관함·공기청정기·냉난방·4구 콘센트', '공간 번호로 음료 배달 주문'],
    sameDayApp: false, // 공간 준비가 필요해 사전 예약만 받는다, 당일 예약 불가 (2026-10-19 결정)
    sameDayNote: '공간을 미리 준비해야 해서 사전 예약만 받아요. 당일 예약은 할 수 없어요.',
    extendable: false,
    extension: '현장 예약과 연장은 할 수 없습니다.',
  },
};

// 음료 메뉴는 미확정. 메뉴 구성은 java-basic/DrinkMenu.java를 따르고,
// 가격은 2026-10-16 사용자 요청으로 시장 평균가에 맞춰 임의 설정한다.
// - 아메리카노·카페라떼: 한국소비자원 2024 커피전문점 25개 브랜드 평균(3,001원 · 3,978원)
// - 바닐라라떼: 카페라떼 평균에 시럽 추가분(약 500원)을 더한 값
// - 허브티: 공개된 평균 자료가 없어 카페라떼 평균 수준으로 둔다
export const MENU = p(
  [
    { id: 'americano', name: '아메리카노', price: 3000 },
    { id: 'latte', name: '카페라떼', price: 4000 },
    { id: 'vanilla-latte', name: '바닐라라떼', price: 4500 },
    { id: 'herb-tea', name: '허브티', price: 4000 },
  ],
  '음료 메뉴·가격 미확정 — 메뉴는 java-basic/DrinkMenu.java, 가격은 시장 평균으로 임의 설정',
);

// 매장: 2026-10-16 사용자 요청으로 임시 설정. 성수·연남 두 곳 모두 대형 카페로
// Cafe·Focus·Rest·Suite 네 가지 공간을 모두 운영한다. Suite 공간 수가 매장마다 다르다는 확정 정책과 맞는다.
export const STORES = p(
  [
    { id: 'seongsu', name: 'Aulo 성수', units: { focus: 24, rest: 18, suite: 16 } },
    { id: 'yeonnam', name: 'Aulo 연남', units: { focus: 30, rest: 20, suite: 12 } },
  ],
  '매장 임시 설정 — 성수·연남 대형 카페 2곳, 4가지 공간 모두 운영 (성수 Focus 24 · Rest 18 · Suite 16, 연남 Focus 30 · Rest 20 · Suite 12)',
);

// Suite 음료: 무료 리필 1회 → 정상가 주문 → 다음 주문 50% 할인 (확정)
// 리필 대상 메뉴와 이후 반복 방식은 미확정.
export const SUITE_ORDER_RULE = p(
  { refillTarget: 'base-drink', afterSequence: 'alternate' },
  'Suite 리필 대상·이후 반복 방식 미확정 — 임시로 예약 시 고른 기본 음료 1잔 리필, 이후 정상가와 50% 할인을 번갈아 적용',
);

export const CLOSING_NOTICES = [
  '22:30 앱 알림으로 마감을 안내합니다.',
  '22:45에도 이용 중이면 직원이 방문해 안내합니다.',
  '모든 좌석은 폐점 10분 전인 22:50까지 반드시 퇴실해야 합니다.',
];

export const CANCEL_POLICY = '예약 취소는 이용 전날 23:59까지 가능하며, 당일 취소는 불가합니다.';

// 지각·노쇼 (2026-10-19 결정)
// - 늦을 것 같으면 미리 연락하면 예약 시작 후 최대 1시간까지만 예약을 유지한다 (카카오톡 채널 연락은 추후 개발)
// - 연락 없이 30분이 지나도록 오지 않으면, 또는 연락했어도 1시간 이상 늦으면 예약을 강제 취소하고 1주일 예약 제한 페널티를 준다
// - 당일 취소 연락: 사유 없이 통보하면 페널티, 사유가 확인되면 매장 재량으로 페널티 없음 (2026-10-19 결정)
// - 페널티 유효기간은 1년(2026-10-19 확정), 유효한 페널티가 5회 이상 쌓이면 예약 서비스 영구 이용 불가
// - 빈번한 페널티: 3개월 연속(달력 기준 매달 1회 이상) 페널티를 받아도 영구 이용 불가 (2026-10-19 결정)
// 데모에는 매장 체크인·로그인이 없어 도착 여부를 알 수 없으므로 계산 로직과 안내만 둔다.
export const PENALTY = { lateLimitMinutes: 60, noNoticeLimitMinutes: 30, banDays: 7, validDays: 365, permanentAt: 5, frequentMonths: 3 };
export const LATE_POLICY = [
  '예약 시간보다 늦을 것 같으면 미리 매장에 연락해 주세요. 예약 시작 후 최대 1시간까지 예약을 유지해 드려요. (카카오톡 채널 연락은 준비 중)',
  '연락 없이 30분이 지나도록 오지 않거나, 연락했더라도 1시간 이상 늦으면 예약이 취소되고 1주일 동안 예약할 수 없어요.',
  '당일 취소를 통보할 때 사유가 없으면 같은 페널티가 적용돼요. 사유가 확인되면 매장 판단에 따라 페널티를 면제해요.',
  '페널티는 1년 동안 유효해요. 1년 안에 5회 이상 쌓이거나, 3개월 연속으로 매달 페널티를 받으면 예약 서비스를 영구적으로 이용할 수 없어요.',
];
export const PAYMENT_POLICY = '이용료는 방문 후 이용 시작 전에 매장에서 결제합니다. 앱에서 결제하지 않습니다.';
