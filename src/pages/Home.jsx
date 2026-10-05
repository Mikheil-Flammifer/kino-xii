import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getFeaturedMovies,
  getNowPlayingMovies,
  getComingSoonMovies,
} from '../api/movieApi'

import Hero from '../components/home/Hero'
import MovieCard from '../components/home/MovieCard'
import RecentMovieCard from '../components/home/RecentMovieCard'
import ComingSoonCard from '../components/home/ComingSoonCard'

import {
  addRecentMovie,
  getRecentMovies,
} from '../utils/recentMovies'

function SectionHeader({ title, link }) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="text-[24px] font-extrabold leading-[26px] text-white">
        {title}
      </h2>

      {link && (
        <Link
          to={link.to}
          className="text-[14px] font-semibold text-[#EC3013]"
        >
          {link.label}
        </Link>
      )}
    </div>
  )
}

function ErrorMessage({ children }) {
  return (
    <div className="rounded-2xl bg-[#1E2031] px-5 py-6 text-sm text-[#A9A9A9]">
      {children}
    </div>
  )
}

function MovieCardSkeleton() {
  return (
    <div className="h-[452px] w-[260px] shrink-0 animate-pulse rounded-[20px] bg-[#1E2031] p-3">
      <div className="h-[300px] rounded-[14px] bg-white/5" />
      <div className="mt-4 h-5 w-3/4 rounded bg-white/5" />
      <div className="mt-2 h-4 w-1/2 rounded bg-white/5" />
    </div>
  )
}

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [nowPlaying, setNowPlaying] = useState([])
  const [comingSoon, setComingSoon] = useState([])
  const [recentMovies, setRecentMovies] = useState(
    getRecentMovies()
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadHome() {
      try {
        setLoading(true)
        setError(null)

        const [
          featuredMovies,
          nowPlayingMovies,
          comingSoonMovies,
        ] = await Promise.all([
          getFeaturedMovies(),
          getNowPlayingMovies(),
          getComingSoonMovies(),
        ])

        setFeatured(featuredMovies.slice(0, 4))
        setNowPlaying(nowPlayingMovies)
        setComingSoon(comingSoonMovies)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    loadHome()
  }, [])

  const openMovie = (movie) => {
    addRecentMovie(movie)
    setRecentMovies(getRecentMovies())
  }

  return (
    <main className="min-h-screen bg-[#070C1C]">
      <Hero
        movies={featured}
        onOpen={openMovie}
      />

      <div className="flex flex-col gap-10 pb-16">
        {recentMovies.length > 0 && (
          <>
            <section className="px-[70px] pt-[9px]">
              <div className="mx-auto max-w-[1588px]">
                <SectionHeader title="Recently viewed" />

                <div className="mt-5 flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recentMovies.map((movie) => (
                    <RecentMovieCard
                      key={movie.id}
                      movie={movie}
                      onOpen={openMovie}
                    />
                  ))}
                </div>
              </div>
            </section>

            <div className="h-px bg-[#2A2C3D]" />
          </>
        )}

        <section className="px-[70px]">
          <div className="mx-auto max-w-[1588px]">
            <SectionHeader
              title="NOW PLAYING"
              link={{
                label: 'See all',
                to: '/sessions',
              }}
            />

            <div className="mt-6">
              {loading ? (
                <div className="flex gap-[17px] overflow-hidden">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <MovieCardSkeleton key={index} />
                  ))}
                </div>
              ) : error ? (
                <ErrorMessage>
                  {error.message}
                </ErrorMessage>
              ) : (
                <div className="flex gap-[17px] overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {nowPlaying.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onOpen={openMovie}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="h-px bg-[#2A2C3D]" />

        <section className="px-[70px]">
          <div className="mx-auto max-w-[1588px]">
            <SectionHeader title="COMING SOON" />

            <div className="mt-6">
              {loading ? (
                <div className="flex gap-5">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-[160px] w-[470px] animate-pulse rounded-[20px] bg-[#1E2031]"
                    />
                  ))}
                </div>
              ) : error ? (
                <ErrorMessage>
                  {error.message}
                </ErrorMessage>
              ) : (
                <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {comingSoon.map((movie) => (
                    <ComingSoonCard
                      key={movie.id}
                      movie={movie}
                      onOpen={openMovie}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}