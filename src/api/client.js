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
    this.body = body
    // errors present => form problem. errors absent => rule problem (show message as-is)
    this.errors = body?.errors ?? null
    this.contested = body?.contested ?? null
  }
}

export async function api(path, { method = 'GET', body, auth = true, silent = false } = {}) {
  const headers = { Accept: 'application/json' }
  const token = auth ? tokenStore.get() : null
  if (token) headers.Authorization = `Bearer ${token}`

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }

  const res = await fetch(BASE + path, { method, headers, body })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && token) {
      if (silent) tokenStore.clear()
      else onUnauthorized()
    }
    throw new ApiError(res.status, data)
  }
  return data
}