const STORAGE_KEY = 'kino_recent_movies'
const MAX_RECENT = 4

export function getRecentMovies() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)

    if (!value) {
      return []
    }

    const movies = JSON.parse(value)

    return Array.isArray(movies) ? movies : []
  } catch {
    return []
  }
}

export function addRecentMovie(movie) {
  if (!movie?.id) {
    return
  }

  const current = getRecentMovies()

  const updated = [
    movie,
    ...current.filter((item) => item.id !== movie.id),
  ].slice(0, MAX_RECENT)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}