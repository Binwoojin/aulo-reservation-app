import { useState } from 'react';
import { STORES } from '../config/policy.js';
import { useAppData } from '../lib/AppData.jsx';
import Icon from './Icon.jsx';
import { BottomSheet, OptionList, Provisional } from './ui.jsx';

// 지금 매장 표시 + 바꾸기 (필수 규칙 4). 홈에서 고른 매장을 앱 전체가 함께 쓴다.
export default function StorePicker({ label = '지금 매장' }) {
  const { store, storeId, setStoreId } = useAppData();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="store-picker" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`${label} ${store.name}, 매장 바꾸기`}>
        <Icon name="pin" size={18} />
        <span className="store-picker__label">{label}</span>
        <strong className="store-picker__name">{store.name}</strong>
        <Icon name="down" size={16} />
      </button>
      <BottomSheet open={open} title="매장 선택" onClose={() => setOpen(false)}>
        <OptionList
          legend="매장"
          hideLegend
          name="store-pick"
          value={storeId}
          onChange={(id) => { setStoreId(id); setOpen(false); }}
          hint={<>홈의 공간 정보와 음료 주문이 이 매장 기준으로 바뀌어요. <Provisional note={STORES.note} /></>}
          options={STORES.value.map((s) => ({
            value: s.id,
            label: s.name,
            detail: `Focus 좌석 ${s.units.focus} · Rest 좌석 ${s.units.rest} · Suite 공간 ${s.units.suite}`,
          }))}
        />
      </BottomSheet>
    </>
  );
}
