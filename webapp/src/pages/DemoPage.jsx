import { useNavigate } from 'react-router-dom';
import { BrandBand } from '../components/BrandBand.jsx';
import { AppBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { SCENARIOS, canBeInUse } from '../lib/scenarios.js';

// 데모 시나리오 (햄버거 서랍 > 데모): 고르면 그 상태의 기록으로 바꾸고 홈으로 간다.
// 이 기기의 데모 기록(로그인·예약·주문·장바구니)을 덮어쓴다.
export default function DemoPage() {
  const { loadScenario, storeId } = useAppData();
  const now = useNow();
  const navigate = useNavigate();
  const open = canBeInUse(now);

  const apply = (s) => {
    loadScenario(s.build(now, storeId));
    navigate('/', { replace: true });
  };

  return (
    <>
      <AppBar back title="데모 시나리오" />
      <div className="screen-body order-body">
        <BrandBand id="demo-title" script="demo scenarios" title={<>상황을 골라<br />홈을 둘러보세요</>} hint="예약하고 그 시간이 될 때까지 기다리지 않아도, 상황별로 달라지는 홈을 바로 볼 수 있어요. 지금 시각과 지금 매장을 기준으로 기록을 만들어요." />
        <ul className="scenario-list">
          {SCENARIOS.map((s, i) => {
            const disabled = s.needsOpenHours && !open;
            return (
              <li key={s.id}>
                <button type="button" className="scenario" onClick={() => apply(s)} disabled={disabled}>
                  <span className="scenario__num" lang="en">{String(i + 1).padStart(2, '0')}</span>
                  <span className="scenario__text">
                    <span className="scenario__title">{s.title}</span>
                    <span className="scenario__desc">{disabled ? '운영 시간(08:10~22:00)에만 만들 수 있어요.' : s.desc}</span>
                  </span>
                  <Icon name="chevron" size={18} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="group-hint">고르면 이 기기에 저장된 데모 로그인·예약·주문·장바구니가 바뀌어요. 데모 계정은 demo@aulo.kr이에요.</p>
      </div>
    </>
  );
}
