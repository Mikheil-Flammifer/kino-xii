import { api } from './client';
import { label, normalizeMovie } from './movies';

// The ONLY place that knows session field names
export function normalizeSession(s) {
  return {
    id: s.id,
    movie: normalizeMovie(s.movie ?? {}),
    startsAt: s.startsAt ?? s.starts_at ?? null,
    date: s.date ?? null,
    time: s.time ?? '', // "22:00" is already the venue-local time
    timeBand: s.timeBand ?? null,
    venue: label(s.venue),
    hall: s.hall?.name ?? null,
    format: label(s.format),
    language: label(s.language), // full name, e.g. "Original with Subtitles"
    languageCode: s.language?.code ?? null,
    price: s.price ?? null,
    seatsLeft: s.seatsLeft ?? null,
    isSoldOut: Boolean(s.isSoldOut),
  };
}

export async function getSessions(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) qs.set(k, v);
  });
  const res = await api(`/sessions${qs.size ? `?${qs}` : ''}`, { auth: false });
  const rows = Array.isArray(res) ? res : res.data ?? [];
  const meta = res.meta ?? {};
  return {
    items: rows.map(normalizeSession),
    page: meta.current_page ?? meta.currentPage ?? 1,
    lastPage: meta.last_page ?? meta.lastPage ?? 1,
    total: meta.total ?? rows.length,
  };
}