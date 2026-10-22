import { Link } from 'react-router-dom';
import { AppBar } from '../components/AppShell.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import Icon from '../components/Icon.jsx';
import { SPACES } from '../config/policy.js';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { couponWallet } from '../lib/coupons.js';
import { getStore, reservationEnd } from '../lib/reservation.js';
import { formatDate, formatTime } from '../lib/time.js';

// 내 쿠폰 (마이 > 나의 이용, 홈 이용 중 카드에서 들어온다)
// 지금 쓸 수 있는 쿠폰 = 이용 중인 예약에 발급된 재주문 쿠폰. 다가오는 예약은 이용 시작 때 발급될 쿠폰을 미리 보여 준다.
export default function CouponsPage() {
  const { myReservations, orders } = useAppData();
  const now = useNow(30_000);
  const { active, scheduled, usableCount } = couponWallet(myReservations, orders, now);
  const r = active[0]?.reservation;

  return (
    <>
      <AppBar back title="내 쿠폰" />
      <div className="screen-body order-body">
        <BrandBand id="coupons-title" script="my coupons" title="내 쿠폰" hint="좌석 이용을 시작하면 재주문 쿠폰이 발급돼요. 이용 중 추가 주문·Suite 배달과 음료 주문 탭 장바구니에서 골라 쓸 수 있어요." />

        <section className="block" aria-labelledby="coupons-now">
          <div className="block-head">
            <h2 id="coupons-now" className="block-title">지금 쓸 수 있어요 <span className="badge" lang="en">{usableCount}</span></h2>
          </div>
          {active.length ? (
            <>
              <p className="group-hint">{SPACES[r.type].name} {r.unit}번 · {getStore(r.storeId)?.name} · 오늘 {formatTime(reservationEnd(r))} 이용 종료 때 함께 끝나요</p>
              <ul className="coupon-wallet">
                {active.map((c) => (
                  <li key={c.id} className="coupon-ticket coupon-ticket--wallet" data-disabled={c.left === 0 || undefined}>
                    <span className="coupon-ticket__stub" lang="en">{c.short}</span>
                    <span className="coupon-ticket__body">
                      <strong>{c.title}</strong>
                      <span>{c.left === 0 ? '모두 사용했어요' : c.detail}</span>
                    </span>
                    <span className="coupon-ticket__count"><b lang="en">{c.left}</b>/{c.total}장</span>
                  </li>
                ))}
              </ul>
              <div className="coupon-wallet__actions">
                <Link className="button button--primary" to={`/reservations/${r.id}/order`}>{SPACES[r.type].drink === 'included' ? 'Suite 배달에서 쓰기' : '추가 주문에서 쓰기'}</Link>
                <Link className="button button--secondary" to="/order">음료 주문에서 쓰기</Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>지금 쓸 수 있는 쿠폰이 없어요.</p>
              <p>좌석 이용을 시작하면 재주문 쿠폰이 발급돼요.</p>
            </div>
          )}
        </section>

        {scheduled.length > 0 && (
          <section className="block" aria-labelledby="coupons-next">
            <h2 id="coupons-next" className="block-title">이용 시작 때 발급돼요</h2>
            <ul className="coupon-next">
              {scheduled.map(({ reservation: x, coupons }) => (
                <li key={x.id} className="coupon-next__item">
                  <Icon name="calendar" />
                  <span className="coupon-next__text">
                    <strong><span lang="en">{SPACES[x.type].name}</span> {x.unit}번 · {formatDate(x.date)} {formatTime(x.start)}</strong>
                    <span>{coupons.map((c) => `${c.title} ${c.total}장`).join(' · ')}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <details className="rules">
          <summary className="rules__summary">쿠폰 기준<Icon name="down" size={18} /></summary>
          <ul className="note-list">
            <li>Focus·Rest: 이용 시작부터 50% 할인 쿠폰 2장 (한 번 주문에 1장, 그 주문 음료 전체 50%)</li>
            <li>Suite: 아메리카노·카페라떼 1잔 무료 리필 쿠폰 1장 + 50% 할인 쿠폰 2장</li>
            <li>쿠폰은 예약 이용 시간 안에서만 쓸 수 있고, 이용이 끝나면 남은 쿠폰도 함께 끝나요.</li>
          </ul>
        </details>
      </div>
    </>
  );
}
