import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';

export default function CardBig({ movie, onSelectSeats }) {
  const navigate = useNavigate();
  const meta = [movie.genres?.[0], movie.duration && `${movie.duration} min`]
    .filter(Boolean)
    .join(' · ');

  // Seat modal comes later; until then go to the detail page
  const handleSelect = () =>
    onSelectSeats ? onSelectSeats(movie) : navigate(`/movies/${movie.id}`);

  return (
    <article className="flex h-[452px] flex-col gap-[10px] rounded-[20px] bg-surface p-3 shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
      <Link to={`/movies/${movie.id}`} className="block h-[300px] shrink-0">
        <img
          src={movie.poster}
          alt={movie.title}
          className="h-full w-full rounded-[14px] object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-[7px]">
            <Link to={`/movies/${movie.id}`}>
              <h3 className="truncate text-[18px] leading-[20px] font-extrabold uppercase">
                {movie.title}
              </h3>
            </Link>
            <p className="truncate text-[12px] leading-[16px] text-muted">{meta}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-[10px]">
          <div className="flex items-center gap-2">
            {movie.ageRating && (
              <span className="rounded-full bg-accent/10 px-[7px] py-1 text-[12px] leading-[13px] font-semibold text-accent">
                {movie.ageRating}
              </span>
            )}
            {movie.minPrice != null && (
              <span className="text-[12px] leading-[13px] font-semibold">
                From ₾ {movie.minPrice}
              </span>
            )}
          </div>
          <Button size="md" onClick={handleSelect}>
            Select Seats
          </Button>
        </div>
      </div>
    </article>
  );
}