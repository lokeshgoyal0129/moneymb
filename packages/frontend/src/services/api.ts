import axios from 'axios';

const getBaseUrl = () => {
  const custom = (import.meta as any).env?.VITE_API_URL;
  if (!custom) return '/api/v1';
  let clean = custom.replace(/\/$/, '');
  if (!clean.endsWith('/api/v1') && !clean.endsWith('/v1') && !clean.endsWith('/api')) {
    clean = `${clean}/api/v1`;
  }
  return clean;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT and Idempotency key
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Generate unique idempotency key for financial mutations if not already supplied
  if (['post', 'put', 'patch', 'delete'].includes((config.method || '').toLowerCase())) {
    if (!config.headers['X-Idempotency-Key']) {
      config.headers['X-Idempotency-Key'] = `IDEM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
