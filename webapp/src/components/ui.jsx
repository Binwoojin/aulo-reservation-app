import { useId } from 'react';

export function SpaceImage({ space, eager = false, className = '' }) {
  return (
    <figure className={`photo ${className}`}>
      <img
        src={`images/${space.image}-768.webp`}
        srcSet={`images/${space.image}-768.webp 768w, images/${space.image}-1536.webp 1536w`}
        sizes="390px"
        width="1536"
        height="1024"
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </figure>
  );
}

export function Tag({ type, children }) {
  return <span className="tag" data-service={type}>{children}</span>;
}

// 미확정 정책 임시값 표시
export function Provisional({ note }) {
  return (
    <span className="provisional" title={note}>
      임시<span className="visually-hidden">: {note}</span>
    </span>
  );
}

// 라디오 버튼 그룹을 칩 형태로 표시
export function ChoiceGroup({ legend, name, options, value, onChange, hint, columns, disabledText }) {
  const hintId = useId();
  return (
    <fieldset className="choice-group" aria-describedby={hint ? hintId : undefined}>
      <legend>{legend}</legend>
      {hint && <p className="field-hint" id={hintId}>{hint}</p>}
      {options.length === 0 && disabledText ? (
        <p className="field-empty">{disabledText}</p>
      ) : (
        <div className="choice-list" style={columns ? { '--columns': columns } : undefined}>
          {options.map((opt) => (
            <label key={opt.value} className="choice" data-disabled={opt.disabled || undefined}>
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
              />
              <span className="choice__label">{opt.label}</span>
              {opt.detail && <span className="choice__detail">{opt.detail}</span>}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function Stepper({ label, value, onChange, min = 0, max = 9 }) {
  return (
    <div className="stepper" role="group" aria-label={`${label} 수량`}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`${label} 빼기`}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`${label} 더하기`}>+</button>
    </div>
  );
}
