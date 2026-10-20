import { useId, useState } from 'react';
import Icon from './Icon.jsx';

// 로그인·회원가입·비밀번호 찾기 공통 입력칸. hint는 오류가 없을 때 보이는 안내, error가 있으면 빨간 안내로 바뀐다.
export function Field({ label, error, hint, children }) {
  const id = useId();
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children({ id, invalid: !!error, describedBy: error || hint ? `${id}-msg` : undefined })}
      {error ? <span className="field__error" id={`${id}-msg`}>{error}</span> : hint && <span className="field__hint" id={`${id}-msg`}>{hint}</span>}
    </label>
  );
}

// 비밀번호: 보기/숨기기 버튼
export function PasswordField({ label, value, onChange, error, hint, autoComplete = 'new-password', placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      {({ invalid, describedBy }) => (
        <span className="field__wrap">
          <input
            className="field__input" type={show ? 'text' : 'password'} autoComplete={autoComplete}
            value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            aria-invalid={invalid} aria-describedby={describedBy}
          />
          <button type="button" className="field__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'} aria-pressed={show}>
            <Icon name={show ? 'eye-off' : 'eye'} size={20} />
          </button>
        </span>
      )}
    </Field>
  );
}
