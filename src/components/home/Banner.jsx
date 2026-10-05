import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock3, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Banner({ movies = [], onOpen }) {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)

  // Automatically change featured movie
  useEffect(() => {
    if (movies.length <= 1) return

    const timer = setInterval(() => {
      setActiveIndex((current) =>
        current === movies.length - 1 ? 0 : current + 1
      )
    }, 5000)

    return () => clearInterval(timer)
  }, [movies.length])

  // Keep index valid if API data changes
  useEffect(() => {
    if (activeIndex >= movies.length) {
      setActiveIndex(0)
    }
  }, [movies.length, activeIndex])

  if (!movies.length) {
    return (
      <section className="relative h-[760px] w-full overflow-hidden bg-[#070C1C]">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />

        <div className="absolute bottom-[179px] left-[67px]">
          <h1 className="text-[40px] font-extrabold leading-[44px] text-white">
            Kino XII
          </h1>
        </div>
      </section>
    )
  }

  const movie = movies[activeIndex]

  const previousSlide = () => {
    setActiveIndex((current) =>
      current === 0 ? movies.length - 1 : current - 1
    )
  }

  const nextSlide = () => {
    setActiveIndex((current) =>
      current === movies.length - 1 ? 0 : current + 1
    )
  }

  const openMovie = () => {
    onOpen?.(movie)

    if (movie.id) {
      navigate(`/movies/${movie.id}`)
    }
  }

  return (
    <section className="relative h-[760px] w-full overflow-hidden bg-[#070C1C]">
      {/* Background images */}
      {movies.map((item, index) => (
        <img
          key={item.id}
          src={item.backdrop_url}
          alt=""
          aria-hidden="true"
          className={`absolute left-0 top-[-88.56px] h-[1062.72px] w-full object-cover transition-opacity duration-700 ${
            index === activeIndex
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        />
      ))}

      {/* Dark gradient from design */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/[0.08]" />

      {/* Movie information */}
      <div className="absolute bottom-[179px] left-[67px] flex h-[256px] w-[580px] flex-col gap-[15px]">
        {/* Featured label */}
        <div className="flex h-[25px] items-center">
          <span className="rounded-full bg-[#EC3013]/10 px-[10px] py-[6px] text-[12px] font-semibold leading-[13px] text-[#EC3013]">
            FEATURED MOVIE
          </span>
        </div>

        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[15px]">
            {/* Title */}
            <h1 className="h-[44px] truncate text-[40px] font-extrabold leading-[44px] text-white">
              {movie.title}
            </h1>

            {/* Movie badges */}
            <div className="flex h-[26px] items-start gap-[8px]">
              {/* Age */}
              <span className="inline-flex h-[25px] items-center rounded-full bg-[#EC3013]/10 px-3 text-[12px] font-semibold leading-[13px] text-[#EC3013]">
                {movie.age_rating}
              </span>

              {/* Duration */}
              <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-white/10 px-3 text-[12px] font-semibold leading-[13px] text-white">
                <Clock3 size={14} strokeWidth={1.5} />
                {movie.duration} min
              </span>

              {/* Genre */}
              {movie.genre && (
                <span className="inline-flex h-[25px] items-center rounded-full bg-white/10 px-3 text-[12px] font-semibold leading-[13px] text-white">
                  {movie.genre}
                </span>
              )}

              {/* Language */}
              {movie.language && (
                <span className="inline-flex h-[25px] items-center rounded-full bg-white/10 px-3 text-[12px] font-semibold leading-[13px] text-white">
                  {movie.language}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {movie.description && (
            <p className="h-[54px] max-w-[560px] overflow-hidden text-[14px] font-normal leading-[18px] text-white">
              {movie.description}
            </p>
          )}

          {/* Buttons */}
          <div className="flex h-[42px] items-start gap-[10px]">
            <button
              type="button"
              onClick={openMovie}
              className="flex h-[42px] w-[143px] items-center justify-center gap-1 rounded-full bg-[#EC3013] px-[22px] text-[14px] font-extrabold leading-[15px] text-white transition-opacity hover:opacity-90"
            >
              <Play size={16} fill="white" />
              Buy Ticket
            </button>

            <button
              type="button"
              onClick={openMovie}
              className="flex h-[41px] w-[128px] items-center justify-center rounded-full bg-white/10 px-[22px] text-[14px] font-extrabold leading-[15px] text-white transition-colors hover:bg-white/20"
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-[42px] left-1/2 flex h-[54px] w-[1594px] max-w-[calc(100%-120px)] -translate-x-1/2 items-center gap-5">
        {/* Progress bars */}
        <div className="flex flex-1 items-center gap-[7px]">
          {movies.slice(0, 4).map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show featured movie ${index + 1}`}
              className={`h-[3px] flex-1 rounded-full transition-colors ${
                index === activeIndex
                  ? 'bg-[#EC3013]'
                  : 'bg-white'
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex h-[54px] items-center gap-[10px]">
          <button
            type="button"
            onClick={previousSlide}
            aria-label="Previous movie"
            className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#070C1C]/20 text-white transition-colors hover:bg-[#070C1C]/40"
          >
            <ChevronLeft size={34} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next movie"
            className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#070C1C]/20 text-white transition-colors hover:bg-[#070C1C]/40"
          >
            <ChevronRight size={34} strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  )
}