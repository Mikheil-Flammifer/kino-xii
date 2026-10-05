import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Hero({ movies, onOpen }) {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (movies.length < 2) {
      return
    }

    const timer = setInterval(() => {
      setActiveIndex((current) =>
        current === movies.length - 1 ? 0 : current + 1
      )
    }, 5000)

    return () => clearInterval(timer)
  }, [movies.length])

  if (!movies.length) {
    return (
      <section className="h-[760px] bg-[#070C1C]" />
    )
  }

  const movie = movies[activeIndex]

  const previous = () => {
    setActiveIndex((current) =>
      current === 0 ? movies.length - 1 : current - 1
    )
  }

  const next = () => {
    setActiveIndex((current) =>
      current === movies.length - 1 ? 0 : current + 1
    )
  }

  const openMovie = () => {
    onOpen(movie)
    navigate(`/movies/${movie.id}`)
  }

  return (
    <section className="relative h-[760px] overflow-hidden">
      {movies.map((item, index) => (
        <img
          key={item.id}
          src={item.backdrop_url}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            index === activeIndex
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />

      <div className="absolute bottom-[179px] left-[7%] w-[580px]">
        <span className="inline-flex rounded-full bg-[#EC3013]/10 px-[10px] py-[6px] text-[12px] font-semibold text-[#EC3013]">
          FEATURED MOVIE
        </span>

        <h1 className="mt-5 text-[40px] font-extrabold leading-[44px] text-white">
          {movie.title}
        </h1>

        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-[#EC3013]/10 px-3 py-1 text-[12px] font-semibold text-[#EC3013]">
            {movie.age_rating}
          </span>

          <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white">
            <Clock size={14} />
            {movie.duration} min
          </span>

          {movie.genre && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white">
              {movie.genre}
            </span>
          )}
        </div>

        {movie.description && (
          <p className="mt-5 max-w-[560px] text-[14px] leading-[18px] text-white">
            {movie.description}
          </p>
        )}

        <div className="mt-5 flex gap-[10px]">
          <button
            type="button"
            onClick={openMovie}
            className="flex h-[42px] items-center gap-2 rounded-full bg-[#EC3013] px-[22px] text-[14px] font-extrabold text-white"
          >
            <Play size={16} fill="currentColor" />
            Buy Ticket
          </button>

          <button
            type="button"
            onClick={openMovie}
            className="h-[42px] rounded-full bg-white/10 px-[22px] text-[14px] font-extrabold text-white"
          >
            Details
          </button>
        </div>
      </div>

      <div className="absolute bottom-[42px] left-1/2 flex w-[calc(100%-140px)] max-w-[1594px] -translate-x-1/2 items-center gap-5">
        <div className="flex flex-1 gap-[7px]">
          {movies.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-[3px] flex-1 rounded-full ${
                index === activeIndex
                  ? 'bg-[#EC3013]'
                  : 'bg-white'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-[10px]">
          <button
            type="button"
            onClick={previous}
            className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#070C1C]/20 text-white"
          >
            <ChevronLeft size={30} />
          </button>

          <button
            type="button"
            onClick={next}
            className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#070C1C]/20 text-white"
          >
            <ChevronRight size={30} />
          </button>
        </div>
      </div>
    </section>
  )
}