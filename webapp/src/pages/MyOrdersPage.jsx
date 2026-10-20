import { Link } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { BrandBand } from '../components/BrandBand.jsx';
import { AppBar } from '../components/AppShell.jsx';
import { useReorder } from '../components/AgainCard.jsx';
import { DrinkThumb } from '../components/ui.jsx';
import { canReorder } from '../lib/again.js';
import { getDrink, getStore } from '../lib/reservation.js';
import { useAppData } from '../lib/AppData.jsx';
import { BENEFIT_LABEL, SERVE_LABEL, drinkLabel, optionsText, parseKey, sortedKeys } from '../lib/order.js';
import { formatDateTime, formatWon } from '../lib/time.js';

const KIND_LABEL = { cafe: '카페 주문', extra: '추가 주문', suite: 'Suite 배달' };

const formatOrderedAt = (iso) => formatDateTime(new Date(iso));

export default function MyOrdersPage() {
  const { myOrders: orders, reservations } = useAppData();
  const reorder = useReorder();
  const list = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <AppBar back title="주문 내역" />
      <div className="screen-body order-body">
        <BrandBand id="orders-title" script="my orders" title="주문 내역" hint="최근 주문부터 보여 드려요. 카페 주문은 같은 옵션으로 다시 담을 수 있어요." />
        {list.length ? (
          <ul className="stack">
            {list.map((o) => {
              const r = reservations.find((x) => x.id === o.reservationId);
              const names = sortedKeys(o.items).map((k) => { const opts = parseKey(k); const extra = optionsText(opts); return `${drinkLabel(opts.id, opts.temp)}${extra ? `(${extra})` : ''} ${o.items[k]}`; }).join(', ');
              return (
                <li key={o.id} className="order-card">
                  {(() => { const first = parseKey(sortedKeys(o.items)[0] ?? ''); const d = getDrink(first.id); return d ? <DrinkThumb drink={d} temp={first.temp} size="sm" /> : <span className="drink-thumb drink-thumb--sm" aria-hidden="true" />; })()}
                  <div className="order-card__main">
                    <p className="order-card__kind">{KIND_LABEL[o.kind]}{o.kind === 'cafe' && o.serve && ` · ${SERVE_LABEL[o.serve]}`}{r && ` · ${SPACES[r.type].name} ${r.unit}번`}{getStore(o.storeId ?? r?.storeId) && ` · ${getStore(o.storeId ?? r?.storeId).name}`}</p>
                    <p className="order-card__items">{names}</p>
                    <p className="order-card__meta">{formatOrderedAt(o.createdAt)}{BENEFIT_LABEL[o.benefit] ? ` · ${BENEFIT_LABEL[o.benefit]}` : ''}</p>
                    {canReorder(o) && <button type="button" className="button button--secondary button--small order-card__again" onClick={() => reorder(o)}>다시 담기</button>}
                  </div>
                  <p className="order-card__total">{formatWon(o.total)}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state">
            <p>아직 주문 내역이 없어요.</p>
            <Link className="text-link" to="/order">음료 주문하기</Link>
          </div>
        )}
      </div>
    </>
  );
}
