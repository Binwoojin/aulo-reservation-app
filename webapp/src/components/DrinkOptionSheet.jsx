import { useState } from 'react';
import { MAX_SHOTS, OWN_CUP_DISCOUNT, SHOT_PRICE } from '../config/policy.js';
import { canAddShot, drinkTemps, fixedTemp, needsTemp } from '../lib/drink.js';
import { TEMPS, drinkLabel, itemKey, unitPriceOf } from '../lib/order.js';
import { formatWon } from '../lib/time.js';
import { BottomSheet, Provisional, Segmented, Stepper, SwitchRow } from './ui.jsx';

// 음료 옵션 시트 (좌석 추가 주문·Suite 배달): 메뉴를 누르면 열린다.
// 아이스·핫(음료 상세와 같은 구성, HOT으로 시작) → 샷 추가(커피만) → 텀블러 → 수량 → '담기'
// onAdd(itemKey, qty)로 담는다. 가격은 정상가 기준이고 쿠폰은 주문 요약에서 적용된다.
// 음료가 바뀌면 key로 새로 그려 선택값을 처음부터 시작한다.
export default function DrinkOptionSheet({ drink, open, onClose, onAdd }) {
  if (!drink) return null;
  return <Sheet key={drink.id} drink={drink} open={open} onClose={onClose} onAdd={onAdd} />;
}

function Sheet({ drink, open, onClose, onAdd }) {
  const chooseTemp = needsTemp(drink);
  const isCoffee = canAddShot(drink);
  const onlyTemp = TEMPS.find((t) => t.value === fixedTemp(drink));
  const [temp, setTemp] = useState(chooseTemp ? drinkTemps(drink)[0] : null);
  const [shot, setShot] = useState(0);
  const [ownCup, setOwnCup] = useState(false);
  const [qty, setQty] = useState(1);
  const key = itemKey(drink.id, chooseTemp ? temp : null, { shot: isCoffee ? shot : 0, ownCup });
  const unit = unitPriceOf(key);

  return (
    <BottomSheet
      open={open}
      title={drink.name}
      onClose={onClose}
      footer={(
        <button type="button" className="button button--primary button--block" onClick={() => onAdd(key, qty)}>
          {drinkLabel(drink.id, chooseTemp ? temp : null)} 담기 · {formatWon(unit * qty)}
        </button>
      )}
    >
      {chooseTemp ? (
        <section className="drink-temp" aria-labelledby={`opt-temp-${drink.id}`}>
          <p id={`opt-temp-${drink.id}`} className="group-title">아이스 · 핫 <span className="sheet-required">필수</span></p>
          <Segmented label="온도" name={`temp-${drink.id}`} value={temp} onChange={setTemp} options={TEMPS.map((t) => ({ value: t.value, label: t.label }))} />
          <p className="group-hint">가격은 같아요</p>
        </section>
      ) : onlyTemp && (
        <p className="drink-temp-only">
          <span className="temp-chip" data-temp={onlyTemp.value}>{onlyTemp.short}</span>
          {onlyTemp.value === 'hot' ? '따뜻하게만 준비돼요' : '차갑게만 준비돼요'}
        </p>
      )}
      {isCoffee && (
        <section className="sheet-section sheet-row" aria-label="샷 추가">
          <span className="option-row__text">
            <span className="option-row__label">샷 추가</span>
            <span className="option-row__detail">1회 +{formatWon(SHOT_PRICE.value)} · 최대 {MAX_SHOTS}회 <Provisional note={SHOT_PRICE.note} /></span>
          </span>
          <Stepper label="샷 추가" value={shot} onChange={setShot} min={0} max={MAX_SHOTS} />
        </section>
      )}
      <section className="sheet-section list-card" aria-label="컵">
        <SwitchRow label={`텀블러 사용 · ${formatWon(OWN_CUP_DISCOUNT)} 할인`} detail="가져온 텀블러·개인컵에 담아 드려요" checked={ownCup} onChange={setOwnCup} />
      </section>
      <section className="sheet-section sheet-row" aria-label="수량">
        <span className="option-row__text">
          <span className="option-row__label">수량</span>
          <span className="option-row__detail">1잔 {formatWon(unit)}</span>
        </span>
        <Stepper label="수량" value={qty} onChange={setQty} min={1} max={9} />
      </section>
    </BottomSheet>
  );
}
