import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Armchair, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getFilterOptions } from '../api/filters';
import { getSessions } from '../api/sessions';
import { useAsync } from '../hooks/useAsync';
import Button from '../components/Button';
import CardSkeleton from '../components/CardSkeleton';
import Footer from '../components/Footer';

const MULTI = ['venue', 'format', 'language', 'time_band'];
const LOW_SEATS = 10; // red "N left" at or below this
const EMPTY = { venues: [], formats: [], languages: [], timeBands: [], sorts: [] };

const pad = (n) => String(n).padStart(2, '0');

function nextSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: d.getDate(),
    };
  });
}

function pageList(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const keep = [...new Set([1, last, current - 1, current, current + 1])]
    .filter((n) => n >= 1 && n <= last)
    .sort((a, b) => a - b);
  const out = [];
  keep.forEach((n, i) => {
    if (i && n - keep[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

/* ---------- small pieces ---------- */

function FilterGroup({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[12px] leading-[13px] font-semibold tracking-[0.06em] text-muted uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="flex cursor-pointer items-center gap-[10px] text-left"
    >
      <span
        className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition ${
          checked ? 'border-accent bg-accent' : 'border-disabled'
        }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="text-[14px] leading-[15px] font-semibold">
        {label}
        {hint && <span className="ml-[5px] text-[12px] font-normal text-muted">· {hint}</span>}
      </span>
    </button>
  );
}

const Divider = () => <div className="h-px w-full bg-line" />;

function SessionCard({ s, onOpen }) {
  const low = s.seatsLeft != null && s.seatsLeft <= LOW_SEATS;
  const place = [s.venue, s.hall && `Hall ${s.hall}`].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      disabled={s.isSoldOut}
      onClick={onOpen}
      className={`flex h-[104px] w-[252px] flex-col justify-between rounded-2xl bg-surface p-[15px] text-left transition ${
        s.isSoldOut ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:brightness-125'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[18px] leading-[20px] font-extrabold">{s.time || '--:--'}</span>
        <span className="rounded-full bg-line px-[10px] py-[5px] text-[12px] leading-[13px] font-semibold uppercase">
          {s.format || 'Standard'}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
          <span className="truncate text-[12px] leading-4 text-muted">{s.language || '—'}</span>
          <span className="truncate text-[12px] leading-[13px] font-semibold">{place || '—'}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-[10px]">
          {s.isSoldOut ? (
            <span className="text-[12px] leading-4 text-muted">Sold out</span>
          ) : (
            s.seatsLeft != null && (
              <span className={`flex items-center gap-1 text-[12px] leading-4 ${low ? 'text-accent' : 'text-success'}`}>
                <Armchair size={12} />
                {s.seatsLeft} left
              </span>
            )
          )}
          {s.price != null && (
            <span className="text-[14px] leading-[15px] font-extrabold">₾{s.price}</span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ---------- page ---------- */

export default function Sessions() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filters = useAsync(getFilterOptions);
  const o = filters.status === 'ready' ? filters.data : EMPTY;
  const days = useMemo(nextSevenDays, []);

  const read = (k) => (params.get(k) ?? '').split(',').filter(Boolean);
  const date = params.get('date') ?? '';
  const search = params.get('search') ?? '';
  const sort = params.get('sort') ?? '';
  const page = Number(params.get('page')) || 1;

  // Any change resets pagination unless it is the page itself
  const update = useCallback(
    (changes) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
          if (!('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );

  const toggle = (key, value) => {
    const cur = read(key);
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ [key]: next.join(',') });
  };

  const activeCount = MULTI.reduce((n, k) => n + read(k).length, 0) + (date ? 1 : 0);
  const clearAll = () => setParams({}, { replace: true });

  // Refetch whenever the URL changes
  const query = {
    search,
    date,
    venue: params.get('venue') ?? '',
    format: params.get('format') ?? '',
    language: params.get('language') ?? '',
    time_band: params.get('time_band') ?? '',
    sort,
    page: page > 1 ? String(page) : '',
  };
  const queryKey = JSON.stringify(query);
  const fetchSessions = useCallback(() => getSessions(JSON.parse(queryKey)), [queryKey]);
  const sessions = useAsync(fetchSessions);

  const groups = useMemo(() => {
    if (sessions.status !== 'ready') return [];
    const map = new Map();
    sessions.data.items.forEach((s) => {
      if (!map.has(s.movie.id)) map.set(s.movie.id, { movie: s.movie, items: [] });
      map.get(s.movie.id).items.push(s);
    });
    return [...map.values()];
  }, [sessions.status, sessions.data]);

  const checkList = (key, list) =>
    list.map((x) => (
      <CheckRow
        key={x.value}
        label={x.label}
        hint={x.hint}
        checked={read(key).includes(x.value)}
        onChange={() => toggle(key, x.value)}
      />
    ));

  const ready = sessions.status === 'ready';
  const lastPage = ready ? sessions.data.lastPage : 1;

  return (
    <>
      <div className="min-h-screen px-[51px] pt-[117px] pb-16">
        {/* Page header */}
        <div className="mb-9 flex flex-col gap-[6px]">
          <h1 className="text-[24px] leading-[26px] font-extrabold">Sessions</h1>
          <p className="text-[14px] leading-[18px] text-muted">Browse showtimes across all venues</p>
        </div>

        <div className="flex items-start gap-[51px]">
          {/* ---------- Filter sidebar ---------- */}
          <aside className="flex w-[320px] shrink-0 flex-col gap-6 rounded-2xl bg-surface p-6">
            <h2 className="text-[18px] leading-[20px] font-extrabold">Filters</h2>

            <FilterGroup title="Venue">{checkList('venue', o.venues)}</FilterGroup>
            <Divider />

            <FilterGroup title="Date">
              <div className="grid grid-cols-7 gap-[6px]">
                {days.map((d) => {
                  const on = date === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      aria-pressed={on}
                      onClick={() => update({ date: on ? '' : d.iso })}
                      className={`flex h-[54px] cursor-pointer flex-col items-center justify-center gap-[6px] rounded-lg text-[12px] leading-[13px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition ${
                        on ? 'bg-accent' : 'bg-line hover:brightness-125'
                      }`}
                    >
                      <span>{d.weekday}</span>
                      <span>{d.day}</span>
                    </button>
                  );
                })}
              </div>
            </FilterGroup>
            <Divider />

            <FilterGroup title="Format">{checkList('format', o.formats)}</FilterGroup>
            <Divider />

            <FilterGroup title="Language">{checkList('language', o.languages)}</FilterGroup>
            <Divider />

            <FilterGroup title="Time of day">{checkList('time_band', o.timeBands)}</FilterGroup>
            <Divider />

            <div className="flex items-center justify-center gap-3 text-[12px] leading-4 text-muted">
              <span>
                {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
              </span>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="cursor-pointer font-semibold text-accent hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {filters.status === 'error' && (
              <p className="text-[12px] text-muted">
                Filters failed to load.{' '}
                <button onClick={filters.reload} className="cursor-pointer text-accent underline">
                  Retry
                </button>
              </p>
            )}
          </aside>

          {/* ---------- Results ---------- */}
          <section className="flex min-w-0 flex-1 flex-col items-center gap-[52px]">
            <div className="flex w-full flex-col gap-6">
              {/* Count + sort */}
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-[15px] font-semibold">
                  {ready
                    ? `Showing ${sessions.data.total} ${sessions.data.total === 1 ? 'session' : 'sessions'}`
                    : ' '}
                </p>

                {o.sorts.length > 0 && (
                  <label className="relative flex items-center gap-2 text-[14px]">
                    <span className="leading-[18px] text-muted">Sort:</span>
                    <select
                      value={sort || o.sorts[0].value}
                      onChange={(e) =>
                        update({ sort: e.target.value === o.sorts[0].value ? '' : e.target.value })
                      }
                      className="cursor-pointer appearance-none bg-transparent pr-6 text-[14px] leading-[15px] font-extrabold outline-none [&>option]:bg-surface"
                    >
                      {o.sorts.map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-0" />
                  </label>
                )}
              </div>

              {search && (
                <button
                  type="button"
                  onClick={() => update({ search: '' })}
                  className="flex w-fit cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-[6px] text-[12px] font-semibold transition hover:bg-white/20"
                >
                  Results for “{search}”
                  <X size={14} />
                </button>
              )}

              {sessions.status === 'loading' && (
                <div className="flex flex-col gap-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CardSkeleton key={i} className="h-[198px]" />
                  ))}
                </div>
              )}

              {sessions.status === 'error' && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <p className="text-muted">Couldn't load sessions.</p>
                  <Button onClick={sessions.reload}>Retry</Button>
                </div>
              )}

              {ready && groups.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <p className="text-muted">No sessions match your filters.</p>
                  {(activeCount > 0 || search) && (
                    <Button variant="glass" onClick={clearAll}>
                      Clear filters
                    </Button>
                  )}
                </div>
              )}

              {ready && groups.length > 0 && (
                <div className="flex flex-col gap-8">
                  {groups.map((g, i) => (
                    <div key={g.movie.id} className="flex flex-col gap-8">
                      {i > 0 && <Divider />}
                      <div className="flex flex-col gap-[14px]">
                        {/* Movie row */}
                        <div className="flex items-center gap-4">
                          <img
                            src={g.movie.poster}
                            alt=""
                            className="h-20 w-14 shrink-0 rounded-lg object-cover"
                          />
                          <div className="flex min-w-0 items-center gap-3">
                            <h3 className="truncate text-[18px] leading-[20px] font-extrabold">
                              {g.movie.title}
                            </h3>
                            {g.movie.ageRating && (
                              <span className="rounded-full bg-accent/10 px-2 py-1 text-[12px] leading-[13px] font-semibold text-accent">
                                {g.movie.ageRating}
                              </span>
                            )}
                            {g.movie.duration && (
                              <span className="text-[14px] leading-[18px] text-muted">
                                {g.movie.duration} min
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Showtime cards */}
                        <div className="flex flex-wrap gap-3">
                          {g.items.map((s) => (
                            // Seat modal comes later; for now open the movie page
                            <SessionCard
                              key={s.id}
                              s={s}
                              onOpen={() => navigate(`/movies/${g.movie.id}`)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {ready && lastPage > 1 && (
              <nav className="flex items-center gap-2" aria-label="Pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => update({ page: String(page - 1) })}
                  aria-label="Previous page"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface text-muted transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageList(page, lastPage).map((n, i) =>
                  n === '…' ? (
                    <span key={`gap-${i}`} className="flex size-10 items-center justify-center text-muted">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update({ page: n > 1 ? String(n) : '' })}
                      aria-current={n === page ? 'page' : undefined}
                      className={`flex size-10 cursor-pointer items-center justify-center rounded-full text-[14px] font-medium transition ${
                        n === page ? 'bg-accent text-white' : 'text-muted hover:bg-white/10'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => update({ page: String(page + 1) })}
                  aria-label="Next page"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface text-muted transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}