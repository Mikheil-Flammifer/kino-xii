import { api } from './client';
import { label } from './movies';

// "Drama" | { id, name } | { code } | { slug, label } -> { value, label }
const opt = (v) => {
  if (v == null) return null;
  if (typeof v !== 'object') return { value: String(v), label: String(v) };
  const value = v.slug ?? v.id ?? v.code ?? v.value ?? v.key;
  return value == null ? null : { value: String(value), label: label(v) ?? String(value) };
};
const opts = (arr) => (Array.isArray(arr) ? arr.map(opt).filter(Boolean) : []);

// The ONLY place that knows filter-options field names
function normalize(res) {
  const d = res.data ?? res;
  return {
    venues: opts(d.venues),
    formats: opts(d.formats),
    languages: opts(d.languages),
    timeBands: opts(d.timeBands ?? d.time_bands),
    sorts: opts(d.sorts ?? d.sortOptions ?? d.sort_options),
    ticketTypes: opts(d.ticketTypes ?? d.ticket_types),
    ageRatings: d.ageRatings ?? d.age_ratings ?? [],
    maxSeats: d.maxSeats ?? d.max_seats ?? 3,
    holdMinutes: d.holdMinutes ?? d.hold_minutes ?? 8,
  };
}

let cache;
export function getFilterOptions() {
  cache ??= api('/filter-options', { auth: false })
    .then(normalize)
    .catch((e) => {
      cache = undefined; // allow retry
      throw e;
    });
  return cache;
}