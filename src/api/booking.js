import { api } from './client';

// Real shape: sections[] -> rows[] -> seats[]
export function normalizeSeatMap(res) {
  const d = res.data ?? res;
  return {
    sections: (d.sections ?? []).map((sec) => ({
      name: sec.name,
      rows: (sec.rows ?? []).map((r) => ({
        label: r.label,
        seats: (r.seats ?? []).map((s) => ({
          id: s.id, // send this to the API
          code: s.code, // "E7": show in summary and ticket
          label: s.label, // "7": inside the seat button
          state: s.state, // available | sold | held | unavailable
          aisleAfter: Boolean(s.aisleAfter),
          isMine: Boolean(s.isMine),
        })),
      })),
    })),
  };
}

// silent: a stale token must not log the visitor out; the token (if any) sets isMine
export async function getSeats(sessionId) {
  return normalizeSeatMap(await api(`/sessions/${sessionId}/seats`, { silent: true }));
}

// GUESS: body { seatIds }. Confirm in Swagger.
export async function createHold(sessionId, seatIds) {
  const res = await api(`/sessions/${sessionId}/holds`, { method: 'POST', body: { seatIds } });
  const h = res.data ?? res;
  return {
    id: h.id ?? h.holdId ?? h.token ?? null,
    expiresAt: h.expiresAt ?? h.expires_at ?? null,
    total: h.total ?? h.totalPrice ?? null,
  };
}

// GUESS: body { sessionId, holdId, tickets:[{ seatId, ticketTypeId }], customer }. Confirm in Swagger.
export async function createOrder({ sessionId, holdId, tickets, customer }) {
  const res = await api('/orders', { method: 'POST', body: { sessionId, holdId, tickets, customer } });
  const o = res.data ?? res;
  return { code: o.code ?? o.reference ?? o.number ?? o.id, total: o.total ?? o.totalPrice ?? null };
}

// GUESS: where the 409 puts the seat ids that were taken
export function contestedIds(err) {
  const c = err?.contested ?? err?.body?.contested ?? err?.errors?.contested ?? err?.data?.contested;
  return Array.isArray(c) ? c.map((x) => (typeof x === 'object' ? x.id ?? x.seatId : x)) : [];
}