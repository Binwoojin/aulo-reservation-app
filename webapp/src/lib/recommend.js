// 목적·시간·프라이버시 응답으로 공간을 추천한다 (규칙 기반).

export const QUESTIONS = [
  {
    id: 'purpose',
    title: '오늘은 어떤 시간을 보내실 건가요?',
    options: [
      { id: 'coffee', label: '커피·대화' },
      { id: 'work', label: '공부·작업' },
      { id: 'rest', label: '휴식' },
      { id: 'private', label: '통화·회의·단독 작업' },
    ],
  },
  {
    id: 'duration',
    title: '얼마나 머무를 예정인가요?',
    options: [
      { id: 'short', label: '1~2시간' },
      { id: 'mid', label: '3~4시간' },
      { id: 'long', label: '5시간 이상' },
    ],
  },
  {
    id: 'privacy',
    title: '어떤 환경이 편한가요?',
    options: [
      { id: 'open', label: '열린 공간도 괜찮아요' },
      { id: 'semi', label: '시선이 가려지면 좋아요' },
      { id: 'closed', label: '문이 닫히는 방이 필요해요' },
    ],
  },
];

export const recommend = ({ purpose, duration, privacy }) => {
  if (purpose === 'coffee') {
    return privacy === 'closed'
      ? { primary: 'suite', alternatives: ['cafe'], reason: '대화를 나누되 독립된 방이 필요하다면 Suite가 맞습니다. 가볍게 들르신다면 카페도 좋아요.' }
      : { primary: 'cafe', alternatives: ['focus'], reason: '예약 없이 음료를 주문하고 편하게 머무를 수 있어요.' };
  }
  if (purpose === 'rest') {
    return {
      primary: 'rest',
      alternatives: ['cafe'],
      reason: duration === 'long'
        ? '반폐쇄형 리클라이너에서 쉬어가세요. Rest는 최대 4시간까지 예약할 수 있어요.'
        : '반폐쇄형 리클라이너에서 담요와 이어폰을 무료로 요청할 수 있어요.',
    };
  }
  if (purpose === 'private' || privacy === 'closed') {
    return duration === 'short'
      ? { primary: 'suite', alternatives: ['focus'], reason: '문이 닫히는 독립 공간은 Suite입니다. Suite는 최소 3시간부터 예약할 수 있어 짧게 이용한다면 Focus도 살펴보세요.' }
      : { primary: 'suite', alternatives: ['focus'], reason: '문으로 분리된 독립 오피스에서 방해 없이 머무를 수 있어요.' };
  }
  // 공부·작업
  if (duration === 'long') {
    return { primary: 'suite', alternatives: ['focus'], reason: 'Focus는 최대 4시간이라 5시간 이상이라면 최대 9시간까지 가능한 Suite가 맞습니다.' };
  }
  return {
    primary: 'focus',
    alternatives: privacy === 'open' ? ['cafe'] : ['suite'],
    reason: '가림막이 있는 개인 좌석에서 집중할 수 있어요. 시간당 1,500원, 최대 4시간.',
  };
};
