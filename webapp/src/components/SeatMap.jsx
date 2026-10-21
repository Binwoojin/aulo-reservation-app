import { useId } from 'react';
import { SEAT_LAYOUT, SPACES } from '../config/policy.js';
import { seatLayout } from '../lib/seatLayout.js';
import { Provisional } from './ui.jsx';

// 좌석 배치도 (임시): 구역별로 좌석 번호를 위치처럼 보여 주고, 그 자리에서 바로 고른다.
// 실제 도면이 없어 구역만 나눈 배치이므로 '임시' 표시를 붙인다 (policy.js SEAT_LAYOUT).
export default function SeatMap({ type, count, value, onChange, isFree }) {
  const name = useId();
  const space = SPACES[type];
  const zones = seatLayout(type, count);
  const picked = zones.find((z) => z.seats.includes(value));
  const freeCount = zones.reduce((n, z) => n + z.seats.filter(isFree).length, 0);

  const seat = (n, zone) => {
    const free = isFree(n);
    return (
      <label key={n} className="seat" data-booked={!free || undefined}>
        <input type="radio" name={name} value={n} checked={value === n} disabled={!free} onChange={() => onChange(n)}
          aria-label={`${n}번 ${space.unitName}, ${zone.label}${free ? '' : ', 예약됨'}`} />
        <span aria-hidden="true">{n}</span>
      </label>
    );
  };

  return (
    <section className="seat-map" aria-labelledby={`${name}-title`}>
      <div className="seat-map__head">
        <p id={`${name}-title`} className="group-title">{space.unitName} 배치도 <Provisional note={SEAT_LAYOUT.note} /></p>
        <p className="group-hint">남은 {space.unitName} {freeCount}개 / 전체 {count}개 · 실제 매장 배치와 다를 수 있어요</p>
      </div>

      <div className={`floor floor--${type}`}>
        {type === 'suite' ? (
          // Suite: 가운데 복도를 두고 양쪽에 방
          <div className="floor__suite">
            {zones.map((z, i) => (
              <div key={z.id} className={`zone zone--${z.look}`} data-side={i === 0 ? 'window' : 'inner'}>
                <p className="zone__label">{z.label}<span>{z.desc}</span></p>
                <div className="zone__rooms">{z.seats.map((n) => seat(n, z))}</div>
              </div>
            ))}
            <div className="floor__corridor" aria-hidden="true"><span>복도</span></div>
          </div>
        ) : (
          zones.map((z) => (
            <div key={z.id} className={`zone zone--${z.look}`}>
              <p className="zone__label">{z.label}<span>{z.desc}</span></p>
              {z.look === 'facing' ? (
                // 가운데 가림막을 두고 위·아래 줄이 마주 본다
                <div className="zone__facing">
                  <div className="zone__seats" style={{ '--cols': z.cols }}>{z.seats.slice(0, Math.ceil(z.seats.length / 2)).map((n) => seat(n, z))}</div>
                  <span className="zone__divider" aria-hidden="true" />
                  <div className="zone__seats" style={{ '--cols': z.cols }}>{z.seats.slice(Math.ceil(z.seats.length / 2)).map((n) => seat(n, z))}</div>
                </div>
              ) : (
                <div className="zone__seats" style={{ '--cols': z.cols }}>{z.seats.map((n) => seat(n, z))}</div>
              )}
            </div>
          ))
        )}
        <p className="floor__door" aria-hidden="true">입구 · 카운터</p>
      </div>

      <ul className="seat-legend" aria-hidden="true">
        <li><span className="seat-legend__dot" />선택 가능</li>
        <li><span className="seat-legend__dot seat-legend__dot--on" />선택</li>
        <li><span className="seat-legend__dot seat-legend__dot--off" />예약됨</li>
      </ul>
      <p className="seat-map__picked" aria-live="polite">
        {picked ? <><b lang="en">{value}</b>번 {space.unitName} · {picked.label}</> : `배치도에서 ${space.unitName}을 골라 주세요`}
      </p>
    </section>
  );
}
