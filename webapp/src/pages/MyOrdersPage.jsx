import { Link } from 'react-router-dom';
import { SPACES } from '../config/policy.js';
import { BrandBand } from '../components/BrandBand.jsx';
import { AppBar } from '../components/AppShell.jsx';
import { useReorder } from '../components/AgainCard.jsx';
import Icon from '../components/Icon.jsx';
import { DrinkThumb } from '../components/ui.jsx';
import { canReorder } from '../lib/again.js';
import { getDrink, getStore } from '../lib/reservation.js';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { ORDER_HISTORY_MONTHS } from '../config/policy.js';
import { BENEFIT_LABEL, SERVE_LABEL, drinkLabel, optionsText, parseKey, recentOrders, sortedKeys } from '../lib/order.js';
import { formatDateTime, formatWon } from '../lib/time.js';

const KIND_LABEL = { cafe: '카페 주문', extra: '추가 주문', suite: 'Suite 배달' };

const formatOrderedAt = (iso) => formatDateTime(new Date(iso));

export default function MyOrdersPage() {
  const { myOrders: orders, reservations } = useAppData();
  const reorder = useReorder();
  const now = useNow();
  // 최근 1개월 주문만 보여 준다 (지난 기록은 지우지 않고 숨긴다)
  const list = recentOrders(orders, now).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <AppBar back title="주문 내역" />
      <div className="screen-body order-body">
        <BrandBand id="orders-title" script="my orders" title="주문 내역" hint={`최근 ${ORDER_HISTORY_MONTHS}개월 주문을 최신순으로 보여 드려요. ${ORDER_HISTORY_MONTHS}개월이 지난 주문은 목록에서 사라져요. 카페 주문은 같은 옵션으로 다시 담을 수 있어요.`} />
        {list.length ? (
          <ul className="stack">
            {list.map((o) => {
              const r = reservations.find((x) => x.id === o.reservationId);
              const store = getStore(o.storeId ?? r?.storeId);
              // 어디서 받았는지: 카페는 매장/테이크아웃, 좌석 주문은 공간·번호
              const where = [o.kind === 'cafe' && o.serve ? SERVE_LABEL[o.serve] : null, r ? `${SPACES[r.type].name} ${r.unit}번` : null, store?.name].filter(Boolean).join(' · ');
              const count = Object.values(o.items).reduce((a, b) => a + b, 0);
              return (
                <li key={o.id} className="order-card">
                  <div className="order-card__head">
                    <span className="order-card__kind" data-kind={o.kind}>{KIND_LABEL[o.kind]}</span>
                    <time className="order-card__date" dateTime={o.createdAt}>{formatOrderedAt(o.createdAt)}</time>
                  </div>
                  {where && <p className="order-card__where">{where}</p>}
                  <ul className="order-card__items" aria-label="주문한 음료">
                    {sortedKeys(o.items).map((k) => {
                      const opts = parseKey(k);
                      const d = getDrink(opts.id);
                      const extra = optionsText(opts);
                      return (
                        <li key={k} className="order-line">
                          {d ? <DrinkThumb drink={d} temp={opts.temp} size="sm" /> : <span className="drink-thumb drink-thumb--sm" aria-hidden="true" />}
                          <span className="order-line__name">
                            {drinkLabel(opts.id, opts.temp)}
                            {extra && <small>{extra}</small>}
                          </span>
                          <span className="order-line__qty" lang="en">× {o.items[k]}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="order-card__foot">
                    <span className="order-card__meta">총 {count}잔{BENEFIT_LABEL[o.benefit] ? ` · ${BENEFIT_LABEL[o.benefit]}` : ''}</span>
                    <span className="order-card__total" lang="en">{formatWon(o.total)}</span>
                  </div>
                  {canReorder(o) && (
                    <button type="button" className="button button--secondary button--block order-card__again" onClick={() => reorder(o)}>
                      <Icon name="repeat" size={18} />같은 주문 다시 담기
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state">
            <p>{orders.length ? `최근 ${ORDER_HISTORY_MONTHS}개월 동안 주문 내역이 없어요.` : '아직 주문 내역이 없어요.'}</p>
            <Link className="text-link" to="/order">음료 주문하기</Link>
          </div>
        )}
      </div>
    </>
  );
}
