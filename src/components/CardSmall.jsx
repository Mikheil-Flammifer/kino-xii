import { Link } from 'react-router-dom';
import { moviePath } from '../utils/paths';

export default function CardSmall({ movie }) {
  const img = movie.poster ?? movie.backdrop;
  return (
    <Link
      to={moviePath(movie)}
      className="flex h-[87px] min-w-0 items-center gap-3 rounded-2xl bg-surface p-[10px] transition hover:brightness-110"
    >
      <img
        src={img}
        alt=""
        className="h-[67px] w-[87px] shrink-0 rounded-lg object-cover"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-col gap-1">
          <h3 className="truncate text-[14px] leading-[15px] font-extrabold uppercase">
            {movie.title}
          </h3>
          <p className="truncate text-[12px] leading-[16px] text-muted">
            {[movie.genres?.[0], movie.duration && `${movie.duration} min`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {movie.duration && (
          <span className="self-start rounded-full bg-accent/10 px-2 py-1 text-[12px] leading-[13px] font-semibold text-accent">
            {movie.duration} Min
          </span>
        )}
      </div>
    </Link>
  );
}