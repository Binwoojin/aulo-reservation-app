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
  open: h(8), // 08:00 오픈 (2026-10-19 확정, 포트폴리오용 시간)
  close: h(23), // 데모 마감 23:00 (확정)
  checkout: h(22, 50), // 모든 좌석 22:50 퇴실 = 폐점 10분 전 (Suite 확정, Focus·Rest 2026-10-16 결정)
  lastEnd: h(22), // 마지막 슬롯은 22:00 종료 (1시간 단위와 22:50 퇴실을 맞춤, 2026-10-16 확정)
};

// 휴무일: 공휴일만 휴무, 대체공휴일 포함 (2026-10-19 확정). 노동절(5/1)은 공휴일이 아니므로 영업.
// 날짜 데이터는 우주항공청 월력요항·인사혁신처 고시로 최종 확인 필요 (2027년 제헌절 대체공휴일 7/19 포함)
export const HOLIDAYS = [
  '2026-12-25',
  '2027-01-01', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', '2027-03-01',
  '2027-05-05', '2027-05-13', '2027-06-06', '2027-07-17', '2027-07-19', '2027-08-15', '2027-08-16',
  '2027-09-14', '2027-09-15', '2027-09-16', '2027-10-03', '2027-10-04', '2027-10-09', '2027-10-11',
  '2027-12-25', '2027-12-27',
];

export const BOOKING_WINDOW_DAYS = 14; // 오늘+14일까지 예약 가능 (2026-10-19 확정, 당일 예약은 불가라 내일부터)

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
    drink: 'required', // 이용 전 음료는 예약할 때 선택, 방문 후 정상가로 결제 (2026-10-19 확정)
    extraDrinkDiscount: 0.5,
    requests: [],
    features: ['가림막이 있는 반폐쇄형 개인 좌석', '좌석별 사물함', '추가 음료 50% 할인 (최대 2회)'],
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
      { id: 'blanket', label: '담요 1개' }, // 요청한 사용자에게 좌석당 1개 (2026-10-19 확정)
    ],
    // OTT 시청용 헤드셋은 요청 없이 모든 Rest 좌석에 기본 제공 (2026-10-19 확정)
    features: ['실내 반폐쇄형 1인 리클라이너', 'OTT 시청용 헤드셋 기본 제공', '사물함', '담요 무료 요청 (좌석당 1개)', '추가 음료 50% 할인 (최대 2회)'],
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
    features: ['문으로 분리된 독립형 오피스', '보관함·공기청정기·냉난방·4구 콘센트', '공간 번호로 음료 배달 주문', '아메리카노·카페라떼 무료 리필 1회, 이후 50% 할인 최대 2회'],
    sameDayApp: false, // 공간 준비가 필요해 사전 예약만 받는다, 당일 예약 불가 (2026-10-19 결정)
    sameDayNote: '공간을 미리 준비해야 해서 사전 예약만 받아요. 당일 예약은 할 수 없어요.',
    extendable: false,
    extension: '현장 예약과 연장은 할 수 없습니다.',
  },
};

// 음료 메뉴: 기본 카페 메뉴로만 구성 (2026-10-19 확정, 포트폴리오 작업량을 고려해 최소한으로).
// 카테고리는 커피 · 논커피 · 에이드·티 (2026-10-19 사용자 요청). 가격은 모두 임의 설정(임시)이다.
// - 아메리카노·카페라떼: 한국소비자원 2024 커피전문점 25개 브랜드 평균(3,001원 · 3,978원)
// - 그 밖의 메뉴: 공개된 평균 자료를 찾지 못해 두 기준값에 맞춰 정했다
//   (시럽·소스 음료 +500원, 과일 라떼 +1,000원, 에이드 4,500원, 차 4,000원)
export const MENU_CATEGORIES = [
  { id: 'coffee', label: '커피' },
  { id: 'non-coffee', label: '논커피' },
  { id: 'ade-tea', label: '에이드 · 티' },
];
export const MENU = p(
  [
    { id: 'americano', category: 'coffee', name: '아메리카노', price: 3000, desc: '에스프레소에 물을 더해 깔끔하게 즐기는 기본 커피예요.' },
    { id: 'latte', category: 'coffee', name: '카페라떼', price: 4000, desc: '에스프레소와 데운 우유를 섞은 부드러운 커피예요.' },
    { id: 'cappuccino', category: 'coffee', name: '카푸치노', price: 4000, desc: '에스프레소 위에 우유 거품을 두툼하게 올린 커피예요.' },
    { id: 'vanilla-latte', category: 'coffee', name: '바닐라라떼', price: 4500, desc: '카페라떼에 바닐라 시럽을 더해 달콤하게 만든 커피예요.' },
    { id: 'caramel-macchiato', category: 'coffee', name: '카라멜 마끼야또', price: 4500, desc: '우유와 에스프레소 위에 카라멜 소스를 올린 달콤한 커피예요.' },
    { id: 'hot-chocolate', category: 'non-coffee', name: '핫초코', price: 4000, desc: '초콜릿과 데운 우유로 만든 커피 없는 음료예요.' },
    { id: 'matcha-latte', category: 'non-coffee', name: '말차라떼', price: 4500, desc: '말차 가루와 우유를 섞은 쌉싸름하고 고소한 라떼예요.' },
    { id: 'strawberry-latte', category: 'non-coffee', name: '딸기라떼', price: 5000, desc: '딸기 청과 우유를 섞은 새콤달콤한 라떼예요.' },
    { id: 'lemon-ade', category: 'ade-tea', name: '레몬에이드', price: 4500, desc: '레몬 청에 탄산수를 더한 상큼한 에이드예요.' },
    { id: 'grapefruit-ade', category: 'ade-tea', name: '자몽에이드', price: 4500, desc: '자몽 청에 탄산수를 더한 쌉싸름하고 상큼한 에이드예요.' },
    { id: 'yuja-tea', category: 'ade-tea', name: '유자차', price: 4000, desc: '유자 청을 따뜻한 물에 풀어 마시는 차예요.' },
    { id: 'earl-grey', category: 'ade-tea', name: '얼그레이 티', price: 4000, desc: '베르가못 향을 입힌 홍차예요.' },
    { id: 'herb-tea', category: 'ade-tea', name: '허브티', price: 4000, desc: '카페인 없이 편하게 마실 수 있는 허브 차예요.' },
  ],
  '음료 가격은 임의 설정(임시) — 아메리카노·카페라떼는 한국소비자원 평균 기준, 나머지는 이 기준에 맞춘 추정값',
);

// 음료 옵션 (2026-10-19): 상세의 '주문하기' 옵션 창에서 고른다
// - 샷 추가: 커피만, 최대 2회. 가격 미정 → 임시로 1회 500원
// - 개인컵: 모든 음료. 할인 기준 미정 → 지금은 할인 없음
export const SHOT_PRICE = p(500, '샷 추가 가격 미정 — 임시로 1회 500원');
export const MAX_SHOTS = 2;
export const OWN_CUP_DISCOUNT = p(0, '개인컵 할인 기준 미정 — 지금은 할인 없이 개인컵에 담아 드림');

// 홈 '베스트': 주문 데이터가 쌓이기 전에는 운영자가 고른 대표 메뉴 (2026-10-19 확정). 순위·판매량 숫자는 표시하지 않는다.
export const BEST_MENU = ['americano', 'latte', 'caramel-macchiato', 'hot-chocolate'];

// 매장: 2026-10-16 사용자 요청으로 임시 설정. 성수·연남 두 곳 모두 대형 카페로
// Cafe·Focus·Rest·Suite 네 가지 공간을 모두 운영한다. Suite 공간 수가 매장마다 다르다는 확정 정책과 맞는다.
export const STORES = p(
  [
    { id: 'seongsu', name: 'Aulo 성수', units: { focus: 24, rest: 18, suite: 16 } },
    { id: 'yeonnam', name: 'Aulo 연남', units: { focus: 30, rest: 20, suite: 12 } },
  ],
  '매장 임시 설정 — 성수·연남 대형 카페 2곳, 4가지 공간 모두 운영 (성수 Focus 24 · Rest 18 · Suite 16, 연남 Focus 30 · Rest 20 · Suite 12)',
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
// 적립 (2026-10-19 확정)
// - 스탬프: 음료 1잔당 1개 (앱 주문 + 예약에 포함된 이용 전·기본 음료)
// - 포인트: 좌석 이용 시 결제한 좌석 이용료의 10% (1P = 1원). 좌석 이용료 결제에만 쓸 수 있고 음료 주문에는 못 쓴다.
// - 예약 음료 스탬프와 포인트는 이용을 시작한 예약(방문 후 결제)에만 적립한다.
export const REWARDS = { stampsPerDrink: 1, pointRate: 0.1 };
export const REWARD_POLICY = [
  '음료 1잔당 스탬프 1개를 적립해요.',
  '좌석 이용료 결제 금액의 10%를 포인트로 적립해요. 이용을 시작하면 적립돼요.',
  '포인트는 좌석 이용료 결제에만 쓸 수 있어요(1P = 1원). 음료 주문에는 쓸 수 없어요.',
];

// 결제 (2026-10-19 확정): 표시 가격은 부가세 포함. 결제 수단은 카드결제·카드 간편결제·간편 계좌결제
export const PAYMENT_METHODS = ['카드결제', '카드 간편결제', '간편 계좌결제'];
export const PAYMENT_POLICY = `이용료는 방문 후 이용 시작 전에 매장에서 결제합니다(${PAYMENT_METHODS.join(' · ')}). 표시 가격은 모두 부가세 포함입니다.`;
