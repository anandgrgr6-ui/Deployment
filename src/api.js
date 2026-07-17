// Thin fetch wrapper. All calls go to the Node backend under /api
// (proxied to :3006 by vite.config.js in dev, same-origin in production).

const TOKEN_KEY = 'rane_token';
const USER_KEY = 'rane_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}
export function setStoredUser(u) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) clearSession();
  if (!res.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
}

export const login = (username, password) =>
  request('/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const getObservations = (plant) =>
  request(`/observations${plant ? `?plant=${encodeURIComponent(plant)}` : ''}`);

export const createObservation = (obs) =>
  request('/observations', { method: 'POST', body: JSON.stringify(obs) });
