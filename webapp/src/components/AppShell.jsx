import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { reservationEnd } from '../lib/reservation.js';
import { minutesOfDay, toDateString } from '../lib/time.js';

const MenuContext = createContext(() => {});

// 주 메뉴: 하단 탭바 (최상위 화면에서만 표시)
export const TABS = [
  { to: '/', icon: 'home', label: '홈', end: true },
  { to: '/recommend', icon: 'compass', label: '추천' },
  // 주문을 가운데에 두고 강조한다 (2026-10-19 사용자 요청)
  { to: '/order', icon: 'cup', label: '주문', primary: true },
  { to: '/reserve', icon: 'calendar', label: '예약' },
  { to: '/my', icon: 'user', label: '마이', end: true },
];
const TAB_PATHS = TABS.map((t) => t.to);

export function isUpcoming(r, now) {
  const today = toDateString(now);
  return r.date > today || (r.date === today && reservationEnd(r) > minutesOfDay(now));
}

// 앱 셸: 화면마다 AppBar를 직접 두고, 햄버거 메뉴(마이 페이지)는 셸이 관리한다.
export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const showTabs = TAB_PATHS.includes(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <MenuContext.Provider value={useCallback(() => setMenuOpen(true), [])}>
      <div id="main" ref={mainRef} tabIndex={-1} className="screen" data-tabs={showTabs || undefined}>
        <Outlet />
      </div>
      {showTabs && <TabBar />}
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </MenuContext.Provider>
  );
}

export function AppBar({ title, back, transparent = false, children }) {
  const openMenu = useContext(MenuContext);
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
      {/* 제목이 없어도 가운데 칸을 유지해야 메뉴 버튼이 오른쪽 끝에 고정된다 */}
      {title ? <h1 className="app-bar__title">{title}</h1> : <span aria-hidden="true" />}
      <div className="app-bar__side app-bar__side--end">
        {children}
        <button type="button" className="icon-button" onClick={openMenu} aria-label="메뉴 열기" aria-haspopup="dialog">
          <Icon name="menu" />
        </button>
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
  return (
    <nav className="tab-bar" aria-label="주요 메뉴">
      <ul>
        {TABS.map((t) => (
          <li key={t.to}>
            <NavLink to={t.to} end={t.end} className={t.primary ? 'tab tab--primary' : 'tab'}>
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

// 보조 메뉴: 햄버거 서랍 (주 메뉴와 마이는 탭바에 있으므로 반복하지 않는다)
const MENU = [
  { title: '안내', items: [
    { to: '/info', icon: 'info', label: '이용 안내·정책' },
  ] },
];

function MenuDrawer({ open, onClose }) {
  const ref = useRef(null);
  const { user } = useAppData();

  // 네이티브 <dialog>: 포커스 가두기·Esc 닫기·배경 비활성화를 브라우저가 처리한다
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-label="메뉴"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="drawer__panel" onClick={(e) => e.target.closest('a') && onClose()}>
        <div className="drawer__head">
          <span className="avatar" aria-hidden="true"><Icon name="user" /></span>
          <div className="drawer__who">
            {user ? <><strong>{user.email}</strong><span>로그인됨 · 내 정보는 마이 탭에서</span></> : <><strong>게스트</strong><Link to="/login" className="text-link">로그인하기</Link></>}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="메뉴 닫기" autoFocus>
            <Icon name="close" />
          </button>
        </div>

        {MENU.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="drawer__section">{group.title}</p>
            <ul className="menu-list">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="menu-row">
                    <Icon name={item.icon} /><span>{item.label}</span><Icon name="chevron" size={18} className="menu-row__chev" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <p className="drawer__foot">가상 브랜드 데모 · 실제 예약·결제가 이루어지지 않습니다. 기록은 이 기기에만 저장됩니다.</p>
      </div>
    </dialog>
  );
}
