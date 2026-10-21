import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandBand } from '../components/BrandBand.jsx';
import { AppBar } from '../components/AppShell.jsx';
import { NoticeDialog } from '../components/ui.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { SupportSection } from '../components/MySection.jsx';
import { EMAIL_RE, MIN_PASSWORD, register } from '../lib/auth.js';
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_START_STATES, SCENARIOS, canBeInUse } from '../lib/scenarios.js';
import { HOURS } from '../config/policy.js';
import { formatTime } from '../lib/time.js';

// 로그인 정책: 좌석 예약·음료 주문은 로그인해야 진입한다.
// 비로그인으로 들어오면 이 화면으로 보내고(redirect), 로그인하면 원래 가려던 화면으로 돌려보낸다.
// inline: 하단 '마이' 탭에서 그 자리에 바로 보여 줄 때
export default function LoginPage({ inline = false }) {
  const { user, login, reservations, orders, storeId, loadScenario } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/my';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [kakaoOpen, setKakaoOpen] = useState(false);
  const [demoState, setDemoState] = useState('returning');
  const inUseOk = canBeInUse(new Date());

  if (user && !inline) return <Navigate to={redirect} replace />;

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(email.trim())) next.email = '이메일 주소를 확인해 주세요.';
    if (password.length < MIN_PASSWORD) next.password = `비밀번호는 ${MIN_PASSWORD}자 이상 입력해 주세요.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    register(email);
    const isDemo = email.trim().toLowerCase() === DEMO_EMAIL;
    if (isDemo) {
      // 데모 계정: 고른 시작 상태로 데모 계정의 예약·주문을 새로 만든다 (다른 계정 기록은 그대로)
      const state = SCENARIOS.find((sc) => sc.id === demoState && (!sc.needsOpenHours || inUseOk)) ?? SCENARIOS.find((sc) => sc.id === 'returning');
      const seed = state.build(new Date(), storeId);
      loadScenario({
        email: DEMO_EMAIL,
        reservations: [...reservations.filter((r) => r.owner !== DEMO_EMAIL), ...seed.reservations],
        orders: [...orders.filter((o) => o.owner !== DEMO_EMAIL), ...seed.orders],
      });
    } else {
      login(email.trim());
    }
    if (!inline) navigate(redirect, { replace: true });
  };

  // 닫거나 뒤로 가면 직전 화면으로 (앱 안 이동 기록이 없으면 홈)
  const close = () => (location.key === 'default' ? navigate('/') : navigate(-1));

  return (
    <>
      <AppBar title={inline ? '마이' : '로그인'} back={inline ? undefined : close} />
      <div className="screen-body order-body">
        <BrandBand id="login-title" script="welcome to aulo" title={<>로그인하고<br />예약과 주문을 이용하세요</>} hint="좌석 예약과 음료 주문은 스탬프·포인트 적립과 연결돼 로그인이 필요해요." />

        <section className="demo-account" aria-labelledby="demo-account-title">
          <div className="demo-account__top">
            <div className="demo-account__text">
              <p id="demo-account-title" className="demo-account__title">포트폴리오 데모 계정</p>
              <dl className="demo-account__list">
                <div><dt>아이디</dt><dd lang="en">{DEMO_EMAIL}</dd></div>
                <div><dt>비밀번호</dt><dd lang="en">{DEMO_PASSWORD}</dd></div>
              </dl>
            </div>
            <button type="button" className="button button--secondary button--small demo-account__fill" onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setErrors({}); }}>채우기</button>
          </div>
          {/* 시작 상태: 데모 계정으로 로그인하면 고른 상태의 홈을 바로 볼 수 있다. 이용 중은 운영 시간에만 */}
          <fieldset className="demo-state">
            <legend className="demo-state__legend">로그인 후 시작 상태</legend>
            <div className="demo-state__options">
              {DEMO_START_STATES.map((o) => {
                const off = o.id !== 'returning' && !inUseOk;
                return (
                  <label key={o.id} className="demo-state__option" data-disabled={off || undefined}>
                    <input type="radio" name="demo-state" value={o.id} checked={demoState === o.id} disabled={off} onChange={() => setDemoState(o.id)} />
                    <span className="demo-state__label">{o.label}</span>
                    <span className="demo-state__hint">{off ? '운영 시간에만' : o.hint}</span>
                  </label>
                );
              })}
            </div>
            <p className="demo-state__note">데모 계정은 로그인할 때마다 고른 상태로 기록을 새로 만들어요.{!inUseOk && ` 이용 중 상태는 ${formatTime(HOURS.open + 10)}~${formatTime(HOURS.lastEnd)} 사이에 고를 수 있어요.`}</p>
          </fieldset>
        </section>

        <form className="login-form" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">이메일</span>
            <input
              className="field__input" type="email" name="email" autoComplete="email" inputMode="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
              aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <span className="field__error" id="email-error">{errors.email}</span>}
          </label>
          <label className="field">
            <span className="field__label">비밀번호</span>
            <input
              className="field__input" type="password" name="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`${MIN_PASSWORD}자 이상`}
              aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && <span className="field__error" id="password-error">{errors.password}</span>}
          </label>
          <button type="submit" className="button button--primary button--block">로그인</button>
        </form>
        <p className="login-links">
          <Link className="text-button" to={`/signup?redirect=${encodeURIComponent(inline ? '/my' : redirect)}`}>회원가입</Link>
          <span aria-hidden="true">·</span>
          <Link className="text-button" to={`/find-password?redirect=${encodeURIComponent(inline ? '/my' : redirect)}`}>비밀번호 찾기</Link>
        </p>

        <p className="login-divider">또는</p>
        <button type="button" className="button button--kakao button--block" onClick={() => setKakaoOpen(true)}>카카오로 로그인</button>
        <p className="login-note">데모 버전이라 형식에 맞는 이메일과 비밀번호면 로그인돼요. 정보는 이 기기에만 저장돼요.</p>
        {/* 마이 탭(비로그인)에서도 공지·이용 안내·도우미로 갈 수 있게 */}
        {inline && <SupportSection />}
      </div>

      <NoticeDialog open={kakaoOpen} title="서비스 준비 중" onClose={() => setKakaoOpen(false)}>
        카카오 계정 로그인은 준비 중이에요. 지금은 이메일로 로그인해 주세요.
      </NoticeDialog>
    </>
  );
}

// 로그인이 필요한 화면을 감싼다
export function RequireLogin({ children }) {
  const { user } = useAppData();
  const { pathname, search } = useLocation();
  if (user) return children;
  return <Navigate to={`/login?redirect=${encodeURIComponent(pathname + search)}`} replace />;
}
