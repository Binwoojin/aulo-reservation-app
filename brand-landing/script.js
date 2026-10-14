// Aulo 브랜드 랜딩 — 동적 표현 (점진적 향상)
// JS가 없거나 '동작 줄이기' 설정이면 아무것도 숨기지 않는다.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = 'IntersectionObserver' in window;

  // 1. 히어로 문장 순서
  document.querySelectorAll('.hero__copy > *').forEach((el, i) => el.style.setProperty('--i', i));

  // 목록 안 항목은 짧은 간격으로 이어서 등장
  document.querySelectorAll('.brand-values, .usage-steps, .keyword-list').forEach((list) => {
    [...list.children].forEach((li, i) => li.style.setProperty('--i', i));
  });
  // 카드는 같은 줄에서 왼쪽 → 오른쪽
  document.querySelectorAll('.space-card').forEach((card, i) => card.style.setProperty('--i', i % 2));

  if (!reduceMotion && canObserve) {
    root.classList.add('motion-ready');

    // 2. 스크롤 등장: 한 번 보이면 다시 숨기지 않는다
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        el.addEventListener('transitionend', (e) => {
          if (e.target === el && e.propertyName === 'opacity') el.classList.add('is-settled');
        });
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

    // 앵커로 이동하거나 포커스가 들어간 요소는 즉시 보이게 한다
    document.addEventListener('focusin', (e) => {
      const el = e.target.closest('[data-reveal]');
      if (el) el.classList.add('is-visible');
    });

    // 3. 헤더 경계선
    const header = document.querySelector('.site-header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (!canObserve) return;

  // 4. 현재 섹션 / 현재 공간 표시 (동작 줄이기와 무관한 위치 안내)
  // 화면 중앙 띠에 걸친 대상 중 문서 순서상 첫 번째를 현재 위치로 표시한다.
  // (데스크톱 2열 카드처럼 여러 대상이 동시에 걸쳐도 결과가 흔들리지 않는다)
  const markCurrent = (links, options) => {
    const pairs = links.map((a) => [a, document.querySelector(a.hash)]).filter(([, t]) => t);
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      const current = pairs.find(([, t]) => visible.has(t));
      pairs.forEach(([a]) => a.removeAttribute('aria-current'));
      if (current) current[0].setAttribute('aria-current', 'location');
    }, options);
    pairs.forEach(([, t]) => observer.observe(t));
  };

  markCurrent([...document.querySelectorAll('.site-nav a')], { rootMargin: '-45% 0px -50% 0px' });
  markCurrent([...document.querySelectorAll('.chip-nav .chip')], { rootMargin: '-40% 0px -40% 0px' });
})();
