import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, Lock, X } from 'lucide-react';
import { contestedCodes, createHold, createOrder, fieldErrors, getSeats, releaseHold } from '../api/booking';
import { getFilterOptions } from '../api/filters';
import { getSession } from '../api/sessions';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { mmss, useCountdown } from '../hooks/useCountdown';
import Button from '../components/Button';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_TYPES = [
  { id: 1, value: 'child', label: 'Child', ratio: 0.6, blockedFromAge: null },
  { id: 2, value: 'student', label: 'Student', ratio: 0.75, blockedFromAge: null },
  { id: 3, value: 'adult', label: 'Adult', ratio: 1, blockedFromAge: null },
];

// API field name -> our form key
const FIELD_MAP = { fullName: 'fullName', email: 'email', mobileNumber: 'mobile', cardNumber: 'card', expiry: 'expiry', cvv: 'cvv' };
const ALL_TOUCHED = { fullName: true, email: true, mobile: true, card: true, expiry: true, cvv: true };

const fmtDay = (iso, opts) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', opts) : '');
const longDay = (iso) => fmtDay(iso, { weekday: 'long', day: 'numeric', month: 'long' });
const shortDay = (iso) => fmtDay(iso, { weekday: 'short', day: 'numeric', month: 'short' });
const money = (n) => Math.round(n * 100) / 100;

const rules = {
  fullName: (v) => (v.trim().length < 3 ? 'Enter your full name' : ''),
  email: (v) => (!EMAIL_RE.test(v) ? 'Enter a valid email' : ''),
  mobile: (v) => (!/^5\d{8}$/.test(v.replace(/[\s+-]/g, '').replace(/^995/, '')) ? 'Georgian mobile numbers start with 5 (9 digits)' : ''),
  card: (v) => (v.replace(/\s/g, '').length !== 16 ? 'Enter 16 digits' : ''),
  expiry: (v) => {
    const m = v.match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) return 'Use MM/YY';
    return new Date(2000 + +m[2], +m[1], 0, 23, 59) < new Date() ? 'Card expired' : '';
  },
  cvv: (v) => (!/^\d{3,4}$/.test(v) ? '3 digits' : ''),
};

/* Figma input: label 12/13 semibold, gap 12, input h-44 px-16 r-12 bg #1E2031, text 14/15 semibold */
function Field({ label, value, onChange, onBlur, error, valid, placeholder, inputMode, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <label className="text-[12px] leading-[13px] font-semibold">{label}</label>
      <div className={`flex h-11 items-center justify-between rounded-xl bg-surface px-4 ${error ? 'ring-1 ring-accent' : ''}`}>
        <input
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
          className="w-full bg-transparent text-[14px] leading-[15px] font-semibold outline-none placeholder:text-muted"
        />
        {valid && !error && <Check size={16} className="shrink-0 text-success" />}
      </div>
      {error && <span className="text-[12px] leading-[13px] font-semibold text-accent">{error}</span>}
    </div>
  );
}

/* One seat cell. unavailable = empty space (keeps the grid aligned), no button. */
function Seat({ seat, state, selected, onClick }) {
  const cell = 'flex min-w-0 max-w-[52px] flex-1';
  const base = 'relative flex aspect-square w-full items-center justify-center rounded-[10px] text-[14px] leading-[15px] font-extrabold';

  if (state === 'unavailable') return <div className={cell} aria-hidden="true" />;

  if (state === 'sold') {
    return (
      <div className={cell}>
        <span className={`${base} bg-surface text-disabled`} aria-label={`Seat ${seat.code} sold`}>{seat.label}</span>
      </div>
    );
  }
  if (state === 'held') {
    return (
      <div className={cell}>
        <span
          className={`${base} overflow-hidden bg-surface text-muted`}
          title="Held by another user"
          aria-label={`Seat ${seat.code} held by another user`}
        >
          <span className="absolute h-px w-[160%] -rotate-[37deg] bg-muted/50" />
          {seat.label}
        </span>
      </div>
    );
  }
  return (
    <div className={cell}>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`Seat ${seat.code}`}
        onClick={onClick}
        className={`${base} cursor-pointer border shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          selected ? 'border-accent bg-accent text-white' : 'border-disabled bg-surface text-white hover:brightness-125'
        }`}
      >
        {seat.label}
      </button>
    </div>
  );
}

const Legend = ({ box, label }) => (
  <div className="flex items-center gap-2">
    <span className={`size-4 rounded-[5px] ${box}`} />
    <span className="text-[12px] leading-4 text-muted">{label}</span>
  </div>
);

export default function SeatModal({ session: initial, movie, onClose, onBooked }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ----- config from /filter-options ----- */
  const opts = useAsync(getFilterOptions);
  const maxSeats = opts.status === 'ready' ? opts.data.maxSeats : 3;
  const holdMinutes = opts.status === 'ready' ? opts.data.holdMinutes : 8;
  const types = opts.status === 'ready' && opts.data.ticketTypes.length ? opts.data.ticketTypes : FALLBACK_TYPES;
  const isBlocked = (t) => t.blockedFromAge != null && (movie?.ageMin ?? 0) >= t.blockedFromAge;
  // Figma order: lowest ratio first (Child 60 · Student 75 · Adult 100). Blocked types (Child on 16+) are hidden.
  const sortedTypes = [...types].sort((a, b) => (a.ratio ?? 1) - (b.ratio ?? 1));
  const visibleTypes = sortedTypes.filter((t) => !isBlocked(t));
  // Default = the highest-ratio visible type (Adult)
  const defaultType = ([...visibleTypes].reverse()[0] ?? types[0]).value;

  /* ----- fresh session details for the header ----- */
  const fetchSession = useCallback(() => getSession(initial.id), [initial.id]);
  const sessQ = useAsync(fetchSession);
  const session = sessQ.status === 'ready' && sessQ.data?.id ? { ...initial, ...sessQ.data, movie: initial.movie } : initial;

  const [step, setStep] = useState('seats'); // seats | checkout | done
  const [selected, setSelected] = useState([]); // [{ seat, type }]
  const [taken, setTaken] = useState([]); // seat CODES lost to someone else
  const [hold, setHold] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);

  const fetchSeats = useCallback(() => getSeats(initial.id), [initial.id]);
  const seatsQ = useAsync(fetchSeats);
  const sections = seatsQ.status === 'ready' ? seatsQ.data.sections : [];

  const left = useCountdown(hold?.expiresAt);

  /* ----- close: release a live hold unless the order is paid ----- */
  const holdRef = useRef(null);
  const stepRef = useRef('seats');
  useEffect(() => {
    holdRef.current = hold;
    stepRef.current = step;
  });
  const close = useCallback(() => {
    if (holdRef.current?.id && stepRef.current !== 'done') releaseHold(holdRef.current.id);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  // Restore seats this user already holds (isMine), once
  const restored = useRef(false);
  useEffect(() => {
    if (seatsQ.status !== 'ready' || restored.current) return;
    restored.current = true;
    const mine = sections.flatMap((s) => s.rows.flatMap((r) => r.seats)).filter((s) => s.isMine);
    if (mine.length) setSelected(mine.slice(0, maxSeats).map((seat) => ({ seat, type: defaultType })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatsQ.status]);

  // Back to step 1 with an empty selection and a fresh map (hold expired / refused)
  const resetToSeats = (message) => {
    setHold(null);
    setSelected([]);
    setStep('seats');
    setNotice(message);
    seatsQ.reload();
  };

  // Countdown reached zero on checkout
  useEffect(() => {
    if (step === 'checkout' && left === 0) resetToSeats('Your hold expired. Please pick your seats again.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, step]);

  /* ----- prices: session price x ticket ratio ----- */
  const unit = (type) => money((session.price ?? 0) * (types.find((t) => t.value === type)?.ratio ?? 1));
  const estimate = money(selected.reduce((sum, s) => sum + unit(s.type), 0));
  const total = hold?.total ?? estimate;

  const ticketSummary = useMemo(() => {
    const count = {};
    selected.forEach((s) => (count[s.type] = (count[s.type] ?? 0) + 1));
    return Object.entries(count)
      .map(([t, n]) => `${n} x ${types.find((x) => x.value === t)?.label ?? t}`)
      .join(', ');
  }, [selected, types]);

  const toggleSeat = (seat) => {
    setNotice('');
    setSelected((cur) => {
      if (cur.some((s) => s.seat.id === seat.id)) return cur.filter((s) => s.seat.id !== seat.id);
      if (cur.length >= maxSeats) {
        setNotice(`You can pick up to ${maxSeats} seats per order.`);
        return cur;
      }
      return [...cur, { seat, type: defaultType }];
    });
  };
  const removeSeat = (id) => setSelected((cur) => cur.filter((s) => s.seat.id !== id));
  const setType = (id, type) => setSelected((cur) => cur.map((s) => (s.seat.id === id ? { ...s, type } : s)));

  // 409: `contested` = seat codes someone else got. Mark them sold, keep the rest, refetch the map.
  const handleContested = (err) => {
    const codesLost = contestedCodes(err);
    setTaken((t) => [...new Set([...t, ...codesLost])]);
    setSelected((cur) => cur.filter((s) => !codesLost.includes(s.seat.code)));
    setHold(null);
    setStep('seats');
    setNotice(
      codesLost.length
        ? `Seat${codesLost.length > 1 ? 's' : ''} ${codesLost.join(', ')} ${codesLost.length > 1 ? 'were' : 'was'} just taken by someone else. Your other seats are still selected.`
        : err.message || 'Some seats are no longer available.'
    );
    seatsQ.reload();
  };

  const goCheckout = async () => {
    setBusy(true);
    setNotice('');
    try {
      const h = await createHold(
        session.id,
        selected.map((s) => ({ seatId: s.seat.id, ticketType: s.type }))
      );
      const expiresAt = h.expiresAt ? new Date(h.expiresAt).getTime() : Date.now() + holdMinutes * 60000;
      setHold({ ...h, expiresAt });
      setStep('checkout');
    } catch (e) {
      if (e.status === 409) handleContested(e);
      else setNotice(e.message || 'Could not hold your seats. Try again.'); // 422 message shown as it comes
    } finally {
      setBusy(false);
    }
  };

  // Checkout -> step 1: keep the hold (the user still wants these seats; holding again replaces it)
  const backToSeats = () => setStep('seats');

  /* ----- checkout form ----- */
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    mobile: user?.mobileNumber ?? '',
    card: '',
    expiry: '',
    cvv: '',
  });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const err = (k) => rules[k](form[k]);
  const formValid = Object.keys(rules).every((k) => !err(k));
  const profileIncomplete = Boolean(user) && user.profileComplete === false;

  const bind = (k, fmt = (v) => v) => ({
    value: form[k],
    onChange: (e) => {
      setForm((f) => ({ ...f, [k]: fmt(e.target.value) }));
      setServerErrors((s) => ({ ...s, [k]: '' }));
      setFormError('');
    },
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    error: (touched[k] ? err(k) : '') || serverErrors[k] || '',
    valid: Boolean(form[k]) && !err(k),
  });
  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  const fmtCvv = (v) => v.replace(/\D/g, '').slice(0, 4);

  const pay = async () => {
    setTouched(ALL_TOUCHED);
    if (!formValid || profileIncomplete || !hold?.id) return;
    setBusy(true);
    setFormError('');
    setServerErrors({});
    try {
      const o = await createOrder({
        holdId: hold.id,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobile.replace(/\D/g, '').replace(/^995/, ''),
        cardNumber: form.card,
        expiry: form.expiry,
        cvv: form.cvv,
      });
      setOrder(o);
      setHold(null);
      setStep('done');
      onBooked?.();
    } catch (e) {
      if (e.status === 409) {
        handleContested(e);
      } else if (e.status === 422) {
        const fe = fieldErrors(e);
        if (fe) {
          // Field validation: map each API key onto its input
          const mapped = {};
          Object.entries(fe).forEach(([k, msg]) => (mapped[FIELD_MAP[k] ?? k] = msg));
          setServerErrors(mapped);
          setTouched(ALL_TOUCHED);
        } else {
          // Message only: the hold ran out
          resetToSeats(e.message || 'Your hold time expired. Please re-select your seats.');
        }
      } else {
        setFormError(e.message || 'Payment failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  /* ----- layout pieces ----- */
  const meta = [session.venue, session.hall && `Hall ${session.hall}`, longDay(session.date), session.time, session.format, session.language]
    .filter(Boolean)
    .join(' · ');
  const codes = selected.map((s) => s.seat.code).join(', ');
  const cardMeta = [session.hall && `Hall ${session.hall}`, shortDay(session.date), session.time].filter(Boolean).join(' · ');

  // Confirmation is rendered from the order the server returned
  const doneSeats = order?.seats?.length ? order.seats.join(', ') : codes;
  const doneTickets = order?.tickets?.length
    ? Object.entries(
        order.tickets.reduce((acc, t) => ({ ...acc, [t.type]: (acc[t.type] ?? 0) + 1 }), {})
      )
        .map(([name, n]) => `${n} x ${name}`)
        .join(', ')
    : ticketSummary;
  const doneMeta = [
    order?.venue || session.venue,
    (order?.hall || session.hall) && `Hall ${order?.hall || session.hall}`,
    shortDay(order?.date || session.date),
    order?.time || session.time,
  ]
    .filter(Boolean)
    .join(' · ');

  /* Progress: container bg #1E2031, active segment #EC3013. "Seats" is clickable from checkout. */
  const progress = (
    <div className="flex gap-2 rounded-full bg-surface">
      {[
        { key: 'seats', label: 'Seats' },
        { key: 'checkout', label: 'Checkout' },
      ].map(({ key, label }) => {
        const active = step === key;
        const clickable = key === 'seats' && step === 'checkout';
        return (
          <button
            key={key}
            type="button"
            disabled={!clickable}
            onClick={clickable ? backToSeats : undefined}
            className={`flex h-[33px] flex-1 items-center justify-center rounded-full px-4 py-[10px] text-[12px] leading-[13px] font-semibold uppercase ${
              active ? 'bg-accent' : 'bg-surface'
            } ${clickable ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  /* ===== Step 1, right column: "Your seats · Max N" ===== */
  const seatsPanel = (
    <div className="flex flex-col gap-3 self-stretch">
      <h3 className="text-[14px] leading-[15px] font-extrabold">Your seats · Max {maxSeats}</h3>

      {selected.length === 0 ? (
        <p className="text-[12px] leading-[130%] text-muted">
          Pick up to {maxSeats} seats from the map. Each seat can carry its own ticket type.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {selected.map(({ seat, type }) => (
              <li key={seat.id} className="flex flex-col gap-[6px] rounded-2xl bg-surface p-[15px]">
                <div className="flex flex-col gap-3">
                  {/* Row: Seat B3 ........ ₾16 ✕ */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] leading-[130%] text-muted">Seat</span>
                      <span className="text-[12px] leading-[13px] font-semibold">{seat.code}</span>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-[12px] leading-[13px] font-semibold">₾{unit(type)}</span>
                      <button
                        type="button"
                        onClick={() => removeSeat(seat.id)}
                        aria-label={`Remove seat ${seat.code}`}
                        className="flex size-4 shrink-0 cursor-pointer items-center justify-center text-muted transition hover:text-white"
                      >
                        <X size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  <div className="h-px w-full bg-line" />

                  {/* Buttons in a row: Child 60% · Student 75% · Adult 100% (Child hidden on 16+) */}
                  <div className="flex gap-2">
                    {visibleTypes.map((t) => {
                      const active = t.value === type;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setType(seat.id, t.value)}
                          className={`flex h-8 flex-1 cursor-pointer items-center justify-center rounded-2xl py-2 text-[12px] leading-[130%] font-normal text-white transition ${
                            active ? 'bg-accent' : 'bg-line hover:brightness-125'
                          }`}
                        >
                          {t.label} {Math.round((t.ratio ?? 1) * 100)}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {types.some((t) => t.note && selected.some((s) => s.type === t.value)) && (
            <p className="text-[12px] leading-[130%] text-muted">
              {types.find((t) => t.note && selected.some((s) => s.type === t.value))?.note}
            </p>
          )}
        </>
      )}
    </div>
  );

  /* ===== Step 2, right column: "Summary" ===== */
  const summaryPanel = (
    <div className="flex min-h-[351px] flex-col gap-3 self-stretch">
      <h3 className="text-[14px] leading-[15px] font-extrabold">Summary</h3>
      <div className="flex flex-col gap-[10px] rounded-xl bg-surface p-4">
        <div className="flex flex-col gap-2">
          <span className="text-[14px] leading-[15px] font-extrabold uppercase">{movie.title}</span>
          <span className="text-[12px] leading-[130%] text-muted">{cardMeta}</span>
        </div>
        <div className="h-px w-full bg-line" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] leading-[130%] text-muted">Seats</span>
          <span className="text-right text-[12px] leading-[13px] font-semibold">{codes || '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] leading-[130%] text-muted">Tickets</span>
          <span className="text-right text-[12px] leading-[130%]">{ticketSummary || '—'}</span>
        </div>
      </div>
    </div>
  );

  /* Figma Frame 220 */
  const subtotal = (
    <div className="flex h-[26px] items-center px-[5px]">
      <span className="text-[12px] leading-[13px] font-semibold uppercase">Subtotal</span>
      <span className="flex-1" />
      <span className="text-[24px] leading-[26px] font-extrabold">₾ {total}</span>
    </div>
  );

  /* Figma Button: 41px, px 22, disabled = #505261 / #A9A9A9, enabled = #EC3013 */
  const bigButton = (label, onClick, disabled) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[41px] w-full items-center justify-center gap-1 rounded-full px-[22px] py-[13px] text-[14px] leading-[15px] font-extrabold transition ${
        disabled ? 'cursor-not-allowed bg-disabled text-muted' : 'cursor-pointer bg-accent text-white hover:brightness-110'
      }`}
    >
      {label}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,16,16,0.3)] p-4 backdrop-blur-[5px]"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seat selection"
        className="flex max-h-[calc(100vh-32px)] min-h-[599px] w-[1146px] max-w-full flex-col gap-8 overflow-y-auto rounded-[28px] bg-bg p-8 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]"
      >
        {step === 'done' ? (
          /* ---------- Confirmation (rendered from the order response) ---------- */
          <div className="mx-auto flex w-[673px] max-w-full flex-1 flex-col items-center justify-center gap-6">
            <div className="flex w-full flex-col items-center gap-[18px]">
              <div className="flex w-[365px] max-w-full flex-col items-center gap-4">
                <span className="flex size-14 items-center justify-center rounded-full bg-success p-4">
                  <Check size={32} strokeWidth={4} className="text-white" />
                </span>
                <div className="flex w-full flex-col items-center gap-4">
                  <div className="flex w-full flex-col items-center gap-[10px]">
                    <h2 className="text-center text-[24px] leading-[26px] font-extrabold">Booking confirmed!</h2>
                    <p className="text-center text-[14px] leading-[130%] text-muted">
                      Your tickets are ready. We've sent the confirmation to your email.
                    </p>
                  </div>
                  {order?.code && (
                    <span className="flex h-[26px] items-center justify-center rounded-full bg-line px-5 text-[12px] leading-[13px] font-semibold uppercase">
                      Order #{order.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 rounded-xl bg-surface p-5">
                <div className="flex gap-[10px]">
                  {movie.poster && <img src={movie.poster} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover" />}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="text-[14px] leading-[15px] font-extrabold uppercase">{movie.title}</span>
                    <span className="text-[12px] leading-[130%] text-muted">{doneMeta}</span>
                  </div>
                </div>
                <div className="h-px w-full bg-line" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] leading-[130%] text-muted">Seats</span>
                  <span className="text-[12px] leading-[13px] font-semibold">{doneSeats}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] leading-[130%] text-muted">Tickets</span>
                  <span className="text-[12px] leading-[130%]">{doneTickets}</span>
                </div>
                <div className="h-px w-full bg-line" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] leading-[130%] text-muted uppercase">Total paid</span>
                  <span className="text-[18px] leading-5 font-extrabold">₾ {order?.total}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button size="lg" onClick={() => { onClose(); navigate('/profile?tab=tickets'); }}>
                View my tickets
              </Button>
              <Button size="lg" variant="glass" onClick={close}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ---------- Header ---------- */}
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <h2 className="truncate text-[20px] leading-[22px] font-extrabold uppercase">{movie.title}</h2>
                <p className="truncate text-[12px] leading-4 text-muted">{meta}</p>
              </div>
              <div className="flex w-[102px] flex-col items-center justify-center gap-[2px] rounded-xl bg-surface px-[14px] py-2">
                <span className="text-[12px] leading-[13px] font-semibold text-muted uppercase">Seats held</span>
                <span className={`text-[14px] leading-[15px] font-extrabold ${left != null && left < 60 ? 'text-accent' : ''}`}>
                  {mmss(left)}
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex size-[46px] cursor-pointer items-center justify-center rounded-xl text-muted transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 items-stretch justify-center gap-5">
              {/* ---------- Left column ---------- */}
              <div className="flex min-w-0 flex-1 basis-[720px] flex-col gap-6">
                {progress}

                {notice && (
                  <p role="alert" className="rounded-xl bg-warning/10 px-4 py-3 text-[12px] leading-4 font-semibold text-warning">
                    {notice}
                  </p>
                )}

                {step === 'seats' && (
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-full px-5">
                      <div className="flex h-[30px] items-center justify-center rounded-b-[20px] bg-line text-[12px] leading-[13px] font-semibold">
                        SCREEN
                      </div>
                    </div>

                    {seatsQ.status === 'loading' && <p className="py-16 text-muted">Loading seats…</p>}
                    {seatsQ.status === 'error' && (
                      <div className="flex flex-col items-center gap-3 py-12">
                        <p className="text-muted">Couldn't load the seat map.</p>
                        <Button onClick={seatsQ.reload}>Retry</Button>
                      </div>
                    )}

                    {seatsQ.status === 'ready' && (
                      <div className="flex w-full flex-col gap-8 px-10">
                        {sections.map((sec) => {
                          const first = sec.rows[0]?.label;
                          const last = sec.rows[sec.rows.length - 1]?.label;
                          return (
                            <div key={sec.name} className="flex flex-col gap-4">
                              <span className="text-[12px] leading-[13px] font-semibold text-muted uppercase">
                                {sec.name} · Rows {first}{last !== first ? `–${last}` : ''}
                              </span>
                              <div className="flex flex-col gap-2">
                                {sec.rows.map((r) => (
                                  <div key={r.label} className="flex items-center gap-[6px]">
                                    <span className="flex w-5 shrink-0 justify-center text-[12px] leading-[13px] font-semibold">
                                      {r.label}
                                    </span>
                                    {r.seats.map((s) => (
                                      <Fragment key={s.id}>
                                        <Seat
                                          seat={s}
                                          state={taken.includes(s.code) ? 'sold' : s.state}
                                          selected={selected.some((x) => x.seat.id === s.id)}
                                          onClick={() => toggleSeat(s)}
                                        />
                                        {s.aisleAfter && <span className="w-4 shrink-0" />}
                                      </Fragment>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-6">
                      <Legend box="border border-disabled bg-surface" label="Available" />
                      <Legend box="bg-accent" label="Selected" />
                      <Legend box="bg-surface" label="Sold" />
                      <Legend box="bg-surface ring-1 ring-muted/40" label="Held by another user" />
                    </div>
                  </div>
                )}

                {step === 'checkout' && (
                  <div className="flex flex-col gap-5">
                    {profileIncomplete && (
                      <p role="alert" className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-3 text-[12px] leading-4 font-semibold text-accent">
                        <Lock size={14} />
                        Complete your profile (full name, mobile number and date of birth) before booking.
                      </p>
                    )}

                    <div className="flex flex-col gap-[18px]">
                      <Field label="Full Name" placeholder="e.g. Jane Doe" {...bind('fullName')} />
                      <div className="flex gap-3">
                        <Field label="Email" placeholder="e.g. jane@example.com" className="flex-1" {...bind('email')} />
                        <Field label="Mobile Number" placeholder="5XX XXX XXX" inputMode="tel" className="flex-1" {...bind('mobile')} />
                      </div>
                    </div>

                    <div className="h-px w-full rounded-full bg-surface" />

                    <div className="flex flex-col gap-[18px]">
                      <Field label="Card Number" placeholder="1234 5678 9012 3456" inputMode="numeric" {...bind('card', fmtCard)} />
                      <div className="flex gap-3">
                        <Field label="Expiry" placeholder="MM/YY" inputMode="numeric" className="flex-1" {...bind('expiry', fmtExpiry)} />
                        <Field label="CVV" placeholder="123" inputMode="numeric" className="flex-1" {...bind('cvv', fmtCvv)} />
                      </div>
                    </div>

                    {formError && <p className="text-[12px] leading-[13px] font-semibold text-accent">{formError}</p>}
                  </div>
                )}
              </div>

              <div className="w-px self-stretch rounded-full bg-surface" />

              {/* ---------- Right column (Figma Frame 56, 321px) ---------- */}
              <div className="flex w-[321px] shrink-0 flex-col items-start justify-between gap-6 self-stretch">
                <div className="flex w-full flex-col gap-6">{step === 'seats' ? seatsPanel : summaryPanel}</div>

                <div className="flex w-full flex-col gap-3 pt-[10px]">
                  {subtotal}
                  {step === 'seats'
                    ? bigButton(busy ? 'Holding seats…' : 'Continue to checkout', goCheckout, selected.length === 0 || busy)
                    : bigButton(busy ? 'Processing…' : `Pay ₾ ${total}`, pay, busy || profileIncomplete || !formValid)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}