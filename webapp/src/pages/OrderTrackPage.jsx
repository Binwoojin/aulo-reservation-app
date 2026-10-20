import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppBar, BottomBar } from '../components/AppShell.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import Icon from '../components/Icon.jsx';
import { DrinkThumb } from '../components/ui.jsx';
import { SPACES } from '../config/policy.js';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { BENEFIT_LABEL, SERVE_LABEL, drinkLabel, optionsText, parseKey, sortedKeys } from '../lib/order.js';
import { DEMO_FLOW, ORDER_STAGES, STAGE_TITLE, orderStage, readyMessage, stageIndex, stageTimes } from '../lib/orderStatus.js';
import { getDrink, getStore } from '../lib/reservation.js';
import { formatWon } from '../lib/time.js';

const KIND_LABEL = { cafe: '카페 주문', extra: '추가 주문', suite: 'Suite 배달' };
const clock = (ms) => new Date(ms).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });

// 주문 현황 (/my/orders/:id): 주문 직후 이 화면으로 오고, 주문 내역·홈에서 진행 중인 주문을 눌러 들어온다.
// 수령이 끝난 주문은 상세를 볼 수 없다 (2026-10-20 결정).
export default function OrderTrackPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const now = useNow(1000);
  const { myOrders, reservations, markPicked } = useAppData();
  const order = myOrders.find((o) => o.id === id);

  if (!order || orderStage(order, now) === 'picked') {
    return (
      <>
        <AppBar back title="주문 현황" />
        <div className="screen-body center-state">
          <span className="success-head__icon" aria-hidden="true"><Icon name={order ? 'check' : 'alert'} size={28} /></span>
          <h2 className="screen-title">{order ? '수령이 끝난 주문이에요' : '주문을 찾을 수 없어요'}</h2>
          <p className="muted">{order ? '음료를 받은 주문은 상세를 볼 수 없어요. 주문 내역에서 주문한 음료와 금액을 확인할 수 있어요.' : '주소를 다시 확인해 주세요.'}</p>
          <Link className="button button--primary" to="/my/orders" replace>주문 내역으로</Link>
        </div>
      </>
    );
  }

  const stage = orderStage(order, now);
  const current = stageIndex(stage);
  const times = stageTimes(order);
  const r = reservations.find((x) => x.id === order.reservationId);
  const store = getStore(order.storeId ?? r?.storeId);
  const spot = r ? `${SPACES[r.type].name} ${r.unit}번` : null;
  const where = [order.kind === 'cafe' && order.serve ? SERVE_LABEL[order.serve] : null, spot, store?.name].filter(Boolean).join(' · ');
  const cups = Object.values(order.items).reduce((a, b) => a + b, 0);
  const orderNo = order.id.replace(/-/g, '').slice(-4).toUpperCase();
  const leftSec = Math.max(0, Math.ceil((times.ready - now.getTime()) / 1000));

  const pick = () => {
    markPicked(order.id);
    navigate('/my/orders', { replace: true });
  };

  return (
    <>
      <AppBar back title="주문 현황" />
      <div className="screen-body order-body has-bottom-bar">
        <BrandBand id="track-title" script="your order" title={STAGE_TITLE[stage]} hint={stage === 'ready' ? readyMessage(order, spot) : `${KIND_LABEL[order.kind]} · ${where}`}>
          <p className="track-no">주문 번호 <b lang="en">{orderNo}</b></p>
        </BrandBand>

        {params.get('new') && stage !== 'ready' && (
          <p className="track-new" role="status"><Icon name="check" size={18} />주문이 접수됐어요. 결제는 매장에서 해요. 스탬프 {cups}개가 적립됐어요.</p>
        )}

        <section className="track" aria-labelledby="track-steps-title">
          <h3 id="track-steps-title" className="visually-hidden">진행 단계</h3>
          <ol className="track__list">
            {ORDER_STAGES.map((s, i) => {
              const state = i < current ? 'done' : i === current ? 'now' : 'next';
              const at = times[s.id];
              return (
                <li key={s.id} className="track__step" data-state={state} aria-current={state === 'now' ? 'step' : undefined}>
                  <span className="track__dot" aria-hidden="true">{state === 'done' && <Icon name="check" size={14} />}</span>
                  <span className="track__label">{s.label}</span>
                  <span className="track__time" lang="en">
                    {state !== 'next' && at ? clock(at) : ''}
                    {s.id === 'making' && state === 'now' && <span className="track__left">약 {leftSec}초 남음</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="track__note"><Icon name="info" size={16} />데모: 매장 연동 대신 주문 후 시간에 따라 진행돼요 (수락 {DEMO_FLOW.acceptSec}초 · 제조 잔당 {DEMO_FLOW.perCupSec}초)</p>
        </section>

        <section className="order-card" aria-label="주문한 음료">
          <div className="order-card__head">
            <span className="order-card__kind" data-kind={order.kind}>{KIND_LABEL[order.kind]}</span>
            <span className="order-card__date">{where}</span>
          </div>
          <ul className="order-card__items">
            {sortedKeys(order.items).map((k) => {
              const opts = parseKey(k);
              const d = getDrink(opts.id);
              const extra = optionsText(opts);
              return (
                <li key={k} className="order-line">
                  {d ? <DrinkThumb drink={d} temp={opts.temp} size="sm" /> : <span className="drink-thumb drink-thumb--sm" aria-hidden="true" />}
                  <span className="order-line__name">{drinkLabel(opts.id, opts.temp)}{extra && <small>{extra}</small>}</span>
                  <span className="order-line__qty" lang="en">× {order.items[k]}</span>
                </li>
              );
            })}
          </ul>
          <div className="order-card__foot">
            <span className="order-card__meta">총 {cups}잔{BENEFIT_LABEL[order.benefit] ? ` · ${BENEFIT_LABEL[order.benefit]}` : ''}</span>
            <span className="order-card__total" lang="en">{formatWon(order.total)}</span>
          </div>
        </section>
      </div>
      <BottomBar>
        {stage === 'ready' ? (
          <button type="button" className="button button--primary button--block" onClick={pick}>
            <Icon name="check" size={18} />{order.kind === 'suite' ? '배달받았어요' : '음료를 받았어요'}
          </button>
        ) : (
          <>
            <Link className="button button--secondary" to={r ? `/reservations/${r.id}` : '/order'}>{r ? '예약으로' : '더 주문하기'}</Link>
            <Link className="button button--primary" to="/my/orders">주문 내역</Link>
          </>
        )}
      </BottomBar>
    </>
  );
}
