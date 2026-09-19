// Base URL for the MCP Nexus backend (see API.md). Override per environment
// with VITE_API_BASE_URL (e.g. in a .env file) — everything else in the app
// builds its request URLs from this one constant so a single env var moves
// all API traffic to a new host.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8008').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
