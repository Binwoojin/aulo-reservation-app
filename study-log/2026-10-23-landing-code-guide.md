# 2026-10-23 학습 기록 — 브랜드 랜딩 코드 해설 (면접 대비)

대상: `brand-landing/` (index.html · styles.css · script.js)

이 문서는 "무엇을 썼나"보다 **"왜 그렇게 했나"** 를 설명할 수 있게 정리했다.
항목마다 아래 네 가지를 적었다.

- **개념**: 이 기술이 무엇인지 한두 줄
- **코드**: 랜딩에서 실제로 쓴 곳
- **왜**: 이 프로젝트에서 이걸 고른 이유
- **면접에서**: 그대로 말해도 되는 문장

> 면접 팁: AI 도구와 함께 만들었다면 숨기지 말고 "AI로 초안을 만들고, 제가 이유를 이해한 뒤 브라우저에서 직접 검증하고 고쳤다"고 말하는 편이 좋다.
> 아래 '7. 문제 해결 이야기'처럼 **직접 확인하고 숫자로 증명한 경험**이 가장 강한 답이 된다.

---

## 0. 한 문장 요약

> "프레임워크 없이 HTML·CSS·JavaScript만으로 만든 한 페이지짜리 브랜드 랜딩입니다.
> 의미에 맞는 HTML로 구조와 접근성을 잡고, CSS 변수로 디자인 값을 관리하고,
> JavaScript는 움직임만 '덧붙이는' 방식으로 써서 JS가 없거나 움직임을 끈 사용자도 내용을 모두 볼 수 있게 했습니다."

### 왜 React 같은 프레임워크를 안 썼나

- 랜딩은 **보여 주는 페이지**다. 로그인, 장바구니처럼 바뀌는 상태가 거의 없다.
- 프레임워크를 쓰면 번들(JS 파일)이 커지고 첫 화면이 늦어진다. 랜딩은 첫인상이 중요하다.
- 반대로 웹앱(`webapp/`)은 예약·주문 상태가 많아서 React를 썼다.

> 면접에서: "페이지 성격에 맞춰 도구를 골랐습니다. 상태가 적은 랜딩은 정적 HTML로 가볍게 만들고, 상태가 많은 웹앱은 React로 나눴습니다."

---

## 1. HTML — 의미에 맞는 구조와 접근성

### 1-1. 시맨틱 태그 (Semantic HTML)

- **개념**: `<div>` 대신 역할이 있는 태그(`header`, `nav`, `main`, `section`, `article`, `footer`, `ol`, `dl`)를 쓰는 것.
- **코드**:
  - 공간 카드 4개는 `<article>`이다. 각각 독립적인 내용이기 때문이다.
  - 스펙(이용료, 예약 시간)은 `<dl><dt>이용료</dt><dd>…</dd></dl>`다. 이름과 값의 짝이기 때문이다.
  - 하루 타임라인과 이용 절차는 `<ol>`이다. 순서가 있기 때문이다.
- **왜**: 스크린리더는 태그를 보고 "목록, 5개 항목", "탐색 영역"처럼 구조를 읽어 준다. 검색 엔진도 구조를 더 잘 이해한다.
- **면접에서**: "태그를 모양이 아니라 의미로 골랐습니다. 순서가 있는 단계는 `ol`, 이름과 값의 짝은 `dl`을 써서 보조기기가 구조를 그대로 읽게 했습니다."

### 1-2. 섹션 이름 붙이기 — `aria-labelledby`

```html
<section id="spaces" aria-labelledby="spaces-title">
  <h2 id="spaces-title">같은 건물, 다른 머무름.</h2>
```

- **개념**: 섹션에 "이 영역의 이름은 이 제목"이라고 연결한다.
- **왜**: 스크린리더 사용자는 '영역 목록'으로 페이지를 훑는다. 이름이 없으면 "영역, 영역, 영역…"으로만 들린다.

### 1-3. 본문 바로가기 (Skip link)

```html
<a class="skip-link" href="#main">본문으로 바로가기</a>
```

```css
.skip-link { position: absolute; top: -100px; }   /* 평소엔 화면 밖 */
.skip-link:focus { top: var(--space-3); }          /* Tab 키로 오면 보임 */
```

- **왜**: 키보드 사용자가 매 페이지마다 헤더 메뉴를 Tab으로 다 지나가지 않아도 되게 한다. 마우스 사용자에게는 보이지 않는다.

### 1-4. 보이는 것과 읽히는 것을 나누기 — `visually-hidden` / `aria-hidden`

히어로 제목은 단어마다 따로 올라오는 모션 때문에 `<span>`으로 잘게 쪼개져 있다.
스크린리더가 이를 "Stay. in. your. rhythm."처럼 끊어 읽지 않게 하는 방법이다.

```html
<h1 id="hero-title">
  <span class="visually-hidden">Stay in your rhythm.</span>   <!-- 스크린리더용 한 문장 -->
  <span class="line" aria-hidden="true">                       <!-- 눈으로 보는 모션용 -->
    <span class="word">Stay</span> <span class="word">in</span>
  </span>
  …
</h1>
```

- `visually-hidden`: 화면에서는 안 보이지만 스크린리더는 읽는다. `display: none`은 스크린리더도 못 읽으니 쓰면 안 된다.
- `aria-hidden="true"`: 화면에는 보이지만 스크린리더는 건너뛴다. 장식(진행 막대, 큰 워드마크, 흐르는 영문 문장)에 썼다.
- **면접에서**: "시각 효과를 위해 글자를 쪼갰지만, 보조기기에는 완성된 문장 하나가 전달되도록 시각용과 낭독용을 분리했습니다."

### 1-5. 버튼 이름은 보이는 글자로 시작 (WCAG 2.5.3 Label in Name)

```html
<a class="brand" href="#home">aulo<span class="visually-hidden"> 페이지 처음으로</span></a>
```

- **왜**: 음성으로 조작하는 사용자는 화면에 보이는 글자("aulo")를 말해서 누른다. `aria-label="홈으로"`처럼 보이는 글자와 다른 이름을 붙이면 음성 명령이 안 먹는다. 그래서 설명은 보이는 글자 **뒤에** 숨김 글자로 덧붙였다.

### 1-6. 지금 위치 알리기 — `aria-current="location"`

- 스크롤하면 JS가 지금 보고 있는 섹션 메뉴에 `aria-current="location"`을 붙인다.
- CSS는 이 속성을 보고 밑줄을 그린다: `.site-nav a[aria-current="location"]::after { transform: scaleX(1); }`
- **왜**: 상태를 **클래스가 아니라 ARIA 속성**으로 표시하면, 화면의 모양과 스크린리더가 듣는 상태가 항상 같아진다. 하나의 정보로 둘을 해결한다.

### 1-7. 링크에 보충 설명 연결 — `aria-describedby`

```html
<a href="app/" aria-describedby="demo-status">공간 이용 체험하기</a>
<p id="demo-status">… 실제 예약·결제는 없어요.</p>
```

- 버튼 이름은 짧게 두고, "데모라 실제 결제 없음"이라는 중요한 안내를 버튼에 연결해 함께 읽히게 했다.

### 1-8. JS 없이 되는 기본 기능 — 앵커 링크, `<details>`

- 공간 칩(카페·집중·휴식·프라이빗)은 필터 버튼이 아니라 `href="#flow-focus"` **링크**다. JS 없이도 동작하고, 네 공간 설명이 항상 모두 보인다.
- 정책 안내 접기/펼치기는 `<details><summary>`다. JS 없이 키보드·스크린리더 지원이 기본으로 된다.
- **면접에서**: "브라우저가 이미 제공하는 기능은 JS로 다시 만들지 않았습니다. 코드가 줄고, 접근성은 브라우저가 보장해 줍니다."

---

## 2. 이미지·글꼴 성능

### 2-1. 반응형 이미지 — `srcset` + `sizes`

```html
<img src="assets/flow-cafe-768.webp"
     srcset="assets/flow-cafe-768.webp 768w, assets/flow-cafe-1536.webp 1536w"
     sizes="(min-width: 900px) 45vw, 100vw" …>
```

- **개념**: 같은 사진을 크기별로 준비해 두면, 브라우저가 화면 폭과 화소 밀도에 맞는 파일을 고른다.
- `sizes`는 "이 이미지가 화면에서 차지할 폭"을 알려 준다. 900px 이상이면 화면 폭의 45%, 아니면 100%다.
- **왜**: 휴대폰에 1536px 사진을 보내면 데이터와 로딩 시간이 낭비된다.

### 2-2. `width`·`height` 지정 — 화면 밀림(CLS) 막기

- 이미지가 로드되기 전에도 브라우저가 비율을 알고 자리를 비워 둔다. 그래서 사진이 뜨면서 글이 아래로 밀리는 현상(Cumulative Layout Shift)이 없다.

### 2-3. 로딩 우선순위

| 속성 | 쓴 곳 | 이유 |
| --- | --- | --- |
| `fetchpriority="high"` | 히어로 사진 | 첫 화면에서 가장 큰 요소(LCP)라 먼저 받는다 |
| `loading="lazy"` | 나머지 사진 | 스크롤해서 가까워질 때 받는다 |
| `decoding="async"` | 모든 사진 | 이미지 해독이 화면 그리기를 막지 않게 한다 |
| WebP 형식 | 모든 사진 | JPG보다 같은 화질에 용량이 작다 |

- **면접에서**: "첫 화면의 가장 큰 이미지만 우선순위를 올리고 나머지는 지연 로딩해서, 첫 화면 표시 속도(LCP)에 집중했습니다."

### 2-4. 글꼴 직접 포함 + 분할 파일

- Pretendard를 외부 서버가 아니라 `assets/fonts/pretendard/`에 넣었다. 외부 글꼴 서버가 막혀도 항상 같은 글꼴이 나온다.
- 'dynamic subset'은 글꼴을 글자 묶음별로 잘게 나눈 파일이다. CSS의 `unicode-range` 덕분에 **페이지에 실제로 쓰인 글자가 들어 있는 조각만** 내려받는다. 한글 글꼴은 전체가 수 MB라 이 방법이 중요하다.
- Google Fonts(Fraunces·Manrope)에는 `<link rel="preconnect">`로 서버 연결을 미리 열어 둔다.

---

## 3. CSS — 디자인 값 관리와 레이아웃

### 3-1. CSS 변수로 디자인 토큰 관리 (Custom Properties)

```css
:root {
  --color-olive: #596246;
  --space-3: 16px;
  --radius-card: 16px;
  --arch: 999px 999px var(--radius-card) var(--radius-card); /* 아치형 사진 틀 */
  --motion: 180ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

- **개념**: 색, 간격, 모서리, 움직임 속도를 이름 붙인 변수로 한곳에 모은다.
- **왜**:
  1. 스타일 보드(디자인 문서)와 코드가 같은 이름을 쓰니 디자인 변경이 한 줄 수정으로 끝난다.
  2. 간격을 4px 단위로 제한하면 화면 간격이 저절로 일정해진다.
  3. 웹앱과 같은 `--arch`(아치형 사진 틀)를 써서 랜딩과 앱의 분위기가 이어진다.
- **면접에서**: "디자인 시스템의 토큰을 CSS 변수로 옮겨, 값이 흩어지지 않고 한곳에서 바뀌도록 했습니다."

### 3-2. 데이터 속성으로 공간별 색 바꾸기

```css
[data-service="focus"] { --tag-fg: var(--focus-fg); --tag-bg: var(--focus-bg); }
.tag { color: var(--tag-fg); background: var(--tag-bg); }
.feature-list li::before { background: var(--tag-fg); }
```

- HTML에 `data-service="focus"`만 붙이면 그 안의 태그, 특징 점, 타임라인 점 색이 모두 Focus 색으로 바뀐다.
- **왜**: 공간이 4개인데 색 규칙을 4번씩 쓰지 않아도 된다. CSS 변수는 **부모에서 자식으로 상속**되기 때문에 가능한 방법이다.

### 3-3. 유동 글자 크기 — `clamp()`

```css
--fs-display: clamp(3rem, 1.6rem + 6vw, 5.5rem); /* 48px → 88px */
```

- `clamp(최소, 기본, 최대)`: 화면 폭(`vw`)에 따라 커지되, 최소와 최대를 넘지 않는다.
- **왜**: 미디어쿼리로 화면 폭마다 글자 크기를 끊어서 지정하지 않아도 모든 폭에서 자연스럽다.

### 3-4. 모바일 우선 (Mobile-first)

```css
.facts__list { grid-template-columns: repeat(2, 1fr); }      /* 기본 = 휴대폰 */
@media (min-width: 900px) {
  .facts__list { grid-template-columns: repeat(4, 1fr); }    /* 넓으면 4칸 */
}
```

- 기본 스타일을 휴대폰 기준으로 쓰고, `min-width`로 넓은 화면을 덧붙인다.
- **왜**: 이용자 대부분이 휴대폰이다. 작은 화면에서 시작하면 "꼭 필요한 것"부터 배치하게 된다.

### 3-5. Grid 영역 이름 — `grid-template-areas`

```css
.site-header__inner { grid-template-areas: "brand cta" "nav nav"; }   /* 좁은 화면 */
@media (min-width: 768px) {
  .site-header__inner { grid-template-areas: "brand nav cta"; }       /* 넓은 화면 */
}
```

- HTML 순서는 그대로 두고 CSS만으로 배치를 바꾼다. 영역에 이름을 붙여 그림처럼 읽힌다.

### 3-6. `position: sticky` — 카드 쌓기와 고정 휴대폰

```css
.space-card {
  position: sticky;
  top: calc(var(--header-h) + var(--space-4) + var(--i, 0) * 14px);
}
```

- **개념**: 평소에는 일반 요소처럼 흐르다가, 스크롤해서 `top` 위치에 닿으면 그 자리에 붙는다.
- 카드마다 `--i`(순번)가 달라서 14px씩 아래에 붙는다. 그래서 다음 카드가 앞 카드를 덮으며 **책장처럼 쌓인다**.
- 앱 소개에서는 휴대폰이 sticky로 고정되고, 오른쪽 글만 스크롤된다(스크롤리텔링).
- **왜**: JS로 스크롤 위치를 계산해 고정하는 것보다 가볍고 끊김이 없다. 브라우저가 직접 처리하기 때문이다.
- **주의**: 넓은 화면(900px 이상)이면서 **높이도 760px 이상**일 때만 쓴다. 낮은 화면에서는 카드가 화면보다 커서 쌓이면 내용이 가려지기 때문이다.

### 3-7. 개별 transform 속성 — `translate` · `rotate` · `scale`

```css
.phone--hero { transform: rotate(-4deg); }   /* 등장 애니메이션이 쓰는 속성 */
```

```js
el.style.translate = `0 ${offset}px`;        // 시차 효과가 쓰는 속성 (JS)
```

- **개념**: 예전에는 `transform: translateY(…) rotate(…)` 하나에 다 넣어야 했다. 지금은 `translate`, `rotate`, `scale`을 **따로 지정하면 브라우저가 합쳐** 준다.
- **왜**: 두 기능(등장 애니메이션 + 스크롤 시차)이 같은 `transform`을 쓰면 나중에 쓴 쪽이 앞의 값을 지워 버린다. 속성을 나누면 서로 덮어쓰지 않는다.
- '7-1. 호버 효과 버그'도 이 원리로 고쳤다.

### 3-8. 그 밖에 알아 둘 CSS

| 기술 | 쓴 곳 | 한 줄 이유 |
| --- | --- | --- |
| `aspect-ratio: 3 / 2` | 사진 틀 | 사진이 오기 전에도 틀의 비율 유지 |
| `object-fit: cover` | 사진 | 비율이 달라도 찌그러지지 않고 꽉 채움 |
| `scroll-padding-top` | `html` | 앵커 이동 시 고정 헤더에 제목이 가려지지 않게 |
| `scroll-snap-type` | 음료 가로 목록 | 옆으로 넘길 때 카드 단위로 딱 멈춤 |
| `counter()` | 이용 절차 01·02·03 | 번호를 HTML에 쓰지 않고 CSS가 자동으로 매김 |
| `clip-path: inset(… round …)` | 히어로 사진 | 아치 모양 그대로 아래에서 위로 드러남 |
| `overflow-x: clip` | `body` | 장식 요소가 튀어나와도 가로 스크롤이 안 생김 |
| `word-break: keep-all` | `body` | 한글이 단어 중간에서 줄바꿈되지 않게 |
| `color-mix()` | 헤더 배경 | 배경색에 투명도를 섞어 반투명 헤더 |
| `:focus-visible` | 전체 | 키보드로 이동할 때만 포커스 테두리 표시 |

---

## 4. JavaScript — 움직임을 '덧붙이는' 방식

### 4-1. 점진적 향상 (Progressive Enhancement) ★ 가장 중요한 개념

```js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canObserve = 'IntersectionObserver' in window;
const motion = !reduceMotion && canObserve;
if (motion) root.classList.add('motion-ready');
```

```css
.motion-ready [data-reveal] { opacity: 0; transform: translateY(28px); }   /* 숨기는 건 motion-ready일 때만 */
.motion-ready [data-reveal].is-visible { opacity: 1; transform: none; }
```

- **개념**: 기본 페이지는 HTML·CSS만으로 완성해 두고, 조건이 될 때만 JS로 효과를 더한다.
- **핵심**: "처음에 숨기는" CSS가 전부 `.motion-ready` 아래에 있다. 이 클래스는 JS가 붙인다. 그래서
  - JS가 실패하거나 꺼져 있으면 → 클래스가 없음 → **모든 내용이 처음부터 보인다**
  - 사용자가 OS에서 '동작 줄이기'를 켰으면 → 클래스를 붙이지 않음 → 움직임 없이 다 보인다
- **왜**: 반대로 하면(CSS에서 먼저 숨기고 JS가 보여 주면) JS 오류 한 번에 **페이지가 텅 빈다**.
- **면접에서**: "움직임은 있으면 좋은 것이지 내용을 보는 조건이 되면 안 된다고 봤습니다. 그래서 숨김 스타일을 JS가 붙이는 클래스 아래에만 두어, JS가 없거나 동작 줄이기를 켠 사용자도 전부 볼 수 있게 했습니다."

### 4-2. 동작 줄이기 존중 — `prefers-reduced-motion`

- 어지럼증이나 전정 장애가 있는 사용자는 OS 설정에서 움직임을 줄인다.
- JS에서 확인(`matchMedia`)하고, CSS에서도 한 번 더 막는다.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation: none !important; }
}
```

- 단, '지금 보고 있는 메뉴 표시'와 '앱 단계 화면 바꾸기'는 꾸밈이 아니라 **위치 안내**라서 동작 줄이기 상태에서도 동작한다(전환 효과만 없음).

### 4-3. `IntersectionObserver` — 화면에 들어오면 등장

```js
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);   // 한 번 보였으면 그만 본다
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
```

- **개념**: "이 요소가 화면에 들어왔는지"를 브라우저가 알려 주는 API.
- **왜 scroll 이벤트 대신?** scroll 이벤트로 직접 위치를 계산하면 스크롤마다 계산이 돌아 무겁다. IntersectionObserver는 브라우저가 효율적으로 처리하고, 변화가 있을 때만 알려 준다.
- `threshold: 0.12`: 요소가 12% 보이면 알린다.
- `rootMargin: '0px 0px -10% 0px'`: 화면 아래 10%를 빼고 계산한다. 너무 아래 끝에서 미리 등장하지 않게 한다.
- `unobserve`: 한 번 등장한 요소는 다시 숨기지 않는다. 위아래로 스크롤할 때마다 깜빡이면 오히려 산만하다.

### 4-4. 지금 보고 있는 섹션 찾기 — `rootMargin`으로 '가운데 띠' 만들기

```js
markCurrent([...document.querySelectorAll('.site-nav a')], { rootMargin: '-45% 0px -50% 0px' });
```

- 화면 위 45%, 아래 50%를 잘라 내면 **화면 가운데의 얇은 띠**만 남는다. 이 띠에 걸친 섹션이 '지금 섹션'이다.
- 띠에 여러 섹션이 걸치면 문서 순서상 첫 번째를 고른다.

### 4-5. 스크롤 처리 — `requestAnimationFrame` + `passive`

```js
let queued = false;
const onScroll = () => {
  if (queued) return;          // 이미 예약돼 있으면 무시
  queued = true;
  requestAnimationFrame(() => { queued = false; update(); });
};
window.addEventListener('scroll', onScroll, { passive: true });
```

- **문제**: scroll 이벤트는 한 프레임(약 16ms)에도 여러 번 올 수 있다. 매번 계산하면 낭비다.
- **해결**: `requestAnimationFrame`(rAF)은 "다음 화면을 그리기 직전에 한 번 실행"을 예약한다. `queued` 플래그로 **한 프레임에 계산을 딱 한 번만** 한다.
- `passive: true`: "이 리스너는 스크롤을 막지 않는다"고 브라우저에 약속한다. 그래서 브라우저가 JS를 기다리지 않고 바로 스크롤할 수 있다.

### 4-6. 읽기와 쓰기 나누기 — 레이아웃 스래싱(Layout Thrashing) 방지

```js
const update = () => {
  const m = measure();          // 1) 위치를 모두 먼저 읽고
  parallax.forEach((el, i) => { // 2) 그다음 한꺼번에 쓴다
    const r = m.parallax[i];
    el.style.translate = `0 ${offset}px`;
  });
};
```

- **개념**: `getBoundingClientRect()` 같은 **읽기**는 최신 레이아웃이 필요하다. 바로 앞에서 스타일을 **썼다면** 브라우저는 읽기 전에 레이아웃을 다시 계산해야 한다.
- 반복문 안에서 "읽기 → 쓰기 → 읽기 → 쓰기"를 하면 그때마다 강제 재계산이 일어난다. 이것이 레이아웃 스래싱이다.
- **해결**: 모든 읽기를 `measure()`에 모아 먼저 하고, 쓰기는 그 뒤에 몰아서 한다.
- 실제 측정 결과는 '7-2'에 있다.

### 4-7. JS는 숫자만, 모양은 CSS가 — CSS 변수로 값 넘기기

```js
dayLine.style.setProperty('--progress', 0.42);
```

```css
.day-line::after { transform: scaleX(var(--progress)); }
```

- JS는 "얼마나 진행됐는지(0~1)"만 계산해 CSS 변수로 넘기고, 그 값을 어떻게 보여 줄지는 CSS가 정한다.
- **왜**: 역할이 나뉜다. 모바일에서는 선이 세로(`scaleY`), 데스크톱에서는 가로(`scaleX`)인데, JS는 수정 없이 CSS만 미디어쿼리로 바꾸면 된다.
- 같은 방식으로 `--i`(순번)를 넘겨 **차례로 등장(stagger)** 시킨다: `transition-delay: calc(var(--i) * 90ms);`

### 4-8. 진행도 공식과 이징

**진행도 (0~1)**

```js
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const p = clamp((vh - r.top) / (vh + r.height));
```

- 요소의 윗변이 화면 아래 끝에 있으면 `p = 0`이고, 아랫변이 화면 위 끝을 지나면 `p = 1`이다.
- 거의 모든 스크롤 효과(흐르는 문장, 휴대폰 기울기)가 이 공식 하나를 응용한다. `clamp`로 0~1 밖의 값을 잘라 낸다.

**숫자 세기 이징 (ease-out cubic)**

```js
el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
```

- `1 - (1-p)³`은 처음엔 빠르고 끝에서 천천히 멈추는 곡선이다. 일정한 속도보다 자연스럽다.
- 브랜드 원칙 'Stay in your rhythm(천천히 들어오고 짧게 반응)'과 맞춘 선택이다.

### 4-9. `matchMedia` — JS에서 화면 조건 확인

```js
const stackQuery = window.matchMedia('(min-width: 900px) and (min-height: 760px)');
if (stackQuery.matches) { … }
```

- CSS 미디어쿼리와 **같은 조건**을 JS에서 확인한다. CSS에서 카드가 sticky인 조건일 때만 JS가 쌓임 효과를 계산한다.

---

## 5. 콘텐츠 원칙도 '설계'다

기술은 아니지만, 면접에서 차별점이 되는 부분이다.

- **지어낸 숫자 없음**: '4가지 공간 · 13가지 음료 · 14일 · 08–23'은 모두 확정 정책 값이다. "이용자 10만 명" 같은 숫자나 가짜 후기는 넣지 않았다.
- **사실 밝히기**: AI 생성 사진, 임시 가격, 문의 채널 '준비 중'을 페이지에 그대로 적었다.
- **진짜 화면 사용**: 앱 소개의 휴대폰 화면은 실제 웹앱 캡처다.
- **면접에서**: "포트폴리오라도 사용자를 속이는 정보는 넣지 않는다는 원칙을 세웠습니다. 데모라는 사실을 체험 버튼 바로 아래에 연결해 실제 예약으로 오해하지 않게 했습니다."

---

## 6. 검증 방법

- **axe**: 자동 접근성 검사 도구. WCAG 2.0~2.2 A/AA 기준 위반 0건.
- **html-validate**: HTML 문법 검사, 오류 0건.
- **색 대비**: 글자는 배경 대비 4.5:1 이상이다. 예를 들어 흐린 단어 색 `#736E69`는 4.6:1로 맞췄다.
- **터치 영역**: 버튼과 링크는 44px 이상이다.
- **화면 폭**: 375·390·1280·1440px에서 가로 스크롤이 생기지 않는지 확인했다.
- **Playwright**: 브라우저를 코드로 조작해 호버 결과, 스크롤 값, 성능 지표를 수정 전후로 비교했다.

---

## 7. 문제 해결 이야기 (면접용 STAR)

STAR = 상황(Situation) → 과제(Task) → 행동(Action) → 결과(Result)

### 7-1. 호버 효과가 안 되던 버그 — CSS 우선순위(Specificity)

- **상황**: 설계 원칙 카드는 마우스를 올리면 4px 떠올라야 하는데, 아무 변화가 없었다.
- **원인 찾기**: 브라우저에서 `transform` 값을 확인해 보니 `none`이었다. 두 규칙이 같은 속성을 두고 다투고 있었다.

  | 규칙 | 우선순위 (id, class, 태그) |
  | --- | --- |
  | `.principles__list li:hover` (호버) | (0, 2, 1) |
  | `.motion-ready [data-reveal].is-visible` (등장 완료) | (0, 3, 0) |

  우선순위는 세 칸(id, class, 태그)을 왼쪽부터 비교한다. **`:hover` 같은 가상 클래스와 `[data-reveal]` 같은 속성 선택자도 class 칸으로 센다.**
  - 호버: `.principles__list` + `:hover` = class 2개, `li` = 태그 1개 → **(0, 2, 1)**
  - 등장: `.motion-ready` + `[data-reveal]` + `.is-visible` = class 3개 → **(0, 3, 0)**

  class 칸이 3 > 2라서 등장 규칙의 `transform: none`이 이겼다. 태그 칸은 class 칸이 같을 때만 비교한다.
  공간 사진도 같았다: `.space-card:hover .photo > img` (0, 3, 1) < `.motion-ready .space-card.is-in .photo > img` (0, 4, 1).
- **행동**:
  - `!important`나 선택자를 더 길게 써서 이기는 방법은 쓰지 않았다. 다음 사람이 또 더 길게 써야 하는 악순환이 생기기 때문이다.
  - 대신 호버를 **다른 속성**(`translate: 0 -4px`)으로 바꿨다. 등장은 `transform`, 호버는 `translate`라 다툴 일 자체가 없어졌다(3-7 개념).
  - 공간 사진 확대도 같은 원인이라 `scale: 1.04`로 고쳤다.
- **결과**: 떠오름 0px → 4px, 사진 확대 없음 → 1.04배.
- **면접에서**: "우선순위 싸움을 더 강한 선택자로 이기는 대신, 두 기능이 서로 다른 CSS 속성을 쓰게 해서 충돌 자체를 없앴습니다."

### 7-2. 스크롤 성능 개선 — 숫자로 증명

- **상황**: 스크롤마다 실행되는 함수가 반복문 안에서 위치 읽기와 스타일 쓰기를 섞어서 하고 있었다.
- **행동**:
  - 읽기를 `measure()` 하나로 모아 먼저 하고, 쓰기를 뒤로 몰았다(4-6).
  - 계산식은 그대로 두어 보이는 움직임이 바뀌지 않게 했다.
- **검증**: 같은 스크롤 경로를 자동으로 실행하고, Chrome 성능 지표(LayoutCount, RecalcStyleCount)를 수정 전후로 비교했다.

  | 화면 | 레이아웃 재계산 | 스타일 재계산 |
  | --- | --- | --- |
  | 1440px | 136 → 105 (−23%) | 1317 → 829 (−37%) |
  | 390px | 145 → 121 (−17%) | 1372 → 1128 (−18%) |

- 카드 쌓임 값과 휴대폰 기울기 값이 수정 전과 같은지도 확인했다.
- **면접에서**: "느낌이 아니라 브라우저 지표로 전후를 비교했고, 보이는 결과가 같다는 것도 함께 검증했습니다."

---

## 8. 예상 질문과 답변

**Q. 왜 스크롤 효과에 라이브러리(GSAP 등)를 안 썼나요?**
A. 필요한 효과가 '화면에 들어오면 등장'과 '스크롤 비율에 따른 값 변화' 두 가지였습니다. 각각 IntersectionObserver와 rAF로 충분해서 250여 줄로 끝났습니다. 라이브러리를 쓰면 그만큼 파일이 커지는데, 랜딩에는 그 비용을 정당화할 효과가 없었습니다.

**Q. IntersectionObserver와 scroll 이벤트는 언제 각각 쓰나요?**
A. "들어왔다/나갔다"처럼 **경계를 넘는 순간**만 필요하면 IntersectionObserver를 씁니다. "얼마나 지나갔는지"처럼 **연속된 값**이 필요하면 scroll 이벤트에 rAF를 붙여 씁니다. 이 페이지는 둘 다 써서 역할을 나눴습니다.

**Q. 접근성은 어떻게 확인했나요?**
A. axe로 자동 검사해 위반 0건을 확인했습니다. 그 밖에 키보드로만 페이지를 이동해 보고, 대비 비율을 계산하고, 동작 줄이기 설정을 켜서 내용이 모두 보이는지 확인했습니다. 자동 검사가 못 잡는 것(예: 쪼갠 제목을 스크린리더가 어떻게 읽는지)은 구조로 직접 해결했습니다.

**Q. 성능 최적화는 무엇을 했나요?**
A. 이미지(srcset, lazy, 첫 이미지 우선순위, WebP), 글꼴(분할 파일 직접 포함), 스크롤(rAF로 프레임당 한 번, passive 리스너, 읽기/쓰기 분리) 세 갈래입니다. 마지막 것은 수정 전후 지표로 개선을 확인했습니다.

**Q. 이 프로젝트에서 아쉬운 점은요?**
A. 몇 가지가 남아 있습니다.
- JS가 없을 때 앱 단계 진행 선이 그려지지 않습니다.
- 헤더 배경에 쓴 `color-mix()`는 오래된 Safari를 위한 대체 색이 없습니다.
- 숫자 세기 전에 0이 잠깐 스크린리더에 읽힐 수 있습니다.

모두 기능에는 지장이 없는 장식이나 보조 부분이라 우선순위를 낮췄습니다.

---

## 9. 혼자 비슷하게 만들 때 순서

1. **내용부터**: 섹션 순서와 문구를 정한다. 숫자는 근거가 있는 것만 쓴다.
2. **HTML만으로 완성**: 시맨틱 태그, 제목 단계(h1 → h2 → h3), alt, 링크. 이 상태로도 읽을 수 있어야 한다.
3. **CSS 토큰**: `:root`에 색·간격·글꼴 변수를 먼저 만든다.
4. **모바일 레이아웃 → 넓은 화면**: `min-width` 미디어쿼리로 덧붙인다.
5. **이미지 최적화**: WebP 두 크기, `srcset`, `width`/`height`, `loading`.
6. **움직임은 마지막에**: `.motion-ready` 패턴, IntersectionObserver, rAF.
7. **검증**: 키보드 이동, 동작 줄이기 설정, axe, 휴대폰 폭.

### 연습 과제 (작은 것부터)

- [ ] 빈 HTML에 `[data-reveal]` 카드 3장을 만들고, IntersectionObserver로 한 번만 등장시키기
- [ ] 같은 페이지에서 '동작 줄이기'를 켜면 처음부터 다 보이게 만들기 (`.motion-ready` 패턴)
- [ ] 페이지 맨 위에 '읽은 만큼 차는 막대' 만들기 (scroll + rAF + `scaleX`)
- [ ] `position: sticky`로 카드 3장이 겹쳐 쌓이게 만들기 (`top`에 `--i` 사용)
- [ ] 일부러 `transform` 두 개를 충돌시켜 보고, `translate`/`scale` 개별 속성으로 고쳐 보기

---

## 10. 용어 정리

| 용어 | 뜻 |
| --- | --- |
| 시맨틱 HTML | 모양이 아니라 의미에 맞는 태그를 쓰는 것 |
| ARIA | 보조기기에 역할·상태·이름을 알려 주는 HTML 속성(`aria-*`) |
| WCAG | 웹 접근성 국제 기준. A·AA·AAA 단계가 있다 |
| 점진적 향상 | 기본 기능을 먼저 완성하고 가능한 환경에서만 효과를 더하는 방식 |
| CSS 변수 (Custom Property) | `--이름: 값`으로 정의하고 `var(--이름)`으로 쓰는 값. 상속된다 |
| 우선순위 (Specificity) | 같은 속성을 여러 규칙이 지정할 때 어느 규칙이 이길지 정하는 점수 |
| LCP | 첫 화면에서 가장 큰 요소가 그려지기까지 걸린 시간 |
| CLS | 로딩 중 화면 요소가 밀리는 정도 |
| rAF | `requestAnimationFrame`. 다음 화면을 그리기 직전에 함수를 실행 |
| 레이아웃 스래싱 | 읽기와 쓰기를 번갈아 해서 브라우저가 레이아웃을 계속 다시 계산하는 현상 |
| 이징 (Easing) | 움직임의 속도 곡선. ease-out은 빠르게 시작해 천천히 멈춘다 |
| 스크롤리텔링 | 스크롤에 맞춰 화면이 바뀌며 이야기를 전하는 방식 |
