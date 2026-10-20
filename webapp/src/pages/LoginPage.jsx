import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandBand } from '../components/BrandBand.jsx';
import { AppBar } from '../components/AppShell.jsx';
import { NoticeDialog } from '../components/ui.jsx';
import { useAppData } from '../lib/AppData.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

// 로그인 정책: 좌석 예약·음료 주문은 로그인해야 진입한다.
// 비로그인으로 들어오면 이 화면으로 보내고(redirect), 로그인하면 원래 가려던 화면으로 돌려보낸다.
// inline: 하단 '마이' 탭에서 그 자리에 바로 보여 줄 때
export default function LoginPage({ inline = false }) {
  const { user, login } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/my';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [kakaoOpen, setKakaoOpen] = useState(false);
  const [soonOpen, setSoonOpen] = useState(null); // '회원가입' | '비밀번호 찾기'

  if (user && !inline) return <Navigate to={redirect} replace />;

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(email.trim())) next.email = '이메일 주소를 확인해 주세요.';
    if (password.length < MIN_PASSWORD) next.password = `비밀번호는 ${MIN_PASSWORD}자 이상 입력해 주세요.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    login(email.trim());
    if (!inline) navigate(redirect, { replace: true });
  };

  // 닫거나 뒤로 가면 직전 화면으로 (앱 안 이동 기록이 없으면 홈)
  const close = () => (location.key === 'default' ? navigate('/') : navigate(-1));

  return (
    <>
      <AppBar title={inline ? '마이' : '로그인'} back={inline ? undefined : close} />
      <div className="screen-body order-body">
        <BrandBand id="login-title" script="welcome to aulo" title={<>로그인하고<br />예약과 주문을 이용하세요</>} hint="좌석 예약과 음료 주문은 스탬프·포인트 적립과 연결돼 로그인이 필요해요." />

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
          <button type="button" className="text-button" onClick={() => setSoonOpen('회원가입')}>회원가입</button>
          <span aria-hidden="true">·</span>
          <button type="button" className="text-button" onClick={() => setSoonOpen('비밀번호 찾기')}>비밀번호 찾기</button>
        </p>

        <p className="login-divider">또는</p>
        <button type="button" className="button button--kakao button--block" onClick={() => setKakaoOpen(true)}>카카오로 로그인</button>
        <p className="login-note">데모 버전이라 형식에 맞는 이메일과 비밀번호면 로그인돼요. 정보는 이 기기에만 저장돼요.</p>
      </div>

      <NoticeDialog open={!!soonOpen} title={`${soonOpen ?? ''} 준비 중`} onClose={() => setSoonOpen(null)}>
        {soonOpen}{soonOpen === '회원가입' ? '은' : '는'} 데모 버전에서 제공하지 않아요. 형식에 맞는 이메일과 8자 이상 비밀번호로 바로 로그인할 수 있어요.
      </NoticeDialog>
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
