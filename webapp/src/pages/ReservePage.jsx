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
import { ChoiceGroup, Provisional, SpaceImage, Tag } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import {
  bookableDates,
  bookedRanges,
  createReservation,
  drinkFee,
  durationOptions,
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
  if (!type) return <TypePicker />;
  if (type === 'cafe') return <CafeNotice />;
  if (!RESERVABLE.includes(type)) return <TypePicker />;
  return <ReserveForm key={type} type={type} />;
}

function TypePicker() {
  return (
    <div className="container page">
      <p className="section-label" lang="en">RESERVE</p>
      <h1 className="page-title">어떤 공간을 예약할까요?</h1>
      <ul className="type-grid">
        {RESERVABLE.map((t) => (
          <li key={t}>
            <Link className="type-card" to={`/reserve/${t}`}>
              <SpaceImage space={SPACES[t]} />
              <span className="type-card__body">
                <Tag type={t}>{SPACES[t].label}</Tag>
                <span className="type-card__name" lang="en">{SPACES[t].name}</span>
                <span className="type-card__meta">시간당 {formatWon(SPACES[t].pricePerHour)} · {SPACES[t].minHours}~{SPACES[t].maxHours}시간</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="note">Flow Cafe는 예약 없이 음료 주문 후 이용합니다. <Link to="/order">음료 주문하기</Link></p>
    </div>
  );
}

function CafeNotice() {
  return (
    <div className="container page">
      <h1 className="page-title">Flow Cafe는 예약이 없어요</h1>
      <p className="lead">{SPACES.cafe.summary}</p>
      <Link className="button button--primary" to="/order">음료 주문하기</Link>
    </div>
  );
}

function ReserveForm({ type }) {
  const space = SPACES[type];
  const now = useNow();
  const navigate = useNavigate();
  const { reservations, addReservation } = useAppData();
  const dates = useMemo(() => bookableDates(now), [now]);

  const [storeId, setStoreId] = useState(STORES.value[0].id);
  const [date, setDate] = useState(dates[0]);
  const [start, setStart] = useState(null);
  const [hours, setHours] = useState(null);
  const [unit, setUnit] = useState(null);
  const [drinkId, setDrinkId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [errors, setErrors] = useState([]);

  const slot = { storeId, type, date };
  const free = (s, h) => freeUnits({ ...slot, start: s, hours: h }, reservations);

  // 상위 선택이 바뀌면 하위 선택을 초기화한다
  const pickStore = (v) => { setStoreId(v); setStart(null); setHours(null); setUnit(null); };
  const pickDate = (v) => { setDate(v); setStart(null); setHours(null); setUnit(null); };
  const pickStart = (v) => { setStart(v); setHours(null); setUnit(null); };
  const pickHours = (v) => { setHours(v); setUnit(null); };

  const starts = startOptions(type, date, now);
  const durations = durationOptions(type, start);
  const freeNow = start != null && hours != null ? free(start, hours) : [];
  const suiteBlocked = type === 'suite' && isSuiteSameDayBlocked(date, now);

  const fee = hours ? reservationFee(type, hours) : 0;
  const drinkCost = drinkId ? drinkFee(type, drinkId) : 0;
  const ready = start != null && hours != null && drinkId && (type !== 'suite' || unit != null);

  const submit = (e) => {
    e.preventDefault();
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
    navigate(`/reservations/${result.reservation.id}`);
  };

  const lastEndProvisional = type === 'suite' ? HOURS.suiteLastEnd : HOURS.focusRestLastEnd;

  return (
    <div className="container page">
      <Link className="back-link" to="/reserve">← 공간 다시 고르기</Link>
      <div className="reserve-head">
        <Tag type={type}>{space.label} · {space.category}</Tag>
        <h1 className="page-title" lang="en">{space.name}</h1>
        <p className="lead">{space.headline}</p>
      </div>

      <form className="reserve-layout" onSubmit={submit} noValidate>
        <div className="reserve-steps">
          <section className="panel">
            <ChoiceGroup
              legend="매장"
              name="store"
              value={storeId}
              onChange={pickStore}
              options={STORES.value.map((s) => ({
                value: s.id,
                label: s.name,
                detail: `${space.unitName} ${s.units[type]}개`,
              }))}
              hint={<><Provisional note={STORES.note} /> 데모 매장입니다.</>}
            />
          </section>

          <section className="panel">
            <ChoiceGroup
              legend="날짜"
              name="date"
              value={date}
              onChange={pickDate}
              columns={4}
              options={dates.map((d, i) => {
                const [, m, day, dow] = formatDate(d).match(/(\d+)월 (\d+)일 \((.)\)/);
                return { value: d, label: i === 0 ? '오늘' : `${m}/${day}`, detail: i === 0 ? `${m}/${day} ${dow}` : dow };
              })}
              hint={<>오늘부터 {BOOKING_WINDOW_DAYS.value}일 후까지 <Provisional note={BOOKING_WINDOW_DAYS.note} /></>}
            />
          </section>

          <section className="panel">
            <ChoiceGroup
              legend="시작 시간"
              name="start"
              value={start}
              onChange={pickStart}
              columns={4}
              options={starts.map((s) => {
                const anyFree = free(s, space.minHours).length > 0;
                return { value: s, label: formatTime(s), disabled: !anyFree, detail: anyFree ? undefined : '마감' };
              })}
              hint={<>
                1시간 단위 · {formatTime(lastEndFor(type))} 종료까지 <Provisional note={lastEndProvisional.note} />
                {' '}· 오픈 {formatTime(HOURS.open.value)} <Provisional note={HOURS.open.note} />
              </>}
              disabledText={suiteBlocked
                ? '마감까지 3시간 이하가 남아 오늘은 Suite 신규 예약을 받지 않습니다. 다른 날짜를 선택해 주세요.'
                : '오늘 예약 가능한 시간이 지났습니다. 다른 날짜를 선택해 주세요.'}
            />
          </section>

          {start != null && (
            <section className="panel">
              <ChoiceGroup
                legend="이용 시간"
                name="hours"
                value={hours}
                onChange={pickHours}
                columns={5}
                options={durations.map((h) => {
                  const ok = free(start, h).length > 0;
                  return { value: h, label: `${h}시간`, detail: ok ? `~${formatTime(start + h * 60)}` : '예약 불가', disabled: !ok };
                })}
                hint={`최소 ${space.minHours}시간, 최대 ${space.maxHours}시간 · 시간당 ${formatWon(space.pricePerHour)}`}
              />
              {hours != null && type !== 'suite' && (
                <p className="field-status">남은 {space.unitName} {freeNow.length}개 · 예약 시 빈 {space.unitName}이 자동 배정됩니다.</p>
              )}
            </section>
          )}

          {type === 'suite' && hours != null && (
            <section className="panel">
              <SuiteRooms
                storeId={storeId}
                date={date}
                start={start}
                hours={hours}
                value={unit}
                onChange={setUnit}
                free={freeNow}
                reservations={reservations}
              />
            </section>
          )}

          <section className="panel">
            <ChoiceGroup
              legend={space.drink === 'included' ? '기본 음료 (이용료에 포함)' : '이용 전 음료 (필수, 별도 결제)'}
              name="drink"
              value={drinkId}
              onChange={setDrinkId}
              columns={2}
              options={MENU.value.map((d) => ({
                value: d.id,
                label: d.name,
                detail: space.drink === 'included' ? '포함' : formatWon(d.price),
              }))}
              hint={<>
                {space.drink === 'included'
                  ? '1회 무료 리필, 이후 정상가 주문 후 다음 주문 50% 할인'
                  : '이용 중 추가 음료는 50% 할인'}
                {' '}<Provisional note={MENU.note} />
              </>}
            />
          </section>

          {space.requests.length > 0 && (
            <section className="panel">
              <fieldset className="choice-group">
                <legend>무료 요청</legend>
                <div className="choice-list" style={{ '--columns': 2 }}>
                  {space.requests.map((r) => (
                    <label key={r.id} className="choice">
                      <input
                        type="checkbox"
                        checked={requests.includes(r.id)}
                        onChange={(e) => setRequests((prev) => (e.target.checked ? [...prev, r.id] : prev.filter((x) => x !== r.id)))}
                      />
                      <span className="choice__label">{r.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>
          )}
        </div>

        <aside className="summary panel" aria-labelledby="summary-title">
          <h2 id="summary-title">예약 요약</h2>
          <dl className="spec">
            <dt>매장</dt><dd>{STORES.value.find((s) => s.id === storeId)?.name}</dd>
            <dt>일시</dt>
            <dd>{formatDate(date)}{start != null && ` ${formatTime(start)}`}{hours != null && `–${formatTime(start + hours * 60)}`}</dd>
            {type === 'suite' && <><dt>공간</dt><dd>{unit != null ? `${unit}번 Suite` : '—'}</dd></>}
            <dt>이용료</dt><dd>{hours ? `${formatWon(space.pricePerHour)} × ${hours}시간 = ${formatWon(fee)}` : '—'}</dd>
            <dt>음료</dt><dd>{drinkId ? `${MENU.value.find((d) => d.id === drinkId).name} · ${space.drink === 'included' ? '포함' : formatWon(drinkCost)}` : '—'}</dd>
            <dt>결제 예정</dt><dd className="spec__total">{formatWon(fee + drinkCost)}</dd>
          </dl>
          <p className="note">{PAYMENT_POLICY}</p>
          <p className="note">{CANCEL_POLICY}</p>
          {errors.length > 0 && (
            <div className="form-errors" role="alert">
              <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}
          <button className="button button--primary button--block" type="submit" disabled={!ready}>
            예약하기 (데모)
          </button>
          {!ready && <p className="note">시간{type === 'suite' ? ', 공간' : ''}, 음료를 선택하면 예약할 수 있어요.</p>}
        </aside>
      </form>
    </div>
  );
}

// Suite 공간별 가능 시간 조회
function SuiteRooms({ storeId, date, start, hours, value, onChange, free, reservations }) {
  const open = HOURS.open.value;
  const end = HOURS.suiteLastEnd.value;
  const span = end - open;
  const pct = (m) => `${((m - open) / span) * 100}%`;

  return (
    <fieldset className="choice-group">
      <legend>Suite 공간 선택</legend>
      <p className="field-hint">막대의 진한 구간은 이미 예약된 시간, 테두리 구간은 선택한 시간입니다.</p>
      <div className="room-list">
        {unitIds(storeId, 'suite').map((room) => {
          const booked = bookedRanges({ storeId, type: 'suite', date, unit: room }, reservations);
          const available = free.includes(room);
          return (
            <label key={room} className="room" data-disabled={!available || undefined}>
              <input type="radio" name="room" value={room} checked={value === room} disabled={!available} onChange={() => onChange(room)} />
              <span className="room__name">{room}번 Suite</span>
              <span className="room__state">{available ? '선택 가능' : '선택한 시간에 예약 있음'}</span>
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
      <div className="timeline-scale" aria-hidden="true">
        <span>{formatTime(open)}</span><span>{formatTime(end)}</span>
      </div>
    </fieldset>
  );
}
