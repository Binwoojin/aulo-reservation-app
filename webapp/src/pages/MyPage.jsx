import { Link } from 'react-router-dom';
import { AppBar, isUpcoming } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import LoginPage from './LoginPage.jsx';

// 하단 '마이' 탭: 비로그인이면 그 자리에 바로 로그인 화면을 보여 준다
export default function MyPage() {
  const { user, logout, myReservations, myOrders } = useAppData();
  const now = useNow();
  if (!user) return <LoginPage inline />;

  const upcoming = myReservations.filter((r) => isUpcoming(r, now)).length;

  return (
    <>
      <AppBar title="마이" />
      <div className="screen-body">
        <div className="my-head">
          <span className="avatar" aria-hidden="true"><Icon name="user" /></span>
          <div>
            <strong>{user.email}</strong>
            <span>이메일 로그인 · 데모 계정</span>
          </div>
        </div>

        <ul className="menu-list list-card" aria-label="마이 메뉴">
          <li>
            <Link to="/my/reservations" className="menu-row">
              <Icon name="calendar" /><span>내 예약</span><small className="muted-inline">다가오는 {upcoming}건</small><Icon name="chevron" size={18} className="menu-row__chev" />
            </Link>
          </li>
          <li>
            <Link to="/my/orders" className="menu-row">
              <Icon name="receipt" /><span>주문 내역</span><small className="muted-inline">{myOrders.length}건</small><Icon name="chevron" size={18} className="menu-row__chev" />
            </Link>
          </li>
        </ul>

        <p className="group-hint">스탬프·포인트 적립 기준은 준비 중이에요.</p>
        <button type="button" className="button button--secondary button--block" onClick={logout}>로그아웃</button>
      </div>
    </>
  );
}
