import { api } from './client';

export function register({ username, email, password, confirm, avatar }) {
  const form = new FormData();
  form.append('username', username);
  form.append('email', email);
  form.append('password', password);
  form.append('password_confirmation', confirm); // modal field "confirm" -> API name
  if (avatar) form.append('avatar', avatar);

  return api('/register', { method: 'POST', body: form, auth: false });
}

export function login({ email, password }) {
  return api('/login', { method: 'POST', body: { email, password }, auth: false });
}

export function logout() {
  return api('/logout', { method: 'POST' });
}

export function me() {
  return api('/me', { silent: true });
}