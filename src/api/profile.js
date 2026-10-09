// Backend field names live only in this file.
import { api } from './client';

function mapProfile(d) {
  return {
    id: d.id,
    username: d.username,
    email: d.email || '',
    avatar: d.avatar || null,
    fullName: d.fullName || '',
    mobileNumber: d.mobileNumber || '',
    dateOfBirth: d.dateOfBirth || '',
    age: d.age ?? null,
    preferredVenueId: d.preferredVenue?.id ?? null,
    profileComplete: Boolean(d.profileComplete),
  };
}

export async function getProfile() {
  const json = await api('/me');
  return mapProfile(json.data ?? json);
}

// ASSUMPTION: endpoint path. Confirm in Swagger.
export async function getVenues() {
  try {
    const json = await api('/venues');
    const list = json.data ?? json;
    return list.map((v) => ({ id: v.id, name: v.name, city: v.city }));
  } catch {
    return [];
  }
}

// multipart/form-data. api() leaves FormData alone, so the browser sets the boundary.
export async function updateProfile({ fullName, mobileNumber, dateOfBirth, preferredVenueId }) {
  const form = new FormData();
  form.append('fullName', fullName);
  form.append('mobileNumber', mobileNumber); // spaces are stripped server-side
  form.append('dateOfBirth', dateOfBirth);
  form.append('preferredVenueId', preferredVenueId ? String(preferredVenueId) : '');

  const json = await api('/profile', { method: 'PUT', body: form });
  return mapProfile(json.data ?? json);
}

// { mobileNumber: ["msg"] } -> { mobileNumber: "msg" } (shown exactly as returned)
export function fieldErrors(err) {
  const raw = err?.errors || {};
  const out = {};
  for (const key of Object.keys(raw)) {
    out[key] = Array.isArray(raw[key]) ? raw[key][0] : raw[key];
  }
  return out;
}