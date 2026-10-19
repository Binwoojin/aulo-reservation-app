import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppBar } from '../components/AppShell.jsx';
import Icon from '../components/Icon.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';
import { QUICK_INTENTS, answer, detectIntent } from '../lib/assistant.js';

const REPLY_DELAY_MS = 600; // 차분한 리듬: 잠깐 생각하는 듯한 간격 뒤에 답한다
let seq = 0;
const nextId = () => `m${++seq}`;

// Aulo 이용 도우미 (데모): 정책과 내 예약 상태로 답하는 시나리오형 챗봇.
// 빠른 질문 칩 위주로 쓰고, 자유 입력은 낱말로 의도를 골라 답한다.
export default function HelpPage() {
  const { user, myReservations, reservations, orders } = useAppData();
  const now = useNow();
  const [params] = useSearchParams();
  const [messages, setMessages] = useState(() => [{
    id: nextId(),
    from: 'bot',
    text: ['안녕하세요, Aulo 이용 도우미예요.', '연장·취소·지각·쿠폰처럼 이용 규칙을 내 예약 기준으로 알려 드려요. 아래에서 골라 주세요.'],
    actions: [],
  }]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);
  const asked = useRef(false);

  const ask = (intent, userText) => {
    setMessages((m) => [...m, { id: nextId(), from: 'me', text: [userText] }]);
    const reply = () => setMessages((m) => [...m, { id: nextId(), from: 'bot', ...answer(intent, { user, myReservations, reservations, orders, now }) }]);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { reply(); return; }
    setTyping(true);
    window.setTimeout(() => { setTyping(false); reply(); }, REPLY_DELAY_MS);
  };

  // 예약 상세 등에서 ?q=extend 처럼 질문을 들고 들어오면 바로 묻는다
  useEffect(() => {
    const q = QUICK_INTENTS.find((i) => i.id === params.get('q'));
    if (q && !asked.current) { asked.current = true; ask(q.id, q.label); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [messages, typing]);

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    ask(detectIntent(text), text);
  };

  return (
    <>
      <AppBar back title="이용 도우미" />
      <div className="screen-body chat-body">
        <p className="chat-note">데모 · 정해진 이용 정책으로만 답해요</p>
        <ol className="chat-log" aria-live="polite">
          {messages.map((m) => (
            <li key={m.id} className={`chat-msg chat-msg--${m.from}`}>
              {m.from === 'bot' && <span className="chat-avatar" aria-hidden="true">a</span>}
              <div className="chat-bubble">
                {m.text.map((t) => <p key={t}>{t}</p>)}
                {m.actions?.length > 0 && (
                  <div className="chat-actions">
                    {m.actions.map((a) => <Link key={a.to} to={a.to} className="chat-action">{a.label}<Icon name="chevron" size={16} /></Link>)}
                  </div>
                )}
              </div>
            </li>
          ))}
          {typing && (
            <li className="chat-msg chat-msg--bot">
              <span className="chat-avatar" aria-hidden="true">a</span>
              <div className="chat-bubble chat-typing" aria-label="답변을 준비하고 있어요"><span /><span /><span /></div>
            </li>
          )}
        </ol>
        <div ref={endRef} className="chat-end" />
      </div>

      <div className="chat-dock">
        <div className="chat-chips" role="group" aria-label="빠른 질문">
          {QUICK_INTENTS.map((q) => (
            <button key={q.id} type="button" className="chat-chip" disabled={typing} onClick={() => ask(q.id, q.label)}>{q.label}</button>
          ))}
        </div>
        <form className="chat-input" onSubmit={send}>
          <label htmlFor="chat-text" className="visually-hidden">질문 입력</label>
          <input id="chat-text" className="field__input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="예: 오늘 30분 늦을 것 같아요" autoComplete="off" />
          <button type="submit" className="icon-button chat-send" aria-label="보내기" disabled={!draft.trim() || typing}><Icon name="send" size={20} /></button>
        </form>
      </div>
    </>
  );
}
