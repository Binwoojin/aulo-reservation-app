import { useId, useState } from 'react';
import Icon from './Icon.jsx';

// 로그인·회원가입·비밀번호 찾기 공통 입력칸. 입력칸 옆 버튼이 입력칸 이름에 섞이지 않게 label은 htmlFor로 잇는다. hint는 오류가 없을 때 보이는 안내, error가 있으면 빨간 안내로 바뀐다.
export function Field({ label, error, hint, children }) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      {children({ id, invalid: !!error, describedBy: error || hint ? `${id}-msg` : undefined })}
      {error ? <span className="field__error" id={`${id}-msg`}>{error}</span> : hint && <span className="field__hint" id={`${id}-msg`}>{hint}</span>}
    </div>
  );
}

// 비밀번호: 보기/숨기기 버튼
export function PasswordField({ label, value, onChange, error, hint, autoComplete = 'new-password', placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      {({ id, invalid, describedBy }) => (
        <span className="field__wrap">
          <input
            id={id} className="field__input" type={show ? 'text' : 'password'} autoComplete={autoComplete}
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
