import { Armchair } from 'lucide-react';

const LOW_SEATS = 10;

export default function SessionCard({ s, onOpen, locked = false, lockedReason = '', showVenue = true }) {
  const low = s.seatsLeft != null && s.seatsLeft <= LOW_SEATS;
  const disabled = s.isSoldOut || locked;
  const place = [showVenue && s.venue, s.hall && `Hall ${s.hall}`].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      title={locked ? lockedReason : undefined}
      className={`flex h-[104px] w-[252px] flex-col justify-between rounded-2xl bg-surface p-[15px] text-left transition ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:brightness-125'
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