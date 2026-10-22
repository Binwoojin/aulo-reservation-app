// 주문 진행 상태 (필수 규칙 3): 주문 접수 → 주문 수락 → 제조 중 → 제조 완료 → 수령 완료
// 매장 연동이 없는 데모라 매장이 상태를 바꾸는 대신 주문 후 지난 시간으로 단계를 진행한다(DEMO_FLOW).
// 수령 완료는 사용자가 '음료를 받았어요'를 눌러 확정한다(pickedAt). 수령이 끝난 주문은 상세를 볼 수 없다.

export const ORDER_STAGES = [
  { id: 'received', label: '주문 접수' },
  { id: 'accepted', label: '주문 수락' },
  { id: 'making', label: '제조 중' },
  { id: 'ready', label: '제조 완료' },
  { id: 'picked', label: '수령 완료' },
];

// 데모 진행 시간(초): 수락 10초 → 제조 시작 20초 → 잔당 20초(최대 2분) 뒤 제조 완료.
// 오래된 데모 주문이 계속 진행 중으로 남지 않도록 3시간이 지나면 수령 완료로 본다.
export const DEMO_FLOW = { acceptSec: 10, makeSec: 20, perCupSec: 20, maxMakeSec: 120, autoPickHours: 3 };

const cupsOf = (order) => Object.values(order.items ?? {}).reduce((a, b) => a + b, 0);

// 단계마다 도달하는 시각(ms)
export const stageTimes = (order) => {
  const t0 = new Date(order.createdAt).getTime();
  const make = t0 + DEMO_FLOW.makeSec * 1000;
  return {
    received: t0,
    accepted: t0 + DEMO_FLOW.acceptSec * 1000,
    making: make,
    ready: make + Math.min(DEMO_FLOW.maxMakeSec, Math.max(1, cupsOf(order)) * DEMO_FLOW.perCupSec) * 1000,
    picked: order.pickedAt ? new Date(order.pickedAt).getTime() : null,
  };
};

export const orderStage = (order, now) => {
  if (order.pickedAt) return 'picked';
  const t = now.getTime();
  const times = stageTimes(order);
  if (t - times.received >= DEMO_FLOW.autoPickHours * 3_600_000) return 'picked';
  if (t >= times.ready) return 'ready';
  if (t >= times.making) return 'making';
  if (t >= times.accepted) return 'accepted';
  return 'received';
};
export const stageIndex = (stage) => ORDER_STAGES.findIndex((s) => s.id === stage);
export const isActiveOrder = (order, now) => orderStage(order, now) !== 'picked';

// 진행 중인 주문 중 가장 최근 것 (홈 표시용)
export const latestActiveOrder = (orders, now) =>
  [...orders].filter((o) => isActiveOrder(o, now)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

// 단계별 안내 문구. 받는 곳은 주문 종류에 따라 다르다 (카페: 카운터 / 추가 주문: 좌석 / Suite: 공간으로 배달)
export const STAGE_TITLE = {
  received: '주문을 확인하고 있어요',
  accepted: '주문을 수락했어요',
  making: '음료를 만들고 있어요',
  ready: '음료가 준비됐어요',
  picked: '수령이 끝난 주문이에요',
};
export const readyMessage = (order, reservationLabel) => {
  if (order.kind === 'suite') return `${reservationLabel ?? 'Suite'}로 곧 배달해 드려요.`;
  if (order.kind === 'extra') return `${reservationLabel ? `${reservationLabel} 좌석에서 ` : ''}받아 가세요.`;
  return '카운터에서 주문 번호를 확인하고 받아 가세요.';
};
