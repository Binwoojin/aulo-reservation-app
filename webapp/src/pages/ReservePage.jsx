import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BOOKING_WINDOW_DAYS,
  CANCEL_POLICY,
  HOURS,
  MENU,
  PAYMENT_POLICY,
  SPACES,
  STORES,
} from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import {
  ChipGrid,
  OptionList,
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
  bookableDates,
  bookedRanges,
  createReservation,
  drinkFee,
  freeUnits,
  isSuiteSameDayBlocked,
  lastEndFor,
  reservationFee,
  startOptions,
  unitIds,
} from '../lib/reservation.js';
import { formatDate, formatTime, formatWon } from '../lib/time.js';

const RESERVABLE = ['focus', 'rest', 'suite'];

export default function ReservePage() {
  const { type } = useParams();
  if (type === 'cafe') return <CafeNotice />;
  if (!RESERVABLE.includes(type)) return <TypePicker />;
  return <ReserveWizard key={type} type={type} />;
}

function TypePicker() {
  return (
    <>
      <AppBar title="공간 예약" />
      <div className="screen-body">
        <h2 className="screen-title">어떤 공간을<br />예약할까요?</h2>
        <ul className="type-list">
          {RESERVABLE.map((t) => (
            <li key={t}>
              <Link className="type-row" to={`/reserve/${t}`}>
                <SpaceImage space={SPACES[t]} />
                <span className="type-row__body">
                  <Tag type={t}>{SPACES[t].label}</Tag>
                  <span className="type-row__name" lang="en">{SPACES[t].name}</span>
                  <span className="type-row__meta">{formatWon(SPACES[t].pricePerHour)}/시간 · {SPACES[t].minHours}~{SPACES[t].maxHours}시간</span>
                </span>
                <Icon name="chevron" size={18} className="list-row__chev" />
              </Link>
            </li>
          ))}
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

const DRINK_TITLE = { included: <>기본 음료를<br />골라 주세요</>, required: <>이용 전 음료를<br />골라 주세요</> };

function ReserveWizard({ type }) {
  const space = SPACES[type];
  const now = useNow();
  const navigate = useNavigate();
  const { reservations, addReservation } = useAppData();
  const dates = useMemo(() => bookableDates(now), [now]);

  const steps = type === 'suite'
    ? ['날짜', '시간', '공간', '음료', '확인']
    : ['날짜', '시간', type === 'rest' ? '음료·요청' : '음료', '확인'];
  const [step, setStep] = useState(0);
  const [storeId, setStoreId] = useState(STORES.value[0].id);
  const [date, setDate] = useState(dates[0]);
  const [start, setStart] = useState(null);
  const [hours, setHours] = useState(space.minHours);
  const [unit, setUnit] = useState(null);
  const [drinkId, setDrinkId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [errors, setErrors] = useState([]);

  const free = (s, h) => freeUnits({ storeId, type, date, start: s, hours: h }, reservations);
  const starts = startOptions(type, date, now);
  const suiteBlocked = type === 'suite' && isSuiteSameDayBlocked(date, now);

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
  const drinkCost = drinkId ? drinkFee(type, drinkId) : 0;
  const stepName = steps[step];
  const canNext = {
    날짜: true,
    시간: start != null && maxHours >= space.minHours,
    공간: unit != null,
    음료: drinkId != null,
    '음료·요청': drinkId != null,
    확인: true,
  }[stepName];

  const go = (next) => { setStep(next); window.scrollTo(0, 0); };

  const submit = () => {
    const result = createReservation(
      { type, storeId, date, start, hours, unit: type === 'suite' ? unit : null, drinkId, requests },
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
      <AppBar back={step > 0 ? () => go(step - 1) : true} title={space.name} />
      <StepProgress steps={steps} current={step} label="예약 진행" />
      <div className="screen-body has-bottom-bar">
        {stepName === '날짜' && (
          <>
            <h2 className="screen-title">언제 방문하세요?</h2>
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
                <legend className="group-title">날짜 <Provisional note={BOOKING_WINDOW_DAYS.note} /></legend>
                <div className="date-strip">
                  {dates.map((d, i) => {
                    const [, m, day, dow] = formatDate(d).match(/(\d+)월 (\d+)일 \((.)\)/);
                    return (
                      <label key={d} className="date-chip" data-weekend={dow === '토' || dow === '일' || undefined}>
                        <input type="radio" name="date" value={d} checked={date === d} onChange={() => { setDate(d); clearTime(); }} aria-label={formatDate(d)} />
                        <span className="date-chip__dow" aria-hidden="true">{i === 0 ? '오늘' : dow}</span>
                        <span className="date-chip__day" aria-hidden="true">{day}</span>
                        <span className="date-chip__month" aria-hidden="true">{m}월</span>
                      </label>
                    );
                  })}
                </div>
                <p className="group-hint">옆으로 밀어 오늘부터 {BOOKING_WINDOW_DAYS.value}일 후까지 고를 수 있어요</p>
              </fieldset>
            </section>
          </>
        )}

        {stepName === '시간' && (
          <>
            <h2 className="screen-title">몇 시부터<br />이용하세요?</h2>
            <p className="muted">{formatDate(date)} · {store.name}</p>
            <ChipGrid
              legend="시작 시간"
              name="start"
              value={start}
              onChange={(v) => { setStart(v); setHours(space.minHours); setUnit(null); }}
              options={starts.map((s) => {
                const ok = free(s, space.minHours).length > 0;
                return { value: s, label: formatTime(s), disabled: !ok, detail: ok ? undefined : '마감' };
              })}
              hint={<>1시간 단위 · {formatTime(lastEndFor(type))} 종료까지 <Provisional note={(type === 'suite' ? HOURS.suiteLastEnd : HOURS.focusRestLastEnd).note} /></>}
              empty={suiteBlocked
                ? '마감까지 3시간 이하가 남아 오늘은 Suite 신규 예약을 받지 않아요. 날짜를 바꿔 주세요.'
                : '오늘은 예약 가능한 시간이 지났어요. 날짜를 바꿔 주세요.'}
            />
            {start != null && (
              <section className="duration-card" aria-labelledby="duration-title">
                <div>
                  <p id="duration-title" className="group-title">이용 시간</p>
                  <p className="duration-card__range">{formatTime(start)} – {endLabel}</p>
                  <p className="group-hint">최소 {space.minHours}시간 · 최대 {space.maxHours}시간</p>
                </div>
                <Stepper
                  label="이용 시간"
                  value={hours}
                  onChange={(v) => { setHours(v); setUnit(null); }}
                  min={space.minHours}
                  max={maxHours}
                  format={(v) => `${v}시간`}
                />
              </section>
            )}
            {start != null && type !== 'suite' && (
              <p className="inline-status"><Icon name="check" size={16} />남은 {space.unitName} {freeNow.length}개 · 빈 {space.unitName}이 자동 배정돼요</p>
            )}
          </>
        )}

        {stepName === '공간' && (
          <>
            <h2 className="screen-title">어느 Suite를<br />사용할까요?</h2>
            <p className="muted">{formatDate(date)} · {formatTime(start)}–{endLabel}</p>
            <SuiteRooms storeId={storeId} date={date} start={start} hours={hours} value={unit} onChange={setUnit} free={freeNow} reservations={reservations} />
          </>
        )}

        {(stepName === '음료' || stepName === '음료·요청') && (
          <>
            <h2 className="screen-title">{DRINK_TITLE[space.drink]}</h2>
            <p className="muted">
              {space.drink === 'included'
                ? '이용료에 포함돼요. 1회 무료 리필, 이후 정상가 주문 다음 주문은 50% 할인.'
                : '방문 후 이용료와 함께 결제해요. 이용 중 추가 음료는 50% 할인.'}
            </p>
            <OptionList
              legend={<>음료 <Provisional note={MENU.note} /></>}
              name="drink"
              value={drinkId}
              onChange={setDrinkId}
              options={MENU.value.map((d) => ({
                value: d.id,
                label: d.name,
                trailing: space.drink === 'included' ? '포함' : formatWon(d.price),
              }))}
            />
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
              <div><dt>공간</dt><dd>{space.name}{type === 'suite' ? ` ${unit}번` : ''}</dd></div>
              <div><dt>매장</dt><dd>{store.name}</dd></div>
              <div><dt>일시</dt><dd>{formatDate(date)}<br />{formatTime(start)}–{endLabel} ({hours}시간)</dd></div>
              <div><dt>이용료</dt><dd>{formatWon(space.pricePerHour)} × {hours}시간</dd></div>
              <div><dt>음료</dt><dd>{MENU.value.find((d) => d.id === drinkId)?.name} · {space.drink === 'included' ? '포함' : formatWon(drinkCost)}</dd></div>
              {requests.length > 0 && <div><dt>무료 요청</dt><dd>{requests.map((id) => space.requests.find((r) => r.id === id).label).join(', ')}</dd></div>}
              <div className="kv__total"><dt>결제 예정</dt><dd>{formatWon(fee + drinkCost)}</dd></div>
            </dl>
            <ul className="note-list">
              <li>{PAYMENT_POLICY}</li>
              <li>{CANCEL_POLICY}</li>
              <li>{space.extension}</li>
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
          <span className="price__value">{formatWon(fee + drinkCost)}</span>
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
function SuiteRooms({ storeId, date, start, hours, value, onChange, free, reservations }) {
  const open = HOURS.open.value;
  const end = HOURS.suiteLastEnd.value;
  const pct = (m) => `${((m - open) / (end - open)) * 100}%`;

  return (
    <fieldset className="option-group">
      <legend className="group-title">Suite 공간</legend>
      <p className="group-hint">막대의 진한 구간은 이미 예약된 시간, 테두리는 선택한 시간이에요.</p>
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
