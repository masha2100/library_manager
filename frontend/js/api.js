// js/api.js  –  thin wrapper around fetch for the Librarium backend
const API_BASE = 'http://localhost:3001/api';

// ── token helpers ─────────────────────────────────────────────────────────
export function getToken()          { return localStorage.getItem('lib_token'); }
export function setToken(t)         { localStorage.setItem('lib_token', t); }
export function clearToken()        { localStorage.removeItem('lib_token'); localStorage.removeItem('lib_user'); }
export function getUser()           { return JSON.parse(localStorage.getItem('lib_user') || 'null'); }
export function setUser(u)          { localStorage.setItem('lib_user', JSON.stringify(u)); }

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const get    = (p)    => request('GET',    p);
const post   = (p, b) => request('POST',   p, b);
const put    = (p, b) => request('PUT',    p, b);
const del    = (p)    => request('DELETE', p);

// ── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  login:  (username, password) => post('/auth/login', { username, password }),
  logout: ()                   => post('/auth/logout'),
  me:     ()                   => get('/auth/me'),
};

// ── Books ─────────────────────────────────────────────────────────────────
export const books = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/books${qs ? '?' + qs : ''}`);
  },
  stats:  ()           => get('/books/stats'),
  get:    (id)         => get(`/books/${id}`),
  create: (data)       => post('/books', data),
  update: (id, data)   => put(`/books/${id}`, data),
  delete: (id)         => del(`/books/${id}`),
  exportUrl: (format, params = {}) => {
    const qs = new URLSearchParams({ format, ...params }).toString();
    return `${API_BASE}/books/export?${qs}`;
  },
};

// ── Authors ───────────────────────────────────────────────────────────────
export const authors = {
  list:   ()           => get('/authors'),
  get:    (id)         => get(`/authors/${id}`),
  create: (data)       => post('/authors', data),
  update: (id, data)   => put(`/authors/${id}`, data),
  delete: (id)         => del(`/authors/${id}`),
};
