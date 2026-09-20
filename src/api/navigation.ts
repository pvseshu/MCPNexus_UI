import { apiUrl } from '../utils/apiConfig';

// Matches API.md — "7. Get Navigation Counts"
// Every key is optional: a missing key means "no server value", and the caller
// falls back to whatever it can count locally.
export interface NavigationCounts {
  mcpServers?: number;
  mcpTools?: number;
  apiDiscovery?: number;
  mcpCatalog?: number;
  pendingAccessRequests?: number;
}

const COUNT_KEYS: (keyof NavigationCounts)[] = [
  'mcpServers',
  'mcpTools',
  'apiDiscovery',
  'mcpCatalog',
  'pendingAccessRequests',
];

export async function fetchNavigationCounts(): Promise<NavigationCounts> {
  const res = await fetch(apiUrl('/api/navigation/counts'));
  if (!res.ok) {
    throw new Error(`Navigation counts failed (${res.status} ${res.statusText})`);
  }

  const body = await res.json();
  const counts: NavigationCounts = {};
  for (const key of COUNT_KEYS) {
    if (typeof body?.[key] === 'number') counts[key] = body[key];
  }
  return counts;
}
