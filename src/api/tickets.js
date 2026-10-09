// Backend field names live only in this file.
import { api } from './client';

function mapOrder(o) {
  const s = o.session ?? {};
  const m = s.movie ?? {};
  return {
    id: o.id,
    reference: o.reference,
    status: o.status,
    total: o.totalPrice,
    isUpcoming: Boolean(o.isUpcoming),
    isRefundable: Boolean(o.isRefundable),
    refundedAt: o.refundedAt ?? null,
    session: {
      id: s.id,
      startsAt: s.startsAt ?? '',
      date: s.date ?? '',
      time: s.time ?? '',
      venue: s.venue?.name ?? '',
      hall: s.hall?.name ?? '',
      format: s.format?.name ?? '',
      language: s.language?.name ?? '',
    },
    movie: {
      title: m.title ?? '',
      poster: m.posterUrl ?? null,
      runtime: m.runtimeMinutes ?? null,
      ageCode: m.ageRating?.code ?? '',
    },
    seats: (o.tickets ?? []).map((t) => ({
      code: t.seatCode,
      type: t.ticketType?.name ?? '',
      price: t.price,
    })),
  };
}

// filter: 'upcoming' | 'past'
export async function getTickets(filter) {
  const res = await api(`/tickets?filter=${filter}`);
  return (res.data ?? res).map(mapOrder);
}

// POST /orders/{reference}/refund -> the updated order. A 422 means it was refused.
export async function refundOrder(reference) {
  const res = await api(`/orders/${reference}/refund`, { method: 'POST' });
  return mapOrder(res.data ?? res);
}