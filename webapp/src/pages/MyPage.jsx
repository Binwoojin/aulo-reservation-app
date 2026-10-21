import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, isUpcoming } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import StorePicker from '../components/StorePicker.jsx';
import { NoticeDialog } from '../components/ui.jsx';
import { PENALTY, REWARD_POLICY } from '../config/policy.js';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { isInUse, penaltyStatus } from '../lib/reservation.js';
import { recentOrders } from '../lib/order.js';
import { couponWallet } from '../lib/coupons.js';
import { pointBalance, stampCount } from '../lib/rewards.js';
import { formatDate, toDateString } from '../lib/time.js';
import LoginPage from './LoginPage.jsx';
import { MyRow, MySection, SupportSection } from '../components/MySection.jsx';

// 하단 '마이' 탭 = 마이페이지. 비로그인이면 그 자리에 바로 로그인 화면을 보여 준다.
// 구성: 프로필 → 내 현황(스탬프·포인트·예약) → 나의 이용 → 예약 이용 상태 → 적립 기준 → 안내 · 고객 지원 → 계정 → 회원 탈퇴(작은 링크)
// 이용 안내·공지·고객 지원은 계정 위 '안내 · 고객 지원' 묶음 (필수 규칙 6, 2026-10-21 서랍 대신)
export default function MyPage() {
  const { user, logout, myReservations, myOrders, orders } = useAppData();
  const now = useNow();
  const [kakaoOpen, setKakaoOpen] = useState(false);
  if (!user) return <LoginPage inline />;

  const name = user.email.split('@')[0];
  const upcoming = myReservations.filter((r) => isUpcoming(r, now));
  const inUse = myReservations.some((r) => isInUse(r, now));
  const stamps = stampCount(myOrders, myReservations, now);
  const points = pointBalance(myReservations, now);
  const penalty = penaltyStatus([], now);
  const penaltyText = penalty.permanent ? '이용 불가' : penalty.blockedUntil ? `${formatDate(toDateString(penalty.blockedUntil))}까지 제한` : '제한 없음';

  return (
    <>
      <AppBar title="마이" />
      <div className="screen-body order-body">
        {/* 프로필 */}
        <section className="my-profile" aria-labelledby="my-name">
          <span className="my-profile__avatar" aria-hidden="true" lang="en">{name[0].toUpperCase()}</span>
          <div className="my-profile__who">
            <p className="shelf-script" lang="en">my aulo</p>
            <h2 id="my-name" className="my-profile__name">{name}님</h2>
            <p className="my-profile__email">{user.email}</p>
            <span className="my-profile__chip">이메일 로그인 · 데모 계정</span>
          </div>
        </section>

        {/* 내 현황: 숫자 세 개 */}
        <section className="my-summary" aria-label="내 현황">
          <div className="my-summary__cell">
            <span className="my-summary__num" lang="en">{stamps}</span>
            <span className="my-summary__label">스탬프</span>
          </div>
          <div className="my-summary__cell">
            <span className="my-summary__num" lang="en">{points.toLocaleString('ko-KR')}</span>
            <span className="my-summary__label">포인트</span>
          </div>
          <Link to="/my/reservations" className="my-summary__cell">
            <span className="my-summary__num" lang="en">{upcoming.length}</span>
            <span className="my-summary__label">{inUse ? '예약 · 이용 중' : '다가오는 예약'}</span>
          </Link>
        </section>
        {points > 0 && <p className="my-summary__note">포인트는 다음 좌석 예약 결제 때 1P = 1원으로 쓸 수 있어요.</p>}

        <MySection title="나의 이용">
          <MyRow to="/my/reservations" icon="calendar" label="내 예약" value={`다가오는 ${upcoming.length}건`} />
          <MyRow to="/my/coupons" icon="percent" label="내 쿠폰" value={`${couponWallet(myReservations, orders, now).usableCount}장`} />
          <MyRow to="/my/orders" icon="receipt" label="주문 내역" value={`최근 1개월 ${recentOrders(myOrders, now).length}건`} />
          <li className="my-row">
            <Icon name="pin" /><span className="my-row__label">지금 매장</span>
            <StorePicker variant="inline" />
          </li>
        </MySection>

        <MySection title="예약 이용 상태">
          <li className="my-row my-row--status" data-ok={penalty.canReserve || undefined}>
            <Icon name={penalty.canReserve ? 'check' : 'alert'} />
            <span className="my-row__label">예약 제한</span>
            <span className="my-row__value">{penaltyText}</span>
          </li>
          <li className="my-row">
            <Icon name="info" />
            <span className="my-row__label">유효 페널티</span>
            <span className="my-row__value">{penalty.activeCount}회</span>
          </li>
          <li className="my-row__hint">1년 안에 {PENALTY.permanentAt}회 이상이거나 3개월 연속이면 예약 서비스를 영구적으로 이용할 수 없어요. 데모에는 매장 체크인이 없어 페널티가 실제로 쌓이지 않아요.</li>
        </MySection>

        <details className="rules my-rules">
          <summary className="rules__summary">스탬프·포인트 적립 기준<Icon name="down" size={18} /></summary>
          <ul className="note-list">{REWARD_POLICY.map((n) => <li key={n}>{n}</li>)}</ul>
        </details>

        <SupportSection />

        <MySection title="계정">
          <li className="my-row">
            <Icon name="user" /><span className="my-row__label">로그인 방식</span><span className="my-row__value">이메일</span>
          </li>
          <li>
            <button type="button" className="my-row my-row--button" onClick={() => setKakaoOpen(true)}>
              <Icon name="chat" /><span className="my-row__label">카카오 계정 연결</span><span className="my-row__value">준비 중</span><Icon name="chevron" size={18} />
            </button>
          </li>
          <li>
            <button type="button" className="my-row my-row--button my-row--logout" onClick={logout}>
              <Icon name="door" /><span className="my-row__label">로그아웃</span>
            </button>
          </li>
        </MySection>
        {/* 탈퇴는 실수로 누르지 않게 계정 목록 밖, 맨 아래에 작게 둔다 */}
        <Link to="/my/withdraw" className="my-withdraw">회원 탈퇴</Link>
      </div>
      <NoticeDialog open={kakaoOpen} title="서비스 준비 중" onClose={() => setKakaoOpen(false)}>
        카카오 계정 연결은 준비 중이에요. 지금은 이메일로 로그인해 이용할 수 있어요.
      </NoticeDialog>
    </>
  );
}
