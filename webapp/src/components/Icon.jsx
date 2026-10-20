// 선형 아이콘 세트 (24px 그리드, 1.75 stroke). 장식용이면 aria-hidden, 의미가 있으면 label을 준다.
const PATHS = {
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  close: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16" /><path d="M8.5 3.5v4" /><path d="M15.5 3.5v4" /></>,
  cup: <><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9z" /><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M9 3.5c0 1.5 1.5 1.5 1.5 3" /></>,
  compass: <><circle cx="12" cy="12" r="8" /><path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4z" /></>,
  receipt: <><path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" /><path d="M9 8.5h6" /><path d="M9 12h6" /></>,
  info: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
  pin: <><path d="M12 20s6-5.4 6-10a6 6 0 0 0-12 0c0 4.6 6 10 6 10z" /><circle cx="12" cy="10" r="2.2" /></>,
  home: <><path d="M4.5 10.5L12 4l7.5 6.5" /><path d="M6.5 9v10h11V9" /></>,
  door: <><path d="M6 20V4.5h10V20" /><path d="M4 20h16" /><path d="M13 12h.01" /></>,
  chat: <><path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5z" /><path d="M8 11h8" /><path d="M8 14h5" /></>,
  send: <><path d="M4 12l16-7-6 15-2.5-6.5z" /><path d="M11.5 13.5L20 5" /></>,
  bag: <><path d="M5.5 8h13l-1 11.5h-11z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  alert: <><path d="M12 4l9 16H3z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>,
  down: <path d="M6 9l6 6 6-6" />,
  bell: <><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  repeat: <><path d="M5 10a7 7 0 0 1 12-3.5L19 9" /><path d="M19 4.5V9h-4.5" /><path d="M19 14a7 7 0 0 1-12 3.5L5 15" /><path d="M5 19.5V15h4.5" /></>,
};

export default function Icon({ name, size = 24, label, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
