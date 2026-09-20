import { AuditEvent } from '../types';
import { apiUrl } from '../utils/apiConfig';

// Matches API.md — "12. Get Dashboard Summary"
// Every block and every field is optional: the backend may not have knowledge or
// audit data yet, so anything missing is left undefined and the Dashboard falls
// back to what it can count locally.
export interface DashboardSummary {
  applications?: { total?: number; aiReady?: number };
  mcpServers?: { total?: number; healthy?: number; degraded?: number; offline?: number };
  mcpTools?: { total?: number; active?: number };
  pendingAccessRequests?: number;
  knowledge?: { sources?: number; indexedDocuments?: number };
  recentActivity?: AuditEvent[];
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

// Keeps only the numeric fields of a block; returns undefined when nothing usable is left.
function numericBlock<T extends Record<string, number | undefined>>(value: unknown, keys: (keyof T)[]): T | undefined {
  if (!isObject(value)) return undefined;
  const block: Record<string, number> = {};
  for (const key of keys) {
    const n = value[key as string];
    if (typeof n === 'number') block[key as string] = n;
  }
  return Object.keys(block).length > 0 ? (block as T) : undefined;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(apiUrl('/api/dashboard'));
  if (!res.ok) {
    throw new Error(`Dashboard summary failed (${res.status} ${res.statusText})`);
  }

  const body = await res.json();
  const summary: DashboardSummary = {
    applications: numericBlock(body?.applications, ['total', 'aiReady']),
    mcpServers: numericBlock(body?.mcpServers, ['total', 'healthy', 'degraded', 'offline']),
    mcpTools: numericBlock(body?.mcpTools, ['total', 'active']),
    knowledge: numericBlock(body?.knowledge, ['sources', 'indexedDocuments']),
  };
  if (typeof body?.pendingAccessRequests === 'number') summary.pendingAccessRequests = body.pendingAccessRequests;
  if (Array.isArray(body?.recentActivity)) {
    summary.recentActivity = body.recentActivity.map((e: AuditEvent) => ({
      ...e,
      targetResource: e.targetResource ?? '',
      actor: e.actor ?? '',
      details: e.details ?? '',
    }));
  }
  return summary;
}
