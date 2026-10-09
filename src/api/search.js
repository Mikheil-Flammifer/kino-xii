// Backend field names live only in this file.
import { api } from './client';

function mapMovie(m) {
  const genre = m.genres?.[0]?.name ?? '';
  const runtime = m.runtimeMinutes ? `${m.runtimeMinutes} min` : '';
  return {
    id: m.id,
    slug: m.slug,
    title: m.title ?? '',
    poster: m.posterUrl ?? null,
    meta: [genre, runtime].filter(Boolean).join(' · '),
    comingSoon: Boolean(m.isComingSoon),
    fromPrice: m.fromPrice ?? null,
  };
}

// GET /search?q=...  -> { data: [...] }, at most 6 results, blank q returns []
export async function searchMovies(query) {
  const res = await api(`/search?q=${encodeURIComponent(query)}`, { auth: false, silent: true });
  const list = Array.isArray(res) ? res : res.data ?? [];
  return list.map(mapMovie);
}