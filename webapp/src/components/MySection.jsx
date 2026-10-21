import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

// 마이 페이지 묶음과 줄 (홈 맨 아래 '안내 · 고객 지원'에서도 쓴다)
export function MySection({ title, children }) {
  return (
    <section className="my-section" aria-label={title}>
      <h3 className="my-section__title">{title}</h3>
      <ul className="my-list">{children}</ul>
    </section>
  );
}

export function MyRow({ to, icon, label, value }) {
  return (
    <li>
      <Link to={to} className="my-row my-row--button">
        <Icon name={icon} /><span className="my-row__label">{label}</span>
        {value && <span className="my-row__value">{value}</span>}
        <Icon name="chevron" size={18} />
      </Link>
    </li>
  );
}

// 보조 기능 (2026-10-21 사용자 결정: 햄버거 서랍을 없애고 홈 맨 아래로). 로그인하지 않아도 보인다.
export function SupportSection() {
  return (
    <MySection title="안내 · 고객 지원">
      <MyRow to="/notice" icon="bell" label="공지사항" />
      <MyRow to="/info" icon="info" label="이용 안내·정책" />
      <MyRow to="/help" icon="chat" label="이용 도우미" value="데모" />
    </MySection>
  );
}
