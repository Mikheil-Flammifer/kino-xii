import { Check } from 'lucide-react';

const Divider = () => <div className="h-px w-full shrink-0 bg-line" />;

function Group({ title, children }) {
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
    <label className="flex cursor-pointer items-center gap-[10px]">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
          checked ? 'border-accent bg-accent' : 'border-disabled'
        }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="flex items-center gap-[5px]">
        <span className="text-[14px] leading-[15px] font-semibold">{label}</span>
        {hint && <span className="text-[12px] leading-4 text-muted">· {hint}</span>}
      </span>
    </label>
  );
}

function Rows({ list, loading, selected, onToggle, name }) {
  if (loading && !list.length) {
    return Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-[18px] w-[60%] animate-pulse rounded bg-line" />
    ));
  }
  return list.map((x) => (
    <CheckRow
      key={x.value}
      label={x.label}
      hint={x.hint}
      checked={selected.includes(x.value)}
      onChange={() => onToggle(name, x.value)}
    />
  ));
}

export default function FilterSidebar({
  options, formatOptions, loading, error, onRetry,
  days, date, selected, onToggle, onDate, activeCount, onClear,
}) {
  const sections = [
    { key: 'venue', title: 'Venue', list: options.venues },
    { key: 'format', title: 'Format', list: formatOptions },
    { key: 'language', title: 'Language', list: options.languages },
    { key: 'time_band', title: 'Time of day', list: options.timeBands },
  ];

  const checkSection = (s) =>
    (loading || s.list.length > 0) && (
      <div key={s.key} className="flex flex-col gap-6">
        <Group title={s.title}>
          <Rows list={s.list} loading={loading} selected={selected[s.key]} onToggle={onToggle} name={s.key} />
        </Group>
        <Divider />
      </div>
    );

  return (
    <aside className="sticky top-6 flex max-h-[calc(100vh-48px)] w-[320px] shrink-0 flex-col justify-between gap-6 overflow-y-auto rounded-2xl bg-surface p-6 [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin]">
      <div className="flex flex-col gap-6">
        <h2 className="text-[18px] leading-5 font-extrabold">Filters</h2>

        {checkSection(sections[0])}

        {/* Date: one value, always selected (default today) */}
        <div className="flex flex-col gap-6">
          <Group title="Date">
            <div className="flex gap-[6px]">
              {days.map((d) => {
                const on = date === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onDate(d.iso)}
                    className={`flex h-[54px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-[6px] rounded-lg px-[6px] py-[10px] text-[12px] leading-[13px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      on ? 'bg-accent' : 'bg-line hover:brightness-125'
                    }`}
                  >
                    <span>{d.weekday}</span>
                    <span>{d.day}</span>
                  </button>
                );
              })}
            </div>
          </Group>
          <Divider />
        </div>

        {checkSection(sections[1])}
        {checkSection(sections[2])}
        {checkSection(sections[3])}

        {error && (
          <p className="text-[12px] text-muted">
            Filters failed to load.{' '}
            <button onClick={onRetry} className="cursor-pointer text-accent underline">
              Retry
            </button>
          </p>
        )}
      </div>

      {/* Sidebar footer */}
      <div className="flex flex-col items-center justify-center gap-3 text-[12px] leading-4 text-muted">
        <span>
          {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="cursor-pointer font-semibold text-accent hover:underline disabled:cursor-default disabled:text-disabled disabled:no-underline"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  );
}