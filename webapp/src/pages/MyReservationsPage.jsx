import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, isUpcoming } from '../components/AppShell.jsx';
import ReservationCard from '../components/ReservationCard.jsx';
import { Segmented } from '../components/ui.jsx';
import { useAppData, useNow } from '../lib/AppData.jsx';

export default function MyReservationsPage() {
  const { reservations } = useAppData();
  const now = useNow();
  const [tab, setTab] = useState('upcoming');
  const byTime = (a, b) => a.date.localeCompare(b.date) || a.start - b.start;
  const upcoming = reservations.filter((r) => isUpcoming(r, now)).sort(byTime);
  const past = reservations.filter((r) => !isUpcoming(r, now)).sort((a, b) => byTime(b, a));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <>
      <AppBar title="내 예약" />
      <div className="screen-body">
        <Segmented
          label="예약 구분"
          name="tab"
          value={tab}
          onChange={setTab}
          options={[{ value: 'upcoming', label: `다가오는 ${upcoming.length}` }, { value: 'past', label: `지난 ${past.length}` }]}
        />
        {list.length ? (
          <ul className="stack">
            {list.map((r) => <li key={r.id}><ReservationCard reservation={r} link /></li>)}
          </ul>
        ) : (
          <div className="empty-state">
            <p>{tab === 'upcoming' ? '다가오는 예약이 없어요.' : '지난 예약이 없어요.'}</p>
            {tab === 'upcoming' && <Link className="text-link" to="/reserve">공간 예약하기</Link>}
          </div>
        )}
      </div>
    </>
  );
}
