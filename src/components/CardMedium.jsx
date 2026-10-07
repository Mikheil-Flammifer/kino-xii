import { Link } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import { moviePath } from '../utils/paths';

function releaseLabel(date) {
  if (!date) return 'COMING SOON';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'COMING SOON';
  const text = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `IN CINEMAS ${text}`.toUpperCase();
}

export default function CardMedium({ movie, notified, onNotify }) {
  const img = movie.backdrop ?? movie.poster;
  const meta = [movie.genres?.[0], movie.duration && `${movie.duration} min`]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="flex h-[160px] items-center gap-[15px] rounded-[20px] bg-surface p-3 shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
      <Link to={moviePath(movie)} className="h-[136px] min-w-0 flex-1">
        <img
          src={img}
          alt={movie.title}
          className="h-full w-full rounded-[14px] object-cover"
        />
      </Link>

      <div className="flex h-[132px] w-[150px] shrink-0 flex-col justify-between">
        <div className="flex flex-col gap-[7px]">
          <p className="truncate text-[12px] leading-[13px] font-semibold text-accent">
            {releaseLabel(movie.releaseDate)}
          </p>
          <div className="flex flex-col gap-[10px]">
            <div className="flex flex-col gap-[7px]">
              <Link to={moviePath(movie)}>
                <h3 className="truncate text-[12px] leading-[13px] font-semibold">
                  {movie.title}
                </h3>
              </Link>
              <p className="truncate text-[12px] leading-[16px] text-muted">{meta}</p>
            </div>
            {movie.duration && (
              <span className="self-start rounded-full bg-accent/10 px-[7px] py-1 text-[12px] leading-[13px] font-semibold text-accent">
                {movie.duration} Min
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNotify(movie.id)}
          aria-pressed={notified}
          className={`inline-flex cursor-pointer items-center justify-center gap-1 self-start rounded-full border px-3 py-[6px] text-[12px] leading-[13px] font-semibold transition ${
            notified
              ? 'border-success text-success'
              : 'border-muted text-white hover:bg-white/10'
          }`}
        >
          {notified ? <BellRing size={16} /> : <Bell size={16} />}
          {notified ? 'Notifying' : 'Notify Me'}
        </button>
      </div>
    </article>
  );
}