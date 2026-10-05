export function register({ username, email, password, confirm, avatar }) {
  const fd = new FormData()
  fd.append('username', username)
  fd.append('email', email)
  fd.append('password', password)
  fd.append('password_confirmation', confirm)
  if (avatar) fd.append('avatar', avatar)
  return api('/register', { method: 'POST', body: fd, auth: false })
}

export const login = (email, password) =>
  api('/login', { method: 'POST', body: { email, password }, auth: false })