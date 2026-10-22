import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { Field, PasswordField } from '../components/AuthFields.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import Icon from '../components/Icon.jsx';
import { BottomSheet } from '../components/ui.jsx';
import { REWARD_POLICY } from '../config/policy.js';
import { useAppData } from '../lib/AppData.jsx';
import { CODE_LENGTH, MIN_PASSWORD, codeError, confirmError, emailError, isRegistered, passwordError, register } from '../lib/auth.js';
import { TERMS, TERMS_NOTE } from '../lib/terms.js';

// 회원가입 (데모): 이메일(중복 확인 → 인증번호 인증) + 비밀번호(로그인 방식 정책) + 필수 약관 동의 → 가입하면 바로 로그인하고 환영 화면
// 이메일 단계: idle → available(중복 아님) → sent(인증번호 보냄) → verified. 이메일을 고치면 처음부터 다시
const EMAIL_HINT = {
  idle: '중복 확인 후 이메일로 받은 인증번호로 인증해요.',
  available: '사용할 수 있는 이메일이에요. 인증번호를 받아 주세요.',
  sent: '인증번호를 보냈어요.',
  verified: '이메일 인증을 마쳤어요.',
};

export default function SignupPage() {
  const { user, login } = useAppData();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [emailStep, setEmailStep] = useState('idle');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState({});
  const [errors, setErrors] = useState({});
  const [termOpen, setTermOpen] = useState(null);
  const [done, setDone] = useState(false);
  // 고치는 순간 그 칸의 오류 문구를 지운다
  const clear = (key) => setErrors((e) => (e[key] ? { ...e, [key]: null } : e));
  const [resent, setResent] = useState(false);

  // 중복 확인: 이 기기에 가입한 이메일인지 본다 (데모에는 서버가 없다)
  const checkEmail = () => {
    const err = emailError(email) ?? (isRegistered(email) ? '이미 가입된 이메일이에요. 로그인하거나 다른 이메일을 써 주세요.' : null);
    setErrors((e) => ({ ...e, email: err }));
    if (!err) setEmailStep('available');
  };
  const verifyCode = () => {
    const err = codeError(code);
    setErrors((e) => ({ ...e, code: err }));
    if (!err) { setEmailStep('verified'); setResent(false); }
  };

  if (user && !done) return <Navigate to={redirect} replace />;

  const allAgreed = TERMS.every((t) => agreed[t.id]);
  const lengthOk = password.length >= MIN_PASSWORD;
  const matchOk = !!confirm && password === confirm;

  const submit = (e) => {
    e.preventDefault();
    const next = {
      email: emailError(email) ?? (emailStep !== 'verified' ? '이메일 중복 확인과 인증을 마쳐 주세요.' : null),
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
          <h1 className="screen-title">가입을 환영해요</h1>
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
          <Field label="이메일" error={errors.email} hint={EMAIL_HINT[emailStep]}>
            {({ id, invalid, describedBy }) => (
              <span className="field__row">
                <input id={id} className="field__input" type="email" autoComplete="email" inputMode="email" placeholder="name@example.com"
                  value={email} readOnly={emailStep === 'verified'} aria-invalid={invalid} aria-describedby={describedBy}
                  onChange={(e) => { setEmail(e.target.value); setEmailStep('idle'); setCode(''); clear('email'); }} />
                {emailStep === 'idle' && <button type="button" className="button button--secondary field__side" onClick={checkEmail}>중복 확인</button>}
                {emailStep === 'available' && <button type="button" className="button button--secondary field__side" onClick={() => { setEmailStep('sent'); clear('email'); }}>인증번호 받기</button>}
                {emailStep === 'sent' && <button type="button" className="button button--secondary field__side" onClick={() => setResent(true)}>다시 받기</button>}
                {emailStep === 'verified' && <button type="button" className="button button--secondary field__side" onClick={() => { setEmailStep('idle'); setCode(''); }}>변경</button>}
              </span>
            )}
          </Field>
          {emailStep === 'sent' && (
            <Field label="인증번호" error={errors.code} hint={`데모에서는 메일이 발송되지 않아요. 아무 ${CODE_LENGTH}자리 숫자를 입력해 주세요.${resent ? ' (다시 보냈어요)' : ''}`}>
              {({ id, invalid, describedBy }) => (
                <span className="field__row">
                  <input id={id} className="field__input field__input--code" inputMode="numeric" autoComplete="one-time-code" maxLength={CODE_LENGTH} placeholder={'0'.repeat(CODE_LENGTH)}
                    value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); clear('code'); }} aria-invalid={invalid} aria-describedby={describedBy} />
                  <button type="button" className="button button--primary field__side" onClick={verifyCode}>확인</button>
                </span>
              )}
            </Field>
          )}
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
                  <span><span className="terms__req">[필수]</span> {t.label} 동의</span>
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
      <BottomSheet
        open={!!termOpen}
        title={termOpen?.label ?? ''}
        onClose={() => setTermOpen(null)}
        footer={termOpen && (
          <button type="button" className="button button--primary button--block" onClick={() => { setAgreed((a) => ({ ...a, [termOpen.id]: true })); clear('terms'); setTermOpen(null); }}>
            {agreed[termOpen.id] ? '확인' : '동의하고 닫기'}
          </button>
        )}
      >
        {termOpen && <TermsBody terms={termOpen} />}
      </BottomSheet>
    </>
  );
}

// 약관 전문 (데모용 예시 문안, 정책 값으로 만든 내용)
function TermsBody({ terms }) {
  return (
    <div className="terms-doc">
      <p className="terms-doc__note"><span className="provisional">임시</span> {TERMS_NOTE}</p>
      {terms.table && (
        <table className="terms-doc__table">
          <tbody>
            {terms.table.map((row) => (
              <tr key={row.head}><th scope="row">{row.head}</th><td>{row.cells.map((c) => <p key={c}>{c}</p>)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {terms.sections.map((sec) => (
        <section key={sec.title} className="terms-doc__section">
          <h3>{sec.title}</h3>
          {sec.body.map((b) => <p key={b}>{b}</p>)}
        </section>
      ))}
    </div>
  );
}
