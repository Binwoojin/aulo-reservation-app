import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BEST_MENU, MAX_SHOTS, MENU, MENU_CATEGORIES, OWN_CUP_DISCOUNT, SHOT_PRICE } from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { BottomSheet, DrinkThumb, Provisional, Segmented, Stepper, SwitchRow } from '../components/ui.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { canAddShot, drinkTemps, fixedTemp, needsTemp } from '../lib/drink.js';
import { REFILL_DRINKS, TEMPS, drinkLabel, itemKey, unitPriceOf } from '../lib/order.js';
import { formatWon } from '../lib/time.js';
import NotFoundPage from './NotFoundPage.jsx';

// 음료 상세: 누구나 볼 수 있다. 커피·녹차는 상세에서 아이스·핫을 먼저 고르고(필수, 사진도 바뀜),
// 한 가지 온도만 있는 음료는 그 온도를 안내만 한다.
// '주문하기'를 누르면 옵션 창에서 샷 추가(커피)·텀블러(300원 할인)·수량을 고른 뒤 장바구니에 담고 장바구니로 넘어간다.
export default function MenuDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useAppData();
  const drink = MENU.value.find((d) => d.id === id);
  const [sheetOpen, setSheetOpen] = useState(false);
  // ?temp=hot처럼 기본 온도를 받고 들어오면(홈 대표 메뉴) 그 온도가 선택된 상태로 시작한다
  const [searchParams] = useSearchParams();
  const [temp, setTemp] = useState(() => (needsTemp(drink) && drinkTemps(drink).includes(searchParams.get('temp')) ? searchParams.get('temp') : null));
  const [shot, setShot] = useState(0);
  const [ownCup, setOwnCup] = useState(false);
  const [qty, setQty] = useState(1);
  if (!drink) return <NotFoundPage />;

  const chooseTemp = needsTemp(drink);
  const onlyTemp = TEMPS.find((t) => t.value === fixedTemp(drink));
  const isCoffee = canAddShot(drink);
  const key = itemKey(drink.id, chooseTemp ? temp : null, { shot: isCoffee ? shot : 0, ownCup });
  const unit = unitPriceOf(key);
  const ready = !chooseTemp || temp;

  const put = () => {
    addToCart(key, qty);
    setSheetOpen(false);
    navigate('/cart');
  };

  return (
    <>
      <AppBar back title="" />
      <div className="screen-body has-bottom-bar">
        <DrinkThumb drink={drink} temp={temp} size="lg" />
        <section className="drink-head" aria-labelledby="drink-title">
          <span className="drink-head__meta">
            <span className="drink-head__category">{MENU_CATEGORIES.find((c) => c.id === drink.category)?.label}</span>
            {BEST_MENU.includes(drink.id) && <span className="badge badge--best">베스트</span>}
          </span>
          <h2 id="drink-title" className="screen-title">{drink.name}</h2>
          <p className="drink-price">{formatWon(drink.price)} <Provisional note={MENU.note} /></p>
          <p className="drink-desc">{drink.desc}</p>
        </section>
        {chooseTemp && (
          <section className="drink-temp" aria-labelledby="opt-temp">
            <p id="opt-temp" className="group-title">아이스 · 핫 <span className="sheet-required">필수</span></p>
            <Segmented label="온도" name="temp" value={temp} onChange={setTemp} options={TEMPS.map((t) => ({ value: t.value, label: t.label }))} />
            <p className="group-hint">가격은 같아요</p>
          </section>
        )}
        {onlyTemp && (
          <p className="drink-temp-only">
            <span className="temp-chip" data-temp={onlyTemp.value}>{onlyTemp.short}</span>
            {onlyTemp.value === 'hot' ? '따뜻하게만 준비돼요' : '차갑게만 준비돼요'}
            {drink.tempsNote && <Provisional note={drink.tempsNote} />}
          </p>
        )}
        <ul className="note-list">
          {isCoffee && <li>샷 추가는 '주문하기'를 누른 뒤 골라요.</li>}
          <li>텀블러·개인컵으로 주문하면 1잔당 {formatWon(OWN_CUP_DISCOUNT)} 할인돼요.</li>
          <li>1잔당 스탬프 1개가 적립돼요.</li>
          <li>포인트는 음료 주문에 쓸 수 없어요.</li>
          <li>Focus·Rest 이용 중에는 재주문 50% 할인 쿠폰을 최대 2회 쓸 수 있어요.</li>
          {REFILL_DRINKS.includes(drink.id) && <li>Suite 이용 중 1회 무료 리필 대상 음료예요.</li>}
        </ul>
      </div>
      <BottomBar>
        <button type="button" className="button button--primary" disabled={!ready} onClick={() => setSheetOpen(true)}>
          {ready ? '주문하기' : '아이스·핫을 골라 주세요'}
        </button>
      </BottomBar>

      <BottomSheet
        open={sheetOpen}
        title={drinkLabel(drink.id, chooseTemp ? temp : null)}
        onClose={() => setSheetOpen(false)}
        footer={(
          <button type="button" className="button button--primary button--block" onClick={put}>
            장바구니 담기 · {formatWon(unit * qty)}
          </button>
        )}
      >
        {isCoffee && (
          <section className="sheet-section sheet-row" aria-labelledby="opt-shot">
            <span className="option-row__text">
              <span id="opt-shot" className="option-row__label">샷 추가</span>
              <span className="option-row__detail">1회 +{formatWon(SHOT_PRICE.value)} · 최대 {MAX_SHOTS}회 <Provisional note={SHOT_PRICE.note} /></span>
            </span>
            <Stepper label="샷 추가" value={shot} onChange={setShot} min={0} max={MAX_SHOTS} />
          </section>
        )}
        <section className="sheet-section list-card" aria-label="컵">
          <SwitchRow label={`텀블러 사용 · ${formatWon(OWN_CUP_DISCOUNT)} 할인`} detail="가져온 텀블러·개인컵에 담아 드려요" checked={ownCup} onChange={setOwnCup} />
        </section>
        <section className="sheet-section sheet-row" aria-labelledby="opt-qty">
          <span className="option-row__text">
            <span id="opt-qty" className="option-row__label">수량</span>
            <span className="option-row__detail">1잔 {formatWon(unit)}</span>
          </span>
          <Stepper label="수량" value={qty} onChange={setQty} min={1} max={9} />
        </section>
      </BottomSheet>
    </>
  );
}
