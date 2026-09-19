import { McpTool } from '../types';
import { apiUrl } from '../utils/apiConfig';

// Matches API.md — "8. List MCP Tools"
// The list response leaves out the Configure / Test Tool fields (whenToUse, inputs,
// sample payloads, ...), so they default to empty here. Counts, readiness score and
// usage stats may be missing or null until the backend stores them.

interface McpToolListItem {
  id: string;
  name: string;
  displayName: string;
  description: string;
  sourceEndpoint: string;
  httpMethod: McpTool['httpMethod'];
  serverId: string;
  serverName: string;
  applicationId: string;
  applicationName: string;
  requiredPermission: string;
  status: McpTool['status'];
  isAiReady?: boolean;
  aiReadinessScore?: number | null;
  sampleInputsCount?: number | null;
  sampleOutputsCount?: number | null;
  lastUsed?: string | null;
  callCount?: number | null;
}

export async function fetchMcpTools(serverId?: string): Promise<McpTool[]> {
  const url = apiUrl(serverId ? `/api/mcp-tools?serverId=${encodeURIComponent(serverId)}` : '/api/mcp-tools');
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(`Could not reach the API server at ${url}. Is it running?`);
  }
  if (!res.ok) {
    throw new Error(`List MCP tools failed (${res.status} ${res.statusText})`);
  }

  const body: { tools?: McpToolListItem[] } = await res.json();
  return (body.tools ?? []).map(mapListItem);
}

// Matches API.md — "9. Run MCP Tool Test"
// Upstream failures (4xx/5xx, timeout, unreachable) still come back as 200 with
// success: false; only an invalid request throws.
export interface ToolExecutionResult {
  success: boolean;
  httpStatus: number | null;
  durationMs: number;
  request?: { method: string; url: string };
  response: unknown;
  error: string | null;
}

// A little above the server's 30s upstream limit.
const EXECUTE_TIMEOUT_MS = 35000;

export async function executeMcpTool(toolId: string, input: Record<string, unknown>): Promise<ToolExecutionResult> {
  const url = apiUrl(`/api/mcp-tools/${encodeURIComponent(toolId)}/execute`);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
      signal: AbortSignal.timeout(EXECUTE_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error('The test did not finish in time.');
    }
    throw new Error(`Could not reach the API server at ${url}. Is it running?`);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error || body?.detail || body?.message;
    throw new Error(typeof message === 'string' && message ? message : `Run tool test failed (${res.status} ${res.statusText})`);
  }

  return res.json();
}

function formatLastUsed(value?: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function mapListItem(item: McpToolListItem): McpTool {
  return {
    ...item,
    isAiReady: item.isAiReady ?? false,
    aiReadinessScore: item.aiReadinessScore ?? 0,
    lastUsed: formatLastUsed(item.lastUsed),
    callCount: item.callCount ?? 0,
    whenToUse: '',
    whenNotToUse: '',
    inputs: [],
    outputSchemaDescription: '',
    sampleInputs: [],
    sampleOutputs: [],
    sampleInputsCount: item.sampleInputsCount ?? 0,
    sampleOutputsCount: item.sampleOutputsCount ?? 0,
  };
}
