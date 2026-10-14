import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MENU, SPACES, SUITE_ORDER_RULE } from '../config/policy.js';
import { ChoiceGroup, Provisional, Stepper } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { BENEFIT_LABEL, orderKindFor, priceOrder } from '../lib/order.js';
import { getDrink, getStore, reservationEnd } from '../lib/reservation.js';
import { formatDate, formatTime, formatWon, minutesOfDay, toDateString } from '../lib/time.js';

const KIND_OPTIONS = [
  { value: 'cafe', label: '카페 주문', detail: '매장에서 픽업 · 정상가' },
  { value: 'extra', label: 'Focus·Rest 추가 주문', detail: '이용 중 추가 음료 50% 할인' },
  { value: 'suite', label: 'Suite 배달 주문', detail: '공간 번호로 배달' },
];

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

  const linkable = kind === 'cafe' ? [] : [...active, ...(preset && !active.includes(preset) ? [preset] : [])]
    .filter((r) => orderKindFor(r) === kind);
  const reservation = linkable.find((r) => r.id === reservationId) ?? null;
  const needsReservation = kind !== 'cafe';
  const quote = priceOrder({ kind, items, reservation, previousOrders: orders });
  const itemCount = Object.values(items).reduce((a, b) => a + b, 0);
  const canOrder = itemCount > 0 && (!needsReservation || reservation);

  const pickKind = (v) => { setKind(v); setReservationId(null); setPlaced(null); };

  const submit = (e) => {
    e.preventDefault();
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
  };

  if (placed) {
    return (
      <div className="container page narrow">
        <p className="section-label" lang="en">ORDER PLACED</p>
        <h1 className="page-title">주문이 접수되었어요 (데모)</h1>
        <p className="lead">
          {placed.order.kind === 'suite'
            ? `${placed.reservation.unit}번 Suite로 음료를 배달해 드려요.`
            : placed.order.kind === 'extra'
              ? `${SPACES[placed.reservation.type].name} ${placed.reservation.unit}번 ${SPACES[placed.reservation.type].unitName} 이용 중 추가 주문입니다.`
              : '준비되면 카운터에서 픽업해 주세요.'}
        </p>
        <OrderLines quote={placed.quote} />
        <div className="actions">
          <button className="button button--primary" type="button" onClick={() => setPlaced(null)}>추가로 주문하기</button>
          <Link className="button button--secondary" to="/">홈으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <p className="section-label" lang="en">ORDER</p>
      <h1 className="page-title">음료 주문</h1>
      <p className="lead">결제는 매장에서 진행합니다. 이 화면은 주문 흐름 데모입니다.</p>

      <form className="reserve-layout" onSubmit={submit}>
        <div className="reserve-steps">
          <section className="panel">
            <ChoiceGroup legend="주문 유형" name="kind" value={kind} onChange={pickKind} options={KIND_OPTIONS} />
          </section>

          {needsReservation && (
            <section className="panel">
              <ChoiceGroup
                legend={kind === 'suite' ? '이용 중인 Suite' : '이용 중인 좌석'}
                name="reservation"
                value={reservationId}
                onChange={setReservationId}
                options={linkable.map((r) => ({
                  value: r.id,
                  label: `${SPACES[r.type].name} ${r.unit}번`,
                  detail: `${getStore(r.storeId)?.name} · ${formatDate(r.date)} ${formatTime(r.start)}–${formatTime(reservationEnd(r))}`,
                }))}
                hint={kind === 'suite' && <>무료 리필 1회 → 정상가 → 다음 주문 50% 할인 <Provisional note={SUITE_ORDER_RULE.note} /></>}
                disabledText={<>
                  오늘 이용 중인 {kind === 'suite' ? 'Suite' : 'Focus·Rest'} 예약이 없어요.{' '}
                  <Link to={`/reserve/${kind === 'suite' ? 'suite' : 'focus'}`}>예약하러 가기</Link>
                </>}
              />
            </section>
          )}

          <section className="panel">
            <fieldset className="choice-group">
              <legend>메뉴 <Provisional note={MENU.note} /></legend>
              <ul className="menu-list">
                {MENU.value.map((d) => (
                  <li key={d.id} className="menu-item">
                    <span className="menu-item__name">
                      {d.name}
                      {kind === 'suite' && reservation?.drinkId === d.id && <span className="badge">기본 음료</span>}
                    </span>
                    <span className="menu-item__price">{formatWon(d.price)}</span>
                    <Stepper label={d.name} value={items[d.id] ?? 0} onChange={(q) => setItems((prev) => ({ ...prev, [d.id]: q }))} />
                  </li>
                ))}
              </ul>
            </fieldset>
          </section>
        </div>

        <aside className="summary panel" aria-labelledby="order-summary">
          <h2 id="order-summary">주문 요약</h2>
          {(!needsReservation || reservation) && (
            <p className="benefit">
              이번 주문 혜택: <strong>{BENEFIT_LABEL[quote.benefit]}</strong>
              {quote.benefit === 'refill' && reservation && ` (${getDrink(reservation.drinkId)?.name})`}
            </p>
          )}
          <OrderLines quote={quote} />
          <button className="button button--primary button--block" type="submit" disabled={!canOrder}>주문하기 (데모)</button>
          {!canOrder && (
            <p className="note">{needsReservation && !reservation ? '이용 중인 예약을 선택하고 ' : ''}메뉴를 담으면 주문할 수 있어요.</p>
          )}
        </aside>
      </form>
    </div>
  );
}

function OrderLines({ quote }) {
  if (quote.lines.length === 0) return <p className="note">담은 메뉴가 없습니다.</p>;
  return (
    <dl className="spec">
      {quote.lines.map((l) => (
        <div key={l.drinkId} className="spec__row">
          <dt>{l.name} × {l.quantity}</dt>
          <dd>{l.total !== l.listPrice && <s>{formatWon(l.listPrice)}</s>} {formatWon(l.total)}</dd>
        </div>
      ))}
      {quote.discount > 0 && <div className="spec__row"><dt>할인</dt><dd>−{formatWon(quote.discount)}</dd></div>}
      <div className="spec__row"><dt>결제 예정</dt><dd className="spec__total">{formatWon(quote.total)}</dd></div>
    </dl>
  );
}
