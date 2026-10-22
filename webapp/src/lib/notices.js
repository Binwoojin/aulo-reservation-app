// 공지사항: 확정된 운영 정책에서 나온 소식만 싣는다 (이벤트·혜택 공지는 지어내지 않는다).
// date는 그 정책을 정한 날, pinned는 목록 맨 위 '중요' 고정.
export const NOTICES = [
  {
    id: 'holiday',
    category: '휴무',
    pinned: true,
    date: '2026-10-20',
    title: '공휴일 휴무 안내',
    body: [
      '모든 매장은 공휴일(대체공휴일 포함)에 쉬어요.',
      '노동절은 공휴일이 아니어서 정상 운영해요.',
      '휴무일에는 앱에서 예약할 수 없어요. 다가오는 휴무일은 아래에서 확인해 주세요.',
    ],
    extra: 'holidays',
  },
  {
    id: 'closing',
    category: '운영',
    date: '2026-10-19',
    title: '운영 시간과 마감 안내',
    body: [
      '매일 08:00에 열고 23:00에 닫아요.',
      '마지막 예약은 22:00에 끝나고, 모든 좌석은 폐점 10분 전인 22:50까지 퇴실해야 해요.',
    ],
    extra: 'closing',
  },
  {
    id: 'late-contact',
    category: '서비스',
    date: '2026-10-19',
    title: '카카오톡 채널 지각 연락은 준비 중이에요',
    body: [
      '예약 정보와 함께 카카오톡 채널로 지각을 알리는 기능을 준비하고 있어요.',
      '지금은 매장에 직접 연락해 주세요. 미리 연락하면 예약 시작 후 최대 1시간까지 예약을 유지해 드려요.',
      '연락 없이 30분이 지나면 예약이 취소되고 1주일 동안 예약할 수 없어요.',
    ],
  },
  {
    id: 'demo',
    category: '안내',
    date: '2026-10-20',
    title: 'Aulo 데모 버전 안내',
    body: [
      '가상 브랜드 Aulo의 포트폴리오 데모예요.',
      '실제 예약·결제·주문은 이루어지지 않고, 기록은 이 기기에만 저장돼요.',
    ],
  },
];

// 목록 순서: 중요 고정 → 최신순
export const sortedNotices = () =>
  [...NOTICES].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.date.localeCompare(a.date));
export const getNotice = (id) => NOTICES.find((n) => n.id === id);
