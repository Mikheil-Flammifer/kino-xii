import { api } from './client';
import { featuredMock, nowPlayingMock, comingSoonMock } from '../data/movies';

const USE_MOCK = false; // set to false when the real API is connected
const fake = (data) => new Promise((resolve) => setTimeout(() => resolve(data), 300));

// Turns "Drama", { name: 'Drama' }, { code: '16+' } ... into a plain string
export const label = (v) => {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return v.name ?? v.label ?? v.title ?? v.code ?? null;
};
export const labels = (arr) => (Array.isArray(arr) ? arr.map(label).filter(Boolean) : []);

export function normalizeMovie(m) {
  const rating = m.ageRating ?? m.age_rating ?? m.rating;
  return {
    id: m.id,
    slug: m.slug ?? null,
    title: m.title ?? m.name,
    kind: m.kind ?? null,
    description: m.synopsis ?? m.description ?? m.overview ?? '',
    poster: m.posterUrl ?? m.poster ?? m.poster_url ?? m.image ?? null,
    backdrop:
      m.backdropUrl ?? m.backdrop ?? m.backdrop_url ?? m.banner ?? m.cover ??
      m.posterUrl ?? m.poster ?? null,
    genres: labels(m.genres ?? (m.genre ? [m.genre] : [])),
    duration: m.runtimeMinutes ?? m.duration ?? m.durationMinutes ?? m.runtime ?? null,
    ageRating: label(rating),
    ageMin: rating?.minAge ?? null,
    ageDescription: rating?.description ?? '',
    formats: labels(m.formats ?? (m.format ? [m.format] : [])),
    languages: labels(m.languages ?? (m.language ? [m.language] : [])),
    minPrice: m.fromPrice ?? m.minPrice ?? m.priceFrom ?? m.price ?? null,
    releaseDate: m.releaseDate ?? m.release_date ?? null,
    isComingSoon: Boolean(m.isComingSoon),
    isNotified: Boolean(m.isNotified),
    director: m.director ?? '',
    cast: m.cast ?? '',
    availableDates: m.availableDates ?? [],
  };
}

// ...existing getFeatured / getNowPlaying / getComingSoon stay as they are

export async function getMovie(slug) {
  // silent: a stale token must not log the user out on a public page
  const res = await api(`/movies/${slug}`, { silent: true });
  return normalizeMovie(res.data ?? res);
}

// ASSUMED path. Check the real one in Swagger.
export function subscribeMovie(slug) {
  return api(`/movies/${slug}/notify`, { method: 'POST' });
}

const list = (res) => (Array.isArray(res) ? res : res.data ?? []).map(normalizeMovie);


export const getFeatured = async () =>
  list(USE_MOCK ? await fake(featuredMock) : await api('/movies/featured', { auth: false }));

export const getNowPlaying = async () =>
  list(USE_MOCK ? await fake(nowPlayingMock) : await api('/movies/now-playing', { auth: false }));

export const getComingSoon = async () =>
  list(USE_MOCK ? await fake(comingSoonMock) : await api('/movies/coming-soon', { auth: false }));

