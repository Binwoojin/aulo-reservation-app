import { useEffect } from 'react';

// 스크롤 등장 모션: 화면을 열 때 첫 화면 아래에 있는 섹션·카드는 보이기 전까지 살짝 내려 두었다가,
// 화면 안으로 들어오면 천천히 떠오른다 (브랜드 모션 640ms · ease-settle).
// 첫 화면에 보이는 요소는 건드리지 않는다(기존 rise 애니메이션). 움직임 줄이기 설정이면 아무것도 하지 않는다.
const TARGETS = [
  '.screen-body > *',
  '.screen-body .stack > li',
  '.screen-body .my-list > li',
  '.screen-body .best-list > li',
  '.screen-body .menu-grid > li',
  '.screen-body .day-line > li',
].join(', ');

export function useScrollReveal(key) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timers = [];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        io.unobserve(el);
        el.setAttribute('data-reveal', 'in');
        // 등장이 끝나면 'done'으로 바꿔 요소 고유의 전환(누름 효과 등)을 되돌린다 (속성을 지우면 화면 열기 애니메이션이 다시 돈다)
        timers.push(window.setTimeout(() => el.setAttribute('data-reveal', 'done'), 800));
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

    // 화면이 그려진 다음 프레임에 첫 화면 밖 요소만 고른다
    const raf = window.requestAnimationFrame(() => {
      const fold = window.innerHeight * 0.94;
      for (const el of document.querySelectorAll(TARGETS)) {
        if (el.hasAttribute('data-reveal') || el.parentElement?.closest('[data-reveal=""]')) continue; // 부모가 이미 등장 대상이면 함께 움직인다
        const r = el.getBoundingClientRect();
        const offRight = r.left > window.innerWidth; // 가로 목록에서 아직 안 보이는 카드
        if (r.height === 0 || (r.top < fold && !offRight)) continue;
        el.setAttribute('data-reveal', '');
        io.observe(el);
      }
    });
    return () => {
      window.cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      io.disconnect();
      // 아직 안 보인 요소는 그대로 보이게 둔다 (같은 화면에서 주소만 바뀔 때)
      document.querySelectorAll('[data-reveal=""], [data-reveal="in"]').forEach((el) => el.setAttribute('data-reveal', 'done'));
    };
  }, [key]);
}
