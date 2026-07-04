const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000/api';
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveFileUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  return `${SERVER_ORIGIN}${path}`;
}
