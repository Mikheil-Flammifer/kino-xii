import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Armchair, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getFilterOptions } from '../api/filters';
import { getSessions } from '../api/sessions';
import { useAsync } from '../hooks/useAsync';
import Button from '../components/Button';
import CardSkeleton from '../components/CardSkeleton';
import FilterSidebar from '../components/FilterSidebar';
import Footer from '../components/Footer';
import { moviePath } from '../utils/paths';

const MULTI = ['venue', 'format', 'language', 'time_band'];
const FILMS_PER_PAGE = 10;
const LOW_SEATS = 10;
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
            <span className="text-[14px] leading-[15px] font-extrabold">from ₾{s.price}</span>
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
  const date = params.get('date') || days[0].iso; // default: today
  const search = params.get('search') ?? '';
  const sort = params.get('sort') ?? '';
  const page = Number(params.get('page')) || 1;

  // No `replace`: every change is a history entry, so Back restores the previous filters.
  // Any change except the page itself returns to page 1.
  const update = useCallback(
    (changes) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        if (!('page' in changes)) next.delete('page');
        return next;
      }),
    [setParams]
  );

  // Formats offered by the selected venues (null = no venue selected / unknown -> show all)
  const formatsFor = (venueValues) => {
    const picked = o.venues.filter((v) => venueValues.includes(v.value));
    if (!picked.length || picked.some((v) => !v.formats)) return null;
    return new Set(picked.flatMap((v) => v.formats));
  };
  const allowedFormats = formatsFor(read('venue'));
  const formatOptions = allowedFormats ? o.formats.filter((f) => allowedFormats.has(f.value)) : o.formats;

  const toggle = (key, value) => {
    const cur = read(key);
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    const changes = { [key]: next.join(',') };

    // Dropping a venue can make a selected format unavailable: remove it too
    if (key === 'venue') {
      const allowed = formatsFor(next);
      if (allowed) changes.format = read('format').filter((f) => allowed.has(f)).join(',');
    }
    update(changes);
  };

  const activeCount = MULTI.reduce((n, k) => n + read(k).length, 0); // date is not counted
  // Clears everything except the date
  const clearAll = () => setParams({ date }, {});

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
  const ready = sessions.status === 'ready';

  // Group by movie; paginate 10 films per page (client-side if the API returns everything)
  const { pageGroups, lastPage, total } = useMemo(() => {
    if (!ready) return { pageGroups: [], lastPage: 1, total: 0 };
    const map = new Map();
    sessions.data.items.forEach((s) => {
      if (!map.has(s.movie.id)) map.set(s.movie.id, { movie: s.movie, items: [] });
      map.get(s.movie.id).items.push(s);
    });
    const all = [...map.values()];
    const serverPaged = sessions.data.lastPage > 1;
    if (serverPaged) {
      return { pageGroups: all, lastPage: sessions.data.lastPage, total: sessions.data.total };
    }
    return {
      pageGroups: all.slice((page - 1) * FILMS_PER_PAGE, page * FILMS_PER_PAGE),
      lastPage: Math.max(1, Math.ceil(all.length / FILMS_PER_PAGE)),
      total: sessions.data.items.length,
    };
  }, [ready, sessions.data, page]);


  return (
    <>
      <div className="min-h-screen px-[51px] pt-[117px] pb-16">
        <div className="mb-9 flex flex-col gap-[6px]">
          <h1 className="text-[24px] leading-[26px] font-extrabold">Sessions</h1>
          <p className="text-[14px] leading-[18px] text-muted">Browse showtimes across all venues</p>
        </div>

        <div className="flex items-start gap-[51px]">
          {/* ---------- Filter sidebar (sticky) ---------- */}
            <FilterSidebar
              options={o}
              formatOptions={formatOptions}
              loading={filters.status === 'loading'}
              error={filters.status === 'error'}
              onRetry={filters.reload}
              days={days}
              date={date}
              selected={{
                venue: read('venue'),
                format: read('format'),
                language: read('language'),
                time_band: read('time_band'),
              }}
              onToggle={toggle}
              onDate={(iso) => update({ date: iso })}
              activeCount={activeCount}
              onClear={clearAll}
            />

          {/* ---------- Results ---------- */}
          <section className="flex min-w-0 flex-1 flex-col items-center gap-[52px]">
            <div className="flex w-full flex-col gap-6">
              <div className="flex items-center justify-between">
                <p className="text-[14px] leading-[15px] font-semibold">
                  {ready && (total > 0 ? `Showing ${total} ${total === 1 ? 'session' : 'sessions'}` : 'No sessions found')}
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

              {ready && pageGroups.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <p className="text-muted">No sessions found</p>
                  {activeCount > 0 && (
                    <Button variant="glass" onClick={clearAll}>
                      Clear All Filters
                    </Button>
                  )}
                </div>
              )}

              {ready && pageGroups.length > 0 && (
                <div className="flex flex-col gap-8">
                  {pageGroups.map((g, i) => (
                    <div key={g.movie.id} className="flex flex-col gap-8">
                      {i > 0 && <Divider />}
                      <div className="flex flex-col gap-[14px]">
                        <div className="flex items-center gap-4">
                          <img src={g.movie.poster} alt="" className="h-20 w-14 shrink-0 rounded-lg object-cover" />
                          <div className="flex min-w-0 items-center gap-3">
                            <h3 className="truncate text-[18px] leading-[20px] font-extrabold">{g.movie.title}</h3>
                            {g.movie.ageRating && (
                              <span className="rounded-full bg-accent/10 px-2 py-1 text-[12px] leading-[13px] font-semibold text-accent">
                                {g.movie.ageRating}
                              </span>
                            )}
                            {g.movie.duration && (
                              <span className="text-[14px] leading-[18px] text-muted">{g.movie.duration} min</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {g.items.map((s) => (
                            // Seat selection comes later; for now open the movie page
                            <SessionCard key={s.id} s={s} onOpen={() =>navigate(moviePath(g.movie))} />
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
              <div className="flex flex-col items-center gap-3">
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
                      <span key={`gap-${i}`} className="flex size-10 items-center justify-center text-muted">…</span>
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
                <p className="text-[12px] leading-4 text-muted">
                  Page {page} of {lastPage}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}