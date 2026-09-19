import {
  ApiAuthConfig,
  ApiParameter,
  Application,
  ApplicationAiContext,
  ApplicationAiSummaryConfig,
  DiscoveredApi,
  McpServer,
  McpServerApplicationSummary,
  createDefaultAuthConfig,
} from '../types';
import { apiUrl } from '../utils/apiConfig';

// Matches API.md — "3. List MCP Servers"
// usedByApps / dependsOnServers are not implemented on the backend yet, so they
// are optional here and default to empty lists.

interface McpServerListItem extends Omit<McpServer, 'usedByApps' | 'dependsOnServers' | 'applicationId' | 'applicationName' | 'owner'> {
  usedByApps?: string[];
  dependsOnServers?: string[];
  application: McpServerApplicationSummary;
}

export async function fetchMcpServers(): Promise<McpServer[]> {
  const url = apiUrl('/api/mcp-servers');
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(`Could not reach the API server at ${url}. Is it running?`);
  }
  if (!res.ok) {
    throw new Error(`List MCP servers failed (${res.status} ${res.statusText})`);
  }

  const body: { servers?: McpServerListItem[] } = await res.json();
  return (body.servers ?? []).map(mapListItem);
}

function mapListItem({ application, usedByApps, dependsOnServers, ...server }: McpServerListItem): McpServer {
  return {
    ...server,
    applicationId: String(application.id),
    applicationName: application.name,
    owner: application.owner,
    usedByApps: usedByApps ?? [],
    dependsOnServers: dependsOnServers ?? [],
    application,
  };
}

// Matches API.md — "6. Set Catalog Visibility"
export async function setCatalogVisibility(
  serverId: string,
  isPublishedToCatalog: boolean
): Promise<{ id: string; isPublishedToCatalog: boolean }> {
  const url = apiUrl(`/api/mcp-servers/${encodeURIComponent(serverId)}/catalog-visibility`);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublishedToCatalog }),
    });
  } catch {
    throw new Error(`Could not reach the API server at ${url}. Is it running?`);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error || body?.detail || body?.message;
    throw new Error(typeof message === 'string' && message ? message : `Update catalog visibility failed (${res.status} ${res.statusText})`);
  }

  return res.json();
}

// Shared by the detail and update responses (API.md sections 4 and 5).
// Returns the application in the shape the detail popup already uses.

interface McpServerDetailResponse {
  server: Partial<McpServerListItem> & { id: string; name: string };
  application: Omit<Application, 'apis' | 'apiCount' | 'mcpServerId' | 'mcpServerName' | 'aiSummaryConfig'> & {
    aiSummaryConfig: ApplicationAiSummaryConfig | null;
  };
  apis?: (Omit<DiscoveredApi, 'configStatus' | 'parameters'> & { parameters?: ApiParameter[] })[];
}

async function errorMessage(res: Response, action: string): Promise<string> {
  const body = await res.json().catch(() => null);
  const message = body?.error || body?.detail || body?.message;
  return typeof message === 'string' && message ? message : `${action} failed (${res.status} ${res.statusText})`;
}

function mapDetail(body: McpServerDetailResponse, fallbackApis: DiscoveredApi[] = []): Application {
  const { server, application, apis } = body;

  const defaults = createDefaultAuthConfig(application.authConfig?.type ?? 'authblue');
  const authConfig = {
    ...defaults,
    ...application.authConfig,
    authBlue: { ...defaults.authBlue, ...application.authConfig?.authBlue },
    idaas: { ...defaults.idaas, ...application.authConfig?.idaas },
    oauth: { ...defaults.oauth, ...application.authConfig?.oauth },
  };

  const aiContext: ApplicationAiContext = {
    businessPurpose: '',
    businessDomain: '',
    keyUseCases: [],
    commonWorkflows: [],
    importantTerminology: [],
    intendedConsumers: [],
    usageGuidelines: '',
    restrictions: '',
    aiGuidance: '',
    ...application.aiContext,
  };

  const mappedApis: DiscoveredApi[] = apis
    ? apis.map((api) => ({
        ...api,
        parameters: api.parameters ?? [],
        configStatus: api.enabledForMcp ? 'configured' : 'pending',
      }))
    : fallbackApis;

  return {
    ...application,
    id: String(application.id),
    authConfig,
    aiContext,
    aiSummaryConfig: application.aiSummaryConfig ?? undefined,
    swaggerUrls: application.swaggerUrls ?? [],
    apis: mappedApis,
    apiCount: mappedApis.length,
    mcpToolsCount: application.mcpToolsCount ?? mappedApis.filter((a) => a.enabledForMcp).length,
    mcpServerId: server.id,
    mcpServerName: server.name,
  };
}

// Matches API.md — "4. Get MCP Server Detail"
export async function fetchMcpServerDetail(serverId: string): Promise<Application> {
  const url = apiUrl(`/api/mcp-servers/${encodeURIComponent(serverId)}`);
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(`Could not reach the API server at ${url}. Is it running?`);
  }
  if (!res.ok) throw new Error(await errorMessage(res, 'Load MCP server'));

  return mapDetail(await res.json());
}

// Matches API.md — "5. Update MCP Server"
// Send only the fields being changed.
export interface McpServerPatch {
  name?: string;
  description?: string;
  owner?: string;
  ownerEmail?: string;
  supportDL?: string;
  department?: string;
  status?: Application['status'];
  swaggerUrls?: string[];
  authConfig?: ApiAuthConfig;
  aiContext?: ApplicationAiContext;
  aiSummaryConfig?: ApplicationAiSummaryConfig;
}

export async function updateMcpServer(
  serverId: string,
  patch: McpServerPatch,
  currentApis: DiscoveredApi[]
): Promise<{ application: Application; server: McpServer }> {
  const url = apiUrl(`/api/mcp-servers/${encodeURIComponent(serverId)}`);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch {
    throw new Error(`Could not reach the API server at ${url}. Is it running?`);
  }
  if (!res.ok) throw new Error(await errorMessage(res, 'Update MCP server'));

  const body: McpServerDetailResponse = await res.json();
  const { id, publicId, name, appCode, owner, ownerEmail, department, isAiReady } = body.application;
  const summary: McpServerApplicationSummary = { id: String(id), publicId, name, appCode, owner, ownerEmail, department, isAiReady };

  return {
    // The response may leave out `apis`; keep the ones already on screen in that case.
    application: mapDetail(body, currentApis),
    server: mapListItem({ ...(body.server as McpServerListItem), application: body.server.application ?? summary }),
  };
}
