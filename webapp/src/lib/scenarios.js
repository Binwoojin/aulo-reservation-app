// 데모 시나리오 (포트폴리오용): 홈의 상태 설계(처음 방문 · 예약 없음 · 다가오는 예약 · 이용 중)를
// 실제로 예약하고 기다리지 않아도 바로 볼 수 있게, 지금 시각(KST)을 기준으로 예약·주문 기록을 만든다.
import { HOURS } from '../config/policy.js';
import { drinkFee, reservationFee } from './reservation.js';
import { addDays, minutesOfDay, toDateString } from './time.js';

export const DEMO_EMAIL = 'demo@aulo.kr';
// 포트폴리오 공유용 데모 계정. 데모 로그인은 형식만 확인하므로 이 비밀번호를 따로 저장하거나 검사하지 않는다.
export const DEMO_PASSWORD = 'aulo1234';
// 데모 계정으로 처음 로그인할 때(기록이 없을 때) 채우는 예시 기록
export const DEMO_SEED_SCENARIO = 'returning';

const reservation = (o) => ({
  owner: DEMO_EMAIL, requests: [], createdAt: new Date().toISOString(), pointsUsed: 0,
  fee: reservationFee(o.type, o.hours), drinkFee: drinkFee(o.type, o.drinkId), ...o,
});
const cafeOrder = (o) => ({ owner: DEMO_EMAIL, kind: 'cafe', reservationId: null, benefit: 'normal', coupon: null, ...o });

// 이용 중 시나리오는 운영 시간 안(08:10~22:00 전)에서만 만들 수 있다
export const canBeInUse = (now) => {
  const m = minutesOfDay(now);
  return m >= HOURS.open + 10 && m < HOURS.lastEnd;
};
const inUseSlot = (now, hours) => {
  const m = minutesOfDay(now);
  // 1시간 전 정각에 시작해 hours시간 이용. 22:00 종료를 넘으면 시작을 앞당긴다
  const start = Math.max(HOURS.open, Math.min(Math.floor(m / 60) * 60 - 60, HOURS.lastEnd - hours * 60));
  return { start, hours };
};

export const SCENARIOS = [
  {
    id: 'first',
    title: '처음 방문',
    desc: '로그인 전, 기록 없음. 목적 칩과 시간대 음료 추천이 보여요.',
    build: () => ({ email: null, reservations: [], orders: [] }),
  },
  {
    id: 'returning',
    title: '예약 없이 다시 방문',
    desc: '지난 예약과 최근 주문이 있어요. 지난번처럼 다시 예약·다시 담기가 보여요.',
    build: (now, storeId) => {
      const today = toDateString(now);
      return {
        email: DEMO_EMAIL,
        reservations: [reservation({ id: 'demo-past', type: 'focus', storeId, date: addDays(today, -4), start: 600, hours: 3, unit: 7, drinkId: 'latte', drinkTemp: 'hot' })],
        orders: [cafeOrder({ id: 'demo-order', storeId, serve: 'takeout', items: { 'latte@hot+shot1': 1, 'lemon-ade': 1 }, total: 9000, createdAt: new Date(now.getTime() - 3 * 86_400_000).toISOString() })],
      };
    },
  },
  {
    id: 'upcoming',
    title: '다가오는 예약',
    desc: '모레 Suite 예약이 있어요. 며칠 남았는지와 취소 기한이 보여요.',
    build: (now, storeId) => {
      const today = toDateString(now);
      return {
        email: DEMO_EMAIL,
        reservations: [reservation({ id: 'demo-next', type: 'suite', storeId, date: addDays(today, 2), start: 780, hours: 3, unit: 2, drinkId: 'americano', drinkTemp: 'ice' })],
        orders: [],
      };
    },
  },
  {
    id: 'focus-now',
    title: 'Focus 좌석 이용 중',
    desc: '남은 시간, 50% 할인 쿠폰, 추가 주문이 홈 맨 위에 보여요.',
    needsOpenHours: true,
    build: (now, storeId) => {
      const { start, hours } = inUseSlot(now, 3);
      return {
        email: DEMO_EMAIL,
        reservations: [reservation({ id: 'demo-focus', type: 'focus', storeId, date: toDateString(now), start, hours, unit: 12, drinkId: 'americano', drinkTemp: 'hot' })],
        orders: [],
      };
    },
  },
  {
    id: 'suite-now',
    title: 'Suite 공간 이용 중',
    desc: '무료 리필과 공간 번호 배달 주문이 홈 맨 위에 보여요.',
    needsOpenHours: true,
    build: (now, storeId) => {
      const { start, hours } = inUseSlot(now, 3);
      return {
        email: DEMO_EMAIL,
        reservations: [reservation({ id: 'demo-suite', type: 'suite', storeId, date: toDateString(now), start, hours, unit: 3, drinkId: 'latte', drinkTemp: 'hot' })],
        orders: [],
      };
    },
  },
];
