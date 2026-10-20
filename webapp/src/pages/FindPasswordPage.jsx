import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { Field, PasswordField } from '../components/AuthFields.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import Icon from '../components/Icon.jsx';
import { CODE_LENGTH, MIN_PASSWORD, codeError, confirmError, emailError, passwordError } from '../lib/auth.js';

// 비밀번호 찾기 (데모): 이메일 → 인증번호 → 새 비밀번호 → 완료.
// 서버가 없어 메일은 보내지 않고, 인증번호는 6자리 숫자면 통과한다. 새 비밀번호도 저장하지 않는다.
const STEPS = ['이메일', '인증번호', '새 비밀번호'];

export default function FindPasswordPage() {
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [resent, setResent] = useState(false);
  const clear = (key) => setErrors((e) => (e[key] ? { ...e, [key]: null } : e));

  const next = (e) => {
    e.preventDefault();
    const errs = step === 0 ? { email: emailError(email) }
      : step === 1 ? { code: codeError(code) }
        : { password: passwordError(password), confirm: confirmError(password, confirm) };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const loginTo = `/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;

  if (step === STEPS.length) {
    return (
      <>
        <AppBar title="" />
        <div className="screen-body has-bottom-bar auth-done">
          <span className="success-head__icon" aria-hidden="true"><Icon name="check" size={32} /></span>
          <p className="shelf-script" lang="en">all set</p>
          <h2 className="screen-title">비밀번호를 바꿨어요</h2>
          <p className="muted">새 비밀번호로 다시 로그인해 주세요. 데모 버전이라 실제로 저장되지는 않아요.</p>
        </div>
        <BottomBar><Link className="button button--primary button--block" to={loginTo} replace>로그인하기</Link></BottomBar>
      </>
    );
  }

  const titles = [<>가입한 이메일을<br />입력해 주세요</>, <>메일로 받은<br />인증번호를 입력해 주세요</>, <>새 비밀번호를<br />정해 주세요</>];
  const hints = [
    '이메일로 비밀번호를 다시 정할 수 있는 인증번호를 보내 드려요.',
    `${email.trim()}으로 보낸 ${CODE_LENGTH}자리 숫자를 입력해 주세요.`,
    `${MIN_PASSWORD}자 이상으로 정해 주세요.`,
  ];

  return (
    <>
      <AppBar back={step > 0 ? () => { setStep((s) => s - 1); setErrors({}); } : true} title="비밀번호 찾기" />
      <div className="screen-body order-body has-bottom-bar">
        <BrandBand id="find-title" script={`step ${step + 1} of ${STEPS.length}`} title={titles[step]} hint={hints[step]}>
          <ol className="auth-steps" aria-label="진행 단계">
            {STEPS.map((s, i) => <li key={s} data-state={i < step ? 'done' : i === step ? 'now' : 'next'} aria-current={i === step ? 'step' : undefined}>{s}</li>)}
          </ol>
        </BrandBand>
        <form id="find-form" className="login-form" onSubmit={next} noValidate>
          {step === 0 && (
            <Field label="이메일" error={errors.email}>
              {({ id, invalid, describedBy }) => (
                <input id={id} className="field__input" type="email" autoComplete="email" inputMode="email" placeholder="name@example.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); clear('email'); }} aria-invalid={invalid} aria-describedby={describedBy} />
              )}
            </Field>
          )}
          {step === 1 && (
            <>
              <Field label="인증번호" error={errors.code} hint={`데모에서는 메일이 발송되지 않아요. 아무 ${CODE_LENGTH}자리 숫자를 입력해 주세요.`}>
                {({ id, invalid, describedBy }) => (
                  <input id={id} className="field__input field__input--code" inputMode="numeric" autoComplete="one-time-code" maxLength={CODE_LENGTH} placeholder={'0'.repeat(CODE_LENGTH)}
                    value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); clear('code'); }} aria-invalid={invalid} aria-describedby={describedBy} />
                )}
              </Field>
              <p className="auth-resend">
                <Icon name="mail" size={16} />메일이 오지 않았나요?
                <button type="button" className="text-link" onClick={() => setResent(true)}>인증번호 다시 받기</button>
              </p>
              {resent && <p className="auth-resend__done" role="status">인증번호를 다시 보냈어요 (데모: 실제 발송 없음)</p>}
            </>
          )}
          {step === 2 && (
            <>
              <PasswordField label="새 비밀번호" value={password} onChange={(v) => { setPassword(v); clear('password'); clear('confirm'); }} error={errors.password} placeholder={`${MIN_PASSWORD}자 이상`} />
              <PasswordField label="새 비밀번호 확인" value={confirm} onChange={(v) => { setConfirm(v); clear('confirm'); }} error={errors.confirm} placeholder="한 번 더 입력" />
            </>
          )}
        </form>
      </div>
      <BottomBar><button type="submit" form="find-form" className="button button--primary button--block">{['인증번호 받기', '확인', '비밀번호 바꾸기'][step]}</button></BottomBar>
    </>
  );
}
