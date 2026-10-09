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
          code: s.code, // "E7": show in summary and ticket; 409 `contested` uses this
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

// POST /sessions/{id}/holds  body: { seats: [{ seatId, ticketType: "adult" | "student" | "child" }] }
export async function createHold(sessionId, seats) {
  if (!seats?.length) throw new Error('Pick at least one seat.');
  const res = await api(`/sessions/${sessionId}/holds`, {
    method: 'POST',
    body: { seats: seats.map((s) => ({ seatId: s.seatId, ticketType: s.ticketType })) },
  });
  const h = res.data ?? res;
  return {
    id: h.holdId,
    expiresAt: h.expiresAt ?? null,
    total: h.subtotal ?? null,
  };
}

// DELETE /holds/{id}: call when the modal closes without paying. Failure is not fatal (the hold lapses by itself).
export async function releaseHold(holdId) {
  if (!holdId) return;
  try {
    await api(`/holds/${holdId}`, { method: 'DELETE', silent: true });
  } catch {
    /* ignore */
  }
}

// POST /orders  body: { holdId, fullName, email, mobileNumber, cardNumber, expiry, cvv }
export async function createOrder(payload) {
  const res = await api('/orders', { method: 'POST', body: payload });
  const o = res.data ?? res;
  const tickets = (o.tickets ?? []).map((t) => ({
    seatCode: t.seatCode,
    type: t.ticketType?.name ?? '',
    price: t.price,
  }));
  return {
    id: o.id,
    code: o.reference,
    total: o.totalPrice,
    tickets,
    seats: tickets.map((t) => t.seatCode),
    venue: o.session?.venue?.name ?? '',
    hall: o.session?.hall?.name ?? '',
    date: o.session?.date ?? '',
    time: o.session?.time ?? '',
  };
}

// 409 body: { message, contested: ["E7", "E8"] }  (seat CODES)
export function contestedCodes(err) {
  const c = err?.contested ?? err?.body?.contested ?? err?.data?.contested ?? err?.errors?.contested;
  return Array.isArray(c) ? c.map(String) : [];
}

// 422 body: { message, errors: { field: [msg] } }. Returns { field: firstMessage } or null when there is no `errors`.
export function fieldErrors(err) {
  const e = err?.errors ?? err?.body?.errors ?? err?.data?.errors;
  if (!e || typeof e !== 'object' || !Object.keys(e).length) return null;
  return Object.fromEntries(Object.entries(e).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));
}