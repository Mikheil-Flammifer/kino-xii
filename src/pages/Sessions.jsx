import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getFilterOptions } from '../api/filters';
import { getSessions } from '../api/sessions';
import { useAsync } from '../hooks/useAsync';
import Button from '../components/Button';
import Badge from '../components/Badge';
import CardSkeleton from '../components/CardSkeleton';
import Footer from '../components/Footer';

// URL param names sent to the API. Change here if Swagger differs.
const KEYS = ['search', 'date', 'venue', 'format', 'language', 'time_band', 'sort'];
const EMPTY = { venues: [], formats: [], languages: [], timeBands: [], sorts: [] };

const selectCls =
  'h-[41px] cursor-pointer rounded-full bg-white/10 px-4 text-[14px] font-semibold text-white outline-none transition hover:bg-white/20 [&>option]:bg-surface';

function formatTime(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return { day: '', time: '' };
  return {
    day: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function Sessions() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filters = useAsync(getFilterOptions);
  const o = filters.status === 'ready' ? filters.data : EMPTY;

  const query = Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? '']));

  // Search box: local text, pushed to the URL after a short pause
  const [text, setText] = useState(query.search);
  useEffect(() => setText(query.search), [query.search]);

  const setParam = useCallback(
    (key, value) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );

  useEffect(() => {
    if (text === query.search) return;
    const t = setTimeout(() => setParam('search', text.trim()), 400);
    return () => clearTimeout(t);
  }, [text, query.search, setParam]);

  // Sessions refetch whenever the URL changes
  const queryKey = JSON.stringify(query);
  const fetchSessions = useCallback(() => getSessions(JSON.parse(queryKey)), [queryKey]);
  const sessions = useAsync(fetchSessions);

  const hasFilters = KEYS.some((k) => query[k]);

  const select = (key, list, placeholder) => (
    <select
      value={query[key]}
      onChange={(e) => setParam(key, e.target.value)}
      className={selectCls}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {list.map((x) => (
        <option key={x.value} value={x.value}>
          {x.label}
        </option>
      ))}
    </select>
  );

  return (
    <>
      <div className="min-h-screen px-[70px] pt-[111px] pb-16">
        <h1 className="mb-6 text-[24px] leading-[26px] font-extrabold uppercase">Sessions</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex h-[41px] w-[320px] items-center gap-2 rounded-full bg-white/10 px-3">
            <Search size={14} />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search films"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted"
            />
          </div>

          <input
            type="date"
            value={query.date}
            onChange={(e) => setParam('date', e.target.value)}
            aria-label="Date"
            className={`${selectCls} [color-scheme:dark]`}
          />
          {select('venue', o.venues, 'All venues')}
          {select('format', o.formats, 'All formats')}
          {select('language', o.languages, 'All languages')}
          {select('time_band', o.timeBands, 'Any time')}
          {select('sort', o.sorts, 'Sort by')}

          {hasFilters && (
            <button
              onClick={() => setParams({}, { replace: true })}
              className="cursor-pointer text-[14px] font-semibold text-accent hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {filters.status === 'error' && (
          <p className="mb-4 text-[14px] text-muted">
            Filters failed to load.{' '}
            <button onClick={filters.reload} className="cursor-pointer text-accent underline">
              Retry
            </button>
          </p>
        )}

        {/* Results */}
        {sessions.status === 'loading' && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} className="h-[110px]" />
            ))}
          </div>
        )}

        {sessions.status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-muted">Couldn't load sessions.</p>
            <Button onClick={sessions.reload}>Retry</Button>
          </div>
        )}

        {sessions.status === 'ready' && sessions.data.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-muted">No sessions match your filters.</p>
            {hasFilters && (
              <Button variant="glass" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </Button>
            )}
          </div>
        )}

        {sessions.status === 'ready' && sessions.data.length > 0 && (
          <ul className="flex flex-col gap-3">
            {sessions.data.map((s) => {
              const { day, time } = formatTime(s.startsAt);
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-5 rounded-[20px] bg-surface p-3 shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
                >
                  <img
                    src={s.movie.poster}
                    alt=""
                    className="h-[86px] w-[64px] shrink-0 rounded-[10px] object-cover"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                    <h3 className="truncate text-[18px] leading-[20px] font-extrabold uppercase">
                      {s.movie.title}
                    </h3>
                    <p className="truncate text-[12px] leading-[16px] text-muted">
                      {[s.venue, s.language].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex gap-2">
                      {s.movie.ageRating && <Badge>{s.movie.ageRating}</Badge>}
                      {s.format && <Badge variant="glass">{s.format}</Badge>}
                    </div>
                  </div>

                  <div className="w-[130px] text-right">
                    <p className="text-[18px] leading-[20px] font-extrabold">{time}</p>
                    <p className="text-[12px] leading-[16px] text-muted">{day}</p>
                  </div>

                  <div className="flex w-[160px] flex-col items-end gap-2">
                    {s.price != null && (
                      <span className="text-[12px] leading-[13px] font-semibold">
                        From ₾ {s.price}
                      </span>
                    )}
                    {/* Seat modal comes in the next step */}
                    <Button onClick={() => navigate(`/movies/${s.movie.id}`)}>Select Seats</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Footer />
    </>
  );
}