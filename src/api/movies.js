import { api } from './client';
import { featuredMock, nowPlayingMock, comingSoonMock } from '../data/movies';

const USE_MOCK = false; // set to false when the real API is connected
const fake = (data) => new Promise((resolve) => setTimeout(() => resolve(data), 300));

// Turns "Drama", { name: 'Drama' }, { code: '16+' } ... into a plain string
const label = (v) => {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return v.name ?? v.label ?? v.title ?? v.code ?? null;
};
const labels = (arr) => (Array.isArray(arr) ? arr.map(label).filter(Boolean) : []);

export function normalizeMovie(m) {
  return {
    id: m.id,
    slug: m.slug ?? null,
    title: m.title ?? m.name,
    description: m.description ?? m.synopsis ?? m.overview ?? '',
    poster: m.poster ?? m.poster_url ?? m.posterUrl ?? m.image ?? null,
    backdrop:
      m.backdrop ?? m.backdrop_url ?? m.banner ?? m.backdropUrl ?? m.cover ??
      m.poster_url ?? m.poster ?? null,
    genres: labels(m.genres ?? (m.genre ? [m.genre] : [])),
    duration: m.duration ?? m.durationMinutes ?? m.runtime ?? null,
    // object { code, minAge, description } -> "16+"
    ageRating: label(m.ageRating ?? m.age_rating ?? m.rating),
    ageMin: (m.ageRating ?? m.age_rating ?? m.rating)?.minAge ?? null,
    formats: labels(m.formats ?? (m.format ? [m.format] : [])),
    languages: labels(m.languages ?? (m.language ? [m.language] : [])),
    minPrice: m.minPrice ?? m.fromPrice ?? m.priceFrom ?? m.price ?? null,
    releaseDate: m.releaseDate ?? m.release_date ?? null,
  };
}

const list = (res) => (Array.isArray(res) ? res : res.data ?? []).map(normalizeMovie);

export const getFeatured = async () =>
  list(USE_MOCK ? await fake(featuredMock) : await api('/movies/featured', { auth: false }));

export const getNowPlaying = async () =>
  list(USE_MOCK ? await fake(nowPlayingMock) : await api('/movies/now-playing', { auth: false }));

export const getComingSoon = async () =>
  list(USE_MOCK ? await fake(comingSoonMock) : await api('/movies/coming-soon', { auth: false }));