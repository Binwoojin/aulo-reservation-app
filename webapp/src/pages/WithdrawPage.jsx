import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppBar, BottomBar, isUpcoming } from '../components/AppShell.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import Icon from '../components/Icon.jsx';
import { NoticeDialog, Provisional } from '../components/ui.jsx';
import { WITHDRAW_BLOCKED_BY_RESERVATION } from '../config/policy.js';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { pointBalance, stampCount } from '../lib/rewards.js';

// 회원 탈퇴 (마이 > 계정). 사라지는 것(스탬프·포인트·기록)을 숫자로 먼저 보여 주고, 확인 체크 → 마지막 확인창 → 완료.
// 탈퇴 시 스탬프·포인트 소멸은 확정 정책(2026-10-20). 예약이 남아 있을 때의 처리는 미확정이라 임시로 막는다.
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
  const remaining = myReservations.filter((r) => isUpcoming(r, now));
  const blocked = WITHDRAW_BLOCKED_BY_RESERVATION.value && remaining.length > 0;

  const submit = () => {
    if (blocked) return;
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

        {blocked ? (
          <div className="withdraw-block" role="status">
            <Icon name="alert" />
            <div>
              <p className="withdraw-block__title">남은 예약이 있어 지금은 탈퇴할 수 없어요 <Provisional note={WITHDRAW_BLOCKED_BY_RESERVATION.note} /></p>
              <p>이용 예정·이용 중인 예약 {remaining.length}건을 이용하거나 취소한 뒤 탈퇴해 주세요. 이용 당일에는 앱에서 취소할 수 없어요.</p>
              <Link to="/my/reservations" className="text-link">내 예약 보기<Icon name="chevron" size={16} /></Link>
            </div>
          </div>
        ) : (
          <label className="withdraw-agree">
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'withdraw-error' : undefined} />
            <span>위 내용을 확인했고, 스탬프·포인트 소멸에 동의해요.</span>
          </label>
        )}
        {error && <p className="field__error" id="withdraw-error">{error}</p>}
      </div>
      <BottomBar>
        <button type="button" className="button button--danger button--block" onClick={submit} disabled={blocked}>탈퇴하기</button>
      </BottomBar>
      <NoticeDialog open={confirmOpen} title="정말 탈퇴할까요?" confirmLabel="탈퇴하기" danger onConfirm={confirm} onClose={() => setConfirmOpen(false)}>
        스탬프 {stamps}개와 포인트 {points.toLocaleString('ko-KR')}P가 소멸하고, 예약·주문 기록이 모두 삭제돼요.
      </NoticeDialog>
    </>
  );
}
