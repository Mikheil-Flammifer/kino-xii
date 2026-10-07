import { api } from './client';

const slugOf = (x) => String(x?.slug ?? x?.id ?? x?.code ?? x);

const opt = (v) => ({
  value: slugOf(v),
  label: v.name ?? v.label ?? slugOf(v),
  hint: v.city ?? '',
  // venues only: formats this venue can show (null = unknown, show all)
  formats: Array.isArray(v.formats) ? v.formats.map(slugOf) : null,
});

// "Morning (before 12:00)" -> label "Morning", hint "before 12:00"
const band = (v) => {
  const m = String(v.label ?? v.id).match(/^(.*?)\s*\((.*)\)$/);
  return {
    value: String(v.id),
    label: m ? m[1] : v.label,
    hint: m ? m[2].replace(' - ', '–') : '',
    formats: null,
  };
};

const sort = (v) => ({ value: String(v.id), label: v.label });

const ticket = (t) => ({
  id: t.id,
  value: t.slug,
  label: t.name,
  ratio: t.priceRatio ?? 1,
  note: t.note ?? '',
  blockedFromAge: t.blockedFromRatingAge ?? null,
});

const list = (arr, fn) => (Array.isArray(arr) ? arr.map(fn) : []);

// The ONLY place that knows filter-options field names
function normalize(res) {
  const d = res.data ?? res;
  return {
    venues: list(d.venues, opt),
    formats: list(d.formats, opt),
    languages: list(d.languages, opt),
    timeBands: list(d.timeBands, band),
    sorts: list(d.sorts, sort),
    ticketTypes: list(d.ticketTypes, ticket),
    ageRatings: d.ageRatings ?? [],
    maxSeats: d.maxSeatsPerOrder ?? 3,
    holdMinutes: d.holdMinutes ?? 8,
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