import { Link, useParams } from 'react-router-dom';
import { CLOSING_NOTICES, HOLIDAYS } from '../config/policy.js';
import { AppBar } from '../components/AppShell.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import Icon from '../components/Icon.jsx';
import { useNow } from '../lib/AppData.jsx';
import { getNotice, sortedNotices } from '../lib/notices.js';
import { formatDate, toDateString } from '../lib/time.js';
import NotFoundPage from './NotFoundPage.jsx';

const dotDate = (d) => d.replaceAll('-', '.');

// 공지사항 목록 (홈 맨 아래 안내 · 고객 지원, 필수 규칙 6): 게시판처럼 분류 · 제목 · 날짜 한 줄씩, 중요 공지는 맨 위 고정
export default function NoticePage() {
  const list = sortedNotices();
  return (
    <>
      <AppBar back title="공지사항" />
      <div className="screen-body order-body">
        <BrandBand id="notice-title" script="notice" title="공지사항" hint={`전체 ${list.length}건 · 확정된 운영 정책에서 나온 소식만 알려 드려요`} />
        <ul className="board" aria-label="공지 목록">
          {list.map((n) => (
            <li key={n.id}>
              <Link to={`/notice/${n.id}`} className="board-row" data-pinned={n.pinned || undefined}>
                <span className="board-row__meta">
                  {n.pinned && <span className="board-row__pin">중요</span>}
                  <span className="board-row__cat">{n.category}</span>
                </span>
                <span className="board-row__title">{n.title}</span>
                <span className="board-row__date" lang="en">{dotDate(n.date)}</span>
                <Icon name="chevron" size={18} className="board-row__chev" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// 공지 상세: 분류 · 제목 · 날짜 머리, 본문, 정책 데이터에서 나온 덧붙임(다가오는 휴무일 · 마감 안내)
export function NoticeDetailPage() {
  const { id } = useParams();
  const now = useNow();
  const notice = getNotice(id);
  if (!notice) return <NotFoundPage />;
  const upcoming = HOLIDAYS.filter((d) => d >= toDateString(now)).slice(0, 8);
  const list = sortedNotices();
  const i = list.findIndex((n) => n.id === id);
  const [prev, next] = [list[i - 1], list[i + 1]];
  return (
    <>
      <AppBar back title="공지사항" />
      <div className="screen-body">
        <article className="notice-article" aria-labelledby="notice-h">
          <header className="notice-article__head">
            <span className="board-row__meta">
              {notice.pinned && <span className="board-row__pin">중요</span>}
              <span className="board-row__cat">{notice.category}</span>
            </span>
            <h2 id="notice-h" className="notice-article__title">{notice.title}</h2>
            <p className="notice-article__date"><span lang="en">{dotDate(notice.date)}</span> · Aulo</p>
          </header>
          <div className="notice-article__body">
            {notice.body.map((p) => <p key={p}>{p}</p>)}
            {notice.extra === 'holidays' && upcoming.length > 0 && (
              <ul className="notice-card__dates" aria-label="다가오는 휴무일">
                {upcoming.map((d) => <li key={d}>{formatDate(d)}</li>)}
              </ul>
            )}
            {notice.extra === 'closing' && <ul className="note-list">{CLOSING_NOTICES.map((n) => <li key={n}>{n}</li>)}</ul>}
          </div>
        </article>
        <nav className="notice-nav" aria-label="다른 공지">
          {prev && <Link to={`/notice/${prev.id}`} className="notice-nav__row"><span>이전 글</span><strong>{prev.title}</strong></Link>}
          {next && <Link to={`/notice/${next.id}`} className="notice-nav__row"><span>다음 글</span><strong>{next.title}</strong></Link>}
          <Link to="/notice" className="button button--secondary button--block">목록으로</Link>
        </nav>
      </div>
    </>
  );
}
