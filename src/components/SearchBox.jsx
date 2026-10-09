import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popcorn, Search, X } from 'lucide-react';
import { searchMovies } from '../api/search';

function EmptyState({ icon, title, text, onBrowse }) {
  return (
    <div className="flex flex-col items-center gap-[6px] px-6 pt-8 pb-7">
      <span className="flex size-12 items-center justify-center rounded-full bg-white/10">{icon}</span>
      <p className="text-center text-[14px] leading-[15px] font-semibold">{title}</p>
      <p className="w-[380px] max-w-full text-center text-[14px] leading-[130%] text-muted">{text}</p>
      <button
        type="button"
        onClick={onBrowse}
        className="mt-[10px] flex h-[41px] w-[183px] cursor-pointer items-center justify-center rounded-full bg-white/10 px-[22px] text-[14px] leading-[15px] font-extrabold transition hover:bg-white/20"
      >
        Browse all sessions
      </button>
    </div>
  );
}

export default function SearchBox() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const reqId = useRef(0);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error

  const q = query.trim();

  // Debounced search; stale responses are ignored
  useEffect(() => {
    if (!q) {
      reqId.current += 1;
      setResults([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const id = ++reqId.current;
    const t = setTimeout(() => {
      searchMovies(q)
        .then((list) => {
          if (id !== reqId.current) return;
          setResults(list);
          setStatus('ready');
        })
        .catch(() => {
          if (id !== reqId.current) return;
          setResults([]);
          setStatus('error');
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && (setOpen(false), inputRef.current?.blur());
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const clear = () => {
    setQuery('');
    inputRef.current?.focus();
  };
  const browse = () => {
    setOpen(false);
    navigate('/sessions');
  };
  const openMovie = (m) => {
    setOpen(false);
    setQuery('');
    navigate(`/movies/${m.slug}`);
  };
  const submit = (e) => {
    e.preventDefault();
    if (!q) return;
    setOpen(false);
    navigate(`/sessions?search=${encodeURIComponent(q)}`);
  };

  const showNoResults = q && status === 'ready' && results.length === 0;
  const showList = q && results.length > 0;

  return (
    <div ref={rootRef} className="relative flex w-[480px] flex-col items-end gap-[5px]">
      {/* Search bar: 380 closed, 480 open */}
      <form
        onSubmit={submit}
        className={`flex h-[41px] items-center justify-between rounded-full border border-white/10 bg-white/10 py-[6px] pr-2 pl-3 backdrop-blur-[7px] transition-[width] ${
          open ? 'w-[480px]' : 'w-[380px]'
        }`}
      >
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <Search size={14} className="shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search films and live events"
            aria-label="Search films and live events"
            autoComplete="off"
            className="w-full bg-transparent text-[14px] leading-[130%] text-white outline-none placeholder:text-white"
          />
        </label>
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <X size={12} />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-[5px] flex w-[480px] flex-col rounded-2xl border border-line bg-bg p-2 shadow-[0_2px_6px_rgba(0,0,0,0.2),0_20px_48px_-8px_rgba(0,0,0,0.2)]">
          {!q && (
            <EmptyState
              icon={<Popcorn size={24} />}
              title="What do you want to watch?"
              text="Search by title, director or cast"
              onBrowse={browse}
            />
          )}

          {q && status === 'loading' && results.length === 0 && (
            <p className="px-[10px] py-6 text-center text-[14px] text-muted">Searching…</p>
          )}

          {q && status === 'error' && (
            <p className="px-[10px] py-6 text-center text-[14px] text-muted">Couldn't search right now. Try again.</p>
          )}

          {showNoResults && (
            <EmptyState
              icon={<Search size={20} strokeWidth={1.25} />}
              title={`No results for “${q}”`}
              text="Check the spelling or try another film or live event."
              onBrowse={browse}
            />
          )}

          {showList && (
            <>
              <div className="flex items-start justify-between px-[10px] pt-2 pb-[6px]">
                <span className="text-[12px] leading-[13px] font-semibold tracking-[0.06em] text-muted uppercase">
                  Films &amp; events
                </span>
                <span className="text-[12px] leading-[130%] text-muted">
                  {results.length} {results.length === 1 ? 'result' : 'results'}
                </span>
              </div>

              <ul className="flex max-h-[294px] flex-col gap-[2px] overflow-y-auto overscroll-contain [scrollbar-color:#2A2C3D_transparent] [scrollbar-width:thin]">
                {results.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => openMovie(m)}
                      className="flex w-full cursor-pointer items-center gap-[14px] rounded-[10px] py-2 pr-5 pl-[10px] text-left transition hover:bg-white/10"
                    >
                      {m.poster ? (
                        <img src={m.poster} alt="" className="h-14 w-10 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="h-14 w-10 shrink-0 rounded-md bg-surface" />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                        <span className="truncate text-[14px] leading-[15px] font-semibold">{m.title}</span>
                        <span className="truncate text-[12px] leading-[130%] text-muted">{m.meta}</span>
                      </span>
                      <span
                        className={`shrink-0 text-[14px] leading-[15px] font-semibold ${
                          m.comingSoon ? 'text-[#E27E04]' : ''
                        }`}
                      >
                        {m.comingSoon ? 'Coming soon' : m.fromPrice != null ? `From ₾${m.fromPrice}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}