import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MENU, SPACES, SUITE_ORDER_RULE } from '../config/policy.js';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { OptionList, Provisional, Segmented, Stepper } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { BENEFIT_LABEL, orderKindFor, priceOrder } from '../lib/order.js';
import { getDrink, getStore, reservationEnd } from '../lib/reservation.js';
import { formatTime, formatWon, minutesOfDay, toDateString } from '../lib/time.js';

const KINDS = [
  { value: 'cafe', label: '카페' },
  { value: 'extra', label: '추가 주문' },
  { value: 'suite', label: 'Suite 배달' },
];

const KIND_HINT = {
  cafe: '준비되면 카운터에서 픽업해요 · 정상가',
  extra: 'Focus·Rest 이용 중 추가 음료 50% 할인',
  suite: '공간 번호로 배달해요',
};

export default function OrderPage() {
  const now = useNow();
  const [params] = useSearchParams();
  const { reservations, orders, addOrder } = useAppData();
  const today = toDateString(now);

  // 오늘 아직 끝나지 않은 예약만 주문에 연결할 수 있다 (데모)
  const active = reservations.filter((r) => r.date === today && reservationEnd(r) > minutesOfDay(now));
  const preset = reservations.find((r) => r.id === params.get('reservation'));

  const [kind, setKind] = useState(preset ? orderKindFor(preset) : 'cafe');
  const [reservationId, setReservationId] = useState(preset?.id ?? null);
  const [items, setItems] = useState({});
  const [placed, setPlaced] = useState(null);

  const candidates = preset && !active.includes(preset) ? [...active, preset] : active;
  const linkable = kind === 'cafe' ? [] : candidates.filter((r) => orderKindFor(r) === kind);
  const reservation = linkable.find((r) => r.id === reservationId) ?? (linkable.length === 1 ? linkable[0] : null);
  const needsReservation = kind !== 'cafe';
  const quote = priceOrder({ kind, items, reservation, previousOrders: orders });
  const count = Object.values(items).reduce((a, b) => a + b, 0);
  const canOrder = count > 0 && (!needsReservation || reservation);

  const submit = () => {
    if (!canOrder) return;
    const order = {
      id: crypto.randomUUID(),
      kind,
      reservationId: reservation?.id ?? null,
      items,
      total: quote.total,
      benefit: quote.benefit,
      createdAt: new Date().toISOString(),
    };
    addOrder(order);
    setPlaced({ order, quote, reservation });
    setItems({});
    window.scrollTo(0, 0);
  };

  if (placed) {
    const r = placed.reservation;
    return (
      <>
        <AppBar title="" />
        <div className="screen-body has-bottom-bar">
          <div className="success-head">
            <span className="success-head__icon" aria-hidden="true"><Icon name="check" size={32} /></span>
            <h2 className="screen-title">주문이 접수되었어요</h2>
            <p className="muted">
              {placed.order.kind === 'suite' && `${r.unit}번 Suite로 배달해 드려요.`}
              {placed.order.kind === 'extra' && `${SPACES[r.type].name} ${r.unit}번 ${SPACES[r.type].unitName}에서 받아 가세요.`}
              {placed.order.kind === 'cafe' && '준비되면 카운터에서 픽업해 주세요.'}
              {' '}결제는 매장에서 해요.
            </p>
          </div>
          <OrderLines quote={placed.quote} />
        </div>
        <BottomBar>
          <button className="button button--secondary" type="button" onClick={() => setPlaced(null)}>더 주문하기</button>
          <Link className="button button--primary" to="/my/orders">주문 내역</Link>
        </BottomBar>
      </>
    );
  }

  return (
    <>
      <AppBar title="음료 주문" />
      <div className="screen-body has-bottom-bar">
        <Segmented label="주문 유형" name="kind" value={kind} onChange={(v) => { setKind(v); setReservationId(null); }} options={KINDS} />
        <p className="group-hint">{KIND_HINT[kind]}</p>

        {needsReservation && (
          <section className="block">
            <OptionList
              legend={kind === 'suite' ? '이용 중인 Suite' : '이용 중인 좌석'}
              name="reservation"
              value={reservation?.id ?? null}
              onChange={setReservationId}
              options={linkable.map((r) => ({
                value: r.id,
                label: `${SPACES[r.type].name} ${r.unit}번`,
                detail: `${getStore(r.storeId)?.name} · ${formatTime(r.start)}–${formatTime(reservationEnd(r))}`,
              }))}
              hint={kind === 'suite' && <>무료 리필 1회 → 정상가 → 다음 주문 50% <Provisional note={SUITE_ORDER_RULE.note} /></>}
              empty={<>
                <p>오늘 이용 중인 {kind === 'suite' ? 'Suite' : 'Focus·Rest'} 예약이 없어요.</p>
                <Link className="text-link" to={`/reserve/${kind === 'suite' ? 'suite' : 'focus'}`}>예약하러 가기</Link>
              </>}
            />
          </section>
        )}

        <section className="block" aria-labelledby="menu-title">
          <p id="menu-title" className="group-title">메뉴 <Provisional note={MENU.note} /></p>
          <ul className="list-card">
            {MENU.value.map((d) => {
              const isBase = kind === 'suite' && reservation?.drinkId === d.id;
              return (
                <li key={d.id} className="menu-row-item">
                  <span className="cup-thumb" aria-hidden="true"><Icon name="cup" size={22} /></span>
                  <span className="option-row__text">
                    <span className="option-row__label">{d.name}{isBase && <span className="badge">기본 음료</span>}</span>
                    <span className="option-row__detail">{formatWon(d.price)}</span>
                  </span>
                  <Stepper label={d.name} value={items[d.id] ?? 0} onChange={(q) => setItems((prev) => ({ ...prev, [d.id]: q }))} />
                </li>
              );
            })}
          </ul>
        </section>

        {count > 0 && <OrderLines quote={quote} />}
      </div>

      <BottomBar note={(!needsReservation || reservation) && (
        <>이번 주문 혜택 <strong>{BENEFIT_LABEL[quote.benefit]}</strong>
          {quote.benefit === 'refill' && reservation && ` · ${getDrink(reservation.drinkId)?.name}`}</>
      )}>
        <div className="price">
          <span className="price__label">{count}잔</span>
          <span className="price__value">{formatWon(quote.total)}</span>
        </div>
        <button className="button button--primary" type="button" disabled={!canOrder} onClick={submit}>주문하기</button>
      </BottomBar>
    </>
  );
}

function OrderLines({ quote }) {
  return (
    <dl className="kv summary-card">
      {quote.lines.map((l) => (
        <div key={l.drinkId}>
          <dt>{l.name} × {l.quantity}</dt>
          <dd>{l.total !== l.listPrice && <s>{formatWon(l.listPrice)}</s>} {formatWon(l.total)}</dd>
        </div>
      ))}
      {quote.discount > 0 && <div><dt>할인</dt><dd>−{formatWon(quote.discount)}</dd></div>}
      <div className="kv__total"><dt>결제 예정</dt><dd>{formatWon(quote.total)}</dd></div>
    </dl>
  );
}
