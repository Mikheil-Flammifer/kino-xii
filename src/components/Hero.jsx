import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock3, Play } from 'lucide-react';
import { getFeatured } from '../api/movies';
import Button from './Button';

const MAX_SLIDES = 4;
const AUTO_MS = 5000; // set to 0 to turn auto-advance off

export default function Hero() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const load = useCallback(() => {
    setStatus('loading');
    getFeatured()
      .then((data) => {
        setMovies(data.slice(0, MAX_SLIDES));
        setActiveIndex(0);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const count = movies.length;

  // One step every AUTO_MS; restarts after any manual change
  useEffect(() => {
    if (!AUTO_MS || count <= 1 || paused) return;
    const timer = setTimeout(() => {
      setActiveIndex((i) => (i === count - 1 ? 0 : i + 1));
    }, AUTO_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, count, paused]);

  const previousSlide = () => setActiveIndex((i) => (i === 0 ? count - 1 : i - 1));
  const nextSlide = () => setActiveIndex((i) => (i === count - 1 ? 0 : i + 1));

  if (status === 'loading') {
    return <section className="h-[760px] w-full animate-pulse bg-surface" />;
  }

  if (status === 'error' || count === 0) {
    return (
      <section className="flex h-[760px] w-full flex-col items-center justify-center gap-4 bg-surface pt-[111px]">
        <p className="text-muted">Couldn't load featured films.</p>
        <Button onClick={load}>Retry</Button>
      </section>
    );
  }

  const movie = movies[activeIndex];
  const openMovie = () => navigate(`/movies/${movie.id}`);

  return (
    <section
      className="relative h-[760px] w-full overflow-hidden bg-bg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backgrounds (cross-fade) */}
      {movies.map((item, index) => (
        <img
          key={item.id}
          src={item.backdrop}
          alt=""
          aria-hidden="true"
          className={`absolute left-0 top-[-88.56px] h-[1062.72px] w-full object-cover transition-opacity duration-700 ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Figma gradient: dark on the left, light on the right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(270deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Movie information */}
      <div className="absolute bottom-[179px] left-[67px] flex w-[580px] flex-col gap-[15px]">
        <div className="flex h-[25px] items-center">
          <span className="rounded-full bg-accent/10 px-[10px] py-[6px] text-[12px] font-semibold leading-[13px] text-accent">
            FEATURED MOVIE
          </span>
        </div>

        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[15px]">
            <h1 className="h-[44px] truncate text-[40px] font-extrabold uppercase leading-[44px] text-white">
              {movie.title}
            </h1>

            <div className="flex h-[26px] items-start gap-[8px]">
              {movie.ageRating && (
                <span className="inline-flex h-[25px] items-center rounded-full bg-accent/10 px-3 text-[12px] font-semibold leading-[13px] text-accent">
                  {movie.ageRating}
                </span>
              )}
              {movie.duration && (
                <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-white/10 px-3 text-[12px] font-semibold leading-[13px] text-white">
                  <Clock3 size={14} strokeWidth={1.5} />
                  {movie.duration} min
                </span>
              )}
              {movie.genres[0] && (
                <span className="inline-flex h-[25px] items-center rounded-full bg-white/10 px-3 text-[12px] font-semibold leading-[13px] text-white">
                  {movie.genres[0]}
                </span>
              )}
              {movie.languages[0] && (
                <span className="inline-flex h-[25px] items-center rounded-full bg-white/10 px-3 text-[12px] font-semibold leading-[13px] text-white">
                  {movie.languages[0]}
                </span>
              )}
            </div>
          </div>

          {movie.description && (
            <p className="h-[54px] max-w-[560px] overflow-hidden text-[14px] font-normal leading-[18px] text-white">
              {movie.description}
            </p>
          )}

          <div className="flex h-[42px] items-start gap-[10px]">
            <button
              type="button"
              onClick={openMovie}
              className="flex h-[42px] w-[143px] cursor-pointer items-center justify-center gap-1 rounded-full bg-accent px-[22px] text-[14px] font-extrabold leading-[15px] text-white transition hover:brightness-110"
            >
              <Play size={16} fill="white" />
              Buy Ticket
            </button>
            <button
              type="button"
              onClick={openMovie}
              className="flex h-[41px] w-[128px] cursor-pointer items-center justify-center rounded-full bg-white/10 px-[22px] text-[14px] font-extrabold leading-[15px] text-white transition-colors hover:bg-white/20"
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Bottom controls: 4 bars + 2 arrows */}
      <div className="absolute inset-x-[67px] bottom-[42px] flex h-[54px] items-center gap-5">
        {/* 4 equal parts, gap 7px, 3px high. Active = red, others = white */}
        <div className="flex flex-1 items-center gap-[7px]">
          {movies.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show featured movie ${index + 1}`}
              className="flex-1 cursor-pointer py-2"
            >
              <div
                className={`h-[3px] w-full rounded-full ${
                  index === activeIndex ? 'bg-accent' : 'bg-white'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Arrows: 54x54, gap 10px, icon 34px */}
        <div className="flex h-[54px] items-center gap-[10px]">
          <button
            type="button"
            onClick={previousSlide}
            aria-label="Previous movie"
            className="flex h-[54px] w-[54px] cursor-pointer items-center justify-center rounded-full bg-bg/20 text-white transition-colors hover:bg-bg/40"
          >
            <ChevronLeft size={34} strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next movie"
            className="flex h-[54px] w-[54px] cursor-pointer items-center justify-center rounded-full bg-bg/20 text-white transition-colors hover:bg-bg/40"
          >
            <ChevronRight size={34} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </section>
  );
}