import { api } from './client'

export function register({ username, email, password, confirm, avatar }) {
  const fd = new FormData()
  fd.append('username', username)
  fd.append('email', email)
  fd.append('password', password)
  fd.append('password_confirmation', confirm) // snake_case, the one exception
  if (avatar) fd.append('avatar', avatar)     // omit entirely when empty
  return api('/register', { method: 'POST', body: fd }) // → { data: { user, token } }
}

export const login = (email, password) =>
  api('/login', { method: 'POST', body: { email, password } })