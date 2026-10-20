import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { Field, PasswordField } from '../components/AuthFields.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import Icon from '../components/Icon.jsx';
import { BottomSheet } from '../components/ui.jsx';
import { REWARD_POLICY } from '../config/policy.js';
import { useAppData } from '../lib/AppData.jsx';
import { MIN_PASSWORD, confirmError, emailError, isRegistered, passwordError, register } from '../lib/auth.js';

// 약관: 데모 버전에는 실제 약관이 없어 필수 동의 항목과 안내만 둔다 (내용을 지어내지 않는다)
const TERMS = [
  { id: 'service', label: '서비스 이용약관 동의' },
  { id: 'privacy', label: '개인정보 수집·이용 동의' },
];

// 회원가입 (데모): 이메일 + 비밀번호(로그인 방식 정책) + 필수 약관 동의 → 가입하면 바로 로그인하고 환영 화면
export default function SignupPage() {
  const { user, login } = useAppData();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState({});
  const [errors, setErrors] = useState({});
  const [termOpen, setTermOpen] = useState(null);
  const [done, setDone] = useState(false);
  // 고치는 순간 그 칸의 오류 문구를 지운다
  const clear = (key) => setErrors((e) => (e[key] ? { ...e, [key]: null } : e));

  if (user && !done) return <Navigate to={redirect} replace />;

  const allAgreed = TERMS.every((t) => agreed[t.id]);
  const lengthOk = password.length >= MIN_PASSWORD;
  const matchOk = !!confirm && password === confirm;

  const submit = (e) => {
    e.preventDefault();
    const next = {
      email: emailError(email) ?? (isRegistered(email) ? '이미 가입된 이메일이에요. 로그인해 주세요.' : null),
      password: passwordError(password),
      confirm: confirmError(password, confirm),
      terms: allAgreed ? null : '필수 약관에 모두 동의해 주세요.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    register(email);
    login(email.trim());
    setDone(true);
    window.scrollTo(0, 0);
  };

  if (done) {
    return (
      <>
        <AppBar title="" />
        <div className="screen-body has-bottom-bar auth-done">
          <span className="success-head__icon" aria-hidden="true"><Icon name="check" size={32} /></span>
          <p className="shelf-script" lang="en">welcome to aulo</p>
          <h2 className="screen-title">가입을 환영해요</h2>
          <p className="muted">{email.trim()} 계정으로 로그인했어요.</p>
          <ul className="auth-done__perks">{REWARD_POLICY.slice(0, 2).map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
        <BottomBar><button type="button" className="button button--primary button--block" onClick={() => navigate(redirect, { replace: true })}>시작하기</button></BottomBar>
      </>
    );
  }

  return (
    <>
      <AppBar back title="회원가입" />
      <div className="screen-body order-body has-bottom-bar">
        <BrandBand id="signup-title" script="join aulo" title={<>Aulo 계정을<br />만들어 주세요</>} hint="이메일과 비밀번호로 가입해요. 데모 버전이라 정보는 이 기기에만 저장되고, 비밀번호는 저장하지 않아요." />
        <form id="signup-form" className="login-form" onSubmit={submit} noValidate>
          <Field label="이메일" error={errors.email}>
            {({ invalid, describedBy }) => (
              <input className="field__input" type="email" autoComplete="email" inputMode="email" placeholder="name@example.com"
                value={email} onChange={(e) => { setEmail(e.target.value); clear('email'); }} aria-invalid={invalid} aria-describedby={describedBy} />
            )}
          </Field>
          <PasswordField label="비밀번호" value={password} onChange={(v) => { setPassword(v); clear('password'); clear('confirm'); }} error={errors.password} placeholder={`${MIN_PASSWORD}자 이상`} />
          <ul className="pw-checks" aria-live="polite">
            <li data-ok={lengthOk || undefined}><Icon name="check" size={14} />{MIN_PASSWORD}자 이상</li>
            <li data-ok={matchOk || undefined}><Icon name="check" size={14} />비밀번호 확인 일치</li>
          </ul>
          <PasswordField label="비밀번호 확인" value={confirm} onChange={(v) => { setConfirm(v); clear('confirm'); }} error={errors.confirm} placeholder="한 번 더 입력" />

          <fieldset className="terms" aria-describedby={errors.terms ? 'terms-error' : undefined}>
            <legend className="field__label">약관 동의</legend>
            <label className="terms__all">
              <input type="checkbox" checked={allAgreed} onChange={(e) => { setAgreed(Object.fromEntries(TERMS.map((t) => [t.id, e.target.checked]))); clear('terms'); }} />
              <span className="terms__box" aria-hidden="true"><Icon name="check" size={16} /></span>
              <strong>전체 동의</strong>
            </label>
            {TERMS.map((t) => (
              <div key={t.id} className="terms__row">
                <label>
                  <input type="checkbox" checked={!!agreed[t.id]} onChange={(e) => { setAgreed((a) => ({ ...a, [t.id]: e.target.checked })); clear('terms'); }} />
                  <span className="terms__box" aria-hidden="true"><Icon name="check" size={16} /></span>
                  <span><span className="terms__req">[필수]</span> {t.label}</span>
                </label>
                <button type="button" className="text-link terms__view" onClick={() => setTermOpen(t)}>보기</button>
              </div>
            ))}
            {errors.terms && <span className="field__error" id="terms-error">{errors.terms}</span>}
          </fieldset>
        </form>
        <p className="login-note">이미 계정이 있으신가요? <Link className="text-link" to={`/login?redirect=${encodeURIComponent(redirect)}`}>로그인</Link></p>
      </div>
      <BottomBar><button type="submit" form="signup-form" className="button button--primary button--block">가입하기</button></BottomBar>
      <BottomSheet open={!!termOpen} title={termOpen?.label ?? ''} onClose={() => setTermOpen(null)}>
        <p className="muted">데모 버전에는 실제 약관이 없어요. 실제 서비스에서는 이 자리에 {termOpen?.label.replace(' 동의', '')} 전문이 들어가요.</p>
      </BottomSheet>
    </>
  );
}
