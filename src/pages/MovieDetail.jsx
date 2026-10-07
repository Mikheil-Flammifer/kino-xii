import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bell, BellRing, Clock3, Lock } from 'lucide-react';
import { getMovie, subscribeMovie } from '../api/movies';
import { getMovieSessions } from '../api/sessions';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { ageFromDob, longDate, nextSevenDays } from '../utils/dates';
import Button from '../components/Button';
import CardSkeleton from '../components/CardSkeleton';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import TicketCard from '../components/TicketCard';
import SeatModal from '../components/SeatModal';

const hallLabel = (h) => (!h ? 'Hall' : /^hall/i.test(h) ? h : `Hall ${h}`);

function byHall(sessions) {
  const map = new Map();
  sessions.forEach((s) => {
    const k = s.hall ?? '';
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(s);
  });
  return [...map.entries()];
}

const Pill = ({ children, tone = 'glass', icon: Icon }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-[10px] py-[6px] text-[12px] leading-[13px] font-semibold ${
      tone === 'accent' ? 'bg-accent/10 text-accent' : 'bg-white/10 text-white'
    }`}
  >
    {Icon && <Icon size={14} strokeWidth={1.5} />}
    {children}
  </span>
);

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-[7px]">
      <span className="text-[12px] leading-[13px] font-semibold text-muted uppercase">{label}</span>
      <span className="text-[14px] leading-[15px] font-semibold">{value}</span>
    </div>
  );
}

export default function MovieDetail() {
  const { slug } = useParams();
  const { user, requireAuth } = useAuth();
  const { add } = useRecentlyViewed();
  const days = useMemo(nextSevenDays, []);

  /* ----- movie ----- */
  const fetchMovie = useCallback(() => getMovie(slug), [slug]);
  const movieQ = useAsync(fetchMovie);
  const movie = movieQ.status === 'ready' ? movieQ.data : null;

  useEffect(() => {
    if (movie) add(movie);
  }, [movie, add]);

  /* ----- date: first day with sessions, else today ----- */
  const [picked, setPicked] = useState(null);
  const available = useMemo(() => new Set(movie?.availableDates ?? []), [movie]);
  const defaultDate = days.find((d) => available.has(d.iso))?.iso ?? days[0].iso;
  const date = picked ?? defaultDate;

  /* ----- sessions ----- */
  const comingSoon = Boolean(movie?.isComingSoon);
  const fetchSessions = useCallback(
    () => (movie && !movie.isComingSoon ? getMovieSessions(slug, date) : Promise.resolve([])),
    [movie, slug, date]
  );
  const sessionsQ = useAsync(fetchSessions);

  /* ----- age gate (recomputed every render, so it applies right after login) ----- */
  const age = user ? user.age ?? ageFromDob(user.dateOfBirth) : null;
  const blocked = Boolean(user && movie?.ageMin && age != null && age < movie.ageMin);
  const blockedText = movie
    ? `This film is rated ${movie.ageRating}. You cannot buy tickets for it with this account.`
    : '';

  /* ----- seat modal placeholder ----- */
  const [seatSession, setSeatSession] = useState(null);
  const openSession = (s) => requireAuth(() => setSeatSession(s));

  /* ----- notify me ----- */
  const [notified, setNotified] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  useEffect(() => {
    if (movie) setNotified(movie.isNotified);
  }, [movie]);

  const notify = () =>
    requireAuth(async () => {
      setNotifyError('');
      try {
        await subscribeMovie(slug);
        setNotified(true);
      } catch (e) {
        setNotifyError(e.message || 'Could not subscribe. Try again.');
      }
    });

  /* ----- states ----- */
  if (movieQ.status === 'loading') {
    return <CardSkeleton className="h-[567px] rounded-none" />;
  }

  if (movieQ.status === 'error' || !movie) {
    return (
      <>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-[111px]">
          <p className="text-muted">We couldn't load this film.</p>
          <Button onClick={movieQ.reload}>Retry</Button>
        </div>
        <Footer />
      </>
    );
  }

  const groups = (sessionsQ.status === 'ready' ? sessionsQ.data : []).filter((g) => g.sessions.length > 0);
  const showNote = (movie.ageMin ?? 0) >= 16;
  const noteText =
    movie.ageDescription || `Not recommended for under-${movie.ageMin}s. Tickets require an account aged ${movie.ageMin} or over.`;

  return (
    <>
      {/* ---------- Banner ---------- */}
      <section className="relative h-[567px] overflow-hidden bg-surface">
        {movie.backdrop && (
          <img
            src={movie.backdrop}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
          />
        )}
        <div className="absolute inset-0 bg-bg/20 backdrop-blur-[5px]" />

        <div className="absolute bottom-[41px] left-[60px] flex items-end gap-[34px]">
          {movie.poster && (
            <img
              src={movie.poster}
              alt={movie.title}
              className="h-[374px] w-[289px] shrink-0 rounded-[14px] object-cover shadow-[0_4px_64px_rgba(0,0,0,0.2)]"
            />
          )}

          <div className="flex w-[580px] flex-col gap-[15px] py-[9px]">
            <span className="w-fit rounded-full bg-accent/10 px-[10px] py-[6px] text-[12px] leading-[13px] font-semibold text-accent uppercase">
              {comingSoon ? 'Coming soon' : 'Now playing'}
            </span>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-[15px]">
                <h1 className="text-[40px] leading-[44px] font-extrabold uppercase">{movie.title}</h1>
                {movie.description && (
                  <p className="line-clamp-3 max-w-[560px] text-[14px] leading-[130%]">{movie.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-[7px]">
                {movie.ageRating && (
                  <span title={movie.ageDescription || undefined} className="cursor-help">
                    <Pill tone="accent">{movie.ageRating}</Pill>
                  </span>
                )}
                {movie.duration && <Pill icon={Clock3}>{movie.duration} min</Pill>}
                {movie.genres[0] && <Pill>{movie.genres[0]}</Pill>}
                {movie.formats[0] && <Pill>{movie.formats[0]}</Pill>}
              </div>

              {comingSoon && (
                <div className="flex flex-col gap-2">
                  <Button
                    size="lg"
                    variant={notified ? 'outline' : 'primary'}
                    icon={notified ? BellRing : Bell}
                    onClick={notify}
                    aria-pressed={notified}
                    className="w-fit"
                  >
                    {notified ? 'Notifying' : 'Notify Me'}
                  </Button>
                  {notifyError && <p className="text-[12px] font-semibold text-accent">{notifyError}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Body ---------- */}
      <div className="mt-[34px] flex gap-[10px] px-[51px] pb-16">
        {/* Sessions column */}
        <div className="flex min-w-0 flex-1 flex-col gap-[27px] pb-[26px]">
          <div className="flex flex-col gap-6">
            <h2 className="text-[20px] leading-[22px] font-extrabold">Sessions</h2>

            {!comingSoon && (
              <div className="flex gap-[7px]" role="group" aria-label="Choose a date">
                {days.map((d) => {
                  const has = available.has(d.iso);
                  const on = date === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      disabled={!has}
                      aria-pressed={on}
                      onClick={() => setPicked(d.iso)}
                      className={`flex size-20 flex-col items-center justify-center gap-[7px] rounded-2xl px-[10px] py-[9px] transition ${
                        on ? 'bg-accent' : 'bg-surface'
                      } ${has ? 'cursor-pointer hover:brightness-125' : 'cursor-not-allowed opacity-40'}`}
                    >
                      <span className="text-[12px] leading-[13px] font-semibold">{d.weekday}</span>
                      <span className="text-[18px] leading-5 font-extrabold">{d.day}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {comingSoon && (
            <p className="text-muted">
              This film isn't in cinemas yet. Tap Notify Me and we'll let you know when sessions open.
            </p>
          )}

          {!comingSoon && blocked && (
            <div
              role="alert"
              className="flex w-fit items-center gap-2 rounded-xl bg-accent/10 px-4 py-3 text-[14px] leading-[18px] font-semibold text-accent"
            >
              <Lock size={16} />
              {blockedText}
            </div>
          )}

          {!comingSoon && sessionsQ.status === 'loading' && (
            <div className="flex flex-wrap gap-[10px]">
              {Array.from({ length: 2 }).map((_, i) => (
                <CardSkeleton key={i} className="h-[133px] w-[454px] rounded-[18px]" />
              ))}
            </div>
          )}

          {!comingSoon && sessionsQ.status === 'error' && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted">Couldn't load sessions.</p>
              <Button onClick={sessionsQ.reload}>Retry</Button>
            </div>
          )}

          {!comingSoon && sessionsQ.status === 'ready' && groups.length === 0 && (
            <p className="text-muted">No sessions on this date. Try another day.</p>
          )}

          {!comingSoon &&
            groups.map((g) => (
              <div key={g.venue.id ?? g.venue.name} className="flex flex-col gap-4">
                <h3 className="text-[14px] leading-[15px] font-extrabold">{g.venue.name}</h3>
                <div className="flex flex-wrap gap-[10px]">
                  {byHall(g.sessions).map(([hall, list]) => (
                    <div key={hall} className="flex w-[454px] flex-col gap-[9px] rounded-[18px] bg-surface p-[15px]">
                      <span className="text-[12px] leading-[13px] font-semibold">{hallLabel(hall)}</span>
                      <div className="flex flex-wrap gap-[9px]">
                        {list.map((s) => (
                          <TicketCard
                            key={s.id}
                            s={s}
                            locked={blocked}
                            lockedReason={blockedText}
                            onOpen={() => openSession(s)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Details column */}
        <aside className="flex w-[441px] shrink-0 flex-col gap-[17px] px-[26px]">
          <h2 className="text-[20px] leading-[22px] font-extrabold">Details</h2>
          <Detail label="Director" value={movie.director} />
          <Detail label="Main cast" value={movie.cast} />
          <Detail label="Duration" value={movie.duration ? `${movie.duration} minutes` : ''} />
          <Detail label="Release date" value={longDate(movie.releaseDate)} />
          <Detail label="Formats" value={movie.formats.join(', ')} />
          <Detail label="From" value={movie.minPrice != null ? `₾${movie.minPrice}` : ''} />

          {showNote && (
            <div className="flex flex-col gap-[7px] rounded-xl bg-warning/10 px-[13px] py-[9px] text-warning">
              <span className="text-[12px] leading-[13px] font-semibold uppercase">Rating note</span>
              <div className="flex items-start gap-[7px]">
                <span className="text-[12px] leading-[13px] font-semibold">{movie.ageRating}</span>
                <p className="flex-1 text-[12px] leading-[130%]">{noteText}</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Footer />

      {/* Placeholder until the seat modal is built */}
      {seatSession && !blocked && (
        <SeatModal
          session={seatSession}
          movie={movie}
          onClose={() => setSeatSession(null)}
          onBooked={sessionsQ.reload}
        />
      )}
    </>
  );
}