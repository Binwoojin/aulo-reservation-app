import { SpaceImage } from './ui.jsx';

// 브랜드 띠 (2026-10-20 톤): 따뜻한 베이지 그라데이션 위에 로고와 같은 Fraunces 소문자 한 줄 + 제목.
// top: 띠 맨 위(예: 매장 선택), children: 제목 아래(예: 탭)
export function BrandBand({ id, script, title, hint, top, children }) {
  return (
    <section className="order-band brand-band" aria-labelledby={id}>
      {top}
      <p className="shelf-script" lang="en">{script}</p>
      <h2 id={id} className="order-band__title">{title}</h2>
      {hint && <p className="brand-band__hint">{hint}</p>}
      {children}
    </section>
  );
}

// 지금 보고 있는 공간: 작은 아치형 사진 + Fraunces 이름 + 한 줄
export function SpaceHead({ space, sub }) {
  return (
    <div className="reserve-space">
      <SpaceImage space={space} />
      <span>
        <span className="reserve-space__name" lang="en">{space.name}</span>
        <span className="reserve-space__headline">{sub ?? space.headline}</span>
      </span>
    </div>
  );
}
