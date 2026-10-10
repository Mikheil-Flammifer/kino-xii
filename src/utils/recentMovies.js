const STORAGE_KEY = 'kino_recent_movies'
const MAX_RECENT = 4

export function getRecentMovies() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)

    if (!value) {
      return []
    }

    const movies = JSON.parse(value)

    return Array.isArray(movies) ? movies.filter((m) => m?.slug) : []
  } catch {
    return []
  }
}

export function addRecentMovie(movie) {
  if (!movie?.slug) {
    return
  }
  console.log('recent', recent, 'nowPlaying', nowPlaying.data?.[0])

  const current = getRecentMovies()

  const updated = [
    movie,
    ...current.filter((item) => item.slug !== movie.slug),
  ].slice(0, MAX_RECENT)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}