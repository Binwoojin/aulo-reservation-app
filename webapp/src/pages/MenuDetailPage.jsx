import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BEST_MENU, MAX_SHOTS, MENU, MENU_CATEGORIES, OWN_CUP_DISCOUNT, SHOT_PRICE, SPACES } from '../config/policy.js';
import Icon from '../components/Icon.jsx';
import { isInUse } from '../lib/reservation.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { BottomSheet, DrinkThumb, NoticeDialog, Provisional, Segmented, Stepper, SwitchRow } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { canAddShot, drinkTemps, fixedTemp, needsTemp } from '../lib/drink.js';
import { REFILL_DRINKS, TEMPS, drinkLabel, itemKey, unitPriceOf } from '../lib/order.js';
import { formatWon } from '../lib/time.js';
import NotFoundPage from './NotFoundPage.jsx';

// 음료 상세: 누구나 볼 수 있다. 커피·녹차는 상세에서 아이스·핫을 먼저 고르고(필수, 사진도 바뀜),
// 한 가지 온도만 있는 음료는 그 온도를 안내만 한다.
// 비로그인이면 '주문하기'에서 바로 로그인 안내창을 띄우고(2026-10-20), 로그인하면 이 상세로 돌아온다.
// 로그인 상태에서 '주문하기'를 누르면 옵션 창에서 샷 추가(커피)·텀블러(300원 할인)·수량을 고른 뒤 장바구니에 담고 장바구니로 넘어간다.
export default function MenuDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, addToCart, myReservations } = useAppData();
  const now = useNow();
  const inUse = user ? myReservations.find((r) => isInUse(r, now)) : null;
  const [loginOpen, setLoginOpen] = useState(false);
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
        {/* 주문 탭·홈 음료 섹션과 같은 브랜드 톤: 베이지 띠 위 아치형 사진, Fraunces 카테고리·가격 */}
        <section className="detail-hero" aria-labelledby="drink-title">
          <DrinkThumb drink={drink} temp={temp} size="lg" />
          <span className="drink-head__meta">
            <span className="drink-head__category" lang="en">{MENU_CATEGORIES.find((c) => c.id === drink.category)?.en}</span>
            {BEST_MENU.includes(drink.id) && <span className="badge badge--best">대표 메뉴</span>}
          </span>
          <h1 id="drink-title" className="screen-title">{drink.name}</h1>
          <p className="drink-price"><span lang="en">{drink.price.toLocaleString('ko-KR')}</span>원 <Provisional note={MENU.note} /></p>
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
          </p>
        )}
        <ul className="note-list">
          {isCoffee && <li>샷 추가는 '주문하기'를 누른 뒤 골라요.</li>}
          <li>텀블러·개인컵으로 주문하면 1잔당 {formatWon(OWN_CUP_DISCOUNT)} 할인되고, 1잔당 스탬프 1개가 적립돼요.</li>
        </ul>
        {/* 좌석을 이용 중일 때만: 쿠폰·리필은 좌석 주문에서 쓰므로 그쪽으로 안내한다 */}
        {inUse && (
          <Link to={`/reservations/${inUse.id}/order`} className="notice-row help-link">
            <Icon name="cup" size={20} />
            <span>{SPACES[inUse.type].drink === 'included'
              ? `Suite 이용 중이에요. ${REFILL_DRINKS.includes(drink.id) ? '이 음료는 1회 무료 리필 대상이에요. ' : ''}배달 메뉴에서 주문하면 혜택이 적용돼요`
              : '좌석 이용 중이에요. 추가 주문에서 주문하면 50% 할인 쿠폰(최대 2회)이 적용돼요'}</span>
            <Icon name="chevron" size={18} />
          </Link>
        )}
      </div>
      <BottomBar>
        <button type="button" className="button button--primary" disabled={!ready} onClick={() => (user ? setSheetOpen(true) : setLoginOpen(true))}>
          {ready ? '주문하기' : '아이스·핫을 골라 주세요'}
        </button>
      </BottomBar>

      <NoticeDialog
        open={loginOpen}
        title="로그인이 필요해요"
        confirmLabel="로그인하기"
        onConfirm={() => navigate(`/login?redirect=${encodeURIComponent(`/menu/${drink.id}${chooseTemp && temp ? `?temp=${temp}` : ''}`)}`)}
        onClose={() => setLoginOpen(false)}
      >
        음료 주문은 스탬프 적립과 연결돼 로그인해야 이용할 수 있어요. 로그인하면 이 메뉴로 다시 돌아와요.
      </NoticeDialog>

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
