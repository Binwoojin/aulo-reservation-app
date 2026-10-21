import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BOOKING_WINDOW_DAYS,
  CANCEL_POLICY,
  HOURS,
  MAX_SHOTS,
  MENU,
  MENU_CATEGORIES,
  OWN_CUP_DISCOUNT,
  SHOT_PRICE,
  PAYMENT_POLICY,
  SEAT_PRICES,
  SPACES,
  STORES,
} from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import StorePicker from '../components/StorePicker.jsx';
import SeatMap from '../components/SeatMap.jsx';
import { seatZone } from '../lib/seatLayout.js';
import {
  DrinkThumb,
  Provisional,
  Segmented,
  SpaceImage,
  StepProgress,
  Stepper,
  SwitchRow,
  Tag,
} from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import {
  hasReservationOn,
  isHoliday,
  bookedRanges,
  createReservation,
  drinkFee,
  drinkOptionsText,
  extensionNote,
  getDrink,
  freeUnits,
  lastEndFor,
  reservationFee,
  startOptions,
  unitIds,
  windowDates,
} from '../lib/reservation.js';
import { formatDate, formatTime, formatWon, minutesOfDay, toDateString } from '../lib/time.js';
import { pointBalance, pointsEarnedFor, usablePoints } from '../lib/rewards.js';
import { canAddShot, drinkTemps, fixedTemp, needsTemp } from '../lib/drink.js';
import { TEMPS, drinkLabel } from '../lib/order.js';

const RESERVABLE = ['focus', 'rest', 'suite'];

export default function ReservePage() {
  const { type } = useParams();
  if (type === 'cafe') return <CafeNotice />;
  if (!RESERVABLE.includes(type)) return <TypePicker />;
  return <ReserveWizard key={type} type={type} />;
}

function TypePicker() {
  const { store } = useAppData();
  return (
    <>
      <AppBar title="공간 예약" />
      <div className="screen-body order-body">
        {/* 음료 화면과 같은 브랜드 톤: 베이지 띠 + Fraunces 한 줄 + 아치형 공간 사진 */}
        <section className="order-band" aria-labelledby="reserve-title">
          <StorePicker variant="inline" />
          <p className="shelf-script" lang="en">find your space</p>
          <h2 id="reserve-title" className="order-band__title">어떤 공간에서<br />머무를까요?</h2>
          <p className="order-band__hint">앱 예약은 내일부터 {BOOKING_WINDOW_DAYS}일 안에서 할 수 있어요</p>
        </section>
        <ul className="type-list">
          {RESERVABLE.map((t) => {
            const space = SPACES[t];
            return (
              <li key={t}>
                <Link className="type-row" to={`/reserve/${t}`}>
                  <SpaceImage space={space} />
                  <span className="type-row__body">
                    <span className="type-row__name" lang="en">{space.name}</span>
                    <span className="type-row__headline">{space.headline}</span>
                    <span className="type-row__features">
                      {space.highlights.map((h) => <span key={h.label}><Icon name={h.icon} size={13} />{h.label}</span>)}
                    </span>
                    <span className="type-row__facts">
                      <span><strong lang="en">{store.units[t]}</strong>{space.unitName === '공간' ? '실' : '석'}</span>
                      <span><strong lang="en">{space.minHours}~{space.maxHours}</strong>시간</span>
                      <span><strong lang="en">{space.pricePerHour.toLocaleString('ko-KR')}</strong>원/시간</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link to="/order" className="notice-row">
          <Icon name="cup" size={20} />
          <span>Flow Cafe는 예약 없이 음료 주문 후 이용해요</span>
          <Icon name="chevron" size={18} />
        </Link>
      </div>
    </>
  );
}

function CafeNotice() {
  return (
    <>
      <AppBar back title="Flow Cafe" />
      <div className="screen-body center-state">
        <h2 className="screen-title">Flow Cafe는<br />예약이 없어요</h2>
        <p className="muted">{SPACES.cafe.summary}</p>
      </div>
      <BottomBar><Link className="button button--primary button--block" to="/order">음료 주문하기</Link></BottomBar>
    </>
  );
}

const DRINK_CAT_INTRO = {
  coffee: 'ICE·HOT과 샷 추가는 고른 뒤 다음 화면에서 정해요',
  'non-coffee': '커피 없이 부드럽게 즐기는 한 잔',
  'ade-tea': '상큼한 에이드와 차분한 차',
};

// 예약 음료 옵션 화면 (2026-10-21 사용자 요청): 옵션만 — 아이스·핫(음료 상세와 같은 구성), 샷 추가(커피)·텀블러 사용.
function DrinkOptions({ drink, temp, onTemp, shot, onShot, ownCup, onOwnCup, included, onBack }) {
  const onlyTemp = TEMPS.find((t) => t.value === fixedTemp(drink));
  return (
    <>
      <h2 className="screen-title">옵션을<br />골라 주세요</h2>
      <p className="muted">{drink.name} · {included ? '이용료에 포함' : formatWon(drink.price)} <Provisional note={MENU.note} /></p>
      {/* 아이스·핫: 음료 상세와 같은 구성 (필수 · 세그먼트 · 가격 안내) */}
      {needsTemp(drink) && (
        <section className="drink-temp" aria-labelledby="resv-opt-temp">
          <p id="resv-opt-temp" className="group-title">아이스 · 핫 <span className="sheet-required">필수</span></p>
          <Segmented label="온도" name="resv-temp" value={temp} onChange={onTemp} options={TEMPS.map((t) => ({ value: t.value, label: t.label }))} />
          <p className="group-hint">가격은 같아요</p>
        </section>
      )}
      {onlyTemp && (
        <p className="drink-temp-only">
          <span className="temp-chip" data-temp={onlyTemp.value}>{onlyTemp.short}</span>
          {onlyTemp.value === 'hot' ? '따뜻하게만 준비돼요' : '차갑게만 준비돼요'}
        </p>
      )}
      {/* 샷 추가(커피만) · 텀블러: 음료 상세 옵션 창과 같은 항목 */}
      <section className="drink-opts" aria-label="추가 옵션">
        <p className="group-title">추가 옵션</p>
        <div className="list-card">
          {canAddShot(drink) && (
            <div className="list-row drink-opts__row">
              <span className="option-row__text">
                <span className="option-row__label">샷 추가</span>
                <span className="option-row__detail">1회 +{formatWon(SHOT_PRICE.value)} · 최대 {MAX_SHOTS}회 <Provisional note={SHOT_PRICE.note} /></span>
              </span>
              <Stepper label="샷 추가" value={shot} onChange={onShot} min={0} max={MAX_SHOTS} />
            </div>
          )}
          <SwitchRow
            label={included ? '텀블러 사용' : `텀블러 사용 · ${formatWon(OWN_CUP_DISCOUNT)} 할인`}
            detail={included ? '가져온 텀블러·개인컵에 담아 드려요 (포함 음료라 할인은 없어요)' : '가져온 텀블러·개인컵에 담아 드려요'}
            checked={ownCup}
            onChange={onOwnCup}
          />
        </div>
        {included && canAddShot(drink) && <p className="group-hint">기본 음료는 포함이고, 샷 추가 금액만 방문 후 함께 결제해요.</p>}
      </section>
      <button type="button" className="resv-drink-back" onClick={onBack}>다른 음료 고르기</button>
    </>
  );
}

const DRINK_TITLE = { included: <>기본 음료를<br />골라 주세요</>, required: <>이용 전 음료를<br />골라 주세요</> };

function ReserveWizard({ type }) {
  const space = SPACES[type];
  const now = useNow();
  const navigate = useNavigate();
  const { reservations, myReservations, addReservation, storeId: homeStoreId } = useAppData();
  // 다시 예약(?from=예약id): 지난 예약의 매장·시작 시각·이용 시간·좌석·음료를 채우고 날짜만 새로 고른다 (필수 규칙 1)
  const [params] = useSearchParams();
  const from = myReservations.find((r) => r.id === params.get('from') && r.type === type) ?? null;
  const fromDrink = from ? getDrink(from.drinkId) : null;
  const dates = useMemo(() => windowDates(now, type), [now, type]);
  const firstOpen = dates.find((d) => !isHoliday(d) && !hasReservationOn(d, myReservations));
  const today = toDateString(now);

  const steps = type === 'suite'
    ? ['날짜', '시간', '공간', '음료', '확인']
    : ['날짜', '시간', '좌석', type === 'rest' ? '음료·요청' : '음료', '확인'];
  const [step, setStep] = useState(0);
  // 매장은 홈에서 고른 매장으로 시작한다 (필수 규칙 4). 이 예약에서만 바꿀 수 있다.
  const [storeId, setStoreId] = useState(from?.storeId ?? homeStoreId);
  const [date, setDate] = useState(firstOpen ?? dates[0]);
  const [start, setStart] = useState(null);
  const [hours, setHours] = useState(space.minHours);
  const [unit, setUnit] = useState(null);
  const [drinkId, setDrinkId] = useState(fromDrink ? fromDrink.id : null);
  const [drinkTemp, setDrinkTemp] = useState(fromDrink && needsTemp(fromDrink) ? from.drinkTemp : null);
  const drinkNeedsTemp = needsTemp(getDrink(drinkId));
  const [requests, setRequests] = useState(from?.requests ?? []);
  // 음료 옵션: 샷 추가(커피)·텀블러 — 다시 예약이면 지난 옵션으로 시작
  const [drinkShot, setDrinkShot] = useState(from?.drinkShot ?? 0);
  const [drinkOwnCup, setDrinkOwnCup] = useState(!!from?.drinkOwnCup);
  // 음료 단계: 주문 탭과 같은 카테고리 탭 + 사진 카드. ICE/HOT 음료를 고르면 옵션 화면(drinkDetail)으로 넘어간다
  const [drinkCat, setDrinkCat] = useState(fromDrink?.category ?? MENU_CATEGORIES[0].id);
  const [drinkDetail, setDrinkDetail] = useState(false);
  const [errors, setErrors] = useState([]);
  const [usePoints, setUsePoints] = useState(false);

  const free = (s, h) => freeUnits({ storeId, type, date, start: s, hours: h }, reservations);
  const starts = startOptions(type, date, now);

  // 시작 시간 기준으로 마감과 빈 좌석을 함께 고려한 최대 이용 시간
  const maxHoursFor = (s) => {
    let max = 0;
    for (let h = space.minHours; h <= space.maxHours; h += 1) {
      if (s + h * 60 > lastEndFor(type) || free(s, h).length === 0) break;
      max = h;
    }
    return max;
  };
  const maxHours = start != null ? maxHoursFor(start) : space.maxHours;
  const freeNow = start != null ? free(start, hours) : [];

  const clearTime = () => { setStart(null); setHours(space.minHours); setUnit(null); setErrors([]); };

  const fee = start != null ? reservationFee(type, hours) : 0;
  const drinkCost = drinkId ? drinkFee(type, drinkId, { shot: drinkShot, ownCup: drinkOwnCup }) : 0;
  // 포인트는 좌석 이용료에만 쓸 수 있다 (음료 금액 제외)
  const balance = pointBalance(myReservations, now);
  const pointsUsed = usePoints ? usablePoints(balance, fee) : 0;
  const stepName = steps[step];
  const canNext = {
    날짜: !isHoliday(date) && !hasReservationOn(date, myReservations),
    시간: start != null && maxHours >= space.minHours,
    공간: unit != null,
    좌석: unit != null,
    음료: drinkId != null && (!drinkNeedsTemp || drinkTemp != null),
    '음료·요청': drinkId != null && (!drinkNeedsTemp || drinkTemp != null),
    확인: true,
  }[stepName];

  const go = (next) => {
    // 다시 예약: 다음 단계로 넘어갈 때 지난 예약의 시간·좌석이 지금도 가능하면 채운다 (안 되면 비워 두고 직접 고른다)
    if (from && next > step) {
      const nextName = steps[next];
      if (nextName === '시간' && start == null && starts.includes(from.start) && maxHoursFor(from.start) >= space.minHours) {
        setStart(from.start);
        setHours(Math.min(from.hours, maxHoursFor(from.start)));
      }
      if ((nextName === '좌석' || nextName === '공간') && unit == null && freeNow.includes(from.unit)) setUnit(from.unit);
    }
    setDrinkDetail(false);
    setStep(next);
    window.scrollTo(0, 0);
  };

  // 음료를 고르면 옵션 화면으로: 아이스·핫(해당 음료만) → 샷 추가(커피만) → 텀블러 사용
  const pickDrink = (d) => {
    const same = d.id === drinkId;
    setDrinkId(d.id);
    // 주문 탭과 같이 사진에 보이는 온도(HOT)로 시작하고, 같은 음료를 다시 고르면 고른 옵션을 유지한다
    setDrinkTemp((prev) => (needsTemp(d) ? (same && prev ? prev : drinkTemps(d)[0]) : null));
    if (!same) setDrinkShot(0);
    setDrinkDetail(true);
    window.scrollTo(0, 0);
  };

  const submit = () => {
    const result = createReservation(
      { type, storeId, date, start, hours, unit, drinkId, drinkTemp, drinkShot, drinkOwnCup, requests, mine: myReservations, pointsUsed },
      reservations,
      new Date(),
    );
    if (result.errors.length) {
      setErrors(result.errors);
      return;
    }
    addReservation(result.reservation);
    navigate(`/reservations/${result.reservation.id}?new=1`, { replace: true });
  };

  const store = STORES.value.find((s) => s.id === storeId);
  const endLabel = start != null ? formatTime(start + hours * 60) : '';

  return (
    <>
      <AppBar back={drinkDetail ? () => { setDrinkDetail(false); window.scrollTo(0, 0); } : step > 0 ? () => go(step - 1) : true} title={space.name} />
      <StepProgress steps={steps} current={step} label="예약 진행" />
      <div className="screen-body has-bottom-bar">
        {/* 지금 예약 중인 공간: 작은 아치형 사진 + Fraunces 이름 + 브랜드 문구 (모든 단계 공통) */}
        <div className="reserve-space">
          <SpaceImage space={space} />
          <span>
            <span className="reserve-space__name" lang="en">{space.name}</span>
            <span className="reserve-space__headline">{space.headline}</span>
          </span>
        </div>
        {stepName === '날짜' && (
          <>
            <h2 className="screen-title">언제 방문하세요?</h2>
            {from && (
              <p className="inline-status rebook-note">
                <Icon name="repeat" size={16} />
                {formatDate(from.date)} 예약({space.name} {from.unit}번 · {formatTime(from.start)}부터 {from.hours}시간)을 바탕으로 채워요. 날짜만 골라 주세요.
              </p>
            )}
            <section className="block">
              <p className="group-title">매장 <Provisional note={STORES.note} /></p>
              <Segmented
                label="매장"
                name="store"
                value={storeId}
                onChange={(v) => { setStoreId(v); clearTime(); }}
                options={STORES.value.map((s) => ({ value: s.id, label: s.name }))}
              />
              <p className="group-hint">{space.unitName} {store.units[type]}개 운영</p>
            </section>
            <section className="block">
              <fieldset className="option-group">
                <legend className="group-title">날짜</legend>
                <div className="date-strip">
                  {dates.map((d, i) => {
                    const [, m, day, dow] = formatDate(d).match(/(\d+)월 (\d+)일 \((.)\)/);
                    const blocked = isHoliday(d) ? '휴무' : hasReservationOn(d, myReservations) ? '예약 있음' : null;
                    return (
                      <label key={d} className="date-chip" data-weekend={dow === '토' || dow === '일' || undefined} data-disabled={blocked || undefined}>
                        <input type="radio" name="date" value={d} checked={date === d} disabled={!!blocked} onChange={() => { setDate(d); clearTime(); }} aria-label={`${formatDate(d)}${blocked ? ` · ${blocked}` : ''}`} />
                        <span className="date-chip__dow" aria-hidden="true">{d === today ? '오늘' : dow}</span>
                        <span className="date-chip__day" aria-hidden="true">{day}</span>
                        <span className="date-chip__month" aria-hidden="true">{blocked ?? `${m}월`}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="group-hint">
                  옆으로 밀어 {space.sameDayApp ? '오늘' : '내일'}부터 {formatDate(dates.at(-1))}까지 고를 수 있어요
                  {!space.sameDayApp && <><br />{space.sameDayNote}</>}
                  <br />공휴일은 휴무이고, 한 사람은 같은 날 1개의 좌석만 예약할 수 있어요.
                </p>
              </fieldset>
            </section>
          </>
        )}

        {stepName === '시간' && (
          <>
            <h2 className="screen-title">몇 시부터 몇 시까지<br />이용하세요?</h2>
            <p className="muted">{formatDate(date)} · {store.name}</p>
            <TimeRange
              type={type}
              date={date}
              now={now}
              start={start}
              hours={hours}
              canStart={(s) => starts.includes(s) && free(s, space.minHours).length > 0}
              maxHoursFor={maxHoursFor}
              onChange={(s, h) => { setStart(s); setHours(h); setUnit(null); }}
              onClear={clearTime}
              empty={starts.length === 0 && (space.minHours > 1
                ? `최소 ${space.minHours}시간을 ${formatTime(lastEndFor(type))} 종료 전에 채울 수 없어 오늘은 예약할 수 없어요. 날짜를 바꿔 주세요.`
                : '오늘은 예약 가능한 시간이 지났어요. 날짜를 바꿔 주세요.')}
            />
            {start != null && type !== 'suite' && (
              <p className="inline-status"><Icon name="check" size={16} />남은 {space.unitName} {freeNow.length}개 · 다음 단계에서 {space.unitName}을 골라요</p>
            )}
          </>
        )}

        {stepName === '공간' && (
          <>
            <h2 className="screen-title">어느 Suite를<br />사용할까요?</h2>
            <p className="muted">{formatDate(date)} · {formatTime(start)}–{endLabel}</p>
            <SeatMap type={type} count={store.units[type]} value={unit} onChange={setUnit} isFree={(n) => freeNow.includes(n)} />
            <SuiteRooms storeId={storeId} date={date} start={start} hours={hours} value={unit} onChange={setUnit} free={freeNow} reservations={reservations} />
          </>
        )}

        {stepName === '좌석' && (
          <>
            <h2 className="screen-title">어느 {space.unitName}에<br />앉을까요?</h2>
            <p className="muted">{formatDate(date)} · {formatTime(start)}–{endLabel} · {store.name}</p>
            <SeatMap type={type} count={store.units[type]} value={unit} onChange={setUnit} isFree={(n) => freeNow.includes(n)} />
            <p className="group-hint">앱 예약은 직접 고르고, 매장 방문은 자동 배정돼요.</p>
          </>
        )}

        {(stepName === '음료' || stepName === '음료·요청') && drinkDetail && getDrink(drinkId) && (
          <DrinkOptions drink={getDrink(drinkId)} temp={drinkTemp} onTemp={setDrinkTemp} shot={drinkShot} onShot={setDrinkShot} ownCup={drinkOwnCup} onOwnCup={setDrinkOwnCup} included={space.drink === 'included'} onBack={() => { setDrinkDetail(false); window.scrollTo(0, 0); }} />
        )}

        {(stepName === '음료' || stepName === '음료·요청') && !drinkDetail && (
          <>
            <h2 className="screen-title">{DRINK_TITLE[space.drink]}</h2>
            <p className="muted">
              {space.drink === 'included'
                ? '이용료에 포함돼요(예약당 1잔). 이용 중 아메리카노·카페라떼 1잔 무료 리필 1회, 이후 재주문 50% 할인 쿠폰 최대 2회.'
                : '방문 후 이용료와 함께 결제해요. 이용 시작부터 재주문에 50% 할인 쿠폰을 최대 2회 드려요.'}
            </p>
            <div className="text-tabs" role="tablist" aria-label="음료 카테고리">
              {MENU_CATEGORIES.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={drinkCat === c.id} onClick={() => setDrinkCat(c.id)}>{c.label}</button>
              ))}
            </div>
            <p className="shelf-reason order-intro swap" key={`intro-${drinkCat}`}>
              <span className="shelf-reason__kicker" lang="en">{MENU_CATEGORIES.find((c) => c.id === drinkCat).en}</span>
              {DRINK_CAT_INTRO[drinkCat]} <Provisional note={MENU.note} />
            </p>
            {/* 한 줄에 하나씩 목록. 누르면 옵션 화면(아이스·핫 · 샷 · 텀블러)으로, 고른 음료는 체크 */}
            <ul className="drink-list swap" key={drinkCat} aria-label={`${MENU_CATEGORIES.find((c) => c.id === drinkCat).label} 음료`}>
              {MENU.value.filter((d) => d.category === drinkCat).map((d) => {
                const selected = drinkId === d.id;
                const withTemp = needsTemp(d);
                return (
                  <li key={d.id}>
                    <button type="button" className="drink-row" aria-pressed={selected} onClick={() => pickDrink(d)}
                      aria-label={`${d.name}, ${space.drink === 'included' ? '포함' : formatWon(d.price)}, 옵션 고르기로 이동${selected ? ', 선택됨' : ''}`}>
                      <DrinkThumb drink={d} temp={withTemp ? (selected && drinkTemp ? drinkTemp : drinkTemps(d)[0]) : null} size="sm" />
                      <span className="drink-row__text">
                        <span className="drink-row__name">
                          {d.name}
                          {selected && drinkTemp && <span className="temp-chip" data-temp={drinkTemp}>{TEMPS.find((t) => t.value === drinkTemp).short}</span>}
                        </span>
                        <span className="drink-row__desc">{d.desc}</span>
                        <span className="drink-row__price">{space.drink === 'included' ? '이용료에 포함' : <><span lang="en">{d.price.toLocaleString('ko-KR')}</span>원</>}</span>
                      </span>
                      {!selected
                        ? <Icon name="chevron" size={20} className="drink-row__go" />
                        : <span className="drink-row__check" aria-hidden="true"><Icon name="check" size={16} /></span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            {space.requests.length > 0 && (
              <section className="block">
                <p className="group-title">무료 요청</p>
                <div className="list-card">
                  {space.requests.map((r) => (
                    <SwitchRow
                      key={r.id}
                      label={r.label}
                      detail="무료"
                      checked={requests.includes(r.id)}
                      onChange={(on) => setRequests((prev) => (on ? [...prev, r.id] : prev.filter((x) => x !== r.id)))}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {stepName === '확인' && (
          <>
            <h2 className="screen-title">예약 내용을<br />확인해 주세요</h2>
            <dl className="kv summary-card">
              <div><dt>공간</dt><dd>{space.name} {unit}번{seatZone(type, store.units[type], unit) && ` · ${seatZone(type, store.units[type], unit).label}`}</dd></div>
              <div><dt>매장</dt><dd>{store.name}</dd></div>
              <div><dt>일시</dt><dd>{formatDate(date)}<br />{formatTime(start)}–{endLabel} ({hours}시간)</dd></div>
              <div><dt>이용료 <Provisional note={SEAT_PRICES.note} /></dt><dd>{formatWon(space.pricePerHour)} × {hours}시간</dd></div>
              <div><dt>음료</dt><dd>{drinkLabel(drinkId, drinkNeedsTemp ? drinkTemp : null)}{drinkOptionsText({ type, drinkShot, drinkOwnCup }) && <><br /><small className="kv__sub">{drinkOptionsText({ type, drinkShot, drinkOwnCup })}</small></>}<br />{space.drink === 'included' ? (drinkCost ? `포함 · 샷 추가 ${formatWon(drinkCost)}` : '포함') : formatWon(drinkCost)}</dd></div>
              {requests.length > 0 && <div><dt>무료 요청</dt><dd>{requests.map((id) => space.requests.find((r) => r.id === id).label).join(', ')}</dd></div>}
              {pointsUsed > 0 && <div><dt>포인트 사용</dt><dd>−{formatWon(pointsUsed)}</dd></div>}
              <div className="kv__total"><dt>결제 예정</dt><dd>{formatWon(fee - pointsUsed + drinkCost)}</dd></div>
            </dl>
            <SwitchRow
              label={`포인트 사용 · 보유 ${balance.toLocaleString('ko-KR')}P`}
              detail={balance > 0 ? '좌석 이용료에만 쓸 수 있어요. 음료 금액에는 쓸 수 없어요.' : '이용을 시작하면 좌석 이용료의 10%가 적립돼요.'}
              checked={usePoints && balance > 0}
              onChange={(v) => balance > 0 && setUsePoints(v)}
            />
            <p className="group-hint">이번 예약으로 적립 예정: 포인트 {pointsEarnedFor({ fee, pointsUsed }).toLocaleString('ko-KR')}P · 스탬프 1개 (이용 시작 후)</p>
            <ul className="note-list">
              <li>{PAYMENT_POLICY}</li>
              <li>{CANCEL_POLICY}</li>
              <li>{extensionNote(type)}</li>
            </ul>
            {errors.length > 0 && (
              <div className="form-errors" role="alert">
                <Icon name="alert" size={20} />
                <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
              </div>
            )}
          </>
        )}
      </div>

      <BottomBar>
        <div className="price">
          <span className="price__label">결제 예정</span>
          <span className="price__value" key={fee - pointsUsed + drinkCost}>{formatWon(fee - pointsUsed + drinkCost)}</span>
        </div>
        {stepName === '확인' ? (
          <button type="button" className="button button--primary" onClick={submit}>예약하기</button>
        ) : (
          <button type="button" className="button button--primary" disabled={!canNext} onClick={() => go(step + 1)}>다음</button>
        )}
      </BottomBar>
    </>
  );
}

// Suite 공간별 가능 시간 조회
// 이용 시간: 1시간 칸을 눌러 고른다. 첫 칸 = 시작, 이어서 누른 칸 = 끝 (시작 기준 최대 maxHours칸).
// 시작을 누르면 최소 시간만큼 바로 채우고, 늘릴 수 있는 칸은 점선으로 보여 준다.
// 범위 밖 칸을 누르면 그 칸부터 새로 시작하고, 시작 칸을 다시 누르면 최소 시간으로 줄인다(이미 최소면 선택 해제).
function TimeRange({ type, date, now, start, hours, canStart, maxHoursFor, onChange, onClear, empty }) {
  const space = SPACES[type];
  const isToday = date === toDateString(now);
  const slots = [];
  for (let t = HOURS.open; t + 60 <= lastEndFor(type); t += 60) {
    if (isToday && t <= minutesOfDay(now)) continue;
    slots.push(t);
  }
  const reach = start != null ? maxHoursFor(start) : 0; // 시작 기준으로 실제 고를 수 있는 최대 시간(마감·빈 좌석 반영)
  const end = start != null ? start + hours * 60 : null;
  const inReach = (t) => start != null && t >= start && t + 60 <= start + reach * 60;

  const pick = (t) => {
    if (inReach(t)) {
      const h = Math.max(space.minHours, (t - start) / 60 + 1);
      if (t === start && hours === space.minHours) onClear();
      else onChange(start, h);
    } else if (canStart(t)) {
      onChange(t, space.minHours);
    }
  };

  if (empty) return <div className="empty-state">{empty}</div>;

  return (
    <section className="time-range" aria-labelledby="time-range-title">
      <div className="time-range__summary" aria-live="polite">
        <p id="time-range-title" className="group-title">이용 시간</p>
        {start != null ? (
          <>
            <p className="time-range__value" lang="en">{formatTime(start)} – {formatTime(end)}</p>
            <p className="group-hint"><strong>{hours}시간</strong> · 최소 {space.minHours}시간 · 최대 {space.maxHours}시간{reach < space.maxHours ? ` (이 시작 시간은 최대 ${reach}시간)` : ''}</p>
          </>
        ) : (
          <>
            <p className="time-range__value time-range__value--empty">시작 시간을 눌러 주세요</p>
            <p className="group-hint">시작 칸을 누른 뒤, 끝나는 칸을 눌러 최대 {space.maxHours}시간까지 골라요</p>
          </>
        )}
      </div>
      <p className="group-hint">1시간 단위 · {formatTime(lastEndFor(type))} 종료까지 · {formatTime(HOURS.checkout)} 퇴실</p>
      <div className="time-grid" role="group" aria-label="시간 칸">
        {slots.map((t) => {
          const selected = start != null && t >= start && t < end;
          const state = selected ? (t === start ? 'start' : t + 60 === end ? 'end' : 'in') : inReach(t) ? 'reach' : canStart(t) ? 'open' : 'off';
          const label = `${formatTime(t)}–${formatTime(t + 60)}`;
          const action = selected ? (t === start ? '시작 시간' : '선택됨') : inReach(t) ? '여기까지 늘리기' : canStart(t) ? '여기부터 시작' : '예약 불가';
          return (
            <button key={t} type="button" className="time-slot" data-state={state} disabled={state === 'off'} aria-pressed={selected} aria-label={`${label}, ${action}`} onClick={() => pick(t)}>
              <span lang="en">{formatTime(t)}</span>
              {state === 'start' && <small>시작</small>}
              {state === 'end' && <small lang="en">~{formatTime(end)}</small>}
              {state === 'off' && <small>마감</small>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SuiteRooms({ storeId, date, start, hours, value, onChange, free, reservations }) {
  const open = HOURS.open;
  const end = HOURS.lastEnd;
  const pct = (m) => `${((m - open) / (end - open)) * 100}%`;

  return (
    <fieldset className="option-group">
      <legend className="group-title">공간별 예약 현황</legend>
      <p className="group-hint">막대의 진한 구간은 이미 예약된 시간, 테두리는 선택한 시간이에요. 여기서 골라도 돼요.</p>
      <div className="option-list">
        {unitIds(storeId, 'suite').map((room) => {
          const booked = bookedRanges({ storeId, type: 'suite', date, unit: room }, reservations);
          const available = free.includes(room);
          return (
            <label key={room} className="option-row room-row" data-disabled={!available || undefined}>
              <input type="radio" name="room" value={room} checked={value === room} disabled={!available} onChange={() => onChange(room)} />
              <span className="option-row__text">
                <span className="option-row__label">{room}번 Suite</span>
                <span className="option-row__detail">{available ? '선택 가능' : '선택한 시간에 예약 있음'}</span>
              </span>
              <span className="option-row__check" aria-hidden="true"><Icon name="check" size={18} /></span>
              <span className="timeline" aria-hidden="true">
                {booked.map((b) => <span key={b.start} className="timeline__booked" style={{ left: pct(b.start), width: `calc(${pct(b.end)} - ${pct(b.start)})` }} />)}
                <span className="timeline__pick" style={{ left: pct(start), width: `calc(${pct(start + hours * 60)} - ${pct(start)})` }} />
              </span>
              <span className="visually-hidden">
                {booked.length ? `예약된 시간: ${booked.map((b) => `${formatTime(b.start)}–${formatTime(b.end)}`).join(', ')}` : '예약 없음'}
              </span>
            </label>
          );
        })}
      </div>
      <div className="timeline-scale" aria-hidden="true"><span>{formatTime(open)}</span><span>{formatTime(end)}</span></div>
    </fieldset>
  );
}
