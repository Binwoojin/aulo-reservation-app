import { useEffect, useId, useRef } from 'react';
import Icon from './Icon.jsx';

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

// 세그먼트 컨트롤 (2~3개 중 하나)
export function Segmented({ label, name, options, value, onChange }) {
  return (
    <fieldset className="segmented">
      <legend className="visually-hidden">{label}</legend>
      {options.map((o) => (
        <label key={o.value} className="segmented__item">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

// 세로 목록형 선택 (모바일 리스트 행)
export function OptionList({ legend, name, options, value, onChange, hint, empty, hideLegend = false }) {
  const hintId = useId();
  return (
    <fieldset className="option-group" aria-describedby={hint ? hintId : undefined}>
      <legend className={hideLegend ? 'visually-hidden' : 'group-title'}>{legend}</legend>
      {hint && <p className="group-hint" id={hintId}>{hint}</p>}
      {options.length === 0 && empty ? (
        <div className="empty-state">{empty}</div>
      ) : (
        <div className="option-list">
          {options.map((o) => (
            <label key={o.value} className="option-row" data-disabled={o.disabled || undefined}>
              <input type="radio" name={name} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} />
              {o.leading}
              <span className="option-row__text">
                <span className="option-row__label">{o.label}</span>
                {o.detail && <span className="option-row__detail">{o.detail}</span>}
              </span>
              {o.trailing && <span className="option-row__trailing">{o.trailing}</span>}
              <span className="option-row__check" aria-hidden="true"><Icon name="check" size={18} /></span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

// 칩 그리드 (시간처럼 짧은 값 여러 개)
export function ChipGrid({ legend, name, options, value, onChange, hint, empty }) {
  const hintId = useId();
  return (
    <fieldset className="option-group" aria-describedby={hint ? hintId : undefined}>
      <legend className="group-title">{legend}</legend>
      {hint && <p className="group-hint" id={hintId}>{hint}</p>}
      {options.length === 0 && empty ? (
        <div className="empty-state">{empty}</div>
      ) : (
        <div className="chip-grid">
          {options.map((o) => (
            <label key={o.value} className="chip" data-disabled={o.disabled || undefined}>
              <input type="radio" name={name} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} />
              <span>{o.label}</span>
              {o.detail && <small>{o.detail}</small>}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

// 켜고 끄는 스위치 행
export function SwitchRow({ label, detail, checked, onChange }) {
  return (
    <label className="switch-row">
      <span className="option-row__text">
        <span className="option-row__label">{label}</span>
        {detail && <span className="option-row__detail">{detail}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}

export function Stepper({ label, value, onChange, min = 0, max = 9, format = (v) => v }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`${label} 줄이기`}>
        <Icon name="minus" size={20} />
      </button>
      <output aria-live="polite">{format(value)}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`${label} 늘리기`}>
        <Icon name="plus" size={20} />
      </button>
    </div>
  );
}

export function StepProgress({ steps, current, label = '진행 단계' }) {
  return (
    <div className="step-progress">
      <p><span className="step-progress__count">{current + 1}/{steps.length}</span> {steps[current]}</p>
      <div className="step-progress__bar" role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current + 1}>
        <span style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}

// 안내창: 앱 프레임 안에서 열리는 작은 모달 (네이티브 <dialog>).
// onConfirm을 주면 '닫기 / 확인 동작' 두 버튼 확인창이 된다 (window.confirm은 일부 환경에서 막혀 있어 쓰지 않는다)
export function NoticeDialog({ open, title, children, onClose, confirmLabel, onConfirm, danger = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} className="notice" aria-labelledby="notice-title" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="notice__box">
        <h2 id="notice-title" className="notice__title">{title}</h2>
        <div className="notice__body">{children}</div>
        {onConfirm ? (
          <div className="notice__actions">
            <button type="button" className="button button--secondary" onClick={onClose} autoFocus>닫기</button>
            <button type="button" className={`button ${danger ? 'button--danger' : 'button--primary'}`} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        ) : (
          <button type="button" className="button button--primary button--block" onClick={onClose} autoFocus>확인</button>
        )}
      </div>
    </dialog>
  );
}

// 음료 이미지 자리: MENU 항목에 image(파일명)가 생기면 public/images/drinks/의 사진을, 없으면 컵 아이콘 자리표시를 보여 준다.
// 정사각형 비율을 고정해 사진이 들어와도 레이아웃이 바뀌지 않는다.
export function DrinkThumb({ drink, size = 'md' }) {
  return (
    <span className={`drink-thumb drink-thumb--${size}`}>
      {drink.image
        ? <img src={`images/drinks/${drink.image}`} alt="" loading="lazy" decoding="async" />
        : <Icon name="cup" size={size === 'lg' ? 72 : 32} />}
    </span>
  );
}
