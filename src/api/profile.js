// Backend field names live only in this file.
const BASE = import.meta.env.VITE_API_URL;

// ASSUMPTION: adjust to however your login stores the token.
function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    err.errors = body?.errors || null;
    throw err;
  }
  return body;
}

function mapProfile(d) {
  return {
    id: d.id,
    username: d.username,
    email: d.email || "",
    avatar: d.avatar || null,
    fullName: d.fullName || "",
    mobileNumber: d.mobileNumber || "",
    dateOfBirth: d.dateOfBirth || "",
    age: d.age ?? null,
    preferredVenueId: d.preferredVenue?.id ?? null,
    profileComplete: Boolean(d.profileComplete),
  };
}

export async function getProfile() {
  const json = await request("/me");
  return mapProfile(json.data ?? json);
}

// ASSUMPTION: endpoint path. Confirm in Swagger.
export async function getVenues() {
  try {
    const json = await request("/venues");
    const list = json.data ?? json;
    return list.map((v) => ({ id: v.id, name: v.name, city: v.city }));
  } catch {
    return [];
  }
}

// multipart/form-data. Do NOT set Content-Type manually.
export async function updateProfile({
  fullName,
  mobileNumber,
  dateOfBirth,
  preferredVenueId,
}) {
  const form = new FormData();
  form.append("fullName", fullName);
  form.append("mobileNumber", mobileNumber); // spaces are stripped server-side
  form.append("dateOfBirth", dateOfBirth);
  form.append("preferredVenueId", preferredVenueId ? String(preferredVenueId) : "");

  const json = await request("/profile", { method: "PUT", body: form });
  return mapProfile(json.data ?? json);
}

// { mobileNumber: ["msg"] } -> { mobileNumber: "msg" } (shown exactly as returned)
export function fieldErrors(err) {
  const raw = err?.errors || err?.body?.errors || {};
  const out = {};
  for (const key of Object.keys(raw)) {
    out[key] = Array.isArray(raw[key]) ? raw[key][0] : raw[key];
  }
  return out;
}