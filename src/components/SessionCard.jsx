import { Armchair } from 'lucide-react';

const LOW_SEATS = 20; // at or below this the "left" count turns red (my guess, adjust to the brief)

export default function SessionCard({ s, onOpen }) {
  const soldOut = s.isSoldOut;
  const low = !soldOut && s.seatsLeft != null && s.seatsLeft <= LOW_SEATS;
  const place = [s.venue, s.hall && `Hall ${s.hall}`].filter(Boolean).join(' · ');
  const statusColor = soldOut || low ? 'text-accent' : 'text-[#4ADE80]';
  const statusText = soldOut ? 'Sold out' : s.seatsLeft != null ? `${s.seatsLeft} left` : '';

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={soldOut}
      className={`flex h-[104px] w-[252px] flex-col items-start gap-[6px] rounded-2xl bg-surface p-[15px] text-left transition ${
        soldOut ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:brightness-125'
      }`}
    >
      <span className="flex w-full flex-col gap-3">
        {/* Row 1: time ........ format pill */}
        <span className="flex w-full items-center">
          <span className="text-[18px] leading-[20px] font-extrabold">{s.time}</span>
          <span className="flex-1" />
          {s.format && (
            <span className="flex items-center justify-center rounded-full bg-line px-[10px] py-[5px] text-[12px] leading-[13px] font-semibold uppercase">
              {s.format}
            </span>
          )}
        </span>

        {/* Row 2: language + place ........ seats left + price */}
        <span className="flex w-full items-start gap-2">
          <span className="flex min-w-0 flex-1 flex-col gap-[10px]">
            <span className="truncate text-[12px] leading-[130%] text-muted">{s.language}</span>
            <span className="truncate text-[12px] leading-[13px] font-semibold">{place}</span>
          </span>

          <span className="flex shrink-0 flex-col items-end justify-center gap-[10px]">
            <span className={`flex items-center justify-end gap-1 ${statusColor}`}>
              <Armchair size={12} />
              <span className="text-[12px] leading-[130%]">{statusText}</span>
            </span>
            <span className="text-[14px] leading-[15px] font-extrabold">
              {s.price != null ? `₾${s.price}` : ''}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}