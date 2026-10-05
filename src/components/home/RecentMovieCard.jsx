
import { useNavigate } from 'react-router-dom'

export default function RecentMovieCard({ movie, onOpen }) {
  const navigate = useNavigate()

  const handleOpen = () => {
    onOpen(movie)
    navigate(`/movies/${movie.id}`)
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="flex h-[87px] w-[329px] shrink-0 items-center gap-3 rounded-[16px] bg-[#1E2031] p-[10px] text-left"
    >
      <img
        src={movie.poster_url}
        alt={movie.title}
        className="h-[67px] w-[87px] rounded-[8px] object-cover"
      />

      <div className="min-w-0">
        <h3 className="truncate text-[14px] font-extrabold leading-[15px] text-white">
          {movie.title}
        </h3>

        <p className="mt-1 text-[12px] leading-4 text-[#A9A9A9]">
          {movie.genre} · {movie.duration} min
        </p>

        <span className="mt-1 inline-block rounded-full bg-[#EC3013]/10 px-2 py-1 text-[12px] font-semibold leading-[13px] text-[#EC3013]">
          {movie.age_rating}
        </span>
      </div>
    </button>
  )
}