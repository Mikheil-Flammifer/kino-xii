import { useNavigate } from 'react-router-dom'

export default function MovieCard({ movie, onOpen }) {
  const navigate = useNavigate()

  const handleOpen = () => {
    onOpen(movie)
    navigate(`/movies/${movie.id}`)
  }

  return (
    <article className="flex h-[452px] w-[260px] shrink-0 flex-col rounded-[20px] bg-[#1E2031] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
      <button
        type="button"
        onClick={handleOpen}
        className="h-[300px] overflow-hidden rounded-[14px]"
      >
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
        />
      </button>

      <div className="mt-[10px] flex flex-1 flex-col">
        <button
          type="button"
          onClick={handleOpen}
          className="truncate text-left"
        >
          <h3 className="text-[18px] font-extrabold leading-5 text-white">
            {movie.title}
          </h3>
        </button>

        <div className="mt-[7px] flex items-center gap-2">
          <span className="text-[12px] leading-4 text-[#A9A9A9]">
            {movie.genre} · {movie.duration} min
          </span>

          <span className="rounded-full bg-[#EC3013]/10 px-[7px] py-1 text-[12px] font-semibold leading-[13px] text-[#EC3013]">
            {movie.age_rating}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-white">
            From ₾ {movie.from_price}
          </span>

          <button
            type="button"
            onClick={handleOpen}
            className="h-[35px] rounded-full bg-[#EC3013] px-[22px] text-[14px] font-extrabold text-white transition-opacity hover:opacity-90"
          >
            Buy Ticket
          </button>
        </div>
      </div>
    </article>
  )
}