import { api } from './client';
import { label, normalizeMovie } from './movies';

// The ONLY place that knows session field names
export function normalizeSession(s) {
  return {
    id: s.id,
    movie: normalizeMovie(s.movie ?? {}),
    startsAt: s.startsAt ?? s.starts_at ?? s.startTime ?? s.start_time ?? s.datetime ?? null,
    venue: label(s.venue),
    format: label(s.format),
    language: label(s.language),
    price: s.price ?? s.minPrice ?? s.fromPrice ?? null,
    seatsLeft: s.availableSeats ?? s.available_seats ?? s.seatsLeft ?? null,
  };
}

export async function getSessions(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString();
  const res = await api(`/sessions${qs ? `?${qs}` : ''}`, { auth: false });
  return (Array.isArray(res) ? res : res.data ?? []).map(normalizeSession);
}