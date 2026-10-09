import { useState } from 'react';
import { refundOrder } from '../api/tickets';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-09-15", "16:30" -> "Tue 15 Sep · 16:30"
function when(date, time) {
  if (!date) return time;
  const [y, m, d] = date.split('-').map(Number);
  const day = DAYS[new Date(y, m - 1, d).getDay()];
  return `${day} ${d} ${MONTHS[m - 1]}${time ? ` · ${time}` : ''}`;
}

function Meta({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] leading-[13px] font-semibold tracking-[0.06em] text-muted uppercase">{label}</span>
      <span className="text-[14px] leading-[15px] font-semibold">{children}</span>
    </div>
  );
}

export default function TicketCard({ order, onRefunded }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { movie, session } = order;
  const refunded = order.status === 'refunded';
  const showRefund = order.isUpcoming && !refunded;
  const reason = 'Refunds close 2 hours before the session starts.';

  async function doRefund() {
    setBusy(true);
    setError('');
    try {
      const updated = await refundOrder(order.reference);
      onRefunded(updated);
    } catch (e) {
      setError(e.message || 'Refund failed. Please try again.');
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex min-h-[183px] items-stretch rounded-[26px] bg-surface">
      {/* Left: poster + details */}
      <div className="flex min-w-0 flex-1 items-center gap-[18px] px-[30px] py-6">
        {movie.poster ? (
          <img src={movie.poster} alt="" className="h-[133px] w-[100px] shrink-0 rounded-[10px] object-cover" />
        ) : (
          <div className="h-[133px] w-[100px] shrink-0 rounded-[10px] bg-line" />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-[10px]">
            <h3 className="truncate text-[20px] leading-[22px] font-extrabold uppercase">{movie.title}</h3>
            {movie.ageCode && (
              <span className="rounded-full bg-accent/10 px-2 py-[3px] text-[12px] leading-[13px] font-semibold text-accent">
                {movie.ageCode}
              </span>
            )}
            {movie.runtime && <span className="text-[14px] leading-[130%] text-muted">{movie.runtime} min</span>}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <Meta label="Date">{when(session.date, session.time)}</Meta>
              <Meta label="Venue">
                {[session.venue, session.hall && `Hall ${session.hall}`].filter(Boolean).join(' · ')}
              </Meta>
              <Meta label="Format">{[session.format, session.language].filter(Boolean).join(' · ')}</Meta>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] leading-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Seats</span>
              {order.seats.map((s) => (
                <span
                  key={s.code}
                  className="rounded-md bg-white/10 px-[10px] py-1 text-[12px] leading-[13px] font-semibold"
                >
                  {s.code} · {s.type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: stub */}
      <div className="flex w-[300px] shrink-0 flex-col gap-4 rounded-r-[26px] border-l border-dashed border-line px-6 py-5">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[12px] leading-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Order</span>
          <span className="text-[14px] leading-[15px] font-semibold">#{order.reference}</span>
        </div>

        <div className="flex flex-col gap-[10px]">
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] leading-[15px] font-semibold text-muted">
              {refunded ? 'Refunded' : 'Total paid'}
            </span>
            <span className="text-[24px] leading-[26px] font-extrabold">₾{order.total}</span>
          </div>

          {showRefund && !confirming && (
            <>
              <button
                type="button"
                disabled={!order.isRefundable}
                title={order.isRefundable ? undefined : reason}
                onClick={() => setConfirming(true)}
                className="flex h-[35px] w-full items-center justify-center rounded-full bg-white/10 px-[22px] text-[14px] leading-[15px] font-extrabold transition enabled:cursor-pointer enabled:hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Refund
              </button>
              <p className="text-center text-[12px] leading-[130%] text-muted">
                {order.isRefundable ? 'Refundable until 2 hours before the session.' : reason}
              </p>
            </>
          )}

          {showRefund && confirming && (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                  className="flex h-[35px] flex-1 cursor-pointer items-center justify-center rounded-full bg-white/10 text-[14px] font-extrabold transition hover:bg-white/20 disabled:opacity-40"
                >
                  Keep
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={doRefund}
                  className="flex h-[35px] flex-1 cursor-pointer items-center justify-center rounded-full bg-accent text-[14px] font-extrabold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? 'Refunding…' : 'Yes, refund'}
                </button>
              </div>
              <p className="text-center text-[12px] leading-[130%] text-muted">This cannot be undone.</p>
            </>
          )}

          {error && <p className="text-center text-[12px] leading-[130%] font-semibold text-accent">{error}</p>}
        </div>
      </div>
    </article>
  );
}