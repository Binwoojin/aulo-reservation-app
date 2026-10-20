import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppBar, BottomBar, isUpcoming } from '../components/AppShell.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import Icon from '../components/Icon.jsx';
import { NoticeDialog } from '../components/ui.jsx';
import { SPACES } from '../config/policy.js';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { isInUse, reservationEnd } from '../lib/reservation.js';
import { pointBalance, stampCount } from '../lib/rewards.js';
import { formatDate, formatTime } from '../lib/time.js';

// 회원 탈퇴 (마이 > 계정). 사라지는 것(스탬프·포인트·기록)을 숫자로 먼저 보여 주고, 확인 체크 → 마지막 확인창 → 완료.
// 확정 정책(2026-10-20): 탈퇴 시 스탬프·포인트 소멸, 이용 예정 예약은 자동 취소, 이용 중이면 이용이 끝난 뒤에 탈퇴할 수 있다.
export default function WithdrawPage() {
  const { user, myReservations, myOrders, withdraw } = useAppData();
  const now = useNow();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <>
        <AppBar title="" />
        <div className="screen-body has-bottom-bar auth-done">
          <span className="success-head__icon" aria-hidden="true"><Icon name="check" size={32} /></span>
          <p className="shelf-script" lang="en">see you again</p>
          <h2 className="screen-title">탈퇴가 완료됐어요</h2>
          <p className="muted">그동안 Aulo와 함께해 주셔서 고마워요.<br />같은 이메일로 언제든 다시 가입할 수 있어요.</p>
        </div>
        <BottomBar><button type="button" className="button button--primary button--block" onClick={() => navigate('/', { replace: true })}>홈으로</button></BottomBar>
      </>
    );
  }
  if (!user) return <Navigate to="/login?redirect=%2Fmy%2Fwithdraw" replace />;

  const stamps = stampCount(myOrders, myReservations, now);
  const points = pointBalance(myReservations, now);
  const inUse = myReservations.find((r) => isInUse(r, now));
  const remaining = myReservations
    .filter((r) => isUpcoming(r, now) && !isInUse(r, now))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);

  const submit = () => {
    if (inUse) return;
    if (!agreed) { setError('안내를 확인하고 동의해 주세요.'); return; }
    setConfirmOpen(true);
  };
  const confirm = () => {
    setConfirmOpen(false);
    withdraw();
    setDone(true);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <AppBar back title="회원 탈퇴" />
      <div className="screen-body order-body has-bottom-bar">
        <BrandBand id="withdraw-title" script="before you go" title={<>탈퇴하기 전에<br />꼭 확인해 주세요</>} hint={`${user.email} 계정을 탈퇴하면 아래 내용이 모두 사라지고 되살릴 수 없어요.`} />

        {/* 이용 중이면 탈퇴 버튼이 막힌 이유를 맨 먼저 보여 준다 */}
        {inUse && (
          <div className="withdraw-block" role="status">
            <Icon name="clock" />
            <div>
              <p className="withdraw-block__title">이용 중에는 탈퇴할 수 없어요</p>
              <p><span lang="en">{SPACES[inUse.type].name}</span> 이용이 끝나는 <b lang="en">{formatTime(reservationEnd(inUse))}</b> 이후에 탈퇴할 수 있어요.</p>
              <Link to={`/reservations/${inUse.id}`} className="text-link">이용 중인 예약 보기<Icon name="chevron" size={16} /></Link>
            </div>
          </div>
        )}

        <section className="withdraw-loss" aria-label="탈퇴하면 사라지는 것">
          <div className="withdraw-loss__cell">
            <span className="withdraw-loss__num" lang="en">{stamps}</span>
            <span className="withdraw-loss__label">스탬프</span>
          </div>
          <div className="withdraw-loss__cell">
            <span className="withdraw-loss__num" lang="en">{points.toLocaleString('ko-KR')}</span>
            <span className="withdraw-loss__label">포인트</span>
          </div>
          <p className="withdraw-loss__note">남은 스탬프와 포인트는 모두 소멸해요. 다시 가입해도 돌려받을 수 없어요.</p>
        </section>

        <ul className="withdraw-list">
          <li><Icon name="calendar" /><span>예약 기록 <b lang="en">{myReservations.length}</b>건이 삭제돼요.</span></li>
          <li><Icon name="receipt" /><span>음료 주문 내역 <b lang="en">{myOrders.length}</b>건이 삭제돼요.</span></li>
          <li><Icon name="user" /><span>로그인 정보가 삭제되고, 같은 이메일로 다시 가입할 수 있어요.</span></li>
        </ul>

        {remaining.length > 0 && (
          <section className="withdraw-cancel" aria-labelledby="withdraw-cancel-title">
            <h3 id="withdraw-cancel-title" className="withdraw-cancel__title"><Icon name="alert" />남은 예약 {remaining.length}건이 자동으로 취소돼요</h3>
            <ul className="withdraw-cancel__list">
              {remaining.map((r) => (
                <li key={r.id}>
                  <span className="withdraw-cancel__space" lang="en">{SPACES[r.type].name}</span>
                  <span className="withdraw-cancel__when">{formatDate(r.date)} · <span lang="en">{formatTime(r.start)}–{formatTime(reservationEnd(r))}</span></span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!inUse && (
          <label className="withdraw-agree">
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'withdraw-error' : undefined} />
            <span>위 내용을 확인했고, 스탬프·포인트 소멸{remaining.length > 0 ? '과 예약 자동 취소' : ''}에 동의해요.</span>
          </label>
        )}
        {error && <p className="field__error" id="withdraw-error">{error}</p>}
      </div>
      <BottomBar>
        <button type="button" className="button button--danger button--block" onClick={submit} disabled={!!inUse}>탈퇴하기</button>
      </BottomBar>
      <NoticeDialog open={confirmOpen} title="정말 탈퇴할까요?" confirmLabel="탈퇴하기" danger onConfirm={confirm} onClose={() => setConfirmOpen(false)}>
        스탬프 {stamps}개와 포인트 {points.toLocaleString('ko-KR')}P가 소멸하고{remaining.length > 0 ? `, 남은 예약 ${remaining.length}건이 취소되며` : ''}, 예약·주문 기록이 모두 삭제돼요.
      </NoticeDialog>
    </>
  );
}
