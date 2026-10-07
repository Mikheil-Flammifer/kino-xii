import { Armchair } from 'lucide-react';

const LOW_SEATS = 10;

// Figma: 207×81 ticket, perforation at x=124, notches 14px
export default function TicketCard({ s, onOpen, locked = false, lockedReason = '' }) {
  const disabled = s.isSoldOut || locked;
  const low = s.seatsLeft != null && s.seatsLeft <= LOW_SEATS;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      title={locked ? lockedReason : undefined}
      className={`relative flex h-[81px] w-[207px] shrink-0 rounded-xl bg-bg text-left drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:brightness-125'
      }`}
    >
      {/* Left: time, language, format */}
      <div className="flex w-[124px] flex-col items-center justify-center gap-2 py-[15px]">
        <span className="text-[20px] leading-[22px] font-extrabold">{s.time || '--:--'}</span>
        <div className="flex items-center gap-[6px]">
          <span className="text-[12px] leading-4 text-muted">{s.languageCode ?? s.language ?? '—'}</span>
          <span className="rounded-full bg-surface px-3 py-1 text-[12px] leading-[13px] font-semibold text-[rgba(227,227,227,0.7)] uppercase">
            {s.format || 'Standard'}
          </span>
        </div>
      </div>

      {/* Right: price, seats */}
      <div className="flex w-[83px] flex-col items-center justify-center gap-2 px-[15px] py-[10px]">
        {s.price != null && (
          <span className="text-[18px] leading-5 font-extrabold text-accent">₾ {s.price}</span>
        )}
        {s.isSoldOut ? (
          <span className="text-[12px] leading-4 text-muted">Sold out</span>
        ) : (
          s.seatsLeft != null && (
            <span className={`flex items-center gap-1 text-[12px] leading-4 ${low ? 'text-accent' : 'text-muted'}`}>
              <Armchair size={12} />
              {s.seatsLeft} left
            </span>
          )
        )}
      </div>

      {/* Perforation + notches (notches use the hall card colour, so they look cut out) */}
      <span className="pointer-events-none absolute top-[11px] left-[124px] h-[59px] border-l-[1.5px] border-dashed border-white" />
      <span className="pointer-events-none absolute -top-[7px] left-[117px] size-[14px] rounded-full bg-surface" />
      <span className="pointer-events-none absolute -bottom-[7px] left-[117px] size-[14px] rounded-full bg-surface" />
    </button>
  );
}