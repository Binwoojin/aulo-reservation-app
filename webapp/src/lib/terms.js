// 약관 상세 (데모용 예시 문안): 확정한 이용 정책(policy.js)에서 바로 만들어, 정책이 바뀌면 약관 문구도 함께 바뀐다.
// 실제 서비스 전에는 법률 검토가 필요하다. 정책에 없는 내용(보관 기간 숫자, 손해배상 금액 등)은 지어내지 않는다.
import {
  BOOKING_WINDOW_DAYS, CANCEL_POLICY, EXTENSION, HOURS, PAYMENT_METHODS, PENALTY, REWARDS, SPACES,
} from '../config/policy.js';
import { formatTime } from './time.js';

export const TERMS_NOTE = '데모용 예시 문안이에요. 실제 서비스 전에는 법률 검토를 거쳐 확정해야 해요.';

const space = (t) => `${SPACES[t].name}(${SPACES[t].label})`;

export const SERVICE_TERMS = {
  id: 'service',
  label: '서비스 이용약관',
  sections: [
    { title: '제1조 목적', body: ['이 약관은 Aulo(이하 "회사")가 제공하는 공간 추천·좌석 예약·음료 주문 서비스(이하 "서비스")를 이용하는 조건과 절차, 회사와 회원의 권리·의무를 정합니다.'] },
    {
      title: '제2조 용어',
      body: [
        '"회원"은 이 약관에 동의하고 이메일과 비밀번호로 가입한 사람을 말합니다.',
        `"공간"은 매장 안의 ${space('cafe')}, ${space('focus')}, ${space('rest')}, ${space('suite')}를 말합니다. ${SPACES.cafe.name}는 예약 없이 음료 주문 후 이용합니다.`,
        '"예약"은 회원이 앱에서 날짜·시간·좌석(공간)을 정해 이용을 신청하는 것을 말합니다.',
      ],
    },
    { title: '제3조 회원가입과 계정', body: ['회원가입은 이메일 아이디와 비밀번호로 합니다. 한 이메일로는 하나의 계정만 만들 수 있습니다.', '회원은 계정 정보를 직접 관리해야 하며, 다른 사람에게 계정을 넘기거나 빌려줄 수 없습니다.'] },
    {
      title: '제4조 예약과 이용',
      body: [
        `앱 예약은 이용일 전날까지, 오늘로부터 ${BOOKING_WINDOW_DAYS}일 안에서 할 수 있습니다. 당일 이용은 매장을 방문하면 빈 좌석을 배정해 드리며, ${SPACES.suite.name}는 사전 예약으로만 이용할 수 있습니다.`,
        '회원 한 명은 같은 날 한 개의 좌석(공간)만 예약할 수 있습니다.',
        `매장은 매일 ${formatTime(HOURS.open)}부터 ${formatTime(HOURS.close)}까지 운영하며, 모든 좌석은 ${formatTime(HOURS.checkout)}까지 퇴실해야 합니다. 공휴일(대체공휴일 포함)은 휴무입니다.`,
      ],
    },
    { title: '제5조 결제', body: [`이용료와 음료 대금은 방문 후 이용 시작 전에 매장에서 결제합니다(${PAYMENT_METHODS.join(' · ')}). 표시 가격은 모두 부가세 포함입니다.`] },
    { title: '제6조 예약 취소', body: [CANCEL_POLICY.replace('가능하며, 당일 취소는 불가합니다.', '앱에서 할 수 있으며, 이용 당일에는 앱에서 취소할 수 없습니다.')] },
    {
      title: '제7조 지각·노쇼와 이용 제한',
      body: [
        `예약 시간보다 늦을 경우 미리 연락하면 예약 시작 후 최대 ${PENALTY.lateLimitMinutes / 60}시간까지 예약을 유지합니다.`,
        `연락 없이 ${PENALTY.noNoticeLimitMinutes}분이 지나도록 오지 않거나, 연락했더라도 ${PENALTY.lateLimitMinutes / 60}시간 이상 늦으면 예약이 취소되고 ${PENALTY.banDays}일 동안 예약할 수 없습니다. 사유 없이 당일 취소를 통보한 경우도 같습니다(사유가 확인되면 매장 판단에 따라 면제).`,
        `이용 제한(페널티)은 1년 동안 유효하며, 1년 안에 ${PENALTY.permanentAt}회 이상 쌓이거나 ${PENALTY.frequentMonths}개월 연속으로 매달 받으면 예약 서비스를 영구적으로 이용할 수 없습니다.`,
      ],
    },
    { title: '제8조 이용 연장', body: [`${SPACES.focus.name}·${SPACES.rest.name}는 현장에서 ${EXTENSION.unitMinutes}분 단위로 최대 ${EXTENSION.maxMinutes / 60}시간까지 연장할 수 있습니다. 폐점 ${EXTENSION.cutoffBeforeCloseMinutes / 60}시간 전까지만 가능하며, 다음 예약과 겹치거나 최대 시간으로 예약한 경우에는 연장할 수 없습니다. ${SPACES.suite.name}는 연장하지 않습니다.`] },
    { title: '제9조 스탬프와 포인트', body: [`음료 1잔당 스탬프 ${REWARDS.stampsPerDrink}개, 좌석 이용료 결제 금액의 ${REWARDS.pointRate * 100}%를 포인트로 적립합니다. 포인트는 좌석 이용료 결제에만 쓸 수 있고(1P = 1원), 음료 주문에는 쓸 수 없습니다.`] },
    { title: '제10조 회원 탈퇴', body: ['회원은 언제든 탈퇴를 요청할 수 있습니다. 탈퇴하면 남은 스탬프와 포인트는 모두 소멸하며, 다시 가입해도 되살릴 수 없습니다.', '탈퇴할 때 남아 있는 이용 예정 예약은 자동으로 취소됩니다. 좌석을 이용 중일 때는 이용이 끝난 뒤에 탈퇴할 수 있습니다.'] },
  ],
};

export const PRIVACY_TERMS = {
  id: 'privacy',
  label: '개인정보 수집·이용',
  table: [
    { head: '수집 항목', cells: ['이메일 주소, 비밀번호', '예약 기록(매장·공간·날짜·시간·좌석·이용 전 음료), 음료 주문 기록, 스탬프·포인트 내역'] },
    { head: '수집·이용 목적', cells: ['회원 식별과 로그인, 비밀번호 재설정', '좌석 예약·음료 주문 처리, 지각·노쇼 이용 제한 관리, 스탬프·포인트 적립과 사용'] },
    { head: '보유 기간', cells: ['회원 탈퇴 시까지', '관계 법령에 따라 보관해야 하는 정보는 그 법령이 정한 기간 동안 보관'] },
  ],
  sections: [
    { title: '동의를 거부할 권리', body: ['개인정보 수집·이용에 동의하지 않을 수 있습니다. 다만 이 항목은 서비스 제공에 꼭 필요하여, 동의하지 않으면 회원가입과 예약·주문을 이용할 수 없습니다.'] },
    { title: '비밀번호 보관', body: ['비밀번호는 암호화하여 보관하며, 회사도 원래 비밀번호를 알 수 없습니다. (데모 버전에서는 비밀번호를 저장하지 않습니다.)'] },
  ],
};

export const TERMS = [SERVICE_TERMS, PRIVACY_TERMS];
