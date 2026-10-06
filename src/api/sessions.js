import { api } from './client';
import { label, normalizeMovie } from './movies';

const pad = (n) => String(n).padStart(2, '0');

// "2026-10-07T22:00:00+00:00" -> "22:00" (read as written, no timezone shift)
const timeFrom = (iso) => {
  const m = typeof iso === 'string' && iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
};

// The ONLY place that knows session field names
export function normalizeSession(s, parent = {}) {
  const startsAt = s.startsAt ?? s.starts_at ?? s.startTime ?? s.start_time ?? null;
  const venue = s.venue ?? s.hall?.venue ?? parent.venue ?? null;
  const hall = s.hall?.name ?? s.hall ?? null;

  return {
    id: s.id,
    movie: normalizeMovie(s.movie ?? parent.movie ?? {}),
    startsAt,
    date: s.date ?? (startsAt ? String(startsAt).slice(0, 10) : null),
    time: s.time ?? timeFrom(startsAt),
    timeBand: s.timeBand ?? s.time_band ?? null,
    venue: label(venue),
    hall: typeof hall === 'string' || typeof hall === 'number' ? String(hall) : label(hall),
    format: label(s.format),
    language: label(s.language),
    languageCode: s.language?.code ?? null,
    price: s.price ?? s.fromPrice ?? null,
    seatsLeft: s.seatsLeft ?? s.seats_left ?? s.availableSeats ?? null,
    isSoldOut: Boolean(s.isSoldOut ?? s.is_sold_out ?? s.seatsLeft === 0),
  };
}

// Accepts a flat list OR groups like { movie|venue, sessions: [...] }
function flatten(rows) {
  return rows.flatMap((r) =>
    Array.isArray(r.sessions) ? r.sessions.map((s) => normalizeSession(s, r)) : [normalizeSession(r)]
  );
}

export async function getSessions(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) qs.set(k, v);
  });
  const res = await api(`/sessions${qs.size ? `?${qs}` : ''}`, { auth: false });
  const rows = Array.isArray(res) ? res : res.data ?? [];
  const meta = res.meta ?? {};
  const items = flatten(rows);

  if (import.meta.env.DEV) console.log('sessions sample:', rows[0], '->', items[0]);

  return {
    items,
    page: meta.current_page ?? meta.currentPage ?? 1,
    lastPage: meta.last_page ?? meta.lastPage ?? 1,
    total: meta.total ?? items.length,
  };
}