import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { drinkImage } from '../lib/drink.js';

// 사진이 다 내려오면 부드럽게 나타나게 한다 (이미 캐시된 사진은 바로 표시, 실패해도 숨기지 않는다)
const markLoaded = (img) => img?.setAttribute('data-loaded', '');
const fadeOnLoad = {
  ref: (img) => { if (img?.complete) markLoaded(img); },
  onLoad: (e) => markLoaded(e.currentTarget),
  onError: (e) => markLoaded(e.currentTarget),
};

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
        {...fadeOnLoad}
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

// 음료 사진: public/images/drinks/의 사진(400·1024px WebP)을, 온도를 고르는 음료는 고른 온도의 사진을 보여 준다.
// 사진이 없으면 컵 아이콘 자리표시. 정사각형 비율을 고정해 사진이 바뀌어도 레이아웃이 그대로다.
const THUMB_SIZES = { sm: '56px', md: '104px', card: '180px', lg: 'min(100vw, 390px)' };
export function DrinkThumb({ drink, temp = null, size = 'md' }) {
  const image = drinkImage(drink, temp);
  return (
    <span className={`drink-thumb drink-thumb--${size}`}>
      {image
        ? (
          <img
            key={image}
            src={`images/drinks/${image}-400.webp`}
            srcSet={`images/drinks/${image}-400.webp 400w, images/drinks/${image}-1024.webp 1024w`}
            sizes={THUMB_SIZES[size]}
            alt=""
            loading={size === 'lg' ? 'eager' : 'lazy'}
            decoding="async"
            {...fadeOnLoad}
          />
        )
        : <Icon name="cup" size={size === 'lg' ? 72 : 32} />}
    </span>
  );
}

// 아래에서 올라오는 시트: 앱 프레임 안에서 열리는 네이티브 <dialog>. 배경을 누르거나 Esc로 닫는다.
// 브랜드 모션 원칙 'Stay in your rhythm'에 맞춰 천천히 올라오고(640ms), 닫힐 때는 짧게 내려간다(320ms).
const SHEET_EXIT_MS = 320;
export function BottomSheet({ open, title, onClose, children, footer }) {
  const ref = useRef(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) { setClosing(false); dialog.showModal(); }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  // 닫기 요청: 내려가는 모션을 보여 준 뒤 닫는다 (움직임 줄이기 설정이면 바로 닫는다)
  const requestClose = () => {
    if (closing) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { onClose(); return; }
    setClosing(true);
    window.setTimeout(() => { setClosing(false); onClose(); }, SHEET_EXIT_MS);
  };
  return (
    <dialog
      ref={ref}
      className="sheet"
      data-closing={closing || undefined}
      aria-labelledby="sheet-title"
      onCancel={(e) => { e.preventDefault(); requestClose(); }}
      onClose={() => open && onClose()}
      onClick={(e) => e.target === ref.current && requestClose()}
    >
      <div className="sheet__panel">
        <span className="sheet__grip" aria-hidden="true" />
        <div className="sheet__head">
          <h2 id="sheet-title" className="sheet__title">{title}</h2>
          <button type="button" className="icon-button" onClick={requestClose} aria-label="닫기"><Icon name="close" /></button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </dialog>
  );
}
