import { useCallback, useEffect, useState } from 'react';
import { getTickets } from '../api/tickets';
import Button from './Button';
import TicketCard from './TicketCard';

const byStartDesc = (a, b) => (b.session.startsAt || '').localeCompare(a.session.startsAt || '');

function SubTab({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-[10px] px-[14px] py-[7px] ${
        active ? 'bg-line' : 'bg-transparent'
      } cursor-pointer`}
    >
      <span className={`text-[14px] leading-[15px] font-semibold ${active ? 'text-white' : 'text-muted'}`}>{label}</span>
      <span className={`text-[12px] leading-[13px] font-semibold ${active ? 'text-white' : 'text-disabled'}`}>{count}</span>
    </button>
  );
}

export default function MyTickets() {
  const [view, setView] = useState('upcoming');
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const load = useCallback(() => {
    let alive = true;
    setStatus('loading');
    Promise.all([getTickets('upcoming'), getTickets('past')])
      .then(([u, p]) => {
        if (!alive) return;
        setUpcoming(u);
        setPast(p);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('error')); // 401 is handled by the api client (login modal)
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  // Refund succeeded: the updated order leaves Upcoming and goes to Past
  const onRefunded = (updated) => {
    setUpcoming((list) => list.filter((o) => o.reference !== updated.reference));
    setPast((list) => [updated, ...list.filter((o) => o.reference !== updated.reference)].sort(byStartDesc));
    setView('past');
  };

  const list = view === 'upcoming' ? upcoming : past;

  return (
    <div className="mt-9 flex flex-col gap-5">
      <div className="flex w-fit gap-0 rounded-xl bg-surface p-[5px]">
        <SubTab active={view === 'upcoming'} label="Upcoming" count={upcoming.length} onClick={() => setView('upcoming')} />
        <SubTab active={view === 'past'} label="Past" count={past.length} onClick={() => setView('past')} />
      </div>

      {status === 'loading' && <p className="text-[14px] text-muted">Loading tickets…</p>}

      {status === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[14px] text-muted">Couldn't load your tickets.</p>
          <Button onClick={load}>Retry</Button>
        </div>
      )}

      {status === 'ready' && list.length === 0 && (
        <p className="text-[14px] text-muted">
          {view === 'upcoming' ? 'You have no upcoming tickets.' : 'You have no past tickets.'}
        </p>
      )}

      {status === 'ready' && list.length > 0 && (
        <div className="flex flex-col gap-5">
          {list.map((o) => (
            <TicketCard key={o.reference} order={o} onRefunded={onRefunded} />
          ))}
        </div>
      )}
    </div>
  );
}