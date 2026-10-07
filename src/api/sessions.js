import { api } from './client';
import { label, normalizeMovie } from './movies';

// "2026-10-06T10:00:00+00:00" -> "10:00" (fallback if `time` is missing)
const timeFrom = (iso) => {
  const m = typeof iso === 'string' && iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
};

// The ONLY place that knows session field names
export function normalizeSession(s, parentMovie) {
  const hall = typeof s.hall === 'object' ? s.hall?.name : s.hall;
  return {
    id: s.id,
    movie: normalizeMovie(s.movie ?? parentMovie ?? {}),
    startsAt: s.startsAt ?? null,
    date: s.date ?? (s.startsAt ? String(s.startsAt).slice(0, 10) : null),
    time: s.time ?? timeFrom(s.startsAt),
    timeBand: s.timeBand ?? null,
    venue: label(s.venue ?? s.hall?.venue),
    hall: hall != null ? String(hall) : null,
    format: label(s.format),
    language: label(s.language),
    languageCode: s.language?.code ?? null,
    price: s.price ?? null,
    seatsLeft: s.seatsLeft ?? null,
    isSoldOut: Boolean(s.isSoldOut),
  };
}

// Our URL names -> API array params
const ARRAYS = { venue: 'venues[]', format: 'formats[]', language: 'languages[]', time_band: 'bands[]' };

export async function getSessions(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === '' || v == null) return;
    if (ARRAYS[k]) String(v).split(',').filter(Boolean).forEach((x) => qs.append(ARRAYS[k], x));
    else qs.set(k, v);
  });

  const res = await api(`/sessions${qs.size ? `?${qs}` : ''}`, { auth: false });
  const meta = res.meta ?? {};
  const groups = (res.data ?? []).map((g) => ({
    movie: normalizeMovie(g.movie),
    items: (g.sessions ?? []).map((s) => normalizeSession(s, g.movie)),
  }));

  return {
    groups,
    page: meta.currentPage ?? 1,
    lastPage: meta.lastPage ?? 1,
    total: meta.totalSessions ?? groups.reduce((n, g) => n + g.items.length, 0),
    totalMovies: meta.totalMovies ?? groups.length,
  };
}

// One session (the booking modal header)
export async function getSession(id) {
  const res = await api(`/sessions/${id}`, { auth: false });
  return normalizeSession(res.data ?? res);
}

// One film's sessions on one date, grouped by venue
export async function getMovieSessions(slug, date) {
  const res = await api(`/movies/${slug}/sessions?date=${date}`, { auth: false });
  return (res.data ?? []).map((g) => ({
    venue: { id: g.venue?.id, name: label(g.venue), city: g.venue?.city ?? null },
    sessions: (g.sessions ?? []).map((s) => normalizeSession(s)),
  }));
}