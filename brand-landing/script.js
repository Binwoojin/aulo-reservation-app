// Aulo 브랜드 랜딩 — 동적 표현 (점진적 향상)
// 'Stay in your rhythm': 한 번 등장하는 움직임과 스크롤에 따라 움직이는 표현만 쓴다(반복 장식 없음).
// JS가 없거나 '동작 줄이기' 설정이면 아무것도 숨기지 않고, 위치 안내(현재 메뉴·앱 화면 전환)만 동작한다.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = 'IntersectionObserver' in window;
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  // 순서 번호: 단어·문장·목록 항목이 짧은 간격으로 이어서 등장
  document.querySelectorAll('.display .word').forEach((el, i) => el.style.setProperty('--i', i));
  document.querySelectorAll('.hero__copy > :not(h1)').forEach((el, i) => el.style.setProperty('--i', i));
  document.querySelectorAll('.facts__list, .brand-values, .day-line, .principles__list, .menu-row, .usage-steps').forEach((list) => {
    [...list.children].forEach((li, i) => li.style.setProperty('--i', i));
  });
  document.querySelectorAll('.space-card').forEach((card, i) => card.style.setProperty('--i', i));

  // 브랜드 문장을 단어로 나눈다 (읽는 만큼 밝아지게). 글자는 그대로라 스크린리더는 한 문장으로 읽는다
  const statement = document.querySelector('[data-words]');
  let words = [];
  if (statement && !reduceMotion) {
    const text = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    text.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = w;
      statement.append(span);
      if (i < text.length - 1) statement.append(' ');
    });
    words = [...statement.querySelectorAll('.w')];
  }

  const motion = !reduceMotion && canObserve;
  if (motion) root.classList.add('motion-ready');

  // ── 스크롤 등장: 한 번 보이면 다시 숨기지 않는다 ──
  if (motion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add(el.classList.contains('space-card') ? 'is-in' : 'is-visible');
        el.addEventListener('transitionend', (e) => {
          if (e.target === el && e.propertyName === 'opacity') el.classList.add('is-settled');
        });
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    document.querySelectorAll('[data-reveal], .space-card').forEach((el) => revealObserver.observe(el));

    // 앵커로 이동하거나 포커스가 들어간 요소는 즉시 보이게 한다
    document.addEventListener('focusin', (e) => {
      const el = e.target.closest('[data-reveal]');
      if (el) el.classList.add('is-visible');
      const card = e.target.closest('.space-card');
      if (card) card.classList.add('is-in');
    });

    // 숫자: 확정 정책 값까지 천천히 센다 (지어낸 숫자 없음)
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const to = Number(el.dataset.count);
        const start = performance.now();
        const tick = (t) => {
          const p = clamp((t - start) / 1200);
          el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = '0'; countObserver.observe(el); });
  }

  // ── 스크롤에 따라 움직이는 표현 (한 프레임에 한 번만 계산) ──
  const header = document.querySelector('.site-header');
  const bar = document.querySelector('.scroll-progress span');
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const dayLine = document.querySelector('.day-line');
  const cards = [...document.querySelectorAll('.space-card')];
  const stackQuery = window.matchMedia('(min-width: 900px) and (min-height: 760px)');
  const steps = [...document.querySelectorAll('.app-step')];
  const stepList = document.querySelector('.app-steps');
  const screens = [...document.querySelectorAll('.phone--stage > img')];
  const counter = document.querySelector('.app-story__current');
  let activeScreen = 'find';

  const update = () => {
    const vh = window.innerHeight;
    const max = root.scrollHeight - vh;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;

    // 앱 단계: 화면 가운데에 가장 가까운 단계를 현재로 (동작 줄이기여도 위치 안내로 동작)
    if (steps.length) {
      let best = null;
      let bestDist = Infinity;
      steps.forEach((step) => {
        const r = step.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - vh / 2);
        if (dist < bestDist) { bestDist = dist; best = step; }
      });
      const id = best?.dataset.screen;
      if (id && id !== activeScreen) {
        activeScreen = id;
        steps.forEach((s) => s.classList.toggle('is-active', s === best));
        screens.forEach((img) => img.classList.toggle('is-active', img.dataset.screen === id));
        if (counter) counter.textContent = String(steps.indexOf(best) + 1).padStart(2, '0');
      }
      if (stepList) {
        const r = stepList.getBoundingClientRect();
        stepList.style.setProperty('--progress', clamp((vh / 2 - r.top) / r.height).toFixed(3));
      }
    }

    if (!motion) return;
    header?.classList.toggle('is-scrolled', window.scrollY > 8);

    // 사진·휴대폰: 부모 기준으로 천천히 다른 속도로 움직인다 (translate 속성만 써서 등장 애니메이션과 겹치지 않게)
    parallax.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const offset = (vh / 2 - (r.top + r.height / 2)) * Number(el.dataset.parallax);
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    });

    // 브랜드 문장: 읽는 만큼 단어가 밝아진다
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    }

    // 하루 타임라인: 스크롤한 만큼 선이 그어진다
    if (dayLine) {
      const r = dayLine.getBoundingClientRect();
      dayLine.style.setProperty('--progress', clamp((vh * 0.75 - r.top) / (r.height + vh * 0.2)).toFixed(3));
    }

    // 공간 카드: 다음 카드가 덮어 올수록 앞 카드가 살짝 작아지고 어두워진다 (넓은 화면에서만)
    if (stackQuery.matches) {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const stick = parseFloat(getComputedStyle(card).top) || 0;
        const h = card.offsetHeight;
        const t = clamp((stick + h - next.getBoundingClientRect().top) / h);
        card.style.setProperty('--s', (1 - t * 0.06).toFixed(4));
        card.style.setProperty('--b', (1 - t * 0.35).toFixed(3));
      });
    } else {
      cards.forEach((card) => { card.style.removeProperty('--s'); card.style.removeProperty('--b'); });
    }
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  if (!canObserve) return;

  // ── 현재 섹션 / 현재 공간 표시 (동작 줄이기와 무관한 위치 안내) ──
  // 화면 중앙 띠에 걸친 대상 중 문서 순서상 첫 번째를 현재 위치로 표시한다.
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
