import { Application, DiscoveredApi } from '../types';
import { apiUrl } from '../utils/apiConfig';

// Matches API.md — "12. List Discovered Endpoints"
export interface DiscoveredEndpoint {
  id: string;
  endpoint: string;
  method: DiscoveredApi['method'];
  summary: string;
  description: string;
  tag: string;
  suggestedToolName: string;
  enabledForMcp: boolean;
  parametersCount: number;
  applicationId: string;
  applicationName: string;
  serverId: string;
  serverName: string;
}

export async function fetchDiscoveredEndpoints(): Promise<DiscoveredEndpoint[]> {
  const url = apiUrl('/api/api-discovery');
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(`Could not reach the API server at ${url}. Is it running?`);
  }
  if (!res.ok) {
    throw new Error(`List discovered endpoints failed (${res.status} ${res.statusText})`);
  }

  const body: { endpoints?: Partial<DiscoveredEndpoint>[] } = await res.json();
  return (body.endpoints ?? []).map((e) => ({
    id: String(e.id ?? ''),
    endpoint: e.endpoint ?? '',
    method: e.method ?? 'GET',
    summary: e.summary ?? '',
    description: e.description ?? '',
    tag: e.tag ?? '',
    suggestedToolName: e.suggestedToolName ?? '',
    enabledForMcp: e.enabledForMcp ?? false,
    parametersCount: e.parametersCount ?? 0,
    applicationId: String(e.applicationId ?? ''),
    applicationName: e.applicationName ?? '',
    serverId: e.serverId ?? '',
    serverName: e.serverName ?? '',
  }));
}

// /demo never calls the API: the same rows are built from the static applications.
export function endpointsFromApplications(applications: Application[]): DiscoveredEndpoint[] {
  return applications.flatMap((app) =>
    (app.apis ?? []).map((api) => ({
      id: `${app.id}-${api.id}`,
      endpoint: api.endpoint,
      method: api.method,
      summary: api.summary,
      description: api.description,
      tag: api.tag,
      suggestedToolName: api.suggestedToolName,
      enabledForMcp: api.enabledForMcp,
      parametersCount: api.parameters?.length ?? 0,
      applicationId: app.id,
      applicationName: app.name,
      serverId: app.mcpServerId ?? '',
      serverName: app.mcpServerName ?? '',
    }))
  );
}
