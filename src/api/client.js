const BASE = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'kino_token'

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Something went wrong')
    this.status = status
    // errors present => form problem. errors absent => rule problem (show message as-is)
    this.errors = body?.errors ?? null
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }

  const res = await fetch(BASE + path, { method, headers, body })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    // only treat as "session expired" if we actually had a token
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(res.status, data)
  }
  return data
}