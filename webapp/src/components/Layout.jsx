import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { PROVISIONAL_NOTES } from '../config/policy.js';

const NAV = [
  { to: '/recommend', label: '공간 추천' },
  { to: '/reserve', label: '예약' },
  { to: '/order', label: '음료 주문' },
];

export default function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  // 화면 전환 시 맨 위로 이동하고 본문에 포커스 (스크린 리더가 새 화면을 읽도록)
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>본문으로 바로가기</a>
      <p className="demo-banner">데모 서비스 · 실제 예약과 결제가 이루어지지 않습니다</p>
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink to="/" className="brand" aria-label="Aulo 홈">aulo</NavLink>
          <nav aria-label="주요 메뉴">
            <ul>
              {NAV.map((item) => (
                <li key={item.to}><NavLink to={item.to}>{item.label}</NavLink></li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="container">
          <details>
            <summary>임시 정책 안내 ({PROVISIONAL_NOTES.length})</summary>
            <p>아래 항목은 정책이 확정되지 않아 임시값으로 동작합니다. 화면의 <span className="provisional">임시</span> 표시가 이 항목입니다.</p>
            <ul>{PROVISIONAL_NOTES.map((note) => <li key={note}>{note}</li>)}</ul>
          </details>
          <p>가상 브랜드 프로젝트 · 실제 운영 매장이 아닙니다. 사진은 AI 생성 참고 이미지입니다.</p>
          <p>예약·주문 기록은 이 브라우저에만 저장됩니다.</p>
        </div>
      </footer>
    </>
  );
}
