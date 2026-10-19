import { Link } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { AppBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { useAppData } from '../lib/AppData.jsx';
import { BENEFIT_LABEL, SERVE_LABEL, drinkLabel, optionsText, parseKey, sortedKeys } from '../lib/order.js';
import { formatDateTime, formatWon } from '../lib/time.js';

const KIND_LABEL = { cafe: '카페 주문', extra: '추가 주문', suite: 'Suite 배달' };

const formatOrderedAt = (iso) => formatDateTime(new Date(iso));

export default function MyOrdersPage() {
  const { myOrders: orders, reservations } = useAppData();
  const list = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <AppBar back title="주문 내역" />
      <div className="screen-body">
        {list.length ? (
          <ul className="stack">
            {list.map((o) => {
              const r = reservations.find((x) => x.id === o.reservationId);
              const names = sortedKeys(o.items).map((k) => { const opts = parseKey(k); const extra = optionsText(opts); return `${drinkLabel(opts.id, opts.temp)}${extra ? `(${extra})` : ''} ${o.items[k]}`; }).join(', ');
              return (
                <li key={o.id} className="order-card">
                  <span className="cup-thumb" aria-hidden="true"><Icon name="cup" size={22} /></span>
                  <div className="order-card__main">
                    <p className="order-card__kind">{KIND_LABEL[o.kind]}{o.kind === 'cafe' && o.serve && ` · ${SERVE_LABEL[o.serve]}`}{r && ` · ${SPACES[r.type].name} ${r.unit}번`}</p>
                    <p className="order-card__items">{names}</p>
                    <p className="order-card__meta">{formatOrderedAt(o.createdAt)} · {BENEFIT_LABEL[o.benefit]}</p>
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
