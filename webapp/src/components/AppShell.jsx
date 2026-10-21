import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useScrollReveal } from '../lib/useScrollReveal.js';

// 주 메뉴: 하단 탭바 (최상위 화면에서만 표시)
export const TABS = [
  { to: '/', icon: 'home', label: '홈', end: true },
  { to: '/recommend', icon: 'compass', label: '추천' },
  // 주문을 가운데에 두고 강조한다 (2026-10-19 사용자 요청)
  { to: '/order', icon: 'cup', label: '주문', primary: true },
  { to: '/reserve', icon: 'calendar', label: '예약' },
  // 마이 아래 화면(내 예약·주문 내역·내 쿠폰)에서도 마이 탭이 켜진다
  { to: '/my', icon: 'user', label: '마이' },
];
const TAB_PATHS = TABS.map((t) => t.to);
// 탭바를 함께 보여 주는 하위 화면 (2026-10-21): 아래쪽에 자기 버튼 바가 없는 둘러보기 화면.
// 예약 단계·음료 상세·장바구니·주문 현황·로그인·회원가입·도우미처럼 하단 버튼이 있거나 진행 중인 흐름은 숨긴다.
const TAB_SUBPAGES = [/^\/my\/(reservations|orders|coupons)$/, /^\/info$/, /^\/notice(\/[^/]+)?$/, /^\/demo$/];
// 마이 탭이 켜지는 화면: 마이 아래 화면과 마이 '안내 · 고객 지원'에서 들어가는 공지·이용 안내
const MY_AREA = /^\/(my|notice|info)(\/|$)/;

export { isUpcoming } from '../lib/status.js';

// 앱 셸: 화면마다 AppBar를 직접 둔다. 햄버거 서랍은 2026-10-21에 없앴다(공지·이용 안내·도우미는 마이 '안내 · 고객 지원').
export default function AppShell() {
  const { pathname, search } = useLocation();
  const mainRef = useRef(null);
  useScrollReveal(pathname + search);
  const showTabs = TAB_PATHS.includes(pathname) || TAB_SUBPAGES.some((re) => re.test(pathname));

  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <>
      <div id="main" ref={mainRef} tabIndex={-1} className="screen" data-tabs={showTabs || undefined}>
        <Outlet />
      </div>
      {showTabs && <TabBar />}
    </>
  );
}

export function AppBar({ title, back, transparent = false, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  // 앱 안에서 이동해 온 기록이 없으면(첫 화면) 홈으로 간다
  const onBack = typeof back === 'function' ? back : () => (location.key === 'default' ? navigate('/') : navigate(-1));
  return (
    <header className="app-bar" data-transparent={transparent || undefined}>
      <div className="app-bar__side">
        {back ? (
          <button type="button" className="icon-button" onClick={onBack} aria-label="뒤로 가기">
            <Icon name="back" />
          </button>
        ) : !title ? (
          <Link to="/" className="app-bar__brand" aria-label="Aulo 홈">aulo</Link>
        ) : null}
      </div>
      {/* 제목이 없어도 가운데 칸을 유지해야 오른쪽 버튼(장바구니 등)이 끝에 고정된다 */}
      {title ? <h1 className="app-bar__title">{title}</h1> : <span aria-hidden="true" />}
      <div className="app-bar__side app-bar__side--end">
        {children}
      </div>
    </header>
  );
}

// 하단 고정 액션 바 (엄지 영역)
export function BottomBar({ children, note }) {
  return (
    <div className="bottom-bar">
      {note && <div className="bottom-bar__note">{note}</div>}
      <div className="bottom-bar__inner">{children}</div>
    </div>
  );
}

function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="tab-bar" aria-label="주요 메뉴">
      <ul>
        {TABS.map((t) => (
          <li key={t.to}>
            <NavLink to={t.to} end={t.end} className={({ isActive }) => `${t.primary ? 'tab tab--primary' : 'tab'}${isActive || (t.to === '/my' && MY_AREA.test(pathname)) ? ' active' : ''}`}>
              {t.primary ? (
                // 가운데 주문: 아이콘과 글자를 한 원 안에 담는다
                <span className="tab__bubble"><Icon name={t.icon} /><span>{t.label}</span></span>
              ) : (
                <><Icon name={t.icon} /><span>{t.label}</span></>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
