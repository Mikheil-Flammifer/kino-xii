import { api } from './api'

export const getFeaturedMovies = () =>
  api('/movies/featured', {
    auth: false,
  })

export const getNowPlayingMovies = () =>
  api('/movies/now-playing', {
    auth: false,
  })

export const getComingSoonMovies = () =>
  api('/movies/coming-soon', {
    auth: false,
  })