import { useNavigate } from 'react-router-dom'

export default function ComingSoonCard({ movie, onOpen }) {
  const navigate = useNavigate()

  const handleOpen = () => {
    onOpen(movie)
    navigate(`/movies/${movie.id}`)
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="flex h-[160px] w-[470px] shrink-0 items-center gap-[15px] rounded-[20px] bg-[#1E2031] p-3 text-left"
    >
      <img
        src={movie.poster_url}
        alt={movie.title}
        className="h-[136px] w-[160px] rounded-[14px] object-cover"
      />

      <div className="min-w-0">
        <h3 className="truncate text-[18px] font-extrabold leading-5 text-white">
          {movie.title}
        </h3>

        <p className="mt-2 text-[12px] text-[#A9A9A9]">
          {movie.duration} min
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-[#EC3013]/10 px-2 py-1 text-[12px] font-semibold text-[#EC3013]">
            {movie.age_rating}
          </span>

          <span className="text-[12px] font-semibold text-white">
            {movie.release_date}
          </span>
        </div>
      </div>
    </button>
  )
}