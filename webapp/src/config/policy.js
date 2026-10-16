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
  suiteCheckout: h(22, 50), // Suite 22:50 퇴실 (확정)
  suiteLastEnd: p(h(22), 'Suite 마지막 종료 슬롯 미확정 — 1시간 단위와 22:50 퇴실을 맞추기 위해 임시로 22:00 종료까지만 예약'),
  focusRestLastEnd: p(h(23), 'Focus·Rest 마지막 종료 시각 미확정 — 임시로 마감 23:00까지 예약'),
  suiteNewBookingCutoffHours: 3, // 마감까지 3시간 이하면 Suite 신규 예약 제한 (확정)
};

export const BOOKING_WINDOW_DAYS = p(14, '예약 가능 기간 미확정 — 임시로 오늘부터 14일 후까지');

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

// 매장과 좌석·공간 수는 미확정. Suite 공간 수는 매장마다 다르다는 확정 정책만 반영한다.
export const STORES = p(
  [
    { id: 'seongsu', name: 'Aulo 성수', units: { focus: 8, rest: 4, suite: 3 } },
    { id: 'yeonnam', name: 'Aulo 연남', units: { focus: 6, rest: 3, suite: 2 } },
  ],
  '매장 목록과 좌석·공간 수 미확정 — 데모 매장 2곳 임시 구성',
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
  'Suite는 22:50까지 정리 후 퇴실해야 합니다.',
];

export const CANCEL_POLICY = '예약 취소는 이용 예정일 전날까지 가능하며, 당일 취소는 불가합니다.';
export const PAYMENT_POLICY = '이용료는 방문 후 이용 시작 전에 매장에서 결제합니다. 앱에서 결제하지 않습니다.';
